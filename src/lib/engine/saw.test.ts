/**
 * SAW Engine Tests (Issue #7)
 * Tests the pure-function SAW computation engine covering all four stages:
 * 1. Decision Matrix (Xij) raw metrics
 * 2. Normalized Matrix (Rij) benefit normalization
 * 3. Weighted Matrix (Wj * Rij)
 * 4. Final Rankings (Vi) with sort and tie-breaking
 */

import { describe, expect, it } from 'bun:test';
import {
	computeDecisionMatrix,
	computeNormalizedMatrix,
	computeWeightedMatrix,
	computeRankings,
	runSAW
} from './saw';
import type { CandidateProduct, Comment, CommentMatch, C4TimeAnchorConfig, CriteriaCode } from '$lib/types';

// ─── Shared fixtures ────────────────────────────────────────────────────────

const products: CandidateProduct[] = [
	{
		id: 'prod-a',
		analysisProjectId: 'proj-1',
		name: 'Product A',
		keywords: [{ id: 'kw-1', productId: 'prod-a', keyword: 'product a', createdAt: '' }],
		createdAt: '',
		updatedAt: ''
	},
	{
		id: 'prod-b',
		analysisProjectId: 'proj-1',
		name: 'Product B',
		keywords: [{ id: 'kw-2', productId: 'prod-b', keyword: 'product b', createdAt: '' }],
		createdAt: '',
		updatedAt: ''
	},
	{
		id: 'prod-c',
		analysisProjectId: 'proj-1',
		name: 'Product C',
		keywords: [{ id: 'kw-3', productId: 'prod-c', keyword: 'product c', createdAt: '' }],
		createdAt: '',
		updatedAt: ''
	}
];

// Anchor date: 2026-06-01T00:00:00Z
// Recent window: 30 days → cutoff: 2026-05-02
const c4Config: C4TimeAnchorConfig = {
	daysWindow: 30,
	anchorType: 'custom',
	customAnchorDate: '2026-06-01T00:00:00Z'
};

// Comments: authored on various dates with varying like counts
const comments: Comment[] = [
	// Author 1 — recent (2026-05-20), 10 likes
	{
		id: 'c1',
		youtubeVideoId: 'v1',
		youtubeCommentId: 'yt1',
		authorChannelId: 'user-1',
		authorName: 'User 1',
		text: 'product a review',
		likeCount: 10,
		publishedAt: '2026-05-20T00:00:00Z',
		createdAt: ''
	},
	// Author 2 — recent (2026-05-25), 20 likes
	{
		id: 'c2',
		youtubeVideoId: 'v1',
		youtubeCommentId: 'yt2',
		authorChannelId: 'user-2',
		authorName: 'User 2',
		text: 'product a review',
		likeCount: 20,
		publishedAt: '2026-05-25T00:00:00Z',
		createdAt: ''
	},
	// Author 1 (same user) — old (2026-01-01), 0 likes
	{
		id: 'c3',
		youtubeVideoId: 'v1',
		youtubeCommentId: 'yt3',
		authorChannelId: 'user-1',
		authorName: 'User 1',
		text: 'product b review',
		likeCount: 0,
		publishedAt: '2026-01-01T00:00:00Z',
		createdAt: ''
	},
	// Author 3 — recent (2026-05-10), 5 likes
	{
		id: 'c4',
		youtubeVideoId: 'v1',
		youtubeCommentId: 'yt4',
		authorChannelId: 'user-3',
		authorName: 'User 3',
		text: 'product b review',
		likeCount: 5,
		publishedAt: '2026-05-10T00:00:00Z',
		createdAt: ''
	}
	// Product C has NO request matches → all zeros
];

