export class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = null) {
    return new ApiError(message, 400, 'VALIDATION_ERROR', details);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(message, 404, 'RESOURCE_NOT_FOUND');
  }

  static timeout(message = 'Upstream service request timed out') {
    return new ApiError(message, 504, 'UPSTREAM_TIMEOUT');
  }

  static tooManyRequests(message = 'Too many requests, please try again later') {
    return new ApiError(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}
