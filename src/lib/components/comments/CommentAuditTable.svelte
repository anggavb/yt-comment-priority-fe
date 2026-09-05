<script lang="ts">
	import type { CandidateProduct, CommentWithMatches, PaginatedResponse } from '$lib/types';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Comment01Icon,
		ThumbsUpIcon,
		FireIcon,
		Tag01Icon,
		ArrowLeft01Icon,
		ArrowRight01Icon,
		EyeIcon,
		Loading03Icon
	} from '@hugeicons/core-free-icons';
	import CommentHighlightText from './CommentHighlightText.svelte';
	import { formatDate } from '$lib/components/projects/utils';

	interface Props {
		commentsData: PaginatedResponse<CommentWithMatches> | null;
		products: CandidateProduct[];
		isLoading?: boolean;
		currentPage: number;
		itemsPerPage: number;
		hasActiveFilters?: boolean;
		onpagechange: (page: number) => void;
		onlimitchange: (limit: number) => void;
		onviewdetail: (comment: CommentWithMatches) => void;
		onresetfilters?: () => void;
	}

	let {
		commentsData,
		products,
		isLoading = false,
		currentPage,
		itemsPerPage,
		hasActiveFilters = false,
		onpagechange,
		onlimitchange,
		onviewdetail,
		onresetfilters
	}: Props = $props();

	let comments = $derived(commentsData?.data || []);
	let totalItems = $derived(commentsData?.total || 0);
	let totalPages = $derived(commentsData?.totalPages || 1);

	let startItem = $derived(
		totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
	);
	let endItem = $derived(
		Math.min(currentPage * itemsPerPage, totalItems)
	);

	function getProductKeywordsForComment(commentItem: CommentWithMatches): string[] {
		if (!commentItem.matches) return [];
		return commentItem.matches.map((m) => m.matchedProductKeyword).filter(Boolean);
	}

	function getRequestKeywordsForComment(commentItem: CommentWithMatches): string[] {
		if (!commentItem.matches) return [];
		return commentItem.matches
			.map((m) => m.matchedRequestKeyword)
			.filter((k): k is string => Boolean(k));
	}
</script>

