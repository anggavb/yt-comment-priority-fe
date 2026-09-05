import type { CriteriaCode, CriteriaAttribute, C4TimeAnchorConfig } from '$lib/types';

export interface CriteriaColors {
	border: string;
	badge: string;
	bar: string;
	dot: string;
}

export interface CriteriaMetadata {
	code: CriteriaCode;
	name: string;
	indonesianName: string;
	description: string;
	formulaDescription: string;
	attribute: CriteriaAttribute;
	colors: CriteriaColors;
}

export const CRITERIA_METADATA: Record<CriteriaCode, CriteriaMetadata> = {
	C1: {
		code: 'C1',
		name: 'Request Count',
		indonesianName: 'Jumlah Permintaan Ulasan',
		description:
			'Mengukur intensitas total permintaan review audiens pada sebuah Candidate Product di seluruh komentar video yang dianalisis.',
		formulaDescription: 'COUNT(komentar berstatus Request)',
		attribute: 'benefit',
		colors: {
			border: 'border-l-4 border-l-red-500',
			badge: 'border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10',
			bar: 'bg-red-500',
			dot: 'bg-red-500'
		}
	},
	C2: {
		code: 'C2',
		name: 'Unique Requester',
		indonesianName: 'Jumlah Akun Unik Pemohon',
		description:
			'Mengukur luas basis audiens unik yang menginginkan ulasan produk, mencegah manipulasi voting/spam dari satu akun berulang.',
		formulaDescription: 'COUNT(DISTINCT authorChannelId)',
		attribute: 'benefit',
		colors: {
			border: 'border-l-4 border-l-blue-500',
			badge: 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10',
			bar: 'bg-blue-500',
			dot: 'bg-blue-500'
		}
	},
	C3: {
		code: 'C3',
		name: 'Average Request Likes',
		indonesianName: 'Rata-rata Likes Permintaan',
		description:
			'Mengukur seberapa kuat dukungan publik dari komentar penonton lain yang menyukai (like) permintaan ulasan tersebut.',
		formulaDescription: 'AVG(likeCount pada komentar Request)',
		attribute: 'benefit',
		colors: {
			border: 'border-l-4 border-l-purple-500',
			badge: 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10',
			bar: 'bg-purple-500',
			dot: 'bg-purple-500'
		}
	},
	C4: {
		code: 'C4',
		name: 'Recent Request Ratio',
		indonesianName: 'Rasio Permintaan Terkini',
		description:
			'Mengukur momentum dan tren permintaan ulasan yang masuk dalam jendela waktu aktif relatif terhadap tanggal acuan komentar video Analysis Project.',
		formulaDescription: 'COUNT(Request Terkini) / COUNT(Total Request)',
		attribute: 'benefit',
		colors: {
			border: 'border-l-4 border-l-amber-500',
			badge: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10',
			bar: 'bg-amber-500',
			dot: 'bg-amber-500'
		}
	}
};

export const DEFAULT_WEIGHT_PERCENTAGES: Record<CriteriaCode, number> = {
	C1: 40,
	C2: 25,
	C3: 20,
	C4: 15
};

export const CRITERIA_CODES: CriteriaCode[] = ['C1', 'C2', 'C3', 'C4'];

/**
 * Accurately sums weights, rounding to 2 decimal places to avoid floating-point drift.
 */
export function calculateTotalWeight(weights: Record<CriteriaCode, number>): number {
	const sum = CRITERIA_CODES.reduce((acc, code) => {
		const val = weights[code];
		return acc + (typeof val === 'number' && !isNaN(val) ? val : 0);
	}, 0);
	return Number(sum.toFixed(2));
}

export interface WeightValidationResult {
	isValid: boolean;
	sum: number;
	difference: number;
	errors: Partial<Record<CriteriaCode, string>>;
	generalError?: string;
}

/**
 * Validates criteria weight inputs:
 * - Each individual weight must be between 0 and 100.
 * - Total sum must equal exactly 100 (within float tolerance 0.01).
 */
