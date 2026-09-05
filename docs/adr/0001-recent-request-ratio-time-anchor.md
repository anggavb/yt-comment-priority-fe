# Recent Request Ratio Time Anchor

Kriteria C4 (Recent Request Ratio) dihitung relatif terhadap tanggal komentar terbaru dalam dataset (`MAX(comment.published_at)`), bukan terhadap waktu nyata (`NOW()`), dengan rentang waktu yang dapat dikonfigurasi per Analysis Project. Keputusan ini diambil agar pengujian skripsi menggunakan dataset historis (video yang diunggah berbulan-bulan sebelumnya) tidak menghasilkan nilai 0 akibat semua komentar telah melewati ambang waktu saat ini.
