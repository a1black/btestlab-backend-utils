'use strict'

const dotenv = require('dotenv')
const mongodb = require('mongodb')
const path = require('path')

dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

async function dbConnect() {
  const client = new mongodb.MongoClient(process.env.MONGODB_URL, {
    auth: {
      username: process.env.MONGODB_USERNAME,
      password: process.env.MONGODB_PASSWORD
    },
    authSource: 'admin'
  })
  await client.connect()
  const db = client.db('btestlab-backend-utils-test')
  return { client, db }
}

module.exports = {
  dbConnect: dbConnect
}
