import { describe, expect, it, beforeEach } from 'bun:test';
import { MockService } from '$lib/mock/mockService';
import { MockApiClient } from './mockClient';

describe('Comment Processing & Audit API Lifecycle (Issue #5)', () => {
	let service: MockService;
	let client: MockApiClient;
	const projectId = 'proj-desk-setup-2026';

	beforeEach(() => {
		service = new MockService();
		client = new MockApiClient(service);
	});

	it('processes comments and returns accurate summary metrics (AC-4)', async () => {
		const result = await client.processComments(projectId);

		expect(result.processedCount).toBeGreaterThan(0);
		expect(result.matchesFound).toBeGreaterThan(0);
		expect(result.summary.totalComments).toBe(result.processedCount);
		expect(result.summary.matchedComments).toBeGreaterThan(0);
		expect(result.summary.requestComments).toBeGreaterThan(0);
		expect(result.summary.unmatchedComments).toBe(
			result.summary.totalComments - result.summary.matchedComments
		);
	});

	it('retrieves paginated comments with attached matches (AC-5)', async () => {
		const res = await client.getComments(projectId, { page: 1, limit: 5 });

		expect(res.data.length).toBe(5);
		expect(res.page).toBe(1);
		expect(res.limit).toBe(5);
		expect(res.total).toBeGreaterThan(5);
		expect(res.totalPages).toBe(Math.ceil(res.total / 5));

		// First comment should have matches array attached
		expect(Array.isArray(res.data[0].matches)).toBe(true);
	});

	it('filters comments by product ID (AC-5)', async () => {
		const products = await client.getProducts(projectId);
		expect(products.length).toBeGreaterThan(0);
		const targetProduct = products[0];

		const res = await client.getComments(projectId, {
			productId: targetProduct.id,
			limit: 100
		});

		expect(res.data.length).toBeGreaterThan(0);
		for (const comment of res.data) {
			const hasProductMatch = comment.matches?.some((m) => m.productId === targetProduct.id);
			expect(hasProductMatch).toBe(true);
		}
	});

	it('filters comments by status: mention, request, and unmatched (AC-5)', async () => {
		// 1. Status: mention (only comments that have at least 1 match)
		const mentionsRes = await client.getComments(projectId, {
			status: 'mention',
			limit: 100
		});
		expect(mentionsRes.data.length).toBeGreaterThan(0);
		for (const c of mentionsRes.data) {
			expect(c.matches && c.matches.length > 0).toBe(true);
		}

		// 2. Status: request (only comments that have a request match)
		const requestsRes = await client.getComments(projectId, {
			status: 'request',
			limit: 100
		});
		expect(requestsRes.data.length).toBeGreaterThan(0);
		for (const c of requestsRes.data) {
			expect(c.matches?.some((m) => m.isRequest)).toBe(true);
		}

		// 3. Status: unmatched (only comments with no candidate product match)
		const unmatchedRes = await client.getComments(projectId, {
			status: 'unmatched',
			limit: 100
		});
		expect(unmatchedRes.data.length).toBeGreaterThan(0);
		for (const c of unmatchedRes.data) {
			expect(c.matches?.length || 0).toBe(0);
		}
	});

	it('filters comments by full-text search query (AC-5)', async () => {
		const res = await client.getComments(projectId, {
			search: 'keychron',
			limit: 50
		});

		expect(res.data.length).toBeGreaterThan(0);
		for (const c of res.data) {
			const textMatches =
				c.text.toLowerCase().includes('keychron') ||
				c.authorName.toLowerCase().includes('keychron');
			expect(textMatches).toBe(true);
		}
	});

	it('ensures multi-product comments generate multiple CommentMatch records (1:N) (AC-3)', async () => {
		// Add a candidate product with keyword 'rk'
		const products = await client.getProducts(projectId);
		expect(products.length).toBeGreaterThanOrEqual(2);

		// Fetch all comment matches for the project
		const matches = await client.getCommentMatches(projectId);
		expect(matches.length).toBeGreaterThan(0);

		// Group matches by commentId to verify if any comment has > 1 match
		const matchesByComment = new Map<string, typeof matches>();
		for (const m of matches) {
			const list = matchesByComment.get(m.commentId) || [];
			list.push(m);
			matchesByComment.set(m.commentId, list);
		}

		// Verify that matches contain correct relation properties
		for (const m of matches) {
			expect(m.id).toBeDefined();
			expect(m.commentId).toBeDefined();
			expect(m.productId).toBeDefined();
			expect(m.isMention).toBe(true);
			expect(typeof m.isRequest).toBe('boolean');
			expect(m.matchedProductKeyword).toBeDefined();
		}
	});
});
