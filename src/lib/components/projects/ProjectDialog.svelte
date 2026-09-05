<script lang="ts">
	import type { AnalysisProject } from '$lib/types';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { validateProjectForm, type ProjectFormErrors } from './validation';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Loading03Icon } from '@hugeicons/core-free-icons';

	interface Props {
		open: boolean;
		mode?: 'create' | 'edit';
		project?: AnalysisProject | null;
		onsubmit: (data: { name: string; description: string }) => Promise<void> | void;
		oncancel?: () => void;
	}

	let {
		open = $bindable(false),
		mode = 'create',
		project = null,
		onsubmit,
		oncancel
	}: Props = $props();

	let name = $state('');
	let description = $state('');
	let errors = $state<ProjectFormErrors>({});
	let isSubmitting = $state(false);

	$effect(() => {
		if (open) {
			if (mode === 'edit' && project) {
				name = project.name;
				description = project.description || '';
			} else {
				name = '';
				description = '';
			}
			errors = {};
			isSubmitting = false;
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const validation = validateProjectForm(name, description);
		if (!validation.isValid) {
			errors = validation.errors;
			return;
		}

		errors = {};
		isSubmitting = true;
		try {
			await onsubmit({
				name: name.trim(),
				description: description.trim()
			});
			open = false;
		} catch (err: unknown) {
			errors = {
				name: err instanceof Error ? err.message : 'Gagal menyimpan project.'
			};
		} finally {
			isSubmitting = false;
		}
	}

	function handleClose(isOpen: boolean) {
		open = isOpen;
		if (!isOpen && oncancel) {
			oncancel();
		}
	}
</script>

<Dialog.Root bind:open={open} onOpenChange={handleClose}>
	<Dialog.Content class="sm:max-w-[480px]">
		<form onsubmit={handleSubmit} class="space-y-4">
			<Dialog.Header>
				<Dialog.Title class="text-base font-bold text-foreground">
					{mode === 'create' ? 'Buat Analysis Project Baru' : 'Edit Analysis Project'}
				</Dialog.Title>
				<Dialog.Description class="text-xs text-muted-foreground">
					{mode === 'create'
						? 'Wadah terisolasi Analysis Project yang mengelompokkan video, candidate products, kriteria, dan hasil perangkingan.'
						: 'Perbarui nama dan deskripsi Analysis Project ini.'}
				</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-3 py-1">
				<div class="space-y-1.5">
					<Label for="project-name" class="text-xs font-semibold">
						Nama Project <span class="text-[#FF0000]">*</span>
					</Label>
					<Input
						id="project-name"
						placeholder="contoh: Prioritas Ulasan Smartphone Flagship 2026"
						bind:value={name}
						disabled={isSubmitting}
						class="w-full text-xs"
						aria-invalid={!!errors.name}
					/>
					{#if errors.name}
						<p class="text-[11px] font-medium text-destructive">{errors.name}</p>
					{/if}
				</div>

				<div class="space-y-1.5">
					<div class="flex items-center justify-between">
						<Label for="project-description" class="text-xs font-semibold">
							Deskripsi Project
						</Label>
						<span class="text-[10px] text-muted-foreground">Opsional</span>
					</div>
					<Textarea
						id="project-description"
						placeholder="Deskripsi konteks penelitian atau catatan eksperimen..."
						bind:value={description}
						disabled={isSubmitting}
						class="min-h-[80px] text-xs resize-none"
						aria-invalid={!!errors.description}
					/>
					{#if errors.description}
						<p class="text-[11px] font-medium text-destructive">{errors.description}</p>
					{/if}
				</div>
			</div>

			<Dialog.Footer class="gap-2 sm:gap-0 pt-2">
				<Button
					type="button"
					variant="outline"
					disabled={isSubmitting}
					onclick={() => handleClose(false)}
					class="text-xs"
				>
					Batal
				</Button>
				<Button
					type="submit"
					disabled={isSubmitting}
					class="gap-1.5 text-xs bg-[#FF0000] hover:bg-[#FF0000]/90 text-white"
				>
					{#if isSubmitting}
						<HugeiconsIcon icon={Loading03Icon} class="size-3.5 animate-spin" />
						<span>Menyimpan...</span>
					{:else}
						<span>{mode === 'create' ? 'Buat Project' : 'Simpan Perubahan'}</span>
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
