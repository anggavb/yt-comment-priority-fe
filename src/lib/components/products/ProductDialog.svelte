<script lang="ts">
	import type { CandidateProduct, CreateProductDto } from '$lib/types';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { validateProductForm, type ProductFormErrors } from './validation';
	import KeywordBadgeInput from './KeywordBadgeInput.svelte';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Loading03Icon, Tag01Icon } from '@hugeicons/core-free-icons';

	interface Props {
		open: boolean;
		mode?: 'create' | 'edit';
		product?: CandidateProduct | null;
		existingProducts?: CandidateProduct[];
		onsubmit: (data: CreateProductDto) => Promise<void> | void;
		oncancel?: () => void;
	}

	let {
		open = $bindable(false),
		mode = 'create',
		product = null,
		existingProducts = [],
		onsubmit,
		oncancel
	}: Props = $props();

	let name = $state('');
	let description = $state('');
	let keywords = $state<string[]>([]);
	let errors = $state<ProductFormErrors>({});
	let isSubmitting = $state(false);

	$effect(() => {
		if (open) {
			if (mode === 'edit' && product) {
				name = product.name;
				description = product.description || '';
				keywords = (product.keywords || []).map((k) => k.keyword);
			} else {
				name = '';
				description = '';
				keywords = [];
			}
			errors = {};
			isSubmitting = false;
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const validation = validateProductForm(
			name,
			description,
			existingProducts,
			mode === 'edit' && product ? product.id : undefined
		);

		if (!validation.isValid) {
			errors = validation.errors;
			return;
		}

		errors = {};
		isSubmitting = true;
		try {
			const finalKeywords = keywords.length > 0 ? keywords : [name.trim().toLowerCase()];
			await onsubmit({
				name: name.trim(),
				description: description.trim(),
				keywords: finalKeywords
			});
			open = false;
		} catch (err: unknown) {
			errors = {
				name: err instanceof Error ? err.message : 'Gagal menyimpan produk.'
			};
		} finally {
			isSubmitting = false;
		}
	}

	function handleClose(isOpen: boolean) {
		open = isOpen;
		if (!isOpen && oncancel) {
			oncancel();
		}
	}
</script>

<Dialog.Root bind:open={open} onOpenChange={handleClose}>
	<Dialog.Content class="sm:max-w-[500px]">
		<form onsubmit={handleSubmit} class="space-y-4">
			<Dialog.Header>
				<Dialog.Title class="text-base font-bold text-foreground">
					{mode === 'create' ? 'Tambah Candidate Product Baru' : 'Edit Candidate Product'}
				</Dialog.Title>
				<Dialog.Description class="text-xs text-muted-foreground">
					{mode === 'create'
						? 'Daftarkan alternatif produk yang akan dievaluasi dan tentukan variasi kata kuncinya untuk mencocokkan komentar audiens.'
						: 'Perbarui nama, deskripsi, dan variasi Product Keywords dari Candidate Product ini.'}
				</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-3.5 py-1">
				<!-- Product Name -->
				<div class="space-y-1.5">
					<Label for="product-name" class="text-xs font-semibold">
						Nama Produk <span class="text-destructive">*</span>
					</Label>
					<Input
						id="product-name"
						placeholder="contoh: Keychron V1"
						bind:value={name}
						disabled={isSubmitting}
						class="w-full text-xs"
						aria-invalid={!!errors.name}
					/>
					{#if errors.name}
						<p class="text-[11px] font-medium text-destructive">{errors.name}</p>
					{/if}
				</div>

				<!-- Product Description -->
				<div class="space-y-1.5">
					<div class="flex items-center justify-between">
						<Label for="product-description" class="text-xs font-semibold">
							Deskripsi Produk
						</Label>
						<span class="text-[10px] text-muted-foreground">Opsional</span>
					</div>
					<Textarea
						id="product-description"
						placeholder="Deskripsi spesifikasi singkat, target segmen, atau keunggulan produk..."
						bind:value={description}
						disabled={isSubmitting}
						class="min-h-[75px] text-xs resize-none"
						aria-invalid={!!errors.description}
					/>
					{#if errors.description}
						<p class="text-[11px] font-medium text-destructive">{errors.description}</p>
					{/if}
				</div>

				<!-- Keywords (Available in both Create and Edit mode) -->
				<div class="space-y-1.5">
					<div class="flex items-center justify-between">
						<Label class="text-xs font-semibold flex items-center gap-1.5">
							<HugeiconsIcon icon={Tag01Icon} class="size-3.5 text-primary" />
							<span>Product Keywords (Variasi Pencarian)</span>
						</Label>
						<span class="text-[10px] text-muted-foreground">Tekan Enter atau koma</span>
					</div>
					<p class="text-[11px] text-muted-foreground">
						Variasi nama produk yang umum ditulis penonton (contoh: "v1 max", "keychron v1").
					</p>
					<KeywordBadgeInput
						bind:keywords
						placeholder="Ketik variasi kata kunci lalu tekan Enter..."
						disabled={isSubmitting}
					/>
				</div>
			</div>

			<Dialog.Footer class="gap-2 sm:gap-0 pt-2">
				<Button
					type="button"
					variant="outline"
					disabled={isSubmitting}
					onclick={() => handleClose(false)}
					class="text-xs"
				>
					Batal
				</Button>
				<Button
					type="submit"
					disabled={isSubmitting}
					class="gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
				>
					{#if isSubmitting}
						<HugeiconsIcon icon={Loading03Icon} class="size-3.5 animate-spin" />
						<span>Menyimpan...</span>
					{:else}
						<span>{mode === 'create' ? 'Tambah Produk' : 'Simpan Perubahan'}</span>
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
