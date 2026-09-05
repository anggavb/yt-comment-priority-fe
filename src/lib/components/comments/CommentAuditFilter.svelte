<script lang="ts">
	import type { CandidateProduct, CommentAuditStatus } from '$lib/types';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Search01Icon,
		Cancel01Icon,
		FilterIcon
	} from '@hugeicons/core-free-icons';

	interface Props {
		products: CandidateProduct[];
		selectedProductId: string;
		selectedStatus: CommentAuditStatus;
		searchQuery: string;
		totalResults?: number;
		onproductchange: (id: string) => void;
		onstatuschange: (status: CommentAuditStatus) => void;
		onsearchchange: (query: string) => void;
		onreset: () => void;
	}

	let {
		products = [],
		selectedProductId,
		selectedStatus,
		searchQuery,
		totalResults,
		onproductchange,
		onstatuschange,
		onsearchchange,
		onreset
	}: Props = $props();

	let hasActiveFilters = $derived(
		selectedProductId !== '' || selectedStatus !== 'all' || searchQuery.trim() !== ''
	);

	function handleSearchInput(e: Event) {
		const target = e.target as HTMLInputElement;
		onsearchchange(target.value);
	}

	function clearSearch() {
		onsearchchange('');
	}
</script>

<div class="rounded-xl border border-border/70 bg-card p-4 shadow-2xs space-y-3">
	<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
		<!-- Search Input -->
		<div class="relative flex-1">
			<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
				<HugeiconsIcon icon={Search01Icon} class="size-4" />
			</div>
			<Input
				type="text"
				placeholder="Cari isi komentar atau nama pengirim..."
				value={searchQuery}
				oninput={handleSearchInput}
				class="pl-9 pr-9 h-9 text-xs"
			/>
			{#if searchQuery}
				<button
					type="button"
					onclick={clearSearch}
					class="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
					title="Hapus pencarian"
				>
					<HugeiconsIcon icon={Cancel01Icon} class="size-3.5" />
				</button>
			{/if}
		</div>

		<!-- Filters Group -->
		<div class="flex flex-wrap items-center gap-2">
			<!-- Product Filter Dropdown -->
			<div class="flex items-center gap-1.5">
				<label for="product-filter" class="text-xs text-muted-foreground whitespace-nowrap font-medium">
					Produk:
				</label>
				<select
					id="product-filter"
					value={selectedProductId}
					onchange={(e) => onproductchange((e.target as HTMLSelectElement).value)}
					class="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
				>
					<option value="">Semua Produk ({products.length})</option>
					{#each products as prod (prod.id)}
						<option value={prod.id}>{prod.name}</option>
					{/each}
				</select>
			</div>

			<!-- Status Filter Dropdown -->
			<div class="flex items-center gap-1.5">
				<label for="status-filter" class="text-xs text-muted-foreground whitespace-nowrap font-medium">
					Status:
				</label>
				<select
					id="status-filter"
					value={selectedStatus}
					onchange={(e) =>
						onstatuschange(
							(e.target as HTMLSelectElement).value as CommentAuditStatus
						)}
					class="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
				>
					<option value="all">Semua Status</option>
					<option value="mention">Mentions Saja</option>
					<option value="request">Requests Saja</option>
					<option value="unmatched">Unmatched Saja</option>
				</select>
			</div>

			<!-- Reset Filter Button -->
			{#if hasActiveFilters}
				<Button
					variant="ghost"
					size="sm"
					onclick={onreset}
					class="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
				>
					<HugeiconsIcon icon={Cancel01Icon} class="size-3.5" />
					<span>Reset Filter</span>
				</Button>
			{/if}
		</div>
	</div>

	<!-- Filter Summary / Count Indicator -->
	<div class="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
		<div class="flex items-center gap-2 flex-wrap">
			<span class="flex items-center gap-1">
				<HugeiconsIcon icon={FilterIcon} class="size-3 text-muted-foreground" />
				<span>Menampilkan:</span>
			</span>
			{#if selectedStatus !== 'all'}
				<Badge variant="secondary" class="text-[11px] capitalize">
					Status: {selectedStatus === 'mention' ? 'Mentions' : selectedStatus === 'request' ? 'Requests' : 'Unmatched'}
				</Badge>
			{/if}
			{#if selectedProductId}
				<Badge variant="secondary" class="text-[11px]">
					Produk: {products.find((p) => p.id === selectedProductId)?.name || selectedProductId}
				</Badge>
			{/if}
			{#if searchQuery}
				<Badge variant="secondary" class="text-[11px]">
					Query: "{searchQuery}"
				</Badge>
			{/if}
			{#if !hasActiveFilters}
				<span class="text-[11px] text-muted-foreground">Semua filter netral</span>
			{/if}
		</div>

		{#if totalResults !== undefined}
			<span class="text-[11px] font-mono">
				Ditemukan <strong class="text-foreground">{totalResults}</strong> komentar
			</span>
		{/if}
	</div>
</div>
