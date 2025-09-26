export type WeatherDataType = 'temperature' | 'precipitation';

export interface WeatherDataPoint {
    t: string;
    v: number;
}

export interface WeatherDBRecord {
    id: string;
    t: string;
    v: number;
    type: WeatherDataType;
}

export interface YearRange {
    startYear: number;
    endYear: number;
}

export interface LoadingState {
    isLoading: boolean;
    error: string | null;
}
