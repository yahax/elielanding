export class DomainError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code = "DOMAIN_ERROR", statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = "DomainError";
  }
}

export class DomainValidationError extends DomainError {
  constructor(message: string) {
    super(message, "DOMAIN_VALIDATION_ERROR", 400);
    this.name = "DomainValidationError";
  }
}

export class DomainNotFoundError extends DomainError {
  constructor(message: string) {
    super(message, "DOMAIN_NOT_FOUND", 404);
    this.name = "DomainNotFoundError";
  }
}

export class DomainConflictError extends DomainError {
  constructor(message: string) {
    super(message, "DOMAIN_CONFLICT", 409);
    this.name = "DomainConflictError";
  }
}
