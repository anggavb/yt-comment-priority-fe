<script lang="ts">
	import type { AnalysisProject } from '$lib/types';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Video01Icon,
		Layers01Icon,
		ArrowRight01Icon,
		MoreVerticalIcon,
		Edit02Icon,
		Delete02Icon,
		Clock01Icon,
		CheckmarkCircle01Icon
	} from '@hugeicons/core-free-icons';
	import { formatDate, getProjectStatusConfig } from './utils';

	interface Props {
		project: AnalysisProject;
		onedit?: (project: AnalysisProject) => void;
		ondelete?: (project: AnalysisProject) => void;
	}

	let { project, onedit, ondelete }: Props = $props();

	const statusConfig = $derived(getProjectStatusConfig(project.status));
</script>

<Card class="group flex flex-col justify-between border-border/70 bg-card transition-all hover:border-border hover:shadow-md">
	<CardHeader class="pb-3">
		<div class="flex items-start justify-between gap-2">
			<Badge variant="outline" class="px-2 py-0.5 text-[10px] font-semibold {statusConfig.badgeClass}">
				{statusConfig.label}
			</Badge>

			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<button
							{...props}
							type="button"
							class="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
							aria-label="Menu aksi project"
						>
							<HugeiconsIcon icon={MoreVerticalIcon} class="size-4" />
						</button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end" class="w-40 text-xs">
					{#if onedit}
						<DropdownMenu.Item onclick={() => onedit(project)} class="gap-2 cursor-pointer">
							<HugeiconsIcon icon={Edit02Icon} class="size-3.5 text-muted-foreground" />
							<span>Edit Project</span>
						</DropdownMenu.Item>
					{/if}
					{#if ondelete}
						<DropdownMenu.Separator />
						<DropdownMenu.Item
							onclick={() => ondelete(project)}
							class="gap-2 cursor-pointer text-destructive focus:text-destructive"
						>
							<HugeiconsIcon icon={Delete02Icon} class="size-3.5" />
							<span>Hapus Project</span>
						</DropdownMenu.Item>
					{/if}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>

		<CardTitle class="mt-2 text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
			<a href="/projects/{project.id}" class="hover:underline">
				{project.name}
			</a>
		</CardTitle>

		<CardDescription class="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[32px]">
			{project.description || 'Tidak ada deskripsi.'}
		</CardDescription>
	</CardHeader>

	<CardContent class="py-2 space-y-3">
		<!-- Summary Statistics (Video Count, Product Count, Analysis Progress per Spec) -->
		<div class="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-2.5 text-center border border-border/40">
			<div class="flex flex-col items-center justify-center">
				<div class="flex items-center gap-1 text-[11px] text-muted-foreground">
					<HugeiconsIcon icon={Video01Icon} class="size-3" />
					<span>Video</span>
				</div>
				<span class="mt-0.5 text-sm font-bold text-foreground">
					{project.videoCount ?? 0}
				</span>
			</div>

			<div class="flex flex-col items-center justify-center border-x border-border/40">
				<div class="flex items-center gap-1 text-[11px] text-muted-foreground">
					<HugeiconsIcon icon={Layers01Icon} class="size-3" />
					<span>Produk</span>
				</div>
				<span class="mt-0.5 text-sm font-bold text-foreground">
					{project.productCount ?? 0}
				</span>
			</div>

			<div class="flex flex-col items-center justify-center">
				<div class="flex items-center gap-1 text-[11px] text-muted-foreground">
					<HugeiconsIcon icon={CheckmarkCircle01Icon} class="size-3" />
					<span>Progress</span>
				</div>
				<span class="mt-0.5 text-xs font-bold text-foreground">
					{statusConfig.progressPercent}%
				</span>
			</div>
		</div>

		<!-- Analysis Progress Bar -->
		<div class="space-y-1">
			<div class="flex items-center justify-between text-[10px] text-muted-foreground">
				<span>Status Analisis</span>
				<span class="font-medium text-foreground">{statusConfig.progressLabel}</span>
			</div>
			<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
				<div
					class="h-full bg-primary transition-all duration-300"
					style="width: {statusConfig.progressPercent}%"
				></div>
			</div>
		</div>
	</CardContent>

	<CardFooter class="flex items-center justify-between border-t border-border/40 pt-3 pb-3 text-xs">
		<div class="flex items-center gap-1 text-[11px] text-muted-foreground">
			<HugeiconsIcon icon={Clock01Icon} class="size-3" />
			<span>Diperbarui {formatDate(project.updatedAt || project.createdAt)}</span>
		</div>

		<Button
			href="/projects/{project.id}"
			variant="ghost"
			size="xs"
			class="gap-1 text-xs font-semibold text-primary hover:text-primary/90"
		>
			<span>Buka</span>
			<HugeiconsIcon icon={ArrowRight01Icon} class="size-3" />
		</Button>
	</CardFooter>
</Card>
