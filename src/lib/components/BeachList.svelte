<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import type { Beach } from '$lib/types';

	interface Props {
		beaches: Beach[];
	}

	let { beaches }: Props = $props();

	function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'quiet':
				return 'secondary';
			case 'moderate':
				return 'outline';
			case 'busy':
				return 'default';
			case 'very_busy':
				return 'destructive';
			default:
				return 'outline';
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

	function getStatusColor(status: string): string {
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

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
	{#each beaches as beach (beach.id)}
		<a href="/beaches/{beach.id}" class="block transition-transform hover:scale-105">
			<Card class="h-full hover:shadow-lg transition-shadow">
				<CardHeader class="pb-3">
					<div class="flex items-start justify-between gap-2">
						<CardTitle class="text-xl">{beach.name}</CardTitle>
						<div class="w-3 h-3 rounded-full {getStatusColor(beach.status)} flex-shrink-0 mt-1"></div>
					</div>
					<CardDescription>Sydney, Australia</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-sm text-muted-foreground">Status</span>
							<Badge variant={getStatusVariant(beach.status)}>
								{getStatusLabel(beach.status)}
							</Badge>
						</div>
						{#if beach.busynessScore !== undefined}
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<span class="text-sm text-muted-foreground">Busyness</span>
									<span class="text-sm font-medium">{beach.busynessScore}%</span>
								</div>
								<div class="w-full bg-secondary rounded-full h-2">
									<div
										class="h-2 rounded-full transition-all {getStatusColor(beach.status)}"
										style="width: {beach.busynessScore}%"
									></div>
								</div>
							</div>
						{/if}
					</div>
				</CardContent>
			</Card>
		</a>
	{/each}
</div>
