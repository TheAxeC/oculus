// The client's store of what the socket delivered: one message per channel, the latest.

import { beforeEach, describe, expect, it } from 'vitest';
import type { Snapshot } from '../../../src/lib/data/model.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;
let config: ClientState['entities']['config'];
let message: ClientState['entities']['message'];
let portfolio: ClientState['entities']['portfolio'];
let receive: ClientState['entities']['receive'];
let usage: ClientState['entities']['usage'];

beforeEach(() => {
    client = createClientState();
    ({ config, message, portfolio, receive, usage } = client.entities);
});

/**
 * A snapshot with the one field this test reads; the shape itself is data/snapshot/normalise's
 * business.
 */
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
    it('takes the first message of a channel after a reconnect whatever its version, then orders again', () => {
        // revert: src/lib/state/client/entities.svelte.ts:66 => const first = false;
        receive({ channel: 'config', version: 7, payload: { config: { a: 1 } } });
        // A restarted server numbers its channels from the start again.
        client.entities.reconnected();
        receive({ channel: 'config', version: 1, payload: { config: { a: 2 } } });
        expect(message('config')?.payload).toEqual({ config: { a: 2 } });
        // After that first message the versions order again on the new connection.
        receive({ channel: 'config', version: 0, payload: { config: { a: 3 } } });
        expect(message('config')?.payload).toEqual({ config: { a: 2 } });
    });

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

    it('hands back the latest usage payload', () => {
        receive({
            channel: 'usage',
            version: 1,
            payload: { accounts: [], days: [], builtAt: '2026-09-13T12:00:00.000Z' }
        });
        expect(usage()?.builtAt).toBe('2026-09-13T12:00:00.000Z');
    });
});
