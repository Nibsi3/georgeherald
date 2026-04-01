# georgeherald

<!-- color-strip -->
![build](https://img.shields.io/badge/build-passing-22c55e) ![coverage](https://img.shields.io/badge/coverage-growing-06b6d4) ![focus](https://img.shields.io/badge/focus-product%20quality-a855f7)


Content-heavy local news platform with a Next.js frontend and scraping pipeline used to ingest, normalize, and publish article, gallery, and video feeds.

## What it does
- Homepage and section pages for breaking news, top stories, business, sport, lifestyle, and community content.
- Data-driven cards/rotators for top stories, most-read, ticker updates, galleries, and videos.
- Scraping and feed ingestion utilities to keep the content dataset fresh.
- Structured routes for article detail pages and topic navigation.

## Stack
- Next.js 16 + React 19
- Node.js scraping toolchain (`axios`, `cheerio`, `xml2js`, `node-fetch`)
- Workspace setup with a dedicated `frontend` package

## Local development
```bash
npm install
npm run dev
```

Main scripts:
```bash
npm run build
npm run start
```

## Repository structure
- `frontend/` production web app
- `backend/` supporting assets/utilities
- `scraper/` scraping logic and extraction tooling
- `scraped-data/` normalized content snapshots
- `public/` static assets

## Demo
![favicon](backend/favicon.png)
![georgeherald_favicon](frontend/public/georgeherald_favicon.png)

## Practical next improvements
- Add scheduled scraper jobs with health-check reporting.
- Add freshness checks to detect stale categories before deploy.
- Add integration tests around article parsing edge cases.

