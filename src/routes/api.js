/**
 * API Route Handler with Hono
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
  getActiveBeaches,
  getBeach,
  getLatestSnapshot,
  getCurrentBusyness,
  getSnapshotHistory,
  getAllLatestSnapshots,
  getBeachStatistics,
  getHourlyAverages
} from '../lib/db.js';
import { serveImage } from '../lib/r2.js';

/**
 * Create and configure the Hono app
 */
export function createApp() {
  const app = new Hono();

  // Apply CORS middleware
  app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type']
  }));

  // Route: GET / - API documentation
  app.get('/', (c) => {
    return c.html(getApiDocs());
  });

  // Route: GET /api/beaches - List all active beaches
  app.get('/api/beaches', async (c) => {
    const beaches = await getActiveBeaches(c.env.DB);
    return c.json({ beaches });
  });

  // Route: GET /api/beaches/:beachId - Get beach details
  app.get('/api/beaches/:beachId', async (c) => {
    const beachId = c.req.param('beachId');
    const beach = await getBeach(c.env.DB, beachId);

    if (!beach) {
      return c.json({ error: 'Beach not found' }, 404);
    }

    return c.json({ beach });
  });

  // Route: GET /api/beaches/:beachId/latest - Get latest snapshot
  app.get('/api/beaches/:beachId/latest', async (c) => {
    const beachId = c.req.param('beachId');
    const snapshot = await getLatestSnapshot(c.env.DB, beachId);

    if (!snapshot) {
      return c.json({ error: 'No snapshots found for this beach' }, 404);
    }

    return c.json({ snapshot });
  });

  // Route: GET /api/beaches/:beachId/current - Get current busyness
  app.get('/api/beaches/:beachId/current', async (c) => {
    const beachId = c.req.param('beachId');
    const busyness = await getCurrentBusyness(c.env.DB, beachId);

    if (!busyness) {
      return c.json({ error: 'No busyness data found for this beach' }, 404);
    }

    return c.json({ busyness });
  });

  // Route: GET /api/beaches/:beachId/history - Get snapshot history
  app.get('/api/beaches/:beachId/history', async (c) => {
    const beachId = c.req.param('beachId');
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');

    const history = await getSnapshotHistory(c.env.DB, beachId, limit, offset);
    return c.json({ history, count: history.length });
  });

  // Route: GET /api/beaches/:beachId/stats - Get beach statistics
  app.get('/api/beaches/:beachId/stats', async (c) => {
    const beachId = c.req.param('beachId');
    const daysBack = parseInt(c.req.query('days') || '7');

    const stats = await getBeachStatistics(c.env.DB, beachId, daysBack);
    return c.json({ stats });
  });

  // Route: GET /api/beaches/:beachId/hourly - Get hourly averages
  app.get('/api/beaches/:beachId/hourly', async (c) => {
    const beachId = c.req.param('beachId');
    const daysBack = parseInt(c.req.query('days') || '30');

    const hourly = await getHourlyAverages(c.env.DB, beachId, daysBack);
    return c.json({ hourly });
  });

  // Route: GET /api/current - Get all current beach statuses
  app.get('/api/current', async (c) => {
    const snapshots = await getAllLatestSnapshots(c.env.DB);
    return c.json({ beaches: snapshots, count: snapshots.length });
  });

  // Route: GET /images/* - Serve images from R2
  app.get('/images/*', async (c) => {
    const path = c.req.path;
    const key = path.substring(8); // Remove '/images/' prefix
    return await serveImage(c.env.IMAGES, key);
  });

  // 404 handler
  app.notFound((c) => {
    return c.json({ error: 'Not found' }, 404);
  });

  // Error handler
  app.onError((err, c) => {
    console.error('API error:', err);
    return c.json({
      error: 'Internal server error',
      message: err.message
    }, 500);
  });

  return app;
}

/**
 * API documentation HTML
 */
function getApiDocs() {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>BeachWatch API</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
    h1 { color: #0066cc; }
    h2 { color: #333; margin-top: 30px; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
    .endpoint { margin: 20px 0; }
    .method { display: inline-block; padding: 3px 8px; border-radius: 3px; font-weight: bold; margin-right: 10px; }
    .get { background: #61affe; color: white; }
  </style>
</head>
<body>
  <h1>🏖️ BeachWatch API</h1>
  <p>Real-time beach crowd monitoring for Sydney beaches</p>

  <h2>Endpoints</h2>

  <div class="endpoint">
    <span class="method get">GET</span>
    <code>/api/beaches</code>
    <p>List all active beaches</p>
  </div>

  <div class="endpoint">
    <span class="method get">GET</span>
    <code>/api/beaches/:beachId</code>
    <p>Get details for a specific beach</p>
  </div>

  <div class="endpoint">
    <span class="method get">GET</span>
    <code>/api/beaches/:beachId/latest</code>
    <p>Get the latest snapshot for a beach</p>
  </div>

  <div class="endpoint">
    <span class="method get">GET</span>
    <code>/api/beaches/:beachId/current</code>
    <p>Get current busyness data for a beach</p>
  </div>

  <div class="endpoint">
    <span class="method get">GET</span>
    <code>/api/beaches/:beachId/history?limit=100&offset=0</code>
    <p>Get snapshot history for a beach</p>
  </div>

  <div class="endpoint">
    <span class="method get">GET</span>
    <code>/api/beaches/:beachId/stats?days=7</code>
    <p>Get statistics for a beach (default: last 7 days)</p>
  </div>

  <div class="endpoint">
    <span class="method get">GET</span>
    <code>/api/beaches/:beachId/hourly?days=30</code>
    <p>Get hourly averages for predictions (default: last 30 days)</p>
  </div>

  <div class="endpoint">
    <span class="method get">GET</span>
    <code>/api/current</code>
    <p>Get current status for all beaches</p>
  </div>

  <div class="endpoint">
    <span class="method get">GET</span>
    <code>/images/:key</code>
    <p>Serve beach images from R2 storage</p>
  </div>

  <h2>Example Responses</h2>
  <pre>{
  "snapshot": {
    "id": "abc123...",
    "beach_id": "bondi",
    "image_url": "/images/bondi/2026/01/2026-01-23_14-30-00_bondi-surf-club.png",
    "captured_at": 1737639000,
    "busyness_score": 75,
    "person_count": 120,
    "detection_method": "yolo"
  }
}</pre>

  <pre>{
  "busyness": {
    "beach_id": "bondi",
    "captured_at": 1737639000,
    "busyness_score": 75,
    "person_count": 120,
    "detection_method": "yolo",
    "confidence": 0.92
  }
}</pre>

  <h2>Beach IDs</h2>
  <ul>
    <li><code>bondi</code> - Bondi Beach</li>
    <li><code>manly</code> - Manly Beach</li>
    <li><code>coogee</code> - Coogee Beach</li>
    <li><code>maroubra</code> - Maroubra Beach</li>
  </ul>
</body>
</html>
  `;
}
