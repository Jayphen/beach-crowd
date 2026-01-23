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

		// Get the latest snapshot and busyness score for the beach
		const result = await env.DB.prepare(
			`
			SELECT
				b.id,
				b.name,
				b.location,
				b.latitude,
				b.longitude,
				s.id as snapshot_id,
				s.image_url,
				s.captured_at,
				s.weather_condition,
				s.temperature_celsius,
				bs.busyness_score,
				bs.person_count,
				bs.detection_method,
				bs.confidence
			FROM beaches b
			LEFT JOIN snapshots s ON b.id = s.beach_id
			LEFT JOIN busyness_scores bs ON s.id = bs.snapshot_id
			WHERE b.id = ? AND b.active = 1
			ORDER BY s.captured_at DESC
			LIMIT 1
		`
		)
			.bind(beachId)
			.first();

		if (!result) {
			throw error(404, 'Beach not found');
		}

		// Calculate status based on busyness score
		let status = 'unknown';
		if (result.busyness_score !== null) {
			if (result.busyness_score < 30) {
				status = 'quiet';
			} else if (result.busyness_score < 60) {
				status = 'moderate';
			} else if (result.busyness_score < 80) {
				status = 'busy';
			} else {
				status = 'very_busy';
			}
		}

		// Format the response
		const response = {
			id: result.id,
			name: result.name,
			location: result.location,
			latitude: result.latitude,
			longitude: result.longitude,
			status,
			busynessScore: result.busyness_score,
			personCount: result.person_count,
			imageUrl: result.image_url,
			capturedAt: result.captured_at,
			lastUpdated: result.captured_at
				? getTimeAgo(result.captured_at)
				: 'No data yet',
			weather: result.weather_condition,
			temperature: result.temperature_celsius,
			detectionMethod: result.detection_method,
			confidence: result.confidence
		};

		return json(response);
	} catch (e: any) {
		console.error('Error fetching beach data:', e);
		throw error(500, e.message || 'Failed to fetch beach data');
	}
};

// Helper function to calculate time ago
function getTimeAgo(timestamp: number): string {
	const now = Math.floor(Date.now() / 1000);
	const diff = now - timestamp;

	if (diff < 60) {
		return 'Just now';
	} else if (diff < 3600) {
		const mins = Math.floor(diff / 60);
		return `${mins} min${mins > 1 ? 's' : ''} ago`;
	} else if (diff < 86400) {
		const hours = Math.floor(diff / 3600);
		return `${hours} hour${hours > 1 ? 's' : ''} ago`;
	} else {
		const days = Math.floor(diff / 86400);
		return `${days} day${days > 1 ? 's' : ''} ago`;
	}
}
