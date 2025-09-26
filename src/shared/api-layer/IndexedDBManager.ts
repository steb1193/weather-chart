import { ERROR_CODES } from '../constants';
import { WeatherAppError } from '../errors';
import { type WeatherDataPoint, type WeatherDBRecord, type WeatherDataType, type YearRange } from '../types';

export interface IDatabaseManager {
    init(): Promise<void>;
    saveData(type: WeatherDataType, data: WeatherDataPoint[]): Promise<void>;
    getData(type: WeatherDataType, range: YearRange): Promise<WeatherDataPoint[] | null>;
    hasData(type: WeatherDataType): Promise<boolean>;
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

export class IndexedDBManager implements IDatabaseManager {
    private db: IDBDatabase | null = null;
    private readonly dbName = 'WeatherAppDB';
    private readonly dbVersion = 1;

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

    async saveData(type: WeatherDataType, data: WeatherDataPoint[]): Promise<void> {
        if (!this.db) {
            throw new WeatherAppError(ERROR_CODES.STORAGE_ERROR, 'Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([type], 'readwrite');
            const store = transaction.objectStore(type);

            const clearRequest = store.clear();
            clearRequest.onsuccess = () => {
                let completed = 0;
                const total = data.length;

                if (total === 0) {
                    resolve();
                    return;
                }

                data.forEach((point, index) => {
                    const record = convertToDBRecord(point, type);
                    const request = store.add(record);

                    request.onsuccess = () => {
                        completed++;
                        if (completed === total) {
                            resolve();
                        }
                    };

                    request.onerror = () => {
                        reject(new WeatherAppError(ERROR_CODES.STORAGE_ERROR, `Failed to save data at index ${index}`));
                    };
                });
            };

            clearRequest.onerror = () => {
                reject(new WeatherAppError(ERROR_CODES.STORAGE_ERROR, 'Failed to clear existing data'));
            };
        });
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
}