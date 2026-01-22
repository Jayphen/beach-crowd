/**
 * BeachWatch Cloudflare Worker
 * Main entry point for API and scheduled tasks
 */

import { handleRequest } from './routes/api.js';
import { scrapeBeaches } from './lib/scraper.js';

export default {
  /**
   * Handle HTTP requests
   */
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request, env, ctx);
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  /**
   * Handle scheduled tasks (cron triggers)
   */
  async scheduled(event, env, ctx) {
    console.log('Scheduled task triggered:', event.cron);

    try {
      // Scrape all active beaches
      const result = await scrapeBeaches(env);

      console.log('Scrape completed:', {
        success: result.success,
        beaches_processed: result.beaches_processed,
        snapshots_created: result.snapshots_created
      });
    } catch (error) {
      console.error('Scheduled scrape failed:', error);
    }
  }
};
