/**
 * YouTube Review Priority System - Domain Types
 * Matching domain definitions in CONTEXT.md and ADRs 0001-0004.
 */

export interface AnalysisProject {
	id: string;
	name: string;
	description: string;
	createdAt: string;
	updatedAt: string;
	// Summary statistics
	videoCount?: number;
	productCount?: number;
	commentCount?: number;
	processedCommentCount?: number;
	status?: 'draft' | 'ready' | 'processed' | 'ranked';
}

export interface YouTubeChannel {
	id: string;
	channelId: string;
	title: string;
	description?: string;
	customUrl?: string;
	thumbnailUrl?: string;
}

export type VideoFetchStatus = 'PENDING' | 'FETCHING' | 'COMPLETED' | 'FAILED';

export interface YouTubeVideo {
	id: string;
	analysisProjectId: string;
	youtubeVideoId: string;
	url: string;
	title: string;
	channelTitle?: string;
	thumbnailUrl?: string;
	publishedAt: string;
	fetchedAt: string | null;
	commentCount?: number;
	maxComments?: number;
	fetchStatus?: VideoFetchStatus;
	createdAt: string;
}

export interface Comment {
	id: string;
	youtubeVideoId: string;
	youtubeCommentId: string;
	authorChannelId: string;
	authorName: string;
	authorProfileImageUrl?: string;
	text: string;
	likeCount: number;
	publishedAt: string;
	updatedAt?: string;
	createdAt: string;
}

export interface ProductKeyword {
	id: string;
	productId: string;
	keyword: string;
	createdAt: string;
}

export interface CandidateProduct {
	id: string;
	analysisProjectId: string;
	name: string;
	description?: string;
	keywords: ProductKeyword[];
	createdAt: string;
	updatedAt: string;
}

export interface RequestKeyword {
	id: string;
	keyword: string;
	createdAt: string;
}

export interface CommentMatch {
	id: string;
	commentId: string;
	productId: string;
	matchedProductKeyword: string;
	matchedRequestKeyword: string | null;
	isMention: boolean;
	isRequest: boolean;
	createdAt: string;
	// Optional joined relation fields for UI convenience
	comment?: Comment;
	product?: CandidateProduct;
}

export type CommentAuditStatus = 'all' | 'mention' | 'request' | 'unmatched';

export type CommentWithMatches = Comment & {
	matches?: CommentMatch[];
};

export type CriteriaCode = 'C1' | 'C2' | 'C3' | 'C4';
export type CriteriaAttribute = 'benefit' | 'cost';

export interface Criteria {
	id: string;
	analysisProjectId: string;
	code: CriteriaCode;
	name: string;
	weight: number; // 0.0 to 1.0 (or percentage representation)
	attribute: CriteriaAttribute;
	createdAt: string;
	updatedAt: string;
}

/**
 * ADR-0001: C4 Recent Request Ratio Time Anchor configuration
 */
export interface C4TimeAnchorConfig {
	daysWindow: number; // default: 30 days
	anchorType: 'max_comment' | 'custom';
	customAnchorDate?: string | null;
}

export interface DecisionMatrixRow {
	productId: string;
	productName: string;
	c1RequestCount: number;
	c2UniqueRequester: number;
	c3AverageRequestLikes: number;
	c4RecentRequestRatio: number;
}

export interface DecisionMatrix {
	rows: DecisionMatrixRow[];
	maxValues: {
		c1: number;
		c2: number;
		c3: number;
		c4: number;
	};
}

export interface NormalizedMatrixRow {
	productId: string;
	productName: string;
	r1: number;
	r2: number;
	r3: number;
	r4: number;
}

export interface NormalizedMatrix {
	rows: NormalizedMatrixRow[];
}

export interface WeightedMatrixRow {
	productId: string;
	productName: string;
	w1: number;
	w2: number;
	w3: number;
	w4: number;
	preferenceValue: number; // Vi = sum of weighted scores
}

export interface WeightedMatrix {
	rows: WeightedMatrixRow[];
}

export interface RankingResult {
	id: string;
	analysisProjectId: string;
	productId: string;
	productName: string;
	requestCount: number;
	uniqueRequester: number;
	averageRequestLikes: number;
	recentRequestRatio: number;
	normalizedRequestCount: number;
	normalizedUniqueRequester: number;
	normalizedAverageLikes: number;
	normalizedRecentRequestRatio: number;
	preferenceValue: number; // Preference Value Vi (CONTEXT.md)
	/** @deprecated Use preferenceValue */
	finalScore?: number;
	rank: number;
	calculatedAt: string;
}

export interface RankingLeaderboard {
	analysisProjectId: string;
	calculatedAt: string;
	rankings: RankingResult[];
	decisionMatrix: DecisionMatrix;
	normalizedMatrix: NormalizedMatrix;
	weightedMatrix: WeightedMatrix;
	criteriaWeights: Record<CriteriaCode, number>;
	c4Config: C4TimeAnchorConfig;
}

/**
 * Comment Audit Summary (for FR-10 and Issue #5)
 */
export interface CommentAuditSummary {
	totalComments: number;
	matchedComments: number;
	requestComments: number;
	unmatchedComments: number;
}
