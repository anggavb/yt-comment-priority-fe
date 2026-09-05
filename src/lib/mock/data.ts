import type {
	AnalysisProject,
	CandidateProduct,
	Comment,
	Criteria,
	C4TimeAnchorConfig,
	RequestKeyword,
	YouTubeVideo
} from '$lib/types';

export const initialProjects: AnalysisProject[] = [
	{
		id: 'proj-desk-setup-2026',
		name: 'Prioritas Review Gadget & Desk Setup 2026',
		description:
			'Analisis prioritas ulasan peripheral dan gadget meja kerja berdasarkan komentar penonton channel gadget reviewer Indonesia.',
		createdAt: '2026-08-01T09:00:00.000Z',
		updatedAt: '2026-09-01T14:30:00.000Z',
		videoCount: 1,
		productCount: 5,
		commentCount: 45,
		processedCommentCount: 45,
		status: 'ranked'
	},
	{
		id: 'proj-budget-keyboard',
		name: 'Eksperimen Mechanical Keyboard Budget 500rb - 1jt',
		description:
			'Studi komparasi minat penonton terhadap keyboard entry-level mechanical.',
		createdAt: '2026-08-15T11:00:00.000Z',
		updatedAt: '2026-08-20T16:00:00.000Z',
		videoCount: 1,
		productCount: 3,
		commentCount: 20,
		processedCommentCount: 20,
		status: 'ready'
	}
];

export const initialVideos: YouTubeVideo[] = [
	{
		id: 'vid-desk-setup-1',
		analysisProjectId: 'proj-desk-setup-2026',
		youtubeVideoId: '7X8v_tZ-v7E',
		url: 'https://www.youtube.com/watch?v=7X8v_tZ-v7E',
		title: 'Rekomendasi Setup Meja Kerja 2026 - Keyboard & Mouse Produktivitas Terbaik!',
		channelTitle: 'GadgetReview Indo',
		thumbnailUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=60',
		publishedAt: '2026-07-15T10:00:00.000Z',
		fetchedAt: '2026-08-30T15:00:00.000Z',
		commentCount: 45,
		fetchStatus: 'COMPLETED',
		createdAt: '2026-08-01T09:30:00.000Z'
	}
];

export const initialProducts: CandidateProduct[] = [
	{
		id: 'prod-keychron-v1',
		analysisProjectId: 'proj-desk-setup-2026',
		name: 'Keychron V1',
		description: 'Custom mechanical keyboard 75% layout dengan QMK/VIA support',
		keywords: [
			{ id: 'kw-1', productId: 'prod-keychron-v1', keyword: 'keychron v1', createdAt: '2026-08-01T10:00:00.000Z' },
			{ id: 'kw-2', productId: 'prod-keychron-v1', keyword: 'v1 max', createdAt: '2026-08-01T10:00:00.000Z' },
			{ id: 'kw-3', productId: 'prod-keychron-v1', keyword: 'keychron v1 max', createdAt: '2026-08-01T10:00:00.000Z' }
		],
		createdAt: '2026-08-01T10:00:00.000Z',
		updatedAt: '2026-08-01T10:00:00.000Z'
	},
	{
		id: 'prod-mx-master-3s',
		analysisProjectId: 'proj-desk-setup-2026',
		name: 'Logitech MX Master 3S',
		description: 'Ergonomic wireless mouse flagship untuk produktivitas profesional',
		keywords: [
			{ id: 'kw-4', productId: 'prod-mx-master-3s', keyword: 'mx master 3s', createdAt: '2026-08-01T10:05:00.000Z' },
			{ id: 'kw-5', productId: 'prod-mx-master-3s', keyword: 'mx master', createdAt: '2026-08-01T10:05:00.000Z' },
			{ id: 'kw-6', productId: 'prod-mx-master-3s', keyword: 'master 3s', createdAt: '2026-08-01T10:05:00.000Z' },
			{ id: 'kw-7', productId: 'prod-mx-master-3s', keyword: 'logitech mx master', createdAt: '2026-08-01T10:05:00.000Z' }
		],
		createdAt: '2026-08-01T10:05:00.000Z',
		updatedAt: '2026-08-01T10:05:00.000Z'
	},
	{
		id: 'prod-rk84',
		analysisProjectId: 'proj-desk-setup-2026',
		name: 'Royal Kludge RK84',
		description: 'Budget wireless mechanical keyboard 84 keys',
		keywords: [
			{ id: 'kw-8', productId: 'prod-rk84', keyword: 'rk84', createdAt: '2026-08-01T10:10:00.000Z' },
			{ id: 'kw-9', productId: 'prod-rk84', keyword: 'royal kludge rk84', createdAt: '2026-08-01T10:10:00.000Z' },
			{ id: 'kw-10', productId: 'prod-rk84', keyword: 'rk 84', createdAt: '2026-08-01T10:10:00.000Z' }
		],
		createdAt: '2026-08-01T10:10:00.000Z',
		updatedAt: '2026-08-01T10:10:00.000Z'
	},
	{
		id: 'prod-aula-f75',
		analysisProjectId: 'proj-desk-setup-2026',
		name: 'Aula F75',
		description: 'Pre-built gasket mount mechanical keyboard 75% yang viral di komunitas',
		keywords: [
			{ id: 'kw-11', productId: 'prod-aula-f75', keyword: 'aula f75', createdAt: '2026-08-01T10:15:00.000Z' },
			{ id: 'kw-12', productId: 'prod-aula-f75', keyword: 'f75', createdAt: '2026-08-01T10:15:00.000Z' },
			{ id: 'kw-13', productId: 'prod-aula-f75', keyword: 'aula 75', createdAt: '2026-08-01T10:15:00.000Z' }
		],
		createdAt: '2026-08-01T10:15:00.000Z',
		updatedAt: '2026-08-01T10:15:00.000Z'
	},
	{
		id: 'prod-razer-pro-click',
		analysisProjectId: 'proj-desk-setup-2026',
		name: 'Razer Pro Click',
		description: 'Mouse wireless ergonomis hasil kolaborasi Razer dan Humanscale',
		keywords: [
			{ id: 'kw-14', productId: 'prod-razer-pro-click', keyword: 'razer pro click', createdAt: '2026-08-01T10:20:00.000Z' },
			{ id: 'kw-15', productId: 'prod-razer-pro-click', keyword: 'pro click', createdAt: '2026-08-01T10:20:00.000Z' }
		],
		createdAt: '2026-08-01T10:20:00.000Z',
		updatedAt: '2026-08-01T10:20:00.000Z'
	}
];

