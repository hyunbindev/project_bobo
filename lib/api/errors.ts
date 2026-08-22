export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly headers?: HeadersInit,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad request.") {
    super(400, "BAD_REQUEST", message);
    this.name = "BadRequestError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found.") {
    super(404, "NOT_FOUND", message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Resource already exists.") {
    super(409, "CONFLICT", message);
    this.name = "ConflictError";
  }
}
