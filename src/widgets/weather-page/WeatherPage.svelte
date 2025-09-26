<script lang="ts">
    import { Button, Alert, Card } from '@shared/ui-kit';
    import { Chart } from '@widgets/weather-chart';
    import { YearSelectors, validateYearRange } from '@widgets/year-range';
    import { WeatherDataService, ServerDataLoader } from '@entities/weather-data';
    import { IndexedDBManager } from '@shared/api-layer';
    import { APP_CONFIG } from '@shared/constants';
    import { WeatherAppError } from '@shared/errors';
    import { type WeatherDataType, type WeatherDataPoint, type LoadingState } from '@shared/types';
    import { yearRangeStore, updateYearRange } from '@entities/year-range';

    export let weatherType: WeatherDataType = 'temperature';

    let data: WeatherDataPoint[] = [];
    let startYear: number = APP_CONFIG.MIN_YEAR;
    let endYear: number = APP_CONFIG.MAX_YEAR;
    let loadingState: LoadingState = { isLoading: true, error: null };

    yearRangeStore.subscribe((range: { startYear: number; endYear: number }) => {
        startYear = range.startYear;
        endYear = range.endYear;
    });

    let dbManager: IndexedDBManager;
    let dataService: WeatherDataService;

    // Инициализация сервисов
    async function initializeServices(): Promise<void> {
        try {
            dbManager = new IndexedDBManager();
            await dbManager.init();

            const dataLoader = new ServerDataLoader();
            dataService = new WeatherDataService(dbManager, dataLoader);
        } catch (_error: unknown) {
            // console.error('Failed to initialize services:', error);
            loadingState = { isLoading: false, error: 'Ошибка инициализации сервисов' };
        }
    }

    // Загрузка данных
    async function loadData(): Promise<void> {
        if (!dataService) {
            return;
        }

        try {
            loadingState = { isLoading: true, error: null };
            const weatherData = await dataService.getWeatherData(weatherType, { startYear, endYear });
            data = weatherData;
            loadingState = { isLoading: false, error: null };
        } catch (error) {
            // console.error('Failed to load data:', error);
            const errorMessage = error instanceof WeatherAppError ? error.message : 'Ошибка загрузки данных';
            loadingState = { isLoading: false, error: errorMessage };
        }
    }

    // Обработчики изменения годов
    function handleStartYearChange(year: number): void {
        const validated = validateYearRange(year, endYear);
        updateYearRange(validated.startYear, validated.endYear);
    }

    function handleEndYearChange(year: number): void {
        const validated = validateYearRange(startYear, year);
        updateYearRange(validated.startYear, validated.endYear);
    }

    // Повторная попытка загрузки
    async function retryLoad(): Promise<void> {
        await loadData();
    }

    // Инициализация при монтировании
    async function initialize(): Promise<void> {
        await initializeServices();
        await loadData();
    }

    // Реактивность на изменение типа погоды
    $: if (dataService && weatherType) {
        loadData();
    }

    // Реактивность на изменение диапазона годов
    $: if (dataService && startYear && endYear) {
        loadData();
    }

    // Инициализация
    initialize();
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

                {#if loadingState.isLoading}
                    <Card padding="lg">
                        <div class="loading">
                            <div class="spinner" aria-hidden="true"></div>
                            <p>Загрузка данных...</p>
                        </div>
                    </Card>
                {:else if loadingState.error}
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
                {:else}
                    <Chart data={data} startYear={startYear} endYear={endYear} dataType={weatherType} />
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
