module.exports = {
  bail: 1,
  collectCoverage: false,
  errorOnDeprecated: true,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/?(*.)+(test).js'],
  testPathIgnorePatterns: ['/node_modules/'],
  verbose: true,
  watchman: false
}
