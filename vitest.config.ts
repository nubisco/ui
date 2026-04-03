import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'virtual:icons': resolve(__dirname, 'tests/__mocks__/virtual-icons.ts'),
    },
  },
  test: {
    root: '.',
    include: ['tests/**/*.test.ts'],
    globals: true,
    passWithNoTests: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: ['src/**/*.d.ts'],
    },
  },
})
