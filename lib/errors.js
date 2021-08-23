'use strict'

class BaseError extends Error {
  constructor(message) {
    super(message)
    this.name = this.constructor.name
    this.expose = false
    this.status = this.statusCode = 500
  }
}

class OperationNotAllowedError extends BaseError {
  constructor(message = 'Method Not Allowed') {
    super(message)
    this.expose = true
    this.status = this.statusCode = 405
  }
}

class RecordNotFoundError extends BaseError {
  constructor(message = 'Not Found') {
    super(message)
    this.expose = true
    this.status = this.statusCode = 404
  }
}

class RuntimeError extends BaseError {
  constructor(message) {
    super(message)
    this.expose = false
    this.status = this.statusCode = 500
  }
}

class ValidationError extends BaseError {
  constructor(message, details, options) {
    super(message)
    this.expose = true
    this.status = this.statusCode = 400
    if (!Array.isArray(details) && options === undefined) {
      options = details
      details = undefined
    }

    this.details =
      Array.isArray(details) && details.length ? details : undefined
    this.options = options ? Object.assign({}, options) : undefined
  }
}

module.exports = {
  BaseError,
  OperationNotAllowedError,
  RecordNotFoundError,
  RuntimeError,
  ValidationError
}
