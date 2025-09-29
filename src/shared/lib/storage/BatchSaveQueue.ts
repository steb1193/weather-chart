import { type WeatherDataPoint, type WeatherDataType } from '@shared/types';
import { BATCH_CONFIG } from '@shared/constants';

export interface BatchSaveItem {
    id: string;
    type: WeatherDataType;
    data: WeatherDataPoint[];
    resolve: () => void;
    reject: (error: Error) => void;
}

export interface QueueProgress {
    totalItems: number;
    processedItems: number;
    currentBatch: number;
    totalBatches: number;
    isProcessing: boolean;
}

export interface QueueState {
    lastProcessedIndex: number;
    totalItems: number;
    lastProcessedTime: number;
    lastProcessedItemId: string | null;
    isComplete: boolean;
    isIncomplete: boolean;
}

export type QueueProgressCallback = (progress: QueueProgress) => void;

/**
 * Очередь для батчевого сохранения данных в IndexedDB
 * Обрабатывает данные порциями по 100 записей с индикацией прогресса
 */
export abstract class BatchSaveQueue {
    private queue: BatchSaveItem[] = [];
    private isProcessing = false;
    private progressCallbacks = new Set<QueueProgressCallback>();
    private currentProgress: QueueProgress = {
        totalItems: 0,
        processedItems: 0,
        currentBatch: 0,
        totalBatches: 0,
        isProcessing: false
    };
    private readonly storageKey: string;
    private visibilityHandler: (() => void) | null = null;
    private currentItemIndex = 0;
    private totalItemsCount = 0;

    constructor(
        private batchSize: number = BATCH_CONFIG.DEFAULT_BATCH_SIZE,
        private queueId: string = BATCH_CONFIG.DEFAULT_QUEUE_ID
    ) {
        this.storageKey = `batchSaveQueue_${this.queueId}`;
        this.setupVisibilityHandling();
        this.restoreState();
    }

    /**
     * Подписывается на изменения прогресса очереди
     */
    onProgress(callback: QueueProgressCallback): () => void {
        this.progressCallbacks.add(callback);

        callback(this.currentProgress);

        return () => {
            this.progressCallbacks.delete(callback);
        };
    }

