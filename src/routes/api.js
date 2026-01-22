/**
 * API Route Handler
 */

import {
  getActiveBeaches,
  getBeach,
  getLatestSnapshot,
  getSnapshotHistory,
  getAllLatestSnapshots,
  getBeachStatistics,
  getHourlyAverages
} from '../lib/db.js';
import { serveImage } from '../lib/r2.js';

/**
 * Router for handling HTTP requests
 */
export async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // Route: GET /api/beaches - List all active beaches
    if (path === '/api/beaches' && request.method === 'GET') {
      const beaches = await getActiveBeaches(env.DB);
      return jsonResponse({ beaches }, corsHeaders);
    }

    // Route: GET /api/beaches/:beachId - Get beach details
    if (path.match(/^\/api\/beaches\/[^\/]+$/) && request.method === 'GET') {
      const beachId = path.split('/').pop();
      const beach = await getBeach(env.DB, beachId);

      if (!beach) {
        return jsonResponse({ error: 'Beach not found' }, corsHeaders, 404);
      }

      return jsonResponse({ beach }, corsHeaders);
    }

    // Route: GET /api/beaches/:beachId/latest - Get latest snapshot
    if (path.match(/^\/api\/beaches\/[^\/]+\/latest$/) && request.method === 'GET') {
      const beachId = path.split('/')[3];
      const snapshot = await getLatestSnapshot(env.DB, beachId);

      if (!snapshot) {
        return jsonResponse({ error: 'No snapshots found for this beach' }, corsHeaders, 404);
      }

      return jsonResponse({ snapshot }, corsHeaders);
    }

    // Route: GET /api/beaches/:beachId/history - Get snapshot history
    if (path.match(/^\/api\/beaches\/[^\/]+\/history$/) && request.method === 'GET') {
      const beachId = path.split('/')[3];
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      const history = await getSnapshotHistory(env.DB, beachId, limit, offset);
      return jsonResponse({ history, count: history.length }, corsHeaders);
    }

    // Route: GET /api/beaches/:beachId/stats - Get beach statistics
    if (path.match(/^\/api\/beaches\/[^\/]+\/stats$/) && request.method === 'GET') {
      const beachId = path.split('/')[3];
      const daysBack = parseInt(url.searchParams.get('days') || '7');

      const stats = await getBeachStatistics(env.DB, beachId, daysBack);
      return jsonResponse({ stats }, corsHeaders);
    }

    // Route: GET /api/beaches/:beachId/hourly - Get hourly averages
    if (path.match(/^\/api\/beaches\/[^\/]+\/hourly$/) && request.method === 'GET') {
      const beachId = path.split('/')[3];
      const daysBack = parseInt(url.searchParams.get('days') || '30');

      const hourly = await getHourlyAverages(env.DB, beachId, daysBack);
      return jsonResponse({ hourly }, corsHeaders);
    }

    // Route: GET /api/current - Get all current beach statuses
    if (path === '/api/current' && request.method === 'GET') {
      const snapshots = await getAllLatestSnapshots(env.DB);
      return jsonResponse({ beaches: snapshots, count: snapshots.length }, corsHeaders);
    }

    // Route: GET /images/* - Serve images from R2
    if (path.startsWith('/images/') && request.method === 'GET') {
      const key = path.substring(8); // Remove '/images/' prefix
      return await serveImage(env.IMAGES, key);
    }

    // Route: GET / - API documentation
    if (path === '/' && request.method === 'GET') {
      return new Response(getApiDocs(), {
        headers: {
          'Content-Type': 'text/html',
          ...corsHeaders
        }
      });
    }

    // 404 - Not found
    return jsonResponse({ error: 'Not found' }, corsHeaders, 404);

  } catch (error) {
    console.error('API error:', error);
    return jsonResponse({
      error: 'Internal server error',
      message: error.message
    }, corsHeaders, 500);
  }
}

/**
 * Helper function to create JSON responses
 */
function jsonResponse(data, headers = {}, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
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

  <h2>Example Response</h2>
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
