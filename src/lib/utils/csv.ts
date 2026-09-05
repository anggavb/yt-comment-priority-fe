/**
 * YouTube Review Priority System - CSV Export Utilities
 * Supporting academic exports for Thesis Chapter 4 and Appendices.
 */

import type {
	CandidateProduct,
	CommentWithMatches,
	RankingLeaderboard
} from '$lib/types';

/**
 * Escapes a single CSV cell value according to RFC 4180.
 * Wraps in double quotes and escapes existing quotes if cell contains commas, quotes, or newlines.
 */
export function escapeCsvCell(value: string | number | null | undefined): string {
	if (value === null || value === undefined) {
		return '';
	}
	const str = String(value);
	if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

/**
 * Joins headers and rows into a formatted RFC 4180 CSV string using CRLF (\r\n).
 */
export function generateCsv(
	headers: string[],
	rows: (string | number | null | undefined)[][]
): string {
	const headerLine = headers.map(escapeCsvCell).join(',');
	const dataLines = rows.map((row) => row.map(escapeCsvCell).join(','));
	return [headerLine, ...dataLines].join('\r\n');
}

/**
 * Triggers a browser download of CSV content as a UTF-8 text file.
 */
export function downloadCsv(filename: string, csvContent: string): void {
	if (typeof window === 'undefined') return;

	// Add BOM (\uFEFF) for Microsoft Excel compatibility with UTF-8
	const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Formats a number to 4 decimal places for academic matrix exports.
 */
function formatMatrixDecimal(n: number | undefined | null): string {
	if (n === undefined || n === null || isNaN(n)) return '0.0000';
	return n.toFixed(4);
}

/**
 * Generates CSV for Table 1: Initial Decision Matrix (Xij).
 */
export function generateDecisionMatrixCsv(leaderboard: RankingLeaderboard): string {
	const headers = [
		'Candidate Product',
		'C1 Request Count',
		'C2 Unique Requester',
		'C3 Avg Likes',
		'C4 Recent Ratio'
	];

	const rows: (string | number)[][] = leaderboard.decisionMatrix.rows.map((r) => [
		r.productName,
		r.c1RequestCount,
		r.c2UniqueRequester,
		formatMatrixDecimal(r.c3AverageRequestLikes),
		formatMatrixDecimal(r.c4RecentRequestRatio)
	]);

	// Append max values row
	const max = leaderboard.decisionMatrix.maxValues;
	rows.push([
		'max(Xj)',
		max.c1,
		max.c2,
		formatMatrixDecimal(max.c3),
		formatMatrixDecimal(max.c4)
	]);

	return generateCsv(headers, rows);
}

/**
 * Generates CSV for Table 2: Normalized Matrix (Rij).
 */
export function generateNormalizedMatrixCsv(leaderboard: RankingLeaderboard): string {
	const headers = [
		'Candidate Product',
		'R1 (C1)',
		'R2 (C2)',
		'R3 (C3)',
		'R4 (C4)'
	];

	const rows: (string | number)[][] = leaderboard.normalizedMatrix.rows.map((r) => [
		r.productName,
		formatMatrixDecimal(r.r1),
		formatMatrixDecimal(r.r2),
		formatMatrixDecimal(r.r3),
		formatMatrixDecimal(r.r4)
	]);

	return generateCsv(headers, rows);
}

/**
 * Generates CSV for Table 3: Weighted Matrix (Wj * Rij).
 */
export function generateWeightedMatrixCsv(leaderboard: RankingLeaderboard): string {
	const headers = [
		'Candidate Product',
		'W1*R1',
		'W2*R2',
		'W3*R3',
		'W4*R4',
		'Preference Value Vi'
	];

	const rows: (string | number)[][] = leaderboard.weightedMatrix.rows.map((r) => [
		r.productName,
		formatMatrixDecimal(r.w1),
		formatMatrixDecimal(r.w2),
		formatMatrixDecimal(r.w3),
		formatMatrixDecimal(r.w4),
		formatMatrixDecimal(r.preferenceValue)
	]);

	return generateCsv(headers, rows);
}

/**
 * Generates CSV for Table 4: Final Ranking Leaderboard with comprehensive metrics.
 */
export function generateFinalRankingCsv(leaderboard: RankingLeaderboard): string {
	const headers = [
		'Rank',
		'Candidate Product',
		'C1 (Decision Matrix)',
		'C2 (Decision Matrix)',
		'C3 (Decision Matrix)',
		'C4 (Decision Matrix)',
		'R1',
		'R2',
		'R3',
		'R4',
		'Preference Value Vi'
	];

	const dmMap = new Map(leaderboard.decisionMatrix.rows.map((d) => [d.productId, d]));
	const nmMap = new Map(leaderboard.normalizedMatrix.rows.map((n) => [n.productId, n]));

	const rows: (string | number)[][] = leaderboard.rankings.map((r) => {
		const dmRow = dmMap.get(r.productId);
		const nmRow = nmMap.get(r.productId);

		return [
			r.rank,
			r.productName,
			dmRow?.c1RequestCount ?? r.requestCount,
			dmRow?.c2UniqueRequester ?? r.uniqueRequester,
			formatMatrixDecimal(dmRow?.c3AverageRequestLikes ?? r.averageRequestLikes),
			formatMatrixDecimal(dmRow?.c4RecentRequestRatio ?? r.recentRequestRatio),
			formatMatrixDecimal(nmRow?.r1 ?? r.normalizedRequestCount),
			formatMatrixDecimal(nmRow?.r2 ?? r.normalizedUniqueRequester),
			formatMatrixDecimal(nmRow?.r3 ?? r.normalizedAverageLikes),
			formatMatrixDecimal(nmRow?.r4 ?? r.normalizedRecentRequestRatio),
			formatMatrixDecimal(r.preferenceValue)
		];
	});

	return generateCsv(headers, rows);
}

/**
 * Generates CSV for Comment Audit Table (all comments with candidate product mentions & request status).
 */
export function generateCommentAuditCsv(
	comments: CommentWithMatches[],
	products: CandidateProduct[]
): string {
	const headers = [
		'Author',
		'Published At',
		'Comment Text',
		'Candidate Products',
		'Product Keywords',
		'Request Keywords',
		'Status',
		'Likes'
	];

	const productMap = new Map(products.map((p) => [p.id, p.name]));

	const rows: (string | number)[][] = comments.map((comment) => {
		const matches = comment.matches || [];

		// Candidate products
		const detectedProductNames = Array.from(
			new Set(matches.map((m) => productMap.get(m.productId) || m.productId).filter(Boolean))
		);
		const productCol = detectedProductNames.length > 0 ? detectedProductNames.join('; ') : '-';

		// Product keywords
		const productKeywords = Array.from(
			new Set(matches.map((m) => m.matchedProductKeyword).filter(Boolean))
		);
		const prodKwCol = productKeywords.length > 0 ? productKeywords.join('; ') : '-';

		// Request keywords
		const requestKeywords = Array.from(
			new Set(matches.map((m) => m.matchedRequestKeyword).filter((k): k is string => Boolean(k)))
		);
		const reqKwCol = requestKeywords.length > 0 ? requestKeywords.join('; ') : '-';

		// Status
		let status: 'Request' | 'Mention' | 'Unmatched' = 'Unmatched';
		if (matches.some((m) => m.isRequest)) {
			status = 'Request';
		} else if (matches.length > 0) {
			status = 'Mention';
		}

		return [
			comment.authorName,
			comment.publishedAt,
			comment.text,
			productCol,
			prodKwCol,
			reqKwCol,
			status,
			comment.likeCount
		];
	});

	return generateCsv(headers, rows);
}
