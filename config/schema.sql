-- BeachWatch Database Schema
-- Cloudflare D1 (SQLite-based)
-- Version: 1.0
-- Last Updated: 2026-01-23

-- ==============================================================================
-- Table: beaches
-- Description: Stores information about each monitored beach
-- ==============================================================================

CREATE TABLE IF NOT EXISTS beaches (
    id TEXT PRIMARY KEY NOT NULL,                  -- Unique identifier (e.g., 'bondi', 'manly')
    name TEXT NOT NULL,                             -- Display name (e.g., 'Bondi Beach')
    location TEXT NOT NULL,                         -- Location description (e.g., 'Eastern Suburbs, Sydney')
    webcam_url TEXT NOT NULL,                       -- URL to the beach webcam
    latitude REAL,                                  -- GPS latitude for mapping
    longitude REAL,                                 -- GPS longitude for mapping
    beach_area_sqm INTEGER,                         -- Approximate beach area in square meters
    active INTEGER NOT NULL DEFAULT 1,              -- Whether beach is actively monitored (1=yes, 0=no)
    created_at INTEGER NOT NULL                     -- Unix timestamp when beach was added
);

-- ==============================================================================
-- Table: snapshots
-- Description: Stores metadata for each webcam capture
-- ==============================================================================

CREATE TABLE IF NOT EXISTS snapshots (
    id TEXT PRIMARY KEY NOT NULL,                   -- Unique snapshot ID (UUID)
    beach_id TEXT NOT NULL,                         -- Foreign key to beaches.id
    image_url TEXT NOT NULL,                        -- R2 URL for the captured image
    captured_at INTEGER NOT NULL,                   -- Unix timestamp when snapshot was taken
    weather_condition TEXT,                         -- Optional: weather at capture time (e.g., 'sunny', 'cloudy')
    temperature_celsius REAL,                       -- Optional: temperature in Celsius
    processing_status TEXT NOT NULL DEFAULT 'pending', -- Status: 'pending', 'processing', 'completed', 'failed'
    created_at INTEGER NOT NULL,                    -- Unix timestamp when record was created

    FOREIGN KEY (beach_id) REFERENCES beaches(id) ON DELETE CASCADE
);

-- ==============================================================================
-- Table: busyness_scores
-- Description: Stores analysis results for each snapshot
-- ==============================================================================

CREATE TABLE IF NOT EXISTS busyness_scores (
    id TEXT PRIMARY KEY NOT NULL,                   -- Unique score ID (UUID)
    snapshot_id TEXT NOT NULL,                      -- Foreign key to snapshots.id
    person_count INTEGER NOT NULL,                  -- Number of people detected
    busyness_score INTEGER NOT NULL,                -- Normalized score 0-100
    detection_method TEXT NOT NULL,                 -- Method used: 'yolov8', 'pixel_density', 'fallback'
    confidence REAL,                                -- Confidence level of detection (0.0-1.0)
    analysis_duration_ms INTEGER,                   -- Time taken to analyze in milliseconds
    metadata TEXT,                                  -- JSON string with additional analysis data
    created_at INTEGER NOT NULL,                    -- Unix timestamp when analysis completed

    FOREIGN KEY (snapshot_id) REFERENCES snapshots(id) ON DELETE CASCADE
);

-- ==============================================================================
-- Indexes for Query Optimization
-- ==============================================================================

-- Index for finding snapshots by beach (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_snapshots_beach_id
    ON snapshots(beach_id);

-- Index for time-based queries (historical data, graphs)
CREATE INDEX IF NOT EXISTS idx_snapshots_captured_at
    ON snapshots(captured_at DESC);

-- Composite index for beach + time range queries
CREATE INDEX IF NOT EXISTS idx_snapshots_beach_time
    ON snapshots(beach_id, captured_at DESC);

-- Index for finding busyness scores by snapshot (join optimization)
CREATE INDEX IF NOT EXISTS idx_busyness_snapshot_id
    ON busyness_scores(snapshot_id);

-- Index for finding snapshots by processing status (worker queue management)
CREATE INDEX IF NOT EXISTS idx_snapshots_status
    ON snapshots(processing_status);

-- ==============================================================================
-- Example Queries (for reference)
-- ==============================================================================

-- Get current busyness for a beach:
-- SELECT s.*, b.busyness_score, b.person_count
-- FROM snapshots s
-- JOIN busyness_scores b ON s.id = b.snapshot_id
-- WHERE s.beach_id = 'bondi'
-- ORDER BY s.captured_at DESC
-- LIMIT 1;

-- Get 7-day history for a beach:
-- SELECT s.captured_at, b.busyness_score, b.person_count
-- FROM snapshots s
-- JOIN busyness_scores b ON s.id = b.snapshot_id
-- WHERE s.beach_id = 'bondi'
--   AND s.captured_at >= unixepoch('now', '-7 days')
-- ORDER BY s.captured_at ASC;

-- Compare multiple beaches at current time:
-- SELECT
--   beach.name,
--   s.captured_at,
--   b.busyness_score,
--   b.person_count
-- FROM beaches beach
-- JOIN snapshots s ON beach.id = s.beach_id
-- JOIN busyness_scores b ON s.id = b.snapshot_id
-- WHERE beach.id IN ('bondi', 'manly', 'coogee')
--   AND s.id IN (
--     SELECT id FROM snapshots s2
--     WHERE s2.beach_id = beach.id
--     ORDER BY captured_at DESC
--     LIMIT 1
--   );

-- Get average busyness by hour of day (for predictions):
-- SELECT
--   strftime('%H', datetime(captured_at, 'unixepoch')) as hour,
--   AVG(b.busyness_score) as avg_busyness,
--   COUNT(*) as sample_count
-- FROM snapshots s
-- JOIN busyness_scores b ON s.id = b.snapshot_id
-- WHERE s.beach_id = 'bondi'
--   AND s.captured_at >= unixepoch('now', '-30 days')
-- GROUP BY hour
-- ORDER BY hour;
