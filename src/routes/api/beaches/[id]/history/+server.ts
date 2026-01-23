import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform, url }) => {
	const beachId = params.id;
	const range = url.searchParams.get('range');

	if (!beachId) {
		throw error(400, 'Beach ID is required');
	}

	try {
		const env = platform?.env;

		if (!env?.DB) {
			throw error(500, 'Database not configured');
		}

		// If range parameter is provided (e.g., "7d", "1d", "30d"), use time-based query
		if (range) {
			// Parse range: extract number and unit (e.g., "7d" => 7 days)
			const match = range.match(/^(\d+)([dhm])$/);
			if (!match) {
				throw error(
					400,
					'Invalid range format. Use format like "7d" (days), "24h" (hours), or "30m" (minutes)'
				);
			}

			const value = parseInt(match[1]);
			const unit = match[2];

			// Convert to days for the database query
			let daysBack;
			switch (unit) {
				case 'd':
					daysBack = value;
					break;
				case 'h':
					daysBack = value / 24;
					break;
				case 'm':
					daysBack = value / (24 * 60);
					break;
				default:
					throw error(400, 'Invalid time unit. Use "d" (days), "h" (hours), or "m" (minutes)');
			}

			const sinceTimestamp = Math.floor(Date.now() / 1000) - daysBack * 24 * 60 * 60;

			const result = await env.DB.prepare(
				`
				SELECT s.captured_at, s.image_url, b.busyness_score, b.person_count, b.detection_method, b.confidence
				FROM snapshots s
				LEFT JOIN busyness_scores b ON s.id = b.snapshot_id
				WHERE s.beach_id = ?
					AND s.captured_at >= ?
				ORDER BY s.captured_at ASC
			`
			)
				.bind(beachId, sinceTimestamp)
				.all();

			const history = result.results || [];

			return json({
				history,
				count: history.length,
				range: range,
				days_back: daysBack
			});
		}

		// Otherwise, use pagination-based query (legacy support)
		const limit = parseInt(url.searchParams.get('limit') || '100');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		const result = await env.DB.prepare(
			`
			SELECT s.*, b.busyness_score, b.person_count, b.detection_method, b.confidence
			FROM snapshots s
			LEFT JOIN busyness_scores b ON s.id = b.snapshot_id
			WHERE s.beach_id = ?
			ORDER BY s.captured_at DESC
			LIMIT ? OFFSET ?
		`
		)
			.bind(beachId, limit, offset)
			.all();

		const history = result.results || [];

		return json({ history, count: history.length });
	} catch (e: any) {
		console.error('Error fetching history:', e);
		throw error(500, e.message || 'Failed to fetch history');
	}
};
