import { db, patients, appointments } from "./index";
import "dotenv/config";

const seedData = async () => {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(appointments);
  await db.delete(patients);

  // Create sample patients
  const samplePatients = [
    {
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "+1234567890",
      dateOfBirth: "1985-03-15",
      address: "123 Main St, City, State 12345",
      medicalHistory: "No known allergies. Previous dental work: root canal (2020)",
    },
    {
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "+1234567891",
      dateOfBirth: "1990-07-22",
      address: "456 Oak Ave, City, State 12345",
      medicalHistory: "Allergic to penicillin",
    },
    {
      name: "Michael Brown",
      email: "michael.brown@email.com",
      phone: "+1234567892",
      dateOfBirth: "1978-11-08",
      address: "789 Pine Rd, City, State 12345",
      medicalHistory: "Diabetic - Type 2. Taking metformin",
    },
    {
      name: "Emily Davis",
      email: "emily.davis@email.com",
      phone: "+1234567893",
      dateOfBirth: "1995-01-30",
      address: "321 Elm St, City, State 12345",
      medicalHistory: "No significant medical history",
    },
    {
      name: "Robert Wilson",
      email: "robert.wilson@email.com",
      phone: "+1234567894",
      dateOfBirth: "1968-09-12",
      address: "654 Maple Dr, City, State 12345",
      medicalHistory: "High blood pressure. Taking lisinopril",
    },
  ];

  const insertedPatients = await db.insert(patients).values(samplePatients).returning();

  console.log(`Created ${insertedPatients.length} patients`);

  // Create sample appointments
  const today = new Date();
  const sampleAppointments = [
    {
      patientId: insertedPatients[0].id,
      title: "Routine Checkup",
      description: "Regular 6-month dental checkup and cleaning",
      startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
      endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30),
      status: "scheduled" as const,
    },
    {
      patientId: insertedPatients[1].id,
      title: "Teeth Whitening",
      description: "Professional teeth whitening session",
      startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
      endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0),
      status: "scheduled" as const,
    },
    {
      patientId: insertedPatients[2].id,
      title: "Crown Fitting",
      description: "Fitting of dental crown on molar #30",
      startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
      endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0),
      status: "scheduled" as const,
    },
    {
      patientId: insertedPatients[3].id,
      title: "Filling",
      description: "Cavity filling - tooth #18",
      startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 9, 0),
      endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 9, 45),
      status: "scheduled" as const,
    },
    {
      patientId: insertedPatients[0].id,
      title: "Previous Checkup",
      description: "6-month routine checkup",
      startTime: new Date(today.getFullYear(), today.getMonth() - 6, today.getDate(), 9, 0),
      endTime: new Date(today.getFullYear(), today.getMonth() - 6, today.getDate(), 9, 30),
      status: "completed" as const,
    },
  ];

  const insertedAppointments = await db.insert(appointments).values(sampleAppointments).returning();

  console.log(`Created ${insertedAppointments.length} appointments`);
  console.log("Seeding completed!");

  process.exit(0);
};

seedData().catch((err) => {
  console.error("Seeding failed!", err);
  process.exit(1);
});
