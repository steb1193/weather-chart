<script lang="ts">
    import { onDestroy } from 'svelte';
    import { Button, Alert, Card } from '@shared/ui-kit';
    import { Chart } from '@widgets/weather-chart';
    import { YearSelectors, validateYearRange } from '@widgets/year-range';
    import { WeatherDataService, ServerDataLoader, type LoadingState } from '@entities/weather-data';
    import { IndexedDBManager } from '@shared/lib';
    import { APP_CONFIG } from '@shared/constants';
    import { WeatherAppError } from '@shared/errors';
    import { type WeatherDataType, type WeatherDataPoint } from '@shared/types';
    import { yearRangeStore, updateYearRange } from '@entities/year-range';

    interface Props {
        weatherType?: WeatherDataType;
    }

    const { weatherType = 'temperature' }: Props = $props();

    let data: WeatherDataPoint[] = $state([]);
    let startYear: number = $state(APP_CONFIG.MIN_YEAR);
    let endYear: number = $state(APP_CONFIG.MAX_YEAR);
    let loadingState: LoadingState = $state({
        isLoading: true,
        isParsing: false,
        isSaving: false,
        error: null,
        saveProgress: null,
        dataReady: false,
        partialData: null
    });

    yearRangeStore.subscribe((range: { startYear: number; endYear: number }) => {
        startYear = range.startYear;
        endYear = range.endYear;
    });

    let dbManager: IndexedDBManager;
    let dataService: WeatherDataService;

    async function initializeServices(): Promise<void> {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            dbManager = new IndexedDBManager();
            await dbManager.init();

            const dataLoader = new ServerDataLoader(dbManager);
            dataService = new WeatherDataService(dbManager, dataLoader);

            dataService.onLoadingStateChange(weatherType, (state) => {
                loadingState = state;
            });
        } catch {
            loadingState = { isLoading: false, isParsing: false, isSaving: false, error: 'Ошибка инициализации сервисов', saveProgress: null, dataReady: false, partialData: null };
        }
    }

    async function loadData(): Promise<void> {
        if (!dataService) {
            return;
        }

        try {
            loadingState = {
                isLoading: true,
                isParsing: false,
                isSaving: false,
                error: null,
                saveProgress: null,
                dataReady: false,
                partialData: null
            };
            const weatherData = await dataService.getWeatherData(weatherType, { startYear, endYear });
            data = weatherData;
        } catch (error) {
            const errorMessage = error instanceof WeatherAppError ? error.message : 'Ошибка загрузки данных';
            loadingState = {
                isLoading: false,
                isParsing: false,
                isSaving: false,
                error: errorMessage,
                saveProgress: null,
                dataReady: false,
                partialData: null
            };
        }
    }

    function handleStartYearChange(year: number): void {
        const validated = validateYearRange(year, endYear);
        updateYearRange(validated.startYear, validated.endYear);
    }

    function handleEndYearChange(year: number): void {
        const validated = validateYearRange(startYear, year);
        updateYearRange(validated.startYear, validated.endYear);
    }

    async function retryLoad(): Promise<void> {
        await loadData();
    }

    async function initialize(): Promise<void> {
        await initializeServices();
        if (dataService) {
            await loadData();
        }
    }

    $effect(() => {
        if (typeof window !== 'undefined' && dataService && weatherType && startYear && endYear) {
            loadData();
        }
    });

    initialize();

    onDestroy(() => {
        if (dataService) {
            dataService.destroy();
        }
    });
</script>

<div class="container">
    <h1 class="page-title">Архив метеослужбы</h1>

    <div class="main-content">
        <div class="chart-area">
            <nav class="navigation">
                <Button
                    href="/"
                    variant="primary"
                    active={weatherType === 'temperature'}
                >
                    Температура
                </Button>
                <Button
                    href="/precipitation"
                    variant="primary"
                    active={weatherType === 'precipitation'}
                >
                    Осадки
                </Button>
            </nav>

            <div class="chart-section">
                <YearSelectors
                    {startYear}
                    {endYear}
                    onStartYearChange={handleStartYearChange}
                    onEndYearChange={handleEndYearChange}
                />

                {#if loadingState.error}
                    <Alert variant="error" dismissible={false} title="Ошибка загрузки данных">
                        <h2>Ошибка загрузки данных</h2>
                        <p>{loadingState.error}</p>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={retryLoad}
                        >
                            Попробовать снова
                        </Button>
                    </Alert>
                {:else if loadingState.dataReady || data.length > 0}
                    <Chart data={data} startYear={startYear} endYear={endYear} dataType={weatherType} />
                {:else if loadingState.isLoading || loadingState.isParsing}
                    <Card padding="lg">
                        <div class="loading">
                            <div class="spinner" aria-hidden="true"></div>
                            <p>{loadingState.isParsing ? 'Обработка данных...' : 'Загрузка данных...'}</p>
                        </div>
                    </Card>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    .container {
        max-width: var(--max-width-xl);
        margin: 0 auto;
        padding: var(--spacing-xl);
    }

    .page-title {
        text-align: left;
        margin-bottom: var(--spacing-xl);
        color: var(--color-text-primary);
    }

    .main-content {
        width: 100%;
    }

    .chart-area {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: var(--spacing-xl);
        align-items: start;
    }

    .navigation {
        grid-column: 1 / 4;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        padding: 0 var(--spacing-lg);
        align-items: flex-start;
    }

    .chart-section {
        grid-column: 4 / 13;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
    }

    .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-xl);
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid var(--color-border-primary);
        border-top: 4px solid var(--color-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
        .chart-area {
            grid-template-columns: 1fr;
            gap: var(--spacing-lg);
        }

        .navigation {
            grid-column: 1;
            flex-direction: row;
            justify-content: center;
        }

        .chart-section {
            grid-column: 1;
        }
    }
</style>
