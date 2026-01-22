<script lang="ts">
	import BeachMap from '$lib/components/BeachMap.svelte';

	// Beach data with GPS coordinates for Sydney beaches
	let beaches = [
		{
			id: 'bondi',
			name: 'Bondi Beach',
			status: 'moderate' as const,
			latitude: -33.8908,
			longitude: 151.2743,
			busynessScore: 65
		},
		{
			id: 'manly',
			name: 'Manly Beach',
			status: 'quiet' as const,
			latitude: -33.7969,
			longitude: 151.2871,
			busynessScore: 30
		},
		{
			id: 'coogee',
			name: 'Coogee Beach',
			status: 'busy' as const,
			latitude: -33.9186,
			longitude: 151.2586,
			busynessScore: 85
		},
		{
			id: 'maroubra',
			name: 'Maroubra Beach',
			status: 'quiet' as const,
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

	function getStatusLabel(status: string) {
		switch (status) {
			case 'quiet':
				return 'Quiet';
			case 'moderate':
				return 'Moderate';
			case 'busy':
				return 'Busy';
			case 'very_busy':
				return 'Very Busy';
			default:
				return 'Unknown';
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
			<h2 class="text-2xl font-semibold mb-4">Monitored Beaches</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{#each beaches as beach}
					<a
						href="/beaches/{beach.id}"
						class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
					>
						<h3 class="text-xl font-semibold mb-3">{beach.name}</h3>
						<div class="flex items-center gap-2 mb-2">
							<div class="w-4 h-4 rounded-full {getStatusColor(beach.status)}"></div>
							<span class="text-gray-600">{getStatusLabel(beach.status)}</span>
						</div>
						{#if beach.busynessScore}
							<div class="text-sm text-gray-500">
								Busyness: {beach.busynessScore}/100
							</div>
						{/if}
					</a>
				{/each}
			</div>
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
