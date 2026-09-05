<script lang="ts">
	import { highlightMatchedKeywords } from '$lib/engine/commentProcessor';

	interface Props {
		text: string;
		productKeywords?: string[];
		requestKeywords?: string[];
		class?: string;
	}

	let {
		text,
		productKeywords = [],
		requestKeywords = [],
		class: className = ''
	}: Props = $props();

	let segments = $derived(
		highlightMatchedKeywords(text, productKeywords, requestKeywords)
	);
</script>

<span class="inline leading-relaxed {className}">
	{#each segments as seg, idx (idx)}
		{#if seg.type === 'product'}
			<mark
				class="rounded bg-blue-100 dark:bg-blue-900/50 px-1 py-0.5 font-medium text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700/60"
				title="Kata Kunci Produk: {seg.keyword}"
			>
				{seg.text}
			</mark>
		{:else if seg.type === 'request'}
			<mark
				class="rounded bg-rose-100 dark:bg-rose-900/50 px-1 py-0.5 font-semibold text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-700/60"
				title="Kata Kunci Permintaan: {seg.keyword}"
			>
				{seg.text}
			</mark>
		{:else}
			<span>{seg.text}</span>
		{/if}
	{/each}
</span>
