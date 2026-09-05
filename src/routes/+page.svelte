<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient, connectionStore } from '$lib/api';
	import type { AnalysisProject, ApiConnectionState } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Folder01Icon,
		Video01Icon,
		Comment01Icon,
		Layers01Icon,
		ArrowRight01Icon,
		Database01Icon,
		ServerIcon,
		CalculatorIcon,
		Clock01Icon,
		Search01Icon
	} from '@hugeicons/core-free-icons';

	let projects = $state<AnalysisProject[]>([]);
	let isLoading = $state(true);
	let connState = $state<ApiConnectionState>(connectionStore.state);

	onMount(() => {
		const unsub = connectionStore.subscribe((s) => {
			connState = s;
		});

		loadData();

		return () => {
			unsub();
		};
	});

	async function loadData() {
		isLoading = true;
		try {
			projects = await apiClient.getProjects();
		} finally {
			isLoading = false;
		}
	}

	const totalVideos = $derived(projects.reduce((acc, p) => acc + (p.videoCount || 0), 0));
	const totalProducts = $derived(projects.reduce((acc, p) => acc + (p.productCount || 0), 0));
	const totalComments = $derived(projects.reduce((acc, p) => acc + (p.commentCount || 0), 0));
</script>

<div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
	<!-- Hero Section -->
	<div class="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-card to-background p-6 sm:p-10 shadow-sm">
		<!-- Subtle crimson decorative glow -->
		<div
			class="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-[#FF0000]/5 blur-3xl"
			aria-hidden="true"
		></div>

		<div class="relative z-10 max-w-3xl">
			<div class="flex flex-wrap items-center gap-2">
				<Badge variant="outline" class="border-[#FF0000]/30 bg-[#FF0000]/10 px-2.5 py-0.5 text-xs font-semibold text-[#FF0000]">
					Penelitian Skripsi Informatika
				</Badge>
				<Badge variant="secondary" class="text-xs font-medium">
					Metode Simple Additive Weighting (SAW)
				</Badge>
			</div>

			<h1 class="mt-4 text-2xl font-extrabold tracking-tight sm:text-4xl text-foreground">
				YouTube Review <span class="text-[#FF0000]">Priority System</span>
			</h1>

			<p class="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
				Sistem pendukung keputusan untuk menentukan prioritas produk yang sebaiknya diulas oleh kreator konten YouTube
				berdasarkan analisis interaksi komentar audiens menggunakan metode <strong>Simple Additive Weighting (SAW)</strong>
				dengan transparansi perhitungan akademik penuh.
			</p>

			<div class="mt-6 flex flex-wrap items-center gap-3">
				<Button href="/projects" class="gap-2 bg-[#FF0000] hover:bg-[#FF0000]/90 text-white shadow-sm">
					<span>Buka Analysis Projects</span>
					<HugeiconsIcon icon={ArrowRight01Icon} class="size-4" />
				</Button>
				<Button
					variant="outline"
					onclick={() => apiClient.setMode(connState.mode === 'mock' ? 'live' : 'mock')}
					class="gap-1.5"
				>
					{#if connState.mode === 'mock'}
						<HugeiconsIcon icon={ServerIcon} class="size-3.5 text-emerald-500" />
						<span>Beralih ke Live API</span>
					{:else}
						<HugeiconsIcon icon={Database01Icon} class="size-3.5 text-blue-500" />
						<span>Beralih ke Mock Mode</span>
					{/if}
				</Button>
			</div>
		</div>
	</div>

	<!-- Stats Overview Grid -->
	<div class="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
		<Card class="border-border/60">
			<CardHeader class="flex flex-row items-center justify-between pb-2">
				<CardTitle class="text-xs font-medium text-muted-foreground">Analysis Projects</CardTitle>
				<HugeiconsIcon icon={Folder01Icon} class="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold text-foreground">
					{isLoading ? '...' : projects.length}
				</div>
				<p class="text-[11px] text-muted-foreground mt-1">Sesi analisis terisolasi</p>
			</CardContent>
		</Card>

		<Card class="border-border/60">
			<CardHeader class="flex flex-row items-center justify-between pb-2">
				<CardTitle class="text-xs font-medium text-muted-foreground">Video Terhubung</CardTitle>
				<HugeiconsIcon icon={Video01Icon} class="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold text-foreground">
					{isLoading ? '...' : totalVideos}
				</div>
				<p class="text-[11px] text-muted-foreground mt-1">Video YouTube reviewer</p>
			</CardContent>
		</Card>

		<Card class="border-border/60">
			<CardHeader class="flex flex-row items-center justify-between pb-2">
				<CardTitle class="text-xs font-medium text-muted-foreground">Komentar Audiens</CardTitle>
				<HugeiconsIcon icon={Comment01Icon} class="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold text-foreground">
					{isLoading ? '...' : totalComments}
				</div>
				<p class="text-[11px] text-muted-foreground mt-1">Dianalisis & diproses</p>
			</CardContent>
		</Card>

		<Card class="border-border/60">
			<CardHeader class="flex flex-row items-center justify-between pb-2">
				<CardTitle class="text-xs font-medium text-muted-foreground">Candidate Products</CardTitle>
				<HugeiconsIcon icon={Layers01Icon} class="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold text-foreground">
					{isLoading ? '...' : totalProducts}
				</div>
				<p class="text-[11px] text-muted-foreground mt-1">Alternatif prioritas ulasan</p>
			</CardContent>
		</Card>
	</div>

	<!-- Architectural Decisions & Methodology Pillars -->
	<div class="mt-12">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-lg font-bold tracking-tight text-foreground">
					Fondasi Arsitektur & Prinsip Metodologi
				</h2>
				<p class="text-xs text-muted-foreground mt-0.5">
					Standar implementasi yang diterapkan berdasarkan Architectural Decision Records (ADR).
				</p>
			</div>
		</div>

		<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<!-- ADR-0002 -->
			<div class="rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-border hover:shadow-xs">
				<div class="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
					<HugeiconsIcon icon={Database01Icon} class="size-4" />
				</div>
				<h3 class="mt-3 text-xs font-semibold text-foreground">Dual-Mode API Adapter</h3>
				<Badge variant="outline" class="mt-1 font-mono text-[10px] text-blue-500 border-blue-500/30">ADR-0002</Badge>
				<p class="mt-2 text-[11px] text-muted-foreground leading-normal">
					Mendukung in-memory mock dataset realistis Indonesia dan REST API nyata (http://localhost:3000) dengan automatic fallback saat backend offline.
				</p>
			</div>

			<!-- ADR-0004 -->
			<div class="rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-border hover:shadow-xs">
				<div class="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
					<HugeiconsIcon icon={Search01Icon} class="size-4" />
				</div>
				<h3 class="mt-3 text-xs font-semibold text-foreground">Word Boundary Matching</h3>
				<Badge variant="outline" class="mt-1 font-mono text-[10px] text-amber-500 border-amber-500/30">ADR-0004</Badge>
				<p class="mt-2 text-[11px] text-muted-foreground leading-normal">
					Mendeteksi kemunculan kata kunci dengan regex word boundary (<code class="font-mono text-[10px]">\b&lt;kw&gt;\b</code>) untuk mencegah false positive kata kunci pendek.
				</p>
			</div>

			<!-- ADR-0001 -->
			<div class="rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-border hover:shadow-xs">
				<div class="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
					<HugeiconsIcon icon={Clock01Icon} class="size-4" />
				</div>
				<h3 class="mt-3 text-xs font-semibold text-foreground">Time-Anchor C4 Ratio</h3>
				<Badge variant="outline" class="mt-1 font-mono text-[10px] text-emerald-500 border-emerald-500/30">ADR-0001</Badge>
				<p class="mt-2 text-[11px] text-muted-foreground leading-normal">
					Kriteria C4 dihitung relatif terhadap waktu komentar terbaru (<code class="font-mono text-[10px]">MAX(published_at)</code>) agar dataset historis penelitian tetap valid.
				</p>
			</div>

			<!-- ADR-0003 -->
			<div class="rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-border hover:shadow-xs">
				<div class="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
					<HugeiconsIcon icon={CalculatorIcon} class="size-4" />
				</div>
				<h3 class="mt-3 text-xs font-semibold text-foreground">Multi-Table Transparency</h3>
				<Badge variant="outline" class="mt-1 font-mono text-[10px] text-purple-500 border-purple-500/30">ADR-0003</Badge>
				<p class="mt-2 text-[11px] text-muted-foreground leading-normal">
					Menyajikan 4 tabel matematis terperinci: Matriks Keputusan ($X_&#123;ij&#125;$), Ternormalisasi ($R_&#123;ij&#125;$), Terbobot, dan Ranking Akhir ($V_i$).
				</p>
			</div>
		</div>
	</div>

	<!-- Sample Project Highlight -->
	{#if projects.length > 0}
		{@const sample = projects[0]}
		<div class="mt-10 rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex-1">
					<div class="flex items-center gap-2">
						<Badge variant="outline" class="text-[10px] capitalize text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
							{sample.status || 'Active'}
						</Badge>
						<span class="text-xs text-muted-foreground">Sample Analysis Project</span>
					</div>
					<h3 class="mt-1.5 text-base font-bold text-foreground">{sample.name}</h3>
					<p class="mt-1 text-xs text-muted-foreground max-w-2xl">{sample.description}</p>
					<div class="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
						<span class="flex items-center gap-1">
							<HugeiconsIcon icon={Video01Icon} class="size-3.5" />
							{sample.videoCount || 0} Video
						</span>
						<span>•</span>
						<span class="flex items-center gap-1">
							<HugeiconsIcon icon={Layers01Icon} class="size-3.5" />
							{sample.productCount || 0} Produk
						</span>
						<span>•</span>
						<span class="flex items-center gap-1">
							<HugeiconsIcon icon={Comment01Icon} class="size-3.5" />
							{sample.commentCount || 0} Komentar
						</span>
					</div>
				</div>
				<div class="shrink-0">
					<Button href="/projects/{sample.id}" variant="outline" class="gap-1.5">
						<span>Lihat Hasil & Detail</span>
						<HugeiconsIcon icon={ArrowRight01Icon} class="size-3.5" />
					</Button>
				</div>
			</div>
		</div>
	{/if}
</div>
