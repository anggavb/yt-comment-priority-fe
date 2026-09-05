# YouTube Review Priority System

Sistem pendukung keputusan untuk menentukan prioritas produk yang akan direview oleh kreator konten YouTube berdasarkan analisis interaksi audiens pada komentar video.

## Language

**Analysis Project**:
Wadah terisolasi untuk satu sesi analisis atau eksperimen yang mengelompokkan video, produk kandidat, kriteria, dan hasil perangkingan.
_Avoid_: Workspace, session, dataset

**Candidate Product**:
Alternatif produk yang dievaluasi dalam suatu Analysis Project untuk ditentukan peringkat prioritasnya.
_Avoid_: Item, gadget, barang

**Product Keyword**:
Kata atau frasa kunci spesifik yang merujuk pada suatu Candidate Product untuk mendeteksi kemunculannya di komentar.
_Avoid_: Tag, alias, label

**Request Keyword**:
Kata pemicu umum yang menandakan adanya permintaan ulasan dari audiens (misalnya 'review', 'bahas', 'coba') yang berlaku secara global.
_Avoid_: Trigger word, command, query

**Comment Match**:
Catatan relasi antara sebuah komentar dengan suatu Candidate Product, yang mengidentifikasi status kemunculan produk dan status permintaan ulasan.
_Avoid_: Detection result, parsing result

**Mention**:
Kondisi ketika sebuah komentar terdeteksi memuat minimal satu Product Keyword dari Candidate Product.
_Avoid_: Tagging, reference

**Request**:
Kondisi ketika sebuah komentar yang telah memenuhi status Mention juga memuat minimal satu Request Keyword.
_Avoid_: Demand, order

**Decision Matrix**:
Tabel matriks evaluasi berukuran alternatif dikali kriteria yang berisi nilai metrik terhitung sebelum dinormalisasi menggunakan SAW.
_Avoid_: Raw table, metrics table

**Normalized Matrix**:
Tabel matriks hasil transformasi skala nilai matriks keputusan menggunakan rumus normalisasi atribut benefit pada metode SAW.
_Avoid_: Scaled matrix, standard table

**Weighted Matrix**:
Tabel matriks yang memuat hasil perkalian antara setiap elemen matriks ternormalisasi dengan bobot kriteria yang bersesuaian.
_Avoid_: Scored table, multiplied matrix

**Preference Value**:
Nilai skor akhir suatu Candidate Product yang diperoleh dari penjumlahan seluruh baris nilai terbobot kriteria, yang menjadi dasar penentuan ranking.
_Avoid_: Final score, rank value, total point

**Comment Audit**:
Aktivitas penelaahan dan verifikasi data interaksi komentar untuk memeriksa kesesuaian deteksi kata kunci serta mengidentifikasi false positive.
_Avoid_: Log inspection, data check
