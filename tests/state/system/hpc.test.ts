// Pure Live HPC client state coverage checks walltime, tones, start labels, the three partition
// segments, and the one command the view sends to the endpoint with the answer it folds out.
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
} from '../../../src/lib/state/system/hpc.ts';
import { scalar } from '../../../src/lib/data/helpers/guards.ts';
import type { HpcPayload } from '../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;
let command: ClientState['hpc']['command'];
let jobLog: ClientState['hpc']['jobLog'];
let setToken: ClientState['writes']['setToken'];

beforeEach(() => {
    client = createClientState();
    ({ command, jobLog } = client.hpc);
    ({ setToken } = client.writes);
});

/** The requests the stub fetch was given, newest last. */
let asked: { url: string; init: RequestInit }[] = [];

function answering(body: unknown, status = 200): void {
    asked = [];
    vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
        asked.push({ url, init });
        return Promise.resolve(
            new Response(JSON.stringify(body), {
                status,
                headers: { 'content-type': 'application/json' }
            })
        );
    });
}

afterEach(() => vi.unstubAllGlobals());
describe('HPC state', () => {
    it('derives queue presentation', () => {
        const job = {
            id: '1',
            name: 'x',
            partition: 'p',
            state: 'RUNNING',
            time: '01:00',
            limit: '02:00',
            nodes: '1',
            cpus: '1',
            gpus: '',
            mem: '',
            priority: '',
            start: '2026-09-11T12:30:00',
            reason: ''
        };
        expect(walltimeFraction(job)).toBe(0.5);
        expect(stateTone('PENDING')).toBe('amber');
        expect(efficiencyTone(10)).toBe('red');
        expect(startLabel(job.start)).toBe('09-11 12:30');
    });
    it('aggregates idle, mixed, and allocated partition rows', () =>
        expect(
            partitionMeters([
                { partition: 'gpu', avail: 'up', nodes: 2, state: 'idle', gres: 'gpu:a100' },
                { partition: 'gpu', avail: 'up', nodes: 1, state: 'mix', gres: '' },
                { partition: 'gpu', avail: 'up', nodes: 3, state: 'alloc', gres: '' }
            ])[0]
        ).toMatchObject({ idle: 2, mixed: 1, allocated: 3, total: 6, gpu: true }));

    it('posts one command as JSON with the write token, and reads its answer as a map', async () => {
        setToken('hpc-test-token');
        answering({ status: 'ok', queued: 3 });
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
        answering('not a map');
        expect(await command({ action: 'refresh' })).toEqual({});
    });

    it('folds a log answer into its status and text, and an answer with neither into error', async () => {
        answering({ status: 'ok', log: 'the tail of the file' });
        expect(await jobLog('4711')).toEqual({ status: 'ok', output: 'the tail of the file' });
        expect(JSON.parse(scalar(asked[0].init.body))).toEqual({ action: 'log', id: '4711' });

        answering({});
        expect(await jobLog('4711')).toEqual({ status: 'error', output: '' });
    });
});

describe('the Live HPC held state', () => {
    const defaults = { capacity: true, sinfo: false };

    it.each([[undefined], [null], ['x'], [{}]])('reads %j as the defaults', (raw) => {
        expect(parseHpcState(raw)).toEqual(defaults);
    });

    it('falls back per key, keeping the key that is held', () => {
        expect(parseHpcState({ capacity: false })).toEqual({ capacity: false, sinfo: false });
        expect(parseHpcState({ sinfo: true })).toEqual({ capacity: true, sinfo: true });
    });

    it.each([[{ capacity: 'no', sinfo: 1 }], [{ capacity: null, sinfo: 'true' }], [[]]])(
        'reads the non-boolean or non-map %j as the defaults',
        (raw) => {
            expect(parseHpcState(raw)).toEqual(defaults);
        }
    );

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

    it('writes the new state for a toggle of the sinfo fold, and nothing when it matches', () => {
        expect(toggledHpcState({ capacity: false, sinfo: false }, 'sinfo', true)).toEqual({
            capacity: false,
            sinfo: true
        });
        expect(toggledHpcState({ capacity: false, sinfo: false }, 'sinfo', false)).toBeNull();
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
        expect(pill(1, 0)).toBe('1 HPC job running');
    });

    it('says two running jobs in the plural', () => {
        expect(pill(2, 0)).toBe('2 HPC jobs running');
    });

    it('adds the pending count after the running one', () => {
        expect(pill(2, 3)).toBe('2 HPC jobs running | 3 pending');
    });
});

