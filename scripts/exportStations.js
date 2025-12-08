
import { RadioBrowserApi } from 'radio-browser-api';
import fs from 'fs';
import path from 'path';

// Fix for fetch in older Node environments (though modern Node supports it)
if (!globalThis.fetch) {
    console.warn("Native fetch not found. Ensure use Node 18+");
}

const api = new RadioBrowserApi('MyCrawlerScript');

async function main() {
    try {
        console.log('Fetching top 10,000 stations from Radio Browser API...');

        const stations = await api.searchStations({
            limit: 10000,
            order: 'clickCount',
            reverse: true, // Highest clicks first
            hideBroken: true
        });

        console.log(`Fetched ${stations.length} stations. Processing...`);

        // CSV Strings
        const header = [
            'Name',
            'Stream URL',
            'Homepage',
            'Country',
            'Tags',
            'Votes',
            'Click Count'
        ].join(',') + '\n';

        const rows = stations.map(s => {
            // Helper to escape CSV properly: quote fields containing commas/quotes
            const escape = (str) => {
                if (!str) return '""';
                let val = String(str).replace(/"/g, '""'); // Escape double quotes
                if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                    val = `"${val}"`;
                }
                return val;
            };

            return [
                escape(s.name),
                escape(s.urlResolved || s.url),
                escape(s.homepage),
                escape(s.country),
                escape(s.tags.join(';')), // Use semicolon for tags
                s.votes,
                s.clickCount
            ].join(',');
        });

        const outputContent = header + rows.join('\n');
        const outputPath = path.resolve('stations.csv');

        fs.writeFileSync(outputPath, outputContent, 'utf-8');

        console.log(`\n✅ Success! Exported ${stations.length} stations to:`);
        console.log(outputPath);

    } catch (error) {
        console.error("Error exporting stations:", error);
    }
}

main();
