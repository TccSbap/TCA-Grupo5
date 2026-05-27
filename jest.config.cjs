module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  restoreMocks: true,
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  collectCoverageFrom: [
    'app.js',
    'data/**/*.js',
    'middleware/**/*.js',
    'models/**/*.js',
    'routes/**/*.js'
  ]
};
