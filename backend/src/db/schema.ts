import { pgTable, uuid, varchar, text, timestamp, date, pgEnum, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enum for appointment status
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "completed",
  "cancelled",
]);

// Patients table
export const patients = pgTable(
  "patients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phone: varchar("phone", { length: 50 }).notNull(),
    dateOfBirth: date("date_of_birth").notNull(),
    address: text("address"),
    medicalHistory: text("medical_history"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("patients_name_idx").on(table.name),
    index("patients_email_idx").on(table.email),
    index("patients_created_at_idx").on(table.createdAt),
  ]
);

// Appointments table
export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    status: appointmentStatusEnum("status").default("scheduled").notNull(),
    googleEventId: varchar("google_event_id", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("appointments_patient_id_idx").on(table.patientId),
    index("appointments_start_time_idx").on(table.startTime),
    index("appointments_status_idx").on(table.status),
    index("appointments_start_end_idx").on(table.startTime, table.endTime),
  ]
);

// Relations
export const patientsRelations = relations(patients, ({ many }) => ({
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
}));

// Types
export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
