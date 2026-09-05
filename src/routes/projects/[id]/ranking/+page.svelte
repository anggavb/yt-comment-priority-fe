<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/api';
	import type { CriteriaCode, RankingLeaderboard } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ChartHistogramIcon,
		CalculatorIcon,
		Loading03Icon,
		SparklesIcon,
		CheckmarkCircle02Icon,
		AlertCircleIcon,
		GridTableIcon,
		PercentSquareIcon,
		FilterIcon,
		TrophyIcon,
		Download04Icon,
		PrinterIcon
	} from '@hugeicons/core-free-icons';
	import {
		downloadCsv,
		generateDecisionMatrixCsv,
		generateNormalizedMatrixCsv,
		generateWeightedMatrixCsv,
		generateFinalRankingCsv
	} from '$lib/utils/csv';

	let { data } = $props();
	let leaderboard = $state<RankingLeaderboard | null>(null);
	let isLoading = $state(true);
	let isCalculating = $state(false);

	onMount(async () => {
		try {
			leaderboard = await apiClient.getRankings(data.project.id);
		} finally {
			isLoading = false;
		}
	});

	async function handleRecalculate() {
		isCalculating = true;
		try {
			leaderboard = await apiClient.calculateRanking(data.project.id);
		} finally {
			isCalculating = false;
		}
	}

	/** Automated verification: max normalized value per criterion must be ≈ 1.000 */
	const normalizationCheck = $derived.by(() => {
		if (!leaderboard) return null;
		const rows = leaderboard.normalizedMatrix.rows;
		if (rows.length === 0) return null;
		const maxR1 = Math.max(...rows.map((r) => r.r1));
		const maxR2 = Math.max(...rows.map((r) => r.r2));
		const maxR3 = Math.max(...rows.map((r) => r.r3));
		const maxR4 = Math.max(...rows.map((r) => r.r4));
		const ok =
			Math.abs(maxR1 - 1) < 0.001 &&
			Math.abs(maxR2 - 1) < 0.001 &&
			Math.abs(maxR3 - 1) < 0.001 &&
			Math.abs(maxR4 - 1) < 0.001;
		return ok;
	});

	/** Formatted calculatedAt timestamp — derived so it doesn't re-evaluate on every render */
	const calculatedAtFormatted = $derived(
		leaderboard
			? new Date(leaderboard.calculatedAt).toLocaleString('id-ID')
			: ''
	);

	/** Returns criteria weight as percentage string */
	function weightPct(code: CriteriaCode): string {
		if (!leaderboard) return '—';
		const w = leaderboard.criteriaWeights[code] ?? 0;
		return `${Math.round(w * 100)}%`;
	}

	/** Formats a number to 4 decimal places */
	function fmt4(n: number): string {
		return n.toFixed(4);
	}

	/** Generic helper to export a matrix table as CSV */
	function exportTable(prefix: string, generator: (lb: RankingLeaderboard) => string) {
		if (!leaderboard) return;
		const csv = generator(leaderboard);
		const dateStr = new Date().toISOString().slice(0, 10);
		downloadCsv(`${prefix}-${data.project.id}-${dateStr}.csv`, csv);
	}

	const exportDecisionMatrix = () => exportTable('decision-matrix', generateDecisionMatrixCsv);
	const exportNormalizedMatrix = () => exportTable('normalized-matrix', generateNormalizedMatrixCsv);
	const exportWeightedMatrix = () => exportTable('weighted-matrix', generateWeightedMatrixCsv);
	const exportFinalRanking = () => exportTable('final-ranking', generateFinalRankingCsv);

	function handlePrint() {
		if (typeof window !== 'undefined') {
			window.print();
		}
	}
</script>

