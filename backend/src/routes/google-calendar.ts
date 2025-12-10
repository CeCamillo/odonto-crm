import { Elysia, t } from "elysia";
import { googleCalendarService } from "../services/google-calendar.service";

// Default user ID for single-user mode (in production, this would come from auth)
const DEFAULT_USER_ID = "default";

export const googleCalendarRoutes = new Elysia({ prefix: "/api/google-calendar" })
  // Check if Google Calendar is configured
  .get(
    "/status",
    () => {
      const isConfigured = googleCalendarService.isConfigured();
      const isConnected = googleCalendarService.hasValidTokens(DEFAULT_USER_ID);

      return {
        success: true,
        data: {
          configured: isConfigured,
          connected: isConnected,
        },
      };
    },
    {
      detail: {
        tags: ["Google Calendar"],
        summary: "Get Google Calendar connection status",
        description: "Check if Google Calendar is configured and connected",
      },
    }
  )

  // Get OAuth URL for authorization
  .get(
    "/auth-url",
    ({ set }) => {
      if (!googleCalendarService.isConfigured()) {
        set.status = 503;
        return {
          success: false,
          message: "Google Calendar is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
        };
      }

      const authUrl = googleCalendarService.getAuthUrl();

      return {
        success: true,
        data: {
          authUrl,
        },
      };
    },
    {
      detail: {
        tags: ["Google Calendar"],
        summary: "Get Google OAuth URL",
        description: "Get the URL to redirect users for Google authorization",
      },
    }
  )

  // OAuth callback handler
  .get(
    "/callback",
    async ({ query, set }) => {
      const { code, error } = query;

      if (error) {
        set.status = 400;
        return {
          success: false,
          message: `Google authorization failed: ${error}`,
        };
      }

      if (!code) {
        set.status = 400;
        return {
          success: false,
          message: "No authorization code provided",
        };
      }

      try {
        const tokens = await googleCalendarService.getTokensFromCode(code);
        googleCalendarService.storeTokens(DEFAULT_USER_ID, tokens);

        // In a real app, you'd redirect to the frontend with a success message
        return {
          success: true,
          message: "Google Calendar connected successfully",
          data: {
            connected: true,
          },
        };
      } catch (err) {
        console.error("Error exchanging code for tokens:", err);
        set.status = 500;
        return {
          success: false,
          message: "Failed to connect Google Calendar",
        };
      }
    },
    {
      query: t.Object({
        code: t.Optional(t.String()),
        error: t.Optional(t.String()),
        state: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Google Calendar"],
        summary: "OAuth callback",
        description: "Handle Google OAuth callback and store tokens",
      },
    }
  )

  // Disconnect Google Calendar
  .post(
    "/disconnect",
    () => {
      googleCalendarService.removeTokens(DEFAULT_USER_ID);

      return {
        success: true,
        message: "Google Calendar disconnected successfully",
      };
    },
    {
      detail: {
        tags: ["Google Calendar"],
        summary: "Disconnect Google Calendar",
        description: "Remove Google Calendar connection",
      },
    }
  )

  // Sync appointment to Google Calendar
  .post(
    "/sync/:appointmentId",
    async ({ params, body, set }) => {
      if (!googleCalendarService.hasValidTokens(DEFAULT_USER_ID)) {
        set.status = 401;
        return {
          success: false,
          message: "Google Calendar not connected",
        };
      }

      try {
        const eventId = await googleCalendarService.createEvent(DEFAULT_USER_ID, {
          summary: body.title,
          description: body.description,
          start: {
            dateTime: body.startTime,
            timeZone: body.timeZone || "UTC",
          },
          end: {
            dateTime: body.endTime,
            timeZone: body.timeZone || "UTC",
          },
          attendees: body.patientEmail
            ? [{ email: body.patientEmail, displayName: body.patientName }]
            : undefined,
        });

        return {
          success: true,
          data: {
            googleEventId: eventId,
          },
          message: "Appointment synced to Google Calendar",
        };
      } catch (err) {
        console.error("Error syncing to Google Calendar:", err);
        set.status = 500;
        return {
          success: false,
          message: "Failed to sync appointment to Google Calendar",
        };
      }
    },
    {
      params: t.Object({
        appointmentId: t.String(),
      }),
      body: t.Object({
        title: t.String(),
        description: t.Optional(t.String()),
        startTime: t.String(),
        endTime: t.String(),
        timeZone: t.Optional(t.String()),
        patientEmail: t.Optional(t.String()),
        patientName: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Google Calendar"],
        summary: "Sync appointment to Google Calendar",
        description: "Create a Google Calendar event for an appointment",
      },
    }
  )

  // Update synced event
  .put(
    "/sync/:eventId",
    async ({ params, body, set }) => {
      if (!googleCalendarService.hasValidTokens(DEFAULT_USER_ID)) {
        set.status = 401;
        return {
          success: false,
          message: "Google Calendar not connected",
        };
      }

      try {
        await googleCalendarService.updateEvent(DEFAULT_USER_ID, params.eventId, {
          summary: body.title,
          description: body.description,
          start: body.startTime
            ? {
                dateTime: body.startTime,
                timeZone: body.timeZone || "UTC",
              }
            : undefined,
          end: body.endTime
            ? {
                dateTime: body.endTime,
                timeZone: body.timeZone || "UTC",
              }
            : undefined,
        });

        return {
          success: true,
          message: "Google Calendar event updated",
        };
      } catch (err) {
        console.error("Error updating Google Calendar event:", err);
        set.status = 500;
        return {
          success: false,
          message: "Failed to update Google Calendar event",
        };
      }
    },
    {
      params: t.Object({
        eventId: t.String(),
      }),
      body: t.Object({
        title: t.Optional(t.String()),
        description: t.Optional(t.String()),
        startTime: t.Optional(t.String()),
        endTime: t.Optional(t.String()),
        timeZone: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Google Calendar"],
        summary: "Update Google Calendar event",
        description: "Update a synced Google Calendar event",
      },
    }
  )

  // Delete synced event
  .delete(
    "/sync/:eventId",
    async ({ params, set }) => {
      if (!googleCalendarService.hasValidTokens(DEFAULT_USER_ID)) {
        set.status = 401;
        return {
          success: false,
          message: "Google Calendar not connected",
        };
      }

      try {
        await googleCalendarService.deleteEvent(DEFAULT_USER_ID, params.eventId);

        return {
          success: true,
          message: "Google Calendar event deleted",
        };
      } catch (err) {
        console.error("Error deleting Google Calendar event:", err);
        set.status = 500;
        return {
          success: false,
          message: "Failed to delete Google Calendar event",
        };
      }
    },
    {
      params: t.Object({
        eventId: t.String(),
      }),
      detail: {
        tags: ["Google Calendar"],
        summary: "Delete Google Calendar event",
        description: "Delete a synced Google Calendar event",
      },
    }
  );
