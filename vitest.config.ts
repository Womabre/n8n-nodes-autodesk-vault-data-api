import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['**/__tests__/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			// 'lcovonly' instead of 'lcov': the HTML report adds JavaScript files that
			// `n8n-node lint` would pick up, and strict mode forbids ignoring them in
			// eslint.config.mjs.
			reporter: ['text', 'lcovonly'],
			// List every source file, so files without tests count as uncovered
			// instead of being left out of the report.
			include: ['nodes/**/*.ts', 'credentials/**/*.ts'],
			exclude: ['**/__tests__/**'],
		},
	},
});
