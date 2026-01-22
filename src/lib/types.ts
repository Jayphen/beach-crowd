export interface Beach {
	id: string;
	name: string;
	status: 'quiet' | 'moderate' | 'busy' | 'very_busy';
	latitude: number;
	longitude: number;
	busynessScore?: number;
}

export interface BeachDetails extends Beach {
	location?: string;
	visible_area_sqm?: number;
	webcams?: Webcam[];
}

export interface Webcam {
	id: string;
	name: string;
	url: string;
	priority: number;
	notes?: string;
}