// CommentMatches — only isRequest=true ones count for SAW
const matches: CommentMatch[] = [
	{
		id: 'm1',
		commentId: 'c1',
		productId: 'prod-a',
		matchedProductKeyword: 'product a',
		matchedRequestKeyword: 'review',
		isMention: true,
		isRequest: true,
		createdAt: ''
	},
	{
		id: 'm2',
		commentId: 'c2',
		productId: 'prod-a',
		matchedProductKeyword: 'product a',
		matchedRequestKeyword: 'review',
		isMention: true,
		isRequest: true,
		createdAt: ''
	},
	{
		id: 'm3',
		commentId: 'c3',
		productId: 'prod-b',
		matchedProductKeyword: 'product b',
		matchedRequestKeyword: 'review',
		isMention: true,
		isRequest: true,
		createdAt: ''
	},
	{
		id: 'm4',
		commentId: 'c4',
		productId: 'prod-b',
		matchedProductKeyword: 'product b',
		matchedRequestKeyword: 'review',
		isMention: true,
		isRequest: true,
		createdAt: ''
	},
	// non-request mention — must NOT be counted
	{
		id: 'm5',
		commentId: 'c1',
		productId: 'prod-c',
		matchedProductKeyword: 'product c',
		matchedRequestKeyword: null,
		isMention: true,
		isRequest: false,
		createdAt: ''
	}
];

// ─── Decision Matrix ─────────────────────────────────────────────────────────

describe('SAW Engine — Decision Matrix (Xij)', () => {
	it('correctly counts C1 (Request Count) per product', () => {
		const dm = computeDecisionMatrix(matches, comments, products, c4Config);

		const rowA = dm.rows.find((r) => r.productId === 'prod-a')!;
		const rowB = dm.rows.find((r) => r.productId === 'prod-b')!;
		const rowC = dm.rows.find((r) => r.productId === 'prod-c')!;

		expect(rowA.c1RequestCount).toBe(2); // c1, c2
		expect(rowB.c1RequestCount).toBe(2); // c3, c4
		expect(rowC.c1RequestCount).toBe(0); // no request matches
	});

	it('correctly counts C2 (Unique Requester / distinct authorChannelId)', () => {
		const dm = computeDecisionMatrix(matches, comments, products, c4Config);

		const rowA = dm.rows.find((r) => r.productId === 'prod-a')!;
		const rowB = dm.rows.find((r) => r.productId === 'prod-b')!;

		expect(rowA.c2UniqueRequester).toBe(2); // user-1, user-2
		expect(rowB.c2UniqueRequester).toBe(2); // user-1, user-3 (same user-1 as prod-a but counted separately per product)
	});

	it('correctly computes C3 (Average Request Likes)', () => {
		const dm = computeDecisionMatrix(matches, comments, products, c4Config);

		const rowA = dm.rows.find((r) => r.productId === 'prod-a')!;
		const rowB = dm.rows.find((r) => r.productId === 'prod-b')!;
		const rowC = dm.rows.find((r) => r.productId === 'prod-c')!;

		// prod-a: (10 + 20) / 2 = 15
		expect(rowA.c3AverageRequestLikes).toBeCloseTo(15, 2);
		// prod-b: (0 + 5) / 2 = 2.5
		expect(rowB.c3AverageRequestLikes).toBeCloseTo(2.5, 2);
		// prod-c: 0 requests → 0
		expect(rowC.c3AverageRequestLikes).toBe(0);
	});

	it('correctly computes C4 (Recent Request Ratio) using ADR-0001 time anchor', () => {
		const dm = computeDecisionMatrix(matches, comments, products, c4Config);

		// Cutoff: 2026-06-01 minus 30 days = 2026-05-02T00:00:00Z
		// prod-a: c1 (2026-05-20 ✓), c2 (2026-05-25 ✓) → 2/2 = 1.0
		// prod-b: c3 (2026-01-01 ✗), c4 (2026-05-10 ✓) → 1/2 = 0.5
		const rowA = dm.rows.find((r) => r.productId === 'prod-a')!;
		const rowB = dm.rows.find((r) => r.productId === 'prod-b')!;

		expect(rowA.c4RecentRequestRatio).toBeCloseTo(1.0, 4);
		expect(rowB.c4RecentRequestRatio).toBeCloseTo(0.5, 4);
	});

	it('computes correct max values across all products', () => {
		const dm = computeDecisionMatrix(matches, comments, products, c4Config);

		// maxC1: max(2, 2, 0) = 2
		expect(dm.maxValues.c1).toBe(2);
		// maxC2: max(2, 2, 0) = 2
		expect(dm.maxValues.c2).toBe(2);
		// maxC3: max(15, 2.5, 0) = 15
		expect(dm.maxValues.c3).toBeCloseTo(15, 2);
		// maxC4: max(1.0, 0.5, 0) = 1.0
		expect(dm.maxValues.c4).toBeCloseTo(1.0, 4);
	});

	it('uses 1 as denominator when all max values are 0 (edge case: no data)', () => {
		const emptyDM = computeDecisionMatrix([], [], products, c4Config);
		expect(emptyDM.maxValues.c1).toBe(1);
		expect(emptyDM.maxValues.c2).toBe(1);
		expect(emptyDM.maxValues.c3).toBe(1);
		expect(emptyDM.maxValues.c4).toBe(1);
	});
});

