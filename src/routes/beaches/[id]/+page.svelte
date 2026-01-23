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
	function getStatusColor(score: number) {
		if (score < 25) return 'bg-green-500';
		if (score < 50) return 'bg-yellow-500';
		if (score < 75) return 'bg-orange-500';
		return 'bg-red-500';
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
		// Create history chart (7-day view)
		if (data.history.length > 0) {
			const historyCtx = document.getElementById('historyChart') as HTMLCanvasElement;
			if (historyCtx) {
				// Format labels for 7-day data
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
							borderColor: 'rgb(59, 130, 246)',
							backgroundColor: 'rgba(59, 130, 246, 0.1)',
							tension: 0.4,
							fill: true,
							pointRadius: 2,
							pointHoverRadius: 5
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
								ticks: {
									callback: (value) => value
								}
							},
							x: {
								ticks: {
									maxRotation: 45,
									minRotation: 45,
									autoSkip: true,
									maxTicksLimit: 20
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
								if (score < 25) return 'rgba(34, 197, 94, 0.6)';
								if (score < 50) return 'rgba(234, 179, 8, 0.6)';
								if (score < 75) return 'rgba(249, 115, 22, 0.6)';
								return 'rgba(239, 68, 68, 0.6)';
							})
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
								max: 100
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

<div class="min-h-screen bg-gray-50">
	<header class="bg-blue-600 text-white py-4 sm:py-6">
		<div class="container mx-auto px-4">
			<a href="/" class="text-sm sm:text-base text-blue-100 hover:text-white mb-2 inline-block">← Back to all beaches</a>
			<h1 class="text-2xl sm:text-3xl font-bold">{data.beach.name}</h1>
			{#if data.beach.location}
				<p class="text-sm sm:text-base text-blue-100 mt-1">{data.beach.location}</p>
			{/if}
		</div>
	</header>

	<main class="container mx-auto px-4 py-6 sm:py-8">
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
			<!-- Left Column: Webcam and Current Status -->
			<div class="lg:col-span-2 space-y-4 sm:space-y-6">
				<!-- Latest Snapshot -->
				<div class="bg-white rounded-lg shadow-md p-4 sm:p-6">
					<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
						<h2 class="text-xl sm:text-2xl font-semibold">Latest Snapshot</h2>
						{#if data.webcams.length > 0}
							<a
								href={data.webcams[0].url}
								target="_blank"
								rel="noopener noreferrer"
								class="text-blue-600 hover:text-blue-700 text-xs sm:text-sm whitespace-nowrap"
							>
								View live webcam →
							</a>
						{/if}
					</div>

					{#if data.beach.imageUrl}
						<div class="aspect-video bg-gray-900 rounded-lg overflow-hidden">
							<img
								src={data.beach.imageUrl}
								alt="Latest beach snapshot"
								class="w-full h-full object-cover"
							/>
						</div>
						{#if data.beach.capturedAt}
							<p class="text-sm text-gray-600 mt-2">
								Captured {formatDateTime(data.beach.capturedAt)}
							</p>
						{/if}
					{:else}
						<div class="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
							<div class="text-center">
								<p class="text-gray-500 mb-2">No snapshot available yet</p>
								{#if data.webcams.length > 0}
									<a
										href={data.webcams[0].url}
										target="_blank"
										rel="noopener noreferrer"
										class="text-blue-600 hover:text-blue-700 text-sm"
									>
										View live webcam
									</a>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Webcam links -->
					{#if data.webcams.length > 0}
						<div class="mt-4 pt-4 border-t">
							<h3 class="text-sm font-semibold mb-2">Available Webcams</h3>
							<div class="space-y-2">
								{#each data.webcams as webcam}
									<div class="flex items-center justify-between text-sm">
										<span class="text-gray-700">{webcam.name}</span>
										<a
											href={webcam.url}
											target="_blank"
											rel="noopener noreferrer"
											class="text-blue-600 hover:text-blue-700"
										>
											Open →
										</a>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- Historical Graph -->
				<div class="bg-white rounded-lg shadow-md p-4 sm:p-6">
					<h2 class="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Busyness History (7 Days)</h2>
					{#if data.history.length > 0}
						<div class="h-48 sm:h-64">
							<canvas id="historyChart"></canvas>
						</div>
					{:else}
						<div class="h-48 sm:h-64 flex items-center justify-center bg-gray-50 rounded-lg">
							<p class="text-sm sm:text-base text-gray-500">No historical data available yet</p>
						</div>
					{/if}
				</div>

				<!-- Predictions -->
				<div class="bg-white rounded-lg shadow-md p-4 sm:p-6">
					<h2 class="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Hourly Predictions</h2>
					<p class="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
						Average busyness by hour (based on last 7 days)
					</p>
					{#if data.hourlyPredictions.length > 0}
						<div class="h-48 sm:h-64">
							<canvas id="predictionsChart"></canvas>
						</div>
					{:else}
						<div class="h-48 sm:h-64 flex items-center justify-center bg-gray-50 rounded-lg">
							<p class="text-sm sm:text-base text-gray-500">Not enough data for predictions yet</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Right Column: Current Status -->
			<div class="lg:col-span-1">
				<div class="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:sticky lg:top-8">
					<h2 class="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Current Status</h2>

					{#if data.current}
						<div class="flex items-center gap-3 mb-4 sm:mb-6">
							<div class="w-6 h-6 sm:w-8 sm:h-8 rounded-full {getStatusColor(data.current.busyness_score)}"></div>
							<div>
								<span class="text-xl sm:text-2xl font-bold">{getStatusLabel(data.current.busyness_score)}</span>
								<p class="text-xs sm:text-sm text-gray-600">
									Updated {formatDateTime(data.current.captured_at)}
								</p>
							</div>
						</div>

						<div class="space-y-3 sm:space-y-4">
							<div class="bg-gray-50 p-3 sm:p-4 rounded-lg">
								<p class="text-gray-600 text-xs sm:text-sm mb-1">Busyness Score</p>
								<p class="text-2xl sm:text-3xl font-semibold">{data.current.busyness_score}<span class="text-lg sm:text-xl text-gray-500">/100</span></p>
							</div>

							{#if data.current.person_count}
								<div class="bg-gray-50 p-3 sm:p-4 rounded-lg">
									<p class="text-gray-600 text-xs sm:text-sm mb-1">Estimated Crowd</p>
									<p class="text-2xl sm:text-3xl font-semibold">~{data.current.person_count}</p>
									<p class="text-xs sm:text-sm text-gray-500">people</p>
								</div>
							{/if}

							{#if data.current.detection_method}
								<div class="bg-gray-50 p-3 sm:p-4 rounded-lg">
									<p class="text-gray-600 text-xs sm:text-sm mb-1">Detection Method</p>
									<p class="text-base sm:text-lg font-medium uppercase">{data.current.detection_method}</p>
								</div>
							{/if}

							{#if data.current.confidence}
								<div class="bg-gray-50 p-3 sm:p-4 rounded-lg">
									<p class="text-gray-600 text-xs sm:text-sm mb-1">Confidence</p>
									<p class="text-base sm:text-lg font-medium">{Math.round(data.current.confidence * 100)}%</p>
								</div>
							{/if}
						</div>

						<!-- Best Time to Visit -->
						{#if data.hourlyPredictions.length > 0}
							{@const sortedHours = [...data.hourlyPredictions].sort((a, b) => a.avg_busyness_score - b.avg_busyness_score)}
							{@const bestHour = sortedHours[0]}
							<div class="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
								<h3 class="text-sm sm:text-base font-semibold mb-2 sm:mb-3">💡 Best Time to Visit</h3>
								<p class="text-xs sm:text-sm text-gray-600 mb-2">
									Typically quietest around <span class="font-semibold text-blue-600">{bestHour.hour_of_day}:00</span>
								</p>
								<p class="text-xs text-gray-500">
									Average score: {Math.round(bestHour.avg_busyness_score)}
								</p>
							</div>
						{/if}
					{:else}
						<div class="bg-gray-50 p-3 sm:p-4 rounded-lg text-center">
							<p class="text-sm sm:text-base text-gray-500">No current data available</p>
							<p class="text-xs sm:text-sm text-gray-400 mt-2">Check back soon for updates</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</main>
</div>
