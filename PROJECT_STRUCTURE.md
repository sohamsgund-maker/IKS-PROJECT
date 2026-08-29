# 📁 CineVerse - Project File Directory & Architecture

Complete structural blueprint and directory breakdown for the **CineVerse** entertainment and movie streaming web application.

---

## 🌳 File Tree

```
c:/Users/Aditya Yadav/Downloads/Aditya Proj/
│
├── 📄 index.html                       # Main HTML entry point (CineVerse title, favicon & viewport)
├── 📄 package.json                     # Project dependencies & scripts (React 19, Tailwind 4, Vite)
├── 📄 package-lock.json                # Locked dependency tree
├── 📄 tsconfig.json                    # Root TypeScript configuration
├── 📄 tsconfig.app.json                # Application TypeScript configuration
├── 📄 tsconfig.node.json               # Node / Vite TypeScript configuration
├── 📄 vite.config.ts                   # Vite build tool and plugins configuration
├── 📄 .oxlintrc.json                   # Linter rules configuration
├── 📄 .gitignore                       # Git ignored files and directories
├── 📄 README.md                        # Project documentation and run guide
├── 📄 PROJECT_STRUCTURE.md             # Complete directory and architecture guide (This file)
│
└── 📁 src/                             # Source code root
    ├── 📄 main.tsx                     # React application root DOM mount point
    ├── 📄 App.tsx                      # Main app shell: routing, state, modals & layout coordination
    ├── 📄 index.css                    # Global cinematic styling, custom scrollbars & dark theme
    ├── 📄 App.css                      # Component-level utility styles
    │
    ├── 📁 types/                       # TypeScript Type Definitions
    │   └── 📄 movie.ts                 # Data models: Movie, VideoSource, Episode, Review, DownloadItem
    │
    ├── 📁 data/                        # Static and Mock Data Stores
    │   └── 📄 moviesData.ts            # Curated movie catalog, MP4 streams, YouTube trailers, genres & cast
    │
    └── 📁 components/                  # UI Components
        ├── 📄 Navbar.tsx               # Sticky translucent header with search, tabs & profile switcher
        ├── 📄 HeroBanner.tsx           # Auto-cycling billboard banner with quick playback actions
        ├── 📄 MovieCard.tsx            # Netflix-style cards with Top 10 badges & hover preview actions
        ├── 📄 MovieRow.tsx             # Horizontal category sliders with smooth scroll arrow controls
        ├── 📄 VideoPlayerModal.tsx     # Full video player (Direct MP4, YouTube HD trailers & downloader)
        ├── 📄 MovieDetailsModal.tsx    # Modal with cast grid, episode list, similar titles & reviews
        ├── 📄 CustomStreamModal.tsx    # Modal to input & stream any custom MP4 or YouTube video URL
        ├── 📄 DownloadManagerModal.tsx # Offline downloads manager tracking files and device storage
        └── 📄 FilterBar.tsx            # Genre chips, media-type toggles & sorting controls
```

---

## 🧩 Component & Module Responsibilities

| File Path | Role & Key Features |
| :--- | :--- |
| [`src/App.tsx`](file:///c:/Users/Aditya%20Yadav/Downloads/Aditya%20Proj/src/App.tsx) | Coordinates active views (`home`, `movies`, `series`, `open_movies`, `watchlist`), manages modals, watchlist persistence, and filter pipelines. |
| [`src/types/movie.ts`](file:///c:/Users/Aditya%20Yadav/Downloads/Aditya%20Proj/src/types/movie.ts) | Strict TypeScript schemas for all media, genres, reviews, playback states, and download items. |
| [`src/data/moviesData.ts`](file:///c:/Users/Aditya%20Yadav/Downloads/Aditya%20Proj/src/data/moviesData.ts) | Rich collection of 30+ titles including Hollywood hits with official HD trailers, open 4K movies with direct MP4 streams, and series. |
| [`src/components/Navbar.tsx`](file:///c:/Users/Aditya%20Yadav/Downloads/Aditya%20Proj/src/components/Navbar.tsx) | Responsive navigation header with live search, dynamic watchlist/downloads badges, and profile menu. |
| [`src/components/HeroBanner.tsx`](file:///c:/Users/Aditya%20Yadav/Downloads/Aditya%20Proj/src/components/HeroBanner.tsx) | High-impact spotlight banner featuring blockbusters with ratings, genres, and instant play buttons. |
| [`src/components/MovieCard.tsx`](file:///c:/Users/Aditya%20Yadav/Downloads/Aditya%20Proj/src/components/MovieCard.tsx) | Interactive movie poster card featuring hover zoom, Top 10 badges, and quick-action overlay buttons. |
| [`src/components/MovieRow.tsx`](file:///c:/Users/Aditya%20Yadav/Downloads/Aditya%20Proj/src/components/MovieRow.tsx) | Horizontal scrolling carousel row with smooth scroll arrows and category metadata. |
| [`src/components/VideoPlayerModal.tsx`](file:///c:/Users/Aditya%20Yadav/Downloads/Aditya%20Proj/src/components/VideoPlayerModal.tsx) | Cinema player with HTML5 controls (seek, speed 0.5x–2x, volume, PiP, fullscreen) + YouTube trailer mode + file downloader. |
| [`src/components/MovieDetailsModal.tsx`](file:///c:/Users/Aditya%20Yadav/Downloads/Aditya%20Proj/src/components/MovieDetailsModal.tsx) | Tabbed detail drawer with cast gallery, TV episode player, similar movies, and interactive star rating system. |
| [`src/components/CustomStreamModal.tsx`](file:///c:/Users/Aditya%20Yadav/Downloads/Aditya%20Proj/src/components/CustomStreamModal.tsx) | Allows users to paste any video/movie link (MP4/YouTube) to stream and download on the spot. |
| [`src/components/DownloadManagerModal.tsx`](file:///c:/Users/Aditya%20Yadav/Downloads/Aditya%20Proj/src/components/DownloadManagerModal.tsx) | Tracks saved offline files, calculating storage usage and providing immediate playback/save triggers. |
| [`src/components/FilterBar.tsx`](file:///c:/Users/Aditya%20Yadav/Downloads/Aditya%20Proj/src/components/FilterBar.tsx) | Media type tabs (All, Movies, TV Series, Free Open Movies), genre pills, and sort dropdown. |

---

## 🛠️ Tech Stack

- **Frontend Core**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS 4 + Glassmorphism & Custom Keyframe Glows
- **Icons**: Lucide React
- **Animations / Effects**: Canvas-Confetti, Tailwind Transitions & Smooth Scrolling
- **State & Storage**: React State Hooks + Browser `localStorage` Persistence
