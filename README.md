# 🎬 CineVerse - Streaming & Entertainment Platform

**CineVerse** is a modern, responsive Netflix-style movie and entertainment web application built with **React 19, TypeScript, Vite, and Tailwind CSS 4**.

---

## ✨ Features

- 🎥 **Cinematic Billboard Hero**: Auto-cycling spotlight blockbusters with instant stream & trailer launch.
- ▶️ **Dual-Mode Video Player**:
  - **Direct HD Streaming & Downloading**: Plays real full-length open-source movies (*Tears of Steel*, *Big Buck Bunny*, *Sintel*, etc.) with custom seekbar, speed selector (0.5x–2x), volume, PiP, fullscreen, and video download.
  - **Official HD YouTube Trailers**: Real YouTube trailer embeds for global blockbusters.
- 🔗 **Custom Video Streamer (`+ Custom Stream`)**: Stream and download any external MP4, WebM, or YouTube link directly inside the app.
- 💾 **Offline Downloads Manager**: Save movies for offline viewing and track storage usage.
- ⭐ **Movie Details & Interactive Reviews**: Cast gallery, episodes list for TV series, similar recommendations, and interactive 5-star user reviews.
- 🔍 **Live Search & Deep Filtering**: Search by title, actor, or director, filter by genre chips, and sort by ratings or release year.
- 🔖 **Persistent Watchlist**: "My List" saved in `localStorage`.

---

## 📁 File Structure

For full file-by-file explanations and architectural breakdown, see **[`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md)**.

```
c:/Users/Aditya Yadav/Downloads/Aditya Proj/
├── index.html
├── package.json
├── PROJECT_STRUCTURE.md
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── types/
│   │   └── movie.ts
│   ├── data/
│   │   └── moviesData.ts
│   └── components/
│       ├── Navbar.tsx
│       ├── HeroBanner.tsx
│       ├── MovieCard.tsx
│       ├── MovieRow.tsx
│       ├── VideoPlayerModal.tsx
│       ├── MovieDetailsModal.tsx
│       ├── CustomStreamModal.tsx
│       ├── DownloadManagerModal.tsx
│       └── FilterBar.tsx
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```
