<script lang="ts">
	import BeachMap from '$lib/components/BeachMap.svelte';
	import BeachList from '$lib/components/BeachList.svelte';
	import type { Beach } from '$lib/types';

	// Beach data with GPS coordinates for Sydney beaches
	let beaches: Beach[] = [
		{
			id: 'bondi',
			name: 'Bondi Beach',
			status: 'moderate',
			latitude: -33.8908,
			longitude: 151.2743,
			busynessScore: 65
		},
		{
			id: 'manly',
			name: 'Manly Beach',
			status: 'quiet',
			latitude: -33.7969,
			longitude: 151.2871,
			busynessScore: 30
		},
		{
			id: 'coogee',
			name: 'Coogee Beach',
			status: 'busy',
			latitude: -33.9186,
			longitude: 151.2586,
			busynessScore: 85
		},
		{
			id: 'maroubra',
			name: 'Maroubra Beach',
			status: 'quiet',
			latitude: -33.9503,
			longitude: 151.2590,
			busynessScore: 40
		}
	];

	function getStatusColor(status: string) {
		switch (status) {
			case 'quiet':
				return 'bg-green-500';
			case 'moderate':
				return 'bg-yellow-500';
			case 'busy':
				return 'bg-orange-500';
			case 'very_busy':
				return 'bg-red-500';
			default:
				return 'bg-gray-500';
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<header class="bg-blue-600 text-white py-8">
		<div class="container mx-auto px-4">
			<h1 class="text-4xl font-bold">BeachWatch</h1>
			<p class="text-blue-100 mt-2">Real-time beach crowd monitoring for Sydney beaches</p>
		</div>
	</header>

	<main class="container mx-auto px-4 py-8">
		<!-- Interactive Map Section -->
		<section class="mb-8">
			<div class="bg-white rounded-lg shadow-md p-4">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-2xl font-semibold">Sydney Beach Map</h2>
					<div class="flex items-center gap-4 text-sm">
						<div class="flex items-center gap-2">
							<div class="w-3 h-3 rounded-full bg-green-500"></div>
							<span>Quiet</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-3 h-3 rounded-full bg-yellow-500"></div>
							<span>Moderate</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-3 h-3 rounded-full bg-orange-500"></div>
							<span>Busy</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-3 h-3 rounded-full bg-red-500"></div>
							<span>Very Busy</span>
						</div>
					</div>
				</div>
				<div class="h-[500px] rounded-lg overflow-hidden">
					<BeachMap {beaches} />
				</div>
			</div>
		</section>

		<!-- Beach Cards Section -->
		<section class="mb-8">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-2xl font-semibold">Monitored Beaches</h2>
				<a
					href="/compare"
					class="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
				>
					Compare Beaches
				</a>
			</div>
			<BeachList {beaches} />
		</section>

		<!-- About Section -->
		<section class="bg-white rounded-lg shadow-md p-6">
			<h2 class="text-2xl font-semibold mb-4">About BeachWatch</h2>
			<p class="text-gray-600 mb-4">
				BeachWatch provides real-time crowd monitoring for Sydney's most popular beaches using
				computer vision and webcam analysis.
			</p>
			<p class="text-gray-600">
				Get instant updates on beach conditions to help you choose the perfect time and location
				for your beach visit.
			</p>
		</section>
	</main>
</div>
