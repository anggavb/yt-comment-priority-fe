import { describe, expect, it, beforeEach } from 'bun:test';
import { DualModeApiClient } from './client';
import { MockApiClient } from './mockClient';
import { HttpApiClient } from './httpClient';
import { MockService } from '$lib/mock/mockService';
import type { UpdateCriteriaDto } from '$lib/types';

describe('Criteria & C4 Time-Anchor Setup API Lifecycle (Issue #6)', () => {
	let mockService: MockService;
	let mockClient: MockApiClient;
	let httpClient: HttpApiClient;
	let client: DualModeApiClient;
	const testProjectId = 'proj-desk-setup-2026';

	beforeEach(() => {
		mockService = new MockService();
		mockClient = new MockApiClient(mockService);
		httpClient = new HttpApiClient('http://localhost:9999');
		client = new DualModeApiClient(mockClient, httpClient);
		client.setMode('mock');
	});

	it('fetches criteria list and initial C4 configuration for project', async () => {
		const res = await client.getCriteria(testProjectId);
		expect(res.criteria.length).toBe(4);

		const codes = res.criteria.map((c) => c.code);
		expect(codes).toContain('C1');
		expect(codes).toContain('C2');
		expect(codes).toContain('C3');
		expect(codes).toContain('C4');

		expect(res.c4Config).toBeDefined();
		expect(res.c4Config.daysWindow).toBe(30);
		expect(res.c4Config.anchorType).toBe('max_comment');
	});

	it('successfully updates criteria weights summing to 1.0 (100%)', async () => {
		const updateDto: UpdateCriteriaDto = {
			criteria: [
				{ code: 'C1', weight: 0.35 },
				{ code: 'C2', weight: 0.25 },
				{ code: 'C3', weight: 0.2 },
				{ code: 'C4', weight: 0.2 }
			]
		};

		const res = await client.updateCriteria(testProjectId, updateDto);
		const c1 = res.criteria.find((c) => c.code === 'C1');
		const c4 = res.criteria.find((c) => c.code === 'C4');
		expect(c1?.weight).toBe(0.35);
		expect(c4?.weight).toBe(0.2);

		const total = res.criteria.reduce((sum, c) => sum + c.weight, 0);
		expect(Number(total.toFixed(2))).toBe(1.0);
	});

	it('rejects criteria weight update if sum is not 100%', async () => {
		const updateDto: UpdateCriteriaDto = {
			criteria: [
				{ code: 'C1', weight: 0.4 },
				{ code: 'C2', weight: 0.4 },
				{ code: 'C3', weight: 0.3 },
				{ code: 'C4', weight: 0.2 }
			] // Total = 1.3 (130%)
		};

		expect(client.updateCriteria(testProjectId, updateDto)).rejects.toThrow(
			'Total bobot kriteria harus tepat 100%'
		);
	});

	it('rejects partial criteria update that breaks the 100% total weight sum invariant', async () => {
		// Attempting to update only C1 to 0.7 without balancing other criteria (leaving sum at 0.7 + 0.25 + 0.2 + 0.15 = 1.3)
		const partialDto: UpdateCriteriaDto = {
			criteria: [{ code: 'C1', weight: 0.7 }]
		};

		expect(client.updateCriteria(testProjectId, partialDto)).rejects.toThrow(
			'Total bobot kriteria harus tepat 100%'
		);

		// Verify rollback: C1 remains at its previous weight
		const current = await client.getCriteria(testProjectId);
		const c1 = current.criteria.find((c) => c.code === 'C1');
		expect(c1?.weight).toBe(0.4);
	});

	it('successfully updates C4 time-anchor configuration (ADR-0001)', async () => {
		const updateDto: UpdateCriteriaDto = {
			criteria: [
				{ code: 'C1', weight: 0.4 },
				{ code: 'C2', weight: 0.25 },
				{ code: 'C3', weight: 0.2 },
				{ code: 'C4', weight: 0.15 }
			],
			c4Config: {
				daysWindow: 45,
				anchorType: 'custom',
				customAnchorDate: '2026-02-01T00:00:00.000Z'
			}
		};

		const res = await client.updateCriteria(testProjectId, updateDto);
		expect(res.c4Config.daysWindow).toBe(45);
		expect(res.c4Config.anchorType).toBe('custom');
		expect(res.c4Config.customAnchorDate).toBe('2026-02-01T00:00:00.000Z');
	});

	it('rejects invalid C4 time-anchor configuration', async () => {
		const updateDto: UpdateCriteriaDto = {
			criteria: [
				{ code: 'C1', weight: 0.4 },
				{ code: 'C2', weight: 0.25 },
				{ code: 'C3', weight: 0.2 },
				{ code: 'C4', weight: 0.15 }
			],
			c4Config: {
				daysWindow: 0,
				anchorType: 'max_comment'
			}
		};

		expect(client.updateCriteria(testProjectId, updateDto)).rejects.toThrow(
			'Rentang hari C4 minimal harus 1 hari.'
		);
	});

	it('propagates updated weights and C4 into subsequent SAW rankings calculation', async () => {
		// Set C1 to very high weight (0.7) and others low
		await client.updateCriteria(testProjectId, {
			criteria: [
				{ code: 'C1', weight: 0.7 },
				{ code: 'C2', weight: 0.1 },
				{ code: 'C3', weight: 0.1 },
				{ code: 'C4', weight: 0.1 }
			]
		});

		const leaderboard = await client.calculateRanking(testProjectId);
		expect(leaderboard.criteriaWeights.C1).toBe(0.7);
		expect(leaderboard.criteriaWeights.C2).toBe(0.1);
		expect(leaderboard.criteriaWeights.C3).toBe(0.1);
		expect(leaderboard.criteriaWeights.C4).toBe(0.1);
	});
});
