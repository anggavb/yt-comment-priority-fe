import { describe, expect, it } from 'bun:test';
import {
	preprocessText,
	containsWordBoundaryKeyword,
	findMatchedKeywords,
	matchComment,
	highlightMatchedKeywords
} from './commentProcessor';
import type { CandidateProduct, Comment, RequestKeyword } from '$lib/types';

describe('Comment Processing Engine - Preprocessing (ADR-0004 & FR-07)', () => {
	it('converts text to lowercase, trims whitespace, collapses multiple spaces, and strips punctuation', () => {
		const raw = '   Halo Bang!! Tolong REVIEW... Keychron V1 dong???   ';
		const cleaned = preprocessText(raw);
		expect(cleaned).toBe('halo bang tolong review keychron v1 dong');
	});

	it('handles empty or whitespace-only input gracefully', () => {
		expect(preprocessText('')).toBe('');
		expect(preprocessText('   \n\t   ')).toBe('');
	});

	it('cleans special punctuation symbols, tabs, and newlines', () => {
		const raw = 'Review:\n- Keychron K2\n- RK84 (Recomended!)';
		const cleaned = preprocessText(raw);
		expect(cleaned).toBe('review keychron k2 rk84 recomended');
	});
});

describe('Comment Processing Engine - Word Boundary Regex Matching (ADR-0004)', () => {
	it('matches single-word keywords accurately on word boundaries', () => {
		const clean = preprocessText('tolong review rk dong');
		expect(containsWordBoundaryKeyword(clean, 'rk')).toBe(true);
		expect(containsWordBoundaryKeyword(clean, 'review')).toBe(true);
		expect(containsWordBoundaryKeyword(clean, 'v1')).toBe(false);
	});

	it('matches multi-word keywords with word boundaries', () => {
		const clean = preprocessText('apakah keychron k2 pro worth it');
		expect(containsWordBoundaryKeyword(clean, 'keychron k2')).toBe(true);
		expect(containsWordBoundaryKeyword(clean, 'keychron k2 pro')).toBe(true);
		expect(containsWordBoundaryKeyword(clean, 'keychron v1')).toBe(false);
	});

	it('PREVENTS FALSE POSITIVES on substrings per ADR-0004 core decision', () => {
		// "pekerjaan" should NOT match "rk"
		const text1 = preprocessText('semoga lancar pekerjaannya bang');
		expect(containsWordBoundaryKeyword(text1, 'rk')).toBe(false);

		// "tesis" should NOT match "tes"
		const text2 = preprocessText('semangat ngerjain tesis akhir bang');
		expect(containsWordBoundaryKeyword(text2, 'tes')).toBe(false);

		// "preview" should NOT match "review"
		const text3 = preprocessText('bagus preview videonya');
		expect(containsWordBoundaryKeyword(text3, 'review')).toBe(false);

		// "keyboard" should NOT match "key"
		const text4 = preprocessText('rekomen keyboard apa bang');
		expect(containsWordBoundaryKeyword(text4, 'key')).toBe(false);

		// "v10" should NOT match "v1"
		const text5 = preprocessText('saya pakai v10 sekarang');
		expect(containsWordBoundaryKeyword(text5, 'v1')).toBe(false);
	});

	it('findMatchedKeywords returns all unique keywords found in text', () => {
		const clean = preprocessText('tolong bahas dan review keyboard rk 84');
		const keywords = ['review', 'bahas', 'coba', 'rk', 'rk 84', 'keychron'];
		const matched = findMatchedKeywords(clean, keywords);
		expect(matched).toContain('review');
		expect(matched).toContain('bahas');
		expect(matched).toContain('rk');
		expect(matched).toContain('rk 84');
		expect(matched).not.toContain('coba');
		expect(matched).not.toContain('keychron');
	});
});

