<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { type WeatherDataPoint } from '@shared/types';
    import { CHART_CONFIG } from '@shared/constants';
    import {
        getChartDimensions,
        filterDataByYearRange,
        calculateValueRange,
        downsampleData
    } from './chartUtils';
    import { BatchRenderer, type RenderContext } from '@shared/lib';

    interface Props {
        data: WeatherDataPoint[];
        startYear: number;
        endYear: number;
        dataType?: 'temperature' | 'precipitation';
    }

    const {
        data,
        startYear,
        endYear,
        dataType = 'temperature'
    }: Props = $props();

    let chartContainer: HTMLDivElement;
    let canvas: HTMLCanvasElement;
    let isCanvasReady = false;
    let batchRenderer: BatchRenderer;
    let renderTimeout: number | null = null;
    let lastDataType: 'temperature' | 'precipitation' | null = null;

    onMount(() => {
        batchRenderer = new BatchRenderer();
        isCanvasReady = true;

        if (data?.length) {
            scheduleRender();
        }
    });

    onDestroy(() => {
        if (batchRenderer) {
            batchRenderer.cancel();
        }
        if (renderTimeout) {
            clearTimeout(renderTimeout);
        }
    });

    $effect(() => {
        if (dataType !== lastDataType) {
            lastDataType = dataType;
        }
        if (isCanvasReady && data?.length && batchRenderer && startYear && endYear) {
            scheduleRender();
        }
    });

    function scheduleRender(): void {
        if (renderTimeout) {
            clearTimeout(renderTimeout);
        }

        renderTimeout = requestAnimationFrame(() => {
            drawChart();
            renderTimeout = null;
        });
    }

    async function drawChart(): Promise<void> {
        if (!canvas || !data?.length || !batchRenderer) { return; }

        batchRenderer.cancel();

        const ctx = canvas.getContext('2d');
        if (!ctx) { return; }

        const dpr = window.devicePixelRatio || 1;

        canvas.width = CHART_CONFIG.CANVAS_WIDTH * dpr;
        canvas.height = CHART_CONFIG.CANVAS_HEIGHT * dpr;

        ctx.scale(dpr, dpr);

        const { margin, plotWidth, plotHeight } = getChartDimensions(
            CHART_CONFIG.CANVAS_WIDTH,
            CHART_CONFIG.CANVAS_HEIGHT
        );
        const filteredData = filterDataByYearRange(data, startYear, endYear);

        if (filteredData.length === 0) { return; }

        const t0 = new Date(filteredData[0].t).getTime();
        const t1 = new Date(filteredData[filteredData.length - 1].t).getTime();

        const downsampledData = downsampleData(filteredData);
        const { minValue, valueRange } = calculateValueRange(downsampledData, dataType);

        const renderContext: RenderContext = {
            ctx,
            margin,
            plotWidth,
            plotHeight,
            minValue,
            valueRange,
            dataType,
            t0,
            t1
        };

        await batchRenderer.render(canvas, downsampledData, renderContext);
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