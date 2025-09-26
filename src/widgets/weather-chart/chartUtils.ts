import { type WeatherDataPoint } from '@shared/types';
import { CHART_CONFIG, CHART_COLORS } from '@shared/constants';

interface LTTBPoint { x: number; y: number; originalIndex: number; }

export interface ChartDimensions {
  margin: number;
  plotWidth: number;
  plotHeight: number;
}

export interface ValueRange {
  minValue: number;
  maxValue: number;
  valueRange: number;
  step: number;
}

export function getChartDimensions(canvasWidth: number, canvasHeight: number): ChartDimensions {
    const margin = CHART_CONFIG.CANVAS_MARGIN + CHART_CONFIG.LEFT_MARGIN_BOOST;
    const doubleMargin = 2 * margin;
    const plotWidth = canvasWidth - doubleMargin;
    const plotHeight = canvasHeight - doubleMargin;
    return { margin, plotWidth, plotHeight };
}

export function filterDataByYearRange(
    data: WeatherDataPoint[],
    startYear: number,
    endYear: number
): WeatherDataPoint[] {
    const filtered = data.filter(p => {
        const y = new Date(p.t).getFullYear();
        return y >= startYear && y <= endYear;
    });
    return filtered.sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
}

function calculateNiceStep(range: number, maxTicks: number): number {
    const maxTicksSafe = Math.max(maxTicks, 1);
    const rough = range / maxTicksSafe;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
    const normalized = rough / magnitude;

    let nice: number;
    if (normalized <= 1) {
        nice = 1;
    } else if (normalized <= 2) {
        nice = 2;
    } else if (normalized <= 5) {
        nice = 5;
    } else {
        nice = 10;
    }

    return nice * magnitude;
}

function calculateNiceLimits(min: number, max: number, paddingPercent: number) {
    const rawRange = Math.max(max - min, CHART_CONFIG.EPSILON);
    const padding = rawRange * paddingPercent;
    let paddedMin = min - padding;
    let paddedMax = max + padding;

    const step = calculateNiceStep(paddedMax - paddedMin, CHART_CONFIG.Y_AXIS_LABELS_COUNT);

    paddedMin = Math.floor(paddedMin / step) * step;
    paddedMax = Math.ceil(paddedMax / step) * step;

    return { min: paddedMin, max: paddedMax, step };
}

export function calculateValueRange(filteredData: WeatherDataPoint[], dataType: 'temperature' | 'precipitation' = 'temperature'): ValueRange {
    const values = filteredData.map(d => d.v);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    const niceLimits = calculateNiceLimits(minValue, maxValue, CHART_CONFIG.Y_AXIS_PADDING_PERCENT);

    // Для осадков минимальное значение не должно быть меньше 0
    const adjustedMin = dataType === 'precipitation' ? Math.max(0, niceLimits.min) : niceLimits.min;
    const valueRange = niceLimits.max - adjustedMin;

    return {
        minValue: adjustedMin,
        maxValue: niceLimits.max,
        valueRange,
        step: niceLimits.step
    };
}

function lttbDownsample(data: WeatherDataPoint[], targetPoints: number): WeatherDataPoint[] {
    if (data.length <= targetPoints) {
        return data;
    }

    const points: LTTBPoint[] = data.map((point, index) => ({
        x: new Date(point.t).getTime(),
        y: point.v,
        originalIndex: index
    }));

    const bucketSize = (points.length - 2) / (targetPoints - 2);
    const downsampled: LTTBPoint[] = [points[0]];

    for (let i = 1; i < targetPoints - 1; i++) {
        const bucketStart = Math.floor(i * bucketSize) + 1;
        const bucketEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, points.length - 1);

        let maxArea = -1;
        let maxAreaIndex = bucketStart;

        for (let j = bucketStart; j < bucketEnd; j++) {
            const lastPoint = downsampled[downsampled.length - 1];
            const nextPoint = points[bucketEnd];
            const currentPoint = points[j];

            const firstTerm = (lastPoint.x - nextPoint.x) * (currentPoint.y - lastPoint.y);
            const secondTerm = (lastPoint.x - currentPoint.x) * (nextPoint.y - lastPoint.y);
            const area = Math.abs(firstTerm - secondTerm);

            if (area > maxArea) {
                maxArea = area;
                maxAreaIndex = j;
            }
        }
        downsampled.push(points[maxAreaIndex]);
    }

    downsampled.push(points[points.length - 1]);
    return downsampled.map(point => data[point.originalIndex]);
}

export function downsampleData(data: WeatherDataPoint[], maxPoints = CHART_CONFIG.DEFAULT_DOWNSAMPLE_POINTS) {
    return lttbDownsample(data, maxPoints);
}

function timeProgress(t: number, t0: number, t1: number) {
    return (t - t0) / Math.max(t1 - t0, 1);
}

export function calculateXByTime(
    timeMs: number,
    tStart: number,
    tEnd: number,
    margin: number,
    plotWidth: number
): number {
    const progress = timeProgress(timeMs, tStart, tEnd);
    return margin + (progress * plotWidth);
}

