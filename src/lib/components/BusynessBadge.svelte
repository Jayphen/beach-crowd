<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { Beach } from '$lib/types';

	interface Props {
		status: Beach['status'];
		class?: string;
	}

	let { status, class: className }: Props = $props();

	function getStatusVariant(status: Beach['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'quiet':
				return 'secondary';
			case 'moderate':
				return 'outline';
			case 'busy':
				return 'default';
			case 'very_busy':
				return 'destructive';
		}
	}

	function getStatusLabel(status: Beach['status']): string {
		switch (status) {
			case 'quiet':
				return 'Quiet';
			case 'moderate':
				return 'Moderate';
			case 'busy':
				return 'Busy';
			case 'very_busy':
				return 'Very Busy';
		}
	}

	const variant = $derived(getStatusVariant(status));
	const label = $derived(getStatusLabel(status));
</script>

<Badge {variant} class={className}>
	{label}
</Badge>
