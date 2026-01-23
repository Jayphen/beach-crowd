import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url, fetch }) => {
	// Get beach IDs from URL query params (e.g., ?beaches=bondi,manly)
	const beachesParam = url.searchParams.get('beaches');

	// Default beaches to compare if none specified
	const defaultBeaches = ['bondi', 'manly'];
	const selectedBeaches = beachesParam ? beachesParam.split(',').filter(Boolean) : defaultBeaches;

	// Available beaches for selection
	const availableBeaches = [
		{ id: 'bondi', name: 'Bondi Beach' },
		{ id: 'manly', name: 'Manly Beach' },
		{ id: 'coogee', name: 'Coogee Beach' },
		{ id: 'maroubra', name: 'Maroubra Beach' }
	];

	// Fetch comparison data if beaches are selected
	let comparisonData = null;
	if (selectedBeaches.length > 0) {
		try {
			// In development, this will need to be updated to use the actual API endpoint
			// For now, we'll use mock data
			comparisonData = {
				beaches: selectedBeaches.map(id => {
					const beachInfo = availableBeaches.find(b => b.id === id);
					return {
						beach_id: id,
						beach_name: beachInfo?.name || id,
						busyness_score: Math.floor(Math.random() * 100),
						person_count: Math.floor(Math.random() * 200),
						captured_at: Date.now() / 1000,
						status: ['quiet', 'moderate', 'busy', 'very_busy'][Math.floor(Math.random() * 4)]
					};
				})
			};
		} catch (error) {
			console.error('Error fetching comparison data:', error);
		}
	}

	return {
		availableBeaches,
		selectedBeaches,
		comparisonData
	};
};
