<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	// Track selected beaches for comparison
	let selectedBeaches = $state<string[]>(data.selectedBeaches.slice());

	// Toggle beach selection
	function toggleBeach(beachId: string) {
		if (selectedBeaches.includes(beachId)) {
			selectedBeaches = selectedBeaches.filter((id) => id !== beachId);
		} else {
			selectedBeaches = [...selectedBeaches, beachId];
		}
	}

	// Navigate to comparison with selected beaches
	function compareBeaches() {
		if (selectedBeaches.length === 0) {
			return;
		}
		goto(`/compare?beaches=${selectedBeaches.join(',')}`);
	}

	// Get status color class
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

	// Get status label
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

	// Format timestamp
	function formatTime(timestamp: number) {
		const date = new Date(timestamp * 1000);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);

		if (diffMins < 60) {
			return `${diffMins} mins ago`;
		} else if (diffMins < 1440) {
			const hours = Math.floor(diffMins / 60);
			return `${hours} hour${hours > 1 ? 's' : ''} ago`;
		} else {
			return date.toLocaleDateString();
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<header class="bg-blue-600 text-white py-4 sm:py-6">
		<div class="container mx-auto px-4">
			<a href="/" class="text-sm sm:text-base text-blue-100 hover:text-white mb-2 inline-block">← Back to home</a>
			<h1 class="text-2xl sm:text-3xl font-bold">Compare Beaches</h1>
			<p class="text-sm sm:text-base text-blue-100 mt-2">Side-by-side comparison of beach conditions</p>
		</div>
	</header>

	<main class="container mx-auto px-4 py-6 sm:py-8">
		<!-- Beach Selection Section -->
		<section class="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
			<h2 class="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Select Beaches to Compare</h2>

			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
				{#each data.availableBeaches as beach}
					<label
						class="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all {selectedBeaches.includes(
							beach.id
						)
							? 'border-blue-500 bg-blue-50'
							: 'border-gray-200 hover:border-gray-300'}"
					>
						<input
							type="checkbox"
							checked={selectedBeaches.includes(beach.id)}
							onchange={() => toggleBeach(beach.id)}
							class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
						/>
						<span class="text-sm sm:text-base font-medium">{beach.name}</span>
					</label>
				{/each}
			</div>

			<button
				onclick={compareBeaches}
				disabled={selectedBeaches.length === 0}
				class="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
			>
				{selectedBeaches.length === 0
					? 'Select beaches to compare'
					: `Compare ${selectedBeaches.length} beach${selectedBeaches.length > 1 ? 'es' : ''}`}
			</button>
		</section>

		<!-- Comparison Results Section -->
		{#if data.comparisonData && data.comparisonData.beaches.length > 0}
			<section>
				<h2 class="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Comparison Results</h2>

				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-{Math.min(
					data.comparisonData.beaches.length,
					3
				)} gap-4 sm:gap-6">
					{#each data.comparisonData.beaches as beach}
						<div class="bg-white rounded-lg shadow-md overflow-hidden">
							<!-- Beach Header -->
							<div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 sm:p-6">
								<h3 class="text-xl sm:text-2xl font-bold mb-2">{beach.beach_name}</h3>
								<div class="flex items-center gap-2">
									<div class="w-3 h-3 sm:w-4 sm:h-4 rounded-full {getStatusColor(beach.status)}"></div>
									<span class="text-sm sm:text-base text-blue-100 capitalize">{getStatusLabel(beach.status)}</span>
								</div>
							</div>

							<!-- Beach Stats -->
							<div class="p-4 sm:p-6">
								<div class="space-y-3 sm:space-y-4">
									<!-- Busyness Score -->
									<div class="bg-gray-50 rounded-lg p-3 sm:p-4">
										<p class="text-xs sm:text-sm text-gray-600 mb-1">Busyness Score</p>
										<div class="flex items-baseline gap-2">
											<p class="text-2xl sm:text-3xl font-bold text-gray-900">{beach.busyness_score}</p>
											<p class="text-sm sm:text-base text-gray-500">/100</p>
										</div>
										<!-- Visual bar -->
										<div class="mt-2 w-full bg-gray-200 rounded-full h-2">
											<div
												class="h-2 rounded-full {getStatusColor(beach.status)}"
												style="width: {beach.busyness_score}%"
											></div>
										</div>
									</div>

									<!-- Person Count -->
									<div class="bg-gray-50 rounded-lg p-3 sm:p-4">
										<p class="text-xs sm:text-sm text-gray-600 mb-1">Estimated Crowd</p>
										<p class="text-2xl sm:text-3xl font-bold text-gray-900">
											{beach.person_count}
										</p>
										<p class="text-xs sm:text-sm text-gray-500 mt-1">people detected</p>
									</div>

									<!-- Last Updated -->
									<div class="bg-gray-50 rounded-lg p-3 sm:p-4">
										<p class="text-xs sm:text-sm text-gray-600 mb-1">Last Updated</p>
										<p class="text-base sm:text-lg font-semibold text-gray-900">
											{formatTime(beach.captured_at)}
										</p>
									</div>
								</div>

								<!-- View Details Button -->
								<a
									href="/beaches/{beach.beach_id}"
									class="mt-4 sm:mt-6 block text-center bg-blue-100 text-blue-700 px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-blue-200 transition-colors"
								>
									View Full Details →
								</a>
							</div>
						</div>
					{/each}
				</div>

				<!-- Comparison Summary -->
				{#if data.comparisonData.beaches.length > 1}
					<div class="mt-6 sm:mt-8 bg-white rounded-lg shadow-md p-4 sm:p-6">
						<h3 class="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Quick Summary</h3>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
							<div>
								<h4 class="text-sm sm:text-base font-medium text-gray-700 mb-2">🟢 Least Crowded</h4>
								{#each data.comparisonData.beaches.sort((a, b) => a.busyness_score - b.busyness_score).slice(0, 1) as beach}
									<p class="text-base sm:text-lg font-semibold text-green-700">{beach.beach_name}</p>
									<p class="text-xs sm:text-sm text-gray-600">Score: {beach.busyness_score}/100</p>
								{/each}
							</div>
							<div>
								<h4 class="text-sm sm:text-base font-medium text-gray-700 mb-2">🔴 Most Crowded</h4>
								{#each data.comparisonData.beaches.sort((a, b) => b.busyness_score - a.busyness_score).slice(0, 1) as beach}
									<p class="text-base sm:text-lg font-semibold text-red-700">{beach.beach_name}</p>
									<p class="text-xs sm:text-sm text-gray-600">Score: {beach.busyness_score}/100</p>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</section>
		{/if}
	</main>
</div>
