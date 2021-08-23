'use strict'

const { ValidationError } = require('../lib/errors')

describe('ValidationError constructor', () => {
  const details = [
    ['key', 'value'],
    ['key', 'value']
  ]
  const options = { key: 'value' }

  test('constructor with three arguments', () => {
    const error = new ValidationError('error', details, options)
    expect(error).toMatchObject({
      details,
      expose: true,
      message: 'error',
      options,
      status: 400,
      statusCode: 400
    })
  })

  test('constructor with two arguments', () => {
    const error = new ValidationError('error', options)
    expect(error).toMatchObject({
      details: undefined,
      expose: true,
      message: 'error',
      options,
      status: 400,
      statusCode: 400
    })
  })

  test('constructor with single arguments', () => {
    const error = new ValidationError('error')
    expect(error).toMatchObject({
      details: undefined,
      expose: true,
      message: 'error',
      options: undefined,
      status: 400,
      statusCode: 400
    })
  })

  test('constructor `details` is not an array, expect undefined', () => {
    const error = new ValidationError('error', options, options)
    expect(error).toMatchObject({
      details: undefined,
      expose: true,
      message: 'error',
      options,
      status: 400,
      statusCode: 400
    })
  })
})
