<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/api';
	import type { AnalysisProject } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import ProjectCard from '$lib/components/projects/ProjectCard.svelte';
	import ProjectDialog from '$lib/components/projects/ProjectDialog.svelte';
	import DeleteProjectDialog from '$lib/components/projects/DeleteProjectDialog.svelte';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Add01Icon,
		Search01Icon,
		Folder01Icon,
		Video01Icon,
		Comment01Icon,
		Loading03Icon,
		Layers01Icon
	} from '@hugeicons/core-free-icons';

	let projects = $state<AnalysisProject[]>([]);
	let isLoading = $state(true);
	let searchQuery = $state('');

	// Dialog states
	let isDialogOpen = $state(false);
	let dialogMode = $state<'create' | 'edit'>('create');
	let selectedProject = $state<AnalysisProject | null>(null);

	let isDeleteDialogOpen = $state(false);
	let projectToDelete = $state<AnalysisProject | null>(null);

	onMount(() => {
		loadProjects();
	});

	async function loadProjects() {
		isLoading = true;
		try {
			projects = await apiClient.getProjects();
		} finally {
			isLoading = false;
		}
	}

	const filteredProjects = $derived(
		projects.filter((p) => {
			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase();
			return (
				p.name.toLowerCase().includes(q) ||
				(p.description && p.description.toLowerCase().includes(q))
			);
		})
	);

	const totalVideos = $derived(projects.reduce((acc, p) => acc + (p.videoCount || 0), 0));
	const totalProducts = $derived(projects.reduce((acc, p) => acc + (p.productCount || 0), 0));
	const totalComments = $derived(projects.reduce((acc, p) => acc + (p.commentCount || 0), 0));

	function handleOpenCreate() {
		selectedProject = null;
		dialogMode = 'create';
		isDialogOpen = true;
	}

	function handleOpenEdit(project: AnalysisProject) {
		selectedProject = project;
		dialogMode = 'edit';
		isDialogOpen = true;
	}

	function handleOpenDelete(project: AnalysisProject) {
		projectToDelete = project;
		isDeleteDialogOpen = true;
	}

	async function handleSaveProject(data: { name: string; description: string }) {
		if (dialogMode === 'create') {
			const created = await apiClient.createProject({
				name: data.name,
				description: data.description
			});
			projects = [created, ...projects];
		} else if (dialogMode === 'edit' && selectedProject) {
			const updated = await apiClient.updateProject(selectedProject.id, {
				name: data.name,
				description: data.description
			});
			if (updated) {
				projects = projects.map((p) => (p.id === updated.id ? updated : p));
			}
		}
	}

	async function handleDeleteConfirm(projectId: string) {
		const success = await apiClient.deleteProject(projectId);
		if (success) {
			projects = projects.filter((p) => p.id !== projectId);
		}
	}
</script>

