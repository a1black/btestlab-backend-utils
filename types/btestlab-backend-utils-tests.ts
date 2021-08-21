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
new ValidationError('error', [['key', 'error']], { key: 'value' });
new ValidationError('error', { key: 'value' });
const validationError = new ValidationError('error');
validationError.details = [['key', 'error'], ['key', 'error']];
validationError.options = { key: 'value' };

const { filterObject, isEmpty, uid } = utils.misc;
filterObject({empty: null, nonempty: 'value'}).nonempty = 'new value';
filterObject({a: 1, b: NaN}, isNaN).b = 2;
isEmpty('');
uid(10);

const { ServiceResponseBuilder } = utils.service;
const response = new ServiceResponseBuilder<number, string>()
  .allow('create', 'read', 'update', 'delete')
  .document(1)
  .document([1, 2])
  .error(new Error('error'))
  .error(new ValidationError('error'))
  .error('error')
  .error('error', [['key', 'message']])
  .fail()
  .forbid('create', 'read', 'update', 'delete')
  .message('message')
  .success()
  .token('access token')
  .produce();
response.accessToken = 'token';
response.allowed = ['create'];
response.doc = 'document 1';
response.errors = { key: 'message' };
response.list = [
  { actions: ['update'], doc: 'document 1' },
  { doc: 'document 2' }
];
response.message = 'message';
response.ok = true;
