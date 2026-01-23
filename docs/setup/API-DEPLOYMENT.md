# BeachWatch API Deployment Guide

This guide covers deploying the BeachWatch Cloudflare Workers API.

## Prerequisites

1. [Cloudflare account](https://dash.cloudflare.com/sign-up)
2. [Node.js](https://nodejs.org/) (v16+)
3. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed globally

```bash
npm install -g wrangler
```

## Initial Setup

### 1. Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window to authorize Wrangler with your Cloudflare account.

### 2. Get Your Account ID

```bash
wrangler whoami
```

Copy your account ID and update `wrangler.toml`:

```toml
account_id = "your-account-id-here"
```

### 3. Create D1 Database

Create the database for storing beach data and snapshots:

```bash
wrangler d1 create beachwatch-db
```

Copy the `database_id` from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "beachwatch-db"
database_id = "your-database-id-here"
```

### 4. Initialize Database Schema

Run the schema SQL to create tables and indexes:

```bash
wrangler d1 execute beachwatch-db --file=./schema.sql
```

### 5. Seed Beach Data

Generate and seed the beaches configuration:

```bash
npm run d1:seed
wrangler d1 execute beachwatch-db --file=./scripts/seed-beaches.sql
```

### 6. Create R2 Bucket

Create the R2 bucket for storing beach webcam images:

```bash
wrangler r2 bucket create beachwatch-images
```

The bucket name `beachwatch-images` should match the `bucket_name` in `wrangler.toml`.

### 7. Set Production Secrets

Set sensitive environment variables using Wrangler secrets:

```bash
wrangler secret put YOLO_API_ENDPOINT
# Enter your YOLO API endpoint URL when prompted

wrangler secret put YOLO_API_KEY
# Enter your YOLO API key when prompted
```

## Local Development

### 1. Create Local Environment Variables

Copy the example file and configure for local development:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` and set your local YOLO API configuration:

```env
YOLO_API_ENDPOINT=http://localhost:8000/detect
YOLO_API_KEY=dev-key
```

### 2. Run Local Development Server

Start the Wrangler dev server:

```bash
npm run dev
# or
wrangler dev
```

This will start a local server at `http://localhost:8787`.

### 3. Test API Endpoints

Test the API is working:

```bash
# List all beaches
curl http://localhost:8787/api/beaches

# Get current status for all beaches
curl http://localhost:8787/api/current

# Get latest snapshot for Bondi Beach
curl http://localhost:8787/api/beaches/bondi/latest
```

## Deployment

### Development Environment

Deploy to the development environment:

```bash
npm run deploy:dev
# or
wrangler deploy --env development
```

The Worker will be available at: `https://beachwatch-dev.YOUR_SUBDOMAIN.workers.dev`

### Production Environment

1. **Update Production Configuration**

   In `wrangler.toml`, ensure production settings are configured:

   ```toml
   [env.production]
   name = "beachwatch-prod"

   [[env.production.d1_databases]]
   binding = "DB"
   database_name = "beachwatch-db"
   database_id = "your-production-database-id-here"

   [[env.production.r2_buckets]]
   binding = "IMAGES"
   bucket_name = "beachwatch-images-prod"
   ```

2. **Create Production Resources**

   ```bash
   # Create production D1 database
   wrangler d1 create beachwatch-db-prod

   # Initialize schema
   wrangler d1 execute beachwatch-db-prod --file=./schema.sql --env production

   # Seed beaches
   npm run d1:seed
   wrangler d1 execute beachwatch-db-prod --file=./scripts/seed-beaches.sql --env production

   # Create production R2 bucket
   wrangler r2 bucket create beachwatch-images-prod
   ```

3. **Set Production Secrets**

   ```bash
   wrangler secret put YOLO_API_ENDPOINT --env production
   wrangler secret put YOLO_API_KEY --env production
   ```

4. **Deploy to Production**

   ```bash
   npm run deploy:prod
   # or
   wrangler deploy --env production
   ```

   The Worker will be available at: `https://beachwatch-prod.YOUR_SUBDOMAIN.workers.dev`

## API Endpoints

Once deployed, your API will be available at these endpoints:

- `GET /api/beaches` - List all active beaches
- `GET /api/beaches/:beachId` - Get beach details
- `GET /api/beaches/:beachId/latest` - Get latest snapshot
- `GET /api/beaches/:beachId/history?limit=100&offset=0` - Get snapshot history
- `GET /api/beaches/:beachId/stats?days=7` - Get beach statistics
- `GET /api/beaches/:beachId/hourly?days=30` - Get hourly averages
- `GET /api/current` - Get current status for all beaches
- `GET /images/:key` - Serve beach images from R2

Visit the root URL `/` for full API documentation.

## Scheduled Tasks

The Worker is configured with cron triggers in `wrangler.toml`:

```toml
[triggers]
crons = [
    "*/10 * * * *",  # Scrape all beaches every 10 minutes
]
```

These scheduled tasks will automatically scrape beaches and update the database.

## Custom Domain (Optional)

To use a custom domain instead of `workers.dev`:

1. Add your domain to Cloudflare
2. Update `wrangler.toml`:

```toml
routes = [
    { pattern = "api.beachwatch.app/*", zone_name = "beachwatch.app" }
]
```

3. Deploy:

```bash
wrangler deploy --env production
```

## Monitoring and Logs

View real-time logs:

```bash
wrangler tail
# or for specific environment
wrangler tail --env production
```

Monitor your Worker in the [Cloudflare Dashboard](https://dash.cloudflare.com) under Workers & Pages.

## Database Management

Query the database directly:

```bash
# Development
wrangler d1 execute beachwatch-db --command="SELECT * FROM beaches"

# Production
wrangler d1 execute beachwatch-db-prod --command="SELECT * FROM beaches" --env production
```

## Troubleshooting

### Worker fails to deploy

- Verify account ID and database IDs are correct in `wrangler.toml`
- Ensure you're authenticated: `wrangler whoami`
- Check for syntax errors in JavaScript files

### Database queries fail

- Verify the database was initialized with schema: `wrangler d1 execute beachwatch-db --file=./schema.sql`
- Check database binding name matches in `wrangler.toml` and code (should be `DB`)

### Images not loading

- Verify R2 bucket was created: `wrangler r2 bucket list`
- Check bucket binding name matches in `wrangler.toml` and code (should be `IMAGES`)
- Ensure images are being uploaded to the correct bucket

### Scheduled tasks not running

- Verify cron triggers are configured in `wrangler.toml`
- Check logs: `wrangler tail --env production`
- Scheduled tasks may take a few minutes to start after deployment

## Next Steps

1. Set up monitoring and alerting
2. Configure custom domain
3. Set up CI/CD for automatic deployments
4. Add rate limiting if needed
5. Configure CORS for your frontend domain

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [R2 Storage Docs](https://developers.cloudflare.com/r2/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
