module.exports = {
  // Stop running tests after `n` failures
  bail: 1,
  collectCoverage: false,
  errorOnDeprecated: true,
  //setupFilesAfterEnv: ['jest-extended'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/?(*.)+(test).js'],
  testPathIgnorePatterns: ['/node_modules/'],

  verbose: true,
  watchman: false
}