<svelte:head>
	<title>Analysis Projects - YouTube Review Priority System</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Page Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<div class="flex items-center gap-2">
				<h1 class="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
					Analysis Projects
				</h1>
				<Badge variant="outline" class="text-xs">
					{projects.length} Total
				</Badge>
			</div>
			<p class="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
				Kelola wadah terisolasi Analysis Project. Setiap project mencakup video, candidate products, komentar audiens, kriteria pembobotan, dan hasil perangkingan metode SAW.
			</p>
		</div>

		<Button
			onclick={handleOpenCreate}
			class="gap-1.5 self-start sm:self-auto bg-[#FF0000] hover:bg-[#FF0000]/90 text-white shadow-sm"
		>
			<HugeiconsIcon icon={Add01Icon} class="size-4" />
			<span>Buat Project Baru</span>
		</Button>
	</div>

	<!-- Statistics Overview -->
	<div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div class="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
			<div class="flex items-center justify-between text-xs text-muted-foreground">
				<span>Total Analysis Project</span>
				<HugeiconsIcon icon={Folder01Icon} class="size-4 text-muted-foreground" />
			</div>
			<div class="mt-2 text-2xl font-bold text-foreground">
				{isLoading ? '...' : projects.length}
			</div>
			<p class="mt-0.5 text-[11px] text-muted-foreground">Analysis Project aktif</p>
		</div>

		<div class="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
			<div class="flex items-center justify-between text-xs text-muted-foreground">
				<span>Video YouTube</span>
				<HugeiconsIcon icon={Video01Icon} class="size-4 text-muted-foreground" />
			</div>
			<div class="mt-2 text-2xl font-bold text-foreground">
				{isLoading ? '...' : totalVideos}
			</div>
			<p class="mt-0.5 text-[11px] text-muted-foreground">Dari seluruh project</p>
		</div>

		<div class="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
			<div class="flex items-center justify-between text-xs text-muted-foreground">
				<span>Candidate Products</span>
				<HugeiconsIcon icon={Layers01Icon} class="size-4 text-muted-foreground" />
			</div>
			<div class="mt-2 text-2xl font-bold text-foreground">
				{isLoading ? '...' : totalProducts}
			</div>
			<p class="mt-0.5 text-[11px] text-muted-foreground">Alternatif dievaluasi</p>
		</div>

		<div class="rounded-xl border border-border/70 bg-card p-4 shadow-2xs">
			<div class="flex items-center justify-between text-xs text-muted-foreground">
				<span>Komentar Audiens</span>
				<HugeiconsIcon icon={Comment01Icon} class="size-4 text-muted-foreground" />
			</div>
			<div class="mt-2 text-2xl font-bold text-foreground">
				{isLoading ? '...' : totalComments}
			</div>
			<p class="mt-0.5 text-[11px] text-muted-foreground">Terekam & diproses</p>
		</div>
	</div>

	<!-- Controls & Search Filter -->
	<div class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="relative flex-1 max-w-md">
			<HugeiconsIcon
				icon={Search01Icon}
				class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
			/>
			<Input
				type="search"
				placeholder="Cari berdasarkan nama atau deskripsi project..."
				bind:value={searchQuery}
				class="pl-9 text-xs"
			/>
		</div>

		{#if searchQuery}
			<Button
				variant="ghost"
				size="sm"
				onclick={() => (searchQuery = '')}
				class="text-xs text-muted-foreground self-start sm:self-auto"
			>
				Reset Pencarian
			</Button>
		{/if}
	</div>

	<!-- Project List Content -->
	<div class="mt-6">
		{#if isLoading}
			<div class="flex flex-col items-center justify-center py-20 text-muted-foreground">
				<HugeiconsIcon icon={Loading03Icon} class="size-8 animate-spin text-primary" />
				<p class="mt-3 text-xs">Memuat Analysis Projects...</p>
			</div>
		{:else if projects.length === 0}
			<!-- No projects at all -->
			<div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 py-16 px-4 text-center">
				<div class="flex size-14 items-center justify-center rounded-2xl bg-[#FF0000]/10 text-[#FF0000]">
					<HugeiconsIcon icon={Folder01Icon} class="size-7" />
				</div>
				<h3 class="mt-4 text-base font-bold text-foreground">Belum Ada Analysis Project</h3>
				<p class="mt-1 text-xs text-muted-foreground max-w-sm">
					Mulai analisis prioritas review produk dengan membuat Analysis Project pertama Anda.
				</p>
				<Button onclick={handleOpenCreate} class="mt-5 gap-1.5 bg-[#FF0000] hover:bg-[#FF0000]/90 text-white text-xs">
					<HugeiconsIcon icon={Add01Icon} class="size-4" />
					<span>Buat Project Pertama</span>
				</Button>
			</div>
		{:else if filteredProjects.length === 0}
			<!-- Search query yielded 0 results -->
			<div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 py-12 px-4 text-center">
				<HugeiconsIcon icon={Search01Icon} class="size-8 text-muted-foreground" />
				<h3 class="mt-3 text-sm font-semibold text-foreground">Project Tidak Ditemukan</h3>
				<p class="mt-1 text-xs text-muted-foreground">
					Tidak ada project yang cocok dengan kata kunci "{searchQuery}".
				</p>
				<Button
					variant="outline"
					size="sm"
					onclick={() => (searchQuery = '')}
					class="mt-4 text-xs"
				>
					Bersihkan Filter
				</Button>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
				{#each filteredProjects as project (project.id)}
					<ProjectCard
						{project}
						onedit={handleOpenEdit}
						ondelete={handleOpenDelete}
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Project Create / Edit Dialog -->
<ProjectDialog
	bind:open={isDialogOpen}
	mode={dialogMode}
	project={selectedProject}
	onsubmit={handleSaveProject}
/>

<!-- Delete Project Confirmation Dialog -->
<DeleteProjectDialog
	bind:open={isDeleteDialogOpen}
	project={projectToDelete}
	onconfirm={handleDeleteConfirm}
/>
