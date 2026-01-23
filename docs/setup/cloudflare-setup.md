# Cloudflare Infrastructure Setup Guide

This guide walks you through setting up the Cloudflare infrastructure for BeachWatch, including D1 database, R2 storage, and Workers.

## Prerequisites

- Cloudflare account (free tier works for development)
- Wrangler CLI installed: `npm install -g wrangler`
- Authenticated with Cloudflare: `wrangler login`

## Table of Contents

1. [D1 Database Setup](#d1-database-setup)
2. [R2 Bucket Configuration](#r2-bucket-configuration)
3. [Cloudflare Workers Setup](#cloudflare-workers-setup)
4. [Environment Variables](#environment-variables)
5. [Local Development](#local-development)
6. [Deployment](#deployment)

---

## D1 Database Setup

### Create D1 Database

```bash
# Create the D1 database
wrangler d1 create beachwatch-db

# Note: Save the database_id from the output - you'll need it for wrangler.toml
```

The output will look like:
```
✅ Successfully created DB 'beachwatch-db'

[[d1_databases]]
binding = "DB"
database_name = "beachwatch-db"
database_id = "your-database-id-here"
```

### Database Schema

The database uses three main tables:

#### 1. `beaches` table
Stores information about each monitored beach.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Unique beach identifier (e.g., 'bondi', 'manly') |
| name | TEXT NOT NULL | Display name (e.g., 'Bondi Beach') |
| location | TEXT NOT NULL | Location description (e.g., 'Eastern Suburbs, Sydney') |
| webcam_url | TEXT NOT NULL | URL to the beach webcam |
| latitude | REAL | GPS latitude for mapping |
| longitude | REAL | GPS longitude for mapping |
| beach_area_sqm | INTEGER | Approximate beach area in square meters (for busyness calculations) |
| active | INTEGER DEFAULT 1 | Whether beach is actively monitored (1=yes, 0=no) |
| created_at | INTEGER NOT NULL | Unix timestamp when beach was added |

#### 2. `snapshots` table
Stores metadata for each webcam capture.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Unique snapshot ID (UUID) |
| beach_id | TEXT NOT NULL | Foreign key to beaches.id |
| image_url | TEXT NOT NULL | R2 URL for the captured image |
| captured_at | INTEGER NOT NULL | Unix timestamp when snapshot was taken |
| weather_condition | TEXT | Optional: weather at capture time (e.g., 'sunny', 'cloudy') |
| temperature_celsius | REAL | Optional: temperature in Celsius |
| processing_status | TEXT DEFAULT 'pending' | Status: 'pending', 'processing', 'completed', 'failed' |
| created_at | INTEGER NOT NULL | Unix timestamp when record was created |

#### 3. `busyness_scores` table
Stores analysis results for each snapshot.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Unique score ID (UUID) |
| snapshot_id | TEXT NOT NULL | Foreign key to snapshots.id |
| person_count | INTEGER NOT NULL | Number of people detected |
| busyness_score | INTEGER NOT NULL | Normalized score 0-100 |
| detection_method | TEXT NOT NULL | Method used: 'yolov8', 'pixel_density', 'fallback' |
| confidence | REAL | Confidence level of detection (0.0-1.0) |
| analysis_duration_ms | INTEGER | Time taken to analyze in milliseconds |
| metadata | TEXT | JSON string with additional analysis data |
| created_at | INTEGER NOT NULL | Unix timestamp when analysis completed |

### Initialize Database Schema

```bash
# Apply the schema from schema.sql
wrangler d1 execute beachwatch-db --file=./schema.sql

# For local development database
wrangler d1 execute beachwatch-db --local --file=./schema.sql
```

### Database Indexes

The schema includes indexes for common query patterns:
- `idx_snapshots_beach_id` - Fast lookups by beach
- `idx_snapshots_captured_at` - Time-based queries
- `idx_busyness_snapshot_id` - Join optimization

---

## R2 Bucket Configuration

### Create R2 Bucket

```bash
# Create the R2 bucket for storing webcam images
wrangler r2 bucket create beachwatch-images

# Optional: Create a separate bucket for production
wrangler r2 bucket create beachwatch-images-prod
```

### Bucket Structure

Images are organized by date and beach:
```
beachwatch-images/
├── 2026/
│   ├── 01/
│   │   ├── 23/
│   │   │   ├── bondi-1706025600-abc123.jpg
│   │   │   ├── bondi-1706026200-def456.jpg
│   │   │   └── manly-1706025600-ghi789.jpg
│   │   └── 24/
│   └── 02/
```

**Naming convention:** `{beach_id}-{unix_timestamp}-{random_id}.jpg`

### R2 Bucket Configuration

- **Public Access:** Not enabled by default (access via Workers)
- **Lifecycle Policy:** Configure retention rules to keep only:
  - Last 7 days: All images
  - 8-30 days: 1 image per hour
  - 31-90 days: 1 image per day
  - Beyond 90 days: Delete

To configure lifecycle policy:
```bash
# Create lifecycle.json with the policy
# Then apply it (when Wrangler supports it, or use Cloudflare Dashboard)
```

### R2 Access from Workers

R2 binding is configured in `wrangler.toml`:
```toml
[[r2_buckets]]
binding = "IMAGES"
bucket_name = "beachwatch-images"
```

---

## Cloudflare Workers Setup

### Worker Structure

The project will use Cloudflare Workers for:
1. **Scraper Worker** - Captures webcam screenshots (scheduled via Cron)
2. **Analysis Worker** - Processes images with YOLOv8 (triggered by scraper)
3. **API Worker** - Serves data to frontend (Hono-based REST API)

### Initial Worker Setup

```bash
# The wrangler.toml in this repo is pre-configured
# To deploy a worker:
wrangler deploy

# To develop locally:
wrangler dev
```

### Worker Bindings

Each worker has access to:
- **D1 Database** - Via `env.DB`
- **R2 Bucket** - Via `env.IMAGES`
- **Environment Variables** - Via `env.VARIABLE_NAME`

### Cron Triggers

Configured in `wrangler.toml`:
- Every 10 minutes: Scrape all active beaches
- Every hour: Update prediction models
- Daily at midnight: Cleanup old images

---

## Environment Variables

### Required Variables

Create a `.dev.vars` file for local development:
```bash
# .dev.vars (local development only - DO NOT commit)
YOLO_API_ENDPOINT=http://localhost:8000/detect
YOLO_API_KEY=your-dev-api-key
```

### Production Secrets

Set production secrets via Wrangler:
```bash
# Set production environment variables
wrangler secret put YOLO_API_ENDPOINT
# Enter value: https://your-yolo-api.com/detect

wrangler secret put YOLO_API_KEY
# Enter value: your-production-api-key
```

### Optional Variables

```bash
# Optional: Weather API integration (Phase 2)
wrangler secret put WEATHER_API_KEY

# Optional: Monitoring/logging
wrangler secret put SENTRY_DSN
```

---

## Local Development

### 1. Start Local D1 Database

```bash
# This creates a local SQLite database
wrangler d1 execute beachwatch-db --local --file=./schema.sql
```

### 2. Run Worker Locally

```bash
# Start the worker in development mode
wrangler dev

# Access at http://localhost:8787
```

### 3. Test Database Queries

```bash
# Execute SQL queries locally
wrangler d1 execute beachwatch-db --local --command="SELECT * FROM beaches;"
```

### 4. Test R2 Locally

Local R2 is automatically simulated by Wrangler's local storage.

---

## Deployment

### Deploy to Production

```bash
# Deploy all resources
wrangler deploy

# Deploy with specific environment
wrangler deploy --env production
```

### Verify Deployment

```bash
# Test the deployed worker
curl https://beachwatch.your-worker.workers.dev/api/beaches

# Check D1 connection
wrangler d1 execute beachwatch-db --command="SELECT COUNT(*) FROM beaches;"
```

### Initial Data Seed

After deploying, seed the beaches table:
```bash
# Run the seed script (to be created)
wrangler d1 execute beachwatch-db --file=./seed-beaches.sql
```

---

## Monitoring & Debugging

### View Worker Logs

```bash
# Stream live logs
wrangler tail

# Filter logs
wrangler tail --format pretty
```

### D1 Analytics

Access via Cloudflare Dashboard:
- Database size and row counts
- Query performance
- Error rates

### R2 Metrics

Monitor via Cloudflare Dashboard:
- Storage usage
- Request counts
- Bandwidth usage

---

## Cost Estimates

### Free Tier Limits

**D1:**
- 5 GB storage
- 5 million row reads/day
- 100,000 row writes/day

**R2:**
- 10 GB storage
- No egress fees (major advantage over S3)

**Workers:**
- 100,000 requests/day
- 10ms CPU time per request

### Expected Usage (5 beaches)

- **D1 writes:** ~720/day (5 beaches × 144 snapshots/day)
- **D1 reads:** ~50,000/day (estimated API traffic)
- **R2 storage:** ~2 GB/month (with lifecycle policy)
- **Workers requests:** ~10,000/day

✅ **Well within free tier limits**

---

## Troubleshooting

### Common Issues

**Issue:** "Database not found"
```bash
# Solution: Ensure database is created and binding name matches wrangler.toml
wrangler d1 list
```

**Issue:** "R2 bucket access denied"
```bash
# Solution: Verify bucket name and binding
wrangler r2 bucket list
```

**Issue:** "Worker deployment failed"
```bash
# Solution: Check syntax and validate wrangler.toml
wrangler deploy --dry-run
```

### Getting Help

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [R2 Documentation](https://developers.cloudflare.com/r2/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)

---

## Next Steps

1. ✅ Create D1 database
2. ✅ Create R2 bucket
3. ✅ Initialize schema
4. ⬜ Seed initial beach data
5. ⬜ Build scraper worker
6. ⬜ Build API worker
7. ⬜ Deploy and test

---

**Last Updated:** 2026-01-23
**Version:** 1.0