export const initialRequestKeywords: RequestKeyword[] = [
	{ id: 'req-1', keyword: 'review', createdAt: '2026-08-01T08:00:00.000Z' },
	{ id: 'req-2', keyword: 'bahas', createdAt: '2026-08-01T08:00:00.000Z' },
	{ id: 'req-3', keyword: 'coba', createdAt: '2026-08-01T08:00:00.000Z' },
	{ id: 'req-4', keyword: 'test', createdAt: '2026-08-01T08:00:00.000Z' },
	{ id: 'req-5', keyword: 'tes', createdAt: '2026-08-01T08:00:00.000Z' },
	{ id: 'req-6', keyword: 'bandingkan', createdAt: '2026-08-01T08:00:00.000Z' },
	{ id: 'req-7', keyword: 'bandingin', createdAt: '2026-08-01T08:00:00.000Z' },
	{ id: 'req-8', keyword: 'compare', createdAt: '2026-08-01T08:00:00.000Z' },
	{ id: 'req-9', keyword: 'versus', createdAt: '2026-08-01T08:00:00.000Z' },
	{ id: 'req-10', keyword: 'vs', createdAt: '2026-08-01T08:00:00.000Z' },
	{ id: 'req-11', keyword: 'buat', createdAt: '2026-08-01T08:00:00.000Z' },
	{ id: 'req-12', keyword: 'bikin', createdAt: '2026-08-01T08:00:00.000Z' },
	{ id: 'req-13', keyword: 'spill', createdAt: '2026-08-01T08:00:00.000Z' },
	{ id: 'req-14', keyword: 'rekomendasi', createdAt: '2026-08-01T08:00:00.000Z' },
	{ id: 'req-15', keyword: 'unboxing', createdAt: '2026-08-01T08:00:00.000Z' }
];

export const initialCriteria: Criteria[] = [
	{
		id: 'crit-c1',
		analysisProjectId: 'proj-desk-setup-2026',
		code: 'C1',
		name: 'Request Count',
		weight: 0.4,
		attribute: 'benefit',
		createdAt: '2026-08-01T08:00:00.000Z',
		updatedAt: '2026-08-01T08:00:00.000Z'
	},
	{
		id: 'crit-c2',
		analysisProjectId: 'proj-desk-setup-2026',
		code: 'C2',
		name: 'Unique Requester',
		weight: 0.25,
		attribute: 'benefit',
		createdAt: '2026-08-01T08:00:00.000Z',
		updatedAt: '2026-08-01T08:00:00.000Z'
	},
	{
		id: 'crit-c3',
		analysisProjectId: 'proj-desk-setup-2026',
		code: 'C3',
		name: 'Average Request Likes',
		weight: 0.2,
		attribute: 'benefit',
		createdAt: '2026-08-01T08:00:00.000Z',
		updatedAt: '2026-08-01T08:00:00.000Z'
	},
	{
		id: 'crit-c4',
		analysisProjectId: 'proj-desk-setup-2026',
		code: 'C4',
		name: 'Recent Request Ratio',
		weight: 0.15,
		attribute: 'benefit',
		createdAt: '2026-08-01T08:00:00.000Z',
		updatedAt: '2026-08-01T08:00:00.000Z'
	}
];