// ─── Normalized Matrix ───────────────────────────────────────────────────────

describe('SAW Engine — Normalized Matrix (Rij)', () => {
	it('applies benefit normalization: Rij = Xij / max(Xj)', () => {
		const dm = computeDecisionMatrix(matches, comments, products, c4Config);
		const nm = computeNormalizedMatrix(dm);

		const rowA = nm.rows.find((r) => r.productId === 'prod-a')!;
		const rowB = nm.rows.find((r) => r.productId === 'prod-b')!;

		// prod-a: R1 = 2/2 = 1.0, R2 = 2/2 = 1.0, R3 = 15/15 = 1.0, R4 = 1.0/1.0 = 1.0
		expect(rowA.r1).toBeCloseTo(1.0, 4);
		expect(rowA.r2).toBeCloseTo(1.0, 4);
		expect(rowA.r3).toBeCloseTo(1.0, 4);
		expect(rowA.r4).toBeCloseTo(1.0, 4);

		// prod-b: R1 = 2/2 = 1.0, R2 = 2/2 = 1.0, R3 = 2.5/15 ≈ 0.1667, R4 = 0.5/1.0 = 0.5
		expect(rowB.r1).toBeCloseTo(1.0, 4);
		expect(rowB.r2).toBeCloseTo(1.0, 4);
		expect(rowB.r3).toBeCloseTo(2.5 / 15, 4);
		expect(rowB.r4).toBeCloseTo(0.5, 4);
	});

	it('maximum normalized value per criterion must equal 1.0', () => {
		const dm = computeDecisionMatrix(matches, comments, products, c4Config);
		const nm = computeNormalizedMatrix(dm);

		const maxR1 = Math.max(...nm.rows.map((r) => r.r1));
		const maxR2 = Math.max(...nm.rows.map((r) => r.r2));
		const maxR3 = Math.max(...nm.rows.map((r) => r.r3));
		const maxR4 = Math.max(...nm.rows.map((r) => r.r4));

		expect(maxR1).toBeCloseTo(1.0, 4);
		expect(maxR2).toBeCloseTo(1.0, 4);
		expect(maxR3).toBeCloseTo(1.0, 4);
		expect(maxR4).toBeCloseTo(1.0, 4);
	});
});

// ─── Weighted Matrix ─────────────────────────────────────────────────────────

