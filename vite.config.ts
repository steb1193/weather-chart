import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    plugins: [sveltekit(), devtoolsJson()],
    server: { port: 5000 },
    resolve: {
        alias: {
            $lib: path.resolve('./src'),
            '@app': path.resolve('./src/app'),
            '@widgets': path.resolve('./src/widgets'),
            '@features': path.resolve('./src/features'),
            '@entities': path.resolve('./src/entities'),
            '@shared': path.resolve('./src/shared')
        }
    }
});
