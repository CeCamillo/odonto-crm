import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import "dotenv/config";

import { patientRoutes } from "./routes/patients";
import { appointmentRoutes } from "./routes/appointments";

const port = process.env.PORT || 3001;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

const app = new Elysia()
  .use(
    cors({
      origin: frontendUrl,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true,
    })
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: "OdontoCRM API",
          version: "1.0.0",
          description: "API for dental practice management",
        },
        tags: [
          { name: "Patients", description: "Patient management endpoints" },
          { name: "Appointments", description: "Appointment scheduling endpoints" },
        ],
      },
    })
  )
  .get("/", () => ({
    message: "OdontoCRM API",
    version: "1.0.0",
    docs: "/swagger",
  }))
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  .use(patientRoutes)
  .use(appointmentRoutes)
  .listen(port);

console.log(`🦷 OdontoCRM API is running at ${app.server?.hostname}:${app.server?.port}`);
console.log(`📚 Swagger documentation available at http://localhost:${port}/swagger`);

export type App = typeof app;
