import { Elysia, t } from "elysia";
import { patientService } from "../services/patient.service";
import {
  createPatientSchema,
  updatePatientSchema,
  type CreatePatientInput,
  type UpdatePatientInput,
} from "../schemas/patient";

export const patientRoutes = new Elysia({ prefix: "/api/patients" })
  // Get all patients with pagination
  .get(
    "/",
    async ({ query }) => {
      const page = parseInt(query.page || "1");
      const pageSize = parseInt(query.pageSize || "10");
      const search = query.search;

      const result = await patientService.findAll({ page, pageSize, search });

      return {
        success: true,
        ...result,
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        pageSize: t.Optional(t.String()),
        search: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Patients"],
        summary: "Get all patients",
        description: "Retrieve a paginated list of patients with optional search",
      },
    }
  )

  // Get single patient by ID
  .get(
    "/:id",
    async ({ params, set }) => {
      const patient = await patientService.findById(params.id);

      if (!patient) {
        set.status = 404;
        return {
          success: false,
          message: "Patient not found",
        };
      }

      return {
        success: true,
        data: patient,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Patients"],
        summary: "Get patient by ID",
        description: "Retrieve a single patient by their ID",
      },
    }
  )

  // Create new patient
  .post(
    "/",
    async ({ body, set }) => {
      // Validate input
      const validation = createPatientSchema.safeParse(body);
      if (!validation.success) {
        set.status = 400;
        return {
          success: false,
          message: "Validation error",
          errors: validation.error.issues,
        };
      }

      const data = validation.data as CreatePatientInput;

      // Check if email already exists
      const existingPatient = await patientService.findByEmail(data.email);
      if (existingPatient) {
        set.status = 409;
        return {
          success: false,
          message: "A patient with this email already exists",
        };
      }

      const patient = await patientService.create({
        name: data.name,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
        medicalHistory: data.medicalHistory,
      });

      set.status = 201;
      return {
        success: true,
        data: patient,
        message: "Patient created successfully",
      };
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
        phone: t.String(),
        dateOfBirth: t.String(),
        address: t.Optional(t.String()),
        medicalHistory: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Patients"],
        summary: "Create a new patient",
        description: "Create a new patient record",
      },
    }
  )

  // Update patient
  .put(
    "/:id",
    async ({ params, body, set }) => {
      // Validate input
      const validation = updatePatientSchema.safeParse(body);
      if (!validation.success) {
        set.status = 400;
        return {
          success: false,
          message: "Validation error",
          errors: validation.error.issues,
        };
      }

      const data = validation.data as UpdatePatientInput;

      // Check if patient exists
      const existingPatient = await patientService.findById(params.id);
      if (!existingPatient) {
        set.status = 404;
        return {
          success: false,
          message: "Patient not found",
        };
      }

      // If email is being updated, check for duplicates
      if (data.email && data.email !== existingPatient.email) {
        const emailExists = await patientService.findByEmail(data.email);
        if (emailExists) {
          set.status = 409;
          return {
            success: false,
            message: "A patient with this email already exists",
          };
        }
      }

      const patient = await patientService.update(params.id, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
        medicalHistory: data.medicalHistory,
      });

      return {
        success: true,
        data: patient,
        message: "Patient updated successfully",
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        email: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        dateOfBirth: t.Optional(t.String()),
        address: t.Optional(t.String()),
        medicalHistory: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Patients"],
        summary: "Update a patient",
        description: "Update an existing patient record",
      },
    }
  )

  // Delete patient
  .delete(
    "/:id",
    async ({ params, set }) => {
      const patient = await patientService.findById(params.id);
      if (!patient) {
        set.status = 404;
        return {
          success: false,
          message: "Patient not found",
        };
      }

      await patientService.delete(params.id);

      return {
        success: true,
        message: "Patient deleted successfully",
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Patients"],
        summary: "Delete a patient",
        description: "Delete a patient record and all associated appointments",
      },
    }
  );
