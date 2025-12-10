import { z } from "zod";

export const appointmentStatusSchema = z.enum(["scheduled", "completed", "cancelled"]);

export const createAppointmentSchema = z
  .object({
    patientId: z.string().uuid("Please select a patient"),
    title: z.string().min(2, "Title must be at least 2 characters"),
    description: z.string().optional(),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    status: appointmentStatusSchema.optional().default("scheduled"),
  })
  .refine(
    (data) => {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      return end > start;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export const updateAppointmentSchema = z
  .object({
    patientId: z.string().uuid("Please select a patient").optional(),
    title: z.string().min(2, "Title must be at least 2 characters").optional(),
    description: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    status: appointmentStatusSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        return end > start;
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export type CreateAppointmentFormData = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentFormData = z.infer<typeof updateAppointmentSchema>;
