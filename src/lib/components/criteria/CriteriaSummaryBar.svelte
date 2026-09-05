<script lang="ts">
	import type { CriteriaCode } from '$lib/types';
	import { CRITERIA_CODES, CRITERIA_METADATA, type WeightValidationResult } from './validation';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		CheckmarkCircle02Icon,
		Alert02Icon,
		BalanceScaleIcon,
		Loading03Icon,
		RefreshIcon,
		FloppyDiskIcon
	} from '@hugeicons/core-free-icons';

	interface Props {
		weights: Record<CriteriaCode, number>;
		validation: WeightValidationResult;
		isDirty: boolean;
		isSaving: boolean;
		onAutoBalance: () => void;
		onResetDefault: () => void;
		onSave: () => void;
	}

	let {
		weights,
		validation,
		isDirty,
		isSaving,
		onAutoBalance,
		onResetDefault,
		onSave
	}: Props = $props();
</script>

<div class="rounded-xl border border-border/80 bg-card p-4 sm:p-5 space-y-4 shadow-sm">
	<!-- Top Bar: Status Badge and Action Buttons -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<!-- Dynamic Status Badge & Indicator -->
		<div class="flex items-start sm:items-center gap-3">
			{#if validation.isValid}
				<div class="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-500/20">
					<HugeiconsIcon icon={CheckmarkCircle02Icon} class="size-6" />
				</div>
				<div>
					<div class="flex items-center gap-2">
						<Badge
							variant="outline"
							class="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-0.5 text-xs"
						>
							Total Bobot: 100% (Valid)
						</Badge>
						{#if isDirty}
							<Badge variant="secondary" class="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
								Ada perubahan belum tersimpan
							</Badge>
						{/if}
					</div>
					<p class="text-xs text-muted-foreground mt-1">
						Komposisi pembobotan valid dan siap digunakan untuk normalisasi metode SAW.
					</p>
				</div>
			{:else}
				<div class="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive shrink-0 border border-destructive/20">
					<HugeiconsIcon icon={Alert02Icon} class="size-6" />
				</div>
				<div>
					<div class="flex items-center gap-2">
						<Badge
							variant="destructive"
							class="font-bold px-2.5 py-0.5 text-xs shadow-none"
						>
							Total Bobot: {validation.sum}% ({validation.difference > 0 ? '+' : ''}{validation.difference}%)
						</Badge>
						<span class="text-xs font-semibold text-destructive">
							Harus tepat 100%
						</span>
					</div>
					<p class="text-xs text-muted-foreground mt-1">
						{validation.generalError || 'Total penjumlahan bobot seluruh kriteria harus bernilai tepat 100%.'}
					</p>
				</div>
			{/if}
		</div>

		<!-- Action Buttons: Auto-Balance, Reset, Save -->
		<div class="flex flex-wrap items-center gap-2 self-start sm:self-auto">
			<Button
				variant="outline"
				size="sm"
				class="gap-1.5 text-xs font-medium border-border/80 hover:bg-muted/80"
				onclick={onAutoBalance}
				title="Otomatis menyesuaikan proporsi bobot saat ini agar berjumlah tepat 100%"
			>
				<HugeiconsIcon icon={BalanceScaleIcon} class="size-3.5 text-primary" />
				<span>Auto-Balance ke 100%</span>
			</Button>

			<Button
				variant="ghost"
				size="sm"
				class="gap-1 text-xs text-muted-foreground hover:text-foreground"
				onclick={onResetDefault}
				title="Kembalikan ke bobot default penelitian (C1: 40%, C2: 25%, C3: 20%, C4: 15%)"
			>
				<HugeiconsIcon icon={RefreshIcon} class="size-3.5" />
				<span class="hidden md:inline">Reset Default</span>
			</Button>

			<Button
				class="gap-1.5 bg-[#FF0000] hover:bg-[#FF0000]/90 text-white text-xs font-semibold shadow-sm"
				disabled={!validation.isValid || !isDirty || isSaving}
				onclick={onSave}
			>
				{#if isSaving}
					<HugeiconsIcon icon={Loading03Icon} class="size-3.5 animate-spin" />
					<span>Menyimpan...</span>
				{:else}
					<HugeiconsIcon icon={FloppyDiskIcon} class="size-3.5" />
					<span>Simpan Konfigurasi</span>
				{/if}
			</Button>
		</div>
	</div>

	<!-- Visual Stacked Progress Bar -->
	<div class="space-y-1.5 pt-1">
		<div class="h-3 w-full rounded-md bg-muted overflow-hidden flex relative shadow-inner">
			{#each CRITERIA_CODES as code (code)}
				{@const w = Math.max(0, weights[code] || 0)}
				{#if w > 0}
					<div
						style="width: {w}%"
						class="{CRITERIA_METADATA[code].colors.bar} h-full transition-all duration-300"
						title="{code} {CRITERIA_METADATA[code].name}: {w}%"
					></div>
				{/if}
			{/each}
		</div>

		<!-- Legend Labels -->
		<div class="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-0.5">
			<div class="flex flex-wrap items-center gap-3">
				{#each CRITERIA_CODES as code (code)}
					{@const w = Math.max(0, weights[code] || 0)}
					<span class="inline-flex items-center gap-1">
						<span class="size-2 rounded-full {CRITERIA_METADATA[code].colors.dot} inline-block"></span>
						<span>{code}: {w}%</span>
					</span>
				{/each}
			</div>

			<span class="font-mono font-bold {validation.isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}">
				Total: {validation.sum}% / 100%
			</span>
		</div>
	</div>
</div>
