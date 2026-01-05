import { RadioBrowserApi } from 'radio-browser-api';

// Polyfill fetch if needed (Node 18+ has it)
// const fetch = ... 

const api = new RadioBrowserApi('My3DEarthRadio_Research');

async function run() {
    console.log("--- 1. Testing HTTP -> HTTPS Redirects (Server-Side) ---");
    try {
        // Fetch top 1000 stations
        const stations = await api.searchStations({
            limit: 1000,
            order: 'clickCount',
            reverse: true,
            hideBroken: true
        });

        let httpCount = 0;
        let httpsCount = 0;
        let resolvedHttpsCount = 0;
        let upgradeCount = 0;

        stations.forEach(s => {
            if (s.url.startsWith('http:')) httpCount++;
            else if (s.url.startsWith('https:')) httpsCount++;

            if (s.urlResolved.startsWith('https:')) resolvedHttpsCount++;

            if (s.url.startsWith('http:') && s.urlResolved.startsWith('https:')) {
                upgradeCount++;
            }
        });

        console.log(`Sample Size: ${stations.length}`);
        console.log(`Original URL is HTTP: ${httpCount}`);
        console.log(`Original URL is HTTPS: ${httpsCount}`);
        console.log(`Resolved URL is HTTPS: ${resolvedHttpsCount}`);
        console.log(`Successfully Redirected (HTTP -> HTTPS): ${upgradeCount}`);
        console.log(`Effective HTTPS Coverage: ${((resolvedHttpsCount / stations.length) * 100).toFixed(1)}%`);

    } catch (e) {
        console.error("Error fetching stations:", e);
    }

    console.log("\n--- 2. Fetching Total Station Count ---");
    try {
        // Fetch stats directly from a reliable endpoint
        // Using built-in fetch
        const response = await fetch('https://de1.api.radio-browser.info/json/stats');
        const stats = await response.json();

        console.log("Global Radio Browser Stats:");
        console.log(`Total Stations: ${stats.stations}`);
        console.log(`Broken Stations: ${stats.stations_broken}`);
        console.log(`Tags: ${stats.tags}`);

    } catch (e) {
        console.error("Error fetching stats:", e);
        // Fallback: fetch a larger list
        try {
            const list = await api.searchStations({ limit: 10000, countryCode: 'US' });
            console.log(`Fallback: Found ${list.length} stations in US alone (proving > 4602)`);
        } catch (e2) {
            console.error(e2);
        }
    }
}

run();
