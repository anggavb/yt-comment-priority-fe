import type {
	CommentAuditSummary,
	CriteriaCode,
	C4TimeAnchorConfig
} from './domain';

export type ConnectionMode = 'mock' | 'live';
export type BackendStatus = 'online' | 'offline' | 'checking';

export interface BackendHealth {
	status: BackendStatus;
	latencyMs?: number;
	url: string;
	lastChecked?: string;
}

export interface ApiConnectionState {
	mode: ConnectionMode;
	health: BackendHealth;
	fallbackActive: boolean;
	lastError?: string | null;
}

export interface ApiResponse<T> {
	success: boolean;
	data: T;
	message?: string;
}

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface CommentFilterDto {
	productId?: string;
	isMention?: boolean;
	isRequest?: boolean;
	search?: string;
	page?: number;
	limit?: number;
}

export interface CreateProjectDto {
	name: string;
	description?: string;
}

export interface UpdateProjectDto {
	name?: string;
	description?: string;
}

export interface AddVideoDto {
	url: string;
	maxComments?: number;
}

export interface FetchCommentsOptions {
	maxComments?: number;
}

export interface CreateProductDto {
	name: string;
	description?: string;
	keywords?: string[];
}

export interface UpdateProductDto {
	name?: string;
	description?: string;
}

export interface AddProductKeywordDto {
	keyword: string;
}

export interface CreateRequestKeywordDto {
	keyword: string;
}

export interface UpdateCriteriaItemDto {
	code: CriteriaCode;
	weight: number;
}

export interface UpdateCriteriaDto {
	criteria: UpdateCriteriaItemDto[];
	c4Config?: C4TimeAnchorConfig;
}

export interface OEmbedPreview {
	title: string;
	authorName: string;
	authorUrl?: string;
	thumbnailUrl: string;
	videoId: string;
}

export interface ProcessCommentsResult {
	processedCount: number;
	matchesFound: number;
	summary: CommentAuditSummary;
}
