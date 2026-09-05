<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { apiClient } from '$lib/api';
	import type { AnalysisProject } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import ProjectShellNav from '$lib/components/projects/ProjectShellNav.svelte';
	import ProjectDialog from '$lib/components/projects/ProjectDialog.svelte';
	import DeleteProjectDialog from '$lib/components/projects/DeleteProjectDialog.svelte';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ArrowLeft01Icon,
		Edit02Icon,
		Delete02Icon,
		Clock01Icon,
		Calendar01Icon
	} from '@hugeicons/core-free-icons';

	import { formatDate, getProjectStatusConfig } from '$lib/components/projects/utils';

	let { data, children } = $props();

	let editedProject = $state<AnalysisProject | null>(null);
	const project = $derived(editedProject ?? data.project);

	$effect(() => {
		// Reset local override when route param changes
		if (data.project) {
			editedProject = null;
		}
	});

	// Dialog states
	let isEditDialogOpen = $state(false);
	let isDeleteDialogOpen = $state(false);

	const statusConfig = $derived(getProjectStatusConfig(project.status));

	const currentSubView = $derived.by(() => {
		const path = page.url.pathname;
		if (path.includes('/videos')) return 'Videos';
		if (path.includes('/products')) return 'Candidate Products';
		if (path.includes('/comments')) return 'Comments & Processing';
		if (path.includes('/criteria')) return 'Criteria & C4 Setup';
		if (path.includes('/ranking')) return 'SAW Ranking Leaderboard';
		return 'Overview';
	});

	async function handleUpdateProject(formData: { name: string; description: string }) {
		const updated = await apiClient.updateProject(project.id, {
			name: formData.name,
			description: formData.description
		});
		if (updated) {
			editedProject = updated;
		}
	}

	async function handleDeleteConfirm(projectId: string) {
		const success = await apiClient.deleteProject(projectId);
		if (success) {
			goto('/projects');
		} else {
			throw new Error('Gagal menghapus Analysis Project dari server.');
		}
	}
</script>

<svelte:head>
	<title>{project.name} - YT Priority</title>
</svelte:head>

<div class="min-h-[calc(100vh-3.5rem)] flex flex-col bg-background">
	<!-- Project Shell Header -->
	<header class="border-b border-border/70 bg-card/40 pt-6 pb-4 transition-colors">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<!-- Breadcrumb & Back navigation -->
			<div class="flex items-center justify-between gap-4">
				<div class="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
					<a
						href="/projects"
						class="inline-flex items-center gap-1 font-medium hover:text-foreground transition-colors"
					>
						<HugeiconsIcon icon={ArrowLeft01Icon} class="size-3.5" />
						<span>Analysis Projects</span>
					</a>
					<span>/</span>
					<span class="font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">
						{project.name}
					</span>
					<span>/</span>
					<span class="text-primary font-semibold">
						{currentSubView}
					</span>
				</div>

				<!-- Action buttons -->
				<div class="flex items-center gap-2 shrink-0">
					<Button
						variant="outline"
						size="xs"
						onclick={() => (isEditDialogOpen = true)}
						class="gap-1.5 text-xs"
					>
						<HugeiconsIcon icon={Edit02Icon} class="size-3 text-muted-foreground" />
						<span class="hidden sm:inline">Edit Project</span>
					</Button>
					<Button
						variant="ghost"
						size="xs"
						onclick={() => (isDeleteDialogOpen = true)}
						class="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
					>
						<HugeiconsIcon icon={Delete02Icon} class="size-3" />
						<span class="hidden sm:inline">Hapus</span>
					</Button>
				</div>
			</div>

			<!-- Project Title & Details -->
			<div class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
				<div class="flex-1 min-w-0">
					<div class="flex flex-wrap items-center gap-2.5">
						<h1 class="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground truncate">
							{project.name}
						</h1>
						<Badge variant="outline" class="px-2 py-0.5 text-[10px] font-semibold {statusConfig.badgeClass}">
							{statusConfig.label}
						</Badge>
					</div>

					<p class="mt-1 text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
						{project.description || 'Tidak ada deskripsi pada project ini.'}
					</p>

					<!-- Metadata row -->
					<div class="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
						<div class="flex items-center gap-1">
							<HugeiconsIcon icon={Calendar01Icon} class="size-3.5" />
							<span>Dibuat: {formatDate(project.createdAt)}</span>
						</div>
						<span>•</span>
						<div class="flex items-center gap-1">
							<HugeiconsIcon icon={Clock01Icon} class="size-3.5" />
							<span>Diperbarui: {formatDate(project.updatedAt || project.createdAt)}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</header>

	<!-- Persistent Sub-navigation Tabs -->
	<ProjectShellNav {project} />

	<!-- Active Sub-view Content -->
	<main class="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
		{@render children()}
	</main>
</div>

<!-- Project Edit Dialog -->
<ProjectDialog
	bind:open={isEditDialogOpen}
	mode="edit"
	{project}
	onsubmit={handleUpdateProject}
/>

<!-- Project Delete Confirmation Dialog -->
<DeleteProjectDialog
	bind:open={isDeleteDialogOpen}
	{project}
	onconfirm={handleDeleteConfirm}
/>
