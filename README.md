# Vocab Sprint

Aplikasi sprint harian untuk menuntaskan kosakata Oxford 3000 (level A1–B2). Satu kartu dalam satu waktu, dengan target harian, spaced repetition, kuis, dan pelafalan.

Dibuat oleh Fauzul Azkia untuk MLH Global Hack Week: Builders Week 2026.

## Fitur

- Target harian dihitung dari sisa kata dan sisa hari sprint
- Kartu flashcard: **Udah tahu** (langsung dikuasai) dan **Hafalin** (ulangan setelah 1, 3, lalu 7 hari)
- Pelafalan aksen US dan UK lewat Web Speech API, plus fonetik
- Kuis 10 soal acak
- Progres per level CEFR dan kalender aktivitas
- Cadangan JSON untuk pindah perangkat

## Pintasan keyboard

| Tombol | Hari Ini | Ulangan |
| --- | --- | --- |
| `Spasi` | Lihat arti dan putar audio | Lihat jawaban dan putar audio |
| `1` | Udah tahu | Lupa |
| `2` | Hafalin | Ingat |
| `A` | Putar pelafalan | Putar pelafalan |

## Menjalankan

```bash
npm install
npm run dev
npm run build
```

Server pengembangan berjalan di [http://localhost:3000/vocab-sprint/](http://localhost:3000/vocab-sprint/). Halaman produk ada di `landing.html`, aplikasi di `index.html`.

## Data

Daftar kata berasal dari Oxford 3000 (`public/oxford_3000.csv`): 3.805 kartu, level A1–B2. Satu kata bisa punya lebih dari satu kartu bila makna atau jenis katanya berbeda.

## Privasi

Progres disimpan di `localStorage` pada peramban (kunci `vocabSprint.v1`). Tidak ada akun, tidak ada server, dan tidak ada pelacakan.

## Lisensi

MIT. Copyright 2026 Fauzul Azkia.
