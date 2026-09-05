<script lang="ts">
	import type { YouTubeVideo, VideoFetchStatus } from '$lib/types';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Progress } from '$lib/components/ui/progress';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Calendar01Icon,
		Comment01Icon,
		Delete02Icon,
		ExternalLinkIcon,
		Loading03Icon,
		RefreshIcon,
		Alert02Icon,
		CheckmarkCircle02Icon,
		PlayIcon,
		Clock01Icon
	} from '@hugeicons/core-free-icons';
	import { formatDate } from '$lib/components/projects/utils';

	interface Props {
		video: YouTubeVideo;
		isPolling?: boolean;
		onfetch: (video: YouTubeVideo) => void;
		ondelete: (video: YouTubeVideo) => void;
	}

	let {
		video,
		isPolling = false,
		onfetch,
		ondelete
	}: Props = $props();

	let fetchStatus = $derived<VideoFetchStatus>(video.fetchStatus || 'PENDING');
	let isFetching = $derived(fetchStatus === 'FETCHING' || isPolling);

	const statusConfigs: Record<
		VideoFetchStatus,
		{
			badgeClass: string;
			badgeIcon: typeof Clock01Icon;
			badgeSpin: boolean;
			badgeText: string;
			actionText: string;
			actionIcon: typeof Comment01Icon;
			actionVariant: 'default' | 'outline';
			actionClass: string;
		}
	> = {
		FETCHING: {
			badgeClass: 'bg-sky-500 text-white shadow-sm text-[10px] font-medium border-0 animate-pulse',
			badgeIcon: Loading03Icon,
			badgeSpin: true,
			badgeText: 'Mengambil Komentar...',
			actionText: 'Memproses...',
			actionIcon: Loading03Icon,
			actionVariant: 'default',
			actionClass: 'bg-primary text-primary-foreground'
		},
		COMPLETED: {
			badgeClass: 'bg-emerald-600 text-white shadow-sm text-[10px] font-medium border-0',
			badgeIcon: CheckmarkCircle02Icon,
			badgeSpin: false,
			badgeText: 'Selesai',
			actionText: 'Ambil Ulang',
			actionIcon: RefreshIcon,
			actionVariant: 'outline',
			actionClass: 'hover:bg-muted'
		},
		FAILED: {
			badgeClass: 'bg-rose-600 text-white shadow-sm text-[10px] font-medium border-0',
			badgeIcon: Alert02Icon,
			badgeSpin: false,
			badgeText: 'Gagal',
			actionText: 'Coba Lagi',
			actionIcon: RefreshIcon,
			actionVariant: 'outline',
			actionClass: 'text-rose-600 border-rose-500/30 hover:bg-rose-500/10'
		},
		PENDING: {
			badgeClass: 'bg-amber-500 text-white shadow-sm text-[10px] font-medium border-0',
			badgeIcon: Clock01Icon,
			badgeSpin: false,
			badgeText: 'Belum Diambil',
			actionText: 'Ambil Komentar',
			actionIcon: Comment01Icon,
			actionVariant: 'default',
			actionClass: 'bg-primary text-primary-foreground'
		}
	};

	let currentConfig = $derived(statusConfigs[fetchStatus] ?? statusConfigs.PENDING);
</script>