export const initialC4Config: C4TimeAnchorConfig = {
	daysWindow: 30,
	anchorType: 'max_comment',
	customAnchorDate: null
};

// 45 realistic comments collected from Indonesian tech video audience
export const initialComments: Comment[] = [
	{
		id: 'cmt-01',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx101a',
		authorChannelId: 'UC_user_dimas',
		authorName: 'Dimas Prasetyo',
		text: 'Bang tolong review Keychron V1 dong, penasaran banget build quality dan suara ketikannya!',
		likeCount: 42,
		publishedAt: '2026-08-28T14:30:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-02',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx102b',
		authorChannelId: 'UC_user_rizky',
		authorName: 'Rizky Ramadhan',
		text: 'Bahas Aula F75 bang plisss, lagi hype parah di grup mechanical keyboard FB!',
		likeCount: 68,
		publishedAt: '2026-08-27T09:15:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-03',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx103c',
		authorChannelId: 'UC_user_fajar',
		authorName: 'Fajar Nugraha',
		text: 'Coba bandingin Keychron V1 vs Royal Kludge RK84 dong bang, lagi bingung mau upgrade ke mana.',
		likeCount: 35,
		publishedAt: '2026-08-25T19:40:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-04',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx104d',
		authorChannelId: 'UC_user_budi',
		authorName: 'Budi Santoso',
		text: 'Saya pakai MX Master 3S udah setahun emang mantap banget ergonomisnya ga bikin pegel.',
		likeCount: 14,
		publishedAt: '2026-08-24T11:20:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-05',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx105e',
		authorChannelId: 'UC_user_kevin',
		authorName: 'Kevin Anggara',
		text: 'Spill review Logitech MX Master 3S vs Razer Pro Click buat kerja desainer bang!',
		likeCount: 52,
		publishedAt: '2026-08-22T08:45:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-06',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx106f',
		authorChannelId: 'UC_user_anita',
		authorName: 'Anita Wijaya',
		text: 'Bikin video unboxing Aula F75 dong, suaranya renyah banget di tiktok.',
		likeCount: 29,
		publishedAt: '2026-08-20T17:10:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-07',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx107g',
		authorChannelId: 'UC_user_hendra',
		authorName: 'Hendra Gunawan',
		text: 'Review Keychron V1 Max bang yang udah support wireless 2.4GHz.',
		likeCount: 19,
		publishedAt: '2026-08-18T13:00:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-08',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx108h',
		authorChannelId: 'UC_user_wahyu',
		authorName: 'Wahyu Hidayat',
		text: 'Semoga sukses dengan pekerjaannya bang! Videonya selalu informatif dan rapi.',
		likeCount: 8,
		publishedAt: '2026-08-16T10:00:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-09',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx109i',
		authorChannelId: 'UC_user_tiara',
		authorName: 'Tiara Larasati',
		text: 'Tes ketahanan baterai MX Master dong bang kalau dipake kerja intensif seharian.',
		likeCount: 24,
		publishedAt: '2026-08-15T15:30:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-10',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx110j',
		authorChannelId: 'UC_user_donny',
		authorName: 'Donny Setiawan',
		text: 'Tolong bahas RK84 apakah masih worth it dibeli di 2026 sekarang ini?',
		likeCount: 31,
		publishedAt: '2026-08-12T16:20:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-11',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx111k',
		authorChannelId: 'UC_user_dimas',
		authorName: 'Dimas Prasetyo',
		text: 'Coba tes latency wireless Aula F75 bang kalau buat gaming kasual santai.',
		likeCount: 17,
		publishedAt: '2026-08-10T12:00:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-12',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx112l',
		authorChannelId: 'UC_user_agus',
		authorName: 'Agus Pratama',
		text: 'Keren banget lighting mejanya bang, minimalis dan bersih banget.',
		likeCount: 5,
		publishedAt: '2026-08-08T09:00:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-13',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx113m',
		authorChannelId: 'UC_user_bayu',
		authorName: 'Bayu Wicaksono',
		text: 'Bang coba review Razer Pro Click, jarang ada reviewer indo yang bahas mouse ini.',
		likeCount: 22,
		publishedAt: '2026-08-05T14:10:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-14',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx114n',
		authorChannelId: 'UC_user_farhan',
		authorName: 'Farhan Maulana',
		text: 'Rekomendasi keyboard 75 persen terbaik saat ini apa bang? Keychron V1 atau Aula F75?',
		likeCount: 46,
		publishedAt: '2026-08-03T20:15:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-15',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx115o',
		authorChannelId: 'UC_user_ilham',
		authorName: 'Ilham Syahputra',
		text: 'Review Keychron V1 dong bang, pengen tahu modifikasi foam-nya gimana.',
		likeCount: 18,
		publishedAt: '2026-08-01T11:50:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	// Older comments (outside recent 30-day window from 2026-08-30 anchor)
	{
		id: 'cmt-16',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx116p',
		authorChannelId: 'UC_user_dimas',
		authorName: 'Dimas Prasetyo',
		text: 'Bang tolong review Keychron V1, lagi cari keyboard pertama buat ngetik tesis.',
		likeCount: 15,
		publishedAt: '2026-07-28T10:00:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-17',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx117q',
		authorChannelId: 'UC_user_yusuf',
		authorName: 'Yusuf Mansur',
		text: 'Bahas Logitech MX Master 3S dong bang, penasaran scroll wheel magspeed-nya.',
		likeCount: 38,
		publishedAt: '2026-07-26T14:30:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-18',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx118r',
		authorChannelId: 'UC_user_alif',
		authorName: 'Alif Rahman',
		text: 'Review RK84 bang, harganya udah turun banyak di e-commerce.',
		likeCount: 20,
		publishedAt: '2026-07-25T08:00:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-19',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx119s',
		authorChannelId: 'UC_user_dani',
		authorName: 'Dani Saputra',
		text: 'Bandingin MX Master 3S sama mouse gaming biasa bang enak mana.',
		likeCount: 12,
		publishedAt: '2026-07-24T18:45:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-20',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx120t',
		authorChannelId: 'UC_user_eka',
		authorName: 'Eka Kurniawan',
		text: 'Aula F75 suaranya emang juara bang, saya udah punya yang warna glacier blue.',
		likeCount: 9,
		publishedAt: '2026-07-23T11:15:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-21',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx121u',
		authorChannelId: 'UC_user_satria',
		authorName: 'Satria Yudha',
		text: 'Bahas Aula F75 dong min, pengen tau software macro-nya user friendly gak.',
		likeCount: 25,
		publishedAt: '2026-07-22T13:20:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-22',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx122v',
		authorChannelId: 'UC_user_galih',
		authorName: 'Galih Permana',
		text: 'Coba tes switch tactile Keychron V1 vs linear enak mana buat ngetik santai.',
		likeCount: 16,
		publishedAt: '2026-07-21T09:40:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-23',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx123w',
		authorChannelId: 'UC_user_rendy',
		authorName: 'Rendy Julian',
		text: 'Bang coba bikin video komparasi Razer Pro Click vs MX Master 3S!',
		likeCount: 34,
		publishedAt: '2026-07-20T16:50:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-24',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx124x',
		authorChannelId: 'UC_user_tono',
		authorName: 'Tono Hartono',
		text: 'Review dong bang barang yang ada di thumbnail.',
		likeCount: 7,
		publishedAt: '2026-07-19T10:10:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-25',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx125y',
		authorChannelId: 'UC_user_arif',
		authorName: 'Arif Wibowo',
		text: 'Bang unboxing RK84 dong, pengen liat isi box terbarunya.',
		likeCount: 11,
		publishedAt: '2026-07-18T14:00:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-26',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx126z',
		authorChannelId: 'UC_user_mega',
		authorName: 'Mega Putri',
		text: 'Suara mic abang jernih banget, pake soundcard apa?',
		likeCount: 4,
		publishedAt: '2026-07-17T17:30:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-27',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx127aa',
		authorChannelId: 'UC_user_tari',
		authorName: 'Tari Lestari',
		text: 'Spill harga Aula F75 sekarang di marketplace bang.',
		likeCount: 19,
		publishedAt: '2026-07-16T12:00:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-28',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx128ab',
		authorChannelId: 'UC_user_rio',
		authorName: 'Rio Febrian',
		text: 'Review Keychron V1 Max please, worth it gak selisih 300rb sama versi kabel?',
		likeCount: 28,
		publishedAt: '2026-07-16T08:20:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-29',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx129ac',
		authorChannelId: 'UC_user_yoga',
		authorName: 'Yoga Pratama',
		text: 'Bahas Royal Kludge RK84 bang kalau dimodif tape mod gimana suaranya.',
		likeCount: 14,
		publishedAt: '2026-07-15T21:00:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	},
	{
		id: 'cmt-30',
		youtubeVideoId: 'vid-desk-setup-1',
		youtubeCommentId: 'Ugx130ad',
		authorChannelId: 'UC_user_gilang',
		authorName: 'Gilang Ramadhan',
		text: 'Mantap bang selalu menginspirasi buat rapihin meja kerja.',
		likeCount: 3,
		publishedAt: '2026-07-15T15:00:00.000Z',
		createdAt: '2026-08-30T15:00:00.000Z'
	}
];
