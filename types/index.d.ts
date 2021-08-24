// TypeScript Version: 4.3

import mongodb = require('mongodb');

interface BTLabUtils {
  db: {
    AbstractCollectionWithHistory: typeof BTLabUtils.AbstractCollectionWithHistory;
  };
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
    filterObject<T = {[key: string]: any}>(value: T, callbackFn?: (value: any, index?: any) => boolean): T;
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

  /** Class for assembling RESTFul service response object. */
  class ServiceResponseBuilder {
    /** Sets list of action that can be performed on the response document. */
    allow(...actions: string[]): this;
    /** Sets document or list of documents returned by the server. */
    document(document: any): this;
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
    /** Sets list of changes made to the returned document. */
    history(records?: HistoryDocument[]): this;
    /** Sets response message. */
    message(message: string): this;
    /** Returns response object. */
    produce(): ServiceResponse;
    /** Indicates that server successfully completed user's request. */
    success(): this;
    /** Sets access token issued by the authorization server. */
    token(token: string): this;
  }

  /** Base for implementing collection with versioning of documents. */
  class AbstractCollectionWithHistory<TSchema extends DocumentWithHistory = DocumentWithHistory> {
    /**
     * @param db Connection to the MongoDB instance.
     */
    constructor(db: mongodb.Db);
    /** Connection to the database. */
    protected _db: mongodb.Db;
    /**
     * Returns document containing modification applied to the parent document.
     * @param diff Partial document that contains changes to the parent document.
     */
    protected _makeHistoryDocument(diff: DocumentDiff): HistoryDocument;
    /** Returns list of fields that should not be recorded in the history. */
    protected _serviceFields(): string[];
    /**
     * @param author Information about an author of changes made to the document.
     */
    author(info: AuthorInfo): this;
    /** Returns a reference to a MongoDB Collection. */
    collection(): mongodb.Collection<TSchema>;
    /** Returns error instance. */
    notFoundError(): RecordNotFoundError;
    /**
     * Replaces existing document with `newDocument` or inserts new one, if document with provided ID not found.
     * @param newDocument Replacement document, must include `_id` field.
     * @throws {RuntimeError}
     */
    replaceDocument(newDocument: TSchema): Promise<boolean>;
    /**
     * Updates deletion flag on existing document.
     * @param id Unique identifier.
     * @param state Set `true` to flag selected document as deleted.
     * @throws {RecordNotFoundError}
     */
    updateDeletedField(id: any, state: boolean): Promise<boolean>;
    /**
     * Updates existing document using values in the `updateData`.
     * @param partialDocument Partial document that contains new values for provided fields, or `null` for fields that need to be deleted.
     * @throws {RecordNotFoundError}
     * @throws {RuntimeError}
     */
    updateDocument(partialDocument: PartialDocument): Promise<boolean>;
  }

  /** Information about an author of changes made to the document. */
  interface AuthorInfo extends Fullname {
    id: string;
  }

  /** Difference between two documents. */
  interface DocumentDiff {
    [key: string]: any;
  }

  /** Base interface for implementing document class. */
  interface DocumentWithHistory extends mongodb.Document {
    /** Primary key. */
    _id: any;
    /** Deletion flag. */
    deleted?: boolean;
    /** List of modification made to the document. */
    history?: HistoryDocument[];
  }

  /** Name components. */
  interface Fullname {
    firstname: string;
    lastname: string;
    middlename?: string;
  }

  /** Schema of document for story update history of parent document. */
  interface HistoryDocument {
    author?: Fullname;
    date: Date;
    diff: DocumentDiff;
    user?: string;
  }

  /** Partial document. */
  interface PartialDocument extends mongodb.Document {
    [key: string]: any;
  }

  /** Response object returned by the RESTFul service. */
  interface ServiceResponse {
    /** Access token. */
    accessToken?: string;
    /** List of permitted operations on the response document(s). */
    allowed?: string[];
    /** Data returned by services that operate on a single document. */
    doc?: any;
    /** Validation errors. */
    errors?: { [key: string]: any };
    /** Document update history. */
    history?: any[];
    /** List of documents. */
    list?: any[];
    /** Response message. */
    message?: string;
    /** Indicates whether request completed or failed. */
    ok?: boolean;
  }

  /** Additional data supplied to a validation error. */
  interface ValidationErrorOptions {
    [key: string]: any;
  }
}

declare global {
  namespace mongodb {
    interface DocumentWithHistory extends BTLabUtils.DocumentWithHistory {}
    interface PartialDocument extends BTLabUtils.PartialDocument {}
  }
}

declare const utils: BTLabUtils;
export = utils;
