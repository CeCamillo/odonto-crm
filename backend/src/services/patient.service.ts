import { eq, ilike, or, sql, desc } from "drizzle-orm";
import { db, patients, type Patient, type NewPatient } from "../db";

export class PatientService {
  async findAll(options: {
    page: number;
    pageSize: number;
    search?: string;
  }): Promise<{ data: Patient[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const { page, pageSize, search } = options;
    const offset = (page - 1) * pageSize;

    let whereClause = undefined;
    if (search) {
      whereClause = or(
        ilike(patients.name, `%${search}%`),
        ilike(patients.email, `%${search}%`),
        ilike(patients.phone, `%${search}%`)
      );
    }

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(patients)
        .where(whereClause)
        .orderBy(desc(patients.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(patients)
        .where(whereClause),
    ]);

    const total = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(total / pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async findById(id: string): Promise<Patient | null> {
    const result = await db
      .select()
      .from(patients)
      .where(eq(patients.id, id))
      .limit(1);

    return result[0] || null;
  }

  async findByEmail(email: string): Promise<Patient | null> {
    const result = await db
      .select()
      .from(patients)
      .where(eq(patients.email, email))
      .limit(1);

    return result[0] || null;
  }

  async create(data: NewPatient): Promise<Patient> {
    const result = await db.insert(patients).values(data).returning();
    return result[0];
  }

  async update(id: string, data: Partial<NewPatient>): Promise<Patient | null> {
    const result = await db
      .update(patients)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();

    return result[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(patients).where(eq(patients.id, id)).returning();
    return result.length > 0;
  }
}

export const patientService = new PatientService();
