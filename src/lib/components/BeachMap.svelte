<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type L from 'leaflet';

	interface Beach {
		id: string;
		name: string;
		latitude: number;
		longitude: number;
		status: 'quiet' | 'moderate' | 'busy' | 'very_busy';
		busynessScore?: number;
	}

	export let beaches: Beach[] = [];

	let mapContainer: HTMLDivElement;
	let map: L.Map | null = null;
	let markers: L.CircleMarker[] = [];

	const getStatusColor = (status: string): string => {
		switch (status) {
			case 'quiet':
				return '#22c55e'; // green-500
			case 'moderate':
				return '#eab308'; // yellow-500
			case 'busy':
				return '#f97316'; // orange-500
			case 'very_busy':
				return '#ef4444'; // red-500
			default:
				return '#6b7280'; // gray-500
		}
	};

	const getStatusLabel = (status: string): string => {
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
	};

	onMount(async () => {
		// Dynamically import Leaflet and CSS
		const L = (await import('leaflet')).default;

		// Initialize map centered on Sydney
		map = L.map(mapContainer, {
			center: [-33.8688, 151.2093], // Sydney coordinates
			zoom: 11,
			scrollWheelZoom: true
		});

		// Add tile layer
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			maxZoom: 19
		}).addTo(map);

		// Add beach markers
		beaches.forEach((beach) => {
			const color = getStatusColor(beach.status);

			const marker = L.circleMarker([beach.latitude, beach.longitude], {
				radius: 12,
				fillColor: color,
				color: '#ffffff',
				weight: 2,
				opacity: 1,
				fillOpacity: 0.8
			}).addTo(map!);

			// Add popup
			const statusLabel = getStatusLabel(beach.status);
			const scoreText = beach.busynessScore ? `<br><strong>Score:</strong> ${beach.busynessScore}/100` : '';
			marker.bindPopup(
				`<div class="text-center">
					<h3 class="font-semibold text-lg mb-1">${beach.name}</h3>
					<p class="text-sm">
						<span class="inline-block w-3 h-3 rounded-full" style="background-color: ${color}"></span>
						<strong>Status:</strong> ${statusLabel}
						${scoreText}
					</p>
					<a href="/beaches/${beach.id}" class="text-blue-600 hover:underline text-sm mt-2 block">View Details →</a>
				</div>`
			);

			// Open popup on click
			marker.on('click', () => {
				marker.openPopup();
			});

			markers.push(marker);
		});

		// Fit bounds to show all beaches
		if (beaches.length > 0) {
			const bounds = L.latLngBounds(beaches.map(b => [b.latitude, b.longitude]));
			map.fitBounds(bounds, { padding: [50, 50] });
		}
	});

	onDestroy(() => {
		if (map) {
			map.remove();
			map = null;
		}
	});
</script>

<svelte:head>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
		integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
		crossorigin="" />
</svelte:head>

<div bind:this={mapContainer} class="w-full h-full rounded-lg shadow-lg"></div>

<style>
	:global(.leaflet-popup-content-wrapper) {
		border-radius: 0.5rem;
	}

	:global(.leaflet-popup-content) {
		margin: 1rem;
	}
</style>
