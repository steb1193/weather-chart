export class WeatherAppError extends Error {
    constructor(public code: string, message: string) {
        super(message);
        this.name = 'WeatherAppError';
    }
}
