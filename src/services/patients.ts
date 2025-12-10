import { api } from "./api";
import type {
  Patient,
  CreatePatientInput,
  UpdatePatientInput,
  PatientQueryParams,
  ApiResponse,
  PaginatedResponse,
} from "@/types";

export const patientsApi = {
  // Get all patients with pagination and search
  getAll: async (params?: PatientQueryParams): Promise<PaginatedResponse<Patient>> => {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.pageSize) queryParams.pageSize = String(params.pageSize);
    if (params?.search) queryParams.search = params.search;

    return api.get<PaginatedResponse<Patient>>("/api/patients", queryParams);
  },

  // Get a single patient by ID
  getById: async (id: string): Promise<ApiResponse<Patient>> => {
    return api.get<ApiResponse<Patient>>(`/api/patients/${id}`);
  },

  // Create a new patient
  create: async (data: CreatePatientInput): Promise<ApiResponse<Patient>> => {
    return api.post<ApiResponse<Patient>>("/api/patients", data);
  },

  // Update an existing patient
  update: async (id: string, data: UpdatePatientInput): Promise<ApiResponse<Patient>> => {
    return api.put<ApiResponse<Patient>>(`/api/patients/${id}`, data);
  },

  // Delete a patient
  delete: async (id: string): Promise<ApiResponse<null>> => {
    return api.delete<ApiResponse<null>>(`/api/patients/${id}`);
  },
};
