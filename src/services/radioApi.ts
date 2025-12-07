export interface Station {
    stationuuid: string;
    name: string;
    url: string; // Stream URL
    url_resolved: string;
    homepage: string;
    favicon: string;
    tags: string;
    country: string;
    countrycode: string; // ISO 2-letter code
    state: string;
    language: string;
    votes: number;
    clickcount: number;
    geo_lat: number;
    geo_long: number;
}

const BASE_URL = 'https://de1.api.radio-browser.info/json/stations/search';

export async function fetchStations(limit = 5000): Promise<Station[]> {
    try {
        const params = new URLSearchParams({
            limit: limit.toString(),
            order: 'clickcount',
            reverse: 'true',
            hidebroken: 'true',
            has_geo_info: 'true',
        });

        const response = await fetch(`${BASE_URL}?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.map((station: any) => ({
            ...station,
            geo_lat: station.geo_lat ? Number(station.geo_lat) : null,
            geo_long: station.geo_long ? Number(station.geo_long) : null,
        })).filter((s: Station) => s.geo_lat !== null && s.geo_long !== null && !isNaN(s.geo_lat) && !isNaN(s.geo_long));
    } catch (error) {
        console.error("Failed to fetch stations:", error);
        return [];
    }
}
