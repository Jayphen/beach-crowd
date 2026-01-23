import type { PageLoad } from './$types';
import beachesConfig from '../../../../config/beaches-config.json';

// Get the worker URL from environment or use localhost for dev
const WORKER_URL = 'http://localhost:8787';

export const load: PageLoad = async ({ params, fetch }) => {
	const beachId = params.id;

	try {
		// Fetch beach details
		const beachResponse = await fetch(`${WORKER_URL}/api/beaches/${beachId}`);
		const beachData = await beachResponse.json();

		// Fetch current busyness
		const currentResponse = await fetch(`${WORKER_URL}/api/beaches/${beachId}/current`);
		const currentData = await currentResponse.json();

		// Fetch history (last 7 days)
		const historyResponse = await fetch(`${WORKER_URL}/api/beaches/${beachId}/history?range=7d`);
		const historyData = await historyResponse.json();

		// Fetch hourly predictions
		const hourlyResponse = await fetch(`${WORKER_URL}/api/beaches/${beachId}/hourly?days=7`);
		const hourlyData = await hourlyResponse.json();

		// Get webcam URLs from config
		const beachConfig = beachesConfig.beaches.find((b: any) => b.id === beachId);
		const webcams = beachConfig?.webcams || [];

		return {
			beach: beachData.beach,
			current: currentData.busyness,
			history: historyData.history || [],
			hourlyPredictions: hourlyData.hourly || [],
			webcams
		};
	} catch (error) {
		console.error('Error loading beach data:', error);

		// Fallback data
		const beachConfig = beachesConfig.beaches.find((b: any) => b.id === beachId);
		return {
			beach: {
				beach_id: beachId,
				name: beachConfig?.name || 'Unknown Beach',
				location: beachConfig?.location || ''
			},
			current: null,
			history: [],
			hourlyPredictions: [],
			webcams: beachConfig?.webcams || []
		};
	}
};
