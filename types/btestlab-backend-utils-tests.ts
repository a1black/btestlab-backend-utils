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
