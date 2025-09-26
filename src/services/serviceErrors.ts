/**
 * Custom error classes for the stock management application
 * These provide more specific error types for better error handling
 */

// Base class for application errors
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppError';
  }
}

// API related errors
export class ApiError extends AppError {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

// Network connectivity errors
export class NetworkError extends AppError {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Validation errors for data validation
export class ValidationError extends AppError {
  field?: string;
  
  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// Authentication errors
export class AuthError extends AppError {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// Not found errors
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

// Business logic errors
export class BusinessError extends AppError {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

// Storage-related errors
export class StorageError extends AppError {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

// Database errors
export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Error handler to process API response errors
 * @param response Fetch Response object
 * @param defaultMessage Default error message
 * @returns Promise that rejects with appropriate error
 */
export async function handleApiError(response: Response, defaultMessage: string = 'API request failed'): Promise<never> {
  let errorMessage = defaultMessage;
  let errorData: any = null;
  
  // Try to get error message from response
  try {
    const text = await response.text();
    if (text) {
      try {
        errorData = JSON.parse(text);
        errorMessage = errorData?.message || errorData?.error || defaultMessage;
      } catch {
        // Use the text as error message if it's not JSON
        errorMessage = text.length < 100 ? text : defaultMessage;
      }
    }
  } catch {
    // Ignore additional errors in error handling
  }
  
  // Handle different status codes with appropriate error types
  switch (response.status) {
    case 400:
      throw new ValidationError(errorMessage);
    case 401:
    case 403:
      throw new AuthError(errorMessage);
    case 404:
      throw new NotFoundError(errorMessage);
    case 0: // Network error - status 0 typically means no connection
      throw new NetworkError('Network connection issue. Please check your internet connection.');
    default:
      throw new ApiError(errorMessage, response.status);
  }
}

/**
 * Helper to check if an error is of a specific error type
 * @param error Error to check
 * @param errorType Error constructor to check against
 * @returns boolean indicating if error is of specified type
 */
export function isErrorType<T extends Error>(error: unknown, errorType: new (...args: any[]) => T): error is T {
  return error instanceof Error && error.name === errorType.name;
}