<Card class="overflow-hidden border-border/70 hover:border-border transition-all flex flex-col justify-between group bg-card">
	<div>
		<!-- Video Header / Thumbnail Section -->
		<div class="relative aspect-video w-full bg-muted/60 overflow-hidden border-b border-border/40">
			{#if video.thumbnailUrl}
				<img
					src={video.thumbnailUrl}
					alt={video.title}
					class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
					loading="lazy"
				/>
			{:else}
				<div class="flex h-full w-full items-center justify-center text-muted-foreground">
					<HugeiconsIcon icon={PlayIcon} class="size-10 text-muted-foreground/40" />
				</div>
			{/if}

			<!-- Gradient Overlay -->
			<div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none"></div>

			<!-- Status Badge Floating Overlay -->
			<div class="absolute top-2.5 right-2.5 z-10">
				<Badge class="gap-1 {currentConfig.badgeClass}">
					<HugeiconsIcon icon={currentConfig.badgeIcon} class="size-3 {currentConfig.badgeSpin ? 'animate-spin' : ''}" />
					<span>{currentConfig.badgeText}</span>
				</Badge>
			</div>

			<!-- Quick Link to YouTube -->
			<a
				href={video.url}
				target="_blank"
				rel="noreferrer"
				title="Tonton di YouTube"
				class="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1 text-[11px] font-medium text-white/90 hover:text-white bg-black/50 hover:bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded transition-colors"
			>
				<span>YouTube</span>
				<HugeiconsIcon icon={ExternalLinkIcon} class="size-3" />
			</a>
		</div>

		<!-- Video Details -->
		<div class="p-4 space-y-2.5">
			<div class="flex items-center gap-2 text-[11px] text-muted-foreground">
				<span class="font-medium text-foreground truncate max-w-[160px]">
					{video.channelTitle || 'YouTube Creator'}
				</span>
				<span>•</span>
				<span class="flex items-center gap-1 shrink-0">
					<HugeiconsIcon icon={Calendar01Icon} class="size-3 text-muted-foreground" />
					{formatDate(video.publishedAt)}
				</span>
			</div>

			<h3 class="text-xs font-bold text-foreground line-clamp-2 leading-snug">
				<a
					href={video.url}
					target="_blank"
					rel="noreferrer"
					class="hover:text-primary transition-colors"
				>
					{video.title}
				</a>
			</h3>

			<!-- Fetching Progress Indicator -->
			{#if isFetching}
				<div class="space-y-1.5 py-1">
					<div class="flex items-center justify-between text-[10px] text-muted-foreground">
						<span class="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium">
							<HugeiconsIcon icon={Loading03Icon} class="size-3 animate-spin" />
							Mengunduh komentar dari YouTube API...
						</span>
						<span class="text-[10px] font-mono">Sinkronisasi</span>
					</div>
					<Progress class="h-1.5 w-full bg-sky-100 dark:bg-sky-950 [&>div]:bg-sky-500 animate-pulse" />
				</div>
			{/if}
		</div>
	</div>

	<!-- Footer Info & Actions -->
	<div class="px-4 pb-4 pt-2 border-t border-border/40 flex items-center justify-between gap-2 text-xs">
		<div class="flex items-center gap-1.5 text-muted-foreground">
			<HugeiconsIcon icon={Comment01Icon} class="size-3.5 text-primary shrink-0" />
			{#if fetchStatus === 'COMPLETED'}
				<span class="text-xs font-medium text-foreground">
					<strong class="font-bold">{video.commentCount || 0}</strong> komentar
				</span>
			{:else if isFetching}
				<span class="text-[11px] text-sky-600 dark:text-sky-400 font-medium">
					Sedang mengambil...
				</span>
			{:else}
				<span class="text-[11px] text-muted-foreground">
					0 komentar tersimpan
				</span>
			{/if}
		</div>

		<div class="flex items-center gap-1.5">
			<!-- Fetch Action Button -->
			<Button
				variant={currentConfig.actionVariant}
				size="sm"
				class="h-7 px-2.5 text-[11px] gap-1 {currentConfig.actionClass}"
				disabled={isFetching}
				onclick={() => onfetch(video)}
			>
				<HugeiconsIcon icon={currentConfig.actionIcon} class="size-3 {isFetching ? 'animate-spin' : ''}" />
				<span>{currentConfig.actionText}</span>
			</Button>

			<!-- Delete Button -->
			<Button
				variant="ghost"
				size="sm"
				class="size-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
				disabled={isFetching}
				onclick={() => ondelete(video)}
				title="Hapus video dari project"
			>
				<HugeiconsIcon icon={Delete02Icon} class="size-3.5" />
			</Button>
		</div>
	</div>
</Card>
