import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/crypto-lab-misty-lens/',
  test: {
    include: ['src/**/*.test.ts'],
  },
})