import type {
	AnalysisProject,
	CandidateProduct,
	Comment,
	CommentAuditSummary,
	CommentFilterDto,
	CommentMatch,
	Criteria,
	CriteriaCode,
	C4TimeAnchorConfig,
	DecisionMatrix,
	DecisionMatrixRow,
	NormalizedMatrix,
	NormalizedMatrixRow,
	PaginatedResponse,
	ProductKeyword,
	RankingLeaderboard,
	RankingResult,
	RequestKeyword,
	WeightedMatrix,
	WeightedMatrixRow,
	YouTubeVideo,
	CreateProjectDto,
	UpdateProjectDto,
	AddVideoDto,
	CreateProductDto,
	UpdateProductDto,
	UpdateCriteriaDto
} from '$lib/types';
import {
	initialC4Config,
	initialComments,
	initialCriteria,
	initialProducts,
	initialProjects,
	initialRequestKeywords,
	initialVideos
} from './data';
import {
	extractYouTubeVideoId,
	toCanonicalWatchUrl,
	getYouTubeThumbnail
} from '$lib/utils/youtube';

function clone<T>(val: T): T {
	return JSON.parse(JSON.stringify(val));
}

function escapeRegex(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Text Preprocessing per FR-07 and ADR-0004
 */
export function preprocessText(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\w\s]/g, ' ') // replace punctuation with space
		.replace(/\s+/g, ' ') // collapse multiple whitespaces
		.trim();
}

/**
 * Word boundary keyword matching per ADR-0004
 */
export function containsWordBoundaryKeyword(cleanText: string, keyword: string): boolean {
	const cleanKw = preprocessText(keyword);
	if (!cleanKw) return false;
	const regex = new RegExp(`\\b${escapeRegex(cleanKw)}\\b`, 'i');
	return regex.test(cleanText);
}

export class MockService {
	private projects: AnalysisProject[] = clone(initialProjects);
	private videos: YouTubeVideo[] = clone(initialVideos);
	private products: CandidateProduct[] = clone(initialProducts);
	private requestKeywords: RequestKeyword[] = clone(initialRequestKeywords);
	private criteria: Criteria[] = clone(initialCriteria);
	private comments: Comment[] = clone(initialComments);
	private commentMatches: CommentMatch[] = [];
	private c4Configs: Map<string, C4TimeAnchorConfig> = new Map();
	private rankingsMap: Map<string, RankingLeaderboard> = new Map();

	constructor() {
		// Set default C4 config for default project
		this.c4Configs.set('proj-desk-setup-2026', clone(initialC4Config));
		// Process comments initially so default project has complete state
		this.processComments('proj-desk-setup-2026');
		this.calculateRanking('proj-desk-setup-2026');
	}

	private getProjectComments(projectId: string): Comment[] {
		const projectVideos = this.videos.filter((v) => v.analysisProjectId === projectId);
		const videoIds = new Set(projectVideos.map((v) => v.id));
		return this.comments.filter((c) => videoIds.has(c.youtubeVideoId));
	}

	// ================= PROJECTS =================
	async getProjects(): Promise<AnalysisProject[]> {
		return clone(this.projects);
	}

	async getProject(id: string): Promise<AnalysisProject | null> {
		const project = this.projects.find((p) => p.id === id);
		return project ? clone(project) : null;
	}

	async createProject(dto: CreateProjectDto): Promise<AnalysisProject> {
		const newProject: AnalysisProject = {
			id: `proj-${Date.now()}`,
			name: dto.name,
			description: dto.description || '',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			videoCount: 0,
			productCount: 0,
			commentCount: 0,
			processedCommentCount: 0,
			status: 'draft'
		};
		this.projects.push(newProject);

		// Initialize default criteria for new project
		const defaultCriteria: Criteria[] = [
			{ id: `crit-${Date.now()}-1`, analysisProjectId: newProject.id, code: 'C1', name: 'Request Count', weight: 0.4, attribute: 'benefit', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
			{ id: `crit-${Date.now()}-2`, analysisProjectId: newProject.id, code: 'C2', name: 'Unique Requester', weight: 0.25, attribute: 'benefit', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
			{ id: `crit-${Date.now()}-3`, analysisProjectId: newProject.id, code: 'C3', name: 'Average Request Likes', weight: 0.2, attribute: 'benefit', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
			{ id: `crit-${Date.now()}-4`, analysisProjectId: newProject.id, code: 'C4', name: 'Recent Request Ratio', weight: 0.15, attribute: 'benefit', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
		];
		this.criteria.push(...defaultCriteria);
		this.c4Configs.set(newProject.id, clone(initialC4Config));

		return clone(newProject);
	}

	async updateProject(id: string, dto: UpdateProjectDto): Promise<AnalysisProject | null> {
		const project = this.projects.find((p) => p.id === id);
		if (!project) return null;
		if (dto.name !== undefined) project.name = dto.name;
		if (dto.description !== undefined) project.description = dto.description;
		project.updatedAt = new Date().toISOString();
		return clone(project);
	}

	async deleteProject(id: string): Promise<boolean> {
		const idx = this.projects.findIndex((p) => p.id === id);
		if (idx === -1) return false;
		this.projects.splice(idx, 1);
		this.videos = this.videos.filter((v) => v.analysisProjectId !== id);
		this.products = this.products.filter((p) => p.analysisProjectId !== id);
		this.criteria = this.criteria.filter((c) => c.analysisProjectId !== id);
		this.rankingsMap.delete(id);
		this.c4Configs.delete(id);
		return true;
	}

	// ================= VIDEOS =================
	async getVideos(projectId: string): Promise<YouTubeVideo[]> {
		return clone(this.videos.filter((v) => v.analysisProjectId === projectId));
	}

	async addVideo(projectId: string, dto: AddVideoDto): Promise<YouTubeVideo> {
		// Extract video ID from URL or bare ID
		const videoId = extractYouTubeVideoId(dto.url) || 'dQw4w9WgXcQ';
		const canonicalUrl = dto.url.includes('http') ? dto.url : toCanonicalWatchUrl(videoId);

		const newVideo: YouTubeVideo = {
			id: `vid-${Date.now()}`,
			analysisProjectId: projectId,
			youtubeVideoId: videoId,
			url: canonicalUrl,
			title: dto.title || `YouTube Video (${videoId})`,
			channelTitle: dto.channelTitle || 'YouTube Creator',
			thumbnailUrl: dto.thumbnailUrl || getYouTubeThumbnail(videoId, 'hq'),
			publishedAt: new Date().toISOString(),
			fetchedAt: null,
			commentCount: 0,
			maxComments: dto.maxComments || 500,
			fetchStatus: 'PENDING',
			createdAt: new Date().toISOString()
		};
		this.videos.push(newVideo);

		// Update project count
		const project = this.projects.find((p) => p.id === projectId);
		if (project) {
			project.videoCount = this.videos.filter((v) => v.analysisProjectId === projectId).length;
			project.updatedAt = new Date().toISOString();
		}

		return clone(newVideo);
	}

	async deleteVideo(id: string): Promise<boolean> {
		const idx = this.videos.findIndex((v) => v.id === id);
		if (idx === -1) return false;
		const [deleted] = this.videos.splice(idx, 1);
		this.comments = this.comments.filter((c) => c.youtubeVideoId !== id);

		const project = this.projects.find((p) => p.id === deleted.analysisProjectId);
		if (project) {
			project.videoCount = this.videos.filter((v) => v.analysisProjectId === project.id).length;
			project.commentCount = this.comments.filter((c) =>
				this.videos.some((v) => v.analysisProjectId === project.id && v.id === c.youtubeVideoId)
			).length;
			project.updatedAt = new Date().toISOString();
		}
		return true;
	}

	async fetchComments(videoId: string, options?: { maxComments?: number }): Promise<YouTubeVideo | null> {
		const video = this.videos.find((v) => v.id === videoId);
		if (!video) return null;

		const limit = options?.maxComments ?? video.maxComments ?? 500;
		video.maxComments = limit;
		video.fetchStatus = 'FETCHING';

		// Simulate background processing delay so polling observes FETCHING state
		await new Promise((r) => setTimeout(r, 600));

		// Remove previous comments for this video if refetching
		this.comments = this.comments.filter((c) => c.youtubeVideoId !== videoId);

		const generated: Comment[] = [];
		for (let i = 0; i < limit; i++) {
			const sample = initialComments[i % initialComments.length];
			generated.push({
				...clone(sample),
				id: `cmt-${videoId}-${i}`,
				youtubeVideoId: videoId,
				youtubeCommentId: `yt-cmt-${videoId}-${i}`,
				text: i < initialComments.length ? sample.text : `${sample.text} (#${i + 1})`
			});
		}
		this.comments.push(...generated);

		video.fetchStatus = 'COMPLETED';
		video.fetchedAt = new Date().toISOString();
		video.commentCount = limit;

		const project = this.projects.find((p) => p.id === video.analysisProjectId);
		if (project) {
			project.commentCount = this.comments.filter((c) =>
				this.videos.some((v) => v.analysisProjectId === project.id && v.id === c.youtubeVideoId)
			).length;
			project.status = 'ready';
			project.updatedAt = new Date().toISOString();
		}

		return clone(video);
	}

	// ================= PRODUCTS =================
	async getProducts(projectId: string): Promise<CandidateProduct[]> {
		return clone(this.products.filter((p) => p.analysisProjectId === projectId));
	}

	async createProduct(projectId: string, dto: CreateProductDto): Promise<CandidateProduct> {
		const prodId = `prod-${Date.now()}`;
		const keywords: ProductKeyword[] = (dto.keywords || [dto.name]).map((kw, i) => ({
			id: `kw-${Date.now()}-${i}`,
			productId: prodId,
			keyword: kw.trim().toLowerCase(),
			createdAt: new Date().toISOString()
		}));

		const newProduct: CandidateProduct = {
			id: prodId,
			analysisProjectId: projectId,
			name: dto.name,
			description: dto.description || '',
			keywords,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
		this.products.push(newProduct);

		const project = this.projects.find((p) => p.id === projectId);
		if (project) {
			project.productCount = this.products.filter((p) => p.analysisProjectId === projectId).length;
			project.updatedAt = new Date().toISOString();
		}

		return clone(newProduct);
	}

	async updateProduct(id: string, dto: UpdateProductDto): Promise<CandidateProduct | null> {
		const product = this.products.find((p) => p.id === id);
		if (!product) return null;
		if (dto.name !== undefined) product.name = dto.name;
		if (dto.description !== undefined) product.description = dto.description;
		product.updatedAt = new Date().toISOString();
		return clone(product);
	}

	async deleteProduct(id: string): Promise<boolean> {
		const idx = this.products.findIndex((p) => p.id === id);
		if (idx === -1) return false;
		const [deleted] = this.products.splice(idx, 1);
		this.commentMatches = this.commentMatches.filter((m) => m.productId !== id);

		const project = this.projects.find((p) => p.id === deleted.analysisProjectId);
		if (project) {
			project.productCount = this.products.filter((p) => p.analysisProjectId === project.id).length;
			project.updatedAt = new Date().toISOString();
		}
		return true;
	}

	// ================= KEYWORDS =================
	async addProductKeyword(productId: string, keyword: string): Promise<ProductKeyword | null> {
		const product = this.products.find((p) => p.id === productId);
		if (!product) return null;
		const clean = keyword.trim().toLowerCase();
		if (!clean) return null;

		const existing = product.keywords.find((k) => k.keyword.toLowerCase() === clean);
		if (existing) return clone(existing);

		const newKeyword: ProductKeyword = {
			id: `kw-${Date.now()}`,
			productId,
			keyword: clean,
			createdAt: new Date().toISOString()
		};
		product.keywords.push(newKeyword);
		product.updatedAt = new Date().toISOString();
		return clone(newKeyword);
	}

	async deleteProductKeyword(keywordId: string): Promise<boolean> {
		for (const product of this.products) {
			const idx = product.keywords.findIndex((k) => k.id === keywordId);
			if (idx !== -1) {
				product.keywords.splice(idx, 1);
				product.updatedAt = new Date().toISOString();
				return true;
			}
		}
		return false;
	}

	async getRequestKeywords(): Promise<RequestKeyword[]> {
		return clone(this.requestKeywords);
	}

	async createRequestKeyword(keyword: string): Promise<RequestKeyword | null> {
		const clean = keyword.trim().toLowerCase();
		if (!clean) return null;
		const existing = this.requestKeywords.find((k) => k.keyword.toLowerCase() === clean);
		if (existing) return clone(existing);

		const newKw: RequestKeyword = {
			id: `req-${Date.now()}`,
			keyword: clean,
			createdAt: new Date().toISOString()
		};
		this.requestKeywords.push(newKw);
		return clone(newKw);
	}

	async deleteRequestKeyword(id: string): Promise<boolean> {
		const idx = this.requestKeywords.findIndex((k) => k.id === id);
		if (idx === -1) return false;
		this.requestKeywords.splice(idx, 1);
		return true;
	}

	// ================= COMMENT PROCESSING (ADR-0004) =================
	async processComments(projectId: string): Promise<{
		processedCount: number;
		matchesFound: number;
		summary: CommentAuditSummary;
	}> {
		const projectComments = this.getProjectComments(projectId);
		const projectProducts = this.products.filter((p) => p.analysisProjectId === projectId);

		// Remove existing matches for this project's products
		const projectProductIds = new Set(projectProducts.map((p) => p.id));
		this.commentMatches = this.commentMatches.filter((m) => !projectProductIds.has(m.productId));

		const newMatches: CommentMatch[] = [];
		const matchedCommentIds = new Set<string>();
		const requestCommentIds = new Set<string>();

		for (const comment of projectComments) {
			const cleanText = preprocessText(comment.text);

			// Check each product
			for (const product of projectProducts) {
				let matchedProductKw: string | null = null;
				for (const kwObj of product.keywords) {
					if (containsWordBoundaryKeyword(cleanText, kwObj.keyword)) {
						matchedProductKw = kwObj.keyword;
						break;
					}
				}

				if (matchedProductKw) {
					// Check request keyword
					let matchedReqKw: string | null = null;
					for (const reqKw of this.requestKeywords) {
						if (containsWordBoundaryKeyword(cleanText, reqKw.keyword)) {
							matchedReqKw = reqKw.keyword;
							break;
						}
					}

					const isRequest = matchedReqKw !== null;
					matchedCommentIds.add(comment.id);
					if (isRequest) {
						requestCommentIds.add(comment.id);
					}

					const matchRecord: CommentMatch = {
						id: `match-${Date.now()}-${newMatches.length}`,
						commentId: comment.id,
						productId: product.id,
						matchedProductKeyword: matchedProductKw,
						matchedRequestKeyword: matchedReqKw,
						isMention: true,
						isRequest,
						createdAt: new Date().toISOString(),
						comment: clone(comment),
						product: clone(product)
					};
					newMatches.push(matchRecord);
				}
			}
		}

		this.commentMatches.push(...newMatches);

		const summary: CommentAuditSummary = {
			totalComments: projectComments.length,
			matchedComments: matchedCommentIds.size,
			requestComments: requestCommentIds.size,
			unmatchedComments: projectComments.length - matchedCommentIds.size
		};

		const project = this.projects.find((p) => p.id === projectId);
		if (project) {
			project.processedCommentCount = projectComments.length;
			project.status = 'processed';
			project.updatedAt = new Date().toISOString();
		}

		return {
			processedCount: projectComments.length,
			matchesFound: newMatches.length,
			summary
		};
	}

	async getComments(
		projectId: string,
		filter?: CommentFilterDto
	): Promise<PaginatedResponse<Comment & { matches?: CommentMatch[] }>> {
		const result = this.getProjectComments(projectId);

		// Attach matches
		const commentsWithMatches = result.map((c) => {
			const matches = this.commentMatches.filter((m) => m.commentId === c.id);
			return { ...clone(c), matches: clone(matches) };
		});

		let filtered = commentsWithMatches;

		if (filter?.productId) {
			filtered = filtered.filter((c) => c.matches?.some((m) => m.productId === filter.productId));
		}
		if (filter?.isMention !== undefined) {
			if (filter.isMention) {
				filtered = filtered.filter((c) => (c.matches?.length || 0) > 0);
			} else {
				filtered = filtered.filter((c) => (c.matches?.length || 0) === 0);
			}
		}
		if (filter?.isRequest !== undefined) {
			filtered = filtered.filter((c) => c.matches?.some((m) => m.isRequest === filter.isRequest));
		}
		if (filter?.search) {
			const searchTerm = filter.search.toLowerCase();
			filtered = filtered.filter(
				(c) => c.text.toLowerCase().includes(searchTerm) || c.authorName.toLowerCase().includes(searchTerm)
			);
		}

		const page = filter?.page || 1;
		const limit = filter?.limit || 10;
		const start = (page - 1) * limit;
		const paginated = filtered.slice(start, start + limit);

		return {
			data: paginated,
			total: filtered.length,
			page,
			limit,
			totalPages: Math.ceil(filtered.length / limit) || 1
		};
	}

	async getCommentMatches(projectId: string): Promise<CommentMatch[]> {
		const projectProducts = this.products.filter((p) => p.analysisProjectId === projectId);
		const productIds = new Set(projectProducts.map((p) => p.id));
		return clone(this.commentMatches.filter((m) => productIds.has(m.productId)));
	}

	// ================= CRITERIA & C4 (ADR-0001) =================
	async getCriteria(projectId: string): Promise<{ criteria: Criteria[]; c4Config: C4TimeAnchorConfig }> {
		const crits = this.criteria.filter((c) => c.analysisProjectId === projectId);
		const config = this.c4Configs.get(projectId) || clone(initialC4Config);
		return {
			criteria: clone(crits),
			c4Config: clone(config)
		};
	}

	async updateCriteria(
		projectId: string,
		dto: UpdateCriteriaDto
	): Promise<{ criteria: Criteria[]; c4Config: C4TimeAnchorConfig }> {
		// Update weights
		for (const item of dto.criteria) {
			const crit = this.criteria.find((c) => c.analysisProjectId === projectId && c.code === item.code);
			if (crit) {
				crit.weight = item.weight;
				crit.updatedAt = new Date().toISOString();
			}
		}

		if (dto.c4Config) {
			this.c4Configs.set(projectId, clone(dto.c4Config));
		}

		return this.getCriteria(projectId);
	}

	// ================= SAW CALCULATION (ADR-0001, ADR-0003) =================
	async calculateRanking(projectId: string): Promise<RankingLeaderboard> {
		const project = this.projects.find((p) => p.id === projectId);
		const projectProducts = this.products.filter((p) => p.analysisProjectId === projectId);
		const { criteria, c4Config } = await this.getCriteria(projectId);

		// 1. Determine C4 Time Anchor Date per ADR-0001
		const projectComments = this.getProjectComments(projectId);

		let anchorDate: Date;
		if (c4Config.anchorType === 'custom' && c4Config.customAnchorDate) {
			anchorDate = new Date(c4Config.customAnchorDate);
		} else {
			// default: MAX(comment.published_at)
			if (projectComments.length > 0) {
				const timestamps = projectComments.map((c) => new Date(c.publishedAt).getTime());
				anchorDate = new Date(Math.max(...timestamps));
			} else {
				anchorDate = new Date();
			}
		}

		const recentCutoffMs = anchorDate.getTime() - c4Config.daysWindow * 24 * 60 * 60 * 1000;

		// 2. Decision Matrix (Xij)
		const decisionRows: DecisionMatrixRow[] = [];
		let maxC1 = 0;
		let maxC2 = 0;
		let maxC3 = 0;
		let maxC4 = 0;

		for (const product of projectProducts) {
			const matches = this.commentMatches.filter(
				(m) => m.productId === product.id && m.isRequest
			);

			const requestCount = matches.length;

			// C2: Unique Requesters (COUNT DISTINCT authorChannelId)
			const requesters = new Set<string>();
			let totalLikes = 0;
			let recentRequests = 0;

			for (const match of matches) {
				const comment = this.comments.find((c) => c.id === match.commentId);
				if (comment) {
					requesters.add(comment.authorChannelId);
					totalLikes += comment.likeCount;
					const pubDate = new Date(comment.publishedAt).getTime();
					if (pubDate >= recentCutoffMs) {
						recentRequests++;
					}
				}
			}

			const uniqueRequester = requesters.size;
			const averageRequestLikes = requestCount > 0 ? Number((totalLikes / requestCount).toFixed(2)) : 0;
			const recentRequestRatio = requestCount > 0 ? Number((recentRequests / requestCount).toFixed(4)) : 0;

			decisionRows.push({
				productId: product.id,
				productName: product.name,
				c1RequestCount: requestCount,
				c2UniqueRequester: uniqueRequester,
				c3AverageRequestLikes: averageRequestLikes,
				c4RecentRequestRatio: recentRequestRatio
			});

			if (requestCount > maxC1) maxC1 = requestCount;
			if (uniqueRequester > maxC2) maxC2 = uniqueRequester;
			if (averageRequestLikes > maxC3) maxC3 = averageRequestLikes;
			if (recentRequestRatio > maxC4) maxC4 = recentRequestRatio;
		}

		const decisionMatrix: DecisionMatrix = {
			rows: decisionRows,
			maxValues: {
				c1: maxC1 || 1,
				c2: maxC2 || 1,
				c3: maxC3 || 1,
				c4: maxC4 || 1
			}
		};

		// 3. Normalized Matrix (Rij) - Benefit formula: Rij = Xij / max(Xj)
		const normalizedRows: NormalizedMatrixRow[] = decisionRows.map((row) => ({
			productId: row.productId,
			productName: row.productName,
			r1: Number((row.c1RequestCount / decisionMatrix.maxValues.c1).toFixed(4)),
			r2: Number((row.c2UniqueRequester / decisionMatrix.maxValues.c2).toFixed(4)),
			r3: Number((row.c3AverageRequestLikes / decisionMatrix.maxValues.c3).toFixed(4)),
			r4: Number((row.c4RecentRequestRatio / decisionMatrix.maxValues.c4).toFixed(4))
		}));

		const normalizedMatrix: NormalizedMatrix = { rows: normalizedRows };

		// 4. Weighted Matrix (Wj * Rij) and Final Preference Value Vi
		const weightMap: Record<CriteriaCode, number> = {
			C1: criteria.find((c) => c.code === 'C1')?.weight ?? 0.4,
			C2: criteria.find((c) => c.code === 'C2')?.weight ?? 0.25,
			C3: criteria.find((c) => c.code === 'C3')?.weight ?? 0.2,
			C4: criteria.find((c) => c.code === 'C4')?.weight ?? 0.15
		};

		const weightedRows: WeightedMatrixRow[] = normalizedRows.map((norm) => {
			const w1 = Number((norm.r1 * weightMap.C1).toFixed(4));
			const w2 = Number((norm.r2 * weightMap.C2).toFixed(4));
			const w3 = Number((norm.r3 * weightMap.C3).toFixed(4));
			const w4 = Number((norm.r4 * weightMap.C4).toFixed(4));
			const preferenceValue = Number((w1 + w2 + w3 + w4).toFixed(4));

			return {
				productId: norm.productId,
				productName: norm.productName,
				w1,
				w2,
				w3,
				w4,
				preferenceValue
			};
		});

		const weightedMatrix: WeightedMatrix = { rows: weightedRows };

		// 5. Leaderboard Rankings (sorted descending by Vi)
		const rankings: RankingResult[] = weightedRows
			.map((weightedRow) => {
				const dec = decisionRows.find((d) => d.productId === weightedRow.productId)!;
				const norm = normalizedRows.find((n) => n.productId === weightedRow.productId)!;

				return {
					id: `rank-${projectId}-${weightedRow.productId}`,
					analysisProjectId: projectId,
					productId: weightedRow.productId,
					productName: weightedRow.productName,
					requestCount: dec.c1RequestCount,
					uniqueRequester: dec.c2UniqueRequester,
					averageRequestLikes: dec.c3AverageRequestLikes,
					recentRequestRatio: dec.c4RecentRequestRatio,
					normalizedRequestCount: norm.r1,
					normalizedUniqueRequester: norm.r2,
					normalizedAverageLikes: norm.r3,
					normalizedRecentRatio: norm.r4,
					preferenceValue: weightedRow.preferenceValue,
					finalScore: weightedRow.preferenceValue,
					rank: 0,
					calculatedAt: new Date().toISOString()
				};
			})
			.sort((a, b) => b.preferenceValue - a.preferenceValue)
			.map((item, idx) => ({ ...item, rank: idx + 1 }));

		const leaderboard: RankingLeaderboard = {
			analysisProjectId: projectId,
			calculatedAt: new Date().toISOString(),
			rankings,
			decisionMatrix,
			normalizedMatrix,
			weightedMatrix,
			criteriaWeights: weightMap,
			c4Config
		};

		this.rankingsMap.set(projectId, leaderboard);

		if (project) {
			project.status = 'ranked';
			project.updatedAt = new Date().toISOString();
		}

		return clone(leaderboard);
	}

	async getRankings(projectId: string): Promise<RankingLeaderboard | null> {
		const existing = this.rankingsMap.get(projectId);
		if (existing) return clone(existing);
		// Calculate if not yet cached
		return this.calculateRanking(projectId);
	}
}

export const mockService = new MockService();
