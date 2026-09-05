<script lang="ts">
	import type { RequestKeyword } from '$lib/types';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Globe02Icon,
		Add01Icon,
		Cancel01Icon,
		Loading03Icon,
		InformationCircleIcon,
		ArrowDown01Icon,
		ArrowUp01Icon
	} from '@hugeicons/core-free-icons';
	import { validateKeyword, normalizeKeyword } from './validation';

	interface Props {
		requestKeywords: RequestKeyword[];
		onadd: (keyword: string) => Promise<void> | void;
		ondelete: (keywordId: string) => Promise<void> | void;
		isLoading?: boolean;
	}

	let {
		requestKeywords,
		onadd,
		ondelete,
		isLoading = false
	}: Props = $props();

	let newKeywordInput = $state('');
	let isAdding = $state(false);
	let deletingId = $state<string | null>(null);
	let errorText = $state<string | null>(null);
	let isCollapsed = $state(false);

	let existingKeywords = $derived(requestKeywords.map((r) => r.keyword));

	async function handleAdd() {
		errorText = null;
		const trimmed = newKeywordInput.trim();
		if (!trimmed) return;

		const validation = validateKeyword(trimmed, existingKeywords);
		if (!validation.isValid) {
			errorText = validation.error || 'Kata kunci permintaan tidak valid.';
			return;
		}

		isAdding = true;
		try {
			const normalized = normalizeKeyword(trimmed);
			await onadd(normalized);
			newKeywordInput = '';
		} catch (err: unknown) {
			errorText = err instanceof Error ? err.message : 'Gagal menambahkan kata kunci permintaan.';
		} finally {
			isAdding = false;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleAdd();
		} else {
			if (errorText) errorText = null;
		}
	}

	async function handleDelete(kw: RequestKeyword) {
		deletingId = kw.id;
		try {
			await ondelete(kw.id);
		} finally {
			deletingId = null;
		}
	}
</script>

<Card class="border-border/80 bg-card/60 backdrop-blur-xs shadow-xs transition-all">
	<CardHeader class="pb-3">
		<div class="flex items-center justify-between gap-3">
			<div class="flex items-center gap-2.5">
				<div class="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
					<HugeiconsIcon icon={Globe02Icon} class="size-4" />
				</div>
				<div>
					<div class="flex items-center gap-2">
						<CardTitle class="text-sm font-bold text-foreground">
							Global Request Keywords Dictionary
						</CardTitle>
						<Badge variant="secondary" class="text-[10px] px-1.5 py-0 h-4 font-mono font-medium">
							{requestKeywords.length} kata kunci
						</Badge>
					</div>
					<p class="text-xs text-muted-foreground mt-0.5">
						Kamus kata kunci permintaan ulasan umum yang berlaku global pada seluruh Analysis Project (ADR-0004).
					</p>
				</div>
			</div>

			<Button
				variant="ghost"
				size="xs"
				class="size-7 p-0 text-muted-foreground hover:text-foreground"
				onclick={() => (isCollapsed = !isCollapsed)}
				title={isCollapsed ? 'Tampilkan detail kamus' : 'Sembunyikan detail kamus'}
			>
				<HugeiconsIcon icon={isCollapsed ? ArrowDown01Icon : ArrowUp01Icon} class="size-4" />
			</Button>
		</div>
	</CardHeader>

	{#if !isCollapsed}
		<CardContent class="pt-0 space-y-4">
			<!-- Info Banner -->
			<div class="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs text-muted-foreground leading-relaxed">
				<HugeiconsIcon icon={InformationCircleIcon} class="size-4 text-primary shrink-0 mt-0.5" />
				<div>
					Komentar audiens diklasifikasikan sebagai <strong class="text-foreground font-semibold">Request</strong> apabila memuat minimal satu <span class="text-foreground font-medium">Product Keyword</span> dan minimal satu <span class="text-foreground font-medium">Request Keyword</span> di bawah ini.
				</div>
			</div>

			<!-- Trigger Words Badges List -->
			<div class="space-y-2">
				<div class="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
					<span>Daftar Request Keywords Aktif:</span>
					<span>Klik ikon tanda silang untuk menghapus</span>
				</div>

				{#if isLoading}
					<div class="flex items-center gap-2 py-3 text-xs text-muted-foreground">
						<HugeiconsIcon icon={Loading03Icon} class="size-4 animate-spin text-primary" />
						<span>Memuat kamus kata kunci...</span>
					</div>
				{:else if requestKeywords.length === 0}
					<div class="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
						Belum ada Request Keyword global. Tambahkan kata kunci permintaan baru di bawah.
					</div>
				{:else}
					<div class="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto p-1 rounded-md border border-border/40 bg-muted/20">
						{#each requestKeywords as kw (kw.id)}
							<span
								class="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-background px-2.5 py-1 text-xs font-mono font-medium text-foreground shadow-2xs transition-colors hover:border-border"
							>
								<span>{kw.keyword}</span>
								<button
									type="button"
									disabled={deletingId === kw.id}
									class="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors focus:outline-hidden disabled:opacity-50"
									onclick={() => handleDelete(kw)}
									title="Hapus Request Keyword {kw.keyword}"
									aria-label="Hapus Request Keyword {kw.keyword}"
								>
									{#if deletingId === kw.id}
										<HugeiconsIcon icon={Loading03Icon} class="size-2.5 animate-spin" />
									{:else}
										<HugeiconsIcon icon={Cancel01Icon} class="size-2.5" />
									{/if}
								</button>
							</span>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Add New Request Keyword Input Bar -->
			<div class="pt-1">
				<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
					<div class="flex-1 relative">
						<Input
							type="text"
							bind:value={newKeywordInput}
							onkeydown={handleKeyDown}
							placeholder="Tambah Request Keyword baru (contoh: kupastuntas, unboxing, tes)..."
							disabled={isAdding}
							class="h-8 text-xs"
						/>
					</div>
					<Button
						type="button"
						size="sm"
						class="h-8 px-3 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
						disabled={!newKeywordInput.trim() || isAdding}
						onclick={handleAdd}
					>
						{#if isAdding}
							<HugeiconsIcon icon={Loading03Icon} class="size-3.5 animate-spin" />
							<span>Menambahkan...</span>
						{:else}
							<HugeiconsIcon icon={Add01Icon} class="size-3.5" />
							<span>Tambah Kata Kunci</span>
						{/if}
					</Button>
				</div>

				{#if errorText}
					<p class="text-[11px] font-medium text-destructive mt-1.5">{errorText}</p>
				{/if}
			</div>
		</CardContent>
	{/if}
</Card>