export function validateCriteriaWeights(
	weights: Record<CriteriaCode, number>
): WeightValidationResult {
	const errors: Partial<Record<CriteriaCode, string>> = {};

	for (const code of CRITERIA_CODES) {
		const val = weights[code];
		if (val === undefined || val === null || isNaN(val)) {
			errors[code] = `Bobot ${code} harus berupa angka yang valid.`;
		} else if (val < 0) {
			errors[code] = `Bobot ${code} tidak boleh negatif.`;
		} else if (val > 100) {
			errors[code] = `Bobot ${code} tidak boleh melebihi 100%.`;
		}
	}

	const sum = calculateTotalWeight(weights);
	const difference = Number((sum - 100).toFixed(2));
	const isSumExact = Math.abs(difference) < 0.01;

	let generalError: string | undefined;
	if (Object.keys(errors).length === 0 && !isSumExact) {
		generalError =
			difference > 0
				? `Total bobot melebihi 100% sebesar ${difference}% (Total: ${sum}%).`
				: `Total bobot kurang dari 100% sebesar ${Math.abs(difference)}% (Total: ${sum}%).`;
	}

	return {
		isValid: Object.keys(errors).length === 0 && isSumExact,
		sum,
		difference,
		errors,
		generalError
	};
}

/**
 * Proportions weights so their sum is guaranteed to equal exactly 100%.
 * - If all weights are 0, assigns 25% to each.
 * - Otherwise, computes proportional integer percentages and assigns any rounding residual to the largest criterion.
 */
export function autoBalanceWeights(
	weights: Record<CriteriaCode, number>
): Record<CriteriaCode, number> {
	const currentSum = CRITERIA_CODES.reduce((acc, code) => {
		const val = weights[code];
		return acc + (typeof val === 'number' && !isNaN(val) && val > 0 ? val : 0);
	}, 0);

	if (currentSum === 0) {
		return {
			C1: 25,
			C2: 25,
			C3: 25,
			C4: 25
		};
	}

	// Calculate unrounded proportional weights
	const rawProportions: { code: CriteriaCode; raw: number; rounded: number }[] = [];
	for (const code of CRITERIA_CODES) {
		const val = weights[code] && weights[code] > 0 ? weights[code] : 0;
		const raw = (val / currentSum) * 100;
		rawProportions.push({
			code,
			raw,
			rounded: Math.floor(raw)
		});
	}

	// Distribute remaining points based on largest decimal parts (Largest Remainder Method)
	const currentRoundedSum = rawProportions.reduce((acc, item) => acc + item.rounded, 0);
	let remainder = 100 - currentRoundedSum;

	// Sort by decimal part descending
	rawProportions.sort((a, b) => {
		const decA = a.raw - a.rounded;
		const decB = b.raw - b.rounded;
		return decB - decA;
	});

	for (let i = 0; i < rawProportions.length && remainder > 0; i++) {
		rawProportions[i].rounded += 1;
		remainder -= 1;
	}

	const balanced: Record<CriteriaCode, number> = {
		C1: 0,
		C2: 0,
		C3: 0,
		C4: 0
	};

	for (const item of rawProportions) {
		balanced[item.code] = item.rounded;
	}

	return balanced;
}

export interface C4ValidationResult {
	isValid: boolean;
	error?: string;
}

/**
 * Validates C4 time anchor configuration (ADR-0001):
 * - daysWindow must be integer >= 1 and <= 3650 (10 years)
 * - anchorType must be 'max_comment' or 'custom'
 * - If 'custom', customAnchorDate must be a valid date/time
 */
export function validateC4Config(config: C4TimeAnchorConfig): C4ValidationResult {
	if (!config) {
		return { isValid: false, error: 'Konfigurasi C4 tidak valid.' };
	}

	if (
		typeof config.daysWindow !== 'number' ||
		isNaN(config.daysWindow) ||
		!Number.isInteger(config.daysWindow) ||
		config.daysWindow < 1
	) {
		return { isValid: false, error: 'Rentang hari (days window) harus berupa bilangan bulat minimal 1 hari.' };
	}

	if (config.daysWindow > 3650) {
		return { isValid: false, error: 'Rentang hari tidak boleh melebihi 3650 hari (10 tahun).' };
	}

	if (config.anchorType !== 'max_comment' && config.anchorType !== 'custom') {
		return { isValid: false, error: 'Tipe acuan waktu tidak valid.' };
	}

	if (config.anchorType === 'custom') {
		if (!config.customAnchorDate || config.customAnchorDate.trim() === '') {
			return { isValid: false, error: 'Tanggal acuan kustom wajib diisi saat memilih mode kustom.' };
		}

		const parsed = Date.parse(config.customAnchorDate);
		if (isNaN(parsed)) {
			return { isValid: false, error: 'Format tanggal acuan kustom tidak valid.' };
		}
	}

	return { isValid: true };
}
