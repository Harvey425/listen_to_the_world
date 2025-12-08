declare module 'wiki' {
    export interface WikiPage {
        summary(): Promise<WikiSummary>;
        // Add other methods as needed based on usage
    }

    export interface WikiSummary {
        extract: string;
        description?: string;
        title: string;
        // other fields...
    }

    export interface SearchResultItem {
        title: string;
        snippet: string;
    }

    export interface SearchResult {
        results: SearchResultItem[];
        suggestion?: string;
    }

    interface Wiki {
        /**
         * Search for a page
         */
        search(query: string, limit?: number): Promise<SearchResult>;

        /**
         * Get a page object
         */
        page(title: string): Promise<WikiPage>;

        /**
         * Set the language for requests (e.g. 'en', 'zh', 'fr')
         */
        setLanguages(lang: string | string[]): void;

        /**
         * Set API URL (advanced)
         */
        setApiUrl(url: string): void;

        // Configuration
        options(opts: { headers?: Record<string, string> }): void;
    }

    const wiki: Wiki;
    export default wiki;
}
