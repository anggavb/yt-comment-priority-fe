<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/api';
	import type { RankingLeaderboard } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ChartHistogramIcon,
		CalculatorIcon,
		Loading03Icon,
		SparklesIcon
	} from '@hugeicons/core-free-icons';

	let { data } = $props();
	let leaderboard = $state<RankingLeaderboard | null>(null);
	let isLoading = $state(true);

	onMount(async () => {
		try {
			leaderboard = await apiClient.getRankings(data.project.id);
		} finally {
			isLoading = false;
		}
	});
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
				Peringkat prioritas produk review berdasarkan Simple Additive Weighting dengan transparansi akademik 4 matriks.
			</p>
		</div>

		<Button
			class="gap-1.5 self-start sm:self-auto bg-[#FF0000] hover:bg-[#FF0000]/90 text-white text-xs"
			disabled
			title="Fitur hitung ulang SAW & multi-table transparency akan diaktifkan pada Issue #7"
		>
			<HugeiconsIcon icon={CalculatorIcon} class="size-3.5" />
			<span>Hitung Ulang SAW</span>
			<Badge variant="secondary" class="ml-1 text-[9px] bg-white/20 text-white">
				Issue #7
			</Badge>
		</Button>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center py-16 text-muted-foreground">
			<HugeiconsIcon icon={Loading03Icon} class="size-6 animate-spin text-primary" />
			<span class="ml-2 text-xs">Memuat hasil perangkingan...</span>
		</div>
	{:else if !leaderboard || leaderboard.rankings.length === 0}
		<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 py-12 px-4 text-center">
			<div class="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
				<HugeiconsIcon icon={ChartHistogramIcon} class="size-6" />
			</div>
			<h3 class="mt-3 text-sm font-semibold text-foreground">Ranking Belum Dihitung</h3>
			<p class="mt-1 text-xs text-muted-foreground max-w-sm">
				Pastikan video terhubung, candidate products ditentukan, dan komentar telah diekstraksi sebelum menjalankan perhitungan SAW.
			</p>
			<Badge variant="outline" class="mt-4 text-[10px] text-muted-foreground">
				SAW Engine & Multi-Table Academic Transparency disiapkan pada Issue #7
			</Badge>
		</div>
	{:else}
		<!-- Ranking Leaderboard Table -->
		<div class="rounded-xl border border-border/70 bg-card overflow-hidden">
			<div class="p-4 border-b border-border/60 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<HugeiconsIcon icon={SparklesIcon} class="size-4 text-amber-500" />
					<h3 class="text-xs font-bold uppercase tracking-wider text-foreground">
						Leaderboard Prioritas Ulasan (Preference Value V<sub>i</sub>)
					</h3>
				</div>
				<Badge variant="outline" class="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
					Dihitung via SAW
				</Badge>
			</div>

			<div class="overflow-x-auto">
				<Table.Root class="w-full text-left text-xs">
					<Table.Header class="border-b border-border/60 bg-muted/40 text-[11px] text-muted-foreground font-semibold">
						<Table.Row>
							<Table.Head class="py-3 px-4 w-16 text-center">Rank</Table.Head>
							<Table.Head class="py-3 px-4">Candidate Product</Table.Head>
							<Table.Head class="py-3 px-4 text-right">Request Count (C1)</Table.Head>
							<Table.Head class="py-3 px-4 text-right">Unique Requester (C2)</Table.Head>
							<Table.Head class="py-3 px-4 text-right">Avg Likes (C3)</Table.Head>
							<Table.Head class="py-3 px-4 text-right">Recent Ratio (C4)</Table.Head>
							<Table.Head class="py-3 px-4 text-right font-bold text-foreground">Preference Value (V<sub>i</sub>)</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body class="divide-y divide-border/40">
						{#each leaderboard.rankings as r (r.id)}
							<Table.Row class="hover:bg-muted/30 transition-colors {r.rank === 1 ? 'bg-[#FF0000]/5 font-medium' : ''}">
								<Table.Cell class="py-3 px-4 text-center">
									{#if r.rank === 1}
										<span class="inline-flex size-6 items-center justify-center rounded-full bg-[#FF0000] text-white font-bold text-xs">
											1
										</span>
									{:else if r.rank === 2}
										<span class="inline-flex size-6 items-center justify-center rounded-full bg-slate-300 text-slate-900 dark:bg-slate-700 dark:text-slate-100 font-bold text-xs">
											2
										</span>
									{:else if r.rank === 3}
										<span class="inline-flex size-6 items-center justify-center rounded-full bg-amber-700/20 text-amber-800 dark:text-amber-400 font-bold text-xs">
											3
										</span>
									{:else}
										<span class="text-muted-foreground font-semibold">
											#{r.rank}
										</span>
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
									{r.averageRequestLikes.toFixed(1)}
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
		</div>
	{/if}
</div>
