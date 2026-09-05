# Product Requirements Document

## 1. Ringkasan Produk

**Nama sementara:** YouTube Review Priority System

**Judul skripsi sementara:**

**Sistem Pendukung Keputusan Penentuan Prioritas Produk Review Berdasarkan Interaksi Audiens YouTube Menggunakan Metode Simple Additive Weighting (SAW)**

Sistem ini membantu YouTuber reviewer alat kerja menentukan produk yang sebaiknya diprioritaskan untuk direview berdasarkan interaksi audiens pada komentar YouTube.

Sistem mengambil komentar dari video YouTube menggunakan **YouTube Data API v3**, mengolah komentar berdasarkan keyword produk dan keyword permintaan, menghasilkan nilai untuk beberapa kriteria, kemudian menggunakan metode **Simple Additive Weighting (SAW)** untuk menghasilkan ranking produk.

Fokus utama aplikasi adalah mendukung kebutuhan penelitian skripsi. Nilai portfolio bersifat sekunder.

---

# 2. Latar Belakang

YouTuber reviewer alat kerja dapat menerima banyak komentar berupa:

* permintaan review produk;
* permintaan perbandingan produk;
* pertanyaan mengenai produk;
* dukungan terhadap permintaan pengguna lain;
* mention terhadap suatu produk.

Jika jumlah komentar cukup besar, proses mengidentifikasi produk yang paling diminati secara manual menjadi tidak efisien.

Menggunakan jumlah komentar saja juga belum cukup karena satu produk dapat:

* disebut berkali-kali oleh pengguna yang sama;
* mempunyai sedikit komentar tetapi engagement tinggi;
* mempunyai permintaan lama yang sudah tidak relevan;
* mempunyai permintaan baru dari banyak pengguna berbeda.

Diperlukan mekanisme pengambilan keputusan yang mempertimbangkan beberapa kriteria sekaligus.

Metode **Simple Additive Weighting (SAW)** digunakan untuk memberikan ranking kepada alternatif produk berdasarkan sejumlah kriteria yang berasal dari interaksi audiens.

---

# 3. Tujuan Produk

Sistem harus dapat:

1. Mengambil komentar dari video YouTube.
2. Menyimpan komentar untuk diproses.
3. Mengidentifikasi mention produk berdasarkan keyword.
4. Mengidentifikasi komentar yang merupakan permintaan review menggunakan rule-based keyword.
5. Menghasilkan nilai kriteria untuk setiap produk.
6. Menghitung normalisasi menggunakan metode SAW.
7. Menghitung skor akhir setiap produk.
8. Menghasilkan ranking prioritas produk.
9. Menampilkan sumber data dan proses perhitungan secara transparan.

---

# 4. Target User

### Primary User

YouTuber yang membuat konten review:

* alat kerja;
* peripheral komputer;
* keyboard;
* mouse;
* monitor;
* laptop;
* desk setup;
* perangkat produktivitas lainnya.

### Secondary User

Peneliti atau administrator sistem yang menjalankan analisis.

Untuk MVP, sistem dapat diasumsikan digunakan oleh **satu pengguna** sehingga autentikasi bukan prioritas utama.

---

# 5. Scope MVP

MVP hanya mencakup alur:

```text
YouTube Video
      ↓
Fetch Comments
      ↓
Candidate Products
      ↓
Product Keywords
      ↓
Comment Processing
      ↓
Metrics
      ↓
SAW
      ↓
Ranking Produk
```

---

# 6. Non-Goals

Fitur berikut **tidak masuk MVP**:

* AI;
* Large Language Model;
* machine learning;
* sentiment analysis;
* NLP lanjutan;
* automatic product recognition;
* scraping marketplace;
* Shopee API;
* Tokopedia API;
* Google Trends;
* YouTube Analytics API;
* prediction;
* recommendation berbasis ML;
* automatic content generation;
* replies komentar;
* real-time comment monitoring;
* microservices;
* Redis;
* message queue;
* WebSocket.

