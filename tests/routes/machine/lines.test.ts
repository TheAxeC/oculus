// Layer 4, route test. GET /api/lines answers the counter's answer: 200 with the count, 500 with
// the sentence saying what failed. The counter is handed the request's signal, so a closed request
// stops the count.

import { describe, expect, it, vi } from 'vitest';
import { handleLines } from '../../../src/lib/server/machine/lines.ts';
import type { LineCount } from '../../../src/lib/data/model/index.ts';
import { COUNT } from '../../server/machine/line-counts.ts';

function request(): Request {
    return new Request('http://127.0.0.1:8791/api/lines', {
        headers: { origin: 'http://127.0.0.1:8791', host: '127.0.0.1:8791' }
    });
}

describe('the line count route', () => {
    it('answers with the count', async () => {
        const count = vi.fn<(signal: AbortSignal) => Promise<LineCount>>(() =>
            Promise.resolve(COUNT)
        );
        const asked = request();
        const response = await handleLines(asked, count);
        expect(count).toHaveBeenCalledWith(asked.signal);
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('application/json');
        expect(await response.json()).toEqual(COUNT);
        expect(count).toHaveBeenCalledTimes(1);
    });

    it('answers 500 with the sentence when the count failed', async () => {
        const count = vi.fn(() => Promise.resolve({ error: 'cloc exited with code 1.' }));
        const response = await handleLines(request(), count);
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: 'cloc exited with code 1.' });
    });
});
