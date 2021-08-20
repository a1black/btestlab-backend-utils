// TypeScript Version: 4.3

interface BTLabUtils {
  errors: BTLabUtils.Errors;
}

declare namespace BTLabUtils {
  interface ValidationErrorOptions {
    [key: string]: any;
  }

  /** Base class for errors specific to the application. */
  class BaseError extends Error {
    /** Indicates if error message can be exposed to an user. */
    expose: boolean;
    /** HTTP status code. */
    status: number;
    /** HTTP status code. */
    statusCode: number;
  }

  /** Thrown if requested action is not allowed even with required privilages. */
  class OperationNotAllowedError extends BaseError {
    constructor(message?: string);
  }

  /** Thrown if document can't be found in the database. */
  class RecordNotFoundError extends BaseError {
    constructor(message?: string);
  }

  /** Thrown then runtime entity is undefined. */
  class RuntimeError extends BaseError {}

  /** Thrown if input data failed validation process. */
  class ValidationError extends BaseError {
    constructor(message: string, details?: string[][], options?: ValidationErrorOptions);
    constructor(message: string, options?: ValidationErrorOptions);
    /** List of errors where each item is `[error_key, error_message]`. */
    details: string[][] | undefined;
    /** Dictionary of values to inject into error messages. */
    options: ValidationErrorOptions | undefined;
  }

  interface Errors {
    BaseError: typeof BaseError;
    OperationNotAllowedError: typeof OperationNotAllowedError;
    RecordNotFoundError: typeof RecordNotFoundError;
    RuntimeError: typeof RuntimeError;
    ValidationError: typeof ValidationError;
  }
}

declare const utils: BTLabUtils;
export = utils;
