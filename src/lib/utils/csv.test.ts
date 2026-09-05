import { describe, it, expect } from 'bun:test';
import {
	escapeCsvCell,
	generateCsv,
	generateDecisionMatrixCsv,
	generateNormalizedMatrixCsv,
	generateWeightedMatrixCsv,
	generateFinalRankingCsv,
	generateCommentAuditCsv
} from './csv';
import type {
	CandidateProduct,
	CommentWithMatches,
	RankingLeaderboard
} from '$lib/types';

describe('CSV Utilities (Issue #8: Academic Thesis Export)', () => {
	describe('escapeCsvCell', () => {
		it('returns string representation of primitive values', () => {
			expect(escapeCsvCell('hello')).toBe('hello');
			expect(escapeCsvCell(42)).toBe('42');
			expect(escapeCsvCell(0)).toBe('0');
			expect(escapeCsvCell(null)).toBe('');
			expect(escapeCsvCell(undefined)).toBe('');
		});

		it('quotes and escapes values containing commas, quotes, or newlines', () => {
			expect(escapeCsvCell('Apple, Banana')).toBe('"Apple, Banana"');
			expect(escapeCsvCell('He said "hello"')).toBe('"He said ""hello"""');
			expect(escapeCsvCell('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
			expect(escapeCsvCell('Line 1\r\nLine 2')).toBe('"Line 1\r\nLine 2"');
		});
	});

	describe('generateCsv', () => {
		it('generates well-formed CSV with headers and rows', () => {
			const headers = ['Product', 'Score', 'Notes'];
			const rows = [
				['iPhone 15 Pro', 0.95, 'Great device, recommended'],
				['Samsung S24', 0.88, 'Solid choice']
			];

			const result = generateCsv(headers, rows);
			const lines = result.split('\r\n');
			expect(lines[0]).toBe('Product,Score,Notes');
			expect(lines[1]).toBe('iPhone 15 Pro,0.95,"Great device, recommended"');
			expect(lines[2]).toBe('Samsung S24,0.88,Solid choice');
		});
	});

	describe('Academic SAW Table Exports', () => {
		const mockLeaderboard: RankingLeaderboard = {
			analysisProjectId: 'proj-1',
			calculatedAt: '2026-09-01T12:00:00Z',
			criteriaWeights: {
				C1: 0.35,
				C2: 0.25,
				C3: 0.2,
				C4: 0.2
			},
			c4Config: {
				daysWindow: 30,
				anchorType: 'max_comment',
				customAnchorDate: null
			},
			decisionMatrix: {
				rows: [
					{
						productId: 'prod-1',
						productName: 'Sony WH-1000XM5',
						c1RequestCount: 15,
						c2UniqueRequester: 12,
						c3AverageRequestLikes: 8.5,
						c4RecentRequestRatio: 0.75
					},
					{
						productId: 'prod-2',
						productName: 'Bose QC Ultra',
						c1RequestCount: 10,
						c2UniqueRequester: 8,
						c3AverageRequestLikes: 4.25,
						c4RecentRequestRatio: 0.5
					}
				],
				maxValues: {
					c1: 15,
					c2: 12,
					c3: 8.5,
					c4: 0.75
				}
			},
			normalizedMatrix: {
				rows: [
					{
						productId: 'prod-1',
						productName: 'Sony WH-1000XM5',
						r1: 1.0,
						r2: 1.0,
						r3: 1.0,
						r4: 1.0
					},
					{
						productId: 'prod-2',
						productName: 'Bose QC Ultra',
						r1: 0.6667,
						r2: 0.6667,
						r3: 0.5,
						r4: 0.6667
					}
				]
			},
			weightedMatrix: {
				rows: [
					{
						productId: 'prod-1',
						productName: 'Sony WH-1000XM5',
						w1: 0.35,
						w2: 0.25,
						w3: 0.2,
						w4: 0.2,
						preferenceValue: 1.0
					},
					{
						productId: 'prod-2',
						productName: 'Bose QC Ultra',
						w1: 0.2333,
						w2: 0.1667,
						w3: 0.1,
						w4: 0.1333,
						preferenceValue: 0.6333
					}
				]
			},
			rankings: [
				{
					id: 'rank-1',
					analysisProjectId: 'proj-1',
					productId: 'prod-1',
					productName: 'Sony WH-1000XM5',
					requestCount: 15,
					uniqueRequester: 12,
					averageRequestLikes: 8.5,
					recentRequestRatio: 0.75,
					normalizedRequestCount: 1.0,
					normalizedUniqueRequester: 1.0,
					normalizedAverageLikes: 1.0,
					normalizedRecentRequestRatio: 1.0,
					preferenceValue: 1.0,
					rank: 1,
					calculatedAt: '2026-09-01T12:00:00Z'
				},
				{
					id: 'rank-2',
					analysisProjectId: 'proj-1',
					productId: 'prod-2',
					productName: 'Bose QC Ultra',
					requestCount: 10,
					uniqueRequester: 8,
					averageRequestLikes: 4.25,
					recentRequestRatio: 0.5,
					normalizedRequestCount: 0.6667,
					normalizedUniqueRequester: 0.6667,
					normalizedAverageLikes: 0.5,
					normalizedRecentRequestRatio: 0.6667,
					preferenceValue: 0.6333,
					rank: 2,
					calculatedAt: '2026-09-01T12:00:00Z'
				}
			]
		};

		it('exports Decision Matrix (Xij) with max(Xj) row', () => {
			const csv = generateDecisionMatrixCsv(mockLeaderboard);
			expect(csv).toContain('Candidate Product,C1 Request Count,C2 Unique Requester,C3 Avg Likes,C4 Recent Ratio');
			expect(csv).toContain('Sony WH-1000XM5,15,12,8.5000,0.7500');
			expect(csv).toContain('Bose QC Ultra,10,8,4.2500,0.5000');
			expect(csv).toContain('max(Xj),15,12,8.5000,0.7500');
		});

		it('exports Normalized Matrix (Rij)', () => {
			const csv = generateNormalizedMatrixCsv(mockLeaderboard);
			expect(csv).toContain('Candidate Product,R1 (C1),R2 (C2),R3 (C3),R4 (C4)');
			expect(csv).toContain('Sony WH-1000XM5,1.0000,1.0000,1.0000,1.0000');
			expect(csv).toContain('Bose QC Ultra,0.6667,0.6667,0.5000,0.6667');
		});

		it('exports Weighted Matrix (Wj * Rij)', () => {
			const csv = generateWeightedMatrixCsv(mockLeaderboard);
			expect(csv).toContain('Candidate Product,W1*R1,W2*R2,W3*R3,W4*R4,Preference Value Vi');
			expect(csv).toContain('Sony WH-1000XM5,0.3500,0.2500,0.2000,0.2000,1.0000');
			expect(csv).toContain('Bose QC Ultra,0.2333,0.1667,0.1000,0.1333,0.6333');
		});

		it('exports Final Ranking Leaderboard with academic columns', () => {
			const csv = generateFinalRankingCsv(mockLeaderboard);
			expect(csv).toContain('Rank,Candidate Product,C1 Raw,C2 Raw,C3 Raw,C4 Raw,R1,R2,R3,R4,Preference Value Vi');
			expect(csv).toContain('1,Sony WH-1000XM5,15,12,8.5000,0.7500,1.0000,1.0000,1.0000,1.0000,1.0000');
			expect(csv).toContain('2,Bose QC Ultra,10,8,4.2500,0.5000,0.6667,0.6667,0.5000,0.6667,0.6333');
		});
	});

	describe('generateCommentAuditCsv', () => {
		const mockProducts: CandidateProduct[] = [
			{
				id: 'prod-1',
				analysisProjectId: 'proj-1',
				name: 'Sony WH-1000XM5',
				keywords: [],
				createdAt: '',
				updatedAt: ''
			}
		];

		const mockComments: CommentWithMatches[] = [
			{
				id: 'c-1',
				youtubeVideoId: 'vid-1',
				youtubeCommentId: 'yt-1',
				authorChannelId: 'auth-1',
				authorName: 'Audiophile, User',
				text: 'Tolong review Sony XM5, dong!',
				likeCount: 14,
				publishedAt: '2026-08-15T10:00:00Z',
				createdAt: '2026-08-15T10:00:00Z',
				matches: [
					{
						id: 'm-1',
						commentId: 'c-1',
						productId: 'prod-1',
						matchedProductKeyword: 'sony xm5',
						matchedRequestKeyword: 'review',
						isMention: true,
						isRequest: true,
						createdAt: ''
					}
				]
			},
			{
				id: 'c-2',
				youtubeVideoId: 'vid-1',
				youtubeCommentId: 'yt-2',
				authorChannelId: 'auth-2',
				authorName: 'Plain Viewer',
				text: 'Video bagus banget bang',
				likeCount: 2,
				publishedAt: '2026-08-16T12:00:00Z',
				createdAt: '2026-08-16T12:00:00Z',
				matches: []
			}
		];

		it('exports comment audit table with accurate columns and escaping', () => {
			const csv = generateCommentAuditCsv(mockComments, mockProducts);
			expect(csv).toContain('Author,Published At,Comment Text,Detected Products,Product Keywords,Request Keywords,Status,Likes');
			expect(csv).toContain('"Audiophile, User",2026-08-15T10:00:00Z,"Tolong review Sony XM5, dong!",Sony WH-1000XM5,sony xm5,review,Request,14');
			expect(csv).toContain('Plain Viewer,2026-08-16T12:00:00Z,Video bagus banget bang,-,-,-,Unmatched,2');
		});
	});
});
