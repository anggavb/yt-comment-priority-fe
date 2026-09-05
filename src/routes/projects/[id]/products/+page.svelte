<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/api';
	import type { CandidateProduct } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Layers01Icon,
		Add01Icon,
		Loading03Icon
	} from '@hugeicons/core-free-icons';

	let { data } = $props();
	let products = $state<CandidateProduct[]>([]);
	let isLoading = $state(true);

	onMount(async () => {
		try {
			products = await apiClient.getProducts(data.project.id);
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
				<span>Candidate Products</span>
				<Badge variant="outline" class="text-xs">
					{products.length} Produk
				</Badge>
			</h2>
			<p class="text-xs text-muted-foreground mt-0.5">
				Alternatif produk yang dievaluasi untuk ditentukan peringkat prioritas ulasannya berdasarkan interaksi komentar.
			</p>
		</div>

		<Button
			class="gap-1.5 self-start sm:self-auto bg-[#FF0000] hover:bg-[#FF0000]/90 text-white text-xs"
			disabled
			title="Fitur manajemen produk & kata kunci akan diaktifkan pada Issue #4"
		>
			<HugeiconsIcon icon={Add01Icon} class="size-3.5" />
			<span>Tambah Produk</span>
			<Badge variant="secondary" class="ml-1 text-[9px] bg-white/20 text-white">
				Issue #4
			</Badge>
		</Button>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center py-16 text-muted-foreground">
			<HugeiconsIcon icon={Loading03Icon} class="size-6 animate-spin text-primary" />
			<span class="ml-2 text-xs">Memuat candidate products...</span>
		</div>
	{:else if products.length === 0}
		<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 py-12 px-4 text-center">
			<div class="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
				<HugeiconsIcon icon={Layers01Icon} class="size-6" />
			</div>
			<h3 class="mt-3 text-sm font-semibold text-foreground">Belum Ada Candidate Product</h3>
			<p class="mt-1 text-xs text-muted-foreground max-w-sm">
				Tambahkan alternatif produk beserta kata kunci spesifiknya untuk mendeteksi kemunculannya pada komentar audiens.
			</p>
			<Badge variant="outline" class="mt-4 text-[10px] text-muted-foreground">
				Manajemen Produk & Product Keywords disiapkan pada Issue #4
			</Badge>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each products as product (product.id)}
				<Card class="border-border/70 hover:border-border transition-all flex flex-col justify-between">
					<CardHeader class="pb-3">
						<CardTitle class="text-sm font-bold text-foreground">
							{product.name}
						</CardTitle>
						<p class="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[32px]">
							{product.description || 'Tidak ada deskripsi produk.'}
						</p>
					</CardHeader>

					<CardContent class="pt-0">
						<div class="space-y-2">
							<span class="text-[11px] font-semibold text-muted-foreground">
								Product Keywords ({product.keywords?.length || 0}):
							</span>
							<div class="flex flex-wrap gap-1.5">
								{#each product.keywords || [] as kw (kw.id)}
									<span class="inline-flex items-center rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-[11px] font-mono text-foreground">
										{kw.keyword}
									</span>
								{/each}
							</div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
