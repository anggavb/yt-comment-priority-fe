<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/api';
	import type {
		CandidateProduct,
		CommentAuditStatus,
		CommentAuditSummary,
		CommentMatch,
		CommentWithMatches,
		PaginatedResponse
	} from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		PlayIcon,
		RefreshIcon,
		CheckmarkCircle01Icon,
		Download04Icon,
		Loading03Icon,
		PrinterIcon,
		AlertCircleIcon
	} from '@hugeicons/core-free-icons';
	import { downloadCsv, generateCommentAuditCsv } from '$lib/utils/csv';
	import {
		CommentAuditMetrics,
		CommentAuditFilter,
		CommentAuditTable,
		CommentAuditDetailDialog,
		ProcessCommentsDialog
	} from '$lib/components/comments';

	let { data } = $props();

	// Core data states
	let commentsData = $state<PaginatedResponse<CommentWithMatches> | null>(null);
	let products = $state<CandidateProduct[]>([]);
	let allMatches = $state<CommentMatch[]>([]);

	// Filter & pagination states
	let searchQuery = $state('');
	let selectedProductId = $state('');
	let selectedStatus = $state<CommentAuditStatus>('all');
	let currentPage = $state(1);
	let itemsPerPage = $state(10);

	// UI loading, export, and dialog states
	let isLoading = $state(true);
	let isTableLoading = $state(false);
	let isExportingCsv = $state(false);
	let exportErrorMessage = $state<string | null>(null);
	let isProcessDialogOpen = $state(false);
	let isDetailDialogOpen = $state(false);
	let selectedComment = $state<CommentWithMatches | null>(null);

	// Derived Summary Metrics from actual project matches and comments
	let summary = $derived.by<CommentAuditSummary>(() => {
		const total = data.project.commentCount || commentsData?.total || 0;
		const matchedIds = new Set(allMatches.map((m) => m.commentId));
		const requestIds = new Set(allMatches.filter((m) => m.isRequest).map((m) => m.commentId));

		return {
			totalComments: total,
			matchedComments: matchedIds.size,
			requestComments: requestIds.size,
			unmatchedComments: Math.max(0, total - matchedIds.size)
		};
	});

	let hasActiveFilters = $derived(
		selectedProductId !== '' || selectedStatus !== 'all' || searchQuery.trim() !== ''
	);

	async function loadComments() {
		isTableLoading = true;
		try {
			const res = await apiClient.getComments(data.project.id, {
				productId: selectedProductId || undefined,
				status: selectedStatus,
				search: searchQuery.trim() || undefined,
				page: currentPage,
				limit: itemsPerPage
			});
			commentsData = res;
		} catch (err: unknown) {
			console.error('Failed to load comments:', err);
		} finally {
			isTableLoading = false;
		}
	}

	async function loadMatches() {
		try {
			allMatches = await apiClient.getCommentMatches(data.project.id);
		} catch (err: unknown) {
			console.error('Failed to load matches:', err);
		}
	}

	async function loadInitialData() {
		try {
			const [prodsRes, matchesRes] = await Promise.all([
				apiClient.getProducts(data.project.id),
				apiClient.getCommentMatches(data.project.id)
			]);
			products = prodsRes;
			allMatches = matchesRes;

			await loadComments();
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadInitialData();
	});

	// Handle filter changes
	function handleProductChange(productId: string) {
		selectedProductId = productId;
		currentPage = 1;
		loadComments();
	}

	function handleStatusChange(status: CommentAuditStatus) {
		selectedStatus = status;
		currentPage = 1;
		loadComments();
	}

	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	function handleSearchChange(query: string) {
		searchQuery = query;
		currentPage = 1;
		if (searchTimeout) clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			loadComments();
		}, 250);
	}

	function handleResetFilters() {
		selectedProductId = '';
		selectedStatus = 'all';
		searchQuery = '';
		currentPage = 1;
		loadComments();
	}

	function handlePageChange(newPage: number) {
		currentPage = newPage;
		loadComments();
	}

	function handleLimitChange(newLimit: number) {
		itemsPerPage = newLimit;
		currentPage = 1;
		loadComments();
	}

	function handleViewDetail(comment: CommentWithMatches) {
		selectedComment = comment;
		isDetailDialogOpen = true;
	}

	async function handleProcessingCompleted() {
		await Promise.all([loadMatches(), loadComments()]);
	}

	async function handleExportCsv() {
		isExportingCsv = true;
		exportErrorMessage = null;
		try {
			// Fetch all project comments for complete academic audit
			const res = await apiClient.getComments(data.project.id, {
				limit: 10000
			});
			const csv = generateCommentAuditCsv(res.data, products);
			const dateStr = new Date().toISOString().slice(0, 10);
			downloadCsv(`comment-audit-${data.project.id}-${dateStr}.csv`, csv);
		} catch (err: unknown) {
			console.error('Failed to export comment audit CSV:', err);
			exportErrorMessage = err instanceof Error ? err.message : 'Gagal mengekspor data audit komentar.';
		} finally {
			isExportingCsv = false;
		}
	}

	function handlePrint() {
		if (typeof window !== 'undefined') {
			window.print();
		}
	}
</script>

