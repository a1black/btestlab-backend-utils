'use strict'

const crypto = require('crypto')
const isPlainObject = require('lodash.isplainobject')

function filterObject(value, callbackFn) {
  const _filter = callbackFn ?? (value => !isEmpty(value))
  return Object.fromEntries(
    Object.entries(value).filter(([key, value]) => _filter(value, key))
  )
}

function isEmpty(value) {
  return (
    value === undefined ||
    value === null ||
    value.valueOf() === '' ||
    (typeof value === 'number' && isNaN(value)) ||
    (Array.isArray(value) && value.length === 0) ||
    ((value instanceof Map || value instanceof Set) && value.size === 0) ||
    (isPlainObject(value) && Object.keys(value).length === 0)
  )
}

function uid(length) {
  const makeHash = () =>
    crypto.createHash('sha256').update(crypto.randomBytes(256)).digest('hex')

  if (typeof length !== 'number') {
    throw new TypeError(`length expected 'number', got '${typeof length}'`)
  } else if (length < 1) {
    throw new Error(`length expected natural number, got ${length}`)
  }

  let charpool = makeHash()
  let uid = ''
  while (uid.length < length) {
    let remain = length - uid.length
    uid += charpool.slice(0, remain)
    charpool = charpool.slice(remain) || makeHash()
  }

  return uid
}

module.exports = {
  filterObject,
  isEmpty,
  uid
}
