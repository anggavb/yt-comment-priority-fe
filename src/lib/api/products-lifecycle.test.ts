import { describe, it, expect, beforeEach } from 'bun:test';
import { MockService } from '$lib/mock/mockService';
import { MockApiClient } from './mockClient';

describe('Candidate Products & Keywords API Lifecycle (Issue #4)', () => {
	let service: MockService;
	let client: MockApiClient;
	const projectId = 'proj-desk-setup-2026';

	beforeEach(() => {
		service = new MockService();
		client = new MockApiClient(service);
	});

	describe('Candidate Product CRUD', () => {
		it('fetches existing candidate products for a project', async () => {
			const products = await client.getProducts(projectId);
			expect(Array.isArray(products)).toBe(true);
			expect(products.length).toBe(5);
			expect(products[0].name).toBe('Keychron V1');
			expect(products[0].keywords.length).toBeGreaterThan(0);
		});

		it('creates a new candidate product with custom initial keywords', async () => {
			const newProduct = await client.createProduct(projectId, {
				name: 'NuPhy Air75 V2',
				description: 'Low-profile wireless mechanical keyboard',
				keywords: ['nuphy air75', 'air75 v2', 'nuphy air 75']
			});

			expect(newProduct.id).toBeDefined();
			expect(newProduct.name).toBe('NuPhy Air75 V2');
			expect(newProduct.description).toBe('Low-profile wireless mechanical keyboard');
			expect(newProduct.keywords.length).toBe(3);
			expect(newProduct.keywords.map((k) => k.keyword)).toContain('nuphy air75');

			const all = await client.getProducts(projectId);
			expect(all.length).toBe(6);
			expect(all.some((p) => p.id === newProduct.id)).toBe(true);
		});

		it('creates a candidate product defaulting keyword to product name when none provided', async () => {
			const newProduct = await client.createProduct(projectId, {
				name: 'Corsair K70'
			});

			expect(newProduct.keywords.length).toBe(1);
			expect(newProduct.keywords[0].keyword).toBe('corsair k70');
		});

		it('updates candidate product name and description', async () => {
			const products = await client.getProducts(projectId);
			const target = products[0];

			const updated = await client.updateProduct(target.id, {
				name: 'Keychron V1 Knob Edition',
				description: 'Updated description with rotary knob'
			});

			expect(updated).not.toBeNull();
			expect(updated?.name).toBe('Keychron V1 Knob Edition');
			expect(updated?.description).toBe('Updated description with rotary knob');

			const refreshed = await client.getProducts(projectId);
			const found = refreshed.find((p) => p.id === target.id);
			expect(found?.name).toBe('Keychron V1 Knob Edition');
		});

		it('deletes a candidate product and removes it from project', async () => {
			const products = await client.getProducts(projectId);
			const initialCount = products.length;
			const target = products[0];

			const deleted = await client.deleteProduct(target.id);
			expect(deleted).toBe(true);

			const after = await client.getProducts(projectId);
			expect(after.length).toBe(initialCount - 1);
			expect(after.some((p) => p.id === target.id)).toBe(false);
		});
	});

	describe('Product Keywords Management', () => {
		it('adds a new keyword to an existing product', async () => {
			const products = await client.getProducts(projectId);
			const target = products[0];
			const initialKwCount = target.keywords.length;

			const added = await client.addProductKeyword(target.id, 'keychron 75');
			expect(added).not.toBeNull();
			expect(added?.keyword).toBe('keychron 75');

			const refreshed = await client.getProducts(projectId);
			const found = refreshed.find((p) => p.id === target.id);
			expect(found?.keywords.length).toBe(initialKwCount + 1);
			expect(found?.keywords.some((k) => k.keyword === 'keychron 75')).toBe(true);
		});

		it('does not duplicate existing keyword when adding', async () => {
			const products = await client.getProducts(projectId);
			const target = products[0];
			const initialKwCount = target.keywords.length;
			const existingKw = target.keywords[0].keyword;

			const result = await client.addProductKeyword(target.id, existingKw.toUpperCase());
			expect(result?.keyword).toBe(existingKw.toLowerCase());

			const refreshed = await client.getProducts(projectId);
			const found = refreshed.find((p) => p.id === target.id);
			expect(found?.keywords.length).toBe(initialKwCount);
		});

		it('deletes a product keyword by keyword ID', async () => {
			const products = await client.getProducts(projectId);
			const target = products[0];
			const kwToDelete = target.keywords[0];

			const success = await client.deleteProductKeyword(kwToDelete.id);
			expect(success).toBe(true);

			const refreshed = await client.getProducts(projectId);
			const found = refreshed.find((p) => p.id === target.id);
			expect(found?.keywords.some((k) => k.id === kwToDelete.id)).toBe(false);
		});
	});

	describe('Global Request Keywords Dictionary Manager', () => {
		it('fetches global request keywords dictionary', async () => {
			const reqKeywords = await client.getRequestKeywords();
			expect(Array.isArray(reqKeywords)).toBe(true);
			expect(reqKeywords.length).toBe(15);
			expect(reqKeywords.some((r) => r.keyword === 'review')).toBe(true);
			expect(reqKeywords.some((r) => r.keyword === 'bahas')).toBe(true);
			expect(reqKeywords.some((r) => r.keyword === 'vs')).toBe(true);
		});

		it('creates a new custom global request keyword', async () => {
			const newKw = await client.createRequestKeyword('kupastuntas');
			expect(newKw).not.toBeNull();
			expect(newKw?.keyword).toBe('kupastuntas');

			const list = await client.getRequestKeywords();
			expect(list.some((r) => r.keyword === 'kupastuntas')).toBe(true);
		});

		it('does not duplicate request keyword if already present', async () => {
			const listBefore = await client.getRequestKeywords();
			const result = await client.createRequestKeyword('REVIEW');
			expect(result?.keyword).toBe('review');

			const listAfter = await client.getRequestKeywords();
			expect(listAfter.length).toBe(listBefore.length);
		});

		it('deletes a global request keyword', async () => {
			const list = await client.getRequestKeywords();
			const target = list[0];

			const deleted = await client.deleteRequestKeyword(target.id);
			expect(deleted).toBe(true);

			const listAfter = await client.getRequestKeywords();
			expect(listAfter.length).toBe(list.length - 1);
			expect(listAfter.some((r) => r.id === target.id)).toBe(false);
		});
	});
});