Fitur tersebut hanya boleh dipertimbangkan setelah penelitian inti selesai.

---

# 7. Tech Stack

## Runtime

**Bun**

Digunakan untuk:

* package management;
* TypeScript runtime;
* menjalankan backend;
* menjalankan development tooling.

---

## Backend

**ElysiaJS**

Bahasa:

**TypeScript**

Backend bertanggung jawab atas:

* integrasi YouTube Data API;
* business logic;
* text processing;
* penghitungan metrics;
* implementasi SAW;
* komunikasi database;
* REST API.

---

## Frontend

**Svelte**

Frontend bertanggung jawab atas:

* input video;
* pengelolaan produk;
* pengelolaan keyword;
* konfigurasi kriteria;
* monitoring hasil comment processing;
* visualisasi ranking;
* detail perhitungan SAW.

Untuk MVP tidak diperlukan state management kompleks.

---

## Database

**PostgreSQL**

Digunakan untuk menyimpan:

* analysis project;
* video;
* komentar;
* produk;
* keyword;
* hasil matching;
* criteria;
* hasil SAW.

---

## External API

**YouTube Data API v3**

Endpoint utama:

```text
commentThreads.list
```

MVP hanya mengambil:

**top-level comments.**

---

# 8. High-Level Architecture

```text
┌───────────────────────┐
│        Svelte         │
│       Frontend        │
└───────────┬───────────┘
            │
            │ HTTP / JSON
            ▼
┌───────────────────────┐
│      ElysiaJS API     │
│         Bun           │
│                       │
│ ┌───────────────────┐ │
│ │ YouTube Service   │ │
│ ├───────────────────┤ │
│ │ Comment Processor │ │
│ ├───────────────────┤ │
│ │ Metrics Service   │ │
│ ├───────────────────┤ │
│ │ SAW Service       │ │
│ └───────────────────┘ │
└───────┬─────────┬─────┘
        │         │
        │         │
        ▼         ▼
 PostgreSQL    YouTube
               Data API
```

---

# 9. Konsep Analysis Project

Setiap analisis menggunakan entity:

**Analysis Project**

Contoh:

```text
Nama:
Prioritas Review September 2026

Deskripsi:
Analisis permintaan produk keyboard
dan mouse dari audience YouTube.
```

Satu project dapat mempunyai:

```text
Analysis Project
      │
      ├── Videos
      ├── Products
      ├── Criteria
      ├── Comments
      └── Ranking Results
```

Ini memungkinkan penelitian dilakukan beberapa kali tanpa mencampur data.

---

# 10. User Flow

## Flow utama

```text
Create Analysis Project
        ↓
Add YouTube Videos
        ↓
Fetch Comments
        ↓
Add Candidate Products
        ↓
Add Product Keywords
        ↓
Process Comments
        ↓
Generate Product Metrics
        ↓
Calculate SAW
        ↓
View Ranking
```

---

# 11. Feature Requirements

## FR-01 — Analysis Project

User dapat:

* membuat project;
* melihat project;
* mengubah project;
* menghapus project.

Data:

```text
name
description
created_at
updated_at
```

---

# 12. FR-02 — YouTube Video Management

User memasukkan URL:

```text
https://youtube.com/watch?v=xxxxx
```

Sistem harus mengekstrak:

```text
videoId
```

Data minimal:

```text
youtube_video_id
url
title
published_at
fetched_at
```

Satu Analysis Project dapat memiliki beberapa video.

---

# 13. FR-03 — Fetch YouTube Comments

Sistem mengambil komentar menggunakan:

```text
YouTube Data API v3
```

Endpoint:

```text
commentThreads.list
```

Parameter:

```text
part=snippet
videoId
maxResults=100
order=time
textFormat=plainText
pageToken
```

Sistem harus mendukung pagination hingga seluruh komentar yang ditentukan berhasil diambil.

Data komentar minimal:

```text
youtube_comment_id

author_channel_id

author_name

text

like_count

published_at

updated_at
```

