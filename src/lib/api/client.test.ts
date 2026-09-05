import { describe, expect, it, beforeEach } from 'bun:test';
import { DualModeApiClient, connectionStore } from './client';
import { MockApiClient } from './mockClient';
import { HttpApiClient } from './httpClient';
import { MockService } from '$lib/mock/mockService';

describe('DualModeApiClient and Adapter Architecture', () => {
	let mockService: MockService;
	let mockClient: MockApiClient;
	let httpClient: HttpApiClient;
	let client: DualModeApiClient;

	beforeEach(() => {
		mockService = new MockService();
		mockClient = new MockApiClient(mockService);
		httpClient = new HttpApiClient('http://localhost:9999'); // Unused port to simulate offline backend
		client = new DualModeApiClient(mockClient, httpClient);
		client.setMode('mock');
	});

	it('defaults to mock mode and fetches mock projects successfully', async () => {
		expect(client.mode).toBe('mock');
		const projects = await client.getProjects();
		expect(projects.length).toBeGreaterThan(0);
		expect(projects[0].id).toBe('proj-desk-setup-2026');
	});

	it('supports runtime mode switching', () => {
		client.setMode('live');
		expect(client.mode).toBe('live');
		expect(connectionStore.state.mode).toBe('live');

		client.setMode('mock');
		expect(client.mode).toBe('mock');
		expect(connectionStore.state.mode).toBe('mock');
	});

	it('falls back gracefully to mock data when live mode backend is unreachable', async () => {
		client.setMode('live');
		expect(client.mode).toBe('live');

		// In live mode with backend offline at port 9999, getProjects should NOT throw;
		// it should fall back to mock data and flag fallbackActive
		const projects = await client.getProjects();
		expect(projects).toBeDefined();
		expect(projects.length).toBeGreaterThan(0);

		// Verify state indicates fallback and offline status
		expect(connectionStore.state.fallbackActive).toBe(true);
		expect(connectionStore.state.health.status).toBe('offline');
		expect(connectionStore.state.lastError).toBeDefined();
	});

	it('successfully performs candidate product management in mock mode', async () => {
		client.setMode('mock');
		const initial = await client.getProducts('proj-desk-setup-2026');
		const initialCount = initial.length;

		const created = await client.createProduct('proj-desk-setup-2026', {
			name: 'NuPhy Air75 V2',
			description: 'Low-profile wireless mechanical keyboard',
			keywords: ['nuphy air75', 'air75 v2']
		});

		expect(created.name).toBe('NuPhy Air75 V2');
		expect(created.keywords.length).toBe(2);

		const updatedList = await client.getProducts('proj-desk-setup-2026');
		expect(updatedList.length).toBe(initialCount + 1);

		// Clean up
		await client.deleteProduct(created.id);
		const finalList = await client.getProducts('proj-desk-setup-2026');
		expect(finalList.length).toBe(initialCount);
	});

	it('fetches criteria and ranking leaderboard with complete SAW breakdown', async () => {
		client.setMode('mock');
		const { criteria, c4Config } = await client.getCriteria('proj-desk-setup-2026');
		expect(criteria.length).toBe(4);
		expect(c4Config.daysWindow).toBe(30);

		const leaderboard = await client.calculateRanking('proj-desk-setup-2026');
		expect(leaderboard.rankings.length).toBe(5);
		expect(leaderboard.rankings[0].preferenceValue).toBeGreaterThan(0);
		expect(leaderboard.decisionMatrix).toBeDefined();
		expect(leaderboard.normalizedMatrix).toBeDefined();
		expect(leaderboard.weightedMatrix).toBeDefined();
	});
});
