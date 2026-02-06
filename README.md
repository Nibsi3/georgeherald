# George Herald - Redesigned Website

A modern redesign of [georgeherald.com](https://www.georgeherald.com/) built with **Next.js 16**, **TailwindCSS**, **shadcn/ui**, and **Strapi CMS**.

## Project Structure

```
georgeherald/
├── backend/          # Strapi CMS (headless)
├── frontend/         # Next.js frontend
├── scraper/          # Content scraper & Strapi importer
├── scraped-data/     # Scraped content from georgeherald.com
└── README.md
```

## Quick Start

### 1. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

The frontend works immediately with the scraped data (no Strapi needed for preview).

### 2. Backend (Strapi CMS)

```bash
cd backend
npm run develop
# Open http://localhost:1337/admin
```

On first run:
1. Create an admin user at `http://localhost:1337/admin`
2. Go to **Settings > API Tokens** and create a **Full Access** token
3. Go to **Settings > Users & Permissions > Roles > Public**
4. Enable `find` and `findOne` for all content types (Article, Category, Author, Tag, Video, Gallery)

### 3. Import Scraped Content into Strapi

```bash
# Set your Strapi API token
set STRAPI_API_TOKEN=your-token-here

# Run the importer
node scraper/import-to-strapi.js
```

### 4. Re-scrape Content (optional)

```bash
node scraper/scrape.js
```

This pulls fresh content from georgeherald.com's RSS feeds and article pages.

## Content Types (Strapi)

| Content Type | Fields |
|---|---|
| **Article** | title, slug, excerpt, content, featuredImage, category, author, tags, section, isTopStory, isBreaking, isFeatured, viewCount, publishedDate |
| **Category** | name, slug, description, color, parentSection, sortOrder |
| **Author** | name, slug, bio, avatar, email, role |
| **Tag** | name, slug |
| **Video** | title, slug, description, videoUrl, videoFile, thumbnail, category, section, publishedDate, viewCount |
| **Gallery** | title, slug, description, coverImage, images, section, publishedDate |

## Tech Stack

- **Frontend**: Next.js 16, React, TypeScript, TailwindCSS v4, shadcn/ui, Lucide icons
- **CMS**: Strapi v5 (SQLite for dev, PostgreSQL recommended for prod)
- **Scraper**: Node.js, Cheerio, xml2js, Axios

## Scraped Content

- **190 articles** across news, sport, lifestyle, business, etc.
- **75 videos** from news, sport, business, entertainment, lifestyle
- **60 photo galleries** from general, news, schools, special events, sport

## Environment Variables

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your-strapi-api-token
```

## Brand Colors

- **Primary Red**: `#DC2626`
- **Dark Red**: `#991B1B`
- **Black**: `#111111`
- **White**: `#FFFFFF`
