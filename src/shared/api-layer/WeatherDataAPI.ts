import { ERROR_CODES } from '@shared/constants';
import { WeatherAppError } from '@shared/errors';
import { type WeatherDataPoint } from '@shared/types';

/**
 * API сервис для загрузки погодных данных
 */
export class WeatherDataAPI {
    private readonly baseUrl: string;

    constructor(baseUrl: string = '') {
        this.baseUrl = baseUrl;
    }

    /**
     * Загружает данные о температуре
     */
    async getTemperatureData(): Promise<WeatherDataPoint[]> {
        return this.loadData('/temperature.json');
    }

    /**
     * Загружает данные об осадках
     */
    async getPrecipitationData(): Promise<WeatherDataPoint[]> {
        return this.loadData('/precipitation.json');
    }

    /**
     * Выполняет HTTP запрос для загрузки данных
     */
    private async loadData(endpoint: string): Promise<WeatherDataPoint[]> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`);
            if (!response.ok) {
                throw new WeatherAppError(ERROR_CODES.NETWORK_ERROR, `Failed to load data from ${endpoint}`);
            }

            const data = await response.json();
            return data as WeatherDataPoint[];
        } catch (error) {
            if (error instanceof WeatherAppError) {
                throw error;
            }
            throw new WeatherAppError(ERROR_CODES.NETWORK_ERROR, `Error loading data from ${endpoint}`);
        }
    }
}
