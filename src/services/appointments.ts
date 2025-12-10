import { api } from "./api";
import type {
  AppointmentWithPatient,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  AppointmentQueryParams,
  ApiResponse,
  PaginatedResponse,
  Appointment,
} from "@/types";

export const appointmentsApi = {
  // Get all appointments with filtering
  getAll: async (
    params?: AppointmentQueryParams
  ): Promise<PaginatedResponse<AppointmentWithPatient>> => {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.pageSize) queryParams.pageSize = String(params.pageSize);
    if (params?.patientId) queryParams.patientId = params.patientId;
    if (params?.status) queryParams.status = params.status;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;

    return api.get<PaginatedResponse<AppointmentWithPatient>>("/api/appointments", queryParams);
  },

  // Get a single appointment by ID
  getById: async (id: string): Promise<ApiResponse<AppointmentWithPatient>> => {
    return api.get<ApiResponse<AppointmentWithPatient>>(`/api/appointments/${id}`);
  },

  // Create a new appointment
  create: async (data: CreateAppointmentInput): Promise<ApiResponse<Appointment>> => {
    return api.post<ApiResponse<Appointment>>("/api/appointments", data);
  },

  // Update an existing appointment
  update: async (id: string, data: UpdateAppointmentInput): Promise<ApiResponse<Appointment>> => {
    return api.put<ApiResponse<Appointment>>(`/api/appointments/${id}`, data);
  },

  // Delete an appointment
  delete: async (id: string): Promise<ApiResponse<null>> => {
    return api.delete<ApiResponse<null>>(`/api/appointments/${id}`);
  },
};
