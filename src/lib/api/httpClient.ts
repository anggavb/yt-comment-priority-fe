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
	CriteriaCode,
	C4TimeAnchorConfig,
	DecisionMatrix,
	DecisionMatrixRow,
	FetchCommentsOptions,
	NormalizedMatrix,
	NormalizedMatrixRow,
	PaginatedResponse,
	ProcessCommentsResult,
	ProductKeyword,
	RankingLeaderboard,
	RankingResult,
	RequestKeyword,
	UpdateCriteriaDto,
	UpdateProductDto,
	UpdateProjectDto,
	WeightedMatrix,
	WeightedMatrixRow,
	YouTubeVideo
} from '$lib/types';

export class HttpApiClient implements ApiClient {
	private baseUrl: string;

	constructor(baseUrl: string = import.meta.env?.PUBLIC_API_BASE_URL || 'http://localhost:3000') {
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
		const raw = await this.request<
			| ProcessCommentsResult
			| {
					message?: string;
					totalComments?: number;
					matchedComments?: number;
					totalMatches?: number;
					requestCount?: number;
					processedCount?: number;
					matchesFound?: number;
					summary?: {
						totalComments?: number;
						matchedComments?: number;
						requestComments?: number;
						unmatchedComments?: number;
					};
			  }
		>(`/projects/${projectId}/process-comments`, {
			method: 'POST'
		});

		const totalComments =
			raw.summary?.totalComments ?? raw.totalComments ?? raw.processedCount ?? 0;
		const matchedComments =
			raw.summary?.matchedComments ?? raw.matchedComments ?? 0;
		const requestComments =
			raw.summary?.requestComments ?? raw.requestCount ?? 0;
		const unmatchedComments =
			raw.summary?.unmatchedComments ?? Math.max(0, totalComments - matchedComments);
		const processedCount =
			raw.processedCount ?? raw.totalComments ?? totalComments;
		const matchesFound =
			raw.matchesFound ?? raw.totalMatches ?? matchedComments;

		return {
			processedCount,
			matchesFound,
			totalComments,
			matchedComments,
			totalMatches: matchesFound,
			requestCount: requestComments,
			message: raw.message,
			summary: {
				totalComments,
				matchedComments,
				requestComments,
				unmatchedComments
			}
		};
	}

	async getComments(
		projectId: string,
		filter?: CommentFilterDto
	): Promise<PaginatedResponse<Comment & { matches?: CommentMatch[] }>> {
		const params = new URLSearchParams();
		if (filter?.productId) params.append('productId', filter.productId);
		if (filter?.status) params.append('status', filter.status);
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
		const raw = await this.request<unknown>(`/projects/${projectId}/calculate-ranking`, {
			method: 'POST'
		});
		return this.adaptRankingLeaderboard(raw);
	}

	async getRankings(projectId: string): Promise<RankingLeaderboard | null> {
		const raw = await this.request<unknown>(`/projects/${projectId}/rankings`).catch(() => null);
		if (!raw) return null;
		return this.adaptRankingLeaderboard(raw);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private adaptRankingLeaderboard(raw: any): RankingLeaderboard {
		if (!raw || typeof raw !== 'object') return raw;

		// 1. Criteria Weights (backend uses lowercase: { c1, c2, c3, c4 } under "weights")
		const criteriaWeights: Record<CriteriaCode, number> = {
			C1: raw.criteriaWeights?.C1 ?? raw.weights?.c1 ?? raw.weights?.C1 ?? 0.4,
			C2: raw.criteriaWeights?.C2 ?? raw.weights?.c2 ?? raw.weights?.C2 ?? 0.25,
			C3: raw.criteriaWeights?.C3 ?? raw.weights?.c3 ?? raw.weights?.C3 ?? 0.2,
			C4: raw.criteriaWeights?.C4 ?? raw.weights?.c4 ?? raw.weights?.C4 ?? 0.15
		};

		// 2. Decision Matrix rows
		let decisionRows: DecisionMatrixRow[] = [];
		if (raw.decisionMatrix?.rows && Array.isArray(raw.decisionMatrix.rows)) {
			decisionRows = raw.decisionMatrix.rows;
		} else if (Array.isArray(raw.rankings)) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			decisionRows = raw.rankings.map((item: any) => {
				const prodId = item.productId ?? item.candidateProductId ?? '';
				const dec = raw.matrixDecision?.[prodId];
				return {
					productId: prodId,
					productName: item.productName ?? '',
					c1RequestCount: dec?.c1 ?? item.c1Raw ?? item.requestCount ?? 0,
					c2UniqueRequester: dec?.c2 ?? item.c2Raw ?? item.uniqueRequester ?? 0,
					c3AverageRequestLikes: dec?.c3 ?? item.c3Raw ?? item.averageRequestLikes ?? 0,
					c4RecentRequestRatio: dec?.c4 ?? item.c4Raw ?? item.recentRequestRatio ?? 0
				};
			});
		}

		const maxC1 = decisionRows.length > 0 ? Math.max(...decisionRows.map((r) => r.c1RequestCount)) : 0;
		const maxC2 = decisionRows.length > 0 ? Math.max(...decisionRows.map((r) => r.c2UniqueRequester)) : 0;
		const maxC3 = decisionRows.length > 0 ? Math.max(...decisionRows.map((r) => r.c3AverageRequestLikes)) : 0;
		const maxC4 = decisionRows.length > 0 ? Math.max(...decisionRows.map((r) => r.c4RecentRequestRatio)) : 0;

		const decisionMatrix: DecisionMatrix = {
			rows: decisionRows,
			maxValues: raw.decisionMatrix?.maxValues ?? {
				c1: maxC1 || 1,
				c2: maxC2 || 1,
				c3: maxC3 || 1,
				c4: maxC4 || 1
			}
		};

		// 3. Normalized Matrix rows
		let normalizedRows: NormalizedMatrixRow[] = [];
		if (raw.normalizedMatrix?.rows && Array.isArray(raw.normalizedMatrix.rows)) {
			normalizedRows = raw.normalizedMatrix.rows;
		} else if (Array.isArray(raw.rankings)) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			normalizedRows = raw.rankings.map((item: any) => {
				const prodId = item.productId ?? item.candidateProductId ?? '';
				const norm = raw.matrixNormalized?.[prodId];
				return {
					productId: prodId,
					productName: item.productName ?? '',
					r1:
						norm?.c1 ??
						(decisionMatrix.maxValues.c1 > 0
							? Number(((item.c1Raw ?? item.requestCount ?? 0) / decisionMatrix.maxValues.c1).toFixed(4))
							: 0),
					r2:
						norm?.c2 ??
						(decisionMatrix.maxValues.c2 > 0
							? Number(((item.c2Raw ?? item.uniqueRequester ?? 0) / decisionMatrix.maxValues.c2).toFixed(4))
							: 0),
					r3:
						norm?.c3 ??
						(decisionMatrix.maxValues.c3 > 0
							? Number(((item.c3Raw ?? item.averageRequestLikes ?? 0) / decisionMatrix.maxValues.c3).toFixed(4))
							: 0),
					r4:
						norm?.c4 ??
						(decisionMatrix.maxValues.c4 > 0
							? Number(((item.c4Raw ?? item.recentRequestRatio ?? 0) / decisionMatrix.maxValues.c4).toFixed(4))
							: 0)
				};
			});
		}

