import { APP_CONFIG } from '@shared/constants';

export function generateYears(): Array<{ value: number; label: string }> {
    const years = [];
    for (let year = APP_CONFIG.MIN_YEAR; year <= APP_CONFIG.MAX_YEAR; year++) {
        years.push({ value: year, label: year.toString() });
    }
    return years;
}

export function validateYearRange(startYear: number, endYear: number): { startYear: number; endYear: number } {
    if (startYear > endYear) {
        return { startYear: endYear, endYear: startYear };
    }
    return { startYear, endYear };
}
