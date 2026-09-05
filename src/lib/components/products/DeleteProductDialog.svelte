<script lang="ts">
	import type { CandidateProduct } from '$lib/types';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Alert02Icon, Loading03Icon } from '@hugeicons/core-free-icons';

	interface Props {
		open: boolean;
		product: CandidateProduct | null;
		onconfirm: (productId: string) => Promise<void> | void;
		oncancel?: () => void;
	}

	let {
		open = $bindable(false),
		product,
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
		if (!product) return;
		isDeleting = true;
		error = null;
		try {
			await onconfirm(product.id);
			open = false;
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Gagal menghapus produk.';
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
				<div class="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive shrink-0">
					<HugeiconsIcon icon={Alert02Icon} class="size-5" />
				</div>
				<div>
					<AlertDialog.Title class="text-base font-bold text-foreground">
						Hapus Candidate Product?
					</AlertDialog.Title>
					<AlertDialog.Description class="text-xs text-muted-foreground mt-0.5">
						Tindakan ini tidak dapat dibatalkan.
					</AlertDialog.Description>
				</div>
			</div>
		</AlertDialog.Header>

		<div class="space-y-3 py-2 text-xs text-muted-foreground">
			<p>
				Apakah Anda yakin ingin menghapus produk kandidat
				<span class="font-semibold text-foreground">"{product?.name}"</span>?
			</p>
			<div class="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-[11px] text-destructive">
				Seluruh kata kunci ({product?.keywords?.length || 0} Product Keywords) dan riwayat deteksi Comment Match yang terkait dengan produk ini akan dihapus dari project.
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
				class="gap-1.5 text-xs"
			>
				{#if isDeleting}
					<HugeiconsIcon icon={Loading03Icon} class="size-3.5 animate-spin" />
					<span>Menghapus...</span>
				{:else}
					<span>Hapus Produk</span>
				{/if}
			</Button>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
