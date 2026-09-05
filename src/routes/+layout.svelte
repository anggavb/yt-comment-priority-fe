<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>YT Priority - YouTube Review Priority System (SAW)</title>
	<meta
		name="description"
		content="Sistem Pendukung Keputusan Penentuan Prioritas Produk Review Berdasarkan Interaksi Audiens YouTube Menggunakan Metode Simple Additive Weighting (SAW)"
	/>
</svelte:head>

<div class="relative flex min-h-screen flex-col bg-background text-foreground antialiased">
	<Navbar />
	<main class="flex-1">
		{@render children()}
	</main>
	<Footer />
</div>