---

# 14. FR-04 — Candidate Product Management

User dapat memasukkan produk kandidat.

Contoh:

```text
Keychron V1
Logitech MX Master 3S
Royal Kludge RK84
```

Data:

```text
name
description
```

---

# 15. FR-05 — Product Keywords

Setiap produk memiliki beberapa keyword.

Contoh:

```text
Product:
Keychron V1

Keywords:
keychron v1
keychron v1 max
v1 max
```

Keyword tersebut digunakan untuk melakukan matching komentar.

---

# 16. FR-06 — Request Keywords

Sistem memiliki daftar keyword yang menunjukkan adanya permintaan.

Contoh:

```text
review
bahas
coba
test
tes
bandingkan
bandingin
compare
versus
vs
buat
bikin
```

Request keyword dapat dikonfigurasi.

---

# 17. FR-07 — Comment Preprocessing

Sebelum matching, komentar diproses dengan:

```text
lowercase
↓
trim
↓
normalize whitespace
↓
remove selected punctuation
↓
keyword matching
```

Contoh:

```text
"Bang REVIEW Keychron V1 dong!!!"
```

menjadi:

```text
bang review keychron v1 dong
```

---

# 18. FR-08 — Product Mention Detection

Komentar dianggap mention apabila:

```text
product keyword ditemukan
```

Contoh:

```text
"Saya sudah menggunakan Keychron V1"
```

hasil:

```text
product = Keychron V1
is_mention = true
```

---

# 19. FR-09 — Product Request Detection

Komentar dianggap request jika memenuhi:

```text
Product Keyword
       +
Request Keyword
```

Contoh:

```text
"Bang review Keychron V1 dong"
```

menghasilkan:

```text
product = Keychron V1

is_mention = true

is_request = true
```

Sedangkan:

```text
"Saya menggunakan Keychron V1"
```

menghasilkan:

```text
is_mention = true

is_request = false
```

---

# 20. FR-10 — Comment Match Audit

Sistem harus menyimpan hasil matching.

Tujuannya agar proses dapat diverifikasi.

Data:

```text
comment_id

product_id

matched_product_keyword

matched_request_keyword

is_mention

is_request
```

User dapat melihat:

| Comment                 | Product     | Mention | Request |
| ----------------------- | ----------- | ------: | ------: |
| Review Keychron V1 dong | Keychron V1 |     Yes |     Yes |
| Saya pakai MX Master    | MX Master   |     Yes |      No |

---

# 21. Kriteria SAW

Versi awal menggunakan empat kriteria.

| Code | Criteria              | Attribute |
| ---- | --------------------- | --------- |
| C1   | Request Count         | Benefit   |
| C2   | Unique Requester      | Benefit   |
| C3   | Average Request Likes | Benefit   |
| C4   | Recent Request Ratio  | Benefit   |

Bobot harus dapat dikonfigurasi.

Contoh awal:

```text
C1 = 40%

C2 = 25%

C3 = 20%

C4 = 15%
```

Total:

```text
100%
```

Bobot final harus ditentukan berdasarkan metodologi penelitian seperti wawancara, expert judgement, atau sumber penelitian terdahulu.

---

# 22. C1 — Request Count

Menghitung jumlah komentar request untuk produk.

```text
Request Count =
COUNT(comment WHERE is_request = true)
```

Contoh:

```text
Keychron V1 = 80
MX Master   = 65
RK84        = 42
```

---

# 23. C2 — Unique Requester

Menghitung jumlah pengguna unik yang meminta suatu produk.

Identifikasi berdasarkan:

```text
author_channel_id
```

Contoh:

```text
80 comments request

tetapi berasal dari:

65 unique users
```

Metrik ini mengurangi pengaruh spam komentar.

---

# 24. C3 — Average Request Likes

Mengukur dukungan pengguna lain terhadap komentar permintaan.

Formula:

```text
SUM(request_comment.like_count)
──────────────────────────────
request_count
```

