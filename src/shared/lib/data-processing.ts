import { type WeatherDataPoint } from '../types';
import { CHART_CONFIG } from '@shared/constants';

interface LTTBPoint {
    x: number;
    y: number;
    originalIndex: number;
}

/**
 * Фильтрует данные по диапазону лет
 */
export function filterDataByYearRange(
    data: WeatherDataPoint[],
    startYear: number,
    endYear: number
): WeatherDataPoint[] {
    return data.filter(point => {
        const year = new Date(point.t).getFullYear();
        return year >= startYear && year <= endYear;
    });
}

/**
 * Рассчитывает площадь треугольника для LTTB алгоритма
 */
function calculateTriangleArea(pointA: LTTBPoint, pointB: LTTBPoint, pointC: LTTBPoint): number {
    const deltaXAC = pointA.x - pointC.x;
    const deltaYBA = pointB.y - pointA.y;
    const deltaXAB = pointA.x - pointB.x;
    const deltaYCA = pointC.y - pointA.y;

    const firstProduct = deltaXAC * deltaYBA;
    const secondProduct = deltaXAB * deltaYCA;
    const crossProduct = firstProduct - secondProduct;
    return Math.abs(crossProduct) / CHART_CONFIG.TRIANGLE_AREA_DIVISOR;
}

/**
 * Находит точку с максимальной площадью в группе для LTTB
 */
function findMaxAreaPointInBucket(bucket: LTTBPoint[], pointA: LTTBPoint, pointC: LTTBPoint): LTTBPoint {
    let maxArea = -1;
    let maxAreaPoint = bucket[0];

    for (const point of bucket) {
        const area = calculateTriangleArea(pointA, point, pointC);
        if (area > maxArea) {
            maxArea = area;
            maxAreaPoint = point;
        }
    }

    return maxAreaPoint;
}

/**
 * Выполняет даунсемплинг данных с помощью алгоритма LTTB (Largest Triangle Three Buckets)
 */
export function lttbDownsample(data: WeatherDataPoint[], maxPoints: number): WeatherDataPoint[] {
    if (data.length <= maxPoints) {
        return data;
    }

    const bucketSize = (data.length - 2) / (maxPoints - 2);
    const sampled: WeatherDataPoint[] = [];

    sampled.push(data[0]);

    for (let i = 1; i < maxPoints - 1; i++) {
        const bucketStart = Math.floor(i * bucketSize) + 1;
        const bucketEnd = Math.floor((i + 1) * bucketSize) + 1;

        const bucket = data.slice(bucketStart, bucketEnd).map((point, index) => ({
            x: bucketStart + index,
            y: point.v,
            originalIndex: bucketStart + index
        }));

        const pointA = {
            x: sampled[sampled.length - 1].v,
            y: sampled[sampled.length - 1].v,
            originalIndex: sampled.length - 1
        };

        const pointC = {
            x: bucketEnd < data.length ? bucketEnd : data.length - 1,
            y: bucketEnd < data.length ? data[bucketEnd].v : data[data.length - 1].v,
            originalIndex: bucketEnd < data.length ? bucketEnd : data.length - 1
        };

        const maxAreaPoint = findMaxAreaPointInBucket(bucket, pointA, pointC);
        sampled.push(data[maxAreaPoint.originalIndex]);
    }

    sampled.push(data[data.length - 1]);
    return sampled;
}

/**
 * Рассчитывает статистику данных
 */
export function calculateStats(data: WeatherDataPoint[]): {
    minValue: number;
    maxValue: number;
    avgValue: number;
} {
    if (data.length === 0) {
        return { minValue: 0, maxValue: 0, avgValue: 0 };
    }

    let minValue = data[0].v;
    let maxValue = data[0].v;
    let sum = 0;

    for (const point of data) {
        minValue = Math.min(minValue, point.v);
        maxValue = Math.max(maxValue, point.v);
        sum += point.v;
    }

    return {
        minValue,
        maxValue,
        avgValue: sum / data.length
    };
}

/**
 * Основная функция обработки данных
 */
export function processWeatherData(
    rawData: WeatherDataPoint[],
    startYear: number,
    endYear: number,
    maxPoints: number = CHART_CONFIG.DEFAULT_DOWNSAMPLE_POINTS
): {
    data: WeatherDataPoint[];
    stats: {
        originalCount: number;
        filteredCount: number;
        downsampledCount: number;
        minValue: number;
        maxValue: number;
        avgValue: number;
    };
} {
    const originalCount = rawData.length;

    const filteredData = filterDataByYearRange(rawData, startYear, endYear);
    const filteredCount = filteredData.length;

    const downsampledData = lttbDownsample(filteredData, maxPoints);
    const downsampledCount = downsampledData.length;

    const stats = calculateStats(downsampledData);

    return {
        data: downsampledData,
        stats: {
            originalCount,
            filteredCount,
            downsampledCount,
            ...stats
        }
    };
}