    /**
     * Добавляет данные в очередь для сохранения
     */
    async addToQueue(type: WeatherDataType, data: WeatherDataPoint[], itemId?: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const item: BatchSaveItem = {
                id: itemId || `${type}_${Date.now()}_${Math.random()}`,
                type,
                data,
                resolve,
                reject
            };

            this.queue.push(item);
            this.totalItemsCount += data.length;

            this.currentItemIndex = 0;
            this.currentProgress.processedItems = 0;

            this.updateProgress();

            if (!this.isProcessing) {
                this.processQueue();
            }
        });
    }

    /**
     * Обновляет прогресс и уведомляет подписчиков
     */
    private updateProgress(): void {
        const processedItems = this.currentProgress.processedItems;
        const totalBatches = Math.ceil(this.totalItemsCount / this.batchSize);

        this.currentProgress = {
            totalItems: this.totalItemsCount,
            processedItems,
            currentBatch: Math.floor(processedItems / this.batchSize) + 1,
            totalBatches,
            isProcessing: this.isProcessing
        };

        this.progressCallbacks.forEach(callback => {
            callback(this.currentProgress);
        });

        this.saveState();
    }

    /**
     * Обрабатывает очередь батчами
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;
        this.updateProgress();

        try {
            while (this.queue.length > 0) {
                const item = this.queue.shift();
                if (!item) { break; }

                await this.processItem(item);
            }
        } catch (error) {
            while (this.queue.length > 0) {
                const item = this.queue.shift();
                if (item) {
                    item.reject(error instanceof Error ? error : new Error('Unknown error'));
                }
            }
        } finally {
            this.isProcessing = false;
            this.updateProgress();
        }
    }

    /**
     * Обрабатывает один элемент очереди батчами
     */
    private async processItem(item: BatchSaveItem): Promise<void> {
        const { data, type } = item;
        const batches = this.createBatches(data);

        try {
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                await this.saveBatch(type, batch);

                this.currentItemIndex += batch.length;
                this.currentProgress.processedItems = this.currentItemIndex;
                this.updateProgress();
            }

            this.saveItemCompletion(item.id);
            item.resolve();
        } catch (error) {
            item.reject(error instanceof Error ? error : new Error('Batch save failed'));
        }
    }

    /**
     * Разбивает данные на батчи
     */
    private createBatches(data: WeatherDataPoint[]): WeatherDataPoint[][] {
        const batches: WeatherDataPoint[][] = [];

        for (let i = 0; i < data.length; i += this.batchSize) {
            batches.push(data.slice(i, i + this.batchSize));
        }

        return batches;
    }

    /**
     * Сохраняет один батч в IndexedDB
     * Переопределяется в наследниках
     */
    protected abstract saveBatch(type: WeatherDataType, batch: WeatherDataPoint[]): Promise<void>;

    /**
     * Получает текущий прогресс
     */
    getProgress(): QueueProgress {
        return { ...this.currentProgress };
    }

    /**
     * Проверяет, активна ли очередь
     */
    isActive(): boolean {
        return this.isProcessing || this.queue.length > 0;
    }

    /**
     * Очищает очередь
     */
    clear(): void {
        while (this.queue.length > 0) {
            const item = this.queue.shift();
            if (item) {
                item.reject(new Error('Queue cleared'));
            }
        }

        this.currentProgress = {
            totalItems: 0,
            processedItems: 0,
            currentBatch: 0,
            totalBatches: 0,
            isProcessing: false
        };

        this.currentItemIndex = 0;
        this.totalItemsCount = 0;

        this.updateProgress();
        this.saveState();
    }

    /**
     * Настраивает обработку событий видимости страницы
     */
    private setupVisibilityHandling(): void {
        this.visibilityHandler = () => {
            if (document.visibilityState === 'visible' && this.queue.length > 0) {
                this.restoreState();
            } else if (document.visibilityState === 'hidden') {
                this.saveState();
            }
        };

        document.addEventListener('visibilitychange', this.visibilityHandler);
    }

    /**
     * Сохраняет состояние очереди в localStorage
     */
    private saveState(): void {
        const currentItemId = this.queue.length > 0 ? this.queue[0].id : null;
        const state: QueueState = {
            lastProcessedIndex: this.currentItemIndex,
            totalItems: this.totalItemsCount,
            lastProcessedTime: Date.now(),
            lastProcessedItemId: currentItemId,
            isComplete: false,
            isIncomplete: true
        };

        localStorage.setItem(this.storageKey, JSON.stringify(state));
    }

    /**
     * Сохраняет информацию о завершении обработки элемента
     */
    private saveItemCompletion(itemId: string): void {
        const state: QueueState = {
            lastProcessedIndex: this.currentItemIndex,
            totalItems: this.totalItemsCount,
            lastProcessedTime: Date.now(),
            lastProcessedItemId: itemId,
            isComplete: this.queue.length === 0,
            isIncomplete: false
        };

        localStorage.setItem(this.storageKey, JSON.stringify(state));

        if (this.queue.length === 0) {
            this.setDataCompleteFlag(itemId);
        }
    }

    /**
     * Устанавливает флаг полной загрузки данных для указанного типа
     */
    private setDataCompleteFlag(itemId: string): void {
        const type = itemId.split('_')[0];
        localStorage.setItem(`data_complete_${type}`, 'true');
    }

    /**
     * Проверяет, полностью ли загружены данные для указанного типа
     */
    isDataComplete(type: string): boolean {
        return localStorage.getItem(`data_complete_${type}`) === 'true';
    }

    /**
     * Восстанавливает состояние очереди из localStorage
     */
    private restoreState(): void {
        try {
            const savedState = localStorage.getItem(this.storageKey);
            if (!savedState) { return; }

            const state: QueueState = JSON.parse(savedState);

            const timeDiff = Date.now() - state.lastProcessedTime;
            if (timeDiff > 5 * 60 * 1000) {
                localStorage.removeItem(this.storageKey);
                return;
            }

            this.currentItemIndex = state.lastProcessedIndex;
            this.currentProgress.processedItems = state.lastProcessedIndex;
            this.totalItemsCount = state.totalItems;
            this.isProcessing = false;

            this.updateProgress();
        } catch {
            localStorage.removeItem(this.storageKey);
        }
    }

    /**
     * Проверяет, есть ли данные в localStorage для указанного элемента
     */
    hasDataForItem(itemId: string): boolean {
        try {
            const savedState = localStorage.getItem(this.storageKey);
            if (!savedState) {
                return false;
            }

            const state: QueueState = JSON.parse(savedState);

            const timeDiff = Date.now() - state.lastProcessedTime;
            if (timeDiff > 5 * 60 * 1000) {
                localStorage.removeItem(this.storageKey);
                return false;
            }

            const result = state.lastProcessedItemId === itemId && !state.isIncomplete;
            return result;
        } catch {
            return false;
        }
    }

    /**
     * Уничтожает очередь и очищает обработчики
     */
    destroy(): void {
        if (this.visibilityHandler) {
            document.removeEventListener('visibilitychange', this.visibilityHandler);
        }
        this.clear();
    }
}
