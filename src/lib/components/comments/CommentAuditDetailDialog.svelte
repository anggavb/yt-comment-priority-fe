<script lang="ts">
	import type { CommentWithMatches } from '$lib/types';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogFooter
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		CheckmarkCircle01Icon,
		HelpCircleIcon,
		ThumbsUpIcon,
		Tag01Icon,
		FireIcon
	} from '@hugeicons/core-free-icons';
	import { preprocessText } from '$lib/engine/commentProcessor';
	import CommentHighlightText from './CommentHighlightText.svelte';
	import { formatDate } from '$lib/components/projects/utils';

	interface Props {
		open: boolean;
		comment: CommentWithMatches | null;
	}

	let {
		open = $bindable(false),
		comment
	}: Props = $props();

	let productKeywords = $derived(
		comment?.matches?.map((m) => m.matchedProductKeyword).filter(Boolean) || []
	);

	let requestKeywords = $derived(
		comment?.matches
			?.map((m) => m.matchedRequestKeyword)
			.filter((k): k is string => Boolean(k)) || []
	);

	let cleanText = $derived(
		comment ? preprocessText(comment.text) : ''
	);

	function close() {
		open = false;
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2 text-base font-bold">
				<span>Detail Audit & Ekstraksi Komentar</span>
				{#if comment?.matches && comment.matches.length > 0}
					<Badge variant="outline" class="text-xs text-blue-600 dark:text-blue-400">
						{comment.matches.length} Match Relasi
					</Badge>
				{:else}
					<Badge variant="secondary" class="text-xs text-muted-foreground">
						Unmatched
					</Badge>
				{/if}
			</DialogTitle>
			<DialogDescription class="text-xs text-muted-foreground">
				Verifikasi kecocokan kata kunci dan validasi batas kata (ADR-0004) untuk mendeteksi sebutan dan permintaan ulasan.
			</DialogDescription>
		</DialogHeader>

		{#if comment}
			<div class="space-y-4 py-2 text-xs">
				<!-- Author & Comment Meta -->
				<div class="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3">
					<div class="flex items-center gap-2.5">
						<div class="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs uppercase">
							{comment.authorName.slice(0, 2)}
						</div>
						<div>
							<div class="font-semibold text-foreground">{comment.authorName}</div>
							<div class="text-[10px] text-muted-foreground font-mono">
								ID: {comment.youtubeCommentId}
							</div>
						</div>
					</div>
					<div class="flex items-center gap-3 text-right">
						<div class="flex items-center gap-1 text-muted-foreground">
							<HugeiconsIcon icon={ThumbsUpIcon} class="size-3.5" />
							<span class="font-semibold">{comment.likeCount}</span>
						</div>
						<div class="text-[11px] text-muted-foreground">
							{formatDate(comment.publishedAt)}
						</div>
					</div>
				</div>

				<!-- Original Comment Text with Visual Highlighting -->
				<div class="space-y-1.5">
					<span class="font-semibold text-foreground uppercase tracking-wider text-[10px]">
						Teks Komentar Asli (Visual Highlighting)
					</span>
					<div class="rounded-lg border border-border/70 bg-card p-3.5 text-xs leading-relaxed text-foreground">
						<CommentHighlightText
							text={comment.text}
							{productKeywords}
							{requestKeywords}
						/>
					</div>
				</div>

				<!-- Preprocessed Text (ADR-0004) -->
				<div class="space-y-1.5">
					<div class="flex items-center justify-between">
						<span class="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
							Teks Hasil Pra-pemrosesan (ADR-0004 / FR-07)
						</span>
						<Badge variant="outline" class="text-[10px] font-mono">
							lowercase + whitespace + no-punct
						</Badge>
					</div>
					<div class="rounded-lg border border-border/60 bg-muted/30 p-3 font-mono text-[11px] text-muted-foreground break-all">
						"{cleanText}"
					</div>
				</div>

				<!-- Detected Matches (1:N Relations) -->
				<div class="space-y-2">
					<span class="font-semibold text-foreground uppercase tracking-wider text-[10px]">
						Hasil Relasi Comment Match ({comment.matches?.length || 0} Terdeteksi)
					</span>

					{#if !comment.matches || comment.matches.length === 0}
						<div class="rounded-lg border border-dashed border-border/70 p-4 text-center text-muted-foreground">
							<HugeiconsIcon icon={HelpCircleIcon} class="mx-auto size-5 text-muted-foreground/60 mb-1" />
							<p class="font-medium text-foreground text-xs">Tidak Ada Produk Kandidat Terdeteksi</p>
							<p class="text-[11px] text-muted-foreground mt-0.5">
								Komentar ini tidak memuat kata kunci produk kandidat yang terdaftar dalam proyek.
							</p>
						</div>
					{:else}
						<div class="space-y-2">
							{#each comment.matches as match (match.id)}
								<div class="rounded-lg border border-border/70 bg-card p-3 space-y-2">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-1.5 font-semibold text-foreground">
											<HugeiconsIcon icon={Tag01Icon} class="size-3.5 text-blue-600" />
											<span>{match.product?.name || match.productId}</span>
										</div>
										<div class="flex items-center gap-1.5">
											{#if match.isMention}
												<Badge variant="secondary" class="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
													Mention
												</Badge>
											{/if}
											{#if match.isRequest}
												<Badge class="text-[10px] bg-rose-500 hover:bg-rose-600 text-white gap-1">
													<HugeiconsIcon icon={FireIcon} class="size-2.5" />
													<span>Request</span>
												</Badge>
											{/if}
										</div>
									</div>

									<div class="grid grid-cols-2 gap-2 pt-1 border-t border-border/50 text-[11px]">
										<div>
											<span class="text-muted-foreground">Kata Kunci Produk:</span>
											<span class="ml-1 font-mono font-semibold text-foreground">
												"{match.matchedProductKeyword}"
											</span>
										</div>
										<div>
											<span class="text-muted-foreground">Kata Kunci Permintaan:</span>
											{#if match.matchedRequestKeyword}
												<span class="ml-1 font-mono font-semibold text-rose-600 dark:text-rose-400">
													"{match.matchedRequestKeyword}"
												</span>
											{:else}
												<span class="ml-1 text-muted-foreground italic">-</span>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- ADR-0004 Verification Badge -->
				<div class="rounded-lg border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
					<HugeiconsIcon icon={CheckmarkCircle01Icon} class="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
					<div class="text-[11px] leading-relaxed">
						<strong>Verifikasi ADR-0004 (Word Boundary Regex):</strong> Deteksi kata kunci menggunakan batas kata utuh (<code class="bg-emerald-100 dark:bg-emerald-900/60 px-1 py-0.5 rounded font-mono text-[10px]">\b&lt;kw&gt;\b</code>). Keputusan ini melindungi dari <em>false positive</em> pada kata kunci pendek (misal: "rk" di dalam "pekerjaan" atau "tes" di dalam "tesis").
					</div>
				</div>
			</div>
		{/if}

		<DialogFooter>
			<Button variant="outline" size="sm" onclick={close} class="text-xs">
				Tutup
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