export function calculateYCoordinate(
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

export function drawGrid(
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

export function drawChartLine(
    ctx: CanvasRenderingContext2D,
    data: WeatherDataPoint[],
    margin: number,
    plotWidth: number,
    plotHeight: number,
    minValue: number,
    valueRange: number,
    dataType: 'temperature' | 'precipitation'
): void {
    if (data.length === 0) { return; }

    const t0 = new Date(data[0].t).getTime();
    const t1 = new Date(data[data.length - 1].t).getTime();

    ctx.strokeStyle = dataType === 'temperature' ? CHART_COLORS.TEMPERATURE : CHART_COLORS.PRECIPITATION;
    ctx.lineWidth = CHART_CONFIG.LINE_WIDTH;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();

    data.forEach((p, i) => {
        const t = new Date(p.t).getTime();
        const x = calculateXByTime(t, t0, t1, margin, plotWidth);
        const y = calculateYCoordinate(p.v, minValue, valueRange, margin, plotHeight);
        if (i === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
    });

    ctx.stroke();
}

export function drawDataPoints(
    ctx: CanvasRenderingContext2D,
    data: WeatherDataPoint[],
    margin: number,
    plotWidth: number,
    plotHeight: number,
    minValue: number,
    valueRange: number,
    dataType: 'temperature' | 'precipitation'
): void {
    if (data.length === 0) { return; }
    const t0 = new Date(data[0].t).getTime();
    const t1 = new Date(data[data.length - 1].t).getTime();

    ctx.fillStyle = dataType === 'temperature' ? CHART_COLORS.TEMPERATURE : CHART_COLORS.PRECIPITATION;

    data.forEach(p => {
        const t = new Date(p.t).getTime();
        const x = calculateXByTime(t, t0, t1, margin, plotWidth);
        const y = calculateYCoordinate(p.v, minValue, valueRange, margin, plotHeight);
        ctx.beginPath();
        ctx.arc(x, y, CHART_CONFIG.POINT_RADIUS, 0, 2 * Math.PI);
        ctx.fill();
    });
}

export function drawAxes(
    ctx: CanvasRenderingContext2D,
    margin: number,
    plotWidth: number,
    plotHeight: number
): void {
    ctx.strokeStyle = CHART_COLORS.AXIS;
    ctx.lineWidth = CHART_CONFIG.AXIS_LINE_WIDTH;

    // X
    ctx.beginPath();
    ctx.moveTo(margin, margin + plotHeight);
    ctx.lineTo(margin + plotWidth, margin + plotHeight);
    ctx.stroke();

    // Y
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, margin + plotHeight);
    ctx.stroke();
}

export function drawYAxisLabels(
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

    for (let v = minValue; v <= minValue + valueRange + 1e-9; v += step) {
        const valueRatio = (v - minValue) / valueRange;
        const y = margin + plotHeight - (valueRatio * plotHeight);
        ctx.fillText(v.toFixed(1), margin - CHART_CONFIG.TEXT_OFFSET_X, y);
    }
}

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

    if (totalDays <= 30) {
        stepDays = Math.max(1, Math.ceil(totalDays / CHART_CONFIG.MAX_X_LABELS));
        formatFunction = d => String(d.getDate());
    } else if (totalDays <= CHART_CONFIG.DAYS_PER_YEAR) {
        stepDays = Math.max(7, Math.ceil(totalDays / CHART_CONFIG.MAX_X_LABELS));
        formatFunction = d => `${d.getDate()}/${d.getMonth() + 1}`;
    } else if (totalDays <= CHART_CONFIG.DAYS_PER_YEAR * 5) {
        stepDays = Math.max(CHART_CONFIG.DAYS_PER_MONTH, Math.ceil(totalDays / CHART_CONFIG.MAX_X_LABELS));
        formatFunction = d => `${d.getMonth() + 1}/${d.getFullYear()}`;
    } else {
        stepDays = Math.max(CHART_CONFIG.DAYS_PER_YEAR, Math.ceil(totalDays / CHART_CONFIG.MAX_X_LABELS));
        formatFunction = d => String(d.getFullYear());
    }

    const labelCount = Math.min(CHART_CONFIG.MAX_X_LABELS, Math.floor(totalDays / stepDays) + 1);
    const labels: Array<{ label: string; x: number; first: boolean; last: boolean }> = [];
    const maxCount = Math.max(labelCount, 2);

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

export function drawXAxisLabels(
    ctx: CanvasRenderingContext2D,
    filteredData: WeatherDataPoint[],
    margin: number,
    plotWidth: number,
    plotHeight: number
): void {
    ctx.fillStyle = CHART_COLORS.TEXT;
    ctx.font = `${CHART_CONFIG.FONT_SIZE}px ${CHART_CONFIG.FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const labels = buildSmartDateLabels(filteredData, margin, plotWidth);

    let lastRightPosition = -Infinity;
    const labelY = margin + plotHeight + CHART_CONFIG.X_AXIS_LABEL_OFFSET;
    const minGap = CHART_CONFIG.MIN_GAP_BETWEEN_LABELS;
    const plotLeftBound = margin + CHART_CONFIG.PLOT_BOUNDARY_OFFSET;
    const plotRightBound = margin + plotWidth - CHART_CONFIG.PLOT_BOUNDARY_OFFSET;

    labels.forEach(label => {
        const clampedX = Math.min(plotRightBound, Math.max(plotLeftBound, label.x));
        const textWidth = ctx.measureText(label.label).width;
        const halfTextWidth = textWidth / 2;

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

export function drawAxisTitles(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    dataType: 'temperature' | 'precipitation'
): void {
    ctx.font = `${CHART_CONFIG.TITLE_FONT_SIZE}px ${CHART_CONFIG.FONT_FAMILY}`;
    ctx.fillStyle = CHART_COLORS.TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // «Года» ниже — у самого низа канвы
    const yTitle = canvasHeight - CHART_CONFIG.X_TITLE_FROM_BOTTOM;
    ctx.fillText('Года', canvasWidth / 2, yTitle);

    // Y-ось
    ctx.save();
    ctx.translate(CHART_CONFIG.AXIS_TITLE_TRANSLATE_X, canvasHeight / 2);
    ctx.rotate(CHART_CONFIG.AXIS_TITLE_ROTATION);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dataType === 'temperature' ? 'Температура (°C)' : 'Осадки (мм)', 0, 0);
    ctx.restore();
}
