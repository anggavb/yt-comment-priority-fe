<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/api';
	import type { YouTubeVideo } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Card } from '$lib/components/ui/card';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Video01Icon,
		Add01Icon,
		Loading03Icon,
		Comment01Icon,
		CheckmarkCircle02Icon,
		Clock01Icon,
		RefreshIcon
	} from '@hugeicons/core-free-icons';

	import {
		VideoCard,
		AddVideoDialog,
		DeleteVideoDialog,
		FetchCommentsDialog
	} from '$lib/components/videos';

	let { data } = $props();

	let videos = $state<YouTubeVideo[]>([]);
	let isLoading = $state(true);

	// Dialog states
	let isAddDialogOpen = $state(false);
	let isDeleteDialogOpen = $state(false);
	let videoToDelete = $state<YouTubeVideo | null>(null);

	let isFetchDialogOpen = $state(false);
	let videoToFetch = $state<YouTubeVideo | null>(null);

	let isPolling = $state(false);

	// Derived metrics
	let totalVideos = $derived(videos.length);
	let totalComments = $derived(videos.reduce((sum, v) => sum + (v.commentCount || 0), 0));
	let completedVideos = $derived(videos.filter((v) => v.fetchStatus === 'COMPLETED').length);
	let fetchingVideos = $derived(videos.filter((v) => v.fetchStatus === 'FETCHING').length);
	let pendingVideos = $derived(videos.filter((v) => !v.fetchStatus || v.fetchStatus === 'PENDING').length);

	async function loadVideos() {
		try {
			videos = await apiClient.getVideos(data.project.id);
		} catch (err: unknown) {
			console.error('Failed to load videos:', err);
		} finally {
			isLoading = false;
		}
	}

	// Svelte 5 reactive polling loop: actively polls while any video is FETCHING
	$effect(() => {
		const anyFetching = videos.some((v) => v.fetchStatus === 'FETCHING');
		if (anyFetching) {
			isPolling = true;
			const interval = setInterval(async () => {
				try {
					const updatedList = await apiClient.getVideos(data.project.id);
					videos = updatedList;
				} catch (err: unknown) {
					console.error('Polling error:', err);
				}
			}, 1000);

			return () => {
				clearInterval(interval);
				isPolling = false;
			};
		} else {
			isPolling = false;
		}
	});

	onMount(async () => {
		await loadVideos();
	});

	async function handleAddVideoSubmit(payload: {
		url: string;
		maxComments: number;
		title?: string;
		thumbnailUrl?: string;
		channelTitle?: string;
		autoFetch?: boolean;
	}) {
		const newVideo = await apiClient.addVideo(data.project.id, {
			url: payload.url,
			maxComments: payload.maxComments,
			title: payload.title,
			thumbnailUrl: payload.thumbnailUrl,
			channelTitle: payload.channelTitle
		});

		// Insert or update list
		videos = [newVideo, ...videos.filter((v) => v.id !== newVideo.id)];

		if (payload.autoFetch) {
			await executeFetchComments(newVideo.id, payload.maxComments);
		}
	}

	function handleOpenFetchDialog(video: YouTubeVideo) {
		videoToFetch = video;
		isFetchDialogOpen = true;
	}

	function handleOpenDeleteDialog(video: YouTubeVideo) {
		videoToDelete = video;
		isDeleteDialogOpen = true;
	}

	async function executeFetchComments(videoId: string, maxComments: number) {
		// Set local status to FETCHING immediately (starts reactive $effect polling)
		videos = videos.map((v) =>
			v.id === videoId ? { ...v, fetchStatus: 'FETCHING', maxComments } : v
		);

		try {
			const updated = await apiClient.fetchComments(videoId, { maxComments });
			if (updated) {
				videos = videos.map((v) => (v.id === videoId ? updated : v));
			}
		} catch (err: unknown) {
			console.error('Fetch comments failed:', err);
			videos = videos.map((v) =>
				v.id === videoId ? { ...v, fetchStatus: 'FAILED' } : v
			);
		}
	}

	async function handleDeleteConfirm(videoId: string) {
		await apiClient.deleteVideo(videoId);
		videos = videos.filter((v) => v.id !== videoId);
	}
</script>

