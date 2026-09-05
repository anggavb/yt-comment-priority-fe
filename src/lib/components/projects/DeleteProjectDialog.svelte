<script lang="ts">
	import type { AnalysisProject } from '$lib/types';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Alert02Icon, Loading03Icon } from '@hugeicons/core-free-icons';

	interface Props {
		open: boolean;
		project: AnalysisProject | null;
		onconfirm: (projectId: string) => Promise<void> | void;
		oncancel?: () => void;
	}

	let {
		open = $bindable(false),
		project,
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
		if (!project) return;
		isDeleting = true;
		error = null;
		try {
			await onconfirm(project.id);
			open = false;
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Gagal menghapus project.';
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
						Hapus Analysis Project?
					</AlertDialog.Title>
					<AlertDialog.Description class="text-xs text-muted-foreground mt-0.5">
						Tindakan ini tidak dapat dibatalkan.
					</AlertDialog.Description>
				</div>
			</div>
		</AlertDialog.Header>

		<div class="space-y-3 py-2 text-xs text-muted-foreground">
			<p>
				Apakah Anda yakin ingin menghapus project
				<span class="font-semibold text-foreground">"{project?.name}"</span>?
			</p>
			<div class="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-[11px] text-rose-600 dark:text-rose-400">
				Seluruh data yang terhubung ke Analysis Project ini (video YouTube, komentar, candidate products, kata kunci, kriteria, dan hasil perangkingan) akan dihapus permanen.
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
					<span>Hapus Permanen</span>
				{/if}
			</Button>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
