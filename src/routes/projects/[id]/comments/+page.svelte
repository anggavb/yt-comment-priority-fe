<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/api';
	import type { Comment, CommentMatch, PaginatedResponse } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Comment01Icon,
		PlayIcon,
		Loading03Icon,
		CheckmarkCircle01Icon
	} from '@hugeicons/core-free-icons';

	let { data } = $props();
	let commentsData = $state<PaginatedResponse<Comment & { matches?: CommentMatch[] }> | null>(null);
	let matches = $state<CommentMatch[]>([]);
	let isLoading = $state(true);

	onMount(async () => {
		try {
			const [commentsRes, matchesRes] = await Promise.all([
				apiClient.getComments(data.project.id, { limit: 10 }),
				apiClient.getCommentMatches(data.project.id)
			]);
			commentsData = commentsRes;
			matches = matchesRes;
		} finally {
			isLoading = false;
		}
	});

	const mentionCount = $derived(matches.filter((m) => m.isMention).length);
	const requestCount = $derived(matches.filter((m) => m.isRequest).length);
</script>

<div class="space-y-6">
	<!-- Tab Header -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
				<span>Komentar & Ekstraksi Permintaan</span>
				<Badge variant="outline" class="text-xs">
					{commentsData?.total ?? (data.project.commentCount || 0)} Komentar
				</Badge>
			</h2>
			<p class="text-xs text-muted-foreground mt-0.5">
				Proses pencocokan kata kunci produk (Mention) dan kata kunci permintaan ulasan (Request) menggunakan word-boundary matching.
			</p>
		</div>

		<Button
			class="gap-1.5 self-start sm:self-auto bg-[#FF0000] hover:bg-[#FF0000]/90 text-white text-xs"
			disabled
			title="Fitur proses komentar & tabel audit akan diaktifkan pada Issue #5"
		>
			<HugeiconsIcon icon={PlayIcon} class="size-3.5" />
			<span>Jalankan Ekstraksi Komentar</span>
			<Badge variant="secondary" class="ml-1 text-[9px] bg-white/20 text-white">
				Issue #5
			</Badge>
		</Button>
	</div>

	<!-- Extraction Metrics Grid -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div class="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
			<span class="text-xs text-muted-foreground">Total Komentar</span>
			<div class="mt-1 text-2xl font-bold text-foreground">
				{isLoading ? '...' : (commentsData?.total ?? 0)}
			</div>
			<p class="text-[11px] text-muted-foreground mt-0.5">Dari video terhubung</p>
		</div>

		<div class="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
			<span class="text-xs text-muted-foreground">Mention Terdeteksi</span>
			<div class="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
				{isLoading ? '...' : mentionCount}
			</div>
			<p class="text-[11px] text-muted-foreground mt-0.5">Memuat kata kunci produk</p>
		</div>

		<div class="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
			<span class="text-xs text-muted-foreground">Request Terdeteksi</span>
			<div class="mt-1 text-2xl font-bold text-[#FF0000]">
				{isLoading ? '...' : requestCount}
			</div>
			<p class="text-[11px] text-muted-foreground mt-0.5">Permintaan ulasan eksplisit</p>
		</div>

		<div class="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
			<span class="text-xs text-muted-foreground">Status Audit</span>
			<div class="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
				<HugeiconsIcon icon={CheckmarkCircle01Icon} class="size-4" />
				<span>ADR-0004 Ready</span>
			</div>
			<p class="text-[11px] text-muted-foreground mt-0.5">Word-boundary regex valid</p>
		</div>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center py-16 text-muted-foreground">
			<HugeiconsIcon icon={Loading03Icon} class="size-6 animate-spin text-primary" />
			<span class="ml-2 text-xs">Memuat data komentar & audit...</span>
		</div>
	{:else if !commentsData || commentsData.total === 0}
		<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 py-12 px-4 text-center">
			<div class="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
				<HugeiconsIcon icon={Comment01Icon} class="size-6" />
			</div>
			<h3 class="mt-3 text-sm font-semibold text-foreground">Belum Ada Komentar</h3>
			<p class="mt-1 text-xs text-muted-foreground max-w-sm">
				Hubungkan video YouTube terlebih dahulu pada tab Videos agar data komentar dapat diambil dan diproses.
			</p>
		</div>
	{:else}
		<div class="rounded-xl border border-border/70 bg-card p-5">
			<div class="flex items-center justify-between pb-3 border-b border-border/60">
				<div>
					<h3 class="text-xs font-bold uppercase tracking-wider text-foreground">
						Preview Komentar Terakhir
					</h3>
					<p class="text-[11px] text-muted-foreground">Menampilkan 10 komentar teratas dari project ini.</p>
				</div>
				<Badge variant="outline" class="text-[10px] text-muted-foreground">
					Tabel Audit Lengkap pada Issue #5
				</Badge>
			</div>

			<div class="divide-y divide-border/40 mt-2">
				{#each commentsData.data as comment (comment.id)}
					<div class="py-3 text-xs space-y-1">
						<div class="flex items-center justify-between">
							<span class="font-semibold text-foreground">{comment.authorName}</span>
							<span class="text-[10px] text-muted-foreground">{comment.likeCount} likes</span>
						</div>
						<p class="text-muted-foreground leading-relaxed">"{comment.text}"</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
