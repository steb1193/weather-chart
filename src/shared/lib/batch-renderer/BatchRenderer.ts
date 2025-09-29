import { type WeatherDataPoint } from '@shared/types';
import { CHART_COLORS, CHART_CONFIG } from '@shared/constants';

export interface RenderContext {
    ctx: CanvasRenderingContext2D;
    margin: number;
    plotWidth: number;
    plotHeight: number;
    minValue: number;
    valueRange: number;
    dataType: 'temperature' | 'precipitation';
    t0: number;
    t1: number;
}

function calculateXByTime(
    timeMs: number,
    tStart: number,
    tEnd: number,
    margin: number,
    plotWidth: number
): number {
    const progress = (timeMs - tStart) / Math.max(tEnd - tStart, 1);
    return margin + (progress * plotWidth);
}

function calculateYCoordinate(
    pointValue: number,
    minValue: number,
    valueRange: number,
    margin: number,
    plotHeight: number
): number {
    const normalizedValue = (pointValue - minValue) / valueRange;
    const yOffset = normalizedValue * plotHeight;
    return margin + plotHeight - yOffset;
}

function drawGrid(
    ctx: CanvasRenderingContext2D,
    margin: number,
    plotWidth: number,
    plotHeight: number
): void {
    ctx.strokeStyle = CHART_COLORS.GRID;
    ctx.lineWidth = CHART_CONFIG.GRID_LINE_WIDTH;

    for (let i = 0; i <= CHART_CONFIG.GRID_LINES_COUNT; i++) {
        const xRatio = i / CHART_CONFIG.GRID_LINES_COUNT;
        const x = margin + (plotWidth * xRatio);
        ctx.beginPath();
        ctx.moveTo(x, margin);
        ctx.lineTo(x, margin + plotHeight);
        ctx.stroke();
    }
    for (let i = 0; i <= CHART_CONFIG.GRID_LINES_COUNT; i++) {
        const yRatio = i / CHART_CONFIG.GRID_LINES_COUNT;
        const y = margin + (plotHeight * yRatio);
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(margin + plotWidth, y);
        ctx.stroke();
    }
}

