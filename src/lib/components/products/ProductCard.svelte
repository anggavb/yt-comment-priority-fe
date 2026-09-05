<script lang="ts">
	import type { CandidateProduct, ProductKeyword } from '$lib/types';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Edit02Icon,
		Delete02Icon,
		Tag01Icon,
		Add01Icon,
		Cancel01Icon,
		Calendar01Icon,
		Loading03Icon
	} from '@hugeicons/core-free-icons';
	import { formatDate } from '$lib/components/projects/utils';
	import { validateKeyword, normalizeKeyword } from './validation';

	interface Props {
		product: CandidateProduct;
		onedit: (product: CandidateProduct) => void;
		ondelete: (product: CandidateProduct) => void;
		onaddkeyword: (productId: string, keyword: string) => Promise<void> | void;
		ondeletekeyword: (keywordId: string) => Promise<void> | void;
	}

	let {
		product,
		onedit,
		ondelete,
		onaddkeyword,
		ondeletekeyword
	}: Props = $props();

	let newKeywordInput = $state('');
	let isAddingKeyword = $state(false);
	let keywordError = $state<string | null>(null);
	let deletingKeywordId = $state<string | null>(null);

	let currentKeywords = $derived(product.keywords || []);
	let existingKeywordStrings = $derived(currentKeywords.map((k) => k.keyword));

	async function handleAddKeyword() {
		keywordError = null;
		const trimmed = newKeywordInput.trim();
		if (!trimmed) return;

		const validation = validateKeyword(trimmed, existingKeywordStrings);
		if (!validation.isValid) {
			keywordError = validation.error || 'Kata kunci tidak valid.';
			return;
		}

		isAddingKeyword = true;
		try {
			const normalized = normalizeKeyword(trimmed);
			await onaddkeyword(product.id, normalized);
			newKeywordInput = '';
		} catch (err: unknown) {
			keywordError = err instanceof Error ? err.message : 'Gagal menambahkan kata kunci.';
		} finally {
			isAddingKeyword = false;
		}
	}

	function handleInputKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			handleAddKeyword();
		} else {
			if (keywordError) keywordError = null;
		}
	}

	async function handleDeleteKeyword(kw: ProductKeyword) {
		deletingKeywordId = kw.id;
		try {
			await ondeletekeyword(kw.id);
		} finally {
			deletingKeywordId = null;
		}
	}
</script>

<Card class="border-border/70 hover:border-border transition-all flex flex-col justify-between bg-card group shadow-xs">
	<div>
		<!-- Card Header with Actions -->
		<CardHeader class="pb-3 space-y-2">
			<div class="flex items-start justify-between gap-2">
				<div class="min-w-0 flex-1">
					<CardTitle class="text-sm font-bold text-foreground leading-snug break-words">
						{product.name}
					</CardTitle>
					<div class="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
						<HugeiconsIcon icon={Calendar01Icon} class="size-3 text-muted-foreground/70" />
						<span>{formatDate(product.createdAt)}</span>
					</div>
				</div>

				<!-- Quick action buttons -->
				<div class="flex items-center gap-1 shrink-0">
					<Button
						variant="ghost"
						size="xs"
						class="size-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
						onclick={() => onedit(product)}
						title="Edit Candidate Product"
					>
						<HugeiconsIcon icon={Edit02Icon} class="size-3.5" />
					</Button>
					<Button
						variant="ghost"
						size="xs"
						class="size-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
						onclick={() => ondelete(product)}
						title="Hapus Candidate Product"
					>
						<HugeiconsIcon icon={Delete02Icon} class="size-3.5" />
					</Button>
				</div>
			</div>

			<p class="text-xs text-muted-foreground line-clamp-2 min-h-[32px] leading-relaxed">
				{product.description || 'Tidak ada deskripsi produk.'}
			</p>
		</CardHeader>

		<!-- Product Keywords Section -->
		<CardContent class="pt-0 space-y-3">
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<span class="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
						<HugeiconsIcon icon={Tag01Icon} class="size-3 text-primary" />
						<span>Product Keywords</span>
					</span>
					<Badge variant="outline" class="text-[10px] px-1.5 py-0 h-4">
						{currentKeywords.length} variasi
					</Badge>
				</div>

				<!-- Keywords Badges List -->
				<div class="flex flex-wrap gap-1.5 min-h-[28px]">
					{#if currentKeywords.length === 0}
						<span class="text-[11px] text-muted-foreground italic">
							Belum ada kata kunci terdaftar.
						</span>
					{:else}
						{#each currentKeywords as kw (kw.id)}
							<span
								class="inline-flex items-center gap-1 rounded-md border border-border/80 bg-muted/60 px-2 py-0.5 text-[11px] font-mono text-foreground transition-colors hover:bg-muted"
							>
								<span>{kw.keyword}</span>
								<button
									type="button"
									disabled={deletingKeywordId === kw.id}
									class="rounded p-0.5 text-muted-foreground hover:bg-muted-foreground/20 hover:text-destructive transition-colors focus:outline-hidden disabled:opacity-50"
									onclick={() => handleDeleteKeyword(kw)}
									title="Hapus kata kunci {kw.keyword}"
									aria-label="Hapus kata kunci {kw.keyword}"
								>
									{#if deletingKeywordId === kw.id}
										<HugeiconsIcon icon={Loading03Icon} class="size-2.5 animate-spin text-muted-foreground" />
									{:else}
										<HugeiconsIcon icon={Cancel01Icon} class="size-2.5" />
									{/if}
								</button>
							</span>
						{/each}
					{/if}
				</div>
			</div>
		</CardContent>
	</div>

	<!-- Quick Inline Keyword Add Footer -->
	<div class="px-4 pb-3 pt-2 border-t border-border/40">
		<div class="flex items-center gap-1.5">
			<Input
				type="text"
				bind:value={newKeywordInput}
				onkeydown={handleInputKeyDown}
				placeholder="+ Tambah variasi kata kunci..."
				disabled={isAddingKeyword}
				class="h-7 text-xs placeholder:text-muted-foreground/70"
			/>
			<Button
				type="button"
				variant="outline"
				size="sm"
				class="h-7 px-2 text-xs gap-1 shrink-0"
				disabled={!newKeywordInput.trim() || isAddingKeyword}
				onclick={handleAddKeyword}
			>
				{#if isAddingKeyword}
					<HugeiconsIcon icon={Loading03Icon} class="size-3 animate-spin" />
				{:else}
					<HugeiconsIcon icon={Add01Icon} class="size-3" />
					<span class="text-[11px]">Tambah</span>
				{/if}
			</Button>
		</div>

		{#if keywordError}
			<p class="text-[10px] font-medium text-destructive mt-1">{keywordError}</p>
		{/if}
	</div>
</Card>
