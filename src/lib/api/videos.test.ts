import { describe, it, expect, beforeEach } from 'bun:test';
import { MockService } from '$lib/mock/mockService';
import { MockApiClient } from '$lib/api/mockClient';
import { DualModeApiClient } from '$lib/api/client';
import type { AnalysisProject } from '$lib/types';

describe('YouTube Video Management Lifecycle via ApiClient (Issue #3)', () => {
	let mockService: MockService;
	let mockClient: MockApiClient;
	let client: DualModeApiClient;
	let project: AnalysisProject;

	beforeEach(async () => {
		mockService = new MockService();
		mockClient = new MockApiClient(mockService);
		client = new DualModeApiClient(mockClient);

		project = await client.createProject({
			name: 'Test Video Management Project',
			description: 'Testing YouTube video addition, deletion, and comment fetching'
		});
	});

	it('adds a video using standard YouTube watch URL', async () => {
		const video = await client.addVideo(project.id, {
			url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
			title: 'Rick Astley - Never Gonna Give You Up',
			channelTitle: 'Rick Astley',
			maxComments: 500
		});

		expect(video).toBeDefined();
		expect(video.youtubeVideoId).toBe('dQw4w9WgXcQ');
		expect(video.url).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
		expect(video.title).toBe('Rick Astley - Never Gonna Give You Up');
		expect(video.fetchStatus).toBe('PENDING');
		expect(video.commentCount).toBe(0);

		// Verify project video count is updated
		const videos = await client.getVideos(project.id);
		expect(videos.length).toBe(1);
		expect(videos[0].id).toBe(video.id);

		const updatedProject = await client.getProject(project.id);
		expect(updatedProject?.videoCount).toBe(1);
	});

	it('adds a video using bare 11-character video ID', async () => {
		const video = await client.addVideo(project.id, {
			url: '9bZkp7q19f0',
			title: 'PSY - GANGNAM STYLE'
		});

		expect(video).toBeDefined();
		expect(video.youtubeVideoId).toBe('9bZkp7q19f0');
		expect(video.url).toBe('https://www.youtube.com/watch?v=9bZkp7q19f0');
	});

	it('triggers comment fetching with specified maxComments and updates comment count', async () => {
		const video = await client.addVideo(project.id, {
			url: 'https://youtu.be/dQw4w9WgXcQ',
			title: 'Rick Astley'
		});

		// Initially pending
		expect(video.fetchStatus).toBe('PENDING');
		expect(video.commentCount).toBe(0);

		// Trigger comment fetch with limit 30
		const updatedVideo = await client.fetchComments(video.id, { maxComments: 30 });
		expect(updatedVideo).not.toBeNull();
		expect(updatedVideo?.fetchStatus).toBe('COMPLETED');
		expect(updatedVideo?.fetchedAt).toBeDefined();
		expect(updatedVideo?.commentCount).toBe(30);

		// Verify project statistics are updated
		const updatedProject = await client.getProject(project.id);
		expect(updatedProject?.commentCount).toBe(30);
		expect(updatedProject?.status).toBe('ready');
	});

	it('deletes a video and cascades comment removal from project', async () => {
		const video = await client.addVideo(project.id, {
			url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
		});

		// Fetch comments for video
		await client.fetchComments(video.id, { maxComments: 20 });

		let videos = await client.getVideos(project.id);
		expect(videos.length).toBe(1);

		// Delete video
		const success = await client.deleteVideo(video.id);
		expect(success).toBe(true);

		videos = await client.getVideos(project.id);
		expect(videos.length).toBe(0);

		const updatedProject = await client.getProject(project.id);
		expect(updatedProject?.videoCount).toBe(0);
	});
});
