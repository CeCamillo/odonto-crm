import { z } from "zod";

const appointmentStatus = z.enum(["scheduled", "completed", "cancelled"]);

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  startTime: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid start time format",
  }),
  endTime: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid end time format",
  }),
  status: appointmentStatus.optional().default("scheduled"),
});

export const updateAppointmentSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID").optional(),
  title: z.string().min(2, "Title must be at least 2 characters").optional(),
  description: z.string().optional(),
  startTime: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid start time format",
    })
    .optional(),
  endTime: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid end time format",
    })
    .optional(),
  status: appointmentStatus.optional(),
});

export const appointmentQuerySchema = z.object({
  page: z.string().optional().default("1"),
  pageSize: z.string().optional().default("10"),
  patientId: z.string().uuid().optional(),
  status: appointmentStatus.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type AppointmentQueryInput = z.infer<typeof appointmentQuerySchema>;
