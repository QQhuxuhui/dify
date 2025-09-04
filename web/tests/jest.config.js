/**
 * Jest Configuration for Story 1.3 Permission System Tests
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts',
  ],
  
  // Module paths
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Test patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.{ts,tsx}',
    '<rootDir>/tests/**/*.spec.{ts,tsx}',
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/tests/coverage',
  coverageReporters: [
    'text',
    'html',
    'lcov',
    'json-summary',
  ],
  
  // Coverage thresholds (Story 1.3 requirement: >90% unit tests)
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // Specific thresholds for core permission files
    './hooks/use-user-role.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './hooks/use-permission.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './utils/role-storage.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './context/role-context.tsx': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'hooks/use-user-role.ts',
    'hooks/use-permission.ts',
    'hooks/use-user-sync.ts',
    'utils/role-storage.ts',
    'utils/navigation-utils.ts',
    'context/role-context.tsx',
    'components/base/permission-wrapper.tsx',
    'components/base/role-display.tsx',
    'components/base/route-guard.tsx',
    'components/base/with-permission.tsx',
    'middleware/permission-middleware.ts',
    '!**/*.d.ts',
    '!**/*.stories.{ts,tsx}',
    '!**/node_modules/**',
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
  },
  
  // Module file extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
  ],
  
  // Test suites configuration
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.{ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.{ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/tests/performance/**/*.test.{ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      testTimeout: 30000, // Longer timeout for performance tests
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.{ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      testTimeout: 60000, // Longer timeout for E2E tests
    },
  ],
  
  // Global configuration
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Test timeout
  testTimeout: 10000,
  
  // Error handling
  bail: 0, // Continue running tests even if some fail
  
  // Watch mode configuration
  watchman: true,
  
  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/tests/.jest-cache',
}