import { ERROR_CODES, CHART_CONFIG } from '@shared/constants';
import { WeatherAppError } from '@shared/errors';
import { type WeatherDataPoint, type WeatherDataType, type YearRange } from '@shared/types';
import type { IDatabaseManager } from '@shared/lib/storage/IndexedDBManager';
import { type QueueProgress } from '@shared/lib/storage/BatchSaveQueue';
import { processWeatherData } from '@shared/lib/data-processing';
import { WeatherDataAPI } from '@shared/api-layer';

export interface IDataLoader {
    loadTemperatureData(): Promise<WeatherDataPoint[]>;
    loadPrecipitationData(): Promise<WeatherDataPoint[]>;
    processData(data: WeatherDataPoint[], startYear: number, endYear: number, maxPoints?: number): {
        data: WeatherDataPoint[];
        stats: {
            originalCount: number;
            filteredCount: number;
            downsampledCount: number;
            minValue: number;
            maxValue: number;
            avgValue: number;
        };
    };
    dbManager: IDatabaseManager;
}


export class ServerDataLoader implements IDataLoader {
    private weatherAPI: WeatherDataAPI;

    constructor(public dbManager: IDatabaseManager) {
        this.weatherAPI = new WeatherDataAPI();
    }

    async loadTemperatureData(): Promise<WeatherDataPoint[]> {
        return this.weatherAPI.getTemperatureData();
    }

    async loadPrecipitationData(): Promise<WeatherDataPoint[]> {
        return this.weatherAPI.getPrecipitationData();
    }

    processData(
        data: WeatherDataPoint[],
        startYear: number,
        endYear: number,
        maxPoints: number = CHART_CONFIG.DEFAULT_DOWNSAMPLE_POINTS
    ): {
        data: WeatherDataPoint[];
        stats: {
            originalCount: number;
            filteredCount: number;
            downsampledCount: number;
            minValue: number;
            maxValue: number;
            avgValue: number;
        };
    } {
        return processWeatherData(data, startYear, endYear, maxPoints);
    }
}

function loadDataFromServerByType(
    dataLoader: IDataLoader,
    type: WeatherDataType
): Promise<WeatherDataPoint[]> {
    return type === 'temperature' ?
        dataLoader.loadTemperatureData() :
        dataLoader.loadPrecipitationData();
}

