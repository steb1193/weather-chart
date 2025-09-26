import { ERROR_CODES } from '@shared/constants';
import { WeatherAppError } from '@shared/errors';
import { type WeatherDataPoint, type WeatherDataType, type YearRange } from '@shared/types';
import type { IDatabaseManager } from '@shared/api-layer/IndexedDBManager';

function validateWeatherData(data: unknown[]): WeatherDataPoint[] {
    if (!Array.isArray(data)) {
        throw new WeatherAppError(ERROR_CODES.VALIDATION_ERROR, 'Data must be an array');
    }

    if (data.length === 0) {
        return [];
    }

    const firstItem = data[0] as Record<string, unknown>;
    if (!firstItem.t || typeof firstItem.v !== 'number') {
        throw new WeatherAppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid data format');
    }

    return data as WeatherDataPoint[];
}

export interface IDataLoader {
    loadTemperatureData(): Promise<WeatherDataPoint[]>;
    loadPrecipitationData(): Promise<WeatherDataPoint[]>;
}

function loadDataFromServer(endpoint: string): Promise<WeatherDataPoint[]> {
    return fetch(endpoint)
        .then(response => {
            if (!response.ok) {
                throw new WeatherAppError(ERROR_CODES.NETWORK_ERROR, `Failed to load data from ${endpoint}`);
            }
            return response.json();
        })
        .then(data => validateWeatherData(data))
        .catch(error => {
            if (error instanceof WeatherAppError) { throw error; }
            throw new WeatherAppError(ERROR_CODES.NETWORK_ERROR, `Network error while loading data from ${endpoint}`);
        });
}

export class ServerDataLoader implements IDataLoader {
    async loadTemperatureData(): Promise<WeatherDataPoint[]> {
        return loadDataFromServer('/temperature.json');
    }

    async loadPrecipitationData(): Promise<WeatherDataPoint[]> {
        return loadDataFromServer('/precipitation.json');
    }
}

function checkDataAvailability(dbManager: IDatabaseManager, type: WeatherDataType): Promise<boolean> {
    return dbManager.hasData(type);
}

function loadDataFromServerByType(
    dataLoader: IDataLoader,
    type: WeatherDataType
): Promise<WeatherDataPoint[]> {
    return type === 'temperature' ?
        dataLoader.loadTemperatureData() :
        dataLoader.loadPrecipitationData();
}

function saveDataToStorage(
    dbManager: IDatabaseManager,
    type: WeatherDataType,
    data: WeatherDataPoint[]
): Promise<void> {
    return dbManager.saveData(type, data);
}

function getDataFromStorage(
    dbManager: IDatabaseManager,
    type: WeatherDataType,
    range: YearRange
): Promise<WeatherDataPoint[] | null> {
    return dbManager.getData(type, range);
}

export class WeatherDataService {
    constructor(
        private dbManager: IDatabaseManager,
        private dataLoader: IDataLoader
    ) {}

    async getWeatherData(type: WeatherDataType, range: YearRange): Promise<WeatherDataPoint[]> {
        try {
            const hasData = await checkDataAvailability(this.dbManager, type);

            if (!hasData) {
                const data = await loadDataFromServerByType(this.dataLoader, type);
                await saveDataToStorage(this.dbManager, type, data);
            }

            const data = await getDataFromStorage(this.dbManager, type, range);
            if (!data) {
                throw new WeatherAppError(ERROR_CODES.STORAGE_ERROR, 'No data found in storage');
            }

            return data;
        } catch (error) {
            if (error instanceof WeatherAppError) { throw error; }
            throw new WeatherAppError(ERROR_CODES.STORAGE_ERROR, 'Error retrieving weather data');
        }
    }
}
