<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogFooter
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import { Badge } from '$lib/components/ui/badge';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		PlayIcon,
		Loading03Icon,
		CheckmarkCircle01Icon,
		AlertCircleIcon,
		Tag01Icon,
		FireIcon,
		Comment01Icon
	} from '@hugeicons/core-free-icons';
	import { apiClient } from '$lib/api';
	import type { ProcessCommentsResult } from '$lib/types';

	interface Props {
		open: boolean;
		projectId: string;
		commentCount?: number;
		oncompleted?: () => Promise<void> | void;
	}

	let {
		open = $bindable(false),
		projectId,
		commentCount = 0,
		oncompleted
	}: Props = $props();

	type Step =
		| 'idle'
		| 'cleaning'
		| 'matching_products'
		| 'matching_requests'
		| 'saving'
		| 'done'
		| 'error';

	let currentStep = $state<Step>('idle');
	let progressValue = $state(0);
	let result = $state<ProcessCommentsResult | null>(null);
	let errorMessage = $state<string | null>(null);
	let isProcessing = $derived(
		currentStep === 'cleaning' ||
		currentStep === 'matching_products' ||
		currentStep === 'matching_requests' ||
		currentStep === 'saving'
	);

	function resetState() {
		currentStep = 'idle';
		progressValue = 0;
		result = null;
		errorMessage = null;
	}

	async function startProcessing() {
		resetState();
		try {
			// Step 1: Preprocessing & Cleaning (ADR-0004)
			currentStep = 'cleaning';
			progressValue = 25;
			await new Promise((r) => setTimeout(r, 400));

			// Step 2: Matching candidate products
			currentStep = 'matching_products';
			progressValue = 55;
			await new Promise((r) => setTimeout(r, 450));

			// Step 3: Matching global request keywords
			currentStep = 'matching_requests';
			progressValue = 80;
			await new Promise((r) => setTimeout(r, 400));

			// Step 4: Saving relation data & compiling audit summary
			currentStep = 'saving';
			progressValue = 95;

			const res = await apiClient.processComments(projectId);
			result = res;
			progressValue = 100;
			currentStep = 'done';

			if (oncompleted) {
				await oncompleted();
			}
		} catch (err: unknown) {
			console.error('Failed to process comments:', err);
			currentStep = 'error';
			errorMessage = err instanceof Error ? err.message : 'Terjadi kegagalan saat mengekstraksi komentar.';
		}
	}

	function handleClose() {
		if (isProcessing) return;
		open = false;
		// Reset state when closing after done
		setTimeout(() => {
			if (!open) resetState();
		}, 300);
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-w-lg">
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2 text-base font-bold">
				<HugeiconsIcon icon={PlayIcon} class="size-4 text-[#FF0000]" />
				<span>Ekstraksi Komentar & Pencocokan Kata Kunci</span>
			</DialogTitle>
			<DialogDescription class="text-xs text-muted-foreground">
				Jalankan engine pemrosesan teks berbasis aturan dan pencocokan word boundary (ADR-0004) untuk mendeteksi Mention dan Request.
			</DialogDescription>
		</DialogHeader>

		<div class="py-3 space-y-4 text-xs">
			{#if currentStep === 'idle'}
				<!-- Idle / Confirmation State -->
				<div class="rounded-lg border border-border/70 bg-card p-4 space-y-3">
					<div class="flex items-center justify-between">
						<span class="font-medium text-foreground">Komentar Siap Diproses</span>
						<Badge variant="outline" class="font-mono text-xs">
							{commentCount} Komentar
						</Badge>
					</div>
					<p class="text-xs text-muted-foreground leading-relaxed">
						Sistem akan mengeksekusi pipeline pencocokan:
					</p>
					<ul class="space-y-1.5 text-[11px] text-muted-foreground list-disc pl-4">
						<li>Normalisasi teks (lowercase, trimming, pembersihan tanda baca).</li>
						<li>Pencocokan batas kata utuh (<code class="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">\b&lt;kw&gt;\b</code>) untuk mencegah <em>false positive</em>.</li>
						<li>Pembuatan catatan <strong>Comment Match</strong> untuk setiap produk yang terdeteksi (1:N).</li>
						<li>Pendeteksian kata kunci permintaan ulasan audiens.</li>
					</ul>
				</div>
			{:else if isProcessing}
				<!-- Running Progress State -->
				<div class="space-y-4 py-2">
					<div class="space-y-2">
						<div class="flex items-center justify-between text-xs font-semibold">
							<span class="flex items-center gap-2 text-foreground">
								<HugeiconsIcon icon={Loading03Icon} class="size-4 animate-spin text-primary" />
								{#if currentStep === 'cleaning'}
									<span>1/4 Membersihkan & menormalisasi teks (ADR-0004)...</span>
								{:else if currentStep === 'matching_products'}
									<span>2/4 Mencocokkan batas kata produk kandidat (\b&lt;kw&gt;\b)...</span>
								{:else if currentStep === 'matching_requests'}
									<span>3/4 Menganalisis kata kunci permintaan ulasan...</span>
								{:else if currentStep === 'saving'}
									<span>4/4 Menyimpan data Comment Match & audit...</span>
								{/if}
							</span>
							<span class="font-mono text-primary">{progressValue}%</span>
						</div>
						<Progress value={progressValue} class="h-2" />
					</div>

					<div class="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2 text-[11px]">
						<div class="flex items-center gap-2 {currentStep === 'cleaning' ? 'text-primary font-semibold' : 'text-muted-foreground'}">
							<div class="size-1.5 rounded-full {currentStep === 'cleaning' ? 'bg-primary animate-ping' : 'bg-muted-foreground/50'}"></div>
							<span>Prapemrosesan teks komentar</span>
						</div>
						<div class="flex items-center gap-2 {currentStep === 'matching_products' ? 'text-primary font-semibold' : 'text-muted-foreground'}">
							<div class="size-1.5 rounded-full {currentStep === 'matching_products' ? 'bg-primary animate-ping' : 'bg-muted-foreground/50'}"></div>
							<span>Pencocokan kandidat produk (1:N)</span>
						</div>
						<div class="flex items-center gap-2 {currentStep === 'matching_requests' ? 'text-primary font-semibold' : 'text-muted-foreground'}">
							<div class="size-1.5 rounded-full {currentStep === 'matching_requests' ? 'bg-primary animate-ping' : 'bg-muted-foreground/50'}"></div>
							<span>Klasifikasi Request eksplisit</span>
						</div>
						<div class="flex items-center gap-2 {currentStep === 'saving' ? 'text-primary font-semibold' : 'text-muted-foreground'}">
							<div class="size-1.5 rounded-full {currentStep === 'saving' ? 'bg-primary animate-ping' : 'bg-muted-foreground/50'}"></div>
							<span>Penyimpanan relasi match</span>
						</div>
					</div>
				</div>
			{:else if currentStep === 'done' && result}
				<!-- Completed Summary State -->
				<div class="space-y-3">
					<div class="rounded-lg border border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 text-center">
						<HugeiconsIcon icon={CheckmarkCircle01Icon} class="mx-auto size-8 text-emerald-600 dark:text-emerald-400 mb-2" />
						<h4 class="text-sm font-bold text-emerald-800 dark:text-emerald-300">
							Ekstraksi Komentar Berhasil Selesai!
						</h4>
						<p class="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
							Seluruh data relasi Comment Match telah diperbarui dan siap ditinjau pada tabel audit.
						</p>
					</div>

					<div class="grid grid-cols-2 gap-2.5">
						<div class="rounded-lg border border-border/70 bg-card p-3">
							<div class="flex items-center gap-1 text-muted-foreground text-[11px]">
								<HugeiconsIcon icon={Comment01Icon} class="size-3" />
								<span>Komentar Diproses</span>
							</div>
							<div class="mt-1 text-xl font-bold text-foreground">
								{result.processedCount}
							</div>
						</div>

						<div class="rounded-lg border border-border/70 bg-card p-3">
							<div class="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-[11px]">
								<HugeiconsIcon icon={Tag01Icon} class="size-3" />
								<span>Mentions Terdeteksi</span>
							</div>
							<div class="mt-1 text-xl font-bold text-blue-600 dark:text-blue-400">
								{result.summary.matchedComments}
							</div>
						</div>

						<div class="rounded-lg border border-border/70 bg-card p-3">
							<div class="flex items-center gap-1 text-[#FF0000] text-[11px]">
								<HugeiconsIcon icon={FireIcon} class="size-3" />
								<span>Requests Terdeteksi</span>
							</div>
							<div class="mt-1 text-xl font-bold text-[#FF0000]">
								{result.summary.requestComments}
							</div>
						</div>

						<div class="rounded-lg border border-border/70 bg-card p-3">
							<div class="flex items-center gap-1 text-muted-foreground text-[11px]">
								<span>Relasi Match Dibuat</span>
							</div>
							<div class="mt-1 text-xl font-bold text-foreground font-mono">
								{result.matchesFound}
							</div>
						</div>
					</div>
				</div>
			{:else if currentStep === 'error'}
				<!-- Error State -->
				<div class="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-center text-xs text-destructive">
					<HugeiconsIcon icon={AlertCircleIcon} class="mx-auto size-7 mb-2" />
					<h4 class="font-bold">Gagal Memproses Komentar</h4>
					<p class="mt-1 text-muted-foreground">{errorMessage}</p>
				</div>
			{/if}
		</div>

		<DialogFooter>
			{#if currentStep === 'idle'}
				<Button variant="outline" size="sm" onclick={handleClose} class="text-xs">
					Batal
				</Button>
				<Button
					size="sm"
					class="gap-1.5 bg-[#FF0000] hover:bg-[#FF0000]/90 text-white text-xs"
					onclick={startProcessing}
				>
					<HugeiconsIcon icon={PlayIcon} class="size-3.5" />
					<span>Mulai Proses Komentar</span>
				</Button>
			{:else if isProcessing}
				<Button size="sm" disabled class="text-xs gap-1.5">
					<HugeiconsIcon icon={Loading03Icon} class="size-3.5 animate-spin" />
					<span>Sedang Memproses...</span>
				</Button>
			{:else if currentStep === 'done'}
				<Button
					size="sm"
					class="bg-primary text-primary-foreground text-xs"
					onclick={handleClose}
				>
					Lihat Hasil Audit Tabel
				</Button>
			{:else if currentStep === 'error'}
				<Button variant="outline" size="sm" onclick={handleClose} class="text-xs">
					Tutup
				</Button>
				<Button
					size="sm"
					class="bg-primary text-primary-foreground text-xs"
					onclick={startProcessing}
				>
					Coba Lagi
				</Button>
			{/if}
		</DialogFooter>
	</DialogContent>
</Dialog>
