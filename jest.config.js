const nextJest = require('next/jest')
const createJestConfig = nextJest({ dir: './' })

module.exports = createJestConfig({
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['<rootDir>/__tests__/**/*.test.{js,jsx}'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
})
