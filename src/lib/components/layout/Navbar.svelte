<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { theme } from '$lib/theme/theme.svelte';
	import { connectionStore, apiClient } from '$lib/api';
	import type { ApiConnectionState, ConnectionMode } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Sun01Icon,
		Moon02Icon,
		Database01Icon,
		ServerIcon,
		RefreshCwIcon,
		CheckmarkCircle01Icon,
		Alert02Icon
	} from '@hugeicons/core-free-icons';

	let connState = $state<ApiConnectionState>(connectionStore.state);
	let isCheckingHealth = $state(false);

	onMount(() => {
		theme.init();
		const unsubscribe = connectionStore.subscribe((state) => {
			connState = state;
		});

		// Check initial backend health in background
		apiClient.checkBackendHealth();

		return () => {
			unsubscribe();
		};
	});

	function handleSetMode(mode: ConnectionMode) {
		apiClient.setMode(mode);
		if (mode === 'live') {
			handleCheckHealth();
		}
	}

	async function handleCheckHealth() {
		isCheckingHealth = true;
		try {
			await apiClient.checkBackendHealth();
		} finally {
			isCheckingHealth = false;
		}
	}

	const navLinks = [
		{ href: '/', label: 'Overview' },
		{ href: '/projects', label: 'Analysis Projects' }
	];
</script>

<header
	class="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur-md transition-colors print:hidden"