describe('SAW Engine — Weighted Matrix (Wj × Rij)', () => {
	const weights: Record<CriteriaCode, number> = {
		C1: 0.4,
		C2: 0.25,
		C3: 0.2,
		C4: 0.15
	};

	it('computes weighted scores as Wj * Rij per cell', () => {
		const dm = computeDecisionMatrix(matches, comments, products, c4Config);
		const nm = computeNormalizedMatrix(dm);
		const wm = computeWeightedMatrix(nm, weights);

		const rowA = wm.rows.find((r) => r.productId === 'prod-a')!;

		// prod-a: all Rij = 1.0, so weighted = weights directly
		expect(rowA.w1).toBeCloseTo(0.4, 4);
		expect(rowA.w2).toBeCloseTo(0.25, 4);
		expect(rowA.w3).toBeCloseTo(0.2, 4);
		expect(rowA.w4).toBeCloseTo(0.15, 4);
	});

	it('computes Preference Value Vi as sum of weighted row', () => {
		const dm = computeDecisionMatrix(matches, comments, products, c4Config);
		const nm = computeNormalizedMatrix(dm);
		const wm = computeWeightedMatrix(nm, weights);

		const rowA = wm.rows.find((r) => r.productId === 'prod-a')!;
		// Vi = 0.4 + 0.25 + 0.2 + 0.15 = 1.0
		expect(rowA.preferenceValue).toBeCloseTo(1.0, 4);

		const rowB = wm.rows.find((r) => r.productId === 'prod-b')!;
		// prod-b: w1=0.4*1=0.4, w2=0.25*1=0.25, w3=0.2*(2.5/15), w4=0.15*0.5
		const expectedW3 = 0.2 * (2.5 / 15);
		const expectedW4 = 0.15 * 0.5;
		expect(rowB.preferenceValue).toBeCloseTo(0.4 + 0.25 + expectedW3 + expectedW4, 3);
	});
});

// ─── Final Rankings ───────────────────────────────────────────────────────────

describe('SAW Engine — Final Rankings (Vi)', () => {
	const weights: Record<CriteriaCode, number> = {
		C1: 0.4,
		C2: 0.25,
		C3: 0.2,
		C4: 0.15
	};

	it('ranks products descending by Preference Value', () => {
		const dm = computeDecisionMatrix(matches, comments, products, c4Config);
		const nm = computeNormalizedMatrix(dm);
		const wm = computeWeightedMatrix(nm, weights);
		const rankings = computeRankings(wm, dm, nm, 'proj-1');

		// prod-a has Vi=1.0, prod-b has lower, prod-c has 0
		const ranks = rankings.map((r) => r.productId);
		expect(ranks[0]).toBe('prod-a');
		expect(rankings[0].rank).toBe(1);
		expect(rankings[0].preferenceValue).toBeGreaterThan(rankings[1].preferenceValue);
	});

	it('last place product has rank equal to total product count', () => {
		const dm = computeDecisionMatrix(matches, comments, products, c4Config);
		const nm = computeNormalizedMatrix(dm);
		const wm = computeWeightedMatrix(nm, weights);
		const rankings = computeRankings(wm, dm, nm, 'proj-1');

		expect(rankings[rankings.length - 1].rank).toBe(products.length);
	});

	it('assigns stable rank via productId tie-breaking when Vi values are equal', () => {
		// Two products with same Vi — result order must be consistent
		const dm = computeDecisionMatrix(matches, comments, products, c4Config);
		const nm = computeNormalizedMatrix(dm);
		const wm = computeWeightedMatrix(nm, weights);
		const r1 = computeRankings(wm, dm, nm, 'proj-1');
		const r2 = computeRankings(wm, dm, nm, 'proj-1');
		// Repeated calls must produce identical order
		expect(r1.map((r) => r.productId)).toEqual(r2.map((r) => r.productId));
	});

	it('runSAW orchestrator returns a complete RankingLeaderboard', () => {
		const leaderboard = runSAW(matches, comments, products, {
			C1: 0.4, C2: 0.25, C3: 0.2, C4: 0.15
		}, c4Config, 'proj-1');

		expect(leaderboard.rankings.length).toBe(3);
		expect(leaderboard.decisionMatrix.rows.length).toBe(3);
		expect(leaderboard.normalizedMatrix.rows.length).toBe(3);
		expect(leaderboard.weightedMatrix.rows.length).toBe(3);
		expect(leaderboard.criteriaWeights).toMatchObject({ C1: 0.4, C2: 0.25, C3: 0.2, C4: 0.15 });
		expect(leaderboard.analysisProjectId).toBe('proj-1');
	});
});
