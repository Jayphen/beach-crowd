<script lang="ts">
	import type { Beach } from '$lib/types';

	interface Props {
		beaches: Beach[];
	}

	let { beaches }: Props = $props();

	function getStatusClass(status: string): string {
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

	function getStatusLabel(status: string): string {
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

	function getProgressColor(status: string): string {
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

	function getStatusBg(status: string): string {
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
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
	{#each beaches as beach, i (beach.id)}
		<a
			href="/beaches/{beach.id}"
			class="group warm-card rounded-2xl overflow-hidden animate-fade-up"
			style="animation-delay: {i * 0.1}s"
		>
			<!-- Card Header with gradient accent -->
			<div class="h-2 {getProgressColor(beach.status)}"></div>

			<div class="p-5 sm:p-6">
				<!-- Beach Name & Status Indicator -->
				<div class="flex items-start justify-between gap-3 mb-4">
					<div>
						<h3 class="heading-display text-lg sm:text-xl text-[#0A2540] group-hover:text-[#FF6B4A] transition-colors">
							{beach.name}
						</h3>
						<p class="text-sm text-[#0A2540]/50 mt-1">Sydney, Australia</p>
					</div>
					<div class="status-dot {getStatusClass(beach.status)} flex-shrink-0 mt-1"></div>
				</div>

				<!-- Status Badge -->
				<div class="mb-4">
					<span class="inline-block px-3 py-1.5 rounded-full text-xs font-semibold {getStatusBg(beach.status)}">
						{getStatusLabel(beach.status)}
					</span>
				</div>

				<!-- Busyness Score -->
				{#if beach.busynessScore !== undefined}
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<span class="text-sm text-[#0A2540]/60">Crowd Level</span>
							<span class="heading-display text-lg text-[#0A2540]">{beach.busynessScore}%</span>
						</div>

						<!-- Progress Bar -->
						<div class="progress-bar">
							<div
								class="progress-fill {getProgressColor(beach.status)}"
								style="width: {beach.busynessScore}%"
							></div>
						</div>
					</div>
				{/if}

				<!-- View Details Arrow -->
				<div class="mt-5 pt-4 border-t border-[#0A2540]/5 flex items-center justify-between">
					<span class="text-sm text-[#0A2540]/50 group-hover:text-[#FF6B4A] transition-colors">
						View details
					</span>
					<svg
						class="w-5 h-5 text-[#0A2540]/30 group-hover:text-[#FF6B4A] group-hover:translate-x-1 transition-all"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
					</svg>
				</div>
			</div>
		</a>
	{/each}
</div>
