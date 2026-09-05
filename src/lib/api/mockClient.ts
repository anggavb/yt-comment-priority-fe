import type { ApiClient } from './adapter';
import type {
	AddVideoDto,
	AnalysisProject,
	BackendHealth,
	CandidateProduct,
	Comment,
	CommentFilterDto,
	CommentMatch,
	CreateProductDto,
	CreateProjectDto,
	Criteria,
	C4TimeAnchorConfig,
	FetchCommentsOptions,
	PaginatedResponse,
	ProcessCommentsResult,
	ProductKeyword,
	RankingLeaderboard,
	RequestKeyword,
	UpdateCriteriaDto,
	UpdateProductDto,
	UpdateProjectDto,
	YouTubeVideo
} from '$lib/types';
import { mockService, type MockService } from '$lib/mock/mockService';

export class MockApiClient implements ApiClient {
	private service: MockService;

	constructor(service: MockService = mockService) {
		this.service = service;
	}

	async getProjects(): Promise<AnalysisProject[]> {
		return this.service.getProjects();
	}

	async getProject(id: string): Promise<AnalysisProject | null> {
		return this.service.getProject(id);
	}

	async createProject(dto: CreateProjectDto): Promise<AnalysisProject> {
		return this.service.createProject(dto);
	}

	async updateProject(id: string, dto: UpdateProjectDto): Promise<AnalysisProject | null> {
		return this.service.updateProject(id, dto);
	}

	async deleteProject(id: string): Promise<boolean> {
		return this.service.deleteProject(id);
	}

	async getVideos(projectId: string): Promise<YouTubeVideo[]> {
		return this.service.getVideos(projectId);
	}

	async addVideo(projectId: string, dto: AddVideoDto): Promise<YouTubeVideo> {
		return this.service.addVideo(projectId, dto);
	}

	async deleteVideo(id: string): Promise<boolean> {
		return this.service.deleteVideo(id);
	}

	async fetchComments(videoId: string, options?: FetchCommentsOptions): Promise<YouTubeVideo | null> {
		return this.service.fetchComments(videoId, options);
	}

	async getProducts(projectId: string): Promise<CandidateProduct[]> {
		return this.service.getProducts(projectId);
	}

	async createProduct(projectId: string, dto: CreateProductDto): Promise<CandidateProduct> {
		return this.service.createProduct(projectId, dto);
	}

	async updateProduct(id: string, dto: UpdateProductDto): Promise<CandidateProduct | null> {
		return this.service.updateProduct(id, dto);
	}

	async deleteProduct(id: string): Promise<boolean> {
		return this.service.deleteProduct(id);
	}

	async addProductKeyword(productId: string, keyword: string): Promise<ProductKeyword | null> {
		return this.service.addProductKeyword(productId, keyword);
	}

	async deleteProductKeyword(keywordId: string): Promise<boolean> {
		return this.service.deleteProductKeyword(keywordId);
	}

	async getRequestKeywords(): Promise<RequestKeyword[]> {
		return this.service.getRequestKeywords();
	}

	async createRequestKeyword(keyword: string): Promise<RequestKeyword | null> {
		return this.service.createRequestKeyword(keyword);
	}

	async deleteRequestKeyword(id: string): Promise<boolean> {
		return this.service.deleteRequestKeyword(id);
	}

	async processComments(projectId: string): Promise<ProcessCommentsResult> {
		return this.service.processComments(projectId);
	}

	async getComments(
		projectId: string,
		filter?: CommentFilterDto
	): Promise<PaginatedResponse<Comment & { matches?: CommentMatch[] }>> {
		return this.service.getComments(projectId, filter);
	}

	async getCommentMatches(projectId: string): Promise<CommentMatch[]> {
		return this.service.getCommentMatches(projectId);
	}

	async getCriteria(projectId: string): Promise<{ criteria: Criteria[]; c4Config: C4TimeAnchorConfig }> {
		return this.service.getCriteria(projectId);
	}

	async updateCriteria(
		projectId: string,
		dto: UpdateCriteriaDto
	): Promise<{ criteria: Criteria[]; c4Config: C4TimeAnchorConfig }> {
		return this.service.updateCriteria(projectId, dto);
	}

	async calculateRanking(projectId: string): Promise<RankingLeaderboard> {
		return this.service.calculateRanking(projectId);
	}

	async getRankings(projectId: string): Promise<RankingLeaderboard | null> {
		return this.service.getRankings(projectId);
	}

	async checkBackendHealth(): Promise<BackendHealth> {
		return {
			status: 'online',
			latencyMs: 0,
			url: 'in-memory://mockService',
			lastChecked: new Date().toISOString()
		};
	}
}

export const mockApiClient = new MockApiClient();