---

# 25. C4 — Recent Request Ratio

Mengukur seberapa besar permintaan produk terjadi dalam periode terbaru.

Contoh periode:

```text
30 hari terakhir
```

Formula:

```text
Recent Request
──────────────
Total Request
```

Contoh:

```text
Total request = 100

Request 30 hari terakhir = 65

Recent Request Ratio = 0.65
```

Periode final harus didefinisikan dalam metodologi penelitian.

---

# 26. Metode SAW

Untuk setiap alternatif produk dibuat decision matrix:

| Product     |  C1 | C2 | C3 |   C4 |
| ----------- | --: | -: | -: | ---: |
| Keychron V1 |  80 | 70 | 12 | 0.70 |
| MX Master   | 100 | 60 |  8 | 0.40 |
| RK84        |  60 | 55 | 15 | 0.60 |

Semua kriteria pada MVP menggunakan attribute:

```text
Benefit
```

Normalisasi:

[
r_{ij}=\frac{x_{ij}}{\max(x_{ij})}
]

Final score:

[
V_i=\sum_{j=1}^{n}w_jr_{ij}
]

Produk diurutkan berdasarkan:

```text
final_score DESC
```

---

# 27. Ranking Output

Contoh:

| Rank | Product      | Final Score |
| ---: | ------------ | ----------: |
|    1 | Keychron V1  |       0.872 |
|    2 | MX Master 3S |       0.821 |
|    3 | RK84         |       0.693 |

Sistem juga harus menyediakan detail:

```text
Raw Value

↓

Normalized Value

↓

Weight

↓

Weighted Score

↓

Final Score
```

Tujuannya agar hasil dapat diverifikasi selama penelitian dan sidang.

---

# 28. Database Design

## analysis_projects

```text
id
name
description
created_at
updated_at
```

---

## youtube_videos

```text
id
analysis_project_id
youtube_video_id
url
title
published_at
fetched_at
created_at
```

---

## comments

```text
id
youtube_video_id
youtube_comment_id
author_channel_id
author_name
text
like_count
published_at
updated_at
created_at
```

---

## products

```text
id
analysis_project_id
name
description
created_at
updated_at
```

---

## product_keywords

```text
id
product_id
keyword
created_at
```

---

## request_keywords

```text
id
keyword
created_at
```

---

## comment_matches

```text
id
comment_id
product_id
matched_product_keyword
matched_request_keyword
is_mention
is_request
created_at
```

---

## criteria

```text
id
analysis_project_id
code
name
weight
attribute
created_at
updated_at
```

---

## ranking_results

```text
id
analysis_project_id
product_id

request_count
unique_requester
average_request_likes
recent_request_ratio

normalized_request_count
normalized_unique_requester
normalized_average_likes
normalized_recent_ratio

final_score
rank

calculated_at
```

---

# 29. Backend Module Structure

Rekomendasi struktur:

```text
src/

├── modules/
│   ├── projects/
│   ├── videos/
│   ├── comments/
│   ├── products/
│   ├── criteria/
│   └── rankings/
│
├── services/
│   ├── youtube.service.ts
│   ├── comment-processor.service.ts
│   ├── metrics.service.ts
│   └── saw.service.ts
│
├── database/
│
├── config/
│
└── index.ts
```

Tidak perlu menambahkan Clean Architecture atau abstraction layer berlebihan selama ukuran aplikasi masih kecil.

---

# 30. API Design

## Project

```text
GET    /projects
POST   /projects
GET    /projects/:id
PUT    /projects/:id
DELETE /projects/:id
```

---

## Videos

```text
GET    /projects/:id/videos

POST   /projects/:id/videos

DELETE /videos/:id

POST   /videos/:id/fetch-comments
```

---

## Products

```text
GET    /projects/:id/products

POST   /projects/:id/products

PUT    /products/:id

DELETE /products/:id
```

---

## Keywords

