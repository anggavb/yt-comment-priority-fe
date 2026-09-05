<script lang="ts">
	import type { C4TimeAnchorConfig } from '$lib/types';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Clock01Icon,
		InformationCircleIcon,
		Calendar03Icon
	} from '@hugeicons/core-free-icons';

	interface Props {
		config: C4TimeAnchorConfig;
		latestCommentDate?: string | null;
		disabled?: boolean;
		onConfigChange?: (config: C4TimeAnchorConfig) => void;
	}

	let {
		config = $bindable(),
		latestCommentDate = null,
		disabled = false,
		onConfigChange
	}: Props = $props();

	const presetDays = [7, 14, 30, 60, 90, 180];

	function selectDayPreset(days: number) {
		if (disabled) return;
		config.daysWindow = days;
		onConfigChange?.(config);
	}

	function handleDaysInput(e: Event) {
		const target = e.target as HTMLInputElement;
		let val = parseInt(target.value, 10);
		if (isNaN(val) || val < 1) val = 1;
		if (val > 3650) val = 3650;
		config.daysWindow = val;
		onConfigChange?.(config);
	}

	function handleAnchorTypeChange(val: string) {
		if (disabled) return;
		const nextType = val as 'max_comment' | 'custom';
		config.anchorType = nextType;
		if (nextType === 'custom' && !config.customAnchorDate) {
			// default custom date to latest comment date or current date
			config.customAnchorDate = latestCommentDate
				? new Date(latestCommentDate).toISOString().slice(0, 10)
				: new Date().toISOString().slice(0, 10);
		}
		onConfigChange?.(config);
	}

	function handleCustomDateInput(e: Event) {
		const target = e.target as HTMLInputElement;
		config.customAnchorDate = target.value;
		onConfigChange?.(config);
	}

	function formatDisplayDate(dateStr: string | null | undefined): string {
		if (!dateStr) return 'Belum ada komentar dalam project';
		try {
			const d = new Date(dateStr);
			if (isNaN(d.getTime())) return dateStr;
			return new Intl.DateTimeFormat('id-ID', {
				dateStyle: 'medium',
				timeStyle: 'short'
			}).format(d);
		} catch {
			return dateStr;
		}
	}
</script>

