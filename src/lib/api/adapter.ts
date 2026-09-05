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

export interface ApiClient {
	// Projects
	getProjects(): Promise<AnalysisProject[]>;
	getProject(id: string): Promise<AnalysisProject | null>;
	createProject(dto: CreateProjectDto): Promise<AnalysisProject>;
	updateProject(id: string, dto: UpdateProjectDto): Promise<AnalysisProject | null>;
	deleteProject(id: string): Promise<boolean>;

	// Videos
	getVideos(projectId: string): Promise<YouTubeVideo[]>;
	addVideo(projectId: string, dto: AddVideoDto): Promise<YouTubeVideo>;
	deleteVideo(id: string): Promise<boolean>;
	fetchComments(videoId: string, options?: FetchCommentsOptions): Promise<YouTubeVideo | null>;

	// Products
	getProducts(projectId: string): Promise<CandidateProduct[]>;
	createProduct(projectId: string, dto: CreateProductDto): Promise<CandidateProduct>;
	updateProduct(id: string, dto: UpdateProductDto): Promise<CandidateProduct | null>;
	deleteProduct(id: string): Promise<boolean>;

	// Keywords
	addProductKeyword(productId: string, keyword: string): Promise<ProductKeyword | null>;
	deleteProductKeyword(keywordId: string): Promise<boolean>;
	getRequestKeywords(): Promise<RequestKeyword[]>;
	createRequestKeyword(keyword: string): Promise<RequestKeyword | null>;
	deleteRequestKeyword(id: string): Promise<boolean>;

	// Comments & Processing
	processComments(projectId: string): Promise<ProcessCommentsResult>;
	getComments(
		projectId: string,
		filter?: CommentFilterDto
	): Promise<PaginatedResponse<Comment & { matches?: CommentMatch[] }>>;
	getCommentMatches(projectId: string): Promise<CommentMatch[]>;

	// Criteria & C4
	getCriteria(projectId: string): Promise<{ criteria: Criteria[]; c4Config: C4TimeAnchorConfig }>;
	updateCriteria(
		projectId: string,
		dto: UpdateCriteriaDto
	): Promise<{ criteria: Criteria[]; c4Config: C4TimeAnchorConfig }>;

	// SAW Rankings
	calculateRanking(projectId: string): Promise<RankingLeaderboard>;
	getRankings(projectId: string): Promise<RankingLeaderboard | null>;

	// Health Check
	checkBackendHealth(): Promise<BackendHealth>;
}
