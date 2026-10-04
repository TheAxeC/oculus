// Layer 2, client-state tests. The Live HPC client state: walltime, tones, start labels, the
// partition segments, the held state of a pane, the words of the pill, and the one command the view
// sends to the endpoint with the answer it folds out.
//
// Nothing opens a socket: `fetch` is a stub that records the request and hands back the answer the
// case wants, and nothing reads or writes outside it.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    efficiencyTone,
    parseHpcState,
    partitionMeters,
    startLabel,
    stateTone,
    toggledHpcState,
    walltimeFraction
} from '../../../../src/lib/state/system/machine/hpc.ts';
import { scalar } from '../../../../src/lib/data/helpers/guards.ts';
import type { HpcPayload } from '../../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';
import { createClientState, type ClientState } from '../../../fixtures/client.ts';
import { asked, serving } from '../../client/fetch-record.ts';

let client: ClientState;
let command: ClientState['hpc']['command'];
let jobLog: ClientState['hpc']['jobLog'];
let setToken: ClientState['writes']['setToken'];

beforeEach(() => {
    client = createClientState();
    ({ command, jobLog } = client.hpc);
    ({ setToken } = client.writes);
});

afterEach(() => vi.unstubAllGlobals());

describe('HPC state', () => {
    it('posts one command as JSON with the write token, and reads its answer as a map', async () => {
        setToken('hpc-test-token');
        serving(200, { status: 'ok', queued: 3 });
        const answer = await command({ action: 'refresh' });
        expect(asked).toHaveLength(1);
        expect(asked[0].url).toBe('/api/hpc');
        expect(asked[0].init.method).toBe('POST');
        expect(asked[0].init.headers).toEqual({
            'content-type': 'application/json',
            'x-oculus-token': 'hpc-test-token'
        });
        expect(JSON.parse(scalar(asked[0].init.body))).toEqual({ action: 'refresh' });
        expect(answer).toEqual({ status: 'ok', queued: 3 });
    });

    it('reads an answer that is no map as no fields at all', async () => {
        serving(200, []);
        expect(await command({ action: 'refresh' })).toEqual({});
    });

    it('folds a log answer into its status and text, and an answer with neither into error', async () => {
        serving(200, { status: 'ok', log: 'the tail of the file' });
        expect(await jobLog('4711')).toEqual({ status: 'ok', output: 'the tail of the file' });
        expect(JSON.parse(scalar(asked[0].init.body))).toEqual({ action: 'log', id: '4711' });

        serving(200, {});
        expect(await jobLog('4711')).toEqual({ status: 'error', output: '' });
    });
});

describe('the Live HPC held state', () => {
    const defaults = { capacity: true, sinfo: false };

    it.each([
        ['no map at all', undefined],
        ['a list', []],
        ['a map with neither key', {}],
        ['keys that are the word true', { capacity: 'true', sinfo: 'true' }],
        ['keys that are numbers', { capacity: 0, sinfo: 1 }]
    ])('reads %s as the defaults', (_name, raw) => {
        expect(parseHpcState(raw)).toEqual(defaults);
    });

    it('falls back per key, keeping the key that is held', () => {
        expect(parseHpcState({ capacity: false })).toEqual({ capacity: false, sinfo: false });
        expect(parseHpcState({ sinfo: true })).toEqual({ capacity: true, sinfo: true });
    });

    it('ignores every other key of the held map', () => {
        expect(parseHpcState({ capacity: false, sinfo: true, label: 'x' })).toEqual({
            capacity: false,
            sinfo: true
        });
    });

    it('writes nothing for a toggle that matches the held capacity, and the new state otherwise', () => {
        expect(toggledHpcState({ capacity: true, sinfo: false }, 'capacity', true)).toBeNull();
        expect(toggledHpcState({ capacity: true, sinfo: false }, 'capacity', false)).toEqual({
            capacity: false,
            sinfo: false
        });
    });
});

describe('the HPC pill', () => {
    setCatalog(textCatalog(loadConfig(engineDir()).config));

    /** The pill's words over an answer with the counts given. */
    function pill(running: number, pending: number): string {
        const payload: HpcPayload = {
            status: 'ok',
            jobs: [],
            running,
            pending,
            total: running + pending,
            recent: [],
            sinfo: [],
            quota: [],
            updated: '2026-09-11T12:00:00.000Z',
            pollMin: 20,
            retryMin: 2,
            host: 'fixture'
        };
        client.entities.receive({ channel: 'hpc', version: 1, payload });
        return client.hpc.pillText();
    }

    it('says one running job in the singular', () => {
        expect(pill(1, 0)).toBe(t('hpc.pill_running_one'));
    });

    it('says two running jobs in the plural', () => {
        expect(pill(2, 0)).toBe(t('hpc.pill_running', 2));
    });

    it('adds the pending count after the running one', () => {
        expect(pill(2, 3)).toBe(t('hpc.pill_running', 2) + t('hpc.pill_pending', 3));
    });
});

describe('the walltime of a job over times that are not clock times', () => {
    const running = (time: string, limit: string) =>
        ({
            state: 'RUNNING',
            time,
            limit
        }) as unknown as Parameters<typeof walltimeFraction>[0];

    it.each([
        ['01:00', '02:00', 0.5],
        ['1-00:00:00', '2-00:00:00', 0.5],
        ['3:00:00', '1:00:00', 1],
        ['', '1:00', 0],
        ['x', '1:00', null],
        ['1:00', 'UNLIMITED', null],
        ['1:00', '0:00', null]
    ])('reads %j of %j as %j', (time, limit, expected) => {
        expect(walltimeFraction(running(time, limit))).toStrictEqual(expected);
    });

    it('reads a job that is not running as none', () => {
        const job = { state: 'PENDING', time: '1:00', limit: '2:00' };
        expect(
            walltimeFraction(job as unknown as Parameters<typeof walltimeFraction>[0])
        ).toBeNull();
    });
});

describe('the HPC words over values that are not the ones expected', () => {
    it.each([
        ['2026-09-11T12:30:00', '09-11 12:30'],
        ['N/A', 'N/A']
    ])('labels the start %j as %j', (value, expected) => {
        expect(startLabel(value)).toBe(expected);
    });

    it.each([
        [90, 'green'],
        [89.9, 'amber'],
        [25, 'amber'],
        [24.9, 'red'],
        [null, undefined]
    ])('tones an efficiency of %j as %j', (pct, expected) => {
        expect(efficiencyTone(pct)).toBe(expected);
    });

    it.each([
        ['RUNNING', 'green'],
        ['PENDING', 'amber'],
        ['COMPLETED', 'slate']
    ])('tones the state %j as %j', (state, expected) => {
        expect(stateTone(state)).toBe(expected);
    });

    it('counts a partition row by the start of its state, whatever the case', () => {
        const rows = [
            { partition: 'gpu', avail: 'up', nodes: 1, state: 'IDLE', gres: '' },
            { partition: 'gpu', avail: 'up', nodes: 2, state: 'Mixed', gres: '' },
            { partition: 'gpu', avail: 'up', nodes: 4, state: 'drained', gres: '' },
            { partition: 'cpu', avail: 'up', nodes: 8, state: 'idle~', gres: 'gpu:1' },
            { partition: 'cpu', avail: 'up', nodes: 16, state: '', gres: '' }
        ];
        expect(partitionMeters(rows)).toStrictEqual([
            { name: 'gpu', idle: 1, mixed: 2, allocated: 4, total: 7, gpu: true },
            { name: 'cpu', idle: 8, mixed: 0, allocated: 16, total: 24, gpu: true }
        ]);
    });
});