describe('the HPC command over an answer of the wrong shape', () => {
    it.each([
        ['a list', '[]'],
        ['a list of maps', '[{"status":"ok"}]'],
        ['JSON null', 'null'],
        ['a number', '3'],
        ['a string', '"ok"']
    ])('reads an answer that is %s as no fields at all', async (_name, text) => {
        vi.stubGlobal('fetch', () => Promise.resolve(new Response(text, { status: 200 })));
        expect(await command({ action: 'refresh' })).toStrictEqual({});
    });

    it('hands the map on whole, whatever it holds', async () => {
        answering({ status: 3, extra: [1, { a: null }], log: undefined });
        expect(await command({ action: 'refresh' })).toStrictEqual({
            status: 3,
            extra: [1, { a: null }]
        });
    });

    it('refuses an answer that is no JSON, with the parser error', async () => {
        vi.stubGlobal('fetch', () => Promise.resolve(new Response('<html>', { status: 502 })));
        await expect(command({ action: 'refresh' })).rejects.toBeInstanceOf(SyntaxError);
    });

    it.each([
        [
            'a status that is a number',
            { status: 3, log: 'text' },
            { status: 'error', output: 'text' }
        ],
        ['a status that is empty', { status: '', log: 'text' }, { status: '', output: 'text' }],
        [
            'a status that is null',
            { status: null, log: 'text' },
            { status: 'error', output: 'text' }
        ],
        ['a log that is a number', { status: 'ok', log: 4 }, { status: 'ok', output: '' }],
        ['a log that is a list', { status: 'ok', log: ['a'] }, { status: 'ok', output: '' }],
        ['a log that is empty', { status: 'ok', log: '' }, { status: 'ok', output: '' }],
        [
            'an output key instead of a log',
            { status: 'ok', output: 'x' },
            { status: 'ok', output: '' }
        ]
    ])('folds an answer with %s into a status and a text', async (_name, body, expected) => {
        answering(body);
        expect(await jobLog('4711')).toStrictEqual(expected);
    });

    it.each([[[]], [null], ['ok'], [3]])(
        'folds an answer that is %j into the error status and no text',
        async (body) => {
            answering(body);
            expect(await jobLog('4711')).toStrictEqual({ status: 'error', output: '' });
        }
    );
});

describe('the Live HPC held state over a key of the wrong type', () => {
    it.each([
        ['a key that is the word true', { capacity: 'true', sinfo: 'true' }],
        ['a key that is a number', { capacity: 0, sinfo: 1 }],
        ['a key that is a map', { capacity: {}, sinfo: {} }],
        ['a key that is a list', { capacity: [true], sinfo: [false] }]
    ])('reads %s as the defaults', (_name, raw) => {
        expect(parseHpcState(raw)).toStrictEqual({ capacity: true, sinfo: false });
    });

    it('answers the capacity before the sinfo, and only those keys', () => {
        const held = parseHpcState({ sinfo: true, capacity: false, extra: 1 });
        expect(Object.keys(held)).toStrictEqual(['capacity', 'sinfo']);
        expect(held).toStrictEqual({ capacity: false, sinfo: true });
    });

    it('reads a held map one key at a time', () => {
        expect(parseHpcState({ capacity: 'true', sinfo: true })).toStrictEqual({
            capacity: true,
            sinfo: true
        });
        expect(parseHpcState({ capacity: false, sinfo: 'true' })).toStrictEqual({
            capacity: false,
            sinfo: false
        });
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
        ['05', '10', 0.5],
        ['3:00:00', '1:00:00', 1],
        ['', '1:00', 0],
        ['x', '1:00', null],
        ['1:00', 'UNLIMITED', null],
        ['1:00', 'INVALID', null],
        ['1:00', '', null],
        ['1:00', '0:00', null],
        ['1:00', '0', null],
        ['Infinity', '1:00', 1],
        ['1:00', 'Infinity', 0],
        ['1:xx', '2:00', null]
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
        ['2026-09-11T12:30', '09-11 12:30'],
        ['2026-09-11 12:30:00', '2026-09-11 12:30:00'],
        ['N/A', 'N/A'],
        ['', ''],
        ['Unknown', 'Unknown']
    ])('labels the start %j as %j', (value, expected) => {
        expect(startLabel(value)).toBe(expected);
    });

    it.each([
        [100, 'green'],
        [90, 'green'],
        [89.9, 'amber'],
        [25, 'amber'],
        [24.9, 'red'],
        [0, 'red'],
        [-1, 'red'],
        [Number.POSITIVE_INFINITY, 'green'],
        [Number.NaN, 'amber'],
        [null, undefined]
    ])('tones an efficiency of %j as %j', (pct, expected) => {
        expect(efficiencyTone(pct)).toBe(expected);
    });

    it.each([
        ['RUNNING', 'green'],
        ['PENDING', 'amber'],
        ['running', 'slate'],
        ['', 'slate'],
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
