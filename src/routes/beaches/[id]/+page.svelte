<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';

	let { data } = $props();

	// Register Chart.js components
	if (typeof window !== 'undefined') {
		Chart.register(...registerables);
	}

	let historyChart: Chart | null = null;
	let predictionsChart: Chart | null = null;

	// Helper functions
	function getStatusClass(score: number) {
		if (score < 25) return 'status-quiet';
		if (score < 50) return 'status-moderate';
		if (score < 75) return 'status-busy';
		return 'status-very-busy';
	}

	function getStatusColor(score: number) {
		if (score < 25) return 'bg-[#00D9A5]';
		if (score < 50) return 'bg-[#FFD93D]';
		if (score < 75) return 'bg-[#FF8C42]';
		return 'bg-[#FF4757]';
	}

	function getStatusBg(score: number) {
		if (score < 25) return 'bg-[#00D9A5]/10 text-[#00D9A5]';
		if (score < 50) return 'bg-[#FFD93D]/10 text-[#C4A000]';
		if (score < 75) return 'bg-[#FF8C42]/10 text-[#FF8C42]';
		return 'bg-[#FF4757]/10 text-[#FF4757]';
	}

	function getStatusLabel(score: number) {
		if (score < 25) return 'Quiet';
		if (score < 50) return 'Moderate';
		if (score < 75) return 'Busy';
		return 'Very Busy';
	}

	function formatTime(timestamp: number) {
		const date = new Date(timestamp * 1000);
		return date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
	}

	function formatDate(timestamp: number) {
		const date = new Date(timestamp * 1000);
		return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
	}

	function formatDateTime(timestamp: number) {
		const date = new Date(timestamp * 1000);
		const now = new Date();
		const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

		if (diffMinutes < 1) return 'Just now';
		if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes > 1 ? 's' : ''} ago`;
		if (diffMinutes < 1440) {
			const hours = Math.floor(diffMinutes / 60);
			return `${hours} hour${hours > 1 ? 's' : ''} ago`;
		}
		return date.toLocaleString('en-AU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	onMount(() => {
		// Chart.js defaults with new design
		Chart.defaults.font.family = 'Outfit, sans-serif';
		Chart.defaults.color = '#0A2540';

		// Create history chart (7-day view)
		if (data.history.length > 0) {
			const historyCtx = document.getElementById('historyChart') as HTMLCanvasElement;
			if (historyCtx) {
				const formatChartLabel = (timestamp: number) => {
					const date = new Date(timestamp * 1000);
					const now = new Date();
					const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
					return diffDays < 1 ? formatTime(timestamp) : formatDate(timestamp);
				};

				historyChart = new Chart(historyCtx, {
					type: 'line',
					data: {
						labels: data.history.map((h: any) => formatChartLabel(h.captured_at)),
						datasets: [{
							label: 'Busyness Score',
							data: data.history.map((h: any) => h.busyness_score),
							borderColor: '#FF6B4A',
							backgroundColor: 'rgba(255, 107, 74, 0.1)',
							tension: 0.4,
							fill: true,
							pointRadius: 3,
							pointBackgroundColor: '#FF6B4A',
							pointBorderColor: '#fff',
							pointBorderWidth: 2,
							pointHoverRadius: 6
						}]
					},
					options: {
						responsive: true,
						maintainAspectRatio: false,
						plugins: {
							legend: {
								display: false
							},
							tooltip: {
								backgroundColor: '#0A2540',
								titleFont: { family: 'Outfit', weight: 600 },
								bodyFont: { family: 'Outfit' },
								padding: 12,
								cornerRadius: 8,
								callbacks: {
									title: (context) => {
										const index = context[0].dataIndex;
										return formatDateTime(data.history[index].captured_at);
									},
									label: (context) => {
										const score = context.parsed.y ?? 0;
										return `Busyness: ${score} (${getStatusLabel(score)})`;
									}
								}
							}
						},
						scales: {
							y: {
								beginAtZero: true,
								max: 100,
								grid: {
									color: 'rgba(10, 37, 64, 0.06)'
								},
								ticks: {
									callback: (value) => value,
									font: { family: 'Outfit' }
								}
							},
							x: {
								grid: {
									display: false
								},
								ticks: {
									maxRotation: 45,
									minRotation: 45,
									autoSkip: true,
									maxTicksLimit: 20,
									font: { family: 'Outfit' }
								}
							}
						}
					}
				});
			}
		}

		// Create predictions chart
		if (data.hourlyPredictions.length > 0) {
			const predictionsCtx = document.getElementById('predictionsChart') as HTMLCanvasElement;
			if (predictionsCtx) {
				predictionsChart = new Chart(predictionsCtx, {
					type: 'bar',
					data: {
						labels: data.hourlyPredictions.map((h: any) => `${h.hour_of_day}:00`),
						datasets: [{
							label: 'Average Busyness',
							data: data.hourlyPredictions.map((h: any) => Math.round(h.avg_busyness_score)),
							backgroundColor: data.hourlyPredictions.map((h: any) => {
								const score = h.avg_busyness_score;
								if (score < 25) return 'rgba(0, 217, 165, 0.7)';
								if (score < 50) return 'rgba(255, 217, 61, 0.7)';
								if (score < 75) return 'rgba(255, 140, 66, 0.7)';
								return 'rgba(255, 71, 87, 0.7)';
							}),
							borderRadius: 8,
							borderSkipped: false
						}]
					},
					options: {
						responsive: true,
						maintainAspectRatio: false,
						plugins: {
							legend: {
								display: false
							},
							tooltip: {
								backgroundColor: '#0A2540',
								titleFont: { family: 'Outfit', weight: 600 },
								bodyFont: { family: 'Outfit' },
								padding: 12,
								cornerRadius: 8,
								callbacks: {
									label: (context) => {
										const score = context.parsed.y ?? 0;
										return `Average: ${score} (${getStatusLabel(score)})`;
									}
								}
							}
						},
						scales: {
							y: {
								beginAtZero: true,
								max: 100,
								grid: {
									color: 'rgba(10, 37, 64, 0.06)'
								}
							},
							x: {
								grid: {
									display: false
								}
							}
						}
					}
				});
			}
		}

		// Cleanup
		return () => {
			if (historyChart) historyChart.destroy();
			if (predictionsChart) predictionsChart.destroy();
		};
	});
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
				<span>Back to all beaches</span>
			</a>

			<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
				<div>
					<span class="text-label text-white/70 block mb-2">Beach Details</span>
					<h1 class="heading-display-xl text-white text-3xl sm:text-4xl md:text-5xl">
						{data.beach.name}
					</h1>
					{#if data.beach.location}
						<p class="text-white/80 mt-2">{data.beach.location}</p>
					{/if}
				</div>

				{#if data.current}
					<div class="flex items-center gap-4">
						<div class="status-dot {getStatusClass(data.current.busyness_score)}"></div>
						<span class="px-4 py-2 rounded-full bg-white/20 backdrop-blur text-white font-semibold">
							{getStatusLabel(data.current.busyness_score)}
						</span>
					</div>
				{/if}
			</div>
		</div>
	</header>

	<main class="container mx-auto px-4 py-8 sm:py-12">
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
			<!-- Left Column: Main Content -->
			<div class="lg:col-span-2 space-y-6 sm:space-y-8">
				<!-- Latest Snapshot -->
				<section class="warm-card rounded-3xl overflow-hidden animate-fade-up">
					<div class="p-5 sm:p-6 border-b border-[#0A2540]/5">
						<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
							<div>
								<span class="text-label text-[#FF6B4A] block mb-1">Live Feed</span>
								<h2 class="heading-display text-xl sm:text-2xl text-[#0A2540]">Latest Snapshot</h2>
							</div>
							{#if data.webcams.length > 0}
								<a
									href={data.webcams[0].url}
									target="_blank"
									rel="noopener noreferrer"
									class="btn-secondary text-sm py-2 px-4"
								>
									View live webcam
								</a>
							{/if}
						</div>
					</div>

					{#if data.beach.imageUrl}
						<div class="aspect-video bg-[#0A2540]">
							<img
								src={data.beach.imageUrl}
								alt="Latest beach snapshot"
								class="w-full h-full object-cover"
							/>
						</div>
						{#if data.beach.capturedAt}
							<div class="p-4 bg-[#0A2540]/5">
								<p class="text-sm text-[#0A2540]/60">
									Captured {formatDateTime(data.beach.capturedAt)}
								</p>
							</div>
						{/if}
					{:else}
						<div class="aspect-video bg-[#F5E6D3] flex items-center justify-center">
							<div class="text-center p-8">
								<div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#0A2540]/10 flex items-center justify-center">
									<svg class="w-8 h-8 text-[#0A2540]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
								</div>
								<p class="text-[#0A2540]/50 mb-3">No snapshot available yet</p>
								{#if data.webcams.length > 0}
									<a
										href={data.webcams[0].url}
										target="_blank"
										rel="noopener noreferrer"
										class="text-[#FF6B4A] hover:underline text-sm font-medium"
									>
										View live webcam instead
									</a>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Webcam links -->
					{#if data.webcams.length > 0}
						<div class="p-5 sm:p-6">
							<h3 class="text-label text-[#0A2540]/60 mb-3">Available Webcams</h3>
							<div class="space-y-2">
								{#each data.webcams as webcam}
									<div class="flex items-center justify-between p-3 rounded-xl bg-[#F5E6D3]/50 hover:bg-[#F5E6D3] transition-colors">
										<span class="text-[#0A2540]">{webcam.name}</span>
										<a
											href={webcam.url}
											target="_blank"
											rel="noopener noreferrer"
											class="text-[#FF6B4A] hover:text-[#E84A5F] font-medium text-sm"
										>
											Open
										</a>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</section>

				<!-- Historical Graph -->
				<section class="warm-card rounded-3xl p-5 sm:p-6 animate-fade-up delay-1">
					<div class="mb-6">
						<span class="text-label text-[#FF6B4A] block mb-1">Analytics</span>
						<h2 class="heading-display text-xl sm:text-2xl text-[#0A2540]">7-Day History</h2>
					</div>
					{#if data.history.length > 0}
						<div class="h-56 sm:h-72">
							<canvas id="historyChart"></canvas>
						</div>
					{:else}
						<div class="h-56 sm:h-72 flex items-center justify-center bg-[#F5E6D3]/50 rounded-2xl">
							<p class="text-[#0A2540]/50">No historical data available yet</p>
						</div>
					{/if}
				</section>

				<!-- Predictions -->
				<section class="warm-card rounded-3xl p-5 sm:p-6 animate-fade-up delay-2">
					<div class="mb-6">
						<span class="text-label text-[#FF6B4A] block mb-1">Forecast</span>
						<h2 class="heading-display text-xl sm:text-2xl text-[#0A2540]">Hourly Predictions</h2>
						<p class="text-sm text-[#0A2540]/60 mt-2">
							Average crowd levels by hour (based on last 7 days)
						</p>
					</div>
					{#if data.hourlyPredictions.length > 0}
						<div class="h-56 sm:h-72">
							<canvas id="predictionsChart"></canvas>
						</div>
					{:else}
						<div class="h-56 sm:h-72 flex items-center justify-center bg-[#F5E6D3]/50 rounded-2xl">
							<p class="text-[#0A2540]/50">Not enough data for predictions yet</p>
						</div>
					{/if}
				</section>
			</div>

			<!-- Right Column: Status Sidebar -->
			<div class="lg:col-span-1">
				<div class="warm-card rounded-3xl p-5 sm:p-6 lg:sticky lg:top-8 animate-fade-up delay-1">
					<span class="text-label text-[#FF6B4A] block mb-1">Right Now</span>
					<h2 class="heading-display text-xl sm:text-2xl text-[#0A2540] mb-6">Current Status</h2>

					{#if data.current}
						<!-- Status Display -->
						<div class="flex items-center gap-4 mb-6 p-4 rounded-2xl {getStatusBg(data.current.busyness_score)}">
							<div class="status-dot {getStatusClass(data.current.busyness_score)}"></div>
							<div>
								<span class="heading-display text-xl block">{getStatusLabel(data.current.busyness_score)}</span>
								<p class="text-xs opacity-70">
									Updated {formatDateTime(data.current.captured_at)}
								</p>
							</div>
						</div>

						<!-- Stats Grid -->
						<div class="space-y-4">
							<div class="p-4 rounded-2xl bg-[#F5E6D3]/50">
								<p class="text-label text-[#0A2540]/50 mb-2">Busyness Score</p>
								<div class="flex items-baseline gap-2">
									<span class="heading-display text-4xl text-[#0A2540]">{data.current.busyness_score}</span>
									<span class="text-[#0A2540]/40">/100</span>
								</div>
								<div class="progress-bar mt-3">
									<div
										class="progress-fill {getStatusColor(data.current.busyness_score)}"
										style="width: {data.current.busyness_score}%"
									></div>
								</div>
							</div>

							{#if data.current.person_count}
								<div class="p-4 rounded-2xl bg-[#F5E6D3]/50">
									<p class="text-label text-[#0A2540]/50 mb-2">Estimated Crowd</p>
									<div class="flex items-baseline gap-2">
										<span class="heading-display text-4xl text-[#0A2540]">~{data.current.person_count}</span>
										<span class="text-[#0A2540]/40">people</span>
									</div>
								</div>
							{/if}

							{#if data.current.detection_method}
								<div class="p-4 rounded-2xl bg-[#F5E6D3]/50">
									<p class="text-label text-[#0A2540]/50 mb-2">Detection Method</p>
									<span class="heading-display text-lg text-[#0A2540] uppercase">{data.current.detection_method}</span>
								</div>
							{/if}

							{#if data.current.confidence}
								<div class="p-4 rounded-2xl bg-[#F5E6D3]/50">
									<p class="text-label text-[#0A2540]/50 mb-2">Confidence</p>
									<span class="heading-display text-lg text-[#0A2540]">{Math.round(data.current.confidence * 100)}%</span>
								</div>
							{/if}
						</div>

						<!-- Best Time to Visit -->
						{#if data.hourlyPredictions.length > 0}
							{@const sortedHours = [...data.hourlyPredictions].sort((a, b) => a.avg_busyness_score - b.avg_busyness_score)}
							{@const bestHour = sortedHours[0]}
							<div class="mt-6 pt-6 border-t border-[#0A2540]/10">
								<div class="p-4 rounded-2xl bg-[#00D9A5]/10">
									<div class="flex items-start gap-3">
										<div class="w-10 h-10 rounded-xl bg-[#00D9A5]/20 flex items-center justify-center flex-shrink-0">
											<svg class="w-5 h-5 text-[#00D9A5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
										</div>
										<div>
											<h3 class="heading-display text-sm text-[#00D9A5] mb-1">Best Time to Visit</h3>
											<p class="text-[#0A2540]">
												Typically quietest around <span class="font-bold text-[#00D9A5]">{bestHour.hour_of_day}:00</span>
											</p>
											<p class="text-xs text-[#0A2540]/50 mt-1">
												Average score: {Math.round(bestHour.avg_busyness_score)}
											</p>
										</div>
									</div>
								</div>
							</div>
						{/if}
					{:else}
						<div class="p-6 rounded-2xl bg-[#F5E6D3]/50 text-center">
							<div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#0A2540]/10 flex items-center justify-center">
								<svg class="w-6 h-6 text-[#0A2540]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<p class="text-[#0A2540]/50 mb-1">No current data available</p>
							<p class="text-xs text-[#0A2540]/40">Check back soon for updates</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
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
