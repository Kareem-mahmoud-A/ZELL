export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = "INTERNAL_ERROR"
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string = "Validation failed",
    public readonly errors?: Record<string, string[]>
  ) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized access") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource conflict") {
    super(message, 409, "CONFLICT");
  }
}
