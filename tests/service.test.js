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

  test('history() with created record only, expect short history', () => {
    const response = new ServerResponseBuilder()
      .history([
        {
          author: 'author',
          date: new Date(),
          diff: { name: 'name' },
          user: 'user'
        }
      ])
      .produce()

    expect(response.history).toEqual([
      {
        action: 'created',
        author: 'author',
        date: expect.any(Number),
        user: 'user'
      }
    ])
  })

  test('history(), expect `history` property', () => {
    const response = new ServerResponseBuilder()
      .history([
        {
          author: 'author',
          date: new Date(),
          diff: { name: 'name', deleted: false, login: null },
          user: 'user'
        },
        {
          date: new Date(),
          diff: { deleted: true }
        },
        {
          date: new Date(),
          diff: { name: null, login: 'login' },
          user: 'user'
        }
      ])
      .produce()

    expect(response.history).toEqual([
      {
        action: 'created',
        author: 'author',
        date: expect.any(Number),
        updates: { name: 'name', deleted: false },
        user: 'user'
      },
      {
        action: 'deleted',
        date: expect.any(Number)
      },
      {
        action: 'updated',
        date: expect.any(Number),
        deletions: ['name'],
        updates: { login: 'login' },
        user: 'user'
      }
    ])
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
