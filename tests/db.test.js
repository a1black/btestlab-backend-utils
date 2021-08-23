'use strict'

const { dbConnect } = require('./conftest')

const { AbstractCollectionWithHistory } = require('../lib/db')
const { RecordNotFoundError, RuntimeError } = require('../lib/errors')

describe('AbstractCollectionWithHistory', () => {
  class TestCollection extends AbstractCollectionWithHistory {
    /** @returns {import('mongodb').Collection} */
    collection() {
      return this._db.collection('history-test-collection')
    }
  }

  const author = {
    id: 'user',
    firstname: 'firstname',
    lastname: 'lastname'
  }
  const authorExpect = {
    author: {
      firstname: author.firstname,
      lastname: author.lastname
    },
    user: author.id,
    date: expect.any(Date)
  }
  /** @type {import('mongodb').MongoClient} */
  let client
  /** @type {import('mongodb').Db} */
  let db

  beforeAll(async () => {
    const connection = await dbConnect()
    client = connection.client
    db = connection.db
  })

  afterAll(async () => {
    await db.dropDatabase()
    await client.close(true)
  })

  beforeEach(async () => {
    await new TestCollection(db).collection().deleteMany({})
  })

  describe('replaceDocument', () => {
    const _id = 1
    const testDoc = { _id, required: 'required', optional: 'optional' }

    beforeEach(async () => {
      const collection = new TestCollection(db)
      await collection.collection().deleteMany({})
      // @ts-ignore
      await collection.collection().insertOne(testDoc)
    })

    test('_id is null or undefined, rejects RuntimeError', async () => {
      const collection = new TestCollection(db)
      await expect(
        collection.replaceDocument({ main: 'main' })
      ).rejects.toThrow(RuntimeError)
    })

    test('empty document body, rejects RuntimeError', async () => {
      const collection = new TestCollection(db)
      await expect(collection.replaceDocument({ _id })).rejects.toThrow(
        RuntimeError
      )
    })

    test('replace anonymously, expect true', async () => {
      const diff = { required: 'new required', optional: 'new optional' }
      const newDoc = { _id, ...diff }
      const collection = new TestCollection(db)
      await expect(collection.replaceDocument(newDoc)).resolves.toBe(true)
      const document = await collection.collection().findOne({ _id })
      expect(document).toMatchObject({
        ...newDoc,
        history: [{ date: expect.any(Date), diff }]
      })
    })

    test('replace non-existing document, expect insert document', async () => {
      const _id = 2
      const diff = { required: 'new required', optional: 'new optional' }
      const newDoc = { _id, ...diff }
      const collection = new TestCollection(db).author(author)
      await expect(collection.replaceDocument(newDoc)).resolves.toBe(true)
      const document = await collection.collection().findOne({ _id })
      expect(document).toMatchObject({
        ...newDoc,
        history: [expect.objectContaining({ ...authorExpect, diff })]
      })
    })

    test('add fields to existing document, expect true', async () => {
      const diff = { additional: 'additional', extra: 'extra' }
      const newDoc = { ...diff, ...testDoc }
      const collection = new TestCollection(db).author(author)
      await expect(collection.replaceDocument(newDoc)).resolves.toBe(true)
      const document = await collection.collection().findOne({ _id })
      expect(document).toMatchObject({
        ...newDoc,
        history: [expect.objectContaining({ ...authorExpect, diff })]
      })
    })

    test('unset field of existing document, expect true', async () => {
      const newDoc = { _id, required: 'required' }
      const collection = new TestCollection(db).author(author)
      await expect(collection.replaceDocument(newDoc)).resolves.toBe(true)
      const document = await collection.collection().findOne({ _id })
      expect(document).toMatchObject({
        ...newDoc,
        history: [
          expect.objectContaining({ ...authorExpect, diff: { optional: null } })
        ]
      })
      expect(document).not.toMatchObject({ optional: expect.anything() })
    })

    test('set deletion field, expect document marked as deleted', async () => {
      const newDoc = { deleted: true, ...testDoc }
      const collection = new TestCollection(db).author(author)
      await expect(collection.replaceDocument(newDoc)).resolves.toBe(true)
      const document = await collection.collection().findOne({ _id })
      expect(document).toMatchObject({
        ...newDoc,
        history: [
          expect.objectContaining({ ...authorExpect, diff: { deleted: true } })
        ]
      })
    })

    test('unset deletion field, expect document no longer deleted', async () => {
      const collection = new TestCollection(db).author(author)
      await expect(
        collection.replaceDocument({ deleted: true, ...testDoc })
      ).resolves.toBe(true)
      await expect(
        collection.replaceDocument({ deleted: false, ...testDoc })
      ).resolves.toBe(true)
      const document = await collection.collection().findOne({ _id })
      expect(document).toMatchObject({
        ...testDoc,
        deleted: false,
        history: [
          expect.objectContaining({ ...authorExpect, diff: { deleted: true } }),
          expect.objectContaining({ ...authorExpect, diff: { deleted: false } })
        ]
      })
    })

    test('replace deleted document, expect replacement be deleted', async () => {
      const diff = { required: 'new required', optional: 'new optional' }
      const newDoc = { _id, ...diff }
      const collection = new TestCollection(db).author(author)
      await expect(
        collection.replaceDocument({ deleted: true, ...testDoc })
      ).resolves.toBe(true)
      await expect(collection.replaceDocument(newDoc)).resolves.toBe(true)
      const document = await collection.collection().findOne({ _id })
      expect(document).toMatchObject({
        ...newDoc,
        deleted: true,
        history: [
          expect.objectContaining({ ...authorExpect, diff: { deleted: true } }),
          expect.objectContaining({ ...authorExpect, diff })
        ]
      })
    })

    test('replace with the same document, expect true', async () => {
      const collection = new TestCollection(db).author(author)
      await expect(collection.replaceDocument({ ...testDoc })).resolves.toBe(
        true
      )
      const document = await collection.collection().findOne({ _id })
      expect(document).toMatchObject(testDoc)
      expect(document).not.toMatchObject({ history: expect.anything() })
    })
  })

  describe('updateDeletedField', () => {
    const _id = 1
    const testDoc = { _id, value: 'test' }

    beforeEach(async () => {
      const collection = new TestCollection(db)
      await collection.collection().deleteMany({})
      // @ts-ignore
      await collection.collection().insertOne(testDoc)
    })

    test('delete non-existing document, rejects RecordNotFoundError', async () => {
      const collection = new TestCollection(db).author(author)
      await expect(() =>
        collection.updateDeletedField('unknown', true)
      ).rejects.toThrow(RecordNotFoundError)
    })

    test('delete anonymously, expect true', async () => {
      const collection = new TestCollection(db)
      await expect(collection.updateDeletedField(_id, true)).resolves.toBe(true)
      const document = await collection.collection().findOne({ _id })
      expect(document).toMatchObject({
        ...testDoc,
        deleted: true,
        history: [
          {
            date: expect.any(Date),
            diff: { deleted: true }
          }
        ]
      })
    })

    test('deletion state not changed, expect history unchanged', async () => {
      const collection = new TestCollection(db).author(author)
      await expect(collection.updateDeletedField(_id, false)).resolves.toBe(
        true
      )
      const document = await collection.collection().findOne({ _id })
      expect(document).toMatchObject({ deleted: false })
      expect(document).not.toMatchObject({ history: expect.anything() })
    })

    test('delete document, expect true', async () => {
      const collection = new TestCollection(db).author(author)
      await expect(collection.updateDeletedField(_id, true)).resolves.toBe(true)
      const document = await collection.collection().findOne({ _id })
      expect(document).toMatchObject({
        ...testDoc,
        deleted: true,
        history: [
          expect.objectContaining({
            ...authorExpect,
            diff: { deleted: true }
          })
        ]
      })
    })

    test('restore document, expect true', async () => {
      const collection = new TestCollection(db).author(author)
      await expect(collection.updateDeletedField(_id, true)).resolves.toBe(true)
      await expect(collection.updateDeletedField(_id, false)).resolves.toBe(
        true
      )
      const document = await collection.collection().findOne({ _id })
      expect(document).toMatchObject({
        ...testDoc,
        deleted: false,
        history: [
          expect.objectContaining({
            ...authorExpect,
            diff: { deleted: true }
          }),
          expect.objectContaining({
            ...authorExpect,
            diff: { deleted: false }
          })
        ]
      })
    })
  })

  describe('updateDocument', () => {
    const _id = 1
    const testDoc = {
      _id,
      main: 'main',
      secondary: 'secondary',
      optional: 'optional'
    }

    beforeEach(async () => {
      const collection = new TestCollection(db)
      await collection.collection().deleteMany({})
      // @ts-ignore
      await collection.collection().insertOne(testDoc)
    })

    test('_id is null or undefined, rejects RuntimeError', async () => {
      const collection = new TestCollection(db)
      await expect(
        collection.updateDocument({ main: 'new main' })
      ).rejects.toThrow(RuntimeError)
    })

    test('empty document body, rejects RuntimeError', async () => {
      const collection = new TestCollection(db)
      await expect(collection.updateDocument({ _id })).rejects.toThrow(
        RuntimeError
      )
    })

    test('update non-existing document, rejects RecordNotFoundError', async () => {
      const collection = new TestCollection(db).author(author)
      await expect(() =>
        collection.updateDocument({ _id: 'unknown', new: 'new' })
      ).rejects.toThrow(RecordNotFoundError)
    })

    test('adding fields, expect true', async () => {
      const set = { new: 'new', newer: 'newer' }
      const partial = { _id, ...set }
      const collection = new TestCollection(db).author(author)
      await expect(collection.updateDocument(partial)).resolves.toBe(true)
      const document = await collection.collection().findOne({ _id })
      expect(document).toMatchObject({
        ...testDoc,
        ...set,
        history: expect.arrayContaining([{ ...authorExpect, diff: set }])
      })
    })

    test('overwriting an existing fields, expect true', async () => {
      const set = { main: 'new main', secondary: 'new secondary' }
      const partial = { _id, ...set }
      const collection = new TestCollection(db).author(author)
      await expect(collection.updateDocument(partial)).resolves.toBe(true)
      const document = await collection.collection().findOne({ _id })
      expect(document).toMatchObject({
        _id,
        ...set,
        history: expect.arrayContaining([{ ...authorExpect, diff: set }])
      })
    })

    test('unseting an existing fields, expect true', async () => {
      const unset = { optional: null, secondary: null }
      const partial = { _id, ...unset }
      const collection = new TestCollection(db).author(author)
      await expect(collection.updateDocument(partial)).resolves.toBe(true)
      const document = await collection.collection().findOne({ _id })
      expect(document).toMatchObject({
        history: expect.arrayContaining([{ ...authorExpect, diff: unset }])
      })
      expect(document).not.toMatchObject({
        optional: expect.anything(),
        secondary: expect.anything()
      })
      expect(document).not.toMatchObject({ optional: null, secondary: null })
    })

    test('unseting non-existing fields, expect no changes', async () => {
      const unset = { nonexistin: null }
      const partial = { _id, ...unset }
      const collection = new TestCollection(db).author(author)
      await expect(collection.updateDocument(partial)).resolves.toBe(true)
      const document = await collection.collection().findOne({ _id })
      expect(document).toMatchObject(testDoc)
      expect(document).not.toMatchObject({ history: expect.anything() })
    })

    test('update anonymously, expect true', async () => {
      const set = { main: 'new main', new: 'new' }
      const unset = { optional: null }
      const collection = new TestCollection(db)
      await expect(
        collection.updateDocument({ _id, ...set, ...unset })
      ).resolves.toBe(true)
      const document = await collection.collection().findOne({ _id })
      expect(document).toMatchObject({
        ...set,
        history: expect.arrayContaining([
          { date: expect.any(Date), diff: { ...set, ...unset } }
        ])
      })
      expect(document).not.toMatchObject({ optional: expect.anything() })
    })
  })
})
