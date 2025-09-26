<script lang="ts">
    import { onMount } from 'svelte';
    import { type WeatherDataPoint } from '@shared/types';
    import { CHART_COLORS, CHART_CONFIG } from '@shared/constants';
    import {
        getChartDimensions,
        filterDataByYearRange,
        calculateValueRange,
        downsampleData,
        drawGrid,
        drawChartLine,
        drawDataPoints,
        drawAxes,
        drawYAxisLabels,
        drawXAxisLabels,
        drawAxisTitles
    } from './chartUtils';

    export let data: WeatherDataPoint[];
    export let startYear: number;
    export let endYear: number;
    export let dataType: 'temperature' | 'precipitation' = 'temperature';

    let chartContainer: HTMLDivElement;
    let canvas: HTMLCanvasElement;
    let isCanvasReady = false;

    onMount(() => {
        isCanvasReady = true;

        if (canvas) {
            canvas.width = 1200;
            canvas.height = 600;
        }

        if (data?.length) {
            drawChart();
        }
    });

    $: if (isCanvasReady && data?.length) {
        drawChart();
    }

    function clearCanvas(ctx: CanvasRenderingContext2D): void {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = CHART_COLORS.BACKGROUND;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawChart(): void {
        if (!canvas || !data?.length) { return; }

        const ctx = canvas.getContext('2d');
        if (!ctx) { return; }

        const dpr = window.devicePixelRatio || 1;

        canvas.width = CHART_CONFIG.CANVAS_WIDTH * dpr;
        canvas.height = CHART_CONFIG.CANVAS_HEIGHT * dpr;

        ctx.scale(dpr, dpr);

        clearCanvas(ctx);
        const { margin, plotWidth, plotHeight } = getChartDimensions(
            CHART_CONFIG.CANVAS_WIDTH,
            CHART_CONFIG.CANVAS_HEIGHT
        );
        const filteredData = filterDataByYearRange(data, startYear, endYear);

        if (filteredData.length === 0) { return; }

        const downsampledData = downsampleData(filteredData);
        const { minValue, valueRange, step } = calculateValueRange(downsampledData, dataType);

        drawGrid(ctx, margin, plotWidth, plotHeight);
        drawChartLine(ctx, downsampledData, margin, plotWidth, plotHeight, minValue, valueRange, dataType);
        drawDataPoints(ctx, downsampledData, margin, plotWidth, plotHeight, minValue, valueRange, dataType);
        drawAxes(ctx, margin, plotWidth, plotHeight);
        drawYAxisLabels(ctx, margin, plotHeight, minValue, valueRange, step);
        drawXAxisLabels(ctx, downsampledData, margin, plotWidth, plotHeight);
        drawAxisTitles(ctx, CHART_CONFIG.CANVAS_WIDTH, CHART_CONFIG.CANVAS_HEIGHT, dataType);
    }
</script>

<div bind:this={chartContainer} id="chartContainer">
    <canvas bind:this={canvas}></canvas>
</div>

<style>
    #chartContainer {
        display: flex;
        justify-content: center;
        background-color: transparent;
        border-radius: var(--radius-md);
    }
        canvas {
            width: var(--chart-width);
            height: var(--chart-height);
        max-width: 100%;
        border-radius: var(--radius-sm);
        display: block;
        margin: 0;
        padding: 0;
    }
</style>