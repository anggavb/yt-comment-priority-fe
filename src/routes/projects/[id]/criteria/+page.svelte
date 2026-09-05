<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/api';
	import type { Criteria, CriteriaCode, C4TimeAnchorConfig } from '$lib/types';
	import {
		CriteriaCard,
		CriteriaSummaryBar,
		C4TimeAnchorSettings,
		validateCriteriaWeights,
		autoBalanceWeights,
		validateC4Config,
		DEFAULT_WEIGHT_PERCENTAGES,
		CRITERIA_CODES
	} from '$lib/components/criteria';
	import { Badge } from '$lib/components/ui/badge';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Loading03Icon,
		CheckmarkCircle02Icon,
		Alert02Icon,
		InformationCircleIcon
	} from '@hugeicons/core-free-icons';

	let { data } = $props();

	let criteriaList = $state<Criteria[]>([]);
	let c4Config = $state<C4TimeAnchorConfig>({
		daysWindow: 30,
		anchorType: 'max_comment',
		customAnchorDate: null
	});

	// Current weights as percentages (0 - 100)
	let weights = $state<Record<CriteriaCode, number>>({ ...DEFAULT_WEIGHT_PERCENTAGES });

	// Saved initial state for dirty-tracking
	let savedWeights = $state<Record<CriteriaCode, number>>({ ...DEFAULT_WEIGHT_PERCENTAGES });
	let savedC4Config = $state<string>('');

	let latestCommentDate = $state<string | null>(null);
	let isLoading = $state(true);
	let isSaving = $state(false);
	let saveSuccessMessage = $state<string | null>(null);
	let saveErrorMessage = $state<string | null>(null);

	onMount(async () => {
		try {
			const [critRes, commentsRes] = await Promise.all([
				apiClient.getCriteria(data.project.id),
				apiClient.getComments(data.project.id, { limit: 1000 }).catch(() => ({ data: [] }))
			]);

			criteriaList = critRes.criteria;
			c4Config = critRes.c4Config;

			// Initialize weights map from fetched criteria
			const newWeights: Record<CriteriaCode, number> = { ...DEFAULT_WEIGHT_PERCENTAGES };

			for (const c of critRes.criteria) {
				if (c.code in newWeights) {
					newWeights[c.code] = Math.round((c.weight || 0) * 100);
				}
			}

			weights = newWeights;
			savedWeights = { ...newWeights };
			savedC4Config = JSON.stringify(c4Config);

			// Extract latest comment date across project comments if available
			if (commentsRes.data && commentsRes.data.length > 0) {
				const timestamps = commentsRes.data
					.map((c) => new Date(c.publishedAt).getTime())
					.filter((t) => !isNaN(t));
				if (timestamps.length > 0) {
					latestCommentDate = new Date(Math.max(...timestamps)).toISOString();
				}
			}
		} finally {
			isLoading = false;
		}
	});

	// Validation derived states
	const weightValidation = $derived(validateCriteriaWeights(weights));
	const c4Validation = $derived(validateC4Config(c4Config));

	// Check if user has modified anything
	const isDirty = $derived(
		CRITERIA_CODES.some((code) => weights[code] !== savedWeights[code]) ||
			JSON.stringify(c4Config) !== savedC4Config
	);

	function handleWeightChange(code: CriteriaCode, newWeight: number) {
		weights[code] = newWeight;
		saveSuccessMessage = null;
		saveErrorMessage = null;
	}

	function handleAutoBalance() {
		weights = autoBalanceWeights(weights);
		saveSuccessMessage = null;
		saveErrorMessage = null;
	}

	function handleResetDefault() {
		weights = { ...DEFAULT_WEIGHT_PERCENTAGES };
		saveSuccessMessage = null;
		saveErrorMessage = null;
	}

	async function handleSave() {
		if (!weightValidation.isValid) {
			saveErrorMessage =
				weightValidation.generalError || 'Total bobot kriteria harus bernilai tepat 100%.';
			return;
		}

		if (!c4Validation.isValid) {
			saveErrorMessage = c4Validation.error || 'Konfigurasi C4 tidak valid.';
			return;
		}

		isSaving = true;
		saveSuccessMessage = null;
		saveErrorMessage = null;

		try {
			// Convert integer percentages (e.g. 40, 25) back to decimal weights (e.g. 0.4, 0.25)
			const criteriaPayload = CRITERIA_CODES.map((code) => ({
				code,
				weight: Number((weights[code] / 100).toFixed(4))
			}));

			const res = await apiClient.updateCriteria(data.project.id, {
				criteria: criteriaPayload,
				c4Config
			});

			// Update saved snapshots
			criteriaList = res.criteria;
			c4Config = res.c4Config;
			savedWeights = { ...weights };
			savedC4Config = JSON.stringify(c4Config);

			saveSuccessMessage =
				'Konfigurasi kriteria, bobot SAW, dan time-anchor C4 berhasil disimpan!';
			setTimeout(() => {
				saveSuccessMessage = null;
			}, 5000);
		} catch (err) {
			saveErrorMessage =
				err instanceof Error ? err.message : 'Gagal menyimpan konfigurasi kriteria.';
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="space-y-6">
	<!-- Tab Header -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
				<span>Konfigurasi Kriteria & Bobot SAW</span>
				<Badge variant="outline" class="text-xs font-mono">
					4 Kriteria
				</Badge>
			</h2>
			<p class="text-xs text-muted-foreground mt-0.5">
				Sesuaikan bobot preferensi kriteria Simple Additive Weighting (SAW) dan acuan waktu kriteria C4.
			</p>
		</div>
	</div>

	<!-- Notifications / Alerts -->
	{#if saveSuccessMessage}
		<div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-center gap-3 text-xs text-emerald-700 dark:text-emerald-300">
			<HugeiconsIcon icon={CheckmarkCircle02Icon} class="size-5 shrink-0" />
			<span class="font-medium">{saveSuccessMessage}</span>
		</div>
	{/if}

	{#if saveErrorMessage}
		<div class="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 flex items-center gap-3 text-xs text-destructive">
			<HugeiconsIcon icon={Alert02Icon} class="size-5 shrink-0" />
			<span class="font-medium">{saveErrorMessage}</span>
		</div>
	{/if}

	{#if isLoading}
		<div class="flex items-center justify-center py-20 text-muted-foreground">
			<HugeiconsIcon icon={Loading03Icon} class="size-6 animate-spin text-primary" />
			<span class="ml-2 text-xs">Memuat konfigurasi kriteria...</span>
		</div>
	{:else}
		<!-- Criteria Summary Bar (Dynamic 100% Status, Auto-Balance, Save) -->
		<CriteriaSummaryBar
			{weights}
			validation={weightValidation}
			{isDirty}
			{isSaving}
			onAutoBalance={handleAutoBalance}
			onResetDefault={handleResetDefault}
			onSave={handleSave}
		/>

		<!-- Criteria Cards Grid (C1, C2, C3, C4) -->
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-xs font-bold text-foreground uppercase tracking-wider">
						Kriteria Evaluasi SAW (Atribut Benefit)
					</h3>
					<p class="text-[11px] text-muted-foreground">
						Geser slider atau masukkan angka persentase untuk menentukan derajat kepentingan masing-masing kriteria.
					</p>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each CRITERIA_CODES as code (code)}
					{@const crit = criteriaList.find((c) => c.code === code)}
					<CriteriaCard
						{code}
						name={crit?.name}
						attribute={crit?.attribute ?? 'benefit'}
						bind:weight={weights[code]}
						error={weightValidation.errors[code]}
						onWeightChange={handleWeightChange}
					/>
				{/each}
			</div>
		</div>

		<!-- C4 Time Anchor Settings (ADR-0001) -->
		<C4TimeAnchorSettings
			bind:config={c4Config}
			{latestCommentDate}
			onConfigChange={() => {
				saveSuccessMessage = null;
				saveErrorMessage = null;
			}}
		/>

		<!-- Mathematical Transparency Notice (ADR-0003 Context) -->
		<div class="rounded-xl border border-border/70 bg-card p-4 flex items-start gap-3 text-xs text-muted-foreground">
			<HugeiconsIcon icon={InformationCircleIcon} class="size-5 text-primary shrink-0 mt-0.5" />
			<div class="space-y-1">
				<p class="font-semibold text-foreground">
					Transparansi Perhitungan SAW & Normalisasi Bobot
				</p>
				<p class="leading-relaxed">
					Metode Simple Additive Weighting mengharuskan bobot kriteria terdistribusi secara proporsional dengan total penjumlahan bernilai 1.0 (100%). Perubahan bobot di halaman ini akan secara otomatis diterapkan pada matriks terbobot (<code class="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">Wj × Rij</code>) dan menentukan Nilai Preferensi (<code class="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">Vi</code>) pada tab Perangkingan SAW.
				</p>
			</div>
		</div>
	{/if}
</div>
