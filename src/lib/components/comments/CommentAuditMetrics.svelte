<script lang="ts">
	import type { CommentAuditStatus, CommentAuditSummary } from '$lib/types';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Comment01Icon,
		Tag01Icon,
		FireIcon,
		HelpCircleIcon
	} from '@hugeicons/core-free-icons';

	interface Props {
		summary: CommentAuditSummary | null;
		activeStatus: CommentAuditStatus;
		isLoading?: boolean;
		onselectstatus?: (status: CommentAuditStatus) => void;
	}

	let {
		summary,
		activeStatus,
		isLoading = false,
		onselectstatus
	}: Props = $props();

	function handleClick(status: CommentAuditStatus) {
		if (onselectstatus) {
			onselectstatus(status);
		}
	}
</script>

<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
	<!-- Total Comments -->
	<button
		type="button"
		onclick={() => handleClick('all')}
		class="text-left rounded-xl border p-4 shadow-2xs transition-all cursor-pointer hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 {activeStatus === 'all' ? 'border-primary/70 bg-primary/5 ring-1 ring-primary/30' : 'border-border/70 bg-card'}"
	>
		<div class="flex items-center justify-between">
			<span class="text-xs text-muted-foreground font-medium">Total Komentar</span>
			<div class="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
				<HugeiconsIcon icon={Comment01Icon} class="size-4" />
			</div>
		</div>
		<div class="mt-2 text-2xl font-bold text-foreground">
			{isLoading ? '...' : (summary?.totalComments ?? 0)}
		</div>
		<p class="text-[11px] text-muted-foreground mt-0.5">Dari video terhubung</p>
	</button>

	<!-- Mentions -->
	<button
		type="button"
		onclick={() => handleClick('mention')}
		class="text-left rounded-xl border p-4 shadow-2xs transition-all cursor-pointer hover:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 {activeStatus === 'mention' ? 'border-blue-500/70 bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-blue-500/30' : 'border-border/70 bg-card'}"
	>
		<div class="flex items-center justify-between">
			<span class="text-xs text-muted-foreground font-medium">Mentions Terdeteksi</span>
			<div class="flex size-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
				<HugeiconsIcon icon={Tag01Icon} class="size-4" />
			</div>
		</div>
		<div class="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
			{isLoading ? '...' : (summary?.matchedComments ?? 0)}
		</div>
		<p class="text-[11px] text-muted-foreground mt-0.5">Memuat kata kunci produk</p>
	</button>

	<!-- Requests -->
	<button
		type="button"
		onclick={() => handleClick('request')}
		class="text-left rounded-xl border p-4 shadow-2xs transition-all cursor-pointer hover:border-rose-500/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 {activeStatus === 'request' ? 'border-rose-500/70 bg-rose-50/50 dark:bg-rose-950/20 ring-1 ring-rose-500/30' : 'border-border/70 bg-card'}"
	>
		<div class="flex items-center justify-between">
			<span class="text-xs text-muted-foreground font-medium">Requests Terdeteksi</span>
			<div class="flex size-7 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/60 text-[#FF0000] dark:text-rose-400">
				<HugeiconsIcon icon={FireIcon} class="size-4" />
			</div>
		</div>
		<div class="mt-2 text-2xl font-bold text-[#FF0000] dark:text-rose-500">
			{isLoading ? '...' : (summary?.requestComments ?? 0)}
		</div>
		<p class="text-[11px] text-muted-foreground mt-0.5">Permintaan ulasan eksplisit</p>
	</button>

	<!-- Unmatched -->
	<button
		type="button"
		onclick={() => handleClick('unmatched')}
		class="text-left rounded-xl border p-4 shadow-2xs transition-all cursor-pointer hover:border-slate-500/50 focus:outline-none focus:ring-2 focus:ring-slate-500/20 {activeStatus === 'unmatched' ? 'border-slate-500/70 bg-slate-50/50 dark:bg-slate-900/30 ring-1 ring-slate-500/30' : 'border-border/70 bg-card'}"
	>
		<div class="flex items-center justify-between">
			<span class="text-xs text-muted-foreground font-medium">Unmatched (Umum)</span>
			<div class="flex size-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
				<HugeiconsIcon icon={HelpCircleIcon} class="size-4" />
			</div>
		</div>
		<div class="mt-2 text-2xl font-bold text-slate-600 dark:text-slate-300">
			{isLoading ? '...' : (summary?.unmatchedComments ?? 0)}
		</div>
		<p class="text-[11px] text-muted-foreground mt-0.5">Komentar non-produk</p>
	</button>
</div>
