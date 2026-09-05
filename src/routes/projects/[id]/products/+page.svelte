<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/api';
	import type { CandidateProduct, CreateProductDto, RequestKeyword } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Layers01Icon,
		Add01Icon,
		Loading03Icon
	} from '@hugeicons/core-free-icons';
	import {
		ProductCard,
		ProductDialog,
		DeleteProductDialog,
		RequestKeywordsManager
	} from '$lib/components/products';

	let { data } = $props();

	let products = $state<CandidateProduct[]>([]);
	let requestKeywords = $state<RequestKeyword[]>([]);
	let isLoading = $state(true);
	let isReqKeywordsLoading = $state(true);

	// Dialog states
	let isProductDialogOpen = $state(false);
	let productDialogMode = $state<'create' | 'edit'>('create');
	let selectedProduct = $state<CandidateProduct | null>(null);

	let isDeleteDialogOpen = $state(false);
	let productToDelete = $state<CandidateProduct | null>(null);

	// Derived metrics
	let totalProducts = $derived(products.length);
	let totalKeywords = $derived(
		products.reduce((acc, p) => acc + (p.keywords?.length || 0), 0)
	);

	async function loadProducts() {
		try {
			products = await apiClient.getProducts(data.project.id);
		} catch (err: unknown) {
			console.error('Failed to load products:', err);
		}
	}

	async function loadRequestKeywords() {
		try {
			requestKeywords = await apiClient.getRequestKeywords();
		} catch (err: unknown) {
			console.error('Failed to load request keywords:', err);
		} finally {
			isReqKeywordsLoading = false;
		}
	}

	onMount(async () => {
		try {
			await Promise.all([loadProducts(), loadRequestKeywords()]);
		} finally {
			isLoading = false;
		}
	});

	function openCreateDialog() {
		productDialogMode = 'create';
		selectedProduct = null;
		isProductDialogOpen = true;
	}

	function openEditDialog(product: CandidateProduct) {
		productDialogMode = 'edit';
		selectedProduct = product;
		isProductDialogOpen = true;
	}

	function openDeleteDialog(product: CandidateProduct) {
		productToDelete = product;
		isDeleteDialogOpen = true;
	}

	async function handleProductSubmit(formData: CreateProductDto) {
		if (productDialogMode === 'create') {
			await apiClient.createProduct(data.project.id, {
				name: formData.name,
				description: formData.description,
				keywords: formData.keywords
			});
		} else if (selectedProduct) {
			await apiClient.updateProduct(selectedProduct.id, {
				name: formData.name,
				description: formData.description
			});

			if (formData.keywords) {
				const existingKws = selectedProduct.keywords || [];
				const existingStrings = new Set(existingKws.map((k) => k.keyword.toLowerCase()));
				const newStrings = new Set(formData.keywords.map((k) => k.toLowerCase()));

				for (const kw of formData.keywords) {
					if (!existingStrings.has(kw.toLowerCase())) {
						await apiClient.addProductKeyword(selectedProduct.id, kw);
					}
				}

				for (const kwObj of existingKws) {
					if (!newStrings.has(kwObj.keyword.toLowerCase())) {
						await apiClient.deleteProductKeyword(kwObj.id);
					}
				}
			}
		}
		await loadProducts();
	}

	async function handleDeleteConfirm(productId: string) {
		await apiClient.deleteProduct(productId);
		await loadProducts();
	}

	async function handleAddProductKeyword(productId: string, keyword: string) {
		await apiClient.addProductKeyword(productId, keyword);
		await loadProducts();
	}

	async function handleDeleteProductKeyword(keywordId: string) {
		await apiClient.deleteProductKeyword(keywordId);
		await loadProducts();
	}

	async function handleAddRequestKeyword(keyword: string) {
		await apiClient.createRequestKeyword(keyword);
		await loadRequestKeywords();
	}

	async function handleDeleteRequestKeyword(id: string) {
		await apiClient.deleteRequestKeyword(id);
		await loadRequestKeywords();
	}
</script>

<div class="space-y-6">
	<!-- Tab Header & Quick Metrics -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
				<span>Candidate Products</span>
				<Badge variant="outline" class="text-xs font-mono">
					{totalProducts} Produk
				</Badge>
				<Badge variant="secondary" class="text-xs font-mono">
					{totalKeywords} Kata Kunci
				</Badge>
			</h2>
			<p class="text-xs text-muted-foreground mt-0.5">
				Alternatif produk yang dievaluasi untuk ditentukan peringkat prioritas ulasannya berdasarkan deteksi kata kunci pada komentar audiens (ADR-0004).
			</p>
		</div>

		<Button
			class="gap-1.5 self-start sm:self-auto bg-primary text-primary-foreground hover:bg-primary/90 text-xs shadow-xs"
			onclick={openCreateDialog}
		>
			<HugeiconsIcon icon={Add01Icon} class="size-3.5" />
			<span>Tambah Candidate Product</span>
		</Button>
	</div>

	<!-- Candidate Products Grid / State -->
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
				Tambahkan alternatif produk beserta variasi kata kunci pencariannya untuk mendeteksi sebutan dan permintaan ulasan dari audiens.
			</p>
			<Button
				variant="outline"
				size="sm"
				class="mt-4 gap-1.5 text-xs"
				onclick={openCreateDialog}
			>
				<HugeiconsIcon icon={Add01Icon} class="size-3.5" />
				<span>Tambah Produk Sekarang</span>
			</Button>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each products as product (product.id)}
				<ProductCard
					{product}
					onedit={openEditDialog}
					ondelete={openDeleteDialog}
					onaddkeyword={handleAddProductKeyword}
					ondeletekeyword={handleDeleteProductKeyword}
				/>
			{/each}
		</div>
	{/if}

	<!-- Global Request Keywords Dictionary Manager Section -->
	<div class="pt-4">
		<RequestKeywordsManager
			{requestKeywords}
			isLoading={isReqKeywordsLoading}
			onadd={handleAddRequestKeyword}
			ondelete={handleDeleteRequestKeyword}
		/>
	</div>
</div>

<!-- Product Create / Edit Modal -->
<ProductDialog
	bind:open={isProductDialogOpen}
	mode={productDialogMode}
	product={selectedProduct}
	existingProducts={products}
	onsubmit={handleProductSubmit}
/>

<!-- Product Delete Confirmation Modal -->
<DeleteProductDialog
	bind:open={isDeleteDialogOpen}
	product={productToDelete}
	onconfirm={handleDeleteConfirm}
/>
