# BeachWatch - Real-time Beach Crowd Monitoring

A full-stack beach crowd monitoring application for Sydney beaches using computer vision, SvelteKit, and Cloudflare infrastructure.

## Architecture

This is a monorepo containing:

- **Frontend** (`src/`): SvelteKit application with Tailwind CSS
- **Backend** (`worker/`): Cloudflare Workers API with Hono
- **Scraper**: Playwright-based webcam screenshot capture
- **ML Pipeline**: YOLO-based crowd detection

## Tech Stack

### Frontend
- **Framework**: SvelteKit 2.x with TypeScript
- **Styling**: Tailwind CSS v4
- **Deployment**: Cloudflare Pages
- **Build Tool**: Vite

### Backend
- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Deployment**: Wrangler 4.x

### ML & Computer Vision
- **Detection**: YOLOv8
- **Scraping**: Playwright

## Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run install:browsers

# Set up Python environment for YOLO
npm run setup:python
```

### Development

#### Frontend Development

```bash
# Start SvelteKit dev server (http://localhost:5173)
npm run dev
```

#### Backend Development

```bash
# Start Cloudflare Workers dev server
npm run worker:dev
```

#### Database Setup

```bash
# Initialize D1 database
npm run d1:init

# Seed with beach data
npm run d1:seed
```

### Scraping & Testing

```bash
# Scrape all beaches
npm run scrape:all

# Scrape specific beach
npm run scrape:bondi
npm run scrape:manly
npm run scrape:coogee
npm run scrape:maroubra

# Test YOLO integration
npm run test:yolo
```

## Project Structure

```
beach-crowd/
├── src/                      # SvelteKit frontend
│   ├── routes/              # Page routes
│   │   ├── +page.svelte    # Homepage with beach list
│   │   ├── +layout.svelte  # Root layout
│   │   └── beaches/[id]/   # Beach detail pages
│   ├── lib/                # Shared components & utilities
│   ├── app.html            # HTML template
│   └── app.css             # Global styles (Tailwind)
│
├── worker/                  # Cloudflare Workers API
│   ├── index.js            # Worker entry point
│   ├── lib/
│   │   ├── db.js          # D1 database helpers
│   │   ├── r2.js          # R2 storage helpers
│   │   └── scraper.js     # Scraper utilities
│   └── routes/
│       └── api.js         # API routes
│
├── static/                 # Static assets
├── screenshots/            # Captured webcam images
├── scripts/               # Utility scripts
│
├── multi-beach-scraper.js  # Main scraper
├── yolo-integration.js     # YOLO detection
├── beaches-config.json     # Beach & webcam config
├── schema.sql             # Database schema
├── wrangler.toml          # Workers configuration
├── svelte.config.js       # SvelteKit configuration
└── package.json           # Dependencies & scripts
```

## API Endpoints

The Cloudflare Workers API provides:

- `GET /api/beaches` - List all beaches
- `GET /api/beaches/:id` - Get beach details
- `GET /api/beaches/:id/current` - Current crowd status
- `GET /api/beaches/:id/history` - Historical data
- `GET /api/beaches/compare` - Compare multiple beaches

## Building & Deployment

### Build Frontend

```bash
# Build SvelteKit for production
npm run build

# Preview production build
npm run preview
```

### Deploy Workers API

```bash
# Deploy to development
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

### Deploy to Cloudflare Pages

The SvelteKit app can be deployed to Cloudflare Pages:

1. Connect your repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set build output directory: `.svelte-kit/output/cloudflare`
4. Deploy!

## Configuration

### Environment Variables

For local development, create `.dev.vars`:

```env
YOLO_API_ENDPOINT=http://localhost:8000/detect
YOLO_API_KEY=dev-key
```

For production, use Wrangler secrets:

```bash
wrangler secret put YOLO_API_ENDPOINT
wrangler secret put YOLO_API_KEY
```

### Beach Configuration

Edit `beaches-config.json` to add/modify beaches and webcam sources.

### Cloudflare Resources

Update `wrangler.toml` with your:
- Account ID
- D1 Database ID
- R2 Bucket names

## Supported Beaches (MVP)

- ✅ **Bondi Beach** - 2 webcam sources
- ✅ **Manly Beach** - 1 webcam source
- ✅ **Coogee Beach** - 1 webcam source
- ✅ **Maroubra Beach** - 2 webcam sources

## Features

### Frontend
- 🎨 Modern, responsive UI with Tailwind CSS
- 📊 Real-time beach status indicators
- 📱 Mobile-friendly design
- ⚡ Fast page loads with SvelteKit

### Backend
- 🏖️ Multi-beach support
- 📸 Automated webcam scraping
- 🤖 AI-powered crowd detection (YOLO)
- 📈 Historical data tracking
- 🔄 Scheduled updates via Cron
- 💾 Efficient image storage (R2)
- 🗄️ Structured data (D1 SQLite)

## Scripts Reference

### Frontend
- `npm run dev` - Start SvelteKit dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Type check

### Backend
- `npm run worker:dev` - Start Workers dev server
- `npm run deploy` - Deploy to Cloudflare
- `npm run deploy:dev` - Deploy to dev environment
- `npm run deploy:prod` - Deploy to production

### Database
- `npm run d1:init` - Initialize database schema
- `npm run d1:seed` - Seed beach data
- `npm run d1:query` - Run custom query

### Scraping
- `npm run scrape:all` - Scrape all beaches
- `npm run scrape:bondi` - Scrape Bondi
- `npm run scrape:manly` - Scrape Manly
- `npm run scrape:coogee` - Scrape Coogee
- `npm run scrape:maroubra` - Scrape Maroubra

### Testing
- `npm run test` - Run end-to-end tests (scraper → API → frontend)
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:yolo` - Test YOLO detection

## Documentation

- [API Deployment Guide](./API-DEPLOYMENT.md)
- [Cloudflare Setup](./SETUP-CLOUDFLARE-D1-R2.md)
- [YOLO Integration](./YOLO-INTEGRATION-README.md)
- [Scraper Documentation](./README-scraper.md)

## License

ISC

## Repository

https://github.com/jayphen/beach-crowd
