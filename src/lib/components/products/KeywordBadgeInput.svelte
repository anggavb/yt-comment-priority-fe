<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Cancel01Icon, Add01Icon } from '@hugeicons/core-free-icons';
	import { validateKeyword, normalizeKeyword } from './validation';

	interface Props {
		keywords: string[];
		placeholder?: string;
		disabled?: boolean;
		maxKeywords?: number;
		onadd?: (keyword: string) => void;
		onremove?: (keyword: string, index: number) => void;
		class?: string;
	}

	let {
		keywords = $bindable([]),
		placeholder = 'Ketik kata kunci lalu tekan Enter...',
		disabled = false,
		maxKeywords = 30,
		onadd,
		onremove,
		class: className = ''
	}: Props = $props();

	let inputValue = $state('');
	let errorText = $state<string | null>(null);
	let inputRef = $state<HTMLInputElement | null>(null);

	function tryAddKeyword() {
		if (disabled) return;
		errorText = null;

		const trimmed = inputValue.trim();
		if (!trimmed) return;

		if (keywords.length >= maxKeywords) {
			errorText = `Maksimal ${maxKeywords} kata kunci tercapai.`;
			return;
		}

		const validation = validateKeyword(trimmed, keywords);
		if (!validation.isValid) {
			errorText = validation.error || 'Kata kunci tidak valid.';
			return;
		}

		const normalized = normalizeKeyword(trimmed);
		keywords = [...keywords, normalized];
		inputValue = '';
		if (onadd) onadd(normalized);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (disabled) return;

		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			tryAddKeyword();
		} else if (e.key === 'Backspace' && inputValue === '' && keywords.length > 0) {
			e.preventDefault();
			const lastIndex = keywords.length - 1;
			const removed = keywords[lastIndex];
			keywords = keywords.slice(0, lastIndex);
			if (onremove) onremove(removed, lastIndex);
		} else {
			if (errorText) errorText = null;
		}
	}

	function removeKeyword(index: number) {
		if (disabled) return;
		const removed = keywords[index];
		keywords = keywords.filter((_, i) => i !== index);
		if (onremove) onremove(removed, index);
	}
</script>

<div class="space-y-1.5 {className}">
	<div
		class="min-h-[42px] w-full rounded-md border border-input bg-background/50 px-3 py-1.5 text-xs ring-offset-background transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 flex flex-wrap items-center gap-1.5 {disabled ? 'opacity-60 cursor-not-allowed bg-muted' : ''} {errorText ? 'border-destructive' : ''}"
	>
		<!-- Keyword Badges -->
		{#each keywords as kw, index (kw + '-' + index)}
			<span
				class="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-mono font-medium text-primary transition-colors hover:bg-primary/15"
			>
				<span>{kw}</span>
				{#if !disabled}
					<button
						type="button"
						class="rounded p-0.5 text-primary/70 hover:bg-primary/20 hover:text-primary transition-colors focus:outline-hidden"
						onclick={() => removeKeyword(index)}
						aria-label="Hapus kata kunci {kw}"
					>
						<HugeiconsIcon icon={Cancel01Icon} class="size-2.5" />
					</button>
				{/if}
			</span>
		{/each}

		<!-- Input Element -->
		<div class="flex-1 min-w-[140px] flex items-center gap-1">
			<input
				bind:this={inputRef}
				type="text"
				bind:value={inputValue}
				onkeydown={handleKeyDown}
				onblur={() => {
					if (inputValue.trim()) {
						tryAddKeyword();
					}
				}}
				placeholder={keywords.length === 0 ? placeholder : 'Tambah variasi...'}
				{disabled}
				class="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden disabled:cursor-not-allowed"
			/>

			{#if inputValue.trim() && !disabled}
				<Button
					type="button"
					variant="ghost"
					size="xs"
					class="size-6 p-0 text-muted-foreground hover:text-foreground shrink-0"
					onclick={tryAddKeyword}
					title="Tambah kata kunci"
				>
					<HugeiconsIcon icon={Add01Icon} class="size-3" />
				</Button>
			{/if}
		</div>
	</div>

	{#if errorText}
		<p class="text-[11px] font-medium text-destructive">{errorText}</p>
	{/if}
</div>