describe('Comment Processing Engine - Comment Matching & 1:N Relations (Issue #5)', () => {
	const mockProducts: CandidateProduct[] = [
		{
			id: 'prod-1',
			analysisProjectId: 'proj-1',
			name: 'Keychron K2',
			keywords: [
				{ id: 'kw-1', productId: 'prod-1', keyword: 'keychron k2', createdAt: '' },
				{ id: 'kw-2', productId: 'prod-1', keyword: 'k2', createdAt: '' }
			],
			createdAt: '',
			updatedAt: ''
		},
		{
			id: 'prod-2',
			analysisProjectId: 'proj-1',
			name: 'RK84',
			keywords: [
				{ id: 'kw-3', productId: 'prod-2', keyword: 'rk84', createdAt: '' },
				{ id: 'kw-4', productId: 'prod-2', keyword: 'rk 84', createdAt: '' },
				{ id: 'kw-5', productId: 'prod-2', keyword: 'rk', createdAt: '' }
			],
			createdAt: '',
			updatedAt: ''
		},
		{
			id: 'prod-3',
			analysisProjectId: 'proj-1',
			name: 'Logitech MX Master 3S',
			keywords: [
				{ id: 'kw-6', productId: 'prod-3', keyword: 'mx master 3s', createdAt: '' },
				{ id: 'kw-7', productId: 'prod-3', keyword: 'logitech mx', createdAt: '' }
			],
			createdAt: '',
			updatedAt: ''
		}
	];

	const mockRequestKeywords: RequestKeyword[] = [
		{ id: 'req-1', keyword: 'review', createdAt: '' },
		{ id: 'req-2', keyword: 'bahas', createdAt: '' },
		{ id: 'req-3', keyword: 'spill', createdAt: '' }
	];

	const baseComment: Comment = {
		id: 'cmt-1',
		youtubeVideoId: 'vid-1',
		youtubeCommentId: 'yt-1',
		authorChannelId: 'auth-1',
		authorName: 'Budi Santoso',
		text: '',
		likeCount: 5,
		publishedAt: '2026-03-01T10:00:00Z',
		createdAt: '2026-03-01T10:00:00Z'
	};

	it('produces empty array when comment mentions no candidate products', () => {
		const comment: Comment = {
			...baseComment,
			text: 'Videonya bagus banget bang, sangat informatif!'
		};
		const matches = matchComment(comment, mockProducts, mockRequestKeywords);
		expect(matches.length).toBe(0);
	});

	it('creates Mention match without Request when product is mentioned without request keyword', () => {
		const comment: Comment = {
			...baseComment,
			text: 'Saya sudah pakai Keychron K2 selama 2 tahun dan awet.'
		};
		const matches = matchComment(comment, mockProducts, mockRequestKeywords);
		expect(matches.length).toBe(1);
		expect(matches[0].productId).toBe('prod-1');
		expect(matches[0].isMention).toBe(true);
		expect(matches[0].isRequest).toBe(false);
		expect(matches[0].matchedProductKeyword).toBe('keychron k2');
		expect(matches[0].matchedRequestKeyword).toBeNull();
	});

	it('creates Request match when product is mentioned with request keyword', () => {
		const comment: Comment = {
			...baseComment,
			text: 'Bang tolong review RK 84 dong, pengen beli buat ngetik.'
		};
		const matches = matchComment(comment, mockProducts, mockRequestKeywords);
		expect(matches.length).toBe(1);
		expect(matches[0].productId).toBe('prod-2');
		expect(matches[0].isMention).toBe(true);
		expect(matches[0].isRequest).toBe(true);
		expect(matches[0].matchedProductKeyword).toBe('rk 84');
		expect(matches[0].matchedRequestKeyword).toBe('review');
	});

	it('creates multiple CommentMatch records for multi-product comments (1:N relationship)', () => {
		const comment: Comment = {
			...baseComment,
			text: 'Bang, tolong bahas perbandingan Keychron K2 vs RK 84 dong mana yang lebih oke?'
		};
		const matches = matchComment(comment, mockProducts, mockRequestKeywords);

		// Must produce 2 separate match records for prod-1 and prod-2
		expect(matches.length).toBe(2);

		const k2Match = matches.find((m) => m.productId === 'prod-1');
		const rkMatch = matches.find((m) => m.productId === 'prod-2');

		expect(k2Match).toBeDefined();
		expect(k2Match?.isMention).toBe(true);
		expect(k2Match?.isRequest).toBe(true);
		expect(k2Match?.matchedRequestKeyword).toBe('bahas');

		expect(rkMatch).toBeDefined();
		expect(rkMatch?.isMention).toBe(true);
		expect(rkMatch?.isRequest).toBe(true);
		expect(rkMatch?.matchedRequestKeyword).toBe('bahas');
	});
});

describe('Comment Processing Engine - Keyword Text Highlighting (Issue #5)', () => {
	it('segments text accurately preserving original casing and punctuation', () => {
		const raw = 'Bang tolong Review Keychron K2 dong!';
		const segments = highlightMatchedKeywords(raw, ['Keychron K2'], ['Review']);

		// The joined text of all segments must strictly equal the raw text
		const reconstructed = segments.map((s) => s.text).join('');
		expect(reconstructed).toBe(raw);

		// Verify types
		const reviewSeg = segments.find((s) => s.type === 'request');
		expect(reviewSeg).toBeDefined();
		expect(reviewSeg?.text).toBe('Review');

		const productSeg = segments.find((s) => s.type === 'product');
		expect(productSeg).toBeDefined();
		expect(productSeg?.text).toBe('Keychron K2');
	});

	it('handles comment without matches as single text segment', () => {
		const raw = 'Terima kasih banyak atas kontennya bang.';
		const segments = highlightMatchedKeywords(raw, [], []);
		expect(segments.length).toBe(1);
		expect(segments[0]).toEqual({ text: raw, type: 'text' });
	});

	it('correctly handles word boundary when highlighting to prevent substring highlight', () => {
		const raw = 'Semoga lancar pekerjaannya bang!';
		// "rk" should NOT be highlighted within "pekerjaannya"
		const segments = highlightMatchedKeywords(raw, ['rk'], []);
		expect(segments.length).toBe(1);
		expect(segments[0].type).toBe('text');
	});
});
