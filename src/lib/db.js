/**
 * Database helper functions for Cloudflare D1
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Get all active beaches
 */
export async function getActiveBeaches(db) {
  const result = await db.prepare(
    'SELECT * FROM beaches WHERE active = 1 ORDER BY id'
  ).all();

  return result.results || [];
}

/**
 * Get beach by ID
 */
export async function getBeach(db, beachId) {
  const result = await db.prepare(
    'SELECT * FROM beaches WHERE id = ?'
  ).bind(beachId).first();

  return result;
}

/**
 * Create or update a beach
 */
export async function upsertBeach(db, beach) {
  const now = Math.floor(Date.now() / 1000);

  await db.prepare(`
    INSERT INTO beaches (id, name, location, webcam_url, latitude, longitude, beach_area_sqm, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      location = excluded.location,
      webcam_url = excluded.webcam_url,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      beach_area_sqm = excluded.beach_area_sqm,
      active = excluded.active
  `).bind(
    beach.id,
    beach.name,
    beach.location,
    beach.webcam_url || beach.webcams?.[0]?.url || '',
    beach.latitude || null,
    beach.longitude || null,
    beach.visible_area_sqm || beach.beach_area_sqm || 5000,
    beach.enabled ? 1 : 0,
    beach.created_at || now
  ).run();

  return beach.id;
}

/**
 * Create a snapshot record
 */
export async function createSnapshot(db, snapshot) {
  const id = snapshot.id || uuidv4();
  const now = Math.floor(Date.now() / 1000);

  await db.prepare(`
    INSERT INTO snapshots (id, beach_id, image_url, captured_at, weather_condition, temperature_celsius, processing_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    snapshot.beach_id,
    snapshot.image_url,
    snapshot.captured_at || now,
    snapshot.weather_condition || null,
    snapshot.temperature_celsius || null,
    snapshot.processing_status || 'pending',
    now
  ).run();

  return id;
}

/**
 * Update snapshot status
 */
export async function updateSnapshotStatus(db, snapshotId, status) {
  await db.prepare(
    'UPDATE snapshots SET processing_status = ? WHERE id = ?'
  ).bind(status, snapshotId).run();
}

/**
 * Create a busyness score record
 */
export async function createBusynessScore(db, score) {
  const id = score.id || uuidv4();
  const now = Math.floor(Date.now() / 1000);

  await db.prepare(`
    INSERT INTO busyness_scores (id, snapshot_id, person_count, busyness_score, detection_method, confidence, analysis_duration_ms, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    score.snapshot_id,
    score.person_count,
    score.busyness_score,
    score.detection_method,
    score.confidence || null,
    score.analysis_duration_ms || null,
    score.metadata ? JSON.stringify(score.metadata) : null,
    now
  ).run();

  return id;
}

/**
 * Get latest snapshot for a beach
 */
export async function getLatestSnapshot(db, beachId) {
  const result = await db.prepare(`
    SELECT s.*, b.busyness_score, b.person_count, b.detection_method, b.confidence
    FROM snapshots s
    LEFT JOIN busyness_scores b ON s.id = b.snapshot_id
    WHERE s.beach_id = ?
    ORDER BY s.captured_at DESC
    LIMIT 1
  `).bind(beachId).first();

  return result;
}

/**
 * Get snapshot history for a beach
 */
export async function getSnapshotHistory(db, beachId, limit = 100, offset = 0) {
  const result = await db.prepare(`
    SELECT s.*, b.busyness_score, b.person_count, b.detection_method, b.confidence
    FROM snapshots s
    LEFT JOIN busyness_scores b ON s.id = b.snapshot_id
    WHERE s.beach_id = ?
    ORDER BY s.captured_at DESC
    LIMIT ? OFFSET ?
  `).bind(beachId, limit, offset).all();

  return result.results || [];
}

/**
 * Get all latest snapshots for all beaches
 */
export async function getAllLatestSnapshots(db) {
  const result = await db.prepare(`
    SELECT
      beach.id as beach_id,
      beach.name as beach_name,
      beach.location,
      s.id as snapshot_id,
      s.image_url,
      s.captured_at,
      b.busyness_score,
      b.person_count,
      b.detection_method
    FROM beaches beach
    LEFT JOIN (
      SELECT beach_id, MAX(captured_at) as max_captured_at
      FROM snapshots
      GROUP BY beach_id
    ) latest ON beach.id = latest.beach_id
    LEFT JOIN snapshots s ON beach.id = s.beach_id AND s.captured_at = latest.max_captured_at
    LEFT JOIN busyness_scores b ON s.id = b.snapshot_id
    WHERE beach.active = 1
    ORDER BY beach.id
  `).all();

  return result.results || [];
}

/**
 * Get statistics for a beach
 */
export async function getBeachStatistics(db, beachId, daysBack = 7) {
  const sinceTimestamp = Math.floor(Date.now() / 1000) - (daysBack * 24 * 60 * 60);

  const result = await db.prepare(`
    SELECT
      COUNT(s.id) as total_snapshots,
      AVG(b.busyness_score) as avg_busyness,
      MIN(b.busyness_score) as min_busyness,
      MAX(b.busyness_score) as max_busyness,
      AVG(b.person_count) as avg_people,
      MIN(b.person_count) as min_people,
      MAX(b.person_count) as max_people
    FROM snapshots s
    JOIN busyness_scores b ON s.id = b.snapshot_id
    WHERE s.beach_id = ?
      AND s.captured_at >= ?
  `).bind(beachId, sinceTimestamp).first();

  return result;
}

/**
 * Get hourly averages for a beach (for predictions)
 */
export async function getHourlyAverages(db, beachId, daysBack = 30) {
  const sinceTimestamp = Math.floor(Date.now() / 1000) - (daysBack * 24 * 60 * 60);

  const result = await db.prepare(`
    SELECT
      strftime('%H', datetime(s.captured_at, 'unixepoch')) as hour,
      AVG(b.busyness_score) as avg_busyness,
      AVG(b.person_count) as avg_people,
      COUNT(*) as sample_count
    FROM snapshots s
    JOIN busyness_scores b ON s.id = b.snapshot_id
    WHERE s.beach_id = ?
      AND s.captured_at >= ?
    GROUP BY hour
    ORDER BY hour
  `).bind(beachId, sinceTimestamp).all();

  return result.results || [];
}

/**
 * Clean up old snapshots (for scheduled cleanup tasks)
 */
export async function cleanupOldSnapshots(db, daysToKeep = 90) {
  const cutoffTimestamp = Math.floor(Date.now() / 1000) - (daysToKeep * 24 * 60 * 60);

  const result = await db.prepare(`
    DELETE FROM snapshots
    WHERE captured_at < ?
  `).bind(cutoffTimestamp).run();

  return result.meta.changes || 0;
}
