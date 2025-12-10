import { Elysia } from "elysia";

// Custom error classes
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public override message: string,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(404, `${resource} not found`, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Validation failed") {
    super(400, message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource conflict") {
    super(409, message, "CONFLICT");
    this.name = "ConflictError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(401, message, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(403, message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

// Error response type
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Helper to get error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Internal server error";
}

// Error handling middleware
export const errorHandler = new Elysia({ name: "error-handler" }).onError(
  ({ code, error, set }): ErrorResponse => {
    console.error(`[Error] ${code}:`, error);

    // Handle custom app errors
    if (error instanceof AppError) {
      set.status = error.statusCode;
      return {
        success: false,
        error: {
          code: error.code || String(code),
          message: error.message,
        },
      };
    }

    // Handle Elysia validation errors
    if (code === "VALIDATION") {
      set.status = 400;
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: getErrorMessage(error),
        },
      };
    }

    // Handle not found
    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Route not found",
        },
      };
    }

    // Handle parse errors
    if (code === "PARSE") {
      set.status = 400;
      return {
        success: false,
        error: {
          code: "PARSE_ERROR",
          message: "Failed to parse request body",
        },
      };
    }

    // Handle internal errors
    set.status = 500;
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          process.env.NODE_ENV === "production"
            ? "An unexpected error occurred"
            : getErrorMessage(error),
      },
    };
  }
);

// Request logging middleware
export const requestLogger = new Elysia({ name: "request-logger" })
  .onRequest(({ request }) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${request.method} ${request.url}`);
  })
  .onAfterResponse(({ request, set }) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${request.method} ${request.url} - ${set.status || 200}`);
  });
