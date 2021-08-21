// TypeScript Version: 4.3

interface BTLabUtils {
  errors: {
    BaseError: typeof BTLabUtils.BaseError;
    OperationNotAllowedError: typeof BTLabUtils.OperationNotAllowedError;
    RecordNotFoundError: typeof BTLabUtils.RecordNotFoundError;
    RuntimeError: typeof BTLabUtils.RuntimeError;
    ValidationError: typeof BTLabUtils.ValidationError;
  };
  misc: {
    /**
     * Returns new object with entries that pass the test.
     * @param value Object to filter.
     * @param callbackFn Function to test each value in the object, if not provided function removes empty values from the object.
     */
    filterObject<T = {[key: string]: any}>(value: T, callbackFn?: (value: any) => boolean): T;
    /**
     * Returns `true` if `value` is nullish or empty.
     * @param value Value to check.
     */
    isEmpty(value: any): value is null;
    /**
     * Returns random hex encoded string.
     * @param length Length of generated string.
     */
    uid(length: number): string;
  };
  service: {
    ServiceResponseBuilder: typeof BTLabUtils.ServiceResponseBuilder;
  };
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

  class ServiceResponseBuilder<In = { [key: string]: any }, Out = { [key: string]: any }> {
    /** Sets list of action that can be performed on the response document. */
    allow(...actions: string[]): this;
    /** Sets document or list of documents returned by the server. */
    document(document: In | In[]): this;
    /**
     * Sets error messages occured during validation of user's input.
     * @param error Error message.
     * @param details List of errors where each item is `[error_key, error_message]`.
     */
    error(error: string, details?: string[][]): this;
    /**
     * Sets error messages occured during validation of user's input.
     * @param error Instance of validation error.
     */
    error(error: ValidationError | Error): this;
    /** Indicates that server failed to complete user's request. */
    fail(): this;
    /** Sets list of action that cannot be performed on the response document. */
    forbid(...actions: string[]): this;
    /** Sets response message. */
    message(message: string): this;
    /** Returns response object. */
    produce(): ServiceResponse<Out>;
    /** Indicates that server successfully completed user's request. */
    success(): this;
    /** Sets access token issued by the authorization server. */
    token(token: string): this;
  }

  interface ServiceResponse<Doc> {
    /** Access token. */
    accessToken?: string;
    /** List of permitted operations on the response document(s). */
    allowed?: string[];
    /** Data returned by services that operate on a single document. */
    doc?: Doc;
    /** Validation errors. */
    errors?: { [key: string]: any };
    /** List of documents. */
    list?: Array<{ actions?: string[], doc: Doc }>;
    /** Response message. */
    message?: string;
    /** Indicates whether request completed or failed. */
    ok?: boolean;
  }
}

declare const utils: BTLabUtils;
export = utils;
