/**
 * SAW (Simple Additive Weighting) Calculation Engine
 * Issue #7 — Pure-function engine for academic transparency.
 *
 * Implements the four-stage SAW pipeline:
 *  1. Decision Matrix  (Xij)           — raw metrics per product
 *  2. Normalized Matrix (Rij)          — benefit normalization: Rij = Xij / max(Xj)
 *  3. Weighted Matrix  (Wj × Rij)      — per-criterion weighted scores
 *  4. Final Rankings   (Vi = Σ Wj·Rij) — sorted descending, tie-broken by productId
 *
 * References: CONTEXT.md, ADR-0001, ADR-0003
 */

import type {
	CandidateProduct,
	Comment,
	CommentMatch,
	CriteriaCode,
	C4TimeAnchorConfig,
	DecisionMatrix,
	DecisionMatrixRow,
	NormalizedMatrix,
	NormalizedMatrixRow,
	RankingLeaderboard,
	RankingResult,
	WeightedMatrix,
	WeightedMatrixRow
} from '$lib/types';

// ─── Stage 1: Decision Matrix (Xij) ─────────────────────────────────────────

/**
 * Computes raw metric values for each product from request-type comment matches.
 * Only CommentMatch records where `isRequest === true` are counted (ADR-0001, FR-09).
 *
 * Metrics:
 *  C1 — Request Count        : number of request matches for the product
 *  C2 — Unique Requester     : COUNT DISTINCT authorChannelId among requesters
 *  C3 — Average Request Likes: mean likeCount across matched request comments
 *  C4 — Recent Request Ratio : fraction of requests within the ADR-0001 time window
 */
export function computeDecisionMatrix(
	allMatches: CommentMatch[],
	allComments: Comment[],
	products: CandidateProduct[],
	c4Config: C4TimeAnchorConfig
): DecisionMatrix {
	// Determine C4 anchor date per ADR-0001
	let anchorDate: Date;
	if (c4Config.anchorType === 'custom' && c4Config.customAnchorDate) {
		anchorDate = new Date(c4Config.customAnchorDate);
	} else {
		// Default: MAX(comment.published_at) across all comments
		if (allComments.length > 0) {
			const timestamps = allComments.map((c) => new Date(c.publishedAt).getTime());
			anchorDate = new Date(Math.max(...timestamps));
		} else {
			anchorDate = new Date();
		}
	}
	const recentCutoffMs = anchorDate.getTime() - c4Config.daysWindow * 24 * 60 * 60 * 1000;

	const commentById = new Map(allComments.map((c) => [c.id, c]));

	const rows: DecisionMatrixRow[] = [];
	let maxC1 = 0;
	let maxC2 = 0;
	let maxC3 = 0;
	let maxC4 = 0;

	for (const product of products) {
		const requestMatches = allMatches.filter(
			(m) => m.productId === product.id && m.isRequest
		);

		const requestCount = requestMatches.length;
		const requesters = new Set<string>();
		let totalLikes = 0;
		let recentRequests = 0;

		for (const match of requestMatches) {
			const comment = commentById.get(match.commentId);
			if (comment) {
				requesters.add(comment.authorChannelId);
				totalLikes += comment.likeCount;
				if (new Date(comment.publishedAt).getTime() >= recentCutoffMs) {
					recentRequests++;
				}
			}
		}

		const uniqueRequester = requesters.size;
		const averageRequestLikes =
			requestCount > 0 ? Number((totalLikes / requestCount).toFixed(4)) : 0;
		const recentRequestRatio =
			requestCount > 0 ? Number((recentRequests / requestCount).toFixed(4)) : 0;

		rows.push({
			productId: product.id,
			productName: product.name,
			c1RequestCount: requestCount,
			c2UniqueRequester: uniqueRequester,
			c3AverageRequestLikes: averageRequestLikes,
			c4RecentRequestRatio: recentRequestRatio
		});

		if (requestCount > maxC1) maxC1 = requestCount;
		if (uniqueRequester > maxC2) maxC2 = uniqueRequester;
		if (averageRequestLikes > maxC3) maxC3 = averageRequestLikes;
		if (recentRequestRatio > maxC4) maxC4 = recentRequestRatio;
	}

	return {
		rows,
		maxValues: {
			c1: maxC1 || 1, // avoid division by zero
			c2: maxC2 || 1,
			c3: maxC3 || 1,
			c4: maxC4 || 1
		}
	};
}

// ─── Stage 2: Normalized Matrix (Rij) ────────────────────────────────────────

/**
 * Applies benefit normalization to the Decision Matrix.
 * Formula: Rij = Xij / max(Xj)   (all criteria are benefit type)
 */
