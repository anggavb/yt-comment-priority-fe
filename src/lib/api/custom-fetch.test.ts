import { describe, expect, it } from 'bun:test';
import { HttpApiClient } from './httpClient';
import { DualModeApiClient } from './client';
import { MockApiClient } from './mockClient';
import { MockService } from '$lib/mock/mockService';

describe('Custom Fetcher Integration for SvelteKit Load Functions', () => {
	it('uses custom fetch passed to HttpApiClient.setFetch', async () => {
		let customFetchCalled = false;

		const mockFetch = (async (input: RequestInfo | URL) => {
			customFetchCalled = true;
			const urlStr = String(input);
			if (urlStr.includes('/projects/test-custom-id')) {
				return new Response(
					JSON.stringify({
						id: 'test-custom-id',
						name: 'Custom Fetch Project',
						status: 'draft',
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
						videoCount: 0,
						productCount: 0,
						commentCount: 0,
						processedCommentCount: 0
					}),
					{ status: 200, headers: { 'Content-Type': 'application/json' } }
				);
			}
			return new Response('Not found', { status: 404 });
		}) as unknown as typeof fetch;

		const httpClient = new HttpApiClient('http://localhost:3000');
		httpClient.setFetch(mockFetch);

		const project = await httpClient.getProject('test-custom-id');

		expect(customFetchCalled).toBe(true);
		expect(project?.name).toBe('Custom Fetch Project');
	});

	it('DualModeApiClient delegates setFetch to HttpApiClient', async () => {
		let customFetchCalled = false;

		const mockFetch = (async () => {
			customFetchCalled = true;
			return new Response(
				JSON.stringify({
					id: 'test-dual-id',
					name: 'Dual Mode Custom Fetch',
					status: 'draft',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					videoCount: 0,
					productCount: 0,
					commentCount: 0,
					processedCommentCount: 0
				}),
				{ status: 200, headers: { 'Content-Type': 'application/json' } }
			);
		}) as unknown as typeof fetch;

		const mockService = new MockService();
		const mockClient = new MockApiClient(mockService);
		const httpClient = new HttpApiClient('http://localhost:3000');
		const dualClient = new DualModeApiClient(mockClient, httpClient);
		dualClient.setMode('live');

		dualClient.setFetch(mockFetch);
		const project = await dualClient.getProject('test-dual-id');

		expect(customFetchCalled).toBe(true);
		expect(project?.name).toBe('Dual Mode Custom Fetch');
	});
});
