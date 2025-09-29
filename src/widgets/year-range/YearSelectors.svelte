<script lang="ts">
    import { Select } from '@shared/ui-kit';
    import { generateYears, validateYearRange } from './utils';

    interface Props {
        startYear: number;
        endYear: number;
        onStartYearChange: (year: number) => void;
        onEndYearChange: (year: number) => void;
    }

    const {
        startYear,
        endYear,
        onStartYearChange,
        onEndYearChange
    }: Props = $props();

    const YEAR_OPTIONS = generateYears();
    const ARIA_LABELS = {
        START_YEAR: 'Выберите начальный год',
        END_YEAR: 'Выберите конечный год'
    } as const;

    function handleStartYearChange(event: Event): void {
        const target = event.target as HTMLSelectElement;
        const year = parseInt(target.value, 10);
        const validated = validateYearRange(year, endYear);
        onStartYearChange(validated.startYear);
    }

    function handleEndYearChange(event: Event): void {
        const target = event.target as HTMLSelectElement;
        const year = parseInt(target.value, 10);
        const validated = validateYearRange(startYear, year);
        onEndYearChange(validated.endYear);
    }
</script>

<div id="selectsContainer">
    <div class="select-group">
        <Select
            options={YEAR_OPTIONS}
            value={startYear}
            onChange={handleStartYearChange}
            ariaLabel={ARIA_LABELS.START_YEAR}
        />
    </div>

    <div class="select-group">
        <Select
            options={YEAR_OPTIONS}
            value={endYear}
            onChange={handleEndYearChange}
            ariaLabel={ARIA_LABELS.END_YEAR}
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