```text
POST   /products/:id/keywords

DELETE /product-keywords/:id

GET    /request-keywords

POST   /request-keywords

DELETE /request-keywords/:id
```

---

## Comment Processing

```text
POST /projects/:id/process-comments
```

---

## Criteria

```text
GET /projects/:id/criteria

PUT /projects/:id/criteria
```

---

## SAW

```text
POST /projects/:id/calculate-ranking
```

---

## Results

```text
GET /projects/:id/rankings

GET /projects/:id/rankings/:productId
```

---

# 31. Frontend Pages

Frontend MVP hanya membutuhkan:

### 1. Project List

```text
/projects
```

### 2. Project Detail

```text
/projects/:id
```

### 3. Videos

Menampilkan:

* video;
* status comment fetch;
* jumlah komentar.

### 4. Products

Menampilkan:

* candidate product;
* product keywords.

### 5. Comments

Menampilkan:

* total comments;
* matched comments;
* request comments;
* unmatched comments.

### 6. Criteria

Menampilkan:

* kriteria;
* weight;
* total bobot.

### 7. Ranking

Menampilkan:

* ranking;
* raw metrics;
* normalized values;
* final score.

---

# 32. Environment Variables

Backend:

```env
PORT=3000

DATABASE_URL=postgresql://...

YOUTUBE_API_KEY=...

FRONTEND_URL=http://localhost:5173
```

API key tidak boleh disimpan di repository.

---

# 33. Testing Strategy

## Unit Test

Prioritas unit testing diberikan kepada:

```text
comment preprocessing

product matching

request matching

metrics calculation

SAW normalization

SAW final score
```

---

## Black Box Testing

Contoh:

| Scenario                            | Expected Result          |
| ----------------------------------- | ------------------------ |
| Menambahkan video valid             | Video berhasil tersimpan |
| Fetch komentar                      | Comment tersimpan        |
| Product keyword ditemukan           | Mention terdeteksi       |
| Product + request keyword ditemukan | Request terdeteksi       |
| Bobot tidak 100%                    | Perhitungan ditolak      |
| Calculate SAW                       | Ranking berhasil dibuat  |

---

## SAW Verification

Perhitungan sistem harus dibandingkan dengan perhitungan manual menggunakan spreadsheet.

Contoh dataset:

```text
3 products
4 criteria
```

Hasil:

```text
Manual Calculation
        vs
System Calculation
```

Nilainya harus sama.

---

# 34. Research Validation

Ranking sistem sebaiknya divalidasi oleh pemilik channel.

Contoh:

```text
System Ranking

1. Product A
2. Product B
3. Product C

        ↓

YouTuber Validation

        ↓

Relevant / Not Relevant
```

Validasi ini lebih penting untuk penelitian dibanding menambahkan fitur teknis baru.

---

# 35. Batasan Penelitian

Batasan awal:

1. Penelitian dilakukan pada satu channel YouTube.
2. Data berasal dari video yang ditentukan.
3. Hanya top-level comment yang dianalisis.
4. Kandidat produk dimasukkan secara manual.
5. Product keyword dimasukkan secara manual.
6. Request detection menggunakan rule-based keyword matching.
7. Sistem tidak melakukan sentiment analysis.
8. Sistem tidak menggunakan AI atau machine learning.
9. Hasil rekomendasi terbatas pada kandidat produk yang terdaftar.
10. Kriteria menggunakan data interaksi komentar YouTube.
11. SAW digunakan sebagai metode ranking.
12. Periode recent request ditentukan pada penelitian.

---

# 36. Risiko

## Keyword False Positive

Contoh:

```text
"Jangan review Keychron V1 bang"
```

Sistem dapat menemukan:

```text
review
+
keychron v1
```

dan menganggapnya sebagai request.

**Mitigasi:**

Dinyatakan sebagai keterbatasan rule-based matching dan dilakukan sampling hasil untuk melihat tingkat kesesuaian.

---

## Product Ambiguity

Contoh keyword:

```text
V1
```

dapat merujuk pada produk lain.

