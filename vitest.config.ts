import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/money.ts',
        'src/lib/normalize.ts',
        'src/lib/date.ts',
        'src/lib/budgetSelectors.ts',
        'src/lib/debugFlag.ts',
        'src/lib/imageUtils.ts',
      ],
      all: true,
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
})
