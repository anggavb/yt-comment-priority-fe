export type Theme = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'yt_priority_theme';

class ThemeManager {
	current = $state<Theme>('system');
	isDark = $state<boolean>(false);

	constructor() {
		// Initial sync will happen in init() on client mount
	}

	init() {
		if (typeof window === 'undefined') return;

		const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
		if (saved && ['light', 'dark', 'system'].includes(saved)) {
			this.current = saved;
		}

		this.applyTheme();

		// Listen for system theme changes
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		mediaQuery.addEventListener('change', () => {
			if (this.current === 'system') {
				this.applyTheme();
			}
		});
	}

	setTheme(theme: Theme) {
		this.current = theme;
		if (typeof window !== 'undefined') {
			localStorage.setItem(THEME_STORAGE_KEY, theme);
		}
		this.applyTheme();
	}

	toggle() {
		if (this.isDark) {
			this.setTheme('light');
		} else {
			this.setTheme('dark');
		}
	}

	private applyTheme() {
		if (typeof window === 'undefined') return;

		const shouldBeDark =
			this.current === 'dark'
				? true
				: this.current === 'light'
					? false
					: window.matchMedia('(prefers-color-scheme: dark)').matches;

		this.isDark = shouldBeDark;
		document.documentElement.classList.toggle('dark', shouldBeDark);
	}
}

export const theme = new ThemeManager();
