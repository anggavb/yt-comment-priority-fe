import type { ApiClient } from './adapter';
import { MockApiClient, mockApiClient } from './mockClient';
import { HttpApiClient, httpApiClient } from './httpClient';
import type {
	AddVideoDto,
	AnalysisProject,
	ApiConnectionState,
	BackendHealth,
	CandidateProduct,
	Comment,
	CommentFilterDto,
	CommentMatch,
	ConnectionMode,
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

const STORAGE_KEY = 'yt_priority_api_mode';

class ConnectionStateStore {
	private _mode: ConnectionMode = 'mock';
	private _health: BackendHealth = {
		status: 'checking',
		url: 'http://localhost:3000',
		lastChecked: undefined
	};
	private _fallbackActive: boolean = false;
	private _lastError: string | null = null;
	private _listeners: Array<(state: ApiConnectionState) => void> = [];

	constructor() {
		// 1. Check environment variable PUBLIC_ENABLE_MOCK
		const envMock = import.meta.env?.PUBLIC_ENABLE_MOCK;
		if (envMock === 'false') {
			this._mode = 'live';
		} else {
			this._mode = 'mock';
		}

		// 2. User preference in browser localStorage overrides default
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved === 'mock' || saved === 'live') {
				this._mode = saved;
			}
		}
	}

	get state(): ApiConnectionState {
		return {
			mode: this._mode,
			health: this._health,
			fallbackActive: this._fallbackActive,
			lastError: this._lastError
		};
	}

	subscribe(fn: (state: ApiConnectionState) => void): () => void {
		this._listeners.push(fn);
		fn(this.state);
		return () => {
			this._listeners = this._listeners.filter((l) => l !== fn);
		};
	}

	private notify() {
		const currentState = this.state;
		for (const listener of this._listeners) {
			listener(currentState);
		}
	}

	setMode(mode: ConnectionMode) {
		this._mode = mode;
		this._fallbackActive = false;
		this._lastError = null;
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, mode);
		}
		this.notify();
	}

	setHealth(health: BackendHealth) {
		this._health = health;
		this.notify();
	}

	setFallback(active: boolean, error?: string) {
		this._fallbackActive = active;
		if (error) this._lastError = error;
		this.notify();
	}

	clearError() {
		this._lastError = null;
		this.notify();
	}
}

export const connectionStore = new ConnectionStateStore();

export class DualModeApiClient implements ApiClient {
	private mock: MockApiClient;
	private http: HttpApiClient;

	constructor(mock: MockApiClient = mockApiClient, http: HttpApiClient = httpApiClient) {
		this.mock = mock;
		this.http = http;
	}

	get mode(): ConnectionMode {
		return connectionStore.state.mode;
	}

	setMode(mode: ConnectionMode) {
		connectionStore.setMode(mode);
	}

	async checkBackendHealth(): Promise<BackendHealth> {
		connectionStore.setHealth({
			status: 'checking',
			url: this.http.getBaseUrl(),
			lastChecked: new Date().toISOString()
		});

		const health = await this.http.checkBackendHealth();
		connectionStore.setHealth(health);
		return health;
	}

	private async execute<T>(
		actionName: string,
		mockAction: () => Promise<T>,
		httpAction: () => Promise<T>
	): Promise<T> {
		const currentMode = this.mode;

		if (currentMode === 'mock') {
			return mockAction();
		}

		// 'live' mode: try http first with seamless fallback
		try {
			const result = await httpAction();
			connectionStore.setFallback(false);
			connectionStore.setHealth({
				status: 'online',
				url: this.http.getBaseUrl(),
				lastChecked: new Date().toISOString()
			});
			return result;
		} catch (err: unknown) {
			const errMsg = err instanceof Error ? err.message : String(err);
			console.warn(`[DualModeApiClient] Live API request failed for ${actionName}: ${errMsg}. Falling back to mock data.`);

			connectionStore.setFallback(true, errMsg);
			connectionStore.setHealth({
				status: 'offline',
				url: this.http.getBaseUrl(),
				lastChecked: new Date().toISOString()
			});

			return mockAction();
		}
	}

	// Projects
	async getProjects(): Promise<AnalysisProject[]> {
		return this.execute('getProjects', () => this.mock.getProjects(), () => this.http.getProjects());
	}

	async getProject(id: string): Promise<AnalysisProject | null> {
		return this.execute('getProject', () => this.mock.getProject(id), () => this.http.getProject(id));
	}

	async createProject(dto: CreateProjectDto): Promise<AnalysisProject> {
		return this.execute('createProject', () => this.mock.createProject(dto), () => this.http.createProject(dto));
	}

	async updateProject(id: string, dto: UpdateProjectDto): Promise<AnalysisProject | null> {
		return this.execute('updateProject', () => this.mock.updateProject(id, dto), () => this.http.updateProject(id, dto));
	}