<div class="rounded-xl border border-border/70 bg-card shadow-2xs overflow-hidden">
	{#if isLoading}
		<div class="flex flex-col items-center justify-center py-20 text-muted-foreground">
			<HugeiconsIcon icon={Loading03Icon} class="size-7 animate-spin text-primary" />
			<span class="mt-2 text-xs font-medium">Memuat data tabel audit komentar...</span>
		</div>
	{:else if comments.length === 0}
		<div class="flex flex-col items-center justify-center py-16 px-4 text-center">
			<div class="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
				<HugeiconsIcon icon={Comment01Icon} class="size-6" />
			</div>
			{#if hasActiveFilters}
				<h3 class="mt-3 text-sm font-semibold text-foreground">Tidak Ada Komentar yang Cocok</h3>
				<p class="mt-1 text-xs text-muted-foreground max-w-sm">
					Kombinasi pencarian atau filter yang Anda pilih tidak menemukan hasil komentar.
				</p>
				{#if onresetfilters}
					<Button
						variant="outline"
						size="sm"
						onclick={onresetfilters}
						class="mt-4 text-xs"
					>
						Reset Semua Filter
					</Button>
				{/if}
			{:else}
				<h3 class="mt-3 text-sm font-semibold text-foreground">Belum Ada Komentar Tersedia</h3>
				<p class="mt-1 text-xs text-muted-foreground max-w-sm">
					Komentar dari video YouTube yang terhubung belum diambil atau belum ada komentar.
				</p>
			{/if}
		</div>
	{:else}
		<div class="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow class="bg-muted/40 hover:bg-muted/40">
						<TableHead class="w-[180px] text-xs font-semibold">Penulis</TableHead>
						<TableHead class="min-w-[280px] text-xs font-semibold">Teks Komentar & Visual Match</TableHead>
						<TableHead class="w-[170px] text-xs font-semibold">Produk Terdeteksi</TableHead>
						<TableHead class="w-[110px] text-xs font-semibold text-center">Status</TableHead>
						<TableHead class="w-[90px] text-xs font-semibold text-center">Likes</TableHead>
						<TableHead class="w-[80px] text-xs font-semibold text-right">Audit</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each comments as comment (comment.id)}
						{@const productKeywords = getProductKeywordsForComment(comment)}
						{@const requestKeywords = getRequestKeywordsForComment(comment)}
						{@const hasMentions = (comment.matches?.length || 0) > 0}
						{@const hasRequests = comment.matches?.some((m) => m.isRequest) ?? false}

						<TableRow class="hover:bg-muted/30 transition-colors">
							<!-- Author -->
							<TableCell class="align-top py-3">
								<div class="space-y-1">
									<div class="flex items-center gap-2">
										<div class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] uppercase">
											{comment.authorName.slice(0, 2)}
										</div>
										<span class="font-semibold text-foreground text-xs line-clamp-1" title={comment.authorName}>
											{comment.authorName}
										</span>
									</div>
									<div class="text-[10px] text-muted-foreground pl-8">
										{formatDate(comment.publishedAt)}
									</div>
								</div>
							</TableCell>

							<!-- Comment Text with Highlights -->
							<TableCell class="align-top py-3">
								<div class="text-xs text-foreground leading-relaxed pr-2">
									<CommentHighlightText
										text={comment.text}
										{productKeywords}
										{requestKeywords}
									/>
								</div>
							</TableCell>

							<!-- Detected Products -->
							<TableCell class="align-top py-3">
								{#if !comment.matches || comment.matches.length === 0}
									<span class="text-xs text-muted-foreground italic">-</span>
								{:else}
									<div class="flex flex-col gap-1.5">
										{#each comment.matches as match (match.id)}
											{@const matchedProduct = products.find((p) => p.id === match.productId)}
											<div class="flex items-center gap-1.5 flex-wrap">
												<Badge variant="outline" class="text-[10px] font-medium border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 gap-1 bg-blue-50/50 dark:bg-blue-950/30">
													<HugeiconsIcon icon={Tag01Icon} class="size-2.5" />
													<span>{matchedProduct?.name || match.productId}</span>
												</Badge>
												<span class="text-[9px] font-mono text-muted-foreground">
													({match.matchedProductKeyword})
												</span>
											</div>
										{/each}
									</div>
								{/if}
							</TableCell>

							<!-- Status Badge -->
							<TableCell class="align-top py-3 text-center">
								{#if hasRequests}
									<Badge class="text-[10px] bg-rose-500 hover:bg-rose-600 text-white gap-1 whitespace-nowrap">
										<HugeiconsIcon icon={FireIcon} class="size-2.5" />
										<span>Request</span>
									</Badge>
								{:else if hasMentions}
									<Badge variant="secondary" class="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 whitespace-nowrap">
										Mention
									</Badge>
								{:else}
									<Badge variant="outline" class="text-[10px] text-muted-foreground whitespace-nowrap">
										Unmatched
									</Badge>
								{/if}
							</TableCell>

							<!-- Likes -->
							<TableCell class="align-top py-3 text-center">
								<div class="inline-flex items-center gap-1 text-xs text-muted-foreground">
									<HugeiconsIcon icon={ThumbsUpIcon} class="size-3" />
									<span class="font-mono">{comment.likeCount}</span>
								</div>
							</TableCell>

							<!-- Action Detail -->
							<TableCell class="align-top py-3 text-right">
								<Button
									variant="ghost"
									size="sm"
									class="size-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
									title="Lihat detail ekstraksi & audit"
									onclick={() => onviewdetail(comment)}
								>
									<HugeiconsIcon icon={EyeIcon} class="size-4" />
									<span class="sr-only">Detail</span>
								</Button>
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</div>

		<!-- Responsive Pagination Controls -->
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-border/60 bg-card text-xs">
			<div class="flex items-center gap-3 text-muted-foreground">
				<span>
					Menampilkan <strong class="text-foreground">{startItem}</strong> - <strong class="text-foreground">{endItem}</strong> dari <strong class="text-foreground">{totalItems}</strong> komentar
				</span>

				<div class="flex items-center gap-1.5 pl-3 border-l border-border/60">
					<span class="text-[11px]">Baris:</span>
					<select
						value={itemsPerPage}
						onchange={(e) => onlimitchange(Number((e.target as HTMLSelectElement).value))}
						class="rounded border border-input bg-background px-2 py-0.5 text-xs text-foreground"
					>
						<option value={10}>10</option>
						<option value={25}>25</option>
						<option value={50}>50</option>
					</select>
				</div>
			</div>

			<div class="flex items-center gap-1 self-end sm:self-auto">
				<Button
					variant="outline"
					size="sm"
					class="h-8 px-2.5 text-xs gap-1"
					disabled={currentPage <= 1}
					onclick={() => onpagechange(currentPage - 1)}
				>
					<HugeiconsIcon icon={ArrowLeft01Icon} class="size-3.5" />
					<span>Sebelumnya</span>
				</Button>

				<div class="px-2 font-mono text-xs text-muted-foreground">
					Hal <strong class="text-foreground">{currentPage}</strong> / {totalPages}
				</div>

				<Button
					variant="outline"
					size="sm"
					class="h-8 px-2.5 text-xs gap-1"
					disabled={currentPage >= totalPages}
					onclick={() => onpagechange(currentPage + 1)}
				>
					<span>Selanjutnya</span>
					<HugeiconsIcon icon={ArrowRight01Icon} class="size-3.5" />
				</Button>
			</div>
		</div>
	{/if}
</div>
