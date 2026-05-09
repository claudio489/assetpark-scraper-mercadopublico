interface UserActions {
    hidden: string[];
    saved: SavedItem[];
}
interface SavedItem {
    id: string;
    title: string;
    entity: string;
    amount: number;
    closingDate: string;
    url: string;
    recommendation: string;
    score: number;
    savedAt: string;
}
export declare function getActions(): UserActions;
export declare function hideOpportunity(id: string): boolean;
export declare function restoreOpportunity(id: string): boolean;
export declare function saveOpportunity(item: Omit<SavedItem, 'savedAt'>): boolean;
export declare function removeSaved(id: string): boolean;
export {};