>
	<div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<!-- Brand & Logo -->
		<div class="flex items-center gap-6">
			<a href="/" class="group flex items-center gap-2.5 transition-opacity hover:opacity-90">
				<!-- Crimson YouTube style badge -->
				<div
					class="flex size-7 items-center justify-center rounded-md bg-[#FF0000] text-white shadow-sm transition-transform group-hover:scale-105"
				>
					<svg
						class="size-4 fill-current ml-0.5"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path d="M8 5v14l11-7z" />
					</svg>
				</div>
				<div class="flex flex-col">
					<div class="flex items-center gap-1.5">
						<span class="text-sm font-bold tracking-tight text-foreground">YT Priority</span>
						<Badge
							variant="outline"
							class="h-4 border-[#FF0000]/30 bg-[#FF0000]/10 px-1 text-[10px] font-semibold text-[#FF0000]"
						>
							SAW
						</Badge>
					</div>
					<span class="hidden text-[10px] text-muted-foreground sm:inline">
						Decision Support System
					</span>
				</div>
			</a>

			<!-- Navigation Links -->
			<nav class="hidden md:flex items-center gap-1">
				{#each navLinks as link (link.href)}
					{@const isActive = page.url.pathname === link.href || (link.href !== '/' && page.url.pathname.startsWith(link.href))}
					<a
						href={link.href}
						class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors {isActive
							? 'bg-muted text-foreground font-semibold'
							: 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}"
					>
						{link.label}
					</a>
				{/each}
			</nav>
		</div>

		<!-- Right Side Controls -->
		<div class="flex items-center gap-2 sm:gap-3">
			<!-- Connection Mode Badge & Dropdown -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<button
							{...props}
							type="button"
							class="inline-flex items-center gap-1.5 rounded-full border border-border/80 px-2.5 py-1 text-xs font-medium transition-all hover:border-border hover:bg-muted/50 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							{#if connState.mode === 'mock'}
								<span class="relative flex size-2">
									<span class="size-2 rounded-full bg-blue-500"></span>
								</span>
								<HugeiconsIcon icon={Database01Icon} class="size-3 text-blue-500" />
								<span class="text-foreground">Mock Mode</span>
							{:else if connState.fallbackActive}
								<span class="relative flex size-2">
									<span class="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
									<span class="relative inline-flex size-2 rounded-full bg-amber-500"></span>
								</span>
								<HugeiconsIcon icon={Alert02Icon} class="size-3 text-amber-500" />
								<span class="text-amber-600 dark:text-amber-400 font-semibold">Live (Fallback)</span>
							{:else if connState.health.status === 'online'}
								<span class="relative flex size-2">
									<span class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
									<span class="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
								</span>
								<HugeiconsIcon icon={ServerIcon} class="size-3 text-emerald-500" />
								<span class="text-emerald-600 dark:text-emerald-400 font-semibold">Live API</span>
							{:else}
								<span class="relative flex size-2">
									<span class="size-2 rounded-full bg-rose-500"></span>
								</span>
								<HugeiconsIcon icon={ServerIcon} class="size-3 text-rose-500" />
								<span class="text-rose-600 dark:text-rose-400 font-semibold">Live (Offline)</span>
							{/if}
						</button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end" class="w-64 p-2 shadow-lg">
					<DropdownMenu.Label class="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
						API Connection Mode
					</DropdownMenu.Label>
					<DropdownMenu.Separator />

					<!-- Mock Mode Selection -->
					<DropdownMenu.Item
						class="flex items-start gap-2.5 p-2 cursor-pointer {connState.mode === 'mock' ? 'bg-muted' : ''}"
						onclick={() => handleSetMode('mock')}
					>
						<HugeiconsIcon icon={Database01Icon} class="size-4 mt-0.5 text-blue-500 shrink-0" />
						<div class="flex-1">
							<div class="flex items-center justify-between">
								<span class="text-xs font-medium">Mock In-Memory</span>
								{#if connState.mode === 'mock'}
									<HugeiconsIcon icon={CheckmarkCircle01Icon} class="size-3.5 text-blue-500" />
								{/if}
							</div>
							<p class="text-[11px] text-muted-foreground">
								Fast, zero-latency Indonesian dataset for thesis demonstration.
							</p>
						</div>
					</DropdownMenu.Item>

					<!-- Live REST Mode Selection -->
					<DropdownMenu.Item
						class="flex items-start gap-2.5 p-2 cursor-pointer {connState.mode === 'live' ? 'bg-muted' : ''}"
						onclick={() => handleSetMode('live')}
					>
						<HugeiconsIcon icon={ServerIcon} class="size-4 mt-0.5 text-emerald-500 shrink-0" />
						<div class="flex-1">
							<div class="flex items-center justify-between">
								<span class="text-xs font-medium">Live REST API</span>
								{#if connState.mode === 'live'}
									<HugeiconsIcon icon={CheckmarkCircle01Icon} class="size-3.5 text-emerald-500" />
								{/if}
							</div>
							<p class="text-[11px] text-muted-foreground">
								Connects to ElysiaJS backend ({connState.health.url}).
							</p>
						</div>
					</DropdownMenu.Item>

					{#if connState.fallbackActive}
						<div class="mt-1.5 rounded-md bg-amber-500/10 p-2 text-[11px] text-amber-600 dark:text-amber-400">
							<span class="font-semibold">Notice:</span> Backend unreachable. Automatically serving from mock store to prevent disruption.
						</div>
					{/if}

					<DropdownMenu.Separator class="my-1.5" />

					<!-- Health Check / Ping Button -->
					<div class="flex items-center justify-between px-1 py-1">
						<div class="text-[11px] text-muted-foreground">
							Status:
							<span class="font-medium capitalize {connState.health.status === 'online' ? 'text-emerald-500' : 'text-rose-500'}">
								{connState.health.status}
							</span>
							{#if connState.health.latencyMs !== undefined && connState.health.status === 'online'}
								({connState.health.latencyMs}ms)
							{/if}
						</div>
						<Button
							variant="ghost"
							size="xs"
							disabled={isCheckingHealth}
							onclick={handleCheckHealth}
							class="gap-1 text-[11px]"
						>
							<HugeiconsIcon
								icon={RefreshCwIcon}
								class="size-3 {isCheckingHealth ? 'animate-spin' : ''}"
							/>
							Ping
						</Button>
					</div>
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<!-- Dark / Light Theme Toggle -->
			<Button
				variant="ghost"
				size="icon-sm"
				class="rounded-full text-muted-foreground hover:text-foreground"
				onclick={() => theme.toggle()}
				aria-label="Toggle theme"
			>
				{#if theme.isDark}
					<HugeiconsIcon icon={Sun01Icon} class="size-4" />
				{:else}
					<HugeiconsIcon icon={Moon02Icon} class="size-4" />
				{/if}
			</Button>

			<!-- GitHub Link -->
			<a
				href="https://github.com/anggavb/yt-comment-priority-fe"
				target="_blank"
				rel="noreferrer"
				class="rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
				aria-label="GitHub Repository"
			>
				<svg class="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
					<path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
					/>
				</svg>
			</a>
		</div>
	</div>
</header>
