import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import "dotenv/config";

import { errorHandler, requestLogger } from "./middleware";
import { patientRoutes } from "./routes/patients";
import { appointmentRoutes } from "./routes/appointments";
import { googleCalendarRoutes } from "./routes/google-calendar";

const port = process.env.PORT || 3001;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
const isDev = process.env.NODE_ENV !== "production";

const app = new Elysia()
  // Global middleware
  .use(errorHandler)
  .use(isDev ? requestLogger : new Elysia())
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
          { name: "Google Calendar", description: "Google Calendar sync endpoints" },
        ],
      },
    })
  )
  // Health and info endpoints
  .get("/", () => ({
    message: "OdontoCRM API",
    version: "1.0.0",
    docs: "/swagger",
  }))
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  }))
  // API routes
  .use(patientRoutes)
  .use(appointmentRoutes)
  .use(googleCalendarRoutes)
  .listen(port);

console.log(`🦷 OdontoCRM API is running at ${app.server?.hostname}:${app.server?.port}`);
console.log(`📚 Swagger documentation available at http://localhost:${port}/swagger`);

export type App = typeof app;
