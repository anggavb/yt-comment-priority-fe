import { describe, expect, it } from 'bun:test';
import { HttpApiClient } from './httpClient';
import type { CriteriaCode } from '$lib/types';

describe('Ranking Response Adaptation Bug', () => {
	it('reproduces exact TypeError: Cannot read properties of undefined (reading C1)', async () => {
		// Real backend response format from Elysia backend (POST /projects/:id/calculate-ranking & GET /projects/:id/rankings)
		const backendResponse = {
			analysisProjectId: 'b221f4aa-0a52-46d4-8d31-3aae955560fb',
			calculatedAt: '2026-09-07T15:15:13.017Z',
			status: 'ranked',
			weights: {
				c1: 0.4,
				c2: 0.25,
				c3: 0.2,
				c4: 0.15
			},
			c4Config: {
				daysWindow: 30,
				anchorType: 'max_comment',
				customAnchorDate: null
			},
			matrixDecision: {
				'7024e3ea-a6c3-4139-ac13-3fd4c0061588': {
					c1: 150,
					c2: 150,
					c3: 44.4267,
					c4: 0.68
				},
				'b5de8b27-c6b7-4086-8d28-3ff247f6e9f3': {
					c1: 75,
					c2: 75,
					c3: 47.5467,
					c4: 0.68
				}
			},
			matrixNormalized: {
				'7024e3ea-a6c3-4139-ac13-3fd4c0061588': {
					c1: 1,
					c2: 1,
					c3: 0.9344,
					c4: 1
				},
				'b5de8b27-c6b7-4086-8d28-3ff247f6e9f3': {
					c1: 0.5,
					c2: 0.5,
					c3: 1,
					c4: 1
				}
			},
			matrixWeighted: {
				'7024e3ea-a6c3-4139-ac13-3fd4c0061588': {
					c1: 0.4,
					c2: 0.25,
					c3: 0.1869,
					c4: 0.15
				},
				'b5de8b27-c6b7-4086-8d28-3ff247f6e9f3': {
					c1: 0.2,
					c2: 0.125,
					c3: 0.2,
					c4: 0.15
				}
			},
			rankings: [
				{
					id: '5bb63c67-18c6-4b38-aa80-f9fa844eb83d',
					candidateProductId: '7024e3ea-a6c3-4139-ac13-3fd4c0061588',
					productName: 'Samsung',
					rank: 1,
					preferenceValue: 0.9869,
					c1Raw: 150,
					c2Raw: 150,
					c3Raw: 44.4267,
					c4Raw: 0.68
				},
				{
					id: '8c0e4484-5091-4651-aeb0-0b2b3ed272c5',
					candidateProductId: 'b5de8b27-c6b7-4086-8d28-3ff247f6e9f3',
					productName: 'Xiaomi',
					rank: 2,
					preferenceValue: 0.675,
					c1Raw: 75,
					c2Raw: 75,
					c3Raw: 47.5467,
					c4Raw: 0.68
				}
			]
		};

		const originalFetch = globalThis.fetch;
		globalThis.fetch = ((async () =>
			new Response(JSON.stringify(backendResponse), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})) as unknown) as typeof fetch;

		try {
			const client = new HttpApiClient('http://localhost:3000');
			const leaderboard = await client.calculateRanking('b221f4aa-0a52-46d4-8d31-3aae955560fb');

			// Simulating weightPct('C1') from +page.svelte:80
			function weightPct(code: CriteriaCode): string {
				if (!leaderboard) return '—';
				const w = leaderboard.criteriaWeights[code] ?? 0;
				return `${Math.round(w * 100)}%`;
			}

			// In unadapted code, leaderboard.criteriaWeights is undefined, so weightPct('C1') throws:
			// TypeError: Cannot read properties of undefined (reading 'C1')
			expect(leaderboard.criteriaWeights).toBeDefined();
			expect(weightPct('C1')).toBe('40%');
			expect(weightPct('C2')).toBe('25%');
			expect(weightPct('C3')).toBe('20%');
			expect(weightPct('C4')).toBe('15%');

			// Decision matrix rows and maxValues
			expect(leaderboard.decisionMatrix).toBeDefined();
			expect(leaderboard.decisionMatrix.rows.length).toBe(2);
			expect(leaderboard.decisionMatrix.rows[0].productName).toBe('Samsung');
			expect(leaderboard.decisionMatrix.rows[0].c1RequestCount).toBe(150);
			expect(leaderboard.decisionMatrix.maxValues.c1).toBe(150);

			// Normalized matrix rows
			expect(leaderboard.normalizedMatrix).toBeDefined();
			expect(leaderboard.normalizedMatrix.rows.length).toBe(2);
			expect(leaderboard.normalizedMatrix.rows[0].r1).toBe(1);

			// Weighted matrix rows
			expect(leaderboard.weightedMatrix).toBeDefined();
			expect(leaderboard.weightedMatrix.rows.length).toBe(2);
			expect(leaderboard.weightedMatrix.rows[0].preferenceValue).toBe(0.9869);

			// Rankings
			expect(leaderboard.rankings.length).toBe(2);
			expect(leaderboard.rankings[0].productId).toBe('7024e3ea-a6c3-4139-ac13-3fd4c0061588');
			expect(leaderboard.rankings[0].productName).toBe('Samsung');
			expect(leaderboard.rankings[0].rank).toBe(1);
			expect(leaderboard.rankings[0].preferenceValue).toBe(0.9869);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
