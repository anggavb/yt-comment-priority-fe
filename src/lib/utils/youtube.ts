import type { OEmbedPreview } from '$lib/types';

export const DEFAULT_MAX_COMMENTS = 500;
export const COMMENT_LIMIT_PRESETS = [100, 250, 500, 1000, 2000] as const;

/**
 * Extract YouTube 11-character video ID from various URL formats or bare ID.
 * Supports:
 * - standard: https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - short: https://youtu.be/dQw4w9WgXcQ
 * - shorts: https://www.youtube.com/shorts/dQw4w9WgXcQ
 * - embed: https://www.youtube.com/embed/dQw4w9WgXcQ
 * - live: https://www.youtube.com/live/dQw4w9WgXcQ
 * - bare: dQw4w9WgXcQ
 */
export function extractYouTubeVideoId(input: string): string | null {
	if (!input) return null;
	const trimmed = input.trim();
	if (!trimmed) return null;

	// Bare 11-character alphanumeric/underscore/hyphen ID
	if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
		return trimmed;
	}

	// Try URL parsing
	try {
		const urlStr = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
		const url = new URL(urlStr);
		const hostname = url.hostname.toLowerCase().replace(/^www\./, '');

		if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
			const vParam = url.searchParams.get('v');
			if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
				return vParam;
			}

			const segments = url.pathname.split('/').filter(Boolean);
			if (['shorts', 'embed', 'live'].includes(segments[0]) && segments[1]) {
				const idPart = segments[1].split(/[^a-zA-Z0-9_-]/)[0];
				if (/^[a-zA-Z0-9_-]{11}$/.test(idPart)) {
					return idPart;
				}
			}
		} else if (hostname === 'youtu.be') {
			const segments = url.pathname.split('/').filter(Boolean);
			if (segments[0]) {
				const idPart = segments[0].split(/[^a-zA-Z0-9_-]/)[0];
				if (/^[a-zA-Z0-9_-]{11}$/.test(idPart)) {
					return idPart;
				}
			}
		}
	} catch {
		// Fallback to regex below
	}

	// Regex fallback for non-standard or partial URLs
	const patterns = [
		/[?&]v=([a-zA-Z0-9_-]{11})(?:[&#]|$)/,
		/youtu\.be\/([a-zA-Z0-9_-]{11})(?:[?&#/]|$)/,
		/youtube\.com\/(?:shorts|embed|live)\/([a-zA-Z0-9_-]{11})(?:[?&#/]|$)/
	];

	for (const pattern of patterns) {
		const match = trimmed.match(pattern);
		if (match && match[1]) {
			return match[1];
		}
	}

	return null;
}

/**
 * Return canonical YouTube watch URL.
 */
export function toCanonicalWatchUrl(videoId: string): string {
	return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Return YouTube CDN thumbnail URL for a video ID.
 */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'mq' | 'hq' | 'maxres' = 'hq'): string {
	const filename =
		quality === 'maxres' ? 'maxresdefault.jpg' : quality === 'mq' ? 'mqdefault.jpg' : quality === 'default' ? 'default.jpg' : 'hqdefault.jpg';
	return `https://i.ytimg.com/vi/${videoId}/${filename}`;
}

export interface VideoValidationResult {
	isValid: boolean;
	videoId?: string;
	error?: string;
}

export function validateCommentLimit(limit: number): { isValid: boolean; error?: string } {
	if (isNaN(limit) || limit < 1) {
		return { isValid: false, error: 'Batas komentar minimal 1.' };
	}
	if (limit > 10000) {
		return { isValid: false, error: 'Batas komentar maksimal 10.000 untuk menjaga kuota API.' };
	}
	return { isValid: true };
}

/**
 * Validate user input for adding a YouTube video.
 */
export function validateVideoInput(input: string, maxComments?: number): VideoValidationResult {
	if (!input || !input.trim()) {
		return { isValid: false, error: 'URL atau ID video YouTube wajib diisi.' };
	}

	const videoId = extractYouTubeVideoId(input);
	if (!videoId) {
		return {
			isValid: false,
			error: 'Format URL atau ID YouTube tidak valid. Gunakan format youtube.com/watch?v=..., youtu.be/..., shorts/..., atau 11-karakter ID.'
		};
	}

	if (maxComments !== undefined) {
		const limitCheck = validateCommentLimit(maxComments);
		if (!limitCheck.isValid) {
			return { isValid: false, error: limitCheck.error };
		}
	}

	return { isValid: true, videoId };
}

/**
 * Fetch video metadata via YouTube oEmbed API, falling back gracefully if offline / CORS restricted.
 */
export async function fetchYouTubeOEmbed(urlOrId: string): Promise<OEmbedPreview> {
	const videoId = extractYouTubeVideoId(urlOrId);
	if (!videoId) {
		throw new Error('Format URL atau ID YouTube tidak valid.');
	}

	const canonicalUrl = toCanonicalWatchUrl(videoId);
	const fallbackThumbnail = getYouTubeThumbnail(videoId, 'hq');

	try {
		const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;
		const res = await fetch(oembedUrl);
		if (res.ok) {
			const data = (await res.json()) as {
				title?: string;
				author_name?: string;
				author_url?: string;
				thumbnail_url?: string;
			};
			return {
				title: data.title || `YouTube Video (${videoId})`,
				authorName: data.author_name || 'YouTube Creator',
				authorUrl: data.author_url,
				thumbnailUrl: data.thumbnail_url || fallbackThumbnail,
				videoId
			};
		}
	} catch {
		// Network, CORS, or offline fallback
	}

	return {
		title: `YouTube Video (${videoId})`,
		authorName: 'YouTube Creator',
		thumbnailUrl: fallbackThumbnail,
		videoId
	};
}
