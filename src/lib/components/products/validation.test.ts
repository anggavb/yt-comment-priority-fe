import { describe, it, expect } from 'bun:test';
import {
	validateProductForm,
	validateKeyword,
	normalizeKeyword
} from './validation';
import type { CandidateProduct } from '$lib/types';

describe('Candidate Product & Keyword Validation (Issue #4)', () => {
	const mockExistingProducts: CandidateProduct[] = [
		{
			id: 'prod-1',
			analysisProjectId: 'proj-1',
			name: 'Keychron V1',
			description: 'Mechanical keyboard',
			keywords: [
				{ id: 'kw-1', productId: 'prod-1', keyword: 'keychron v1', createdAt: '' },
				{ id: 'kw-2', productId: 'prod-1', keyword: 'v1 max', createdAt: '' }
			],
			createdAt: '',
			updatedAt: ''
		},
		{
			id: 'prod-2',
			analysisProjectId: 'proj-1',
			name: 'Logitech MX Master 3S',
			description: 'Ergonomic mouse',
			keywords: [],
			createdAt: '',
			updatedAt: ''
		}
	];

	describe('normalizeKeyword', () => {
		it('trims leading/trailing whitespace and converts to lowercase', () => {
			expect(normalizeKeyword('  Keychron V1  ')).toBe('keychron v1');
			expect(normalizeKeyword('MX MASTER 3S')).toBe('mx master 3s');
			expect(normalizeKeyword('\t Aula F75 \n')).toBe('aula f75');
		});
	});

	describe('validateProductForm', () => {
		it('rejects empty or whitespace-only product name', () => {
			const res1 = validateProductForm('', '');
			expect(res1.isValid).toBe(false);
			expect(res1.errors.name).toBe('Nama produk wajib diisi.');

			const res2 = validateProductForm('   ', '');
			expect(res2.isValid).toBe(false);
			expect(res2.errors.name).toBe('Nama produk wajib diisi.');
		});

		it('rejects product name shorter than 2 characters', () => {
			const res = validateProductForm('A');
			expect(res.isValid).toBe(false);
			expect(res.errors.name).toBe('Nama produk minimal harus 2 karakter.');
		});

		it('rejects product name longer than 100 characters', () => {
			const longName = 'A'.repeat(101);
			const res = validateProductForm(longName);
			expect(res.isValid).toBe(false);
			expect(res.errors.name).toBe('Nama produk maksimal 100 karakter.');
		});

		it('rejects description longer than 500 characters', () => {
			const longDesc = 'D'.repeat(501);
			const res = validateProductForm('Keychron Q1', longDesc);
			expect(res.isValid).toBe(false);
			expect(res.errors.description).toBe('Deskripsi produk maksimal 500 karakter.');
		});

		it('rejects duplicate product name within the same project (case-insensitive)', () => {
			const res1 = validateProductForm('keychron v1', '', mockExistingProducts);
			expect(res1.isValid).toBe(false);
			expect(res1.errors.name).toBe('Produk dengan nama "Keychron V1" sudah terdaftar dalam project ini.');

			const res2 = validateProductForm('  LOGITECH MX MASTER 3S  ', '', mockExistingProducts);
			expect(res2.isValid).toBe(false);
			expect(res2.errors.name).toBe('Produk dengan nama "Logitech MX Master 3S" sudah terdaftar dalam project ini.');
		});

		it('allows same name when editing the existing product itself', () => {
			const res = validateProductForm('Keychron V1', 'Updated description', mockExistingProducts, 'prod-1');
			expect(res.isValid).toBe(true);
			expect(res.errors.name).toBeUndefined();
		});

		it('accepts valid product name and description', () => {
			const res = validateProductForm('Razer DeathAdder V3', 'Ergonomic gaming mouse', mockExistingProducts);
			expect(res.isValid).toBe(true);
			expect(Object.keys(res.errors).length).toBe(0);
		});
	});

	describe('validateKeyword', () => {
		const existingKeywords = ['keychron v1', 'v1 max'];

		it('rejects empty or whitespace-only keyword', () => {
			const res = validateKeyword('   ', existingKeywords);
			expect(res.isValid).toBe(false);
			expect(res.error).toBe('Kata kunci tidak boleh kosong.');
		});

		it('rejects keyword shorter than 2 characters', () => {
			const res = validateKeyword('k', existingKeywords);
			expect(res.isValid).toBe(false);
			expect(res.error).toBe('Kata kunci minimal 2 karakter.');
		});

		it('rejects keyword longer than 50 characters', () => {
			const longKw = 'k'.repeat(51);
			const res = validateKeyword(longKw, existingKeywords);
			expect(res.isValid).toBe(false);
			expect(res.error).toBe('Kata kunci maksimal 50 karakter.');
		});

		it('rejects duplicate keyword (case-insensitive and trimmed)', () => {
			const res1 = validateKeyword('KEYCHRON V1', existingKeywords);
			expect(res1.isValid).toBe(false);
			expect(res1.error).toBe('Kata kunci "keychron v1" sudah ada.');

			const res2 = validateKeyword('  v1 max  ', existingKeywords);
			expect(res2.isValid).toBe(false);
			expect(res2.error).toBe('Kata kunci "v1 max" sudah ada.');
		});

		it('accepts valid new keyword', () => {
			const res = validateKeyword('keychron mechanical', existingKeywords);
			expect(res.isValid).toBe(true);
			expect(res.error).toBeUndefined();
		});
	});
});
