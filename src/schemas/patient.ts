import { z } from "zod";

export const createPatientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone must be at least 10 characters"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: z.string().optional(),
  medicalHistory: z.string().optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

export type CreatePatientFormData = z.infer<typeof createPatientSchema>;
export type UpdatePatientFormData = z.infer<typeof updatePatientSchema>;
