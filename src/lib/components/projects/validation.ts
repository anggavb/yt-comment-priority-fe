export interface ProjectFormErrors {
	name?: string;
	description?: string;
}

export function validateProjectForm(
	name: string,
	description?: string
): {
	isValid: boolean;
	errors: ProjectFormErrors;
} {
	const errors: ProjectFormErrors = {};
	const trimmedName = name ? name.trim() : '';

	if (!trimmedName) {
		errors.name = 'Nama project wajib diisi.';
	} else if (trimmedName.length < 3) {
		errors.name = 'Nama project minimal harus 3 karakter.';
	} else if (trimmedName.length > 100) {
		errors.name = 'Nama project maksimal 100 karakter.';
	}

	if (description && description.length > 500) {
		errors.description = 'Deskripsi project maksimal 500 karakter.';
	}

	return {
		isValid: Object.keys(errors).length === 0,
		errors
	};
}
