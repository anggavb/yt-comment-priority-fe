<script lang="ts">
	import type { OEmbedPreview } from '$lib/types';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Video01Icon,
		Loading03Icon,
		CheckmarkCircle02Icon,
		Alert02Icon,
		ExternalLinkIcon,
		SparklesIcon
	} from '@hugeicons/core-free-icons';
	import {
		extractYouTubeVideoId,
		validateVideoInput,
		fetchYouTubeOEmbed,
		toCanonicalWatchUrl,
		COMMENT_LIMIT_PRESETS,
		DEFAULT_MAX_COMMENTS
	} from '$lib/utils/youtube';

	interface Props {
		open: boolean;
		onsubmit: (data: {
			url: string;
			maxComments: number;
			title?: string;
			thumbnailUrl?: string;
			channelTitle?: string;
			autoFetch?: boolean;
		}) => Promise<void> | void;
		oncancel?: () => void;
	}

	let {
		open = $bindable(false),
		onsubmit,
		oncancel
	}: Props = $props();

	let inputUrl = $state('');
	let maxComments = $state(DEFAULT_MAX_COMMENTS);
	let autoFetch = $state(true);

	let preview = $state<OEmbedPreview | null>(null);
	let isPreviewLoading = $state(false);
	let previewError = $state<string | null>(null);

	let inputError = $state<string | null>(null);
	let isSubmitting = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if (open) {
			inputUrl = '';
			maxComments = DEFAULT_MAX_COMMENTS;
			autoFetch = true;
			preview = null;
			isPreviewLoading = false;
			previewError = null;
			inputError = null;
			isSubmitting = false;
		}
	});

	function handleUrlChange(newVal: string) {
		inputUrl = newVal;
		inputError = null;
		previewError = null;

		if (debounceTimer) clearTimeout(debounceTimer);

		const trimmed = newVal.trim();
		if (!trimmed) {
			preview = null;
			isPreviewLoading = false;
			return;
		}

		const videoId = extractYouTubeVideoId(trimmed);
		if (!videoId) {
			preview = null;
			isPreviewLoading = false;
			return;
		}

		// Valid video ID detected, fetch live oEmbed preview
		isPreviewLoading = true;
		preview = null;

		debounceTimer = setTimeout(async () => {
			try {
				const oembed = await fetchYouTubeOEmbed(videoId);
				// Verify user didn't change the input in the meantime
				if (extractYouTubeVideoId(inputUrl.trim()) === videoId) {
					preview = oembed;
					previewError = null;
				}
			} catch (err: unknown) {
				if (extractYouTubeVideoId(inputUrl.trim()) === videoId) {
					previewError = err instanceof Error ? err.message : 'Gagal memuat pratinjau video.';
				}
			} finally {
				isPreviewLoading = false;
			}
		}, 300);
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		const validation = validateVideoInput(inputUrl, maxComments);
		if (!validation.isValid) {
			inputError = validation.error || 'Input tidak valid.';
			return;
		}

		inputError = null;
		isSubmitting = true;

		try {
			const videoId = validation.videoId!;
			const canonicalUrl = toCanonicalWatchUrl(videoId);

			await onsubmit({
				url: canonicalUrl,
				maxComments,
				title: preview?.title,
				thumbnailUrl: preview?.thumbnailUrl,
				channelTitle: preview?.authorName,
				autoFetch
			});

			open = false;
		} catch (err: unknown) {
			inputError = err instanceof Error ? err.message : 'Gagal menambahkan video.';
		} finally {
			isSubmitting = false;
		}
	}

	function handleOpenChange(isOpen: boolean) {
		open = isOpen;
		if (!isOpen && oncancel) {
			oncancel();
		}
	}
</script>

<Dialog.Root bind:open={open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-[520px]">
		<form onsubmit={handleSubmit} class="space-y-4">
			<Dialog.Header>
				<div class="flex items-center gap-2.5">
					<div class="flex size-9 items-center justify-center rounded-lg bg-[#FF0000]/10 text-[#FF0000] shrink-0">
						<HugeiconsIcon icon={Video01Icon} class="size-5" />
					</div>
					<div>
						<Dialog.Title class="text-base font-bold text-foreground">
							Tambah Video YouTube
						</Dialog.Title>
						<Dialog.Description class="text-xs text-muted-foreground mt-0.5">
							Hubungkan video YouTube sebagai sumber data komentar untuk dianalisis.
						</Dialog.Description>
					</div>
				</div>
			</Dialog.Header>

			<!-- URL / Video ID Input -->
			<div class="space-y-1.5">
				<div class="flex items-center justify-between">
					<Label for="video-url" class="text-xs font-semibold text-foreground">
						URL atau ID Video YouTube <span class="text-destructive">*</span>
					</Label>
					<span class="text-[10px] text-muted-foreground">watch, youtu.be, shorts, atau 11-karakter ID</span>
				</div>
				<Input
					id="video-url"
					type="text"
					value={inputUrl}
					oninput={(e) => handleUrlChange(e.currentTarget.value)}
					placeholder="https://www.youtube.com/watch?v=... atau dQw4w9WgXcQ"
					class="text-xs h-9 {inputError ? 'border-destructive focus-visible:ring-destructive' : ''}"
					disabled={isSubmitting}
					autocomplete="off"
				/>
				{#if inputError}
					<p class="text-[11px] font-medium text-destructive">{inputError}</p>
				{/if}
			</div>

			<!-- Live oEmbed Preview -->
			{#if isPreviewLoading}
				<div class="flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-muted/20 py-6 text-xs text-muted-foreground">
					<HugeiconsIcon icon={Loading03Icon} class="size-4 animate-spin text-primary" />
					<span>Memeriksa metadata video melalui oEmbed...</span>
				</div>
			{:else if preview}
				<div class="rounded-lg border border-border/70 bg-card p-3 space-y-2.5 shadow-sm">
					<div class="flex items-center justify-between text-[11px]">
						<span class="font-medium text-muted-foreground flex items-center gap-1.5">
							<HugeiconsIcon icon={SparklesIcon} class="size-3.5 text-amber-500" />
							Pratinjau Video (oEmbed)
						</span>
						<Badge variant="outline" class="text-[9px] gap-1 border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
							<HugeiconsIcon icon={CheckmarkCircle02Icon} class="size-2.5" />
							Terverifikasi
						</Badge>
					</div>

					<div class="flex gap-3">
						<div class="relative w-32 aspect-video rounded overflow-hidden bg-muted shrink-0 border border-border/40">
							<img
								src={preview.thumbnailUrl}
								alt={preview.title}
								class="h-full w-full object-cover"
							/>
						</div>
						<div class="flex-1 min-w-0 flex flex-col justify-between">
							<div>
								<h4 class="text-xs font-semibold text-foreground line-clamp-2 leading-snug">
									{preview.title}
								</h4>
								<p class="text-[11px] text-muted-foreground mt-0.5 truncate">
									{preview.authorName}
								</p>
							</div>
							<a
								href={toCanonicalWatchUrl(preview.videoId)}
								target="_blank"
								rel="noreferrer"
								class="inline-flex items-center gap-1 text-[10px] text-primary hover:underline self-start mt-1"
							>
								<span>Buka di YouTube</span>
								<HugeiconsIcon icon={ExternalLinkIcon} class="size-2.5" />
							</a>
						</div>
					</div>
				</div>
			{:else if previewError}
				<div class="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] text-amber-700 dark:text-amber-300">
					<HugeiconsIcon icon={Alert02Icon} class="size-4 shrink-0 mt-0.5 text-amber-600" />
					<span>{previewError}</span>
				</div>
			{/if}

			<!-- Max Comments Setting -->
			<div class="space-y-2 pt-1">
				<div class="flex items-center justify-between">
					<Label for="video-max-comments" class="text-xs font-semibold text-foreground">
						Batas Maksimal Komentar
					</Label>
					<span class="text-[11px] text-muted-foreground">Default: 500 komentar</span>
				</div>

				<Input
					id="video-max-comments"
					type="number"
					min="1"
					max="10000"
					bind:value={maxComments}
					placeholder="500"
					class="text-xs h-9"
					disabled={isSubmitting}
				/>

				<!-- Presets -->
				<div class="flex items-center gap-1.5 flex-wrap">
					<span class="text-[11px] text-muted-foreground mr-1">Preset:</span>
					{#each COMMENT_LIMIT_PRESETS as preset (preset)}
						<Button
							type="button"
							variant={maxComments === preset ? 'default' : 'outline'}
							size="sm"
							class="h-6 px-2 text-[11px]"
							onclick={() => (maxComments = preset)}
						>
							{preset}
						</Button>
					{/each}
				</div>
				<p class="text-[10px] text-muted-foreground">
					Membatasi komentar menghemat kuota harian YouTube Data API v3 sekaligus menyediakan sampel yang representatif.
				</p>
			</div>

			<!-- Auto Fetch Checkbox -->
			<div class="flex items-center gap-2 pt-1">
				<Checkbox
					id="auto-fetch-checkbox"
					bind:checked={autoFetch}
					disabled={isSubmitting}
				/>
				<Label for="auto-fetch-checkbox" class="text-xs text-foreground cursor-pointer select-none">
					Langsung ambil komentar secara otomatis setelah video ditambahkan
				</Label>
			</div>

			<Dialog.Footer class="gap-2 sm:gap-0 pt-3 border-t border-border/50">
				<Button
					type="button"
					variant="outline"
					disabled={isSubmitting}
					onclick={() => handleOpenChange(false)}
					class="text-xs"
				>
					Batal
				</Button>
				<Button
					type="submit"
					disabled={isSubmitting}
					class="gap-1.5 text-xs bg-[#FF0000] hover:bg-[#FF0000]/90 text-white"
				>
					{#if isSubmitting}
						<HugeiconsIcon icon={Loading03Icon} class="size-3.5 animate-spin" />
						<span>Menyimpan...</span>
					{:else}
						<HugeiconsIcon icon={Video01Icon} class="size-3.5" />
						<span>Tambah Video</span>
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
