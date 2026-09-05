# Dual-Mode API Adapter

Frontend menyediakan lapisan adapter API yang mendukung dua mode: mode mock (in-memory dengan dataset realistis komentar YouTube) dan mode REST API nyata (`http://localhost:3000`). Keputusan ini diambil agar frontend dapat dikembangkan, diuji, dan didemokan secara independen tanpa bergantung pada kesiapan backend ElysiaJS atau ketersediaan koneksi database/internet saat presentasi skripsi.
