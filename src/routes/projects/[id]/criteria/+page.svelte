<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/api';
	import type { Criteria, C4TimeAnchorConfig } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		SlidersVerticalIcon,
		Clock01Icon,
		Loading03Icon
	} from '@hugeicons/core-free-icons';

	let { data } = $props();
	let criteriaList = $state<Criteria[]>([]);
	let c4Config = $state<C4TimeAnchorConfig | null>(null);
	let isLoading = $state(true);

	onMount(async () => {
		try {
			const res = await apiClient.getCriteria(data.project.id);
			criteriaList = res.criteria;
			c4Config = res.c4Config;
		} finally {
			isLoading = false;
		}
	});

	const totalWeight = $derived(
		criteriaList.reduce((acc, c) => acc + (c.weight || 0), 0)
	);
</script>

<div class="space-y-6">
	<!-- Tab Header -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
				<span>Konfigurasi Kriteria & Bobot SAW</span>
				<Badge variant="outline" class="text-xs">
					4 Kriteria (Total: {(totalWeight * 100).toFixed(0)}%)
				</Badge>
			</h2>
			<p class="text-xs text-muted-foreground mt-0.5">
				Kriteria evaluasi pengambilan keputusan multi-atribut menggunakan metode Simple Additive Weighting.
			</p>
		</div>

		<Button
			class="gap-1.5 self-start sm:self-auto bg-[#FF0000] hover:bg-[#FF0000]/90 text-white text-xs"
			disabled
			title="Fitur edit bobot & time-anchor C4 akan diaktifkan pada Issue #6"
		>
			<HugeiconsIcon icon={SlidersVerticalIcon} class="size-3.5" />
			<span>Sesuaikan Bobot & C4</span>
			<Badge variant="secondary" class="ml-1 text-[9px] bg-white/20 text-white">
				Issue #6
			</Badge>
		</Button>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center py-16 text-muted-foreground">
			<HugeiconsIcon icon={Loading03Icon} class="size-6 animate-spin text-primary" />
			<span class="ml-2 text-xs">Memuat konfigurasi kriteria...</span>
		</div>
	{:else}
		<!-- Criteria Cards Grid -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each criteriaList as crit (crit.id)}
				<Card class="border-border/70 bg-card">
					<CardHeader class="pb-2">
						<div class="flex items-center justify-between">
							<Badge variant="outline" class="font-mono text-xs font-bold text-primary">
								{crit.code}
							</Badge>
							<Badge variant="secondary" class="text-[10px] capitalize">
								{crit.attribute}
							</Badge>
						</div>
						<CardTitle class="mt-2 text-sm font-bold text-foreground">
							{crit.name}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="mt-2 flex items-baseline justify-between border-t border-border/40 pt-3">
							<span class="text-xs text-muted-foreground">Bobot (Weight):</span>
							<span class="text-base font-extrabold text-foreground">
								{(crit.weight * 100).toFixed(0)}%
							</span>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>

		<!-- Time Anchor C4 Notice Card -->
		<div class="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5">
			<div class="flex items-start gap-3">
				<div class="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
					<HugeiconsIcon icon={Clock01Icon} class="size-5" />
				</div>
				<div class="space-y-1">
					<div class="flex items-center gap-2">
						<h3 class="text-xs font-bold text-foreground">
							ADR-0001: Time-Anchor Recent Request Ratio
						</h3>
						<Badge variant="outline" class="text-[10px] border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
							Active
						</Badge>
					</div>
					<p class="text-xs text-muted-foreground leading-relaxed">
						Kriteria C4 dihitung dalam rentang <strong>{c4Config?.daysWindow ?? 30} hari</strong> secara relatif terhadap waktu komentar terbaru (<code class="text-[11px] font-mono">MAX(published_at)</code>), menjaga validitas matematis pada dataset historis penelitian.
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>