	async deleteProject(id: string): Promise<boolean> {
		return this.execute('deleteProject', () => this.mock.deleteProject(id), () => this.http.deleteProject(id));
	}

	// Videos
	async getVideos(projectId: string): Promise<YouTubeVideo[]> {
		return this.execute('getVideos', () => this.mock.getVideos(projectId), () => this.http.getVideos(projectId));
	}

	async addVideo(projectId: string, dto: AddVideoDto): Promise<YouTubeVideo> {
		return this.execute('addVideo', () => this.mock.addVideo(projectId, dto), () => this.http.addVideo(projectId, dto));
	}

	async deleteVideo(id: string): Promise<boolean> {
		return this.execute('deleteVideo', () => this.mock.deleteVideo(id), () => this.http.deleteVideo(id));
	}

	async fetchComments(videoId: string, options?: FetchCommentsOptions): Promise<YouTubeVideo | null> {
		return this.execute('fetchComments', () => this.mock.fetchComments(videoId, options), () => this.http.fetchComments(videoId, options));
	}

	// Products
	async getProducts(projectId: string): Promise<CandidateProduct[]> {
		return this.execute('getProducts', () => this.mock.getProducts(projectId), () => this.http.getProducts(projectId));
	}

	async createProduct(projectId: string, dto: CreateProductDto): Promise<CandidateProduct> {
		return this.execute('createProduct', () => this.mock.createProduct(projectId, dto), () => this.http.createProduct(projectId, dto));
	}

	async updateProduct(id: string, dto: UpdateProductDto): Promise<CandidateProduct | null> {
		return this.execute('updateProduct', () => this.mock.updateProduct(id, dto), () => this.http.updateProduct(id, dto));
	}

	async deleteProduct(id: string): Promise<boolean> {
		return this.execute('deleteProduct', () => this.mock.deleteProduct(id), () => this.http.deleteProduct(id));
	}

	// Keywords
	async addProductKeyword(productId: string, keyword: string): Promise<ProductKeyword | null> {
		return this.execute('addProductKeyword', () => this.mock.addProductKeyword(productId, keyword), () => this.http.addProductKeyword(productId, keyword));
	}

	async deleteProductKeyword(keywordId: string): Promise<boolean> {
		return this.execute('deleteProductKeyword', () => this.mock.deleteProductKeyword(keywordId), () => this.http.deleteProductKeyword(keywordId));
	}

	async getRequestKeywords(): Promise<RequestKeyword[]> {
		return this.execute('getRequestKeywords', () => this.mock.getRequestKeywords(), () => this.http.getRequestKeywords());
	}

	async createRequestKeyword(keyword: string): Promise<RequestKeyword | null> {
		return this.execute('createRequestKeyword', () => this.mock.createRequestKeyword(keyword), () => this.http.createRequestKeyword(keyword));
	}

	async deleteRequestKeyword(id: string): Promise<boolean> {
		return this.execute('deleteRequestKeyword', () => this.mock.deleteRequestKeyword(id), () => this.http.deleteRequestKeyword(id));
	}

	// Comments
	async processComments(projectId: string): Promise<ProcessCommentsResult> {
		return this.execute('processComments', () => this.mock.processComments(projectId), () => this.http.processComments(projectId));
	}

	async getComments(
		projectId: string,
		filter?: CommentFilterDto
	): Promise<PaginatedResponse<Comment & { matches?: CommentMatch[] }>> {
		return this.execute('getComments', () => this.mock.getComments(projectId, filter), () => this.http.getComments(projectId, filter));
	}

	async getCommentMatches(projectId: string): Promise<CommentMatch[]> {
		return this.execute('getCommentMatches', () => this.mock.getCommentMatches(projectId), () => this.http.getCommentMatches(projectId));
	}

	// Criteria
	async getCriteria(projectId: string): Promise<{ criteria: Criteria[]; c4Config: C4TimeAnchorConfig }> {
		return this.execute('getCriteria', () => this.mock.getCriteria(projectId), () => this.http.getCriteria(projectId));
	}

	async updateCriteria(
		projectId: string,
		dto: UpdateCriteriaDto
	): Promise<{ criteria: Criteria[]; c4Config: C4TimeAnchorConfig }> {
		return this.execute('updateCriteria', () => this.mock.updateCriteria(projectId, dto), () => this.http.updateCriteria(projectId, dto));
	}

	// Rankings
	async calculateRanking(projectId: string): Promise<RankingLeaderboard> {
		return this.execute('calculateRanking', () => this.mock.calculateRanking(projectId), () => this.http.calculateRanking(projectId));
	}

	async getRankings(projectId: string): Promise<RankingLeaderboard | null> {
		return this.execute('getRankings', () => this.mock.getRankings(projectId), () => this.http.getRankings(projectId));
	}
}

export const apiClient = new DualModeApiClient();
