import type { AnalysisProject } from '$lib/types';

export function formatDate(isoString?: string | null): string {
	if (!isoString) return '-';
	try {
		const date = new Date(isoString);
		return new Intl.DateTimeFormat('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(date);
	} catch {
		return isoString;
	}
}

export type ProjectStatus = NonNullable<AnalysisProject['status']>;

export interface ProjectStatusConfig {
	label: string;
	progressPercent: number;
	progressLabel: string;
	badgeClass: string;
}

export function getProjectStatusConfig(status?: AnalysisProject['status']): ProjectStatusConfig {
	switch (status) {
		case 'ranked':
			return {
				label: 'Ranking Selesai',
				progressPercent: 100,
				progressLabel: '100% Selesai',
				badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
			};
		case 'processed':
			return {
				label: 'Komentar Diproses',
				progressPercent: 66,
				progressLabel: '66% Diproses',
				badgeClass: 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400'
			};
		case 'ready':
			return {
				label: 'Siap Analisis',
				progressPercent: 33,
				progressLabel: '33% Siap Proses',
				badgeClass: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
			};
		case 'draft':
		default:
			return {
				label: 'Draft',
				progressPercent: 10,
				progressLabel: '10% Draft',
				badgeClass: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
			};
	}
}
