import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['**/__tests__/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov'],
			// List every source file, so files without tests count as uncovered
			// instead of being left out of the report.
			include: ['nodes/**/*.ts', 'credentials/**/*.ts'],
			exclude: ['**/__tests__/**'],
		},
	},
});
