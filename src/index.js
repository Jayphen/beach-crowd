/**
 * BeachWatch Cloudflare Worker
 * Main entry point for API and scheduled tasks
 */

import { createApp } from './routes/api.js';
import { scrapeBeaches } from './lib/scraper.js';

// Create the Hono app instance
const app = createApp();

export default {
  /**
   * Handle HTTP requests using Hono
   */
  async fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
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
