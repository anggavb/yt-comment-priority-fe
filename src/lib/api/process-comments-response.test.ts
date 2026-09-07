import { describe, expect, it } from 'bun:test';
import { HttpApiClient } from './httpClient';

describe('Process Comments Response Adaptation Bug & Regression Test', () => {
	it('adapts flat Elysia backend response format correctly into ProcessCommentsResult', async () => {
		const backendResponse = {
			message: 'Komentar berhasil diproses',
			totalComments: 500,
			matchedComments: 300,
			totalMatches: 300,
			requestCount: 225
		};

		const originalFetch = globalThis.fetch;
		globalThis.fetch = ((async () =>
			new Response(JSON.stringify(backendResponse), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})) as unknown) as typeof fetch;

		try {
			const client = new HttpApiClient('http://localhost:3000');
			const result = await client.processComments('test-project-id');

			// Result must provide both nested summary and flat properties
			expect(result.summary).toBeDefined();
			expect(result.summary.matchedComments).toBe(300);
			expect(result.summary.requestComments).toBe(225);
			expect(result.summary.totalComments).toBe(500);
			expect(result.summary.unmatchedComments).toBe(200);
			expect(result.processedCount).toBe(500);
			expect(result.matchesFound).toBe(300);

			// Direct property access should also match
			expect(result.matchedComments).toBe(300);
			expect(result.totalComments).toBe(500);
			expect(result.totalMatches).toBe(300);
			expect(result.requestCount).toBe(225);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it('preserves already nested summary format without mutation', async () => {
		const nestedResponse = {
			processedCount: 150,
			matchesFound: 80,
			summary: {
				totalComments: 150,
				matchedComments: 80,
				requestComments: 45,
				unmatchedComments: 70
			}
		};

		const originalFetch = globalThis.fetch;
		globalThis.fetch = ((async () =>
			new Response(JSON.stringify(nestedResponse), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})) as unknown) as typeof fetch;

		try {
			const client = new HttpApiClient('http://localhost:3000');
			const result = await client.processComments('test-project-id');

			expect(result.summary).toBeDefined();
			expect(result.summary.matchedComments).toBe(80);
			expect(result.summary.requestComments).toBe(45);
			expect(result.summary.totalComments).toBe(150);
			expect(result.summary.unmatchedComments).toBe(70);
			expect(result.processedCount).toBe(150);
			expect(result.matchesFound).toBe(80);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it('handles 0 comments edge case safely without NaN or undefined', async () => {
		const zeroResponse = {
			message: 'Komentar berhasil diproses',
			totalComments: 0,
			matchedComments: 0,
			totalMatches: 0,
			requestCount: 0
		};

		const originalFetch = globalThis.fetch;
		globalThis.fetch = ((async () =>
			new Response(JSON.stringify(zeroResponse), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})) as unknown) as typeof fetch;

		try {
			const client = new HttpApiClient('http://localhost:3000');
			const result = await client.processComments('test-project-id');

			expect(result.summary.matchedComments).toBe(0);
			expect(result.summary.requestComments).toBe(0);
			expect(result.summary.totalComments).toBe(0);
			expect(result.summary.unmatchedComments).toBe(0);
			expect(result.processedCount).toBe(0);
			expect(result.matchesFound).toBe(0);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
