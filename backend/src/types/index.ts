// Re-export database types
export type { Patient, NewPatient, Appointment, NewAppointment } from "../db/schema";

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Query parameter types
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PatientQueryParams extends PaginationParams {
  search?: string;
}

export interface AppointmentQueryParams extends PaginationParams {
  patientId?: string;
  status?: "scheduled" | "completed" | "cancelled";
  startDate?: string;
  endDate?: string;
}
