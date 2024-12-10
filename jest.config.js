export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  moduleFileExtensions: ['js'],
  verbose: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**/*.js'
  ],
  setupFiles: ['dotenv/config'],
  testTimeout: 10000,
  maxConcurrency: 1
};