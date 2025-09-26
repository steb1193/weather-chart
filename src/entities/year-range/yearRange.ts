import { writable } from 'svelte/store';
import { APP_CONFIG } from '@shared/constants';

export interface YearRange {
    startYear: number;
    endYear: number;
}

const initialRange: YearRange = {
    startYear: APP_CONFIG.MIN_YEAR,
    endYear: APP_CONFIG.MAX_YEAR
};

export const yearRangeStore = writable<YearRange>(initialRange);

export function updateYearRange(startYear: number, endYear: number): void {
    yearRangeStore.update(() => ({ startYear, endYear }));
}