<div class="space-y-6">
	<!-- Tab Header -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
				<span>Video YouTube Terhubung</span>
				<Badge variant="outline" class="text-xs">
					{totalVideos} Video
				</Badge>
				{#if isPolling}
					<Badge variant="secondary" class="gap-1 text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20">
						<HugeiconsIcon icon={Loading03Icon} class="size-2.5 animate-spin" />
						<span>Sinkronisasi...</span>
					</Badge>
				{/if}
			</h2>
			<p class="text-xs text-muted-foreground mt-0.5">
				Video YouTube yang dijadikan sumber interaksi komentar audiens untuk Analysis Project ini.
			</p>
		</div>

		<div class="flex items-center gap-2 self-start sm:self-auto">
			<Button
				variant="outline"
				size="sm"
				class="h-8 text-xs gap-1.5"
				onclick={loadVideos}
				disabled={isLoading || isPolling}
				title="Muat ulang data video"
			>
				<HugeiconsIcon icon={RefreshIcon} class="size-3.5 {isLoading ? 'animate-spin' : ''}" />
				<span>Refresh</span>
			</Button>

			<Button
				class="h-8 gap-1.5 bg-[#FF0000] hover:bg-[#FF0000]/90 text-white text-xs shadow-sm"
				onclick={() => (isAddDialogOpen = true)}
			>
				<HugeiconsIcon icon={Add01Icon} class="size-3.5" />
				<span>Tambah Video</span>
			</Button>
		</div>
	</div>

	<!-- Summary Stats Bar -->
	{#if videos.length > 0}
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
			<Card class="p-3 border-border/70 bg-card/60">
				<div class="flex items-center gap-2 text-muted-foreground text-[11px]">
					<HugeiconsIcon icon={Video01Icon} class="size-3.5 text-primary" />
					<span>Total Video</span>
				</div>
				<p class="mt-1 text-lg font-bold text-foreground">{totalVideos}</p>
			</Card>

			<Card class="p-3 border-border/70 bg-card/60">
				<div class="flex items-center gap-2 text-muted-foreground text-[11px]">
					<HugeiconsIcon icon={Comment01Icon} class="size-3.5 text-indigo-500" />
					<span>Total Komentar</span>
				</div>
				<p class="mt-1 text-lg font-bold text-foreground">
					{totalComments.toLocaleString('id-ID')}
				</p>
			</Card>

			<Card class="p-3 border-border/70 bg-card/60">
				<div class="flex items-center gap-2 text-muted-foreground text-[11px]">
					<HugeiconsIcon icon={CheckmarkCircle02Icon} class="size-3.5 text-emerald-500" />
					<span>Komentar Siap</span>
				</div>
				<p class="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
					{completedVideos} <span class="text-xs font-normal text-muted-foreground">video</span>
				</p>
			</Card>

			<Card class="p-3 border-border/70 bg-card/60">
				<div class="flex items-center gap-2 text-muted-foreground text-[11px]">
					<HugeiconsIcon icon={Clock01Icon} class="size-3.5 text-amber-500" />
					<span>Perlu Diambil</span>
				</div>
				<p class="mt-1 text-lg font-bold text-amber-600 dark:text-amber-400">
					{pendingVideos + fetchingVideos} <span class="text-xs font-normal text-muted-foreground">video</span>
				</p>
			</Card>
		</div>
	{/if}

	<!-- Content Area -->
	{#if isLoading}
		<div class="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-2">
			<HugeiconsIcon icon={Loading03Icon} class="size-7 animate-spin text-primary" />
			<span class="text-xs">Memuat daftar video YouTube...</span>
		</div>
	{:else if videos.length === 0}
		<!-- Empty State -->
		<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/10 py-16 px-4 text-center">
			<div class="flex size-14 items-center justify-center rounded-2xl bg-[#FF0000]/10 text-[#FF0000]">
				<HugeiconsIcon icon={Video01Icon} class="size-7" />
			</div>
			<h3 class="mt-4 text-sm font-semibold text-foreground">Belum Ada Video Terhubung</h3>
			<p class="mt-1.5 text-xs text-muted-foreground max-w-md leading-relaxed">
				Tambahkan URL video YouTube (format <code class="font-mono text-foreground bg-muted px-1 py-0.5 rounded">watch?v=</code>, <code class="font-mono text-foreground bg-muted px-1 py-0.5 rounded">youtu.be/</code>, Shorts, atau 11-karakter ID) untuk mengambil data komentar audiens.
			</p>
			<Button
				class="mt-5 gap-1.5 bg-[#FF0000] hover:bg-[#FF0000]/90 text-white text-xs shadow-sm"
				onclick={() => (isAddDialogOpen = true)}
			>
				<HugeiconsIcon icon={Add01Icon} class="size-3.5" />
				<span>Tambah Video Pertama</span>
			</Button>
		</div>
	{:else}
		<!-- Video Cards Grid -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#each videos as video (video.id)}
				<VideoCard
					{video}
					isPolling={isPolling && video.fetchStatus === 'FETCHING'}
					onfetch={handleOpenFetchDialog}
					ondelete={handleOpenDeleteDialog}
				/>
			{/each}
		</div>
	{/if}
</div>

<!-- Add Video Dialog -->
<AddVideoDialog
	bind:open={isAddDialogOpen}
	onsubmit={handleAddVideoSubmit}
/>

<!-- Delete Video Dialog -->
<DeleteVideoDialog
	bind:open={isDeleteDialogOpen}
	video={videoToDelete}
	onconfirm={handleDeleteConfirm}
/>

<!-- Fetch Comments Dialog -->
<FetchCommentsDialog
	bind:open={isFetchDialogOpen}
	video={videoToFetch}
	onconfirm={executeFetchComments}
/>
