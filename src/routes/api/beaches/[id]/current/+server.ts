import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform }) => {
	const beachId = params.id;

	if (!beachId) {
		throw error(400, 'Beach ID is required');
	}

	try {
		const env = platform?.env;

		if (!env?.DB) {
			throw error(500, 'Database not configured');
		}

		// Get current busyness for a beach
		const result = await env.DB.prepare(
			`
			SELECT
				s.beach_id,
				s.captured_at,
				b.busyness_score,
				b.person_count,
				b.detection_method,
				b.confidence
			FROM snapshots s
			INNER JOIN busyness_scores b ON s.id = b.snapshot_id
			WHERE s.beach_id = ?
			ORDER BY s.captured_at DESC
			LIMIT 1
		`
		)
			.bind(beachId)
			.first();

		if (!result) {
			return json({ busyness: null });
		}

		return json({ busyness: result });
	} catch (e: any) {
		console.error('Error fetching current busyness:', e);
		throw error(500, e.message || 'Failed to fetch current busyness');
	}
};