<div class="space-y-6">
	<!-- Tab Header & Extraction Action Trigger -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
		<div>
			<h2 class="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
				<span>Komentar & Ekstraksi Permintaan</span>
				<Badge variant="outline" class="text-xs font-mono">
					{commentsData?.total ?? (data.project.commentCount || 0)} Komentar
				</Badge>
				{#if allMatches.length > 0}
					<Badge class="text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1">
						<HugeiconsIcon icon={CheckmarkCircle01Icon} class="size-3" />
						<span>Telah Diproses</span>
					</Badge>
				{:else}
					<Badge variant="secondary" class="text-xs text-muted-foreground">
						Belum Diproses
					</Badge>
				{/if}
			</h2>
			<p class="text-xs text-muted-foreground mt-0.5">
				Proses pencocokan kata kunci produk (Mention) dan kata kunci permintaan ulasan (Request) menggunakan word-boundary matching (ADR-0004).
			</p>
		</div>

		<div class="flex items-center gap-2 self-start sm:self-auto flex-wrap print:hidden">
			<Button
				variant="outline"
				size="sm"
				class="gap-1.5 text-xs"
				onclick={handlePrint}
				disabled={(commentsData?.total ?? 0) === 0}
				title="Cetak tabel audit komentar ke format PDF / printer untuk lampiran skripsi"
			>
				<HugeiconsIcon icon={PrinterIcon} class="size-3.5" />
				<span>Cetak / PDF</span>
			</Button>

			<Button
				variant="outline"
				size="sm"
				class="gap-1.5 text-xs"
				onclick={handleExportCsv}
				disabled={isExportingCsv || (commentsData?.total ?? 0) === 0}
				title="Ekspor seluruh data audit komentar ke format CSV untuk analisis tesis"
			>
				{#if isExportingCsv}
					<HugeiconsIcon icon={Loading03Icon} class="size-3.5 animate-spin" />
					<span>Mengekspor...</span>
				{:else}
					<HugeiconsIcon icon={Download04Icon} class="size-3.5" />
					<span>Ekspor CSV</span>
				{/if}
			</Button>

			<Button
				variant="outline"
				size="sm"
				class="gap-1.5 text-xs"
				onclick={() => {
					loadMatches();
					loadComments();
				}}
				title="Segarkan data tabel komentar"
			>
				<HugeiconsIcon icon={RefreshIcon} class="size-3.5 {isTableLoading ? 'animate-spin' : ''}" />
				<span>Refresh</span>
			</Button>

			<Button
				class="gap-1.5 bg-[#FF0000] hover:bg-[#FF0000]/90 text-white text-xs shadow-xs"
				onclick={() => (isProcessDialogOpen = true)}
			>
				<HugeiconsIcon icon={PlayIcon} class="size-3.5" />
				<span>{allMatches.length > 0 ? 'Proses Ulang Komentar' : 'Jalankan Ekstraksi Komentar'}</span>
			</Button>
		</div>
	</div>

	<!-- Error Alert Notification -->
	{#if exportErrorMessage}
		<div class="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-600 text-xs flex items-center justify-between print:hidden">
			<div class="flex items-center gap-2">
				<HugeiconsIcon icon={AlertCircleIcon} class="size-4 shrink-0" />
				<span>{exportErrorMessage}</span>
			</div>
			<Button variant="ghost" size="xs" onclick={() => (exportErrorMessage = null)}>Tutup</Button>
		</div>
	{/if}

	<!-- Print-Only Academic Document Header for Comment Audit -->
	<div class="hidden print:block mb-6 pb-4 border-b-2 border-neutral-800 text-black">
		<div class="flex items-start justify-between gap-4">
			<div>
				<h1 class="text-xl font-bold uppercase tracking-tight text-black">
					Lampiran: Tabel Audit Komentar & Deteksi Kata Kunci
				</h1>
				<p class="text-sm font-semibold mt-1 text-neutral-800">
					Analysis Project: {data.project.name}
				</p>
				{#if data.project.description}
					<p class="text-xs text-neutral-600 mt-0.5 max-w-2xl">{data.project.description}</p>
				{/if}
			</div>
			<div class="text-right text-xs text-neutral-600 font-mono shrink-0">
				<p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
				<p>Total Komentar: {commentsData?.total ?? 0}</p>
			</div>
		</div>
	</div>

	<!-- Summary Metrics Cards -->
	<div class="print:hidden">
		<CommentAuditMetrics
			{summary}
			activeStatus={selectedStatus}
			isLoading={isLoading}
			onselectstatus={handleStatusChange}
		/>
	</div>

	<!-- Filter & Search Controls -->
	<div class="print:hidden">
		<CommentAuditFilter
			{products}
			{selectedProductId}
			{selectedStatus}
			{searchQuery}
			totalResults={commentsData?.total}
			onproductchange={handleProductChange}
			onstatuschange={handleStatusChange}
			onsearchchange={handleSearchChange}
			onreset={handleResetFilters}
		/>
	</div>

	<!-- Interactive Comment Audit Table -->
	<CommentAuditTable
		{commentsData}
		{products}
		isLoading={isTableLoading && isLoading}
		{currentPage}
		{itemsPerPage}
		{hasActiveFilters}
		onpagechange={handlePageChange}
		onlimitchange={handleLimitChange}
		onviewdetail={handleViewDetail}
		onresetfilters={handleResetFilters}
	/>
</div>

<!-- Process Comments Modal Trigger with Progress Feedback -->
<ProcessCommentsDialog
	bind:open={isProcessDialogOpen}
	projectId={data.project.id}
	commentCount={data.project.commentCount || commentsData?.total || 0}
	oncompleted={handleProcessingCompleted}
/>

<!-- Comment Detail & Regex Audit Inspection Modal -->
<CommentAuditDetailDialog
	bind:open={isDetailDialogOpen}
	comment={selectedComment}
/>