async function saveDataToStorage(
    dbManager: IDatabaseManager,
    type: WeatherDataType,
    data: WeatherDataPoint[],
    itemId?: string
): Promise<number> {
    try {
        await dbManager.saveData(type, data, itemId);

        return data.length;
    } catch (error) {
        throw new WeatherAppError(ERROR_CODES.STORAGE_ERROR, `Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

function getDataFromStorage(
    dbManager: IDatabaseManager,
    type: WeatherDataType,
    range: YearRange
): Promise<WeatherDataPoint[] | null> {
    return dbManager.getData(type, range);
}

export interface LoadingState {
    isLoading: boolean;
    isParsing: boolean;
    isSaving: boolean;
    error: string | null;
    saveProgress: QueueProgress | null;
    dataReady: boolean;
    partialData: WeatherDataPoint[] | null;
}

/**
 * Основной сервис для работы с данными погоды
 * Управляет загрузкой данных с сервера и кэшированием в IndexedDB
 */
type LoadingStateCallback = (state: LoadingState) => void;

export class WeatherDataService {
    private loadingStates = new Map<WeatherDataType, LoadingState>();
    private loadingCallbacks = new Map<WeatherDataType, LoadingStateCallback>();

    constructor(
        private dbManager: IDatabaseManager,
        private dataLoader: IDataLoader
    ) {
        this.dbManager.onSaveProgress((progress) => {
            this.updateSaveProgress(progress);
        });
    }

    /**
     * Подписывается на изменения состояния загрузки для конкретного типа данных
     */
    onLoadingStateChange(type: WeatherDataType, callback: LoadingStateCallback): () => void {
        this.loadingCallbacks.set(type, callback);

        return () => {
            this.loadingCallbacks.delete(type);
        };
    }

    private updateLoadingState(type: WeatherDataType, state: Partial<LoadingState>): void {
        const currentState = this.loadingStates.get(type) || {
            isLoading: false,
            isParsing: false,
            isSaving: false,
            error: null,
            saveProgress: null,
            dataReady: false,
            partialData: null
        };
        const newState = { ...currentState, ...state };

        this.loadingStates.set(type, newState);

        const callback = this.loadingCallbacks.get(type);
        if (callback) {
            callback(newState);
        }
    }

    /**
     * Обновляет прогресс сохранения для всех типов данных
     */
    private updateSaveProgress(progress: QueueProgress): void {
        this.loadingStates.forEach((state, type) => {
            const newState = {
                ...state,
                isSaving: progress.isProcessing,
                saveProgress: progress.isProcessing ? progress : null
            };

            this.loadingStates.set(type, newState);

            const callback = this.loadingCallbacks.get(type);
            if (callback) {
                callback(newState);
            }
        });
    }

    /**
     * Загружает данные с сервера и обрабатывает их
     */
    private async loadAndProcessData(
        type: WeatherDataType,
        range: YearRange,
        requestId: string
    ): Promise<WeatherDataPoint[]> {
        const rawData = await loadDataFromServerByType(this.dataLoader, type);
        this.updateLoadingState(type, {
            isLoading: true,
            isParsing: true,
            isSaving: false,
            error: null,
            dataReady: false,
            partialData: null
        });

        const result = this.dataLoader.processData(
            rawData,
            range.startYear,
            range.endYear,
            CHART_CONFIG.DEFAULT_DOWNSAMPLE_POINTS
        );

        this.updateLoadingState(type, {
            isLoading: true,
            isParsing: false,
            isSaving: true,
            error: null,
            dataReady: true,
            partialData: result.data
        });

        this.saveDataInBackground(type, result.data, requestId);
        return result.data;
    }

    /**
     * Сохраняет данные в фоне без блокировки UI
     */
    private saveDataInBackground(
        type: WeatherDataType,
        data: WeatherDataPoint[],
        requestId: string
    ): void {
        saveDataToStorage(this.dbManager, type, data, requestId)
            .then(() => {
                this.updateLoadingState(type, {
                    isLoading: false,
                    isParsing: false,
                    isSaving: false,
                    error: null,
                    dataReady: true,
                    partialData: null
                });
            })
            .catch(() => {
                this.updateLoadingState(type, {
                    isLoading: false,
                    isParsing: false,
                    isSaving: false,
                    error: 'Ошибка сохранения данных',
                    dataReady: false,
                    partialData: null
                });
            });
    }

    /**
     * Получает данные погоды для указанного типа и временного диапазона
     * Сначала проверяет наличие данных в кэше, при отсутствии загружает с сервера
     * @param type - тип данных ('temperature' | 'precipitation')
     * @param range - временной диапазон для фильтрации
     * @returns Promise с отфильтрованными данными погоды
     */
    async getWeatherData(type: WeatherDataType, range: YearRange): Promise<WeatherDataPoint[]> {
        try {
            const requestId = `${type}_${range.startYear}_${range.endYear}`;

            if (this.dbManager.isDataComplete(type)) {
                const data = await getDataFromStorage(this.dbManager, type, range);
                if (!data) {
                    throw new WeatherAppError(ERROR_CODES.STORAGE_ERROR, 'No data found in storage');
                }
                return data;
            }

            this.updateLoadingState(type, {
                isLoading: true,
                isParsing: false,
                isSaving: false,
                error: null,
                dataReady: false,
                partialData: null
            });

            try {
                return await this.loadAndProcessData(type, range, requestId);
            } catch (error) {
                this.updateLoadingState(type, {
                    isLoading: false,
                    isParsing: false,
                    isSaving: false,
                    error: `Ошибка загрузки данных: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    dataReady: false,
                    partialData: null
                });
                throw error;
            }
        } catch (error) {
            if (error instanceof WeatherAppError) { throw error; }
            throw new WeatherAppError(ERROR_CODES.STORAGE_ERROR, 'Error retrieving weather data');
        }
    }

    /**
     * Получает текущее состояние загрузки для типа данных
     */
    getLoadingState(type: WeatherDataType): LoadingState {
        return this.loadingStates.get(type) || {
            isLoading: false,
            isParsing: false,
            isSaving: false,
            error: null,
            saveProgress: null,
            dataReady: false,
            partialData: null
        };
    }

    /**
     * Восстанавливает батч в фоне для существующих данных
     */
    private async restoreBatch(type: WeatherDataType, data: WeatherDataPoint[], requestId: string): Promise<void> {
        try {
            await this.dbManager.saveData(type, data, requestId);
            this.updateLoadingState(type, {
                isLoading: false,
                isParsing: false,
                isSaving: false,
                error: null,
                dataReady: true,
                partialData: null
            });
        } catch (_error) {
            this.updateLoadingState(type, {
                isLoading: false,
                isParsing: false,
                isSaving: false,
                error: 'Ошибка восстановления батча',
                dataReady: false,
                partialData: null
            });
        }
    }

    /**
     * Уничтожает сервис и очищает ресурсы
     */
    destroy(): void {
        this.loadingCallbacks.clear();
        this.loadingStates.clear();

        if (this.dataLoader && 'destroy' in this.dataLoader) {
            (this.dataLoader as { destroy(): void }).destroy();
        }

        if (this.dbManager && 'destroy' in this.dbManager) {
            (this.dbManager as IDatabaseManager & { destroy(): void }).destroy();
        }
    }
}
