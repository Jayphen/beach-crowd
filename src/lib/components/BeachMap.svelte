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
				return '#00D9A5';
			case 'moderate':
				return '#FFD93D';
			case 'busy':
				return '#FF8C42';
			case 'very_busy':
				return '#FF4757';
			default:
				return '#6b7280';
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
			center: [-33.8688, 151.2093],
			zoom: 11,
			scrollWheelZoom: true,
			zoomControl: true
		});

		// Add tile layer with custom styling (CartoDB Positron for cleaner look)
		L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
			maxZoom: 19
		}).addTo(map);

		// Add beach markers
		beaches.forEach((beach) => {
			const color = getStatusColor(beach.status);

			// Create a pulsing marker effect
			const marker = L.circleMarker([beach.latitude, beach.longitude], {
				radius: 14,
				fillColor: color,
				color: '#ffffff',
				weight: 3,
				opacity: 1,
				fillOpacity: 0.9
			}).addTo(map!);

			// Add outer pulse ring
			const pulseMarker = L.circleMarker([beach.latitude, beach.longitude], {
				radius: 20,
				fillColor: color,
				color: color,
				weight: 2,
				opacity: 0.3,
				fillOpacity: 0.1
			}).addTo(map!);

			// Custom popup with new design
			const statusLabel = getStatusLabel(beach.status);
			const scoreText = beach.busynessScore !== undefined
				? `<div style="margin-top: 12px; padding: 12px; background: #F5E6D3; border-radius: 12px;">
						<div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #0A2540; opacity: 0.6; margin-bottom: 4px;">Crowd Level</div>
						<div style="display: flex; align-items: baseline; gap: 4px;">
							<span style="font-family: 'Syne', sans-serif; font-weight: 800; font-size: 24px; color: #0A2540;">${beach.busynessScore}</span>
							<span style="color: #0A2540; opacity: 0.4;">/100</span>
						</div>
					</div>`
				: '';

			marker.bindPopup(
				`<div style="font-family: 'Outfit', sans-serif; min-width: 200px; padding: 4px;">
					<h3 style="font-family: 'Syne', sans-serif; font-weight: 800; font-size: 18px; color: #0A2540; margin: 0 0 8px 0;">${beach.name}</h3>
					<div style="display: flex; align-items: center; gap: 8px;">
						<span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${color}; box-shadow: 0 0 8px ${color};"></span>
						<span style="font-weight: 600; color: #0A2540;">${statusLabel}</span>
					</div>
					${scoreText}
					<a href="/beaches/${beach.id}"
					   style="display: block; margin-top: 16px; padding: 10px 16px; background: #FF6B4A; color: white; text-decoration: none; border-radius: 100px; text-align: center; font-weight: 600; font-size: 14px; transition: background 0.2s;"
					   onmouseover="this.style.background='#E84A5F'"
					   onmouseout="this.style.background='#FF6B4A'">
						View Details
					</a>
				</div>`,
				{
					className: 'beach-popup',
					closeButton: true,
					maxWidth: 280
				}
			);

			// Open popup on click
			marker.on('click', () => {
				marker.openPopup();
			});

			markers.push(marker);
			markers.push(pulseMarker);
		});

		// Fit bounds to show all beaches
		if (beaches.length > 0) {
			const bounds = L.latLngBounds(beaches.map(b => [b.latitude, b.longitude]));
			map.fitBounds(bounds, { padding: [60, 60] });
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

<div bind:this={mapContainer} class="w-full h-full"></div>

<style>
	:global(.beach-popup .leaflet-popup-content-wrapper) {
		border-radius: 20px !important;
		box-shadow: 0 12px 40px rgba(10, 37, 64, 0.15) !important;
		border: none !important;
		padding: 0 !important;
		overflow: hidden;
	}

	:global(.beach-popup .leaflet-popup-content) {
		margin: 16px 20px !important;
	}

	:global(.beach-popup .leaflet-popup-tip) {
		background: white !important;
		box-shadow: none !important;
	}

	:global(.beach-popup .leaflet-popup-close-button) {
		color: #0A2540 !important;
		opacity: 0.5;
		font-size: 20px !important;
		width: 28px !important;
		height: 28px !important;
		top: 8px !important;
		right: 8px !important;
	}

	:global(.beach-popup .leaflet-popup-close-button:hover) {
		opacity: 1;
		color: #FF6B4A !important;
	}
</style>
