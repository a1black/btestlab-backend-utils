'use strict'

const { RecordNotFoundError, RuntimeError } = require('./errors')
const { filterObject, isEmpty } = require('./functional')

const PipeHelpers = {
  arrayToObject(...entries) {
    return {
      $mergeObjects: entries.map(entry => ({ $arrayToObject: entry }))
    }
  },

  filter(expression, exclude) {
    return isEmpty(exclude)
      ? expression
      : {
          $filter: {
            input: expression,
            cond: Array.isArray(exclude)
              ? { $not: { $in: [{ $first: '$$this' }, exclude] } }
              : { $ne: [{ $first: '$$this' }, exclude] }
          }
        }
  },

  objectToArray(obj, replaceValue) {
    return {
      $map: {
        input: { $objectToArray: obj },
        in: ['$$this.k', replaceValue === undefined ? '$$this.v' : replaceValue]
      }
    }
  },

  push(arr, item) {
    return {
      $concatArrays: [{ $ifNull: [arr, []] }, [item]]
    }
  }
}

class AbstractCollectionWithHistory {
  constructor(db) {
    this._db = db
  }

  _makeHistoryDocument(diff) {
    return filterObject({
      author: this._author?.name,
      user: this._author?.id,
      date: '$$NOW',
      diff
    })
  }

  _serviceFields() {
    return ['_id', 'deleted', 'history']
  }

  author(author) {
    const name = filterObject({
      firstname: author.firstname,
      lastname: author.lastname,
      middlename: author.middlename
    })
    this._author = {
      id: isEmpty(author.id) ? null : author.id,
      name: isEmpty(name) ? null : name
    }

    return this
  }

  collection() {
    throw new Error(
      `${this.constructor.name} must implement abstract method 'collection'`
    )
  }

  notFoundError() {
    return new RecordNotFoundError()
  }

  async replaceDocument(newDocument) {
    const { _id, ...body } = newDocument
    if (isEmpty(_id)) {
      throw new RuntimeError('_id field cannot be empty')
    } else if (isEmpty(body)) {
      throw new RuntimeError('replacement document cannot be empty')
    }

    const deleted = {
      $setDifference: [
        PipeHelpers.filter(
          PipeHelpers.objectToArray('$$ROOT', null),
          this._serviceFields()
        ),
        Object.entries(body).map(([k]) => [k, null])
      ]
    }
    const updated = {
      $setDifference: [
        [...Object.entries(body)],
        PipeHelpers.objectToArray('$$ROOT')
      ]
    }
    // @ts-ignore
    const { matchedCount, upsertedCount } = await this.collection().updateOne(
      { _id },
      [
        {
          $set: {
            history: {
              $let: {
                vars: { deleted, updated },
                in: {
                  $cond: {
                    if: {
                      $or: [{ $size: '$$deleted' }, { $size: '$$updated' }]
                    },
                    then: PipeHelpers.push(
                      '$history',
                      this._makeHistoryDocument(
                        PipeHelpers.arrayToObject('$$deleted', '$$updated')
                      )
                    ),
                    else: '$history'
                  }
                }
              }
            }
          }
        },
        {
          $replaceWith: {
            $mergeObjects: [
              Object.fromEntries(
                this._serviceFields().map(field => [field, `$${field}`])
              ),
              body
            ]
          }
        }
      ],
      { upsert: true }
    )

    if (matchedCount + upsertedCount) {
      return true
    }

    throw new RuntimeError('Fail to write document to the database')
  }

  async updateDeletedField(id, state) {
    state = state === true
    // @ts-ignore
    const { value } = await this.collection().findOneAndUpdate(
      { _id: id },
      [
        {
          $set: {
            history: {
              $cond: {
                if: { $eq: [{ $ifNull: ['$deleted', false] }, state] },
                then: '$history',
                else: PipeHelpers.push(
                  '$history',
                  this._makeHistoryDocument({ deleted: state })
                )
              }
            }
          }
        },
        { $set: { deleted: state } }
      ],
      { upsert: false, projection: { _id: 1 } }
    )

    if (value) {
      return true
    }

    throw this.notFoundError()
  }

  async updateDocument(partialDocument) {
    const { _id, ...changes } = partialDocument
    if (isEmpty(_id)) {
      throw new RuntimeError('_id field cannot be empty')
    }

    const stages = []
    const setStage = filterObject(changes, v => v !== null)
    const unsetStage = filterObject(changes, v => v === null)
    if (!isEmpty(setStage)) {
      stages.push({ $set: setStage })
    }

    if (!isEmpty(unsetStage)) {
      stages.push({ $unset: [...Object.keys(unsetStage)] })
    }

    if (!stages.length) {
      throw new RuntimeError('update document cannot be empty')
    } else {
      stages.unshift({
        $set: {
          history: {
            $let: {
              vars: {
                deleted: {
                  $setIntersection: [
                    [...Object.entries(unsetStage)],
                    PipeHelpers.objectToArray('$$ROOT', null)
                  ]
                },
                updated: {
                  $setDifference: [
                    [...Object.entries(setStage)],
                    PipeHelpers.objectToArray('$$ROOT')
                  ]
                }
              },
              in: {
                $cond: {
                  if: {
                    $or: [{ $size: '$$deleted' }, { $size: '$$updated' }]
                  },
                  then: PipeHelpers.push(
                    '$history',
                    this._makeHistoryDocument(
                      PipeHelpers.arrayToObject('$$deleted', '$$updated')
                    )
                  ),
                  else: '$history'
                }
              }
            }
          }
        }
      })
    }
    // @ts-ignore
    const { matchedCount } = await this.collection().updateOne({ _id }, stages)

    if (matchedCount) {
      return true
    }

    throw this.notFoundError()
  }
}

module.exports = {
  AbstractCollectionWithHistory
}