export function computeNormalizedMatrix(decisionMatrix: DecisionMatrix): NormalizedMatrix {
	const { rows, maxValues } = decisionMatrix;

	const normalizedRows: NormalizedMatrixRow[] = rows.map((row) => ({
		productId: row.productId,
		productName: row.productName,
		r1: Number((row.c1RequestCount / maxValues.c1).toFixed(4)),
		r2: Number((row.c2UniqueRequester / maxValues.c2).toFixed(4)),
		r3: Number((row.c3AverageRequestLikes / maxValues.c3).toFixed(4)),
		r4: Number((row.c4RecentRequestRatio / maxValues.c4).toFixed(4))
	}));

	return { rows: normalizedRows };
}

// ─── Stage 3: Weighted Matrix (Wj × Rij) ─────────────────────────────────────

/**
 * Multiplies each normalized value by the corresponding criterion weight.
 * Preference Value Vi = w1·R1 + w2·R2 + w3·R3 + w4·R4
 */
export function computeWeightedMatrix(
	normalizedMatrix: NormalizedMatrix,
	weights: Record<CriteriaCode, number>
): WeightedMatrix {
	const weightedRows: WeightedMatrixRow[] = normalizedMatrix.rows.map((norm) => {
		const w1 = Number((norm.r1 * weights.C1).toFixed(4));
		const w2 = Number((norm.r2 * weights.C2).toFixed(4));
		const w3 = Number((norm.r3 * weights.C3).toFixed(4));
		const w4 = Number((norm.r4 * weights.C4).toFixed(4));
		const preferenceValue = Number((w1 + w2 + w3 + w4).toFixed(4));

		return {
			productId: norm.productId,
			productName: norm.productName,
			w1,
			w2,
			w3,
			w4,
			preferenceValue
		};
	});

	return { rows: weightedRows };
}

// ─── Stage 4: Final Rankings (sorted by Vi, desc) ───────────────────────────

/**
 * Produces the final sorted ranking list.
 * Sort order: descending by preferenceValue, then ascending by productId for
 * stable tie-breaking to ensure deterministic ordering across equal Vi values.
 */
export function computeRankings(
	weightedMatrix: WeightedMatrix,
	decisionMatrix: DecisionMatrix,
	normalizedMatrix: NormalizedMatrix,
	projectId: string
): RankingResult[] {
	const decMap = new Map(decisionMatrix.rows.map((r) => [r.productId, r]));
	const normMap = new Map(normalizedMatrix.rows.map((r) => [r.productId, r]));

	return [...weightedMatrix.rows]
		.sort((a, b) => {
			const diff = b.preferenceValue - a.preferenceValue;
			if (diff !== 0) return diff;
			// Stable tie-breaking by productId (lexicographic ascending)
			return a.productId.localeCompare(b.productId);
		})
		.map((weightedRow, idx) => {
			const dec = decMap.get(weightedRow.productId)!;
			const norm = normMap.get(weightedRow.productId)!;

			return {
				id: `rank-${projectId}-${weightedRow.productId}`,
				analysisProjectId: projectId,
				productId: weightedRow.productId,
				productName: weightedRow.productName,
				requestCount: dec.c1RequestCount,
				uniqueRequester: dec.c2UniqueRequester,
				averageRequestLikes: dec.c3AverageRequestLikes,
				recentRequestRatio: dec.c4RecentRequestRatio,
				normalizedRequestCount: norm.r1,
				normalizedUniqueRequester: norm.r2,
				normalizedAverageLikes: norm.r3,
				normalizedRecentRequestRatio: norm.r4,
				preferenceValue: weightedRow.preferenceValue,
				rank: idx + 1,
				calculatedAt: new Date().toISOString()
			};
		});
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

/**
 * Runs the full SAW pipeline and returns a complete RankingLeaderboard.
 * This is the single entry-point for the SAW engine.
 */
export function runSAW(
	allMatches: CommentMatch[],
	allComments: Comment[],
	products: CandidateProduct[],
	weights: Record<CriteriaCode, number>,
	c4Config: C4TimeAnchorConfig,
	projectId: string
): RankingLeaderboard {
	const decisionMatrix = computeDecisionMatrix(allMatches, allComments, products, c4Config);
	const normalizedMatrix = computeNormalizedMatrix(decisionMatrix);
	const weightedMatrix = computeWeightedMatrix(normalizedMatrix, weights);
	const rankings = computeRankings(weightedMatrix, decisionMatrix, normalizedMatrix, projectId);

	return {
		analysisProjectId: projectId,
		calculatedAt: new Date().toISOString(),
		rankings,
		decisionMatrix,
		normalizedMatrix,
		weightedMatrix,
		criteriaWeights: weights,
		c4Config
	};
}
