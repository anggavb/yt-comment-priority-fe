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
		Calendar01Icon
	} from '@hugeicons/core-free-icons';

	import { formatDate } from '$lib/components/projects/utils';

	let { data } = $props();
	let videos = $state<YouTubeVideo[]>([]);
	let isLoading = $state(true);

	onMount(async () => {
		try {
			videos = await apiClient.getVideos(data.project.id);
		} finally {
			isLoading = false;
		}
	});
</script>

<div class="space-y-6">
	<!-- Tab Header -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
				<span>Video YouTube Terhubung</span>
				<Badge variant="outline" class="text-xs">
					{videos.length} Video
				</Badge>
			</h2>
			<p class="text-xs text-muted-foreground mt-0.5">
				Video YouTube yang dijadikan sumber interaksi komentar audiens untuk Analysis Project ini.
			</p>
		</div>

		<Button
			class="gap-1.5 self-start sm:self-auto bg-[#FF0000] hover:bg-[#FF0000]/90 text-white text-xs"
			disabled
			title="Fitur penambahan video akan diaktifkan pada Issue #3"
		>
			<HugeiconsIcon icon={Add01Icon} class="size-3.5" />
			<span>Tambah Video</span>
			<Badge variant="secondary" class="ml-1 text-[9px] bg-white/20 text-white">
				Issue #3
			</Badge>
		</Button>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center py-16 text-muted-foreground">
			<HugeiconsIcon icon={Loading03Icon} class="size-6 animate-spin text-primary" />
			<span class="ml-2 text-xs">Memuat video...</span>
		</div>
	{:else if videos.length === 0}
		<div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 py-12 px-4 text-center">
			<div class="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
				<HugeiconsIcon icon={Video01Icon} class="size-6" />
			</div>
			<h3 class="mt-3 text-sm font-semibold text-foreground">Belum Ada Video Terhubung</h3>
			<p class="mt-1 text-xs text-muted-foreground max-w-sm">
				Tambahkan URL video YouTube untuk mengambil data komentar dan menganalisis permintaan ulasan audiens.
			</p>
			<Badge variant="outline" class="mt-4 text-[10px] text-muted-foreground">
				Fitur Input Video & Fetching Komentar disiapkan pada Issue #3
			</Badge>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			{#each videos as video (video.id)}
				<Card class="overflow-hidden border-border/70 hover:border-border transition-all">
					<div class="flex flex-col sm:flex-row">
						{#if video.thumbnailUrl}
							<div class="relative sm:w-44 shrink-0 bg-muted aspect-video sm:aspect-auto">
								<img
									src={video.thumbnailUrl}
									alt={video.title}
									class="h-full w-full object-cover"
								/>
							</div>
						{/if}
						<div class="flex flex-1 flex-col justify-between p-4">
							<div>
								<div class="flex items-center gap-1.5 text-[11px] text-muted-foreground">
									<span>{video.channelTitle || 'YouTube Video'}</span>
									<span>•</span>
									<span class="flex items-center gap-1">
										<HugeiconsIcon icon={Calendar01Icon} class="size-3" />
										{formatDate(video.publishedAt)}
									</span>
								</div>
								<h3 class="mt-1.5 text-xs font-bold text-foreground line-clamp-2">
									<a
										href={video.url}
										target="_blank"
										rel="noreferrer"
										class="hover:text-primary transition-colors"
									>
										{video.title}
									</a>
								</h3>
							</div>

							<div class="mt-3 flex items-center justify-between pt-2 border-t border-border/40 text-xs">
								<span class="flex items-center gap-1 text-[11px] text-muted-foreground">
									<HugeiconsIcon icon={Comment01Icon} class="size-3 text-primary" />
									<strong>{video.commentCount || 0}</strong> komentar
								</span>
								<Badge variant="outline" class="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
									{video.fetchStatus || 'COMPLETED'}
								</Badge>
							</div>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>
