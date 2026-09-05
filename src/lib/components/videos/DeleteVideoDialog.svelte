<script lang="ts">
	import type { YouTubeVideo } from '$lib/types';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Alert02Icon, Loading03Icon } from '@hugeicons/core-free-icons';

	interface Props {
		open: boolean;
		video: YouTubeVideo | null;
		onconfirm: (videoId: string) => Promise<void> | void;
		oncancel?: () => void;
	}

	let {
		open = $bindable(false),
		video = null,
		onconfirm,
		oncancel
	}: Props = $props();

	let isDeleting = $state(false);
	let error = $state<string | null>(null);

	$effect(() => {
		if (open) {
			isDeleting = false;
			error = null;
		}
	});

	async function handleConfirm() {
		if (!video) return;
		isDeleting = true;
		error = null;
		try {
			await onconfirm(video.id);
			open = false;
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Gagal menghapus video.';
		} finally {
			isDeleting = false;
		}
	}

	function handleOpenChange(isOpen: boolean) {
		open = isOpen;
		if (!isOpen && oncancel) {
			oncancel();
		}
	}
</script>

<AlertDialog.Root bind:open={open} onOpenChange={handleOpenChange}>
	<AlertDialog.Content class="sm:max-w-[440px]">
		<AlertDialog.Header>
			<div class="flex items-center gap-3">
				<div class="flex size-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
					<HugeiconsIcon icon={Alert02Icon} class="size-5" />
				</div>
				<div>
					<AlertDialog.Title class="text-base font-bold text-foreground">
						Hapus Video YouTube?
					</AlertDialog.Title>
					<AlertDialog.Description class="text-xs text-muted-foreground mt-0.5">
						Tindakan ini akan menghapus video dari Analysis Project.
					</AlertDialog.Description>
				</div>
			</div>
		</AlertDialog.Header>

		<div class="space-y-3 py-2 text-xs text-muted-foreground">
			{#if video}
				<div class="flex items-center gap-3 p-2 rounded-lg bg-muted/40 border border-border/50">
					{#if video.thumbnailUrl}
						<img
							src={video.thumbnailUrl}
							alt={video.title}
							class="w-16 aspect-video object-cover rounded"
						/>
					{/if}
					<div class="flex-1 min-w-0">
						<p class="font-medium text-foreground truncate text-xs">{video.title}</p>
						<p class="text-[11px] text-muted-foreground truncate">{video.channelTitle || 'YouTube'}</p>
					</div>
				</div>
			{/if}

			<p>
				Apakah Anda yakin ingin menghapus video ini?
			</p>

			<div class="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-[11px] text-rose-600 dark:text-rose-400">
				Seluruh data komentar yang pernah diambil dari video ini beserta deteksi kata kunci terkait akan dihapus dari project ini.
			</div>

			{#if error}
				<p class="text-[11px] font-medium text-destructive">{error}</p>
			{/if}
		</div>

		<AlertDialog.Footer class="gap-2 sm:gap-0">
			<Button
				variant="outline"
				disabled={isDeleting}
				onclick={() => handleOpenChange(false)}
				class="text-xs"
			>
				Batal
			</Button>
			<Button
				variant="destructive"
				disabled={isDeleting}
				onclick={handleConfirm}
				class="gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white"
			>
				{#if isDeleting}
					<HugeiconsIcon icon={Loading03Icon} class="size-3.5 animate-spin" />
					<span>Menghapus...</span>
				{:else}
					<span>Hapus Video</span>
				{/if}
			</Button>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