		const normalizedMatrix: NormalizedMatrix = {
			rows: normalizedRows
		};

		// 4. Weighted Matrix rows
		let weightedRows: WeightedMatrixRow[] = [];
		if (raw.weightedMatrix?.rows && Array.isArray(raw.weightedMatrix.rows)) {
			weightedRows = raw.weightedMatrix.rows;
		} else if (Array.isArray(raw.rankings)) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			weightedRows = raw.rankings.map((item: any) => {
				const prodId = item.productId ?? item.candidateProductId ?? '';
				const weighted = raw.matrixWeighted?.[prodId];
				const normRow = normalizedRows.find((n) => n.productId === prodId);
				const w1 = weighted?.c1 ?? Number(((normRow?.r1 ?? 0) * criteriaWeights.C1).toFixed(4));
				const w2 = weighted?.c2 ?? Number(((normRow?.r2 ?? 0) * criteriaWeights.C2).toFixed(4));
				const w3 = weighted?.c3 ?? Number(((normRow?.r3 ?? 0) * criteriaWeights.C3).toFixed(4));
				const w4 = weighted?.c4 ?? Number(((normRow?.r4 ?? 0) * criteriaWeights.C4).toFixed(4));
				const preferenceValue = item.preferenceValue ?? Number((w1 + w2 + w3 + w4).toFixed(4));

				return {
					productId: prodId,
					productName: item.productName ?? '',
					w1,
					w2,
					w3,
					w4,
					preferenceValue
				};
			});
		}

		const weightedMatrix: WeightedMatrix = {
			rows: weightedRows
		};

		// 5. Rankings list
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const rankings: RankingResult[] = (raw.rankings || []).map((item: any, idx: number) => {
			const prodId = item.productId ?? item.candidateProductId ?? '';
			const decRow = decisionRows.find((d) => d.productId === prodId);
			const normRow = normalizedRows.find((n) => n.productId === prodId);

			const requestCount = item.requestCount ?? item.c1Raw ?? decRow?.c1RequestCount ?? 0;
			const uniqueRequester = item.uniqueRequester ?? item.c2Raw ?? decRow?.c2UniqueRequester ?? 0;
			const averageRequestLikes = item.averageRequestLikes ?? item.c3Raw ?? decRow?.c3AverageRequestLikes ?? 0;
			const recentRequestRatio = item.recentRequestRatio ?? item.c4Raw ?? decRow?.c4RecentRequestRatio ?? 0;

			return {
				id: item.id ?? `rank-${raw.analysisProjectId}-${prodId}`,
				analysisProjectId: item.analysisProjectId ?? raw.analysisProjectId,
				productId: prodId,
				productName: item.productName ?? '',
				requestCount,
				uniqueRequester,
				averageRequestLikes,
				recentRequestRatio,
				normalizedRequestCount: item.normalizedRequestCount ?? normRow?.r1 ?? 0,
				normalizedUniqueRequester: item.normalizedUniqueRequester ?? normRow?.r2 ?? 0,
				normalizedAverageLikes: item.normalizedAverageLikes ?? normRow?.r3 ?? 0,
				normalizedRecentRequestRatio: item.normalizedRecentRequestRatio ?? normRow?.r4 ?? 0,
				preferenceValue: item.preferenceValue ?? 0,
				finalScore: item.preferenceValue ?? 0,
				rank: item.rank ?? idx + 1,
				calculatedAt: item.calculatedAt ?? raw.calculatedAt ?? new Date().toISOString()
			};
		});

		return {
			analysisProjectId: raw.analysisProjectId,
			calculatedAt: raw.calculatedAt ?? new Date().toISOString(),
			rankings,
			decisionMatrix,
			normalizedMatrix,
			weightedMatrix,
			criteriaWeights,
			c4Config: raw.c4Config ?? {
				daysWindow: 30,
				anchorType: 'max_comment',
				customAnchorDate: null
			}
		};
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
