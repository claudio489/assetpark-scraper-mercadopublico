import { RawOpportunity } from '../types';
export declare function scrapeOpportunities(options?: {
    sources?: string[];
    limit?: number;
    profileKeywords?: string[];
}): Promise<RawOpportunity[]>;
export declare function registerSource(name: string, fetcher: () => Promise<RawOpportunity[]>): void;