function drawChartLineBatch(
    ctx: CanvasRenderingContext2D,
    batch: WeatherDataPoint[],
    margin: number,
    plotWidth: number,
    plotHeight: number,
    minValue: number,
    valueRange: number,
    dataType: 'temperature' | 'precipitation',
    t0: number,
    t1: number,
    isFirstBatch: boolean
): void {
    if (batch.length === 0) { return; }

    if (isFirstBatch) {
        ctx.strokeStyle = dataType === 'temperature' ? CHART_COLORS.TEMPERATURE : CHART_COLORS.PRECIPITATION;
        ctx.lineWidth = CHART_CONFIG.LINE_WIDTH;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
    }

    batch.forEach((p, i) => {
        const t = new Date(p.t).getTime();
        const x = calculateXByTime(t, t0, t1, margin, plotWidth);
        const y = calculateYCoordinate(p.v, minValue, valueRange, margin, plotHeight);

        if (isFirstBatch && i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    if (!isFirstBatch) {
        ctx.stroke();
    }
}

function drawDataPointsBatch(
    ctx: CanvasRenderingContext2D,
    batch: WeatherDataPoint[],
    margin: number,
    plotWidth: number,
    plotHeight: number,
    minValue: number,
    valueRange: number,
    dataType: 'temperature' | 'precipitation',
    t0: number,
    t1: number
): void {
    if (batch.length === 0) { return; }

    ctx.fillStyle = dataType === 'temperature' ? CHART_COLORS.TEMPERATURE : CHART_COLORS.PRECIPITATION;

    batch.forEach(p => {
        const t = new Date(p.t).getTime();
        const x = calculateXByTime(t, t0, t1, margin, plotWidth);
        const y = calculateYCoordinate(p.v, minValue, valueRange, margin, plotHeight);
        ctx.beginPath();
        ctx.arc(x, y, CHART_CONFIG.POINT_RADIUS, 0, CHART_CONFIG.CIRCLE_FULL_ANGLE);
        ctx.fill();
    });
}

function drawAxes(
    ctx: CanvasRenderingContext2D,
    margin: number,
    plotWidth: number,
    plotHeight: number
): void {
    ctx.strokeStyle = CHART_COLORS.AXIS;
    ctx.lineWidth = CHART_CONFIG.AXIS_LINE_WIDTH;

    ctx.beginPath();
    ctx.moveTo(margin, margin + plotHeight);
    ctx.lineTo(margin + plotWidth, margin + plotHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, margin + plotHeight);
    ctx.stroke();
}

function drawYAxisLabels(
    ctx: CanvasRenderingContext2D,
    margin: number,
    plotHeight: number,
    minValue: number,
    valueRange: number,
    step: number
): void {
    ctx.fillStyle = CHART_COLORS.TEXT;
    ctx.font = `${CHART_CONFIG.FONT_SIZE}px ${CHART_CONFIG.FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let v = minValue; v <= minValue + valueRange + CHART_CONFIG.EPSILON; v += step) {
        const valueRatio = (v - minValue) / valueRange;
        const y = margin + plotHeight - (valueRatio * plotHeight);
        ctx.fillText(v.toFixed(CHART_CONFIG.VALUE_PRECISION), margin - CHART_CONFIG.TEXT_OFFSET_X, y);
    }
}

/**
 * Создает умные метки дат для оси X с адаптивным форматом
 */
function buildSmartDateLabels(
    data: WeatherDataPoint[],
    margin: number,
    plotWidth: number
): Array<{ label: string; x: number; first: boolean; last: boolean }> {
    if (data.length === 0) {
        return [];
    }

    const startTime = new Date(data[0].t).getTime();
    const endTime = new Date(data[data.length - 1].t).getTime();
    const timeSpan = Math.max(endTime - startTime, 1);
    const totalDays = Math.ceil(timeSpan / CHART_CONFIG.MILLISECONDS_PER_DAY);

    let stepDays: number;
    let formatFunction: (d: Date) => string;

    if (totalDays <= CHART_CONFIG.SHORT_PERIOD_DAYS) {
        stepDays = Math.max(CHART_CONFIG.MIN_STEP_DAYS, Math.ceil(totalDays / CHART_CONFIG.MAX_X_LABELS));
        formatFunction = d => String(d.getDate());
    } else if (totalDays <= CHART_CONFIG.MEDIUM_PERIOD_DAYS) {
        stepDays = Math.max(CHART_CONFIG.WEEK_STEP_DAYS, Math.ceil(totalDays / CHART_CONFIG.MAX_X_LABELS));
        formatFunction = d => `${d.getDate()}/${d.getMonth() + 1}`;
    } else if (totalDays <= CHART_CONFIG.LONG_PERIOD_DAYS) {
        stepDays = Math.max(CHART_CONFIG.MONTH_STEP_DAYS, Math.ceil(totalDays / CHART_CONFIG.MAX_X_LABELS));
        formatFunction = d => `${d.getMonth() + 1}/${d.getFullYear()}`;
    } else {
        stepDays = Math.max(CHART_CONFIG.YEAR_STEP_DAYS, Math.ceil(totalDays / CHART_CONFIG.MAX_X_LABELS));
        formatFunction = d => String(d.getFullYear());
    }

    const labelCount = Math.min(CHART_CONFIG.MAX_X_LABELS, Math.floor(totalDays / stepDays) + 1);
    const labels: Array<{ label: string; x: number; first: boolean; last: boolean }> = [];
    const maxCount = Math.max(labelCount, CHART_CONFIG.MIN_LABEL_COUNT);

    for (let i = 0; i < maxCount; i++) {
        const progressRatio = i / Math.max(maxCount - 1, 1);
        const currentTime = startTime + (timeSpan * progressRatio);
        const x = calculateXByTime(currentTime, startTime, endTime, margin, plotWidth);

        labels.push({
            label: formatFunction(new Date(currentTime)),
            x,
            first: i === 0,
            last: i === maxCount - 1
        });
    }

    return labels;
}

function drawXAxisLabels(
    ctx: CanvasRenderingContext2D,
    data: WeatherDataPoint[],
    margin: number,
    plotWidth: number,
    plotHeight: number
): void {
    ctx.fillStyle = CHART_COLORS.TEXT;
    ctx.font = `${CHART_CONFIG.FONT_SIZE}px ${CHART_CONFIG.FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const labels = buildSmartDateLabels(data, margin, plotWidth);

    let lastRightPosition = -Infinity;
    const labelY = margin + plotHeight + CHART_CONFIG.X_AXIS_LABEL_OFFSET;
    const minGap = CHART_CONFIG.MIN_GAP_BETWEEN_LABELS;
    const plotLeftBound = margin + CHART_CONFIG.PLOT_BOUNDARY_OFFSET;
    const plotRightBound = margin + plotWidth - CHART_CONFIG.PLOT_BOUNDARY_OFFSET;

    labels.forEach(label => {
        const clampedX = Math.min(plotRightBound, Math.max(plotLeftBound, label.x));
        const textWidth = ctx.measureText(label.label).width;
        const halfTextWidth = textWidth / CHART_CONFIG.TEXT_WIDTH_HALF_DIVISOR;

        const leftEdge = label.first ? clampedX : clampedX - halfTextWidth;
        const rightEdge = label.last ? clampedX : clampedX + halfTextWidth;

        if (leftEdge - lastRightPosition >= minGap) {
            let alignment: CanvasTextAlign;
            if (label.first) {
                alignment = 'left';
            } else if (label.last) {
                alignment = 'right';
            } else {
                alignment = 'center';
            }
            ctx.textAlign = alignment;
            ctx.fillText(label.label, clampedX, labelY);
            lastRightPosition = rightEdge;
        }
    });
}

function drawAxisTitles(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    dataType: 'temperature' | 'precipitation'
): void {
    ctx.font = `${CHART_CONFIG.TITLE_FONT_SIZE}px ${CHART_CONFIG.FONT_FAMILY}`;
    ctx.fillStyle = CHART_COLORS.TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const yTitle = canvasHeight - CHART_CONFIG.X_TITLE_FROM_BOTTOM;
    ctx.fillText('Года', canvasWidth / CHART_CONFIG.CANVAS_CENTER_X_DIVISOR, yTitle);

    ctx.save();
    ctx.translate(CHART_CONFIG.AXIS_TITLE_TRANSLATE_X, canvasHeight / CHART_CONFIG.CANVAS_CENTER_Y_DIVISOR);
    ctx.rotate(CHART_CONFIG.AXIS_TITLE_ROTATION);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dataType === 'temperature' ? 'Температура (°C)' : 'Осадки (мм)', 0, 0);
    ctx.restore();
}

/**
 * Класс для асинхронного батчевого рендеринга canvas
 * Разбивает рендеринг на небольшие части для предотвращения блокировки UI
 */
export class BatchRenderer {
    private isRendering = false;
    private currentRenderId = 0;
    private animationFrameId: number | null = null;

    async render(
        canvas: HTMLCanvasElement,
        data: WeatherDataPoint[],
        renderContext: RenderContext
    ): Promise<void> {
        const renderId = ++this.currentRenderId;
        this.isRendering = true;

        try {
            await this.renderStep(() => this.clearCanvas(canvas, renderContext.ctx), renderId);

            await this.renderStep(() => {
                drawGrid(renderContext.ctx, renderContext.margin,
                    renderContext.plotWidth, renderContext.plotHeight);
                drawAxes(renderContext.ctx, renderContext.margin,
                    renderContext.plotWidth, renderContext.plotHeight);
            }, renderId);

            await this.renderStep(() => {
                drawYAxisLabels(renderContext.ctx, renderContext.margin,
                    renderContext.plotHeight, renderContext.minValue,
                    renderContext.valueRange, renderContext.valueRange / CHART_CONFIG.Y_AXIS_LABELS_COUNT);
                drawXAxisLabels(renderContext.ctx, data, renderContext.margin,
                    renderContext.plotWidth, renderContext.plotHeight);
                drawAxisTitles(renderContext.ctx,
                    canvas.width / CHART_CONFIG.DEVICE_PIXEL_RATIO,
                    canvas.height / CHART_CONFIG.DEVICE_PIXEL_RATIO,
                    renderContext.dataType);
            }, renderId);
            await this.renderDataBatches(data, renderContext, renderId);
        } finally {
            if (renderId === this.currentRenderId) {
                this.isRendering = false;
            }
        }
    }

    /**
     * Выполняет один шаг рендеринга с проверкой отмены
     */
    private async renderStep(step: () => void, renderId: number): Promise<void> {
        if (renderId !== this.currentRenderId) {
            return;
        }

        return new Promise(resolve => {
            this.animationFrameId = requestAnimationFrame(() => {
                this.animationFrameId = null;
                if (renderId === this.currentRenderId) {
                    step();
                }
                resolve();
            });
        });
    }

    /**
     * Рендерит данные батчами для предотвращения блокировки UI
     */
    private async renderDataBatches(
        data: WeatherDataPoint[],
        context: RenderContext,
        renderId: number
    ): Promise<void> {
        const batchSize = CHART_CONFIG.RENDER_BATCH_SIZE;
        const batches = this.createDataBatches(data, batchSize);

        for (let i = 0; i < batches.length; i++) {
            if (renderId !== this.currentRenderId) {
                break;
            }

            const batch = batches[i];
            const isFirstBatch = i === 0;
            const isLastBatch = i === batches.length - 1;

            await this.renderStep(
                () => drawChartLineBatch(context.ctx, batch, context.margin,
                    context.plotWidth, context.plotHeight, context.minValue,
                    context.valueRange, context.dataType, context.t0, context.t1,
                    isFirstBatch),
                renderId
            );

            if (isLastBatch) {
                await this.renderStep(() => context.ctx.stroke(), renderId);
            }
        }

        for (let i = 0; i < batches.length; i++) {
            if (renderId !== this.currentRenderId) {
                break;
            }

            const batch = batches[i];
            await this.renderStep(
                () => drawDataPointsBatch(context.ctx, batch, context.margin,
                    context.plotWidth, context.plotHeight, context.minValue,
                    context.valueRange, context.dataType, context.t0, context.t1),
                renderId
            );
        }
    }

    private createDataBatches(data: WeatherDataPoint[], batchSize: number): WeatherDataPoint[][] {
        const batches: WeatherDataPoint[][] = [];
        for (let i = 0; i < data.length; i += batchSize) {
            batches.push(data.slice(i, i + batchSize));
        }
        return batches;
    }

    private clearCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        const dpr = CHART_CONFIG.DEVICE_PIXEL_RATIO;
        const logicalWidth = canvas.width / dpr;
        const logicalHeight = canvas.height / dpr;

        ctx.clearRect(0, 0, logicalWidth, logicalHeight);
        ctx.fillStyle = CHART_COLORS.BACKGROUND;
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);
    }

    cancel(): void {
        this.currentRenderId++;
        this.isRendering = false;

        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}