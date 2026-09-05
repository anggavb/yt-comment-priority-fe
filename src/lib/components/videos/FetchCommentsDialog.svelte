<script lang="ts">
	import type { YouTubeVideo } from '$lib/types';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Comment01Icon, Loading03Icon, InformationCircleIcon } from '@hugeicons/core-free-icons';
	import {
		COMMENT_LIMIT_PRESETS,
		DEFAULT_MAX_COMMENTS,
		validateCommentLimit
	} from '$lib/utils/youtube';

	interface Props {
		open: boolean;
		video: YouTubeVideo | null;
		onconfirm: (videoId: string, maxComments: number) => Promise<void> | void;
		oncancel?: () => void;
	}

	let {
		open = $bindable(false),
		video = null,
		onconfirm,
		oncancel
	}: Props = $props();

	let maxComments = $state(DEFAULT_MAX_COMMENTS);
	let error = $state<string | null>(null);
	let isSubmitting = $state(false);

	$effect(() => {
		if (open) {
			maxComments = video?.maxComments || DEFAULT_MAX_COMMENTS;
			error = null;
			isSubmitting = false;
		}
	});

	async function handleConfirm(e: SubmitEvent) {
		e.preventDefault();
		if (!video) return;

		const limitCheck = validateCommentLimit(maxComments);
		if (!limitCheck.isValid) {
			error = limitCheck.error || 'Batas komentar tidak valid.';
			return;
		}

		error = null;
		isSubmitting = true;
		try {
			await onconfirm(video.id, maxComments);
			open = false;
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Gagal memulai pengambilan komentar.';
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
	<Dialog.Content class="sm:max-w-[460px]">
		<form onsubmit={handleConfirm} class="space-y-4">
			<Dialog.Header>
				<div class="flex items-center gap-2.5">
					<div class="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
						<HugeiconsIcon icon={Comment01Icon} class="size-4.5" />
					</div>
					<div>
						<Dialog.Title class="text-base font-bold text-foreground">
							{video?.fetchStatus === 'COMPLETED' ? 'Ambil Ulang Komentar' : 'Ambil Komentar YouTube'}
						</Dialog.Title>
						<Dialog.Description class="text-xs text-muted-foreground mt-0.5">
							Tentukan batas jumlah komentar untuk menjaga kuota YouTube Data API.
						</Dialog.Description>
					</div>
				</div>
			</Dialog.Header>

			{#if video}
				<div class="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 border border-border/60">
					{#if video.thumbnailUrl}
						<img
							src={video.thumbnailUrl}
							alt={video.title}
							class="w-20 aspect-video object-cover rounded shrink-0"
						/>
					{/if}
					<div class="flex-1 min-w-0">
						<p class="font-medium text-foreground truncate text-xs">{video.title}</p>
						<div class="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
							<span>{video.channelTitle || 'YouTube'}</span>
							{#if video.commentCount}
								<span>•</span>
								<Badge variant="outline" class="text-[9px] px-1 py-0">
									{video.commentCount} Komentar tersimpan
								</Badge>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<Label for="fetch-max-comments" class="text-xs font-semibold text-foreground">
						Batas Maksimal Komentar
					</Label>
					<span class="text-[11px] text-muted-foreground">Default: 500</span>
				</div>

				<Input
					id="fetch-max-comments"
					type="number"
					min="1"
					max="10000"
					bind:value={maxComments}
					placeholder="Contoh: 500"
					class="text-xs h-9"
				/>

				<!-- Presets -->
				<div class="flex items-center gap-1.5 flex-wrap pt-1">
					<span class="text-[11px] text-muted-foreground mr-1">Preset cepat:</span>
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

				<div class="flex items-start gap-1.5 p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 mt-2">
					<HugeiconsIcon icon={InformationCircleIcon} class="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
					<span>
						YouTube Data API v3 membatasi kuota harian. Menetapkan batas komentar 500 menjaga penggunaan kuota tetap hemat sekaligus mencukupi analisis statistik SAW.
					</span>
				</div>

				{#if error}
					<p class="text-[11px] font-medium text-destructive">{error}</p>
				{/if}
			</div>

			<Dialog.Footer class="gap-2 sm:gap-0 pt-2 border-t border-border/50">
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
					class="gap-1.5 text-xs bg-primary text-primary-foreground"
				>
					{#if isSubmitting}
						<HugeiconsIcon icon={Loading03Icon} class="size-3.5 animate-spin" />
						<span>Memulai...</span>
					{:else}
						<HugeiconsIcon icon={Comment01Icon} class="size-3.5" />
						<span>Mulai Ambil Komentar</span>
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
