import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform, url }) => {
	const beachId = params.id;
	const daysBack = parseInt(url.searchParams.get('days') || '30');

	if (!beachId) {
		throw error(400, 'Beach ID is required');
	}

	try {
		const env = platform?.env;

		if (!env?.DB) {
			throw error(500, 'Database not configured');
		}

		const sinceTimestamp = Math.floor(Date.now() / 1000) - daysBack * 24 * 60 * 60;

		// Get hourly averages for a beach (for predictions)
		const result = await env.DB.prepare(
			`
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
		`
		)
			.bind(beachId, sinceTimestamp)
			.all();

		// Transform the results to match the expected format
		const hourly = (result.results || []).map((row: any) => ({
			hour_of_day: parseInt(row.hour),
			avg_busyness_score: row.avg_busyness,
			avg_people: row.avg_people,
			sample_count: row.sample_count
		}));

		return json({ hourly });
	} catch (e: any) {
		console.error('Error fetching hourly data:', e);
		throw error(500, e.message || 'Failed to fetch hourly data');
	}
};
