<script lang="ts">
    import { Select } from '@shared/ui-kit';
    import { generateYears, validateYearRange } from './utils';

    export let startYear: number;
    export let endYear: number;
    export let onStartYearChange: (year: number) => void;
    export let onEndYearChange: (year: number) => void;

    let currentStartYear = startYear;
    let currentEndYear = endYear;

    const yearOptions = generateYears();

    function handleStartYearChange(event: Event): void {
        const target = event.target as HTMLSelectElement;
        const year = parseInt(target.value, 10);
        const validated = validateYearRange(year, currentEndYear);
        currentStartYear = validated.startYear;
        currentEndYear = validated.endYear;
        onStartYearChange(currentStartYear);
    }

    function handleEndYearChange(event: Event): void {
        const target = event.target as HTMLSelectElement;
        const year = parseInt(target.value, 10);
        const validated = validateYearRange(currentStartYear, year);
        currentStartYear = validated.startYear;
        currentEndYear = validated.endYear;
        onEndYearChange(currentEndYear);
    }

    // Обновляем локальные значения при изменении пропсов
    $: currentStartYear = startYear;
    $: currentEndYear = endYear;
</script>

<div id="selectsContainer">
    <div class="select-group">
        <Select
            options={yearOptions}
            value={currentStartYear}
            onChange={handleStartYearChange}
            ariaLabel="Выберите начальный год"
        />
    </div>

    <div class="select-group">
        <Select
            options={yearOptions}
            value={currentEndYear}
            onChange={handleEndYearChange}
            ariaLabel="Выберите конечный год"
        />
    </div>
</div>

<style>
    #selectsContainer {
        display: flex;
        gap: var(--spacing-lg);
        justify-content: stretch;
        align-items: end;
    }

    .select-group {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }
</style>
