import { describe, it, expect } from 'bun:test';
import {
	extractYouTubeVideoId,
	toCanonicalWatchUrl,
	getYouTubeThumbnail,
	validateVideoInput,
	fetchYouTubeOEmbed
} from './youtube';

describe('YouTube URL Parser & Validator (Issue #3)', () => {
	describe('extractYouTubeVideoId', () => {
		it('extracts video ID from standard watch URL', () => {
			expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
			expect(extractYouTubeVideoId('http://youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
			expect(extractYouTubeVideoId('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
		});

		it('extracts video ID from watch URL with query parameters', () => {
			expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe('dQw4w9WgXcQ');
			expect(extractYouTubeVideoId('https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ&ab_channel=Artist')).toBe('dQw4w9WgXcQ');
			expect(extractYouTubeVideoId('https://youtube.com/watch?list=PL123&v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
		});

		it('extracts video ID from short youtu.be URL', () => {
			expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
			expect(extractYouTubeVideoId('http://youtu.be/dQw4w9WgXcQ?si=abcdef12345')).toBe('dQw4w9WgXcQ');
			expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=100')).toBe('dQw4w9WgXcQ');
		});

		it('extracts video ID from YouTube Shorts URL', () => {
			expect(extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
			expect(extractYouTubeVideoId('https://youtube.com/shorts/dQw4w9WgXcQ?feature=share')).toBe('dQw4w9WgXcQ');
		});

		it('extracts video ID from YouTube Embed and Live URLs', () => {
			expect(extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
			expect(extractYouTubeVideoId('https://www.youtube.com/live/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
			expect(extractYouTubeVideoId('https://youtube.com/live/dQw4w9WgXcQ?feature=share')).toBe('dQw4w9WgXcQ');
		});

		it('accepts bare 11-character video ID', () => {
			expect(extractYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
			expect(extractYouTubeVideoId('a1b2c3d4e5f')).toBe('a1b2c3d4e5f');
			expect(extractYouTubeVideoId('-_-_-_-_-_-')).toBe('-_-_-_-_-_-');
		});

		it('trims leading and trailing whitespace', () => {
			expect(extractYouTubeVideoId('   https://youtu.be/dQw4w9WgXcQ   ')).toBe('dQw4w9WgXcQ');
			expect(extractYouTubeVideoId('   dQw4w9WgXcQ \n')).toBe('dQw4w9WgXcQ');
		});

		it('returns null for invalid inputs or non-YouTube URLs', () => {
			expect(extractYouTubeVideoId('')).toBeNull();
			expect(extractYouTubeVideoId('   ')).toBeNull();
			expect(extractYouTubeVideoId('https://google.com')).toBeNull();
			expect(extractYouTubeVideoId('https://vimeo.com/123456789')).toBeNull();
			expect(extractYouTubeVideoId('dQw4w9WgX')).toBeNull(); // 9 chars (not 11)
			expect(extractYouTubeVideoId('dQw4w9WgXcQ12')).toBeNull(); // 13 chars
			expect(extractYouTubeVideoId('https://youtube.com/watch?v=short')).toBeNull();
			expect(extractYouTubeVideoId('invalid-url-with-special!@#')).toBeNull();
		});
	});

	describe('toCanonicalWatchUrl', () => {
		it('creates standard watch URL from valid video ID', () => {
			expect(toCanonicalWatchUrl('dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
		});
	});

	describe('getYouTubeThumbnail', () => {
		it('returns standard YouTube image thumbnail url', () => {
			expect(getYouTubeThumbnail('dQw4w9WgXcQ')).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
			expect(getYouTubeThumbnail('dQw4w9WgXcQ', 'maxres')).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');
			expect(getYouTubeThumbnail('dQw4w9WgXcQ', 'mq')).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg');
		});
	});

	describe('validateVideoInput', () => {
		it('validates empty input with clear error message', () => {
			const res = validateVideoInput('');
			expect(res.isValid).toBe(false);
			expect(res.error).toBe('URL atau ID video YouTube wajib diisi.');
		});

		it('validates malformed input with format explanation', () => {
			const res = validateVideoInput('invalid-video-url');
			expect(res.isValid).toBe(false);
			expect(res.error).toContain('Format URL atau ID YouTube tidak valid');
		});

		it('validates valid input and returns extracted videoId', () => {
			const res = validateVideoInput('https://youtu.be/dQw4w9WgXcQ');
			expect(res.isValid).toBe(true);
			expect(res.videoId).toBe('dQw4w9WgXcQ');
			expect(res.error).toBeUndefined();
		});

		it('validates maxComments boundary limits', () => {
			const resTooLow = validateVideoInput('dQw4w9WgXcQ', 0);
			expect(resTooLow.isValid).toBe(false);
			expect(resTooLow.error).toContain('Batas komentar minimal 1');

			const resNegative = validateVideoInput('dQw4w9WgXcQ', -50);
			expect(resNegative.isValid).toBe(false);

			const resTooHigh = validateVideoInput('dQw4w9WgXcQ', 15000);
			expect(resTooHigh.isValid).toBe(false);
			expect(resTooHigh.error).toContain('maksimal 10.000');

			const resValid = validateVideoInput('dQw4w9WgXcQ', 500);
			expect(resValid.isValid).toBe(true);
		});
	});

	describe('fetchYouTubeOEmbed', () => {
		it('returns oEmbed metadata or fallback gracefully without throwing', async () => {
			const preview = await fetchYouTubeOEmbed('dQw4w9WgXcQ');
			expect(preview).toBeDefined();
			expect(preview.videoId).toBe('dQw4w9WgXcQ');
			expect(preview.thumbnailUrl).toContain('dQw4w9WgXcQ');
			expect(preview.title.length).toBeGreaterThan(0);
		});
	});
});
