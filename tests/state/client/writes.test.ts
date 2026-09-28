// Layer 4, state test. How long a write waits for its answer: the duration config/behavior.yml
// names under `writes`, read at each write, and a write that outlasts it given up with the answer
// saying so, so a form waiting on it is let go.
//
// What this does NOT cover: the form's own line and its Save control, which need a DOM.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../src/lib/state/shared/words/text.ts';
import { createWrites, writeTimeout } from '../../../src/lib/state/client/writes.svelte.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

afterEach(() => {
    vi.unstubAllGlobals();
});

/** A fetch that never answers, and fails only once its request is given up. */
function silent(): void {
    vi.stubGlobal(
        'fetch',
        (_url: string, init: RequestInit) =>
            new Promise((_done, fail) => {
                init.signal?.addEventListener('abort', () => fail(new Error('aborted')));
            })
    );
}

describe('the time a write waits', () => {
    it('is the positive number of seconds the configuration names, in milliseconds', () => {
        expect(writeTimeout({ writes: { timeout_seconds: 30 } })).toBe(30000);
        expect(writeTimeout({ writes: { timeout_seconds: 0.5 } })).toBe(500);
    });

    it('is none for a configuration that names no positive number', () => {
        expect(writeTimeout(null)).toBeNull();
        expect(writeTimeout({})).toBeNull();
        expect(writeTimeout({ writes: [] })).toBeNull();
        expect(writeTimeout({ writes: { timeout_seconds: 0 } })).toBeNull();
        expect(writeTimeout({ writes: { timeout_seconds: -3 } })).toBeNull();
        expect(writeTimeout({ writes: { timeout_seconds: '30' } })).toBeNull();
    });
});

describe('a write that no answer reaches', () => {
    it(
        'is given up once the configured time has passed, and says so',
        { timeout: 5000 },
        async () => {
            silent();
            const writes = createWrites(() => ({ writes: { timeout_seconds: 0.05 } }));
            const answer = writes.send({ action: 'set', collection: 'tasks' });
            expect(writes.pending()).toBe(true);
            expect(await answer).toEqual({
                ok: false,
                changed: [],
                refused: [],
                error: t('app.write_timed_out')
            });
            expect(writes.pending()).toBe(false);
            expect(writes.lastError()).toBe(t('app.write_timed_out'));
        }
    );

    it('reads the time at each write, so a changed configuration holds for the next one', async () => {
        silent();
        let seconds = 60;
        const writes = createWrites(() => ({ writes: { timeout_seconds: seconds } }));
        seconds = 0.05;
        expect((await writes.send({ action: 'set' })).error).toBe(t('app.write_timed_out'));
    });
});
