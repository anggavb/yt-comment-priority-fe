import { apiClient } from '$lib/api';
import { error } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ params }) => {
	const project = await apiClient.getProject(params.id);
	if (!project) {
		error(404, {
			message: `Analysis Project dengan ID "${params.id}" tidak ditemukan.`
		});
	}
	return {
		project
	};
};
