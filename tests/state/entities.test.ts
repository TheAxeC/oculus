// The client's store of what the socket delivered: one message per channel, the latest.

import { describe, expect, it } from 'vitest';
import { config, message, portfolio, receive } from '../../src/lib/state/entities.svelte.ts';
import type { Snapshot } from '../../src/lib/data/model.ts';

/** A snapshot with the one field this test reads; the shape itself is data/normalise's business. */
function snapshot(version: number, projects: string[]): Snapshot {
    const entities = Object.fromEntries(projects.map((id) => [id, { id }]));
    return {
        version,
        entities: { projects: entities },
        relations: {},
        findings: []
    } as unknown as Snapshot;
}

describe('receive', () => {
    it('stores a message under its channel', () => {
        receive({ channel: 'sessions', version: 1, payload: { live: 2 } });
        expect(message('sessions')).toEqual({
            channel: 'sessions',
            version: 1,
            payload: { live: 2 }
        });
        expect(message('slurm')).toBe(null);
    });

    it('keeps the newer message and drops an older one', () => {
        receive({ channel: 'git', version: 2, payload: 'second' });
        receive({ channel: 'git', version: 1, payload: 'first' });
        expect(message('git')?.payload).toBe('second');

        receive({ channel: 'git', version: 3, payload: 'third' });
        expect(message('git')?.payload).toBe('third');
    });

    it('takes a message at the version it already holds, which a resubscribe resends', () => {
        receive({ channel: 'radar', version: 4, payload: 'a' });
        receive({ channel: 'radar', version: 4, payload: 'b' });
        expect(message('radar')?.payload).toBe('b');
    });
});

describe('the two typed channels', () => {
    it('are null until their message arrives', () => {
        expect(portfolio()).toBe(null);
        expect(config()).toBe(null);
    });

    it('hand back the payload of the latest message', () => {
        receive({ channel: 'portfolio', version: 1, payload: snapshot(1, ['loewner']) });
        receive({
            channel: 'config',
            version: 1,
            payload: { config: {}, text: { 'app.title': 'oculus' }, findings: [] }
        });

        expect(portfolio()?.version).toBe(1);
        expect(Object.keys(portfolio()?.entities.projects ?? {})).toEqual(['loewner']);
        expect(config()?.text['app.title']).toBe('oculus');

        receive({ channel: 'portfolio', version: 2, payload: snapshot(2, ['loewner', 'engram']) });
        expect(portfolio()?.version).toBe(2);
    });
});
