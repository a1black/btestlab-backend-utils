'use strict'

const isPlainObject = require('lodash.isplainobject')
const objectSet = require('lodash.set')

const { ValidationError } = require('./errors')
const { filterObject, isEmpty } = require('./functional')

class ServerResponseBuilder {
  constructor() {
    this._allowed = new Set()
    this._forbidden = new Set()
    this._response = {}
  }

  allow(...actions) {
    actions.forEach(value => !isEmpty(value) && this._allowed.add(value))
    return this
  }

  document(document) {
    if (Array.isArray(document)) {
      this._response.list = document
    } else {
      this._response.doc = document
    }

    return this
  }

  error(error, details) {
    if (error instanceof Error) {
      details =
        error instanceof ValidationError && !isEmpty(error.details)
          ? error.details
          : undefined
      error = error.message
    }

    this.message(error)
    if (Array.isArray(details) && !isEmpty(details)) {
      this._response.errors = {}
      details.forEach(([key, message]) =>
        objectSet(this._response.errors, key, message)
      )
    }

    return this
  }

  fail() {
    this._response.ok = false
    return this
  }

  forbid(...actions) {
    actions.forEach(value => !isEmpty(value) && this._forbidden.add(value))
    return this
  }

  history(records) {
    const getAction = (value, index) =>
      index === 0
        ? 'created'
        : value.diff?.deleted === true
        ? 'deleted'
        : value.diff?.deleted !== undefined
        ? 'restored'
        : 'updated'

    const getDeletions = (value, index) =>
      index === 0
        ? null
        : Object.keys(
            filterObject(value.diff, (v, k) => v === null && k !== 'deleted')
          )
    const getUpdates = (value, index) =>
      index !== 0
        ? filterObject(value.diff, (v, k) => v !== null && k != 'deleted')
        : records.length === 1
        ? null
        : filterObject(value.diff, v => v !== null)

    if (Array.isArray(records) && records.length) {
      this._response.history = records.map((value, index) =>
        filterObject({
          action: getAction(value, index),
          author: isPlainObject(value.author)
            ? Object.assign({}, value.author)
            : value.author,
          date: value.date.getTime(),
          deletions: getDeletions(value, index),
          updates: getUpdates(value, index),
          user: value.user
        })
      )
    }

    return this
  }

  message(msg) {
    this._response.message = msg
    return this
  }

  produce() {
    for (const forbidden of [...this._forbidden]) {
      if (this._allowed.has(forbidden)) {
        this._allowed.delete(forbidden)
        this._forbidden.delete(forbidden)
      }
    }

    if (this._allowed.size) {
      this._response.allowed = [...this._allowed]
    }

    return this._response
  }

  success() {
    this._response.ok = true
    return this
  }

  token(token) {
    this._response.accessToken = token
    return this
  }
}

module.exports = {
  ServerResponseBuilder
}
