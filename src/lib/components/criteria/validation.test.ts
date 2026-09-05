import { describe, expect, it } from 'bun:test';
import {
	calculateTotalWeight,
	validateCriteriaWeights,
	autoBalanceWeights,
	validateC4Config,
	DEFAULT_WEIGHT_PERCENTAGES
} from './validation';
import type { CriteriaCode, C4TimeAnchorConfig } from '$lib/types';

describe('Criteria Validation & Auto-Balance Logic (Issue #6)', () => {
	describe('calculateTotalWeight', () => {
		it('accurately sums integer percentages', () => {
			const weights: Record<CriteriaCode, number> = {
				C1: 40,
				C2: 25,
				C3: 20,
				C4: 15
			};
			expect(calculateTotalWeight(weights)).toBe(100);
		});

		it('handles decimal percentages cleanly without floating-point drift', () => {
			const weights: Record<CriteriaCode, number> = {
				C1: 33.33,
				C2: 33.33,
				C3: 33.34,
				C4: 0
			};
			expect(calculateTotalWeight(weights)).toBe(100);
		});

		it('handles zeros and partial inputs', () => {
			const weights: Record<CriteriaCode, number> = {
				C1: 50,
				C2: 0,
				C3: 0,
				C4: 0
			};
			expect(calculateTotalWeight(weights)).toBe(50);
		});
	});

	describe('validateCriteriaWeights', () => {
		it('validates standard default weights summing to 100%', () => {
			const res = validateCriteriaWeights(DEFAULT_WEIGHT_PERCENTAGES);
			expect(res.isValid).toBe(true);
			expect(res.sum).toBe(100);
			expect(res.difference).toBe(0);
			expect(Object.keys(res.errors).length).toBe(0);
		});

		it('identifies when total weight is less than 100%', () => {
			const weights: Record<CriteriaCode, number> = {
				C1: 30,
				C2: 20,
				C3: 20,
				C4: 10
			};
			const res = validateCriteriaWeights(weights);
			expect(res.isValid).toBe(false);
			expect(res.sum).toBe(80);
			expect(res.difference).toBe(-20);
		});

		it('identifies when total weight exceeds 100%', () => {
			const weights: Record<CriteriaCode, number> = {
				C1: 40,
				C2: 30,
				C3: 25,
				C4: 15
			};
			const res = validateCriteriaWeights(weights);
			expect(res.isValid).toBe(false);
			expect(res.sum).toBe(110);
			expect(res.difference).toBe(10);
		});

		it('flags individual criteria weight errors if out of bounds (negative or > 100)', () => {
			const weights: Record<CriteriaCode, number> = {
				C1: -5,
				C2: 60,
				C3: 30,
				C4: 15
			};
			const res = validateCriteriaWeights(weights);
			expect(res.isValid).toBe(false);
			expect(res.errors.C1).toBeDefined();
		});

		it('flags NaN or invalid number weights', () => {
			const weights: Record<CriteriaCode, number> = {
				C1: NaN,
				C2: 25,
				C3: 20,
				C4: 15
			};
			const res = validateCriteriaWeights(weights);
			expect(res.isValid).toBe(false);
			expect(res.errors.C1).toBeDefined();
		});
	});

	describe('autoBalanceWeights', () => {
		it('evenly distributes 25% to all criteria when all current weights are 0', () => {
			const weights: Record<CriteriaCode, number> = {
				C1: 0,
				C2: 0,
				C3: 0,
				C4: 0
			};
			const balanced = autoBalanceWeights(weights);
			expect(balanced.C1).toBe(25);
			expect(balanced.C2).toBe(25);
			expect(balanced.C3).toBe(25);
			expect(balanced.C4).toBe(25);
			expect(calculateTotalWeight(balanced)).toBe(100);
		});

		it('normalizes arbitrary unbalanced weights proportionally to exactly 100%', () => {
			const weights: Record<CriteriaCode, number> = {
				C1: 80,
				C2: 40,
				C3: 20,
				C4: 20
			}; // sum = 160
			// Proportions: 80/160 = 50%, 40/160 = 25%, 20/160 = 12.5%, 20/160 = 12.5%
			const balanced = autoBalanceWeights(weights);
			expect(calculateTotalWeight(balanced)).toBe(100);
			expect(balanced.C1).toBe(50);
			expect(balanced.C2).toBe(25);
			expect(balanced.C3 + balanced.C4).toBe(25);
		});

		it('handles odd proportions and guarantees integer sum of 100 without rounding drift', () => {
			const weights: Record<CriteriaCode, number> = {
				C1: 30,
				C2: 30,
				C3: 30,
				C4: 0
			}; // 1/3 each for C1, C2, C3
			const balanced = autoBalanceWeights(weights);
			expect(calculateTotalWeight(balanced)).toBe(100);
			expect(balanced.C4).toBe(0);
			// 33, 33, 34 or similar summing to exactly 100
			expect(balanced.C1 + balanced.C2 + balanced.C3).toBe(100);
		});

		it('keeps already balanced 100% weights intact', () => {
			const weights = { ...DEFAULT_WEIGHT_PERCENTAGES };
			const balanced = autoBalanceWeights(weights);
			expect(balanced.C1).toBe(40);
			expect(balanced.C2).toBe(25);
			expect(balanced.C3).toBe(20);
			expect(balanced.C4).toBe(15);
			expect(calculateTotalWeight(balanced)).toBe(100);
		});
	});

	describe('validateC4Config (ADR-0001)', () => {
		it('validates default max_comment configuration', () => {
			const config: C4TimeAnchorConfig = {
				daysWindow: 30,
				anchorType: 'max_comment',
				customAnchorDate: null
			};
			const res = validateC4Config(config);
			expect(res.isValid).toBe(true);
		});

		it('rejects daysWindow <= 0 or non-integer', () => {
			expect(validateC4Config({
				daysWindow: 0,
				anchorType: 'max_comment'
			}).isValid).toBe(false);

			expect(validateC4Config({
				daysWindow: -10,
				anchorType: 'max_comment'
			}).isValid).toBe(false);

			expect(validateC4Config({
				daysWindow: 15.5,
				anchorType: 'max_comment'
			}).isValid).toBe(false);
		});

		it('rejects daysWindow exceeding upper safety bound (> 3650 days)', () => {
			expect(validateC4Config({
				daysWindow: 4000,
				anchorType: 'max_comment'
			}).isValid).toBe(false);
		});

		it('validates custom anchorType when a valid date is provided', () => {
			const config: C4TimeAnchorConfig = {
				daysWindow: 14,
				anchorType: 'custom',
				customAnchorDate: '2026-02-15'
			};
			const res = validateC4Config(config);
			expect(res.isValid).toBe(true);
		});

		it('rejects custom anchorType when date is missing or invalid', () => {
			expect(validateC4Config({
				daysWindow: 30,
				anchorType: 'custom',
				customAnchorDate: ''
			}).isValid).toBe(false);

			expect(validateC4Config({
				daysWindow: 30,
				anchorType: 'custom',
				customAnchorDate: 'invalid-date-string'
			}).isValid).toBe(false);
		});
	});
});
