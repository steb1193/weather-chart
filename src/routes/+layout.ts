import type { ItemData } from './type';

export const ssr = false;

export async function load({ params, fetch }) {
    const type = params?.type || 'temperature';

    const res = await fetch(`/${type}.json`);

    if (res.ok) {
        return {
            list: await res.json() as ItemData[],
            type
        };
    }

    throw new Error(`Failed to fetch /${type}.json: ${res.status}`);
}