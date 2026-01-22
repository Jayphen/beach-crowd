# Cloudflare D1 + R2 Setup Guide

This guide walks you through setting up Cloudflare D1 (SQLite database) and R2 (object storage) for the BeachWatch project.

## Prerequisites

- Cloudflare account (free tier works)
- Wrangler CLI installed (`npm install -g wrangler` or use `npx wrangler`)
- Authenticated with Cloudflare (`wrangler login`)

## Step 1: Create D1 Database

Create a new D1 database for BeachWatch:

```bash
wrangler d1 create beachwatch-db
```

This will output something like:
```
✅ Successfully created DB 'beachwatch-db'
Created your database using D1's new storage backend.

[[d1_databases]]
binding = "DB"
database_name = "beachwatch-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Copy the `database_id` value** and update it in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "beachwatch-db"
database_id = "YOUR-DATABASE-ID-HERE"  # Replace with actual ID
```

## Step 2: Initialize Database Schema

Run the schema SQL to create tables:

```bash
wrangler d1 execute beachwatch-db --file=./schema.sql
```

Verify tables were created:

```bash
wrangler d1 execute beachwatch-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

You should see: `beaches`, `snapshots`, `busyness_scores`

## Step 3: Seed Beach Data

Generate and insert beach data:

```bash
npm run d1:seed
```

This creates `scripts/seed-beaches.sql`. Then run:

```bash
wrangler d1 execute beachwatch-db --file=./scripts/seed-beaches.sql
```

Verify beaches were inserted:

```bash
wrangler d1 execute beachwatch-db --command="SELECT id, name, active FROM beaches;"
```

## Step 4: Create R2 Bucket

Create an R2 bucket for storing beach images:

```bash
wrangler r2 bucket create beachwatch-images
```

Verify bucket exists:

```bash
wrangler r2 bucket list
```

The bucket binding is already configured in `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "IMAGES"
bucket_name = "beachwatch-images"
```

## Step 5: Configure Environment Variables

For local development, create a `.dev.vars` file (not tracked in git):

```bash
# .dev.vars
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
R2_BUCKET_NAME=beachwatch-images
D1_DATABASE_ID=your-database-id
```

Get your account ID:

```bash
wrangler whoami
```

## Step 6: Test Locally

Start the local development server:

```bash
npm run dev
# or
wrangler dev
```

Open http://localhost:8787 to see the API documentation.

Test endpoints:
- http://localhost:8787/api/beaches - List all beaches
- http://localhost:8787/api/current - Get all current beach statuses

## Step 7: Deploy to Production

Deploy the Worker:

```bash
npm run deploy
# or
wrangler deploy
```

Your worker will be deployed to `https://beachwatch.YOUR-SUBDOMAIN.workers.dev`

## Step 8: Run a Test Scrape

Run the scraper to capture a screenshot and upload it:

```bash
npm run scrape:bondi
```

The scraper will:
1. Capture a screenshot
2. Analyze it with YOLO
3. Upload image to R2
4. Store metadata in D1

Check the data:

```bash
wrangler d1 execute beachwatch-db --command="SELECT * FROM snapshots ORDER BY captured_at DESC LIMIT 5;"
```

## API Endpoints

Once deployed, you can access:

- **GET** `/api/beaches` - List all beaches
- **GET** `/api/beaches/:id` - Get beach details
- **GET** `/api/beaches/:id/latest` - Get latest snapshot
- **GET** `/api/beaches/:id/history` - Get snapshot history
- **GET** `/api/beaches/:id/stats` - Get statistics
- **GET** `/api/beaches/:id/hourly` - Get hourly averages
- **GET** `/api/current` - All current beach statuses
- **GET** `/images/:key` - Serve images from R2

## Scheduled Scraping (Optional)

To enable automatic scraping every 10 minutes, the cron trigger is already configured in `wrangler.toml`:

```toml
[triggers]
crons = ["*/10 * * * *"]
```

The scheduled task will run the `scheduled()` handler in `src/index.js`.

**Note:** You'll need to set up an external scraper service since Playwright can't run inside Workers. The Worker provides the API and storage layer.

## Database Queries

Some useful queries:

### Get current status for all beaches
```sql
SELECT
  b.name,
  s.captured_at,
  bs.busyness_score,
  bs.person_count
FROM beaches b
LEFT JOIN snapshots s ON b.id = s.beach_id
LEFT JOIN busyness_scores bs ON s.id = bs.snapshot_id
WHERE b.active = 1
ORDER BY s.captured_at DESC;
```

### Get 24-hour history for Bondi
```sql
SELECT
  s.captured_at,
  bs.busyness_score,
  bs.person_count
FROM snapshots s
JOIN busyness_scores bs ON s.id = bs.snapshot_id
WHERE s.beach_id = 'bondi'
  AND s.captured_at >= unixepoch('now', '-1 day')
ORDER BY s.captured_at DESC;
```

## Troubleshooting

### D1 Database not found
Make sure you've copied the correct `database_id` from the `wrangler d1 create` output into `wrangler.toml`.

### R2 Bucket access denied
Ensure your API token has R2 permissions. Generate a new token with R2 read/write access.

### Images not uploading
Check that `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` are set in your environment or `.dev.vars` file.

### Worker deployment fails
Run `wrangler whoami` to verify authentication. Run `wrangler deploy --dry-run` to check for configuration errors.

## Costs

- **D1**: Free tier includes 5GB storage + 5M reads/day
- **R2**: Free tier includes 10GB storage + 1M Class A operations/month
- **Workers**: Free tier includes 100k requests/day

For BeachWatch scraping every 10 minutes:
- ~144 scrapes/day × 4 beaches = 576 requests/day
- Well within free tier limits

## Next Steps

1. Set up a separate scraping service (e.g., GitHub Actions, Cron job on server)
2. Configure the scraper to call your Worker's API
3. Set up monitoring and alerts
4. Add authentication for write operations
5. Configure a custom domain for R2 public access

## Support

- Cloudflare Docs: https://developers.cloudflare.com/
- D1 Documentation: https://developers.cloudflare.com/d1/
- R2 Documentation: https://developers.cloudflare.com/r2/
- Workers Documentation: https://developers.cloudflare.com/workers/
