<script lang="ts">
	import type { CriteriaCode, CriteriaAttribute } from '$lib/types';
	import { CRITERIA_METADATA } from './validation';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Slider } from '$lib/components/ui/slider';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		code: CriteriaCode;
		name?: string;
		attribute?: CriteriaAttribute;
		weight?: number;
		disabled?: boolean;
		error?: string;
		onWeightChange?: (code: CriteriaCode, newWeight: number) => void;
	}

	let {
		code,
		name,
		attribute = 'benefit',
		weight = $bindable(0),
		disabled = false,
		error,
		onWeightChange
	}: Props = $props();

	const meta = $derived(CRITERIA_METADATA[code]);
	const displayTitle = $derived(name || meta?.name || code);
	const indonesianTitle = $derived(meta?.indonesianName || '');

	function handleNumericInput(e: Event) {
		const target = e.target as HTMLInputElement;
		let val = parseFloat(target.value);
		if (isNaN(val)) val = 0;
		if (val < 0) val = 0;
		if (val > 100) val = 100;
		weight = Number(val.toFixed(2));
		onWeightChange?.(code, weight);
	}

	function adjustWeight(delta: number) {
		if (disabled) return;
		let next = weight + delta;
		if (next < 0) next = 0;
		if (next > 100) next = 100;
		weight = Number(next.toFixed(2));
		onWeightChange?.(code, weight);
	}
</script>

<Card
	class="border-border/70 bg-card transition-all duration-200 hover:shadow-sm {meta?.colors.border} {error
		? 'ring-1 ring-destructive'
		: ''}"
>
	<CardHeader class="pb-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Badge variant="outline" class="font-mono text-xs font-bold {meta?.colors.badge}">
					{code}
				</Badge>
				<Badge variant="secondary" class="text-[10px] capitalize tracking-wide font-medium">
					{attribute}
				</Badge>
			</div>

			<!-- Percentage Badge Header Indicator -->
			<div class="flex items-center gap-1">
				<span class="text-xs text-muted-foreground font-medium">Bobot:</span>
				<span class="font-mono text-base font-extrabold text-foreground">
					{weight}%
				</span>
			</div>
		</div>

		<div class="mt-2.5">
			<CardTitle class="text-sm font-bold text-foreground flex items-center justify-between">
				<span>{displayTitle}</span>
			</CardTitle>
			{#if indonesianTitle}
				<p class="text-[11px] font-medium text-muted-foreground mt-0.5">
					{indonesianTitle}
				</p>
			{/if}
		</div>
	</CardHeader>

	<CardContent class="space-y-4 pt-1">
		<!-- Description & Formula -->
		{#if meta}
			<p class="text-xs text-muted-foreground leading-relaxed">
				{meta.description}
			</p>
			<div class="flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1 text-[11px] text-muted-foreground font-mono">
				<span class="text-[10px] uppercase font-semibold text-foreground/70">Formula:</span>
				<span class="truncate">{meta.formulaDescription}</span>
			</div>
		{/if}

		<!-- Dual-Input Controls: Slider & Numeric Input -->
		<div class="pt-2 border-t border-border/40 space-y-3">
			<div class="flex items-center justify-between gap-3">
				<span class="text-xs font-medium text-muted-foreground">Persentase Bobot (0–100%):</span>
				<div class="flex items-center gap-1">
					<Input
						type="number"
						min="0"
						max="100"
						step="1"
						value={weight}
						oninput={handleNumericInput}
						{disabled}
						class="h-8 w-20 text-right font-mono text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
					/>
					<span class="text-xs font-bold text-muted-foreground">%</span>
				</div>
			</div>

			<!-- Interactive Slider -->
			<div class="py-1">
				<Slider
					type="single"
					bind:value={weight}
					min={0}
					max={100}
					step={1}
					{disabled}
					onValueChange={(val) => {
						onWeightChange?.(code, val);
					}}
				/>
			</div>

			<!-- Quick Step Buttons -->
			<div class="flex items-center justify-between pt-1">
				<div class="flex items-center gap-1">
					<Button
						variant="outline"
						size="sm"
						class="h-6 px-2 text-[11px] font-mono text-muted-foreground hover:text-foreground"
						onclick={() => adjustWeight(-5)}
						{disabled}
					>
						-5%
					</Button>
					<Button
						variant="outline"
						size="sm"
						class="h-6 px-2 text-[11px] font-mono text-muted-foreground hover:text-foreground"
						onclick={() => adjustWeight(-1)}
						{disabled}
					>
						-1%
					</Button>
				</div>

				<div class="flex items-center gap-1">
					<Button
						variant="outline"
						size="sm"
						class="h-6 px-2 text-[11px] font-mono text-muted-foreground hover:text-foreground"
						onclick={() => adjustWeight(1)}
						{disabled}
					>
						+1%
					</Button>
					<Button
						variant="outline"
						size="sm"
						class="h-6 px-2 text-[11px] font-mono text-muted-foreground hover:text-foreground"
						onclick={() => adjustWeight(5)}
						{disabled}
					>
						+5%
					</Button>
				</div>
			</div>
		</div>

		{#if error}
			<p class="text-[11px] font-medium text-destructive mt-1">
				{error}
			</p>
		{/if}
	</CardContent>
</Card>
