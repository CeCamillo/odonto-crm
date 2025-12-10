import { Elysia, t } from "elysia";
import { appointmentService } from "../services/appointment.service";
import { patientService } from "../services/patient.service";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  type CreateAppointmentInput,
  type UpdateAppointmentInput,
} from "../schemas/appointment";

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

      const appointment = await appointmentService.create({
        patientId: data.patientId,
        title: data.title,
        description: data.description,
        startTime,
        endTime,
        status: data.status || "scheduled",
      });

      set.status = 201;
      return {
        success: true,
        data: appointment,
        message: "Appointment created successfully",
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
        description: "Create a new appointment with conflict detection",
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

      const appointment = await appointmentService.update(params.id, {
        patientId: data.patientId,
        title: data.title,
        description: data.description,
        startTime,
        endTime,
        status: data.status,
      });

      return {
        success: true,
        data: appointment,
        message: "Appointment updated successfully",
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
        description: "Update an existing appointment with conflict detection",
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

      await appointmentService.delete(params.id);

      return {
        success: true,
        message: "Appointment deleted successfully",
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Appointments"],
        summary: "Delete an appointment",
        description: "Delete an appointment record",
      },
    }
  );