<div class="space-y-6">
	<!-- Tab Header -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
				<span>Hasil Perangkingan Metode SAW</span>
				<Badge variant="outline" class="text-xs">
					{leaderboard?.rankings.length ?? 0} Produk Dievaluasi
				</Badge>
			</h2>
			<p class="text-xs text-muted-foreground mt-0.5">
				Transparansi akademik lengkap: 4 tabel matriks SAW sesuai ADR-0003 untuk validasi dosen
				penguji.
			</p>
		</div>

		<div class="flex items-center gap-2 flex-wrap print:hidden">
			<Button
				variant="outline"
				class="gap-1.5 text-xs"
				onclick={handlePrint}
				disabled={!leaderboard || leaderboard.rankings.length === 0}
				title="Cetak seluruh tabel perhitungan SAW ke format PDF / printer untuk dokumen skripsi"
			>
				<HugeiconsIcon icon={PrinterIcon} class="size-3.5" />
				<span>Cetak / PDF</span>
			</Button>

			<Button
				class="gap-1.5 self-start sm:self-auto bg-[#FF0000] hover:bg-[#FF0000]/90 text-white text-xs"
				onclick={handleRecalculate}
				disabled={isCalculating || isLoading}
			>
				{#if isCalculating}
					<HugeiconsIcon icon={Loading03Icon} class="size-3.5 animate-spin" />
					<span>Menghitung...</span>
				{:else}
					<HugeiconsIcon icon={CalculatorIcon} class="size-3.5" />
					<span>Hitung Ulang SAW</span>
				{/if}
			</Button>
		</div>
	</div>

	<!-- Loading state -->
	{#if isLoading}
		<div class="flex items-center justify-center py-16 text-muted-foreground">
			<HugeiconsIcon icon={Loading03Icon} class="size-6 animate-spin text-primary" />
			<span class="ml-2 text-xs">Memuat hasil perangkingan...</span>
		</div>

	<!-- Empty state -->
	{:else if !leaderboard || leaderboard.rankings.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 py-12 px-4 text-center"
		>
			<div class="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
				<HugeiconsIcon icon={ChartHistogramIcon} class="size-6" />
			</div>
			<h3 class="mt-3 text-sm font-semibold text-foreground">Ranking Belum Dihitung</h3>
			<p class="mt-1 text-xs text-muted-foreground max-w-sm">
				Pastikan video terhubung, candidate products ditentukan, dan komentar telah diekstraksi
				sebelum menjalankan perhitungan SAW.
			</p>
			<Button
				onclick={handleRecalculate}
				disabled={isCalculating}
				class="mt-4 gap-1.5 text-xs bg-[#FF0000] hover:bg-[#FF0000]/90 text-white"
			>
				<HugeiconsIcon icon={CalculatorIcon} class="size-3.5" />
				{isCalculating ? 'Menghitung...' : 'Hitung SAW Sekarang'}
			</Button>
		</div>

	{:else}
		<!-- Print-Only Academic Document Header for Thesis Appendices -->
		<div class="hidden print:block mb-8 pb-4 border-b-2 border-neutral-800 text-black">
			<div class="flex items-start justify-between gap-4">
				<div>
					<h1 class="text-xl font-bold uppercase tracking-tight text-black">
						Lampiran: Hasil Perhitungan Metode Simple Additive Weighting (SAW)
					</h1>
					<p class="text-sm font-semibold mt-1 text-neutral-800">
						Analysis Project: {data.project.name}
					</p>
					{#if data.project.description}
						<p class="text-xs text-neutral-600 mt-0.5 max-w-2xl">{data.project.description}</p>
					{/if}
				</div>
				<div class="text-right text-xs text-neutral-600 font-mono shrink-0">
					<p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
					{#if leaderboard?.calculatedAt}
						<p>Waktu Hitung: {calculatedAtFormatted}</p>
					{/if}
				</div>
			</div>
			{#if leaderboard}
				<div class="mt-3 pt-2 border-t border-dashed border-neutral-400 flex items-center gap-4 text-xs font-mono text-neutral-700">
					<span class="font-bold font-sans text-black">Bobot Kriteria:</span>
					<span>C1: {weightPct('C1')}</span>
					<span>·</span>
					<span>C2: {weightPct('C2')}</span>
					<span>·</span>
					<span>C3: {weightPct('C3')}</span>
					<span>·</span>
					<span>C4: {weightPct('C4')}</span>
				</div>
			{/if}
		</div>

		<!-- ══════════════════════════════════════════════════════════════
		     TABLE 1 — Initial Decision Matrix (Xij)
		══════════════════════════════════════════════════════════════ -->
		<section class="rounded-xl border border-border/70 bg-card overflow-hidden">
			<div class="p-4 border-b border-border/60 flex items-center justify-between flex-wrap gap-2">
				<div class="flex items-center gap-2">
					<HugeiconsIcon icon={GridTableIcon} class="size-4 text-blue-500" />
					<div>
						<h3 class="text-xs font-bold uppercase tracking-wider text-foreground">
							Tabel 1 — Matriks Keputusan (X<sub>ij</sub>)
						</h3>
						<p class="text-[10px] text-muted-foreground mt-0.5">Nilai metrik mentah sebelum normalisasi</p>
					</div>
				</div>
				<div class="flex items-center gap-2 print:hidden">
					<Button
						variant="outline"
						size="sm"
						class="h-7 px-2.5 text-xs gap-1.5"
						onclick={exportDecisionMatrix}
						disabled={!leaderboard}
						title="Ekspor Matriks Keputusan (Xij) ke file CSV"
					>
						<HugeiconsIcon icon={Download04Icon} class="size-3 text-muted-foreground" />
						<span>Ekspor CSV</span>
					</Button>
					<Badge variant="outline" class="text-[10px] border-blue-500/30 bg-blue-500/10 text-blue-600">
						Raw Metrics
					</Badge>
				</div>
			</div>

			<div class="overflow-x-auto">
				<Table.Root class="w-full text-left text-xs">
					<Table.Header class="border-b border-border/60 bg-muted/40 text-[11px] text-muted-foreground">
						<Table.Row>
							<Table.Head class="py-3 px-4 font-semibold">Candidate Product</Table.Head>
							<Table.Head class="py-3 px-4 text-right font-semibold">
								C1 — Request Count
							</Table.Head>
							<Table.Head class="py-3 px-4 text-right font-semibold">
								C2 — Unique Requester
							</Table.Head>
							<Table.Head class="py-3 px-4 text-right font-semibold">
								C3 — Avg Likes
							</Table.Head>
							<Table.Head class="py-3 px-4 text-right font-semibold">
								C4 — Recent Ratio
							</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body class="divide-y divide-border/40">
						{#each leaderboard.decisionMatrix.rows as row (row.productId)}
							<Table.Row class="hover:bg-muted/30 transition-colors">
								<Table.Cell class="py-3 px-4 font-semibold text-foreground">{row.productName}</Table.Cell>
								<Table.Cell class="py-3 px-4 text-right font-mono">{row.c1RequestCount}</Table.Cell>
								<Table.Cell class="py-3 px-4 text-right font-mono">{row.c2UniqueRequester}</Table.Cell>
								<Table.Cell class="py-3 px-4 text-right font-mono">{fmt4(row.c3AverageRequestLikes)}</Table.Cell>
								<Table.Cell class="py-3 px-4 text-right font-mono">{fmt4(row.c4RecentRequestRatio)}</Table.Cell>
							</Table.Row>
						{/each}
						<!-- Max row -->
						<Table.Row class="bg-muted/60 border-t-2 border-border/60">
							<Table.Cell class="py-2 px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
								max(X<sub>j</sub>)
							</Table.Cell>
							<Table.Cell class="py-2 px-4 text-right font-mono font-bold text-foreground text-xs">
								{leaderboard.decisionMatrix.maxValues.c1}
							</Table.Cell>
							<Table.Cell class="py-2 px-4 text-right font-mono font-bold text-foreground text-xs">
								{leaderboard.decisionMatrix.maxValues.c2}
							</Table.Cell>
							<Table.Cell class="py-2 px-4 text-right font-mono font-bold text-foreground text-xs">
								{fmt4(leaderboard.decisionMatrix.maxValues.c3)}
							</Table.Cell>
							<Table.Cell class="py-2 px-4 text-right font-mono font-bold text-foreground text-xs">
								{fmt4(leaderboard.decisionMatrix.maxValues.c4)}
							</Table.Cell>
						</Table.Row>
					</Table.Body>
				</Table.Root>
			</div>
		</section>

		<!-- ══════════════════════════════════════════════════════════════
		     TABLE 2 — Normalized Matrix (Rij)
		══════════════════════════════════════════════════════════════ -->
		<section class="rounded-xl border border-border/70 bg-card overflow-hidden">
			<div class="p-4 border-b border-border/60 flex items-center justify-between flex-wrap gap-2">
				<div class="flex items-center gap-2">
					<HugeiconsIcon icon={PercentSquareIcon} class="size-4 text-violet-500" />
					<div>
						<h3 class="text-xs font-bold uppercase tracking-wider text-foreground">
							Tabel 2 — Matriks Ternormalisasi (R<sub>ij</sub>)
						</h3>
						<p class="text-[10px] text-muted-foreground mt-0.5">Normalisasi atribut benefit</p>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<!-- Automated verification check -->
					{#if normalizationCheck === true}
						<Badge
							variant="outline"
							class="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600 gap-1 flex items-center"
						>
							<HugeiconsIcon icon={CheckmarkCircle02Icon} class="size-3" />
							max(R<sub>j</sub>) = 1.000 ✓
						</Badge>
					{:else if normalizationCheck === false}
						<Badge
							variant="outline"
							class="text-[10px] border-red-500/30 bg-red-500/10 text-red-600 gap-1 flex items-center"
						>
							<HugeiconsIcon icon={AlertCircleIcon} class="size-3" />
							Verifikasi Gagal
						</Badge>
					{/if}
					<Button
						variant="outline"
						size="sm"
						class="h-7 px-2.5 text-xs gap-1.5 print:hidden"
						onclick={exportNormalizedMatrix}
						disabled={!leaderboard}
						title="Ekspor Matriks Ternormalisasi (Rij) ke file CSV"
					>
						<HugeiconsIcon icon={Download04Icon} class="size-3 text-muted-foreground" />
						<span>Ekspor CSV</span>
					</Button>
					<Badge variant="outline" class="text-[10px] border-violet-500/30 bg-violet-500/10 text-violet-600 font-mono">
						R<sub>ij</sub> = X<sub>ij</sub> / max(X<sub>j</sub>)
					</Badge>
				</div>
			</div>

			<div class="overflow-x-auto">
				<Table.Root class="w-full text-left text-xs">
					<Table.Header class="border-b border-border/60 bg-muted/40 text-[11px] text-muted-foreground">
						<Table.Row>
							<Table.Head class="py-3 px-4 font-semibold">Candidate Product</Table.Head>
							<Table.Head class="py-3 px-4 text-right font-semibold">R<sub>1</sub> (C1)</Table.Head>
							<Table.Head class="py-3 px-4 text-right font-semibold">R<sub>2</sub> (C2)</Table.Head>
							<Table.Head class="py-3 px-4 text-right font-semibold">R<sub>3</sub> (C3)</Table.Head>
							<Table.Head class="py-3 px-4 text-right font-semibold">R<sub>4</sub> (C4)</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body class="divide-y divide-border/40">
						{#each leaderboard.normalizedMatrix.rows as row (row.productId)}
							<Table.Row class="hover:bg-muted/30 transition-colors">
								<Table.Cell class="py-3 px-4 font-semibold text-foreground">{row.productName}</Table.Cell>
								<Table.Cell class="py-3 px-4 text-right font-mono {row.r1 === 1 ? 'text-emerald-600 font-bold' : ''}">{fmt4(row.r1)}</Table.Cell>
								<Table.Cell class="py-3 px-4 text-right font-mono {row.r2 === 1 ? 'text-emerald-600 font-bold' : ''}">{fmt4(row.r2)}</Table.Cell>
								<Table.Cell class="py-3 px-4 text-right font-mono {row.r3 === 1 ? 'text-emerald-600 font-bold' : ''}">{fmt4(row.r3)}</Table.Cell>
								<Table.Cell class="py-3 px-4 text-right font-mono {row.r4 === 1 ? 'text-emerald-600 font-bold' : ''}">{fmt4(row.r4)}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</section>

		<!-- ══════════════════════════════════════════════════════════════
		     TABLE 3 — Weighted Matrix (Wj × Rij)
		══════════════════════════════════════════════════════════════ -->
		<section class="rounded-xl border border-border/70 bg-card overflow-hidden">
			<div class="p-4 border-b border-border/60 flex items-center justify-between flex-wrap gap-2">
				<div class="flex items-center gap-2">
					<HugeiconsIcon icon={FilterIcon} class="size-4 text-amber-500" />
					<div>
						<h3 class="text-xs font-bold uppercase tracking-wider text-foreground">
							Tabel 3 — Matriks Terbobot (W<sub>j</sub> × R<sub>ij</sub>)
						</h3>
						<p class="text-[10px] text-muted-foreground mt-0.5">
							Bobot: C1 {weightPct('C1')} · C2 {weightPct('C2')} · C3 {weightPct('C3')} · C4 {weightPct('C4')}
						</p>
					</div>
				</div>
				<div class="flex items-center gap-2 print:hidden">
					<Button
						variant="outline"
						size="sm"
						class="h-7 px-2.5 text-xs gap-1.5"
						onclick={exportWeightedMatrix}
						disabled={!leaderboard}
						title="Ekspor Matriks Terbobot ke file CSV"
					>
						<HugeiconsIcon icon={Download04Icon} class="size-3 text-muted-foreground" />
						<span>Ekspor CSV</span>
					</Button>
					<Badge variant="outline" class="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-600">
						Weighted Scores
					</Badge>
				</div>
			</div>

			<div class="overflow-x-auto">
				<Table.Root class="w-full text-left text-xs">
					<Table.Header class="border-b border-border/60 bg-muted/40 text-[11px] text-muted-foreground">
						<Table.Row>
							<Table.Head class="py-3 px-4 font-semibold">Candidate Product</Table.Head>
							<Table.Head class="py-3 px-4 text-right font-semibold">
								W<sub>1</sub>·R<sub>1</sub>
							</Table.Head>
							<Table.Head class="py-3 px-4 text-right font-semibold">
								W<sub>2</sub>·R<sub>2</sub>
							</Table.Head>
							<Table.Head class="py-3 px-4 text-right font-semibold">
								W<sub>3</sub>·R<sub>3</sub>
							</Table.Head>
							<Table.Head class="py-3 px-4 text-right font-semibold">
								W<sub>4</sub>·R<sub>4</sub>
							</Table.Head>
							<Table.Head class="py-3 px-4 text-right font-bold text-foreground">
								V<sub>i</sub>
							</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body class="divide-y divide-border/40">
						{#each leaderboard.weightedMatrix.rows as row (row.productId)}
							<Table.Row class="hover:bg-muted/30 transition-colors">
								<Table.Cell class="py-3 px-4 font-semibold text-foreground">{row.productName}</Table.Cell>
								<Table.Cell class="py-3 px-4 text-right font-mono text-muted-foreground">{fmt4(row.w1)}</Table.Cell>
								<Table.Cell class="py-3 px-4 text-right font-mono text-muted-foreground">{fmt4(row.w2)}</Table.Cell>
								<Table.Cell class="py-3 px-4 text-right font-mono text-muted-foreground">{fmt4(row.w3)}</Table.Cell>
								<Table.Cell class="py-3 px-4 text-right font-mono text-muted-foreground">{fmt4(row.w4)}</Table.Cell>
								<Table.Cell class="py-3 px-4 text-right font-mono font-extrabold text-foreground">{fmt4(row.preferenceValue)}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</section>

		<!-- ══════════════════════════════════════════════════════════════
		     TABLE 4 — Final Ranking Leaderboard with podium
		══════════════════════════════════════════════════════════════ -->
		<section class="rounded-xl border border-border/70 bg-card overflow-hidden">
			<div class="p-4 border-b border-border/60 flex items-center justify-between flex-wrap gap-2">
				<div class="flex items-center gap-2">
					<HugeiconsIcon icon={SparklesIcon} class="size-4 text-amber-500" />
					<div>
						<h3 class="text-xs font-bold uppercase tracking-wider text-foreground">
							Tabel 4 — Leaderboard Prioritas Ulasan (V<sub>i</sub>)
						</h3>
						<p class="text-[10px] text-muted-foreground mt-0.5">
							Dihitung {calculatedAtFormatted}
						</p>
					</div>
				</div>
				<div class="flex items-center gap-2 flex-wrap print:hidden">
					<Button
						variant="outline"
						class="gap-1.5 text-xs"
						onclick={exportFinalRanking}
						disabled={!leaderboard}
						title="Ekspor Leaderboard Prioritas Ulasan (Vi) ke file CSV"
					>
						<HugeiconsIcon icon={Download04Icon} class="size-3.5" />
						<span>Ekspor CSV</span>
					</Button>
					<Badge
						variant="outline"
						class="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
					>
						Dihitung via SAW
					</Badge>
				</div>
			</div>

			<!-- Podium display (top 3) -->
			{#if leaderboard.rankings.length >= 3}
				<div class="px-4 pt-4 pb-2 border-b border-border/60 bg-muted/20 print:hidden">
					<div class="flex items-end justify-center gap-3">
						<!-- 2nd place -->
						{#if leaderboard.rankings[1]}
							<div class="flex flex-col items-center gap-1 min-w-0 flex-1 max-w-[160px]">
								<span class="text-[10px] font-semibold text-muted-foreground truncate w-full text-center">
									{leaderboard.rankings[1].productName}
								</span>
								<div class="w-full h-14 rounded-t-lg bg-slate-200 dark:bg-slate-700 flex flex-col items-center justify-center gap-0.5">
									<span class="text-xl font-black text-slate-600 dark:text-slate-300">🥈</span>
									<span class="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
										{fmt4(leaderboard.rankings[1].preferenceValue)}
									</span>
								</div>
							</div>
						{/if}

						<!-- 1st place -->
						{#if leaderboard.rankings[0]}
							<div class="flex flex-col items-center gap-1 min-w-0 flex-1 max-w-[160px]">
								<span class="text-[10px] font-bold text-foreground truncate w-full text-center">
									{leaderboard.rankings[0].productName}
								</span>
								<div class="w-full h-20 rounded-t-lg bg-[#FF0000]/10 border border-[#FF0000]/30 flex flex-col items-center justify-center gap-0.5">
									<span class="text-2xl font-black">🥇</span>
									<span class="text-[10px] font-mono font-extrabold text-[#FF0000]">
										{fmt4(leaderboard.rankings[0].preferenceValue)}
									</span>
								</div>
							</div>
						{/if}

						<!-- 3rd place -->
						{#if leaderboard.rankings[2]}
							<div class="flex flex-col items-center gap-1 min-w-0 flex-1 max-w-[160px]">
								<span class="text-[10px] font-semibold text-muted-foreground truncate w-full text-center">
									{leaderboard.rankings[2].productName}
								</span>
								<div class="w-full h-10 rounded-t-lg bg-amber-700/10 flex flex-col items-center justify-center gap-0.5">
									<span class="text-lg font-black">🥉</span>
									<span class="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
										{fmt4(leaderboard.rankings[2].preferenceValue)}
									</span>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Full ranking table -->
			<div class="overflow-x-auto">
				<Table.Root class="w-full text-left text-xs">
					<Table.Header class="border-b border-border/60 bg-muted/40 text-[11px] text-muted-foreground font-semibold">
						<Table.Row>
							<Table.Head class="py-3 px-4 w-16 text-center">Rank</Table.Head>
							<Table.Head class="py-3 px-4">Candidate Product</Table.Head>
							<Table.Head class="py-3 px-4 text-right">C1</Table.Head>
							<Table.Head class="py-3 px-4 text-right">C2</Table.Head>
							<Table.Head class="py-3 px-4 text-right">C3</Table.Head>
							<Table.Head class="py-3 px-4 text-right">C4</Table.Head>
							<Table.Head class="py-3 px-4 text-right font-bold text-foreground">V<sub>i</sub></Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body class="divide-y divide-border/40">
						{#each leaderboard.rankings as r (r.id)}
							<Table.Row
								class="hover:bg-muted/30 transition-colors {r.rank === 1
									? 'bg-[#FF0000]/5 font-medium'
									: ''}"
							>
								<Table.Cell class="py-3 px-4 text-center">
									{#if r.rank === 1}
										<span
											class="inline-flex size-6 items-center justify-center rounded-full bg-[#FF0000] text-white font-bold text-xs"
										>1</span>
									{:else if r.rank === 2}
										<span
											class="inline-flex size-6 items-center justify-center rounded-full bg-slate-300 text-slate-900 dark:bg-slate-700 dark:text-slate-100 font-bold text-xs"
										>2</span>
									{:else if r.rank === 3}
										<span
											class="inline-flex size-6 items-center justify-center rounded-full bg-amber-700/20 text-amber-800 dark:text-amber-400 font-bold text-xs"
										>3</span>
									{:else}
										<span class="text-muted-foreground font-semibold">#{r.rank}</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="py-3 px-4 font-semibold text-foreground">
									{r.productName}
								</Table.Cell>
								<Table.Cell class="py-3 px-4 text-right font-mono text-muted-foreground">
									{r.requestCount}
								</Table.Cell>
								<Table.Cell class="py-3 px-4 text-right font-mono text-muted-foreground">
									{r.uniqueRequester}
								</Table.Cell>
								<Table.Cell class="py-3 px-4 text-right font-mono text-muted-foreground">
									{r.averageRequestLikes.toFixed(2)}
								</Table.Cell>
								<Table.Cell class="py-3 px-4 text-right font-mono text-muted-foreground">
									{(r.recentRequestRatio * 100).toFixed(0)}%
								</Table.Cell>
								<Table.Cell class="py-3 px-4 text-right font-mono font-extrabold text-foreground text-sm">
									{r.preferenceValue.toFixed(4)}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>

			<!-- Trophy icon callout for winner -->
			{#if leaderboard.rankings.length > 0}
				<div class="p-3 border-t border-border/60 bg-muted/20 flex items-center gap-2 print:border-t print:border-neutral-300 print:bg-transparent">
					<HugeiconsIcon icon={TrophyIcon} class="size-4 text-amber-500 shrink-0 print:hidden" />
					<p class="text-[10px] text-muted-foreground print:text-neutral-700 print:text-xs">
						<span class="font-semibold text-foreground print:text-black">{leaderboard.rankings[0].productName}</span>
						diprioritaskan sebagai produk dengan Preference Value tertinggi (V<sub>i</sub> =
						{leaderboard.rankings[0].preferenceValue.toFixed(4)}).
					</p>
				</div>
			{/if}
		</section>
	{/if}
</div>
