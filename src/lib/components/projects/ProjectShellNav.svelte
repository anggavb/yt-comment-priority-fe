<script lang="ts">
	import { page } from '$app/state';
	import type { AnalysisProject } from '$lib/types';
	import { Badge } from '$lib/components/ui/badge';
	import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/svelte';
	import {
		Video01Icon,
		Layers01Icon,
		Comment01Icon,
		SlidersVerticalIcon,
		ChartHistogramIcon
	} from '@hugeicons/core-free-icons';

	interface Props {
		project: AnalysisProject;
	}

	let { project }: Props = $props();

	interface NavTab {
		id: string;
		label: string;
		href: string;
		icon: IconSvgElement;
		badge?: number | string;
	}

	const tabs = $derived<NavTab[]>([
		{
			id: 'videos',
			label: 'Videos',
			href: `/projects/${project.id}/videos`,
			icon: Video01Icon,
			badge: project.videoCount ?? 0
		},
		{
			id: 'products',
			label: 'Products',
			href: `/projects/${project.id}/products`,
			icon: Layers01Icon,
			badge: project.productCount ?? 0
		},
		{
			id: 'comments',
			label: 'Comments',
			href: `/projects/${project.id}/comments`,
			icon: Comment01Icon,
			badge: project.commentCount ?? 0
		},
		{
			id: 'criteria',
			label: 'Criteria',
			href: `/projects/${project.id}/criteria`,
			icon: SlidersVerticalIcon
		},
		{
			id: 'ranking',
			label: 'Ranking',
			href: `/projects/${project.id}/ranking`,
			icon: ChartHistogramIcon
		}
	]);
</script>

<div class="border-b border-border/80 bg-card/60 backdrop-blur-xs">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<nav class="-mb-px flex space-x-1 sm:space-x-4 overflow-x-auto py-2 no-scrollbar" aria-label="Project Sub Navigation">
			{#each tabs as tab (tab.id)}
				{@const isActive = page.url.pathname.startsWith(tab.href)}
				<a
					href={tab.href}
					class="group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring {isActive
						? 'bg-primary text-primary-foreground shadow-xs'
						: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
					aria-current={isActive ? 'page' : undefined}
				>
					<HugeiconsIcon
						icon={tab.icon}
						class="size-4 shrink-0 transition-transform {isActive ? 'scale-105' : 'group-hover:scale-105'}"
					/>
					<span>{tab.label}</span>

					{#if tab.badge !== undefined}
						<Badge
							variant={isActive ? 'secondary' : 'outline'}
							class="h-4 min-w-4 px-1 text-[10px] font-semibold {isActive
								? 'bg-primary-foreground/20 text-primary-foreground border-transparent'
								: 'bg-muted/60 text-muted-foreground'}"
						>
							{tab.badge}
						</Badge>
					{/if}
				</a>
			{/each}
		</nav>
	</div>
</div>
