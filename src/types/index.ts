// Patient types
export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  address: string;
  medicalHistory?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Appointment types
export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  patientId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  googleEventId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
