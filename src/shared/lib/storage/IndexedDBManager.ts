import { ERROR_CODES } from '@shared/constants';
import { WeatherAppError } from '@shared/errors';
import { type WeatherDataPoint, type WeatherDBRecord, type WeatherDataType, type YearRange } from '@shared/types';
import { BatchSaveQueue, type QueueProgressCallback } from './BatchSaveQueue';

export interface IDatabaseManager {
    init(): Promise<void>;
    saveData(type: WeatherDataType, data: WeatherDataPoint[], itemId?: string): Promise<void>;
    getData(type: WeatherDataType, range: YearRange): Promise<WeatherDataPoint[] | null>;
    hasData(type: WeatherDataType): Promise<boolean>;
    onSaveProgress(callback: QueueProgressCallback): () => void;
    hasDataForItem(itemId: string): boolean;
    isDataComplete(type: string): boolean;
}

function createObjectStores(db: IDBDatabase): void {
    if (!db.objectStoreNames.contains('temperature')) {
        const temperatureStore = db.createObjectStore('temperature', { keyPath: 'id' });
        temperatureStore.createIndex('t', 't', { unique: false });
    }

    if (!db.objectStoreNames.contains('precipitation')) {
        const precipitationStore = db.createObjectStore('precipitation', { keyPath: 'id' });
        precipitationStore.createIndex('t', 't', { unique: false });
    }
}

function convertToDBRecord(point: WeatherDataPoint, type: WeatherDataType): WeatherDBRecord {
    return {
        id: `${type}_${point.t}`,
        t: point.t,
        v: point.v,
        type
    };
}

function filterDataByYearRange(records: WeatherDBRecord[], range: YearRange): WeatherDataPoint[] {
    return records
        .filter(record => {
            const year = new Date(record.t).getFullYear();
            return year >= range.startYear && year <= range.endYear;
        })
        .map(record => ({
            t: record.t,
            v: record.v
        }))
        .sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
}

/**
 * Менеджер для работы с IndexedDB
 * Обеспечивает кэширование данных погоды в браузере с батчевым сохранением
 */
export class IndexedDBManager extends BatchSaveQueue implements IDatabaseManager {
    private db: IDBDatabase | null = null;
    private readonly dbName = 'WeatherAppDB';
    private readonly dbVersion = 1;

    constructor() {
        super(100, 'weather_data');
    }

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject(new WeatherAppError(ERROR_CODES.STORAGE_ERROR, 'Failed to open IndexedDB'));
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                createObjectStores(db);
            };
        });
    }

    async saveData(type: WeatherDataType, data: WeatherDataPoint[], itemId?: string): Promise<void> {
        if (!this.db) {
            throw new WeatherAppError(ERROR_CODES.STORAGE_ERROR, 'Database not initialized');
        }

        await this.clearStore(type);

        return this.addToQueue(type, data, itemId);
    }

    /**
     * Очищает хранилище для указанного типа данных
     */
    private async clearStore(type: WeatherDataType): Promise<void> {
        if (!this.db) {
            throw new WeatherAppError(ERROR_CODES.STORAGE_ERROR, 'Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([type], 'readwrite');
            const store = transaction.objectStore(type);
            const clearRequest = store.clear();

            clearRequest.onsuccess = () => resolve();
            clearRequest.onerror = () => {
                reject(new WeatherAppError(ERROR_CODES.STORAGE_ERROR, 'Failed to clear existing data'));
            };
        });
    }

    /**
     * Сохраняет один батч данных в IndexedDB
     */
    protected async saveBatch(type: WeatherDataType, batch: WeatherDataPoint[]): Promise<void> {
        if (!this.db) {
            throw new WeatherAppError(ERROR_CODES.STORAGE_ERROR, 'Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([type], 'readwrite');
            const store = transaction.objectStore(type);

            let completed = 0;
            const total = batch.length;

            if (total === 0) {
                resolve();
                return;
            }

            batch.forEach((point, index) => {
                const record = convertToDBRecord(point, type);
                const request = store.put(record);

                request.onsuccess = () => {
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                };

                request.onerror = () => {
                    reject(new WeatherAppError(ERROR_CODES.STORAGE_ERROR, `Failed to save batch data at index ${index}`));
                };
            });
        });
    }

    onSaveProgress(callback: QueueProgressCallback): () => void {
        return this.onProgress(callback);
    }

    destroy(): void {
        super.destroy();
    }

    async getData(type: WeatherDataType, range: YearRange): Promise<WeatherDataPoint[] | null> {
        if (!this.db) {
            throw new WeatherAppError(ERROR_CODES.STORAGE_ERROR, 'Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([type], 'readonly');
            const store = transaction.objectStore(type);
            const request = store.getAll();

            request.onsuccess = () => {
                const records: WeatherDBRecord[] = request.result;
                const filteredData = filterDataByYearRange(records, range);
                resolve(filteredData.length > 0 ? filteredData : null);
            };

            request.onerror = () => {
                reject(new WeatherAppError(ERROR_CODES.STORAGE_ERROR, 'Failed to retrieve data'));
            };
        });
    }

    async hasData(type: WeatherDataType): Promise<boolean> {
        if (!this.db) {
            return false;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([type], 'readonly');
            const store = transaction.objectStore(type);
            const request = store.count();

            request.onsuccess = () => {
                resolve(request.result > 0);
            };

            request.onerror = () => {
                reject(new WeatherAppError(ERROR_CODES.STORAGE_ERROR, 'Failed to check data existence'));
            };
        });
    }

    /**
     * Проверяет, есть ли данные для указанного элемента в localStorage
     */
    hasDataForItem(itemId: string): boolean {
        return super.hasDataForItem(itemId);
    }

    isDataComplete(type: string): boolean {
        return super.isDataComplete(type);
    }
}