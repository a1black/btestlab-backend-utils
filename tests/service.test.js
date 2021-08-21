'use strict'

const { ServerResponseBuilder } = require('../lib/service')
const { ValidationError } = require('../lib/errors')

describe('ServerResponseBuilder', () => {
  test('document() receives single document, expect `doc` property', () => {
    const document = 'document'
    const response = new ServerResponseBuilder().document(document).produce()
    expect(response).toEqual({ doc: document })
  })

  test('document() receives array of documents, expect `list` property', () => {
    const document = ['document1', 'document2', 'document3']
    const response = new ServerResponseBuilder().document(document).produce()
    expect(response).toEqual({ list: expect.arrayContaining(document) })
    expect(response.list.length).toEqual(3)
  })

  test('error() receives two arguments, expect `errors` property', () => {
    const response = new ServerResponseBuilder()
      .error('error message', [
        ['name.key1', 'message1'],
        ['name.key2', 'message2'],
        ['key1', 'message1'],
        ['key2', 'message2']
      ])
      .produce()
    expect(response).toEqual({
      message: 'error message',
      errors: {
        key1: 'message1',
        key2: 'message2',
        name: {
          key1: 'message1',
          key2: 'message2'
        }
      }
    })
  })

  test('error() receives error instance, expect `errors` property', () => {
    const response = new ServerResponseBuilder()
      .error(
        new ValidationError('error message', [
          ['name.key1', 'message1'],
          ['name.key2', 'message2'],
          ['key1', 'message1'],
          ['key2', 'message2']
        ])
      )
      .produce()
    expect(response).toEqual({
      message: 'error message',
      errors: {
        key1: 'message1',
        key2: 'message2',
        name: {
          key1: 'message1',
          key2: 'message2'
        }
      }
    })
  })

  test('forbidden(), expect modified `allowed` property', () => {
    const response = new ServerResponseBuilder()
      .forbid('update')
      .allow('create', 'read')
      .allow('update', 'delete')
      .produce()
    expect(response).toMatchObject({
      allowed: expect.arrayContaining(['create', 'read', 'delete'])
    })
    expect(response).toMatchObject({
      allowed: expect.not.arrayContaining(['update'])
    })
  })

  test('produce(), expect full response object', () => {
    expect(
      new ServerResponseBuilder()
        .allow('update')
        .allow('delete')
        .document('document')
        .error('error')
        .forbid('delete')
        .success()
        .token('token')
        .produce()
    ).toEqual({
      accessToken: 'token',
      allowed: ['update'],
      doc: 'document',
      message: 'error',
      ok: true
    })
  })
})
