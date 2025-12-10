// Patient types
export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string; // ISO date string from API
  address?: string | null;
  medicalHistory?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientInput {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address?: string;
  medicalHistory?: string;
}

export interface UpdatePatientInput {
  name?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  medicalHistory?: string;
}

// Appointment types
export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  patientId: string;
  title: string;
  description?: string | null;
  startTime: string; // ISO datetime string from API
  endTime: string;
  status: AppointmentStatus;
  googleEventId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentWithPatient extends Appointment {
  patient: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export interface CreateAppointmentInput {
  patientId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status?: AppointmentStatus;
}

export interface UpdateAppointmentInput {
  patientId?: string;
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  status?: AppointmentStatus;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ path: string[]; message: string }>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Query parameter types
export interface PatientQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface AppointmentQueryParams {
  page?: number;
  pageSize?: number;
  patientId?: string;
  status?: AppointmentStatus;
  startDate?: string;
  endDate?: string;
}
