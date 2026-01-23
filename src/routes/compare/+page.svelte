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

	// Get status class
	function getStatusClass(status: string) {
		switch (status) {
			case 'quiet':
				return 'status-quiet';
			case 'moderate':
				return 'status-moderate';
			case 'busy':
				return 'status-busy';
			case 'very_busy':
				return 'status-very-busy';
			default:
				return 'bg-gray-400';
		}
	}

	// Get status color for progress bar
	function getStatusColor(status: string) {
		switch (status) {
			case 'quiet':
				return 'bg-[#00D9A5]';
			case 'moderate':
				return 'bg-[#FFD93D]';
			case 'busy':
				return 'bg-[#FF8C42]';
			case 'very_busy':
				return 'bg-[#FF4757]';
			default:
				return 'bg-gray-400';
		}
	}

	// Get status background
	function getStatusBg(status: string) {
		switch (status) {
			case 'quiet':
				return 'bg-[#00D9A5]/10 text-[#00D9A5]';
			case 'moderate':
				return 'bg-[#FFD93D]/10 text-[#C4A000]';
			case 'busy':
				return 'bg-[#FF8C42]/10 text-[#FF8C42]';
			case 'very_busy':
				return 'bg-[#FF4757]/10 text-[#FF4757]';
			default:
				return 'bg-gray-100 text-gray-600';
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

<div class="min-h-screen grain-overlay">
	<!-- Hero Header -->
	<header class="sunset-gradient wave-pattern relative overflow-hidden">
		<!-- Decorative elements -->
		<div class="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
		<div class="absolute bottom-20 left-20 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>

		<div class="container mx-auto px-4 py-8 sm:py-12 relative z-10">
			<!-- Back Navigation -->
			<a
				href="/"
				class="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6 group"
			>
				<svg class="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
				</svg>
				<span>Back to home</span>
			</a>

			<span class="text-label text-white/70 block mb-2">Analysis</span>
			<h1 class="heading-display-xl text-white text-3xl sm:text-4xl md:text-5xl mb-4">
				Compare Beaches
			</h1>
			<p class="text-white/80 max-w-xl">
				Side-by-side comparison of real-time beach conditions. Select beaches below to see how they stack up.
			</p>
		</div>
	</header>

	<main class="container mx-auto px-4 py-8 sm:py-12">
		<!-- Beach Selection Section -->
		<section class="warm-card rounded-3xl p-5 sm:p-8 mb-8 sm:mb-12 animate-fade-up">
			<div class="mb-6">
				<span class="text-label text-[#FF6B4A] block mb-1">Step 1</span>
				<h2 class="heading-display text-xl sm:text-2xl text-[#0A2540]">Select Beaches</h2>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
				{#each data.availableBeaches as beach}
					<label
						class="group flex items-center gap-3 p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all {selectedBeaches.includes(beach.id)
							? 'border-[#FF6B4A] bg-[#FF6B4A]/5'
							: 'border-[#0A2540]/10 hover:border-[#0A2540]/20 bg-white'}"
					>
						<div class="relative flex-shrink-0">
							<input
								type="checkbox"
								checked={selectedBeaches.includes(beach.id)}
								onchange={() => toggleBeach(beach.id)}
								class="sr-only peer"
							/>
							<div class="w-6 h-6 rounded-lg border-2 border-[#0A2540]/20 peer-checked:border-[#FF6B4A] peer-checked:bg-[#FF6B4A] flex items-center justify-center transition-all">
								<svg class="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
								</svg>
							</div>
						</div>
						<span class="font-medium text-[#0A2540] group-hover:text-[#FF6B4A] transition-colors">{beach.name}</span>
					</label>
				{/each}
			</div>

			<button
				onclick={compareBeaches}
				disabled={selectedBeaches.length === 0}
				class="btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
			>
				<span>
					{selectedBeaches.length === 0
						? 'Select beaches to compare'
						: `Compare ${selectedBeaches.length} beach${selectedBeaches.length > 1 ? 'es' : ''}`}
				</span>
			</button>
		</section>

		<!-- Comparison Results Section -->
		{#if data.comparisonData && data.comparisonData.beaches.length > 0}
			<section class="animate-fade-up delay-1">
				<div class="mb-6 sm:mb-8">
					<span class="text-label text-[#FF6B4A] block mb-1">Step 2</span>
					<h2 class="heading-display text-xl sm:text-2xl text-[#0A2540]">Comparison Results</h2>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
					{#each data.comparisonData.beaches as beach, i}
						<div class="warm-card rounded-3xl overflow-hidden animate-fade-up" style="animation-delay: {i * 0.1}s">
							<!-- Beach Header with gradient -->
							<div class="sunset-gradient p-5 sm:p-6">
								<h3 class="heading-display text-xl sm:text-2xl text-white mb-2">{beach.beach_name}</h3>
								<div class="flex items-center gap-3">
									<div class="status-dot {getStatusClass(beach.status)}"></div>
									<span class="text-white/90 font-medium">{getStatusLabel(beach.status)}</span>
								</div>
							</div>

							<!-- Beach Stats -->
							<div class="p-5 sm:p-6">
								<div class="space-y-4">
									<!-- Busyness Score -->
									<div class="p-4 rounded-2xl bg-[#F5E6D3]/50">
										<p class="text-label text-[#0A2540]/50 mb-2">Busyness Score</p>
										<div class="flex items-baseline gap-2 mb-3">
											<span class="heading-display text-4xl text-[#0A2540]">{beach.busyness_score}</span>
											<span class="text-[#0A2540]/40">/100</span>
										</div>
										<!-- Visual bar -->
										<div class="progress-bar">
											<div
												class="progress-fill {getStatusColor(beach.status)}"
												style="width: {beach.busyness_score}%"
											></div>
										</div>
									</div>

									<!-- Person Count -->
									<div class="p-4 rounded-2xl bg-[#F5E6D3]/50">
										<p class="text-label text-[#0A2540]/50 mb-2">Estimated Crowd</p>
										<div class="flex items-baseline gap-2">
											<span class="heading-display text-3xl text-[#0A2540]">{beach.person_count}</span>
											<span class="text-[#0A2540]/40">people</span>
										</div>
									</div>

									<!-- Last Updated -->
									<div class="p-4 rounded-2xl bg-[#F5E6D3]/50">
										<p class="text-label text-[#0A2540]/50 mb-2">Last Updated</p>
										<span class="heading-display text-lg text-[#0A2540]">
											{formatTime(beach.captured_at)}
										</span>
									</div>
								</div>

								<!-- View Details Button -->
								<a
									href="/beaches/{beach.beach_id}"
									class="mt-6 block text-center btn-secondary py-3"
								>
									View Full Details
								</a>
							</div>
						</div>
					{/each}
				</div>

				<!-- Comparison Summary -->
				{#if data.comparisonData.beaches.length > 1}
					<div class="mt-8 sm:mt-12 warm-card rounded-3xl p-5 sm:p-8 animate-fade-up delay-2">
						<div class="mb-6">
							<span class="text-label text-[#FF6B4A] block mb-1">Summary</span>
							<h3 class="heading-display text-xl sm:text-2xl text-[#0A2540]">Quick Insights</h3>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
							<!-- Least Crowded -->
							<div class="p-5 sm:p-6 rounded-2xl bg-[#00D9A5]/10">
								<div class="flex items-start gap-4">
									<div class="w-12 h-12 rounded-xl bg-[#00D9A5]/20 flex items-center justify-center flex-shrink-0">
										<svg class="w-6 h-6 text-[#00D9A5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
										</svg>
									</div>
									<div>
										<h4 class="text-label text-[#00D9A5] mb-2">Best Choice</h4>
										{#each data.comparisonData.beaches.sort((a, b) => a.busyness_score - b.busyness_score).slice(0, 1) as beach}
											<p class="heading-display text-xl text-[#0A2540] mb-1">{beach.beach_name}</p>
											<p class="text-sm text-[#0A2540]/60">Score: {beach.busyness_score}/100</p>
										{/each}
									</div>
								</div>
							</div>

							<!-- Most Crowded -->
							<div class="p-5 sm:p-6 rounded-2xl bg-[#FF4757]/10">
								<div class="flex items-start gap-4">
									<div class="w-12 h-12 rounded-xl bg-[#FF4757]/20 flex items-center justify-center flex-shrink-0">
										<svg class="w-6 h-6 text-[#FF4757]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
										</svg>
									</div>
									<div>
										<h4 class="text-label text-[#FF4757] mb-2">Most Crowded</h4>
										{#each data.comparisonData.beaches.sort((a, b) => b.busyness_score - a.busyness_score).slice(0, 1) as beach}
											<p class="heading-display text-xl text-[#0A2540] mb-1">{beach.beach_name}</p>
											<p class="text-sm text-[#0A2540]/60">Score: {beach.busyness_score}/100</p>
										{/each}
									</div>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</section>
		{/if}
	</main>

	<!-- Footer -->
	<footer class="mt-16 sm:mt-24 py-8 border-t border-[#0A2540]/10">
		<div class="container mx-auto px-4 text-center">
			<p class="text-sm text-[#0A2540]/50">
				BeachWatch · Real-time crowd intelligence for Sydney beaches
			</p>
		</div>
	</footer>
</div>
