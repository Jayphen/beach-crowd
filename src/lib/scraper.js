/**
 * Scraper functions for Cloudflare Workers
 * This module handles orchestration of beach scraping
 */

import { getActiveBeaches } from './db.js';

/**
 * Scrape all active beaches
 * This is called by scheduled triggers
 */
export async function scrapeBeaches(env) {
  const beaches = await getActiveBeaches(env.DB);

  console.log(`Starting scrape for ${beaches.length} beaches`);

  let beaches_processed = 0;
  let snapshots_created = 0;
  const errors = [];

  for (const beach of beaches) {
    try {
      // Note: Actual scraping happens via external service
      // This Worker receives the results via API POST
      // The scheduled trigger can call an external scraper endpoint
      // or trigger a separate service

      beaches_processed++;
    } catch (error) {
      console.error(`Error scraping ${beach.id}:`, error);
      errors.push({
        beach_id: beach.id,
        error: error.message
      });
    }
  }

  return {
    success: true,
    beaches_processed,
    snapshots_created,
    errors
  };
}
