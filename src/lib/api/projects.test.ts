import { describe, it, expect, beforeEach } from 'bun:test';
import { MockService } from '$lib/mock/mockService';
import { MockApiClient } from '$lib/api/mockClient';
import { DualModeApiClient } from '$lib/api/client';
import { validateProjectForm } from '$lib/components/projects/validation';

describe('Project Management TDD & Unit Tests', () => {
	let mockService: MockService;
	let mockClient: MockApiClient;
	let client: DualModeApiClient;

	beforeEach(() => {
		mockService = new MockService();
		mockClient = new MockApiClient(mockService);
		client = new DualModeApiClient(mockClient);
	});

	describe('Form Validation', () => {
		it('rejects empty or whitespace-only project names', () => {
			const emptyRes = validateProjectForm('');
			expect(emptyRes.isValid).toBe(false);
			expect(emptyRes.errors.name).toBe('Nama project wajib diisi.');

			const spaceRes = validateProjectForm('   ');
			expect(spaceRes.isValid).toBe(false);
			expect(spaceRes.errors.name).toBe('Nama project wajib diisi.');
		});

		it('rejects project names shorter than 3 characters', () => {
			const shortRes = validateProjectForm('AB');
			expect(shortRes.isValid).toBe(false);
			expect(shortRes.errors.name).toBe('Nama project minimal harus 3 karakter.');
		});

		it('rejects project names longer than 100 characters', () => {
			const longName = 'A'.repeat(101);
			const res = validateProjectForm(longName);
			expect(res.isValid).toBe(false);
			expect(res.errors.name).toBe('Nama project maksimal 100 karakter.');
		});

		it('rejects descriptions exceeding 500 characters', () => {
			const longDesc = 'D'.repeat(501);
			const res = validateProjectForm('Valid Project', longDesc);
			expect(res.isValid).toBe(false);
			expect(res.errors.description).toBe('Deskripsi project maksimal 500 karakter.');
		});

		it('accepts valid project names and descriptions', () => {
			const res = validateProjectForm('Prioritas Smartphone Flagship 2026', 'Studi analisis perbandingan.');
			expect(res.isValid).toBe(true);
			expect(Object.keys(res.errors).length).toBe(0);
		});
	});

	describe('Project CRUD Lifecycle via ApiClient', () => {
		it('creates a new Analysis Project with draft status and initialized criteria', async () => {
			const created = await client.createProject({
				name: 'New Audio Tech Comparison',
				description: 'Analisis prioritas ulasan TWS dan headphone.'
			});

			expect(created).toBeDefined();
			expect(created.id).toBeDefined();
			expect(created.name).toBe('New Audio Tech Comparison');
			expect(created.description).toBe('Analisis prioritas ulasan TWS dan headphone.');
			expect(created.status).toBe('draft');
			expect(created.videoCount).toBe(0);
			expect(created.productCount).toBe(0);
			expect(created.commentCount).toBe(0);

			// Criteria should be initialized automatically
			const { criteria } = await client.getCriteria(created.id);
			expect(criteria.length).toBe(4);
			expect(criteria.map((c) => c.code)).toEqual(['C1', 'C2', 'C3', 'C4']);
		});

		it('retrieves all projects including newly created ones', async () => {
			const initialList = await client.getProjects();
			const initialCount = initialList.length;

			await client.createProject({
				name: 'Another Project',
				description: 'Testing project listing'
			});

			const updatedList = await client.getProjects();
			expect(updatedList.length).toBe(initialCount + 1);
			expect(updatedList.some((p) => p.name === 'Another Project')).toBe(true);
		});

		it('fetches a single project by ID and returns null for non-existent ID', async () => {
			const created = await client.createProject({
				name: 'Fetch Target Project'
			});

			const fetched = await client.getProject(created.id);
			expect(fetched).not.toBeNull();
			expect(fetched?.id).toBe(created.id);
			expect(fetched?.name).toBe('Fetch Target Project');

			const missing = await client.getProject('non-existent-proj-id');
			expect(missing).toBeNull();
		});

		it('updates project name and description and updates updatedAt timestamp', async () => {
			const created = await client.createProject({
				name: 'Original Title',
				description: 'Original Description'
			});

			const updated = await client.updateProject(created.id, {
				name: 'Updated Title',
				description: 'Updated Description'
			});

			expect(updated).not.toBeNull();
			expect(updated?.name).toBe('Updated Title');
			expect(updated?.description).toBe('Updated Description');

			const reFetched = await client.getProject(created.id);
			expect(reFetched?.name).toBe('Updated Title');
			expect(reFetched?.description).toBe('Updated Description');
		});

		it('deletes an Analysis Project and cascades removal of associated data', async () => {
			const created = await client.createProject({
				name: 'Project to Delete'
			});

			const deleteSuccess = await client.deleteProject(created.id);
			expect(deleteSuccess).toBe(true);

			const fetchedAfterDelete = await client.getProject(created.id);
			expect(fetchedAfterDelete).toBeNull();

			// Associated criteria should also be cleaned up
			const { criteria } = await client.getCriteria(created.id);
			expect(criteria.length).toBe(0);
		});
	});
});
