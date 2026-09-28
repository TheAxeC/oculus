// Pure Live HPC client state coverage checks walltime, tones, start labels, the three partition
// segments, and the one command the view sends to the endpoint with the answer it folds out.
//
// Nothing opens a socket: `fetch` is a stub that records the request and hands back the answer the
// case wants, and nothing reads or writes outside it.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    efficiencyTone,
    partitionMeters,
    startLabel,
    stateTone,
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
