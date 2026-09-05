/**
 * Comment Processing Engine
 * Rule-based text preprocessing, word boundary matching (ADR-0004),
 * multi-product 1:N comment matching, and keyword highlighting.
 */

import type {
	CandidateProduct,
	Comment,
	CommentAuditSummary,
	CommentMatch,
	RequestKeyword
} from '$lib/types';

export interface TextSegment {
	text: string;
	type: 'text' | 'product' | 'request';
	keyword?: string;
}

export function escapeRegex(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Text Preprocessing per FR-07 and ADR-0004:
 * Converts to lowercase, strips punctuation by replacing with space,
 * collapses multiple whitespaces, and trims leading/trailing whitespace.
 */
export function preprocessText(text: string): string {
	if (!text) return '';
	return text
		.toLowerCase()
		.replace(/[^\w\s]/g, ' ') // replace punctuation with space
		.replace(/\s+/g, ' ') // collapse multiple whitespaces
		.trim();
}

/**
 * Word boundary keyword matching per ADR-0004:
 * Uses \b<keyword>\b regex against preprocessed text to prevent substring false positives
 * (e.g. "rk" matching "pekerjaan" or "tes" matching "tesis").
 */
export function containsWordBoundaryKeyword(cleanText: string, keyword: string): boolean {
	const cleanKw = preprocessText(keyword);
	if (!cleanKw) return false;
	const regex = new RegExp(`\\b${escapeRegex(cleanKw)}\\b`, 'i');
	return regex.test(cleanText);
}

/**
 * Finds all unique keywords matching in the clean text using word boundaries.
 */
export function findMatchedKeywords(cleanText: string, keywords: string[]): string[] {
	const matched: string[] = [];
	for (const kw of keywords) {
		if (containsWordBoundaryKeyword(cleanText, kw)) {
			matched.push(kw);
		}
	}
	return matched;
}

/**
 * Evaluates a single comment against candidate products and request keywords.
 * Produces a separate CommentMatch for each matched candidate product (1:N relationship).
 */
export function matchComment(
	comment: Comment,
	products: CandidateProduct[],
	requestKeywords: RequestKeyword[]
): CommentMatch[] {
	const cleanText = preprocessText(comment.text);
	if (!cleanText) return [];

	const matches: CommentMatch[] = [];

	// Determine matched request keyword if present
	let matchedRequestKw: string | null = null;
	// Sort request keywords by length descending to match compound phrases before single words
	const sortedRequestKeywords = [...requestKeywords].sort(
		(a, b) => b.keyword.length - a.keyword.length
	);

	for (const reqKw of sortedRequestKeywords) {
		if (containsWordBoundaryKeyword(cleanText, reqKw.keyword)) {
			matchedRequestKw = reqKw.keyword;
			break;
		}
	}

	// Check each product
	for (const product of products) {
		let matchedProdKw: string | null = null;

		// Check Product Keywords, preferring longer keywords first to avoid greedy shorter prefix
		const sortedProductKeywords = [...(product.keywords || [])].sort(
			(a, b) => b.keyword.length - a.keyword.length
		);

		for (const keywordItem of sortedProductKeywords) {
			if (containsWordBoundaryKeyword(cleanText, keywordItem.keyword)) {
				matchedProdKw = keywordItem.keyword;
				break;
			}
		}

		if (matchedProdKw) {
			const isRequest = matchedRequestKw !== null;
			matches.push({
				id: `match-${comment.id}-${product.id}`,
				commentId: comment.id,
				productId: product.id,
				matchedProductKeyword: matchedProdKw,
				matchedRequestKeyword: matchedRequestKw,
				isMention: true,
				isRequest,
				createdAt: new Date().toISOString(),
				comment,
				product
			});
		}
	}

	return matches;
}

/**
 * Processes an entire collection of comments for an Analysis Project.
 */
export function processProjectComments(
	comments: Comment[],
	products: CandidateProduct[],
	requestKeywords: RequestKeyword[]
): {
	matches: CommentMatch[];
	summary: CommentAuditSummary;
} {
	const allMatches: CommentMatch[] = [];
	const matchedCommentIds = new Set<string>();
	const requestCommentIds = new Set<string>();

	for (const comment of comments) {
		const commentMatches = matchComment(comment, products, requestKeywords);
		if (commentMatches.length > 0) {
			matchedCommentIds.add(comment.id);
			if (commentMatches.some((m) => m.isRequest)) {
				requestCommentIds.add(comment.id);
			}
			allMatches.push(...commentMatches);
		}
	}

	const summary: CommentAuditSummary = {
		totalComments: comments.length,
		matchedComments: matchedCommentIds.size,
		requestComments: requestCommentIds.size,
		unmatchedComments: Math.max(0, comments.length - matchedCommentIds.size)
	};

	return {
		matches: allMatches,
		summary
	};
}

interface RawMatchRange {
	start: number;
	end: number;
	type: 'product' | 'request';
	keyword: string;
}

/**
 * Segments raw comment text into ordered segments of plain text,
 * highlighted product keywords, and highlighted request keywords.
 * Preserves exact original capitalization and punctuation while strictly
 * respecting word boundaries so substring false positives are prevented.
 */
export function highlightMatchedKeywords(
	rawText: string,
	productKeywords: string[],
	requestKeywords: string[]
): TextSegment[] {
	if (!rawText) return [];

	const rawMatches: RawMatchRange[] = [];

	// Helper to find all word boundary matches for a list of keywords
	function findRanges(keywords: string[], type: 'product' | 'request') {
		for (const kw of keywords) {
			const clean = kw.trim();
			if (!clean) continue;

			// Word boundary regex on raw text
			// \b handles alphanumeric boundaries; for multi-word, \bword1 word2\b
			const pattern = new RegExp(`\\b${escapeRegex(clean)}\\b`, 'gi');
			let match: RegExpExecArray | null;

			while ((match = pattern.exec(rawText)) !== null) {
				rawMatches.push({
					start: match.index,
					end: match.index + match[0].length,
					type,
					keyword: clean
				});
			}
		}
	}

	findRanges(productKeywords, 'product');
	findRanges(requestKeywords, 'request');

	if (rawMatches.length === 0) {
		return [{ text: rawText, type: 'text' }];
	}

	// Sort by start index ascending, then length descending
	rawMatches.sort((a, b) => {
		if (a.start !== b.start) return a.start - b.start;
		return (b.end - b.start) - (a.end - a.start);
	});

	// Filter out overlapping ranges (keep the first/longest)
	const nonOverlapping: RawMatchRange[] = [];
	let lastEnd = 0;

	for (const m of rawMatches) {
		if (m.start >= lastEnd) {
			nonOverlapping.push(m);
			lastEnd = m.end;
		}
	}

	// Slice rawText into interleaved segments
	const segments: TextSegment[] = [];
	let currentIndex = 0;

	for (const range of nonOverlapping) {
		if (range.start > currentIndex) {
			segments.push({
				text: rawText.slice(currentIndex, range.start),
				type: 'text'
			});
		}

		segments.push({
			text: rawText.slice(range.start, range.end),
			type: range.type,
			keyword: range.keyword
		});

		currentIndex = range.end;
	}

	if (currentIndex < rawText.length) {
		segments.push({
			text: rawText.slice(currentIndex),
			type: 'text'
		});
	}

	return segments;
}
