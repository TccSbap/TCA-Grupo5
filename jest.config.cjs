module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  restoreMocks: true,
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/jest.setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  collectCoverageFrom: [
    'app.js',
    'data/**/*.js',
    'middleware/**/*.js',
    'routes/**/*.js'
  ]
};
