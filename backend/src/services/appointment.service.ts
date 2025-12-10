import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { db, appointments, patients, type Appointment, type NewAppointment } from "../db";

export type AppointmentWithPatient = Appointment & {
  patient: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
};

export class AppointmentService {
  async findAll(options: {
    page: number;
    pageSize: number;
    patientId?: string;
    status?: "scheduled" | "completed" | "cancelled";
    startDate?: string;
    endDate?: string;
  }): Promise<{
    data: AppointmentWithPatient[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const { page, pageSize, patientId, status, startDate, endDate } = options;
    const offset = (page - 1) * pageSize;

    // Build where conditions
    const conditions = [];
    if (patientId) {
      conditions.push(eq(appointments.patientId, patientId));
    }
    if (status) {
      conditions.push(eq(appointments.status, status));
    }
    if (startDate) {
      conditions.push(gte(appointments.startTime, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(appointments.endTime, new Date(endDate)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db
        .select({
          id: appointments.id,
          patientId: appointments.patientId,
          title: appointments.title,
          description: appointments.description,
          startTime: appointments.startTime,
          endTime: appointments.endTime,
          status: appointments.status,
          googleEventId: appointments.googleEventId,
          createdAt: appointments.createdAt,
          updatedAt: appointments.updatedAt,
          patient: {
            id: patients.id,
            name: patients.name,
            email: patients.email,
            phone: patients.phone,
          },
        })
        .from(appointments)
        .leftJoin(patients, eq(appointments.patientId, patients.id))
        .where(whereClause)
        .orderBy(desc(appointments.startTime))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(whereClause),
    ]);

    const total = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(total / pageSize);

    return {
      data: data as AppointmentWithPatient[],
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async findById(id: string): Promise<AppointmentWithPatient | null> {
    const result = await db
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        title: appointments.title,
        description: appointments.description,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        googleEventId: appointments.googleEventId,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        patient: {
          id: patients.id,
          name: patients.name,
          email: patients.email,
          phone: patients.phone,
        },
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .where(eq(appointments.id, id))
      .limit(1);

    return (result[0] as AppointmentWithPatient) || null;
  }

  async create(data: NewAppointment): Promise<Appointment> {
    const result = await db.insert(appointments).values(data).returning();
    return result[0];
  }

  async update(id: string, data: Partial<NewAppointment>): Promise<Appointment | null> {
    const result = await db
      .update(appointments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();

    return result[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(appointments).where(eq(appointments.id, id)).returning();
    return result.length > 0;
  }

  async checkConflict(
    startTime: Date,
    endTime: Date,
    excludeId?: string
  ): Promise<Appointment[]> {
    const conditions = [
      lte(appointments.startTime, endTime),
      gte(appointments.endTime, startTime),
      eq(appointments.status, "scheduled"),
    ];

    if (excludeId) {
      conditions.push(sql`${appointments.id} != ${excludeId}`);
    }

    const conflicts = await db
      .select()
      .from(appointments)
      .where(and(...conditions));

    return conflicts;
  }
}

export const appointmentService = new AppointmentService();
