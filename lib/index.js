'use strict'

const errors = require('./errors')
const functional = require('./functional')
const service = require('./service')

module.exports = {
  errors,
  misc: functional,
  service
}
