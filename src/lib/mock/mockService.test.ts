import { describe, expect, it, beforeEach } from 'bun:test';
import {
	MockService,
	preprocessText,
	containsWordBoundaryKeyword
} from './mockService';

describe('Text Preprocessing and Word Boundary Regex (ADR-0004)', () => {
	it('normalizes lowercase, whitespace, and removes punctuation', () => {
		const raw = '  Bang REVIEW Keychron V1 dong!!!   ';
		const cleaned = preprocessText(raw);
		expect(cleaned).toBe('bang review keychron v1 dong');
	});

	it('matches exact word boundary keywords', () => {
		const clean = preprocessText('bang review keychron v1 dong');
		expect(containsWordBoundaryKeyword(clean, 'keychron v1')).toBe(true);
		expect(containsWordBoundaryKeyword(clean, 'review')).toBe(true);
		expect(containsWordBoundaryKeyword(clean, 'rk84')).toBe(false);
	});

	it('prevents false positives on substring matches (ADR-0004 core requirement)', () => {
		// "pekerjaan" should NOT match "rk"
		const text1 = preprocessText('semoga lancar pekerjaannya bang');
		expect(containsWordBoundaryKeyword(text1, 'rk')).toBe(false);

		// "tesis" should NOT match "tes"
		const text2 = preprocessText('lagi ngerjain tesis akhir');
		expect(containsWordBoundaryKeyword(text2, 'tes')).toBe(false);

		// exact "rk" or "tes" should match
		const text3 = preprocessText('coba tes rk 84');
		expect(containsWordBoundaryKeyword(text3, 'tes')).toBe(true);
		expect(containsWordBoundaryKeyword(text3, 'rk 84')).toBe(true);
	});
});

describe('MockService Data & Operations', () => {
	let service: MockService;

	beforeEach(() => {
		service = new MockService();
	});

	it('initializes with default projects and realistic data', async () => {
		const projects = await service.getProjects();
		expect(projects.length).toBeGreaterThanOrEqual(1);

		const defaultProject = await service.getProject('proj-desk-setup-2026');
		expect(defaultProject).toBeDefined();
		expect(defaultProject?.name).toContain('Prioritas Review');
	});

	it('retrieves candidate products and request keywords', async () => {
		const products = await service.getProducts('proj-desk-setup-2026');
		expect(products.length).toBe(5);

		const reqKeywords = await service.getRequestKeywords();
		expect(reqKeywords.length).toBeGreaterThanOrEqual(10);
		expect(reqKeywords.some((k) => k.keyword === 'review')).toBe(true);
	});

	it('processes comments and produces comment matches', async () => {
		const result = await service.processComments('proj-desk-setup-2026');
		expect(result.processedCount).toBeGreaterThan(0);
		expect(result.matchesFound).toBeGreaterThan(0);
		expect(result.summary.totalComments).toBe(result.processedCount);
		expect(result.summary.matchedComments).toBeGreaterThan(0);
		expect(result.summary.requestComments).toBeGreaterThan(0);
	});

	it('calculates SAW rankings with valid mathematical consistency (ADR-0001, ADR-0003)', async () => {
		const leaderboard = await service.calculateRanking('proj-desk-setup-2026');
		expect(leaderboard.rankings.length).toBe(5);

		// Check Decision Matrix
		expect(leaderboard.decisionMatrix.rows.length).toBe(5);
		expect(leaderboard.decisionMatrix.maxValues.c1).toBeGreaterThan(0);

		// Check Normalized Matrix (values between 0 and 1)
		for (const normRow of leaderboard.normalizedMatrix.rows) {
			expect(normRow.r1).toBeGreaterThanOrEqual(0);
			expect(normRow.r1).toBeLessThanOrEqual(1);
			expect(normRow.r2).toBeGreaterThanOrEqual(0);
			expect(normRow.r2).toBeLessThanOrEqual(1);
			expect(normRow.r3).toBeGreaterThanOrEqual(0);
			expect(normRow.r3).toBeLessThanOrEqual(1);
			expect(normRow.r4).toBeGreaterThanOrEqual(0);
			expect(normRow.r4).toBeLessThanOrEqual(1);
		}

		// Check Weighted Matrix & Final Scores (descending order)
		const scores = leaderboard.rankings.map((r) => r.finalScore);
		for (let i = 0; i < scores.length - 1; i++) {
			expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
		}

		// Verify rank numbers 1 to 5
		expect(leaderboard.rankings[0].rank).toBe(1);
		expect(leaderboard.rankings[4].rank).toBe(5);
	});

	it('supports project CRUD lifecycle', async () => {
		const created = await service.createProject({
			name: 'Proyek Uji Coba Baru',
			description: 'Deskripsi uji coba'
		});
		expect(created.id).toBeDefined();
		expect(created.name).toBe('Proyek Uji Coba Baru');

		const updated = await service.updateProject(created.id, {
			name: 'Proyek Uji Coba Diedit'
		});
		expect(updated?.name).toBe('Proyek Uji Coba Diedit');

		const deleted = await service.deleteProject(created.id);
		expect(deleted).toBe(true);

		const fetched = await service.getProject(created.id);
		expect(fetched).toBeNull();
	});
});
