import { google, calendar_v3 } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

// Types for Google Calendar events
export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
}

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

// Token storage (in production, this should be stored in a database)
interface TokenStore {
  [userId: string]: {
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
  };
}

const tokenStore: TokenStore = {};

export class GoogleCalendarService {
  private config: GoogleCalendarConfig;
  private oauth2Client: OAuth2Client;

  constructor() {
    this.config = {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3001/api/auth/google/callback",
    };

    this.oauth2Client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    );
  }

  // Check if Google Calendar is configured
  isConfigured(): boolean {
    return !!(this.config.clientId && this.config.clientSecret);
  }

  // Generate OAuth URL for user authorization
  getAuthUrl(state?: string): string {
    const scopes = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      state: state,
      prompt: "consent", // Force consent to get refresh token
    });
  }

  // Exchange authorization code for tokens
  async getTokensFromCode(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
  }> {
    const { tokens } = await this.oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error("Failed to get tokens from Google");
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date || Date.now() + 3600000,
    };
  }

  // Store tokens for a user (in production, store in database)
  storeTokens(
    userId: string,
    tokens: { accessToken: string; refreshToken: string; expiryDate: number }
  ): void {
    tokenStore[userId] = tokens;
  }

  // Get tokens for a user
  getStoredTokens(userId: string): { accessToken: string; refreshToken: string; expiryDate: number } | null {
    return tokenStore[userId] || null;
  }

  // Remove tokens for a user
  removeTokens(userId: string): void {
    delete tokenStore[userId];
  }

  // Check if user has valid tokens
  hasValidTokens(userId: string): boolean {
    const tokens = this.getStoredTokens(userId);
    if (!tokens) return false;
    // Check if token is expired (with 5 minute buffer)
    return tokens.expiryDate > Date.now() + 300000;
  }

  // Get authenticated calendar client for a user
  private async getCalendarClient(userId: string): Promise<calendar_v3.Calendar> {
    const tokens = this.getStoredTokens(userId);
    if (!tokens) {
      throw new Error("User not authenticated with Google Calendar");
    }

    this.oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expiry_date: tokens.expiryDate,
    });

    // Handle token refresh
    this.oauth2Client.on("tokens", (newTokens) => {
      if (newTokens.access_token) {
        this.storeTokens(userId, {
          accessToken: newTokens.access_token,
          refreshToken: tokens.refreshToken,
          expiryDate: newTokens.expiry_date || Date.now() + 3600000,
        });
      }
    });

    return google.calendar({ version: "v3", auth: this.oauth2Client });
  }

  // Create a calendar event
  async createEvent(
    userId: string,
    event: CalendarEvent,
    calendarId: string = "primary"
  ): Promise<string | null> {
    try {
      const calendar = await this.getCalendarClient(userId);

      const response = await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: event.summary,
          description: event.description,
          start: event.start,
          end: event.end,
          attendees: event.attendees,
        },
      });

      return response.data.id || null;
    } catch (error) {
      console.error("Error creating Google Calendar event:", error);
      throw error;
    }
  }

  // Update a calendar event
  async updateEvent(
    userId: string,
    eventId: string,
    event: Partial<CalendarEvent>,
    calendarId: string = "primary"
  ): Promise<boolean> {
    try {
      const calendar = await this.getCalendarClient(userId);

      await calendar.events.patch({
        calendarId,
        eventId,
        requestBody: {
          summary: event.summary,
          description: event.description,
          start: event.start,
          end: event.end,
          attendees: event.attendees,
        },
      });

      return true;
    } catch (error) {
      console.error("Error updating Google Calendar event:", error);
      throw error;
    }
  }

  // Delete a calendar event
  async deleteEvent(
    userId: string,
    eventId: string,
    calendarId: string = "primary"
  ): Promise<boolean> {
    try {
      const calendar = await this.getCalendarClient(userId);

      await calendar.events.delete({
        calendarId,
        eventId,
      });

      return true;
    } catch (error) {
      console.error("Error deleting Google Calendar event:", error);
      throw error;
    }
  }

  // Get a calendar event
  async getEvent(
    userId: string,
    eventId: string,
    calendarId: string = "primary"
  ): Promise<calendar_v3.Schema$Event | null> {
    try {
      const calendar = await this.getCalendarClient(userId);

      const response = await calendar.events.get({
        calendarId,
        eventId,
      });

      return response.data;
    } catch (error) {
      console.error("Error getting Google Calendar event:", error);
      return null;
    }
  }

  // List calendar events
  async listEvents(
    userId: string,
    options: {
      calendarId?: string;
      timeMin?: string;
      timeMax?: string;
      maxResults?: number;
    } = {}
  ): Promise<calendar_v3.Schema$Event[]> {
    try {
      const calendar = await this.getCalendarClient(userId);

      const response = await calendar.events.list({
        calendarId: options.calendarId || "primary",
        timeMin: options.timeMin,
        timeMax: options.timeMax,
        maxResults: options.maxResults || 100,
        singleEvents: true,
        orderBy: "startTime",
      });

      return response.data.items || [];
    } catch (error) {
      console.error("Error listing Google Calendar events:", error);
      return [];
    }
  }
}

// Export singleton instance
export const googleCalendarService = new GoogleCalendarService();
