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
</script>

<div class="min-h-screen grain-overlay">
	<!-- Hero Header with Sunset Gradient -->
	<header class="sunset-gradient wave-pattern relative overflow-hidden">
		<!-- Decorative elements -->
		<div class="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
		<div class="absolute bottom-20 left-20 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>

		<div class="container mx-auto px-4 py-12 sm:py-16 md:py-20 relative z-10">
			<div class="max-w-4xl">
				<!-- Tagline -->
				<span class="inline-block text-label text-white/80 mb-4 animate-fade-up">
					Sydney's Beach Intelligence
				</span>

				<!-- Main Title -->
				<h1 class="heading-display-xl text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6 animate-fade-up delay-1">
					Beach<span class="text-[#0A2540]">Watch</span>
				</h1>

				<!-- Subtitle -->
				<p class="text-body text-white/90 text-lg sm:text-xl max-w-xl mb-8 animate-fade-up delay-2">
					Real-time crowd monitoring powered by AI. Find your perfect wave, skip the crowds.
				</p>

				<!-- Quick Stats -->
				<div class="flex flex-wrap gap-6 sm:gap-10 animate-fade-up delay-3">
					<div class="text-white">
						<span class="heading-display text-3xl sm:text-4xl block">{beaches.length}</span>
						<span class="text-white/70 text-sm">Beaches Live</span>
					</div>
					<div class="text-white">
						<span class="heading-display text-3xl sm:text-4xl block">24/7</span>
						<span class="text-white/70 text-sm">Monitoring</span>
					</div>
					<div class="text-white">
						<span class="heading-display text-3xl sm:text-4xl block">AI</span>
						<span class="text-white/70 text-sm">Powered</span>
					</div>
				</div>
			</div>
		</div>
	</header>

	<main class="container mx-auto px-4 py-8 sm:py-12">
		<!-- Live Status Bar -->
		<div class="glass-card rounded-2xl p-4 sm:p-6 mb-8 sm:mb-12 animate-fade-up">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div class="flex items-center gap-3">
					<div class="w-3 h-3 rounded-full bg-[#00D9A5] animate-pulse"></div>
					<span class="text-label text-[#0A2540]/60">Live Now</span>
				</div>
				<div class="flex flex-wrap items-center gap-4 sm:gap-8">
					<div class="flex items-center gap-2">
						<div class="status-dot status-quiet"></div>
						<span class="text-sm text-[#0A2540]/80">Quiet</span>
					</div>
					<div class="flex items-center gap-2">
						<div class="status-dot status-moderate"></div>
						<span class="text-sm text-[#0A2540]/80">Moderate</span>
					</div>
					<div class="flex items-center gap-2">
						<div class="status-dot status-busy"></div>
						<span class="text-sm text-[#0A2540]/80">Busy</span>
					</div>
					<div class="flex items-center gap-2">
						<div class="status-dot status-very-busy"></div>
						<span class="text-sm text-[#0A2540]/80">Very Busy</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Interactive Map Section -->
		<section class="mb-10 sm:mb-16 animate-fade-up delay-1">
			<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
				<div>
					<span class="text-label text-[#FF6B4A] block mb-2">Explore</span>
					<h2 class="heading-display text-2xl sm:text-3xl text-[#0A2540]">Sydney Coastline</h2>
				</div>
				<p class="text-body text-[#0A2540]/60 max-w-md">
					Click any marker to see live conditions. Color indicates current crowd level.
				</p>
			</div>

			<div class="warm-card rounded-3xl overflow-hidden">
				<div class="h-[350px] sm:h-[450px] md:h-[550px]">
					<BeachMap {beaches} />
				</div>
			</div>
		</section>

		<!-- Beach Cards Section -->
		<section class="mb-10 sm:mb-16 animate-fade-up delay-2">
			<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
				<div>
					<span class="text-label text-[#FF6B4A] block mb-2">Browse</span>
					<h2 class="heading-display text-2xl sm:text-3xl text-[#0A2540]">Monitored Beaches</h2>
				</div>
				<a
					href="/compare"
					class="btn-primary inline-flex items-center gap-2 text-sm sm:text-base"
				>
					<span>Compare Beaches</span>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</a>
			</div>
			<BeachList {beaches} />
		</section>

		<!-- About Section -->
		<section class="animate-fade-up delay-3">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
				<div class="warm-card rounded-3xl p-6 sm:p-10">
					<span class="text-label text-[#FF6B4A] block mb-4">About</span>
					<h2 class="heading-display text-2xl sm:text-3xl text-[#0A2540] mb-6">
						Smart Beach Planning
					</h2>
					<p class="text-body text-[#0A2540]/70 mb-4">
						BeachWatch uses advanced computer vision to analyze webcam feeds in real-time,
						giving you accurate crowd counts and busyness predictions.
					</p>
					<p class="text-body text-[#0A2540]/70">
						Plan your perfect beach day with confidence. See historical patterns, hourly
						predictions, and find the quietest times to visit.
					</p>
				</div>

				<div class="grid grid-cols-2 gap-4 sm:gap-6">
					<div class="warm-card rounded-2xl p-5 sm:p-6 text-center">
						<div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#FF6B4A]/10 flex items-center justify-center">
							<svg class="w-6 h-6 text-[#FF6B4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
							</svg>
						</div>
						<h3 class="heading-display text-lg text-[#0A2540] mb-1">Live View</h3>
						<p class="text-sm text-[#0A2540]/60">Webcam snapshots</p>
					</div>

					<div class="warm-card rounded-2xl p-5 sm:p-6 text-center">
						<div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#2D9CCA]/10 flex items-center justify-center">
							<svg class="w-6 h-6 text-[#2D9CCA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
							</svg>
						</div>
						<h3 class="heading-display text-lg text-[#0A2540] mb-1">Analytics</h3>
						<p class="text-sm text-[#0A2540]/60">7-day history</p>
					</div>

					<div class="warm-card rounded-2xl p-5 sm:p-6 text-center">
						<div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#00D9A5]/10 flex items-center justify-center">
							<svg class="w-6 h-6 text-[#00D9A5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<h3 class="heading-display text-lg text-[#0A2540] mb-1">Predictions</h3>
						<p class="text-sm text-[#0A2540]/60">Hourly forecasts</p>
					</div>

					<div class="warm-card rounded-2xl p-5 sm:p-6 text-center">
						<div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#FFD93D]/10 flex items-center justify-center">
							<svg class="w-6 h-6 text-[#FFB347]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
						</div>
						<h3 class="heading-display text-lg text-[#0A2540] mb-1">Coverage</h3>
						<p class="text-sm text-[#0A2540]/60">Sydney beaches</p>
					</div>
				</div>
			</div>
		</section>
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