**Mitigasi:**

Gunakan keyword yang lebih spesifik.

---

## Spam Comments

Satu pengguna dapat melakukan request berkali-kali.

**Mitigasi:**

Gunakan:

```text
Unique Requester
```

sebagai salah satu kriteria.

---

## Bobot SAW Tidak Memiliki Dasar

Bobot tidak boleh ditentukan hanya berdasarkan asumsi developer.

**Mitigasi:**

Gunakan:

* wawancara;
* expert judgement;
* penelitian terdahulu.

---

# 37. MVP Success Criteria

MVP dianggap selesai apabila:

* [ ] User dapat membuat analysis project.
* [ ] User dapat memasukkan video YouTube.
* [ ] Sistem dapat mengambil komentar melalui YouTube API.
* [ ] Komentar berhasil disimpan ke PostgreSQL.
* [ ] User dapat memasukkan kandidat produk.
* [ ] User dapat menentukan keyword produk.
* [ ] Sistem dapat mendeteksi mention produk.
* [ ] Sistem dapat mendeteksi request secara rule-based.
* [ ] Sistem dapat menghitung empat nilai kriteria.
* [ ] Sistem dapat melakukan normalisasi SAW.
* [ ] Sistem dapat menghitung final score.
* [ ] Sistem dapat menghasilkan ranking.
* [ ] Detail perhitungan dapat dilihat.
* [ ] Hasil SAW sesuai dengan perhitungan manual.

---

# 38. Urutan Implementasi

## Phase 1 — Proof of Concept

```text
YouTube Data API
        ↓
videoId
        ↓
fetch comments
        ↓
JSON
```

Target:

Pastikan API bekerja.

---

## Phase 2 — Backend Foundation

Setup:

```text
Bun
ElysiaJS
PostgreSQL
Migration
Environment
```

Implementasikan:

```text
Project
Video
Comment
Product
```

---

## Phase 3 — YouTube Integration

Implementasikan:

```text
video URL parser

commentThreads.list

pagination

database persistence
```

---

## Phase 4 — Comment Processing

Implementasikan:

```text
preprocessing

product keyword matching

request keyword matching

comment match persistence
```

---

## Phase 5 — Metrics

Implementasikan:

```text
Request Count

Unique Requester

Average Request Likes

Recent Request Ratio
```

---

## Phase 6 — SAW

Implementasikan:

```text
decision matrix

normalization

weighting

final score

ranking
```

Lakukan verifikasi menggunakan spreadsheet.

---

## Phase 7 — Frontend

Bangun Svelte UI untuk:

```text
projects

videos

products

comments

criteria

ranking
```

Prioritaskan functionality, bukan visual.

---

## Phase 8 — Research Testing

Lakukan:

```text
black box testing

manual SAW comparison

user validation

documentation
```

---

# 39. Prioritas Pengembangan

Urutan prioritas:

**P0 — wajib**

```text
YouTube API
Comment Storage
Product
Keyword Matching
Metrics
SAW
Ranking
```

**P1 — penting**

```text
Analysis Project
Criteria Configuration
Comment Audit
Ranking Detail
```

**P2 — optional**

```text
Authentication
Charts
Dashboard statistik
Deployment
Docker
```

Untuk target penyelesaian skripsi, fitur P2 tidak boleh menjadi blocker.

---

# 40. Definition of Done

Produk dianggap memenuhi kebutuhan penelitian apabila dapat membuktikan alur berikut secara end-to-end:

```text
Komentar Audiens YouTube
          ↓
Data Interaksi
          ↓
Request Identification
          ↓
Criteria Values
          ↓
SAW Normalization
          ↓
Weighted Score
          ↓
Ranking Produk
          ↓
Prioritas Produk Review
```

Inti penelitian bukan kompleksitas aplikasi, tetapi kemampuan sistem mengubah data interaksi audiens menjadi informasi terstruktur yang dapat digunakan dalam proses pengambilan keputusan menggunakan metode SAW.
