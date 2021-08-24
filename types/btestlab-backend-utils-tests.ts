import mongodb = require('mongodb');

import utils = require('btestlab-backend-utils');

const {
  BaseError,
  OperationNotAllowedError,
  RecordNotFoundError,
  RuntimeError,
  ValidationError,
} = utils.errors;
const baseError = new BaseError('error');
baseError.expose = true;
baseError.status = 500;
baseError.statusCode = 500;
new OperationNotAllowedError('error');
new OperationNotAllowedError();
new RecordNotFoundError('error');
new RecordNotFoundError();
new RuntimeError('error');
const validationError = new ValidationError('error');
validationError.details = [['key', 'error'], ['key', 'error']];
validationError.options = { key: 'value' };
new ValidationError('error', [['key', 'error']], { key: 'value' });
new ValidationError('error', { key: 'value' });

const { filterObject, isEmpty, uid } = utils.misc;
filterObject({a: 1, b: 2}, (v, k) => v < 10 && k !== 'b').a = 2;
filterObject({a: 1, b: NaN}, isNaN).b = 2;
filterObject({a: null, b: 'value'}).b = 'new value';
isEmpty('');
uid(10);

const { ServiceResponseBuilder } = utils.service;
const response = new ServiceResponseBuilder()
  .allow('create', 'read', 'update', 'delete')
  .document(1)
  .document([1, 2])
  .error(new Error('error'))
  .error(new ValidationError('error'))
  .error('error')
  .error('error', [['key', 'message']])
  .fail()
  .forbid('create', 'read', 'update', 'delete')
  .history([
    {
      author: {
        firstname: 'name',
        lastname: 'name',
        middlename: 'name'
      },
      date: new Date(),
      diff: { deleted: true },
      user: 'id'
    }
  ])
  .message('message')
  .success()
  .token('access token')
  .produce();
response.accessToken = 'token';
response.allowed = ['create'];
response.doc = 'document 1';
response.errors = { key: 'message' };
response.history = [{ date: new Date(), diff: { deleted: false } }];
response.list = [
  { actions: ['update'], doc: 'document 1' },
  { doc: 'document 2', history: [] }
];
response.message = 'message';
response.ok = true;

const { AbstractCollectionWithHistory } = utils.db;
const collection = new AbstractCollectionWithHistory(new mongodb.MongoClient('connect').db());
collection.author({
  firstname: 'firstname',
  id: 'user id',
  lastname: 'lastname',
  middlename: 'middlename',
});
collection.collection().find();
collection.replaceDocument({_id: 1, name: 2}).then(console.log);
collection.updateDeletedField(1, true).then(console.log);
collection.updateDocument({_id: 1, name: null}).then(console.log);
throw collection.notFoundError();
