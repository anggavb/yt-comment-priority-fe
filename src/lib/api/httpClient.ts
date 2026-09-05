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

export class HttpApiClient implements ApiClient {
	private baseUrl: string;

	constructor(baseUrl: string = 'http://localhost:3000') {
		this.baseUrl = baseUrl.replace(/\/+$/, '');
	}

	getBaseUrl(): string {
		return this.baseUrl;
	}

	setBaseUrl(url: string) {
		this.baseUrl = url.replace(/\/+$/, '');
	}

	private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
		const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000);

		try {
			const res = await fetch(url, {
				...options,
				signal: controller.signal,
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					...(options.headers || {})
				}
			});

			if (!res.ok) {
				const errorText = await res.text().catch(() => res.statusText);
				throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
			}

			return (await res.json()) as T;
		} finally {
			clearTimeout(timeoutId);
		}
	}

	// Projects
	async getProjects(): Promise<AnalysisProject[]> {
		return this.request<AnalysisProject[]>('/projects');
	}

	async getProject(id: string): Promise<AnalysisProject | null> {
		return this.request<AnalysisProject>(`/projects/${id}`).catch(() => null);
	}

	async createProject(dto: CreateProjectDto): Promise<AnalysisProject> {
		return this.request<AnalysisProject>('/projects', {
			method: 'POST',
			body: JSON.stringify(dto)
		});
	}

	async updateProject(id: string, dto: UpdateProjectDto): Promise<AnalysisProject | null> {
		return this.request<AnalysisProject>(`/projects/${id}`, {
			method: 'PUT',
			body: JSON.stringify(dto)
		}).catch(() => null);
	}

	async deleteProject(id: string): Promise<boolean> {
		await this.request(`/projects/${id}`, { method: 'DELETE' });
		return true;
	}

	// Videos
	async getVideos(projectId: string): Promise<YouTubeVideo[]> {
		return this.request<YouTubeVideo[]>(`/projects/${projectId}/videos`);
	}

	async addVideo(projectId: string, dto: AddVideoDto): Promise<YouTubeVideo> {
		return this.request<YouTubeVideo>(`/projects/${projectId}/videos`, {
			method: 'POST',
			body: JSON.stringify(dto)
		});
	}

	async deleteVideo(id: string): Promise<boolean> {
		await this.request(`/videos/${id}`, { method: 'DELETE' });
		return true;
	}

	async fetchComments(videoId: string, options?: FetchCommentsOptions): Promise<YouTubeVideo | null> {
		return this.request<YouTubeVideo>(`/videos/${videoId}/fetch-comments`, {
			method: 'POST',
			body: JSON.stringify(options || {})
		}).catch(() => null);
	}

	// Products
	async getProducts(projectId: string): Promise<CandidateProduct[]> {
		return this.request<CandidateProduct[]>(`/projects/${projectId}/products`);
	}

	async createProduct(projectId: string, dto: CreateProductDto): Promise<CandidateProduct> {
		return this.request<CandidateProduct>(`/projects/${projectId}/products`, {
			method: 'POST',
			body: JSON.stringify(dto)
		});
	}

	async updateProduct(id: string, dto: UpdateProductDto): Promise<CandidateProduct | null> {
		return this.request<CandidateProduct>(`/products/${id}`, {
			method: 'PUT',
			body: JSON.stringify(dto)
		}).catch(() => null);
	}

	async deleteProduct(id: string): Promise<boolean> {
		await this.request(`/products/${id}`, { method: 'DELETE' });
		return true;
	}

	// Keywords
	async addProductKeyword(productId: string, keyword: string): Promise<ProductKeyword | null> {
		return this.request<ProductKeyword>(`/products/${productId}/keywords`, {
			method: 'POST',
			body: JSON.stringify({ keyword })
		}).catch(() => null);
	}

	async deleteProductKeyword(keywordId: string): Promise<boolean> {
		await this.request(`/product-keywords/${keywordId}`, { method: 'DELETE' });
		return true;
	}

	async getRequestKeywords(): Promise<RequestKeyword[]> {
		return this.request<RequestKeyword[]>('/request-keywords');
	}

	async createRequestKeyword(keyword: string): Promise<RequestKeyword | null> {
		return this.request<RequestKeyword>('/request-keywords', {
			method: 'POST',
			body: JSON.stringify({ keyword })
		}).catch(() => null);
	}

	async deleteRequestKeyword(id: string): Promise<boolean> {
		await this.request(`/request-keywords/${id}`, { method: 'DELETE' });
		return true;
	}

	// Comments & Processing
	async processComments(projectId: string): Promise<ProcessCommentsResult> {
		return this.request<ProcessCommentsResult>(`/projects/${projectId}/process-comments`, {
			method: 'POST'
		});
	}

	async getComments(
		projectId: string,
		filter?: CommentFilterDto
	): Promise<PaginatedResponse<Comment & { matches?: CommentMatch[] }>> {
		const params = new URLSearchParams();
		if (filter?.productId) params.append('productId', filter.productId);
		if (filter?.isMention !== undefined) params.append('isMention', String(filter.isMention));
		if (filter?.isRequest !== undefined) params.append('isRequest', String(filter.isRequest));
		if (filter?.search) params.append('search', filter.search);
		if (filter?.page) params.append('page', String(filter.page));
		if (filter?.limit) params.append('limit', String(filter.limit));

		const query = params.toString();
		return this.request<PaginatedResponse<Comment & { matches?: CommentMatch[] }>>(
			`/projects/${projectId}/comments${query ? `?${query}` : ''}`
		);
	}

	async getCommentMatches(projectId: string): Promise<CommentMatch[]> {
		return this.request<CommentMatch[]>(`/projects/${projectId}/comment-matches`);
	}

	// Criteria & C4
	async getCriteria(projectId: string): Promise<{ criteria: Criteria[]; c4Config: C4TimeAnchorConfig }> {
		return this.request<{ criteria: Criteria[]; c4Config: C4TimeAnchorConfig }>(
			`/projects/${projectId}/criteria`
		);
	}

	async updateCriteria(
		projectId: string,
		dto: UpdateCriteriaDto
	): Promise<{ criteria: Criteria[]; c4Config: C4TimeAnchorConfig }> {
		return this.request<{ criteria: Criteria[]; c4Config: C4TimeAnchorConfig }>(
			`/projects/${projectId}/criteria`,
			{
				method: 'PUT',
				body: JSON.stringify(dto)
			}
		);
	}

	// SAW Rankings
	async calculateRanking(projectId: string): Promise<RankingLeaderboard> {
		return this.request<RankingLeaderboard>(`/projects/${projectId}/calculate-ranking`, {
			method: 'POST'
		});
	}

	async getRankings(projectId: string): Promise<RankingLeaderboard | null> {
		return this.request<RankingLeaderboard>(`/projects/${projectId}/rankings`).catch(() => null);
	}

	// Health Check
	async checkBackendHealth(): Promise<BackendHealth> {
		const start = performance.now();
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 3000);

		try {
			const res = await fetch(`${this.baseUrl}/health`, {
				signal: controller.signal
			});
			const latencyMs = Math.round(performance.now() - start);

			if (res.ok) {
				return {
					status: 'online',
					latencyMs,
					url: this.baseUrl,
					lastChecked: new Date().toISOString()
				};
			}
			return {
				status: 'offline',
				latencyMs,
				url: this.baseUrl,
				lastChecked: new Date().toISOString()
			};
		} catch {
			return {
				status: 'offline',
				url: this.baseUrl,
				lastChecked: new Date().toISOString()
			};
		} finally {
			clearTimeout(timeoutId);
		}
	}
}

export const httpApiClient = new HttpApiClient();