<Card class="border-border/70 bg-card shadow-sm">
	<CardHeader class="pb-3">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-2.5">
				<div class="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-500/20">
					<HugeiconsIcon icon={Clock01Icon} class="size-5" />
				</div>
				<div>
					<CardTitle class="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
						<span>Pengaturan Time-Anchor Kriteria C4 (Recent Request Ratio)</span>
					</CardTitle>
					<p class="text-xs text-muted-foreground mt-0.5">
						Konfigurasi acuan waktu dan jendela hari untuk kriteria C4 per spesifikasi ADR-0001.
					</p>
				</div>
			</div>

			<Badge
				variant="outline"
				class="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono self-start sm:self-auto"
			>
				ADR-0001 Active
			</Badge>
		</div>
	</CardHeader>

	<CardContent class="space-y-6 pt-1">
		<!-- Explanatory Notice per ADR-0001 -->
		<div class="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5 flex items-start gap-3">
			<HugeiconsIcon icon={InformationCircleIcon} class="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
			<div class="space-y-1 text-xs text-muted-foreground leading-relaxed">
				<p>
					<strong class="text-foreground">Rasional Ilmiah Keputusan ADR-0001:</strong> Kriteria C4 dihitung relatif terhadap tanggal komentar terbaru (<code class="font-mono text-[11px] bg-background px-1 py-0.5 rounded border border-border">MAX(comment.published_at)</code>), bukan waktu nyata (<code class="font-mono text-[11px] bg-background px-1 py-0.5 rounded border border-border">NOW()</code>). Hal ini menjamin pengujian skripsi dengan dataset historis (video yang diunggah berbulan-bulan sebelumnya) tidak menghasilkan nilai 0.
				</p>
			</div>
		</div>

		<!-- Jendela Waktu (Days Window) Configuration -->
		<div class="space-y-3">
			<div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<Label class="text-xs font-bold text-foreground">
						Jendela Waktu Terkini (Days Window)
					</Label>
					<p class="text-xs text-muted-foreground">
						Batas rentang hari sebelum tanggal acuan yang dianggap sebagai permintaan terkini.
					</p>
				</div>

				<!-- Numeric Input with unit -->
				<div class="flex items-center gap-1.5 self-start sm:self-auto">
					<Input
						type="number"
						min="1"
						max="3650"
						step="1"
						value={config.daysWindow}
						oninput={handleDaysInput}
						{disabled}
						class="h-8 w-24 text-right font-mono text-sm font-bold"
					/>
					<span class="text-xs font-semibold text-muted-foreground">Hari</span>
				</div>
			</div>

			<!-- Preset Day Chips -->
			<div class="flex flex-wrap items-center gap-1.5 pt-1">
				<span class="text-[11px] font-medium text-muted-foreground mr-1">Preset Cepat:</span>
				{#each presetDays as days (days)}
					<Button
						variant={config.daysWindow === days ? 'default' : 'outline'}
						size="sm"
						class="h-6 px-2.5 text-xs font-mono {config.daysWindow === days ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}"
						onclick={() => selectDayPreset(days)}
						{disabled}
					>
						{days} Hari {#if days === 30}<span class="text-[10px] ml-0.5 opacity-80">(Default)</span>{/if}
					</Button>
				{/each}
			</div>
		</div>

		<div class="border-t border-border/40"></div>

		<!-- Time Anchor Reference Selection (Radio Group) -->
		<div class="space-y-3">
			<div>
				<Label class="text-xs font-bold text-foreground">
					Titik Acuan Waktu (Time Anchor Reference)
				</Label>
				<p class="text-xs text-muted-foreground">
					Pilih basis tanggal perhitungan untuk mengukur rentang {config.daysWindow} hari ke belakang.
				</p>
			</div>

			<RadioGroup
				value={config.anchorType}
				onValueChange={handleAnchorTypeChange}
				{disabled}
				class="grid grid-cols-1 md:grid-cols-2 gap-3"
			>
				<!-- Option 1: MAX(comment.published_at) -->
				<label
					for="anchor-max-comment"
					class="flex items-start gap-3 rounded-lg border p-3.5 cursor-pointer transition-all duration-150 {config.anchorType === 'max_comment'
						? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30'
						: 'border-border/70 hover:bg-muted/40'}"
				>
					<RadioGroupItem value="max_comment" id="anchor-max-comment" class="mt-0.5" />
					<div class="space-y-1.5 grow">
						<div class="flex items-center gap-2">
							<span class="text-xs font-bold text-foreground">
								Waktu Komentar Terbaru Analysis Project
							</span>
							<Badge variant="secondary" class="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
								Rekomendasi Skripsi
							</Badge>
						</div>
						<p class="text-xs text-muted-foreground leading-relaxed">
							Otomatis menggunakan stempel waktu komentar paling mutakhir yang terdaftar pada video Analysis Project ini.
						</p>

						<div class="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground bg-background/80 px-2 py-1 rounded border border-border/60 font-mono">
							<HugeiconsIcon icon={Calendar03Icon} class="size-3.5 text-primary shrink-0" />
							<span>Komentar Terbaru: <strong>{formatDisplayDate(latestCommentDate)}</strong></span>
						</div>
					</div>
				</label>

				<!-- Option 2: Custom Date -->
				<label
					for="anchor-custom"
					class="flex items-start gap-3 rounded-lg border p-3.5 cursor-pointer transition-all duration-150 {config.anchorType === 'custom'
						? 'border-primary bg-primary/5 ring-1 ring-primary/30'
						: 'border-border/70 hover:bg-muted/40'}"
				>
					<RadioGroupItem value="custom" id="anchor-custom" class="mt-0.5" />
					<div class="space-y-2 grow">
						<div class="flex items-center gap-2">
							<span class="text-xs font-bold text-foreground">
								Tanggal Acuan Kustom (Custom Timestamp)
							</span>
							<Badge variant="outline" class="text-[9px] font-medium">
								Eksperimental
							</Badge>
						</div>
						<p class="text-xs text-muted-foreground leading-relaxed">
							Tentukan stempel waktu spesifik secara manual untuk pengujian batas waktu atau simulasi periode analisis tertentu.
						</p>

						{#if config.anchorType === 'custom'}
							<div class="pt-1.5 space-y-1">
								<Input
									type="datetime-local"
									value={config.customAnchorDate ? new Date(config.customAnchorDate).toISOString().slice(0, 16) : ''}
									oninput={handleCustomDateInput}
									{disabled}
									class="h-8 text-xs font-mono bg-background"
								/>
								<p class="text-[10px] text-muted-foreground">
									Format: Tanggal dan jam acuan (WIB/lokal).
								</p>
							</div>
						{/if}
					</div>
				</label>
			</RadioGroup>
		</div>
	</CardContent>
</Card>
