import { Elysia, t } from "elysia";
import { appointmentService } from "../services/appointment.service";
import { patientService } from "../services/patient.service";
import { googleCalendarService } from "../services/google-calendar.service";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  type CreateAppointmentInput,
  type UpdateAppointmentInput,
} from "../schemas/appointment";

// Default user ID for single-user mode
const DEFAULT_USER_ID = "default";

// Helper to sync appointment to Google Calendar
async function syncToGoogleCalendar(
  appointment: { id: string; title: string; description?: string | null; startTime: Date; endTime: Date },
  patient: { name: string; email: string }
): Promise<string | null> {
  if (!googleCalendarService.hasValidTokens(DEFAULT_USER_ID)) {
    return null;
  }

  try {
    const eventId = await googleCalendarService.createEvent(DEFAULT_USER_ID, {
      summary: `${appointment.title} - ${patient.name}`,
      description: appointment.description || undefined,
      start: {
        dateTime: appointment.startTime.toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: appointment.endTime.toISOString(),
        timeZone: "UTC",
      },
      attendees: [{ email: patient.email, displayName: patient.name }],
    });
    return eventId;
  } catch (error) {
    console.error("Failed to sync to Google Calendar:", error);
    return null;
  }
}

export const appointmentRoutes = new Elysia({ prefix: "/api/appointments" })
  // Get all appointments with filtering
  .get(
    "/",
    async ({ query }) => {
      const page = parseInt(query.page || "1");
      const pageSize = parseInt(query.pageSize || "10");
      const { patientId, status, startDate, endDate } = query;

      const result = await appointmentService.findAll({
        page,
        pageSize,
        patientId,
        status: status as "scheduled" | "completed" | "cancelled" | undefined,
        startDate,
        endDate,
      });

      return {
        success: true,
        ...result,
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        pageSize: t.Optional(t.String()),
        patientId: t.Optional(t.String()),
        status: t.Optional(t.String()),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Appointments"],
        summary: "Get all appointments",
        description: "Retrieve a paginated list of appointments with optional filters",
      },
    }
  )

  // Get single appointment by ID
  .get(
    "/:id",
    async ({ params, set }) => {
      const appointment = await appointmentService.findById(params.id);

      if (!appointment) {
        set.status = 404;
        return {
          success: false,
          message: "Appointment not found",
        };
      }

      return {
        success: true,
        data: appointment,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Appointments"],
        summary: "Get appointment by ID",
        description: "Retrieve a single appointment by its ID",
      },
    }
  )

  // Create new appointment
  .post(
    "/",
    async ({ body, set }) => {
      // Validate input
      const validation = createAppointmentSchema.safeParse(body);
      if (!validation.success) {
        set.status = 400;
        return {
          success: false,
          message: "Validation error",
          errors: validation.error.issues,
        };
      }

      const data = validation.data as CreateAppointmentInput;

      // Check if patient exists
      const patient = await patientService.findById(data.patientId);
      if (!patient) {
        set.status = 404;
        return {
          success: false,
          message: "Patient not found",
        };
      }

      // Validate time range
      const startTime = new Date(data.startTime);
      const endTime = new Date(data.endTime);

      if (endTime <= startTime) {
        set.status = 400;
        return {
          success: false,
          message: "End time must be after start time",
        };
      }

      // Check for conflicts
      const conflicts = await appointmentService.checkConflict(startTime, endTime);
      if (conflicts.length > 0) {
        set.status = 409;
        return {
          success: false,
          message: "Time slot conflicts with existing appointment(s)",
          conflicts: conflicts.map((c) => ({
            id: c.id,
            title: c.title,
            startTime: c.startTime,
            endTime: c.endTime,
          })),
        };
      }

      // Create appointment
      let appointment = await appointmentService.create({
        patientId: data.patientId,
        title: data.title,
        description: data.description,
        startTime,
        endTime,
        status: data.status || "scheduled",
      });

      // Sync to Google Calendar if connected
      const googleEventId = await syncToGoogleCalendar(
        { ...appointment, startTime, endTime },
        patient
      );

      // Update appointment with Google Event ID if synced
      if (googleEventId) {
        appointment = (await appointmentService.update(appointment.id, {
          googleEventId,
        }))!;
      }

      set.status = 201;
      return {
        success: true,
        data: appointment,
        message: "Appointment created successfully",
        googleSynced: !!googleEventId,
      };
    },
    {
      body: t.Object({
        patientId: t.String(),
        title: t.String(),
        description: t.Optional(t.String()),
        startTime: t.String(),
        endTime: t.String(),
        status: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Appointments"],
        summary: "Create a new appointment",
        description: "Create a new appointment with conflict detection and optional Google Calendar sync",
      },
    }
  )

  // Update appointment
  .put(
    "/:id",
    async ({ params, body, set }) => {
      // Validate input
      const validation = updateAppointmentSchema.safeParse(body);
      if (!validation.success) {
        set.status = 400;
        return {
          success: false,
          message: "Validation error",
          errors: validation.error.issues,
        };
      }

      const data = validation.data as UpdateAppointmentInput;

      // Check if appointment exists
      const existingAppointment = await appointmentService.findById(params.id);
      if (!existingAppointment) {
        set.status = 404;
        return {
          success: false,
          message: "Appointment not found",
        };
      }

      // If patient is being updated, check if patient exists
      if (data.patientId) {
        const patient = await patientService.findById(data.patientId);
        if (!patient) {
          set.status = 404;
          return {
            success: false,
            message: "Patient not found",
          };
        }
      }

      // If time is being updated, validate and check conflicts
      let startTime = data.startTime ? new Date(data.startTime) : undefined;
      let endTime = data.endTime ? new Date(data.endTime) : undefined;

      if (startTime || endTime) {
        const finalStartTime = startTime || existingAppointment.startTime;
        const finalEndTime = endTime || existingAppointment.endTime;

        if (finalEndTime <= finalStartTime) {
          set.status = 400;
          return {
            success: false,
            message: "End time must be after start time",
          };
        }

        // Only check conflicts if the appointment is scheduled
        if (existingAppointment.status === "scheduled" || data.status === "scheduled") {
          const conflicts = await appointmentService.checkConflict(
            finalStartTime,
            finalEndTime,
            params.id
          );
          if (conflicts.length > 0) {
            set.status = 409;
            return {
              success: false,
              message: "Time slot conflicts with existing appointment(s)",
              conflicts: conflicts.map((c) => ({
                id: c.id,
                title: c.title,
                startTime: c.startTime,
                endTime: c.endTime,
              })),
            };
          }
        }
      }

      // Update appointment
      const appointment = await appointmentService.update(params.id, {
        patientId: data.patientId,
        title: data.title,
        description: data.description,
        startTime,
        endTime,
        status: data.status,
      });

      // Sync update to Google Calendar if connected and has event ID
      let googleSynced = false;
      if (
        existingAppointment.googleEventId &&
        googleCalendarService.hasValidTokens(DEFAULT_USER_ID)
      ) {
        try {
          await googleCalendarService.updateEvent(
            DEFAULT_USER_ID,
            existingAppointment.googleEventId,
            {
              summary: data.title
                ? `${data.title} - ${existingAppointment.patient.name}`
                : undefined,
              description: data.description,
              start: startTime
                ? { dateTime: startTime.toISOString(), timeZone: "UTC" }
                : undefined,
              end: endTime
                ? { dateTime: endTime.toISOString(), timeZone: "UTC" }
                : undefined,
            }
          );
          googleSynced = true;
        } catch (error) {
          console.error("Failed to sync update to Google Calendar:", error);
        }
      }

      return {
        success: true,
        data: appointment,
        message: "Appointment updated successfully",
        googleSynced,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        patientId: t.Optional(t.String()),
        title: t.Optional(t.String()),
        description: t.Optional(t.String()),
        startTime: t.Optional(t.String()),
        endTime: t.Optional(t.String()),
        status: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Appointments"],
        summary: "Update an appointment",
        description: "Update an existing appointment with conflict detection and Google Calendar sync",
      },
    }
  )

  // Delete appointment
  .delete(
    "/:id",
    async ({ params, set }) => {
      const appointment = await appointmentService.findById(params.id);
      if (!appointment) {
        set.status = 404;
        return {
          success: false,
          message: "Appointment not found",
        };
      }

      // Delete from Google Calendar if synced
      let googleSynced = false;
      if (
        appointment.googleEventId &&
        googleCalendarService.hasValidTokens(DEFAULT_USER_ID)
      ) {
        try {
          await googleCalendarService.deleteEvent(DEFAULT_USER_ID, appointment.googleEventId);
          googleSynced = true;
        } catch (error) {
          console.error("Failed to delete from Google Calendar:", error);
        }
      }

      await appointmentService.delete(params.id);

      return {
        success: true,
        message: "Appointment deleted successfully",
        googleSynced,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Appointments"],
        summary: "Delete an appointment",
        description: "Delete an appointment record and remove from Google Calendar if synced",
      },
    }
  );
