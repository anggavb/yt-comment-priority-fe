import type { CandidateProduct } from '$lib/types';

export interface ProductFormErrors {
	name?: string;
	description?: string;
}

/**
 * Normalizes keyword: trims whitespace and converts to lowercase.
 */
export function normalizeKeyword(keyword: string): string {
	return keyword.trim().toLowerCase();
}

/**
 * Validates candidate product form inputs:
 * - Name required, 2-100 characters
 * - Description optional, <= 500 characters
 * - Duplicate name check within the same project (case-insensitive)
 */
export function validateProductForm(
	name: string,
	description?: string,
	existingProducts: CandidateProduct[] = [],
	editingProductId?: string
): {
	isValid: boolean;
	errors: ProductFormErrors;
} {
	const errors: ProductFormErrors = {};
	const trimmedName = name ? name.trim() : '';

	if (!trimmedName) {
		errors.name = 'Nama produk wajib diisi.';
	} else if (trimmedName.length < 2) {
		errors.name = 'Nama produk minimal harus 2 karakter.';
	} else if (trimmedName.length > 100) {
		errors.name = 'Nama produk maksimal 100 karakter.';
	} else {
		// Check for duplicate product name in current project
		const lowerName = trimmedName.toLowerCase();
		const duplicate = existingProducts.find(
			(p) => p.name.trim().toLowerCase() === lowerName && p.id !== editingProductId
		);
		if (duplicate) {
			errors.name = `Produk dengan nama "${duplicate.name}" sudah terdaftar dalam project ini.`;
		}
	}

	if (description && description.length > 500) {
		errors.description = 'Deskripsi produk maksimal 500 karakter.';
	}

	return {
		isValid: Object.keys(errors).length === 0,
		errors
	};
}

/**
 * Validates a single keyword string against existing keywords:
 * - Non-empty, 2-50 characters
 * - Duplicate check (case-insensitive)
 */
export function validateKeyword(
	keyword: string,
	existingKeywords: string[] = []
): {
	isValid: boolean;
	error?: string;
} {
	const trimmed = keyword ? keyword.trim() : '';
	if (!trimmed) {
		return {
			isValid: false,
			error: 'Kata kunci tidak boleh kosong.'
		};
	}

	if (trimmed.length < 2) {
		return {
			isValid: false,
			error: 'Kata kunci minimal 2 karakter.'
		};
	}

	if (trimmed.length > 50) {
		return {
			isValid: false,
			error: 'Kata kunci maksimal 50 karakter.'
		};
	}

	const normalized = normalizeKeyword(trimmed);
	const isDuplicate = existingKeywords.some(
		(kw) => normalizeKeyword(kw) === normalized
	);

	if (isDuplicate) {
		return {
			isValid: false,
			error: `Kata kunci "${normalized}" sudah ada.`
		};
	}

	return {
		isValid: true
	};
}
