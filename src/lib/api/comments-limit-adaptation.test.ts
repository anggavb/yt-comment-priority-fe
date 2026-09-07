import { describe, expect, it } from 'bun:test';
import { HttpApiClient } from './httpClient';

describe('Comments API Limit and Pagination Adaptation', () => {
	it('handles limit > 100 gracefully without sending invalid limit to backend', async () => {
		const capturedUrls: string[] = [];

		const mockFetch = (async (input: RequestInfo | URL) => {
			const urlStr = String(input);
			capturedUrls.push(urlStr);

			// Emulate Elysia backend validation: if limit > 100, return 400
			const urlObj = new URL(urlStr);
			const limitParam = Number(urlObj.searchParams.get('limit') || '20');

			if (limitParam > 100) {
				return new Response(
					JSON.stringify({
						message: 'Expected number to be less or equal to 100',
						found: limitParam
					}),
					{ status: 400, headers: { 'Content-Type': 'application/json' } }
				);
			}

			// Return valid backend pagination response
			return new Response(
				JSON.stringify({
					data: [
						{
							id: 'comm-1',
							analysisProjectId: 'test-project',
							youtubeVideoId: 'vid-1',
							youtubeCommentId: 'yt-comm-1',
							authorName: 'User A',
							authorChannelId: 'channel-a',
							text: 'Test comment text',
							likeCount: 5,
							publishedAt: '2026-09-07T12:00:00.000Z',
							createdAt: '2026-09-07T12:00:00.000Z',
							matches: []
						}
					],
					pagination: {
						page: 1,
						limit: limitParam,
						total: 1,
						totalPages: 1
					}
				}),
				{ status: 200, headers: { 'Content-Type': 'application/json' } }
			);
		}) as unknown as typeof fetch;

		const client = new HttpApiClient('http://localhost:3000');
		client.setFetch(mockFetch);

		// Caller asks for 1000 comments (as criteria/+page.svelte was doing)
		const res = await client.getComments('test-project', { limit: 1000 });

		// Should succeed without 400 error
		expect(res.data.length).toBe(1);
		expect(res.total).toBe(1);
		expect(res.page).toBe(1);
		expect(res.totalPages).toBe(1);

		// All backend requests must have had limit <= 100
		for (const url of capturedUrls) {
			const urlObj = new URL(url);
			const limit = Number(urlObj.searchParams.get('limit') || '20');
			expect(limit).toBeLessThanOrEqual(100);
		}
	});
});
