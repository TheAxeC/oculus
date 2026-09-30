// The Live HPC view rendered to HTML: its four heads and every drawable acceptance item use one
// synthetic socket payload.
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import Hpc from '../../../src/lib/views/system/hpc/Hpc.svelte';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import type { HpcPayload } from '../../../src/lib/data/model/index.ts';
import { noop } from '../../fixtures/doubles.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;
let receive: ClientState['entities']['receive'];

beforeEach(() => {
    client = createClientState();
    ({ receive } = client.entities);
});
setCatalog(textCatalog(loadConfig(engineDir()).config));
const instance = { id: 'hpc-one', view: 'hpc', title: 'Live HPC', state: {} };
const payload: HpcPayload = {
    status: 'ok',
    jobs: [
        {
            id: '42',
            name: 'train',
            partition: 'gpu',
            state: 'RUNNING',
            time: '01:00',
            limit: '02:00',
            nodes: '1',
            cpus: '8',
            gpus: '2',
            mem: '64G',
            priority: '9',
            start: '2026-09-11T12:30:00',
            reason: 'node1'
        }
    ],
    running: 1,
    pending: 0,
    total: 1,
    recent: [
        {
            id: '41',
            name: 'done',
            state: 'COMPLETED',
            exit: '0:0',
            elapsed: '10:00',
            end: '2026-09-11T10:00:00',
            memPct: 50,
            memUsed: '1G',
            memReq: '2G',
            cpuPct: 90
        }
    ],
    sinfo: [
        { partition: 'gpu', avail: 'up', nodes: 2, state: 'idle', gres: 'gpu:a100:4' },
        { partition: 'gpu', avail: 'up', nodes: 1, state: 'mix', gres: 'gpu:a100:4' },
        { partition: 'gpu', avail: 'up', nodes: 3, state: 'alloc', gres: 'gpu:a100:4' }
    ],
    quota: [{ name: 'home', used: '10G', limit: '100G', pct: 10 }],
    updated: '2026-09-11T12:00:00.000Z',
    pollMin: 20,
    retryMin: 2,
    host: 'fixture'
};
/** The view drawn from whatever the client already holds, with no new message. */
function again(pane: typeof instance = instance): string {
    return render(Hpc, { context: clientContext(client), props: { instance: pane } }).body;
}
/** The view drawn from one payload, with the pane holding the state the case gives it. */
function drawHeld(data: HpcPayload, held: unknown, version: number): string {
    client.ui.setInstanceState(instance.id, held);
    return draw(data, version);
}
/** The opening tag of the `<details>` whose class names the fold, or the empty string. */
function foldTag(body: string, fold: 'capacity' | 'sinfo'): string {
    return new RegExp(`<details[^>]*class="[^"]*\\b${fold}\\b[^"]*"[^>]*>`).exec(body)?.[0] ?? '';
}
/** The fold from its opening tag to its own closing tag, counting the folds nested in it. */
function fold(body: string, which: 'capacity' | 'sinfo'): string {
    const tag = foldTag(body, which);
    if (tag === '') return '';
    const start = body.indexOf(tag);
    const marks = /<details\b|<\/details>/g;
    marks.lastIndex = start + tag.length;
    let depth = 1;
    for (let mark = marks.exec(body); mark; mark = marks.exec(body)) {
        depth += mark[0] === '</details>' ? -1 : 1;
        if (depth === 0) return body.slice(start, mark.index + mark[0].length);
    }
    return body.slice(start);
}
/** Whether an opening tag carries the `open` attribute. */
const isOpen = (tag: string): boolean => /\sopen(=|\s|>)/.test(tag);
function draw(data: HpcPayload, version: number): string {
    receive({ channel: 'hpc', version, payload: data });
    return again();
}
/**
 * The same draw with the page's minute clock standing at a chosen moment: the head reads that clock
 * to decide whether the answer on screen is older than the poll that should have replaced it, and
 * the clock takes its first reading when the client's stores are built.
 */
function drawAt(moment: string, data: HpcPayload, version: number): string {
    vi.useFakeTimers();
    try {
        vi.setSystemTime(Date.parse(moment));
        client = createClientState();
        ({ receive } = client.entities);
        return draw(data, version);
    } finally {
        vi.useRealTimers();
    }
}
describe('Live HPC view', () => {
    it('draws heading, meta, partition segments, disk, every queue column, recent jobs, log controls, and footer', () => {
        const body = draw(payload, 1);
        for (const text of [
            'Live HPC',
            '1 running',
            'Cluster capacity (1 partition)',
            'sinfo table (3 rows)',
            'disk',
            'Job',
            'Name',
            'Partition',
            'State',
            'Time',
            'Limit',
            'Used',
            'Nodes',
            'CPU',
            'GPU',
            'Mem',
            'Prio',
            'Est. start',
            'Node / Reason',
            'Cancel job',
            'log',
            'Recent (finished) - 1',
            'Polls squeue'
        ])
            expect(body).toContain(text);
        expect(body).toMatch(/class="idle\s/);
        expect(body).toMatch(/class="mixed\s/);
        expect(body).toMatch(/class="allocated\s/);
    });
    it('draws the live status in its own positive span', () => {
        const body = draw(payload, 2);
        expect(body).toMatch(/class="[^"]*ok[^"]*"[^>]*>[^<]*live/);
        expect(body).toContain('1 running');
    });
    it('audits that assigns the live and failure status spans their semantic colour tokens and bold weight', () => {
        const source = readFileSync('src/lib/views/system/hpc/Head.svelte', 'utf8');
        expect(source).toMatch(/\.ok\s*{[^}]*--c-green-d-txt[^}]*font-weight:\s*600/s);
        expect(source).toMatch(/\.bad\s*{[^}]*--c-red-d-txt[^}]*font-weight:\s*600/s);
    });
    it('lays the disk meters out in responsive columns', () => {
        const source = readFileSync('src/lib/views/system/hpc/Quota.svelte', 'utf8');
        expect(source).toMatch(
            /\.meters\s*{[^}]*grid-template-columns:\s*repeat\(auto-fill, minmax\(230px, 1fr\)\)/s
        );
    });
    it('draws the empty queue words in the header and queue body', () => {
        const body = draw({ ...payload, jobs: [], running: 0, total: 0 }, 3);
        expect(body).toContain('queue empty');
        expect(body).toContain('No jobs in the queue for you right now.');
    });
    it('draws the empty queue line through the empty primitive, and only for an empty queue', () => {
        const empty = draw({ ...payload, jobs: [], running: 0, total: 0 }, 31);
        const at = empty.search(/class="empty[\s"]/);
        expect(at).toBeGreaterThan(-1);
        const line = empty.slice(at, empty.indexOf('</p>', at));
        expect(line).toMatch(/<span class="message">[^]*No jobs in the queue for you right now\./);
        const queued = draw(payload, 32);
        expect(queued).toContain('<table');
        // the cluster answers and the queue holds a job, so no list in the body is said to be empty
        expect(queued.search(/class="empty[\s"]/)).toBe(-1);
    });
    it('leaves a fresh answer unmarked', () => {
        const body = drawAt('2026-09-11T12:10:00.000Z', payload, 10);
        expect(body).toContain('as of');
        // the answer is fresh, so nothing is late
        expect(body).not.toContain('the next poll is late');
        // and nothing carries the late mark either
        expect(body).not.toMatch(/class="[^"]*\blate\b[^"]*"/);
    });
    it('marks the as of part late once the next poll is overdue', () => {
        const body = drawAt('2026-09-11T12:23:00.000Z', payload, 11);
        expect(body).toContain('the next poll is late');
        expect(body).toMatch(/class="[^"]*\blate\b[^"]*"/);
    });
    it('names when the cluster was last reached and keeps the last good rows under the failure', () => {
        const body = drawAt(
            '2026-09-11T12:23:00.000Z',
            {
                ...payload,
                status: 'unreachable',
                hint: 'ssh: connect to host fixture port 22: Operation timed out',
                lastOk: '2026-09-11T12:00:00.000Z'
            },
            12
        );
        expect(body).toContain('last reached');
        expect(body).toContain('Cluster unreachable');
        expect(body).toContain('train');
        expect(body).toContain('Recent (finished) - 1');
    });
    it('says nothing about a last reach before the cluster has ever answered', () => {
        const body = drawAt(
            '2026-09-11T12:23:00.000Z',
            {
                ...payload,
                status: 'unreachable',
                hint: 'fixture',
                jobs: [],
                running: 0,
                pending: 0,
                total: 0,
                recent: [],
                sinfo: []
            },
            13
        );
        // the cluster has never been reached, so there is no time to name
        expect(body).not.toContain('last reached');
        expect(body).toContain('Cluster unreachable');
        // and it carries no finished job to list
        expect(body).not.toContain('Recent (finished)');
    });
    it('goes late on the minute tick, with no new publish', () => {
        vi.useFakeTimers();
        let stop = noop;
        try {
            vi.setSystemTime(Date.parse('2026-09-11T12:00:00.000Z'));
            client = createClientState();
            ({ receive } = client.entities);
            stop = client.clock.startMinuteClock();
            const fresh = draw(payload, 14);
            // The wall clock moves without a tick: the head reads the minute clock, not Date.now(),
            // so nothing is late until the clock ticks.
            vi.setSystemTime(Date.parse('2026-09-11T12:23:00.000Z'));
            const untold = again();
            vi.advanceTimersByTime(60000);
            const aged = again();
            // the head reads the minute clock, which has not ticked yet
            expect(fresh).not.toContain('the next poll is late');
            // and the wall clock moving on its own does not make it tick
            expect(untold).not.toContain('the next poll is late');
            expect(aged).toContain('the next poll is late');
        } finally {
            stop();
            vi.useRealTimers();
        }
    });
    it('says the poller is on the short cadence while the cluster is not answering', () => {
        const body = draw({ ...payload, status: 'unreachable', hint: 'fixture' }, 15);
        expect(body).toContain('retrying every 2m');
    });
    it('draws the row controls unpressable while the cluster is not answering', () => {
        const down = draw({ ...payload, status: 'unreachable', hint: 'fixture' }, 16);
        expect(down).toContain('the cluster is not answering');
        expect(down).toMatch(/<button[^>]*\sdisabled[^>]*>/);
        const live = draw(payload, 17);
        // the cluster is answering, so nothing says otherwise
        expect(live).not.toContain('the cluster is not answering');
        // and nothing holds the controls back
        expect(live).not.toMatch(/<button[^>]*\sdisabled[^>]*>/);
    });
    it('keeps the partition and disk rows on a failed poll whose queue is empty', () => {
        const body = drawAt(
            '2026-09-11T12:23:00.000Z',
            {
                ...payload,
                status: 'unreachable',
                hint: 'fixture',
                jobs: [],
                running: 0,
                pending: 0,
                total: 0,
                recent: [],
                lastOk: '2026-09-11T12:00:00.000Z'
            },
            15
        );
        expect(body).toContain('partition capacity');
        // the payload carries no finished job, so the section is not drawn
        expect(body).not.toContain('Recent (finished)');
    });
    it('says nothing about retrying when the payload carries no retry cadence', () => {
        const held = { ...payload, status: 'unreachable' as const, hint: 'fixture' };
        delete held.retryMin;
        const body = drawAt('2026-09-11T12:23:00.000Z', held, 16);
        expect(body).toContain('Cluster unreachable');
        // the payload carries no retry cadence, so there is none to name
        expect(body).not.toContain('retrying every');
    });
    it.each(['starting', 'unreachable', 'error'] as const)('draws the %s head state', (status) => {
        const body = draw(
            { ...payload, status, hint: 'fixture' },
            4 + ['starting', 'unreachable', 'error'].indexOf(status)
        );
        expect(body).toContain(status === 'starting' ? 'polling cluster...' : status);
        if (status === 'starting') expect(body).not.toMatch(/class="[^"]*bad[^"]*"/);
        else expect(body).toMatch(/class="[^"]*bad[^"]*"/);
    });

    it('draws the capacity fold open and the sinfo fold closed while the pane holds nothing', () => {
        const body = draw(payload, 20);
        const outer = foldTag(body, 'capacity');
        expect(outer).not.toBe('');
        expect(isOpen(outer)).toBe(true);
        expect(fold(body, 'capacity')).toContain('Cluster capacity (1 partition)');
        expect(fold(body, 'sinfo')).toContain('sinfo table (3 rows)');
        const inner = foldTag(body, 'sinfo');
        expect(inner).not.toBe('');
        expect(isOpen(inner)).toBe(false);
    });
    it('names the partitions in the plural when there are two', () => {
        const body = draw(
            {
                ...payload,
                sinfo: [
                    ...payload.sinfo,
                    { partition: 'cpu', avail: 'up', nodes: 4, state: 'idle', gres: '(null)' }
                ]
            },
            21
        );
        expect(fold(body, 'capacity')).toContain('Cluster capacity (2 partitions)');
        expect(fold(body, 'sinfo')).toContain('sinfo table (4 rows)');
    });
    it('draws the capacity fold closed, with the meters still inside it, for a pane that holds it closed', () => {
        const body = drawHeld(payload, { capacity: false }, 22);
        const outer = foldTag(body, 'capacity');
        expect(outer).not.toBe('');
        expect(isOpen(outer)).toBe(false);
        expect(fold(body, 'capacity')).toMatch(/class="meters\s/);
        expect(fold(body, 'capacity')).toMatch(/class="idle\s/);
    });
    it('draws the sinfo fold open for a pane that holds it open', () => {
        const body = drawHeld(payload, { sinfo: true }, 23);
        const inner = foldTag(body, 'sinfo');
        expect(inner).not.toBe('');
        expect(isOpen(inner)).toBe(true);
    });
    it('draws the open sinfo fold inside the closed capacity fold', () => {
        const body = drawHeld(payload, { capacity: false, sinfo: true }, 24);
        expect(isOpen(foldTag(body, 'capacity'))).toBe(false);
        const inner = foldTag(body, 'sinfo');
        expect(inner).not.toBe('');
        expect(isOpen(inner)).toBe(true);
        expect(fold(body, 'capacity')).toContain(inner);
    });
    it('names one sinfo row in the singular', () => {
        const body = draw({ ...payload, sinfo: [payload.sinfo[0]] }, 25);
        expect(fold(body, 'sinfo')).toContain('sinfo table (1 row)');
        // one row takes the singular words, so the plural count is never said of it
        expect(body).not.toContain('sinfo table (1 rows)');
    });
    it('draws each pane from its own held state', () => {
        const other = { ...instance, id: 'hpc-two' };
        client.ui.setInstanceState(instance.id, { capacity: false });
        receive({ channel: 'hpc', version: 26, payload });
        const closed = again();
        const opened = again(other);
        expect(isOpen(foldTag(closed, 'capacity'))).toBe(false);
        expect(foldTag(opened, 'capacity')).not.toBe('');
        expect(isOpen(foldTag(opened, 'capacity'))).toBe(true);
    });
    it('draws the unreachable line as a status message, and the hint in the head code', () => {
        const body = draw({ ...payload, status: 'unreachable', hint: 'ssh timeout' }, 27);
        expect(body).toMatch(
            /<p[^>]*class="[^"]*\bsaid\b[^"]*"[^>]*>Cluster unreachable - on UT network \/ EduVPN\?<\/p>/
        );
        // an audit on the tree as it is: the hint is drawn in the head's code element
        expect(body).toMatch(/<code[^>]*>ssh timeout<\/code>/);
    });
    it('draws the unreachable line as a status message and no code when there is no hint', () => {
        const held = { ...payload, status: 'unreachable' as const };
        delete held.hint;
        const body = draw(held, 28);
        expect(body).toMatch(/<p[^>]*class="[^"]*\bsaid\b[^"]*"[^>]*>Cluster unreachable/);
        // the payload carries no failure text, so the head has none to print
        expect(body).not.toContain('<code');
    });
    it('draws the same status message for an error payload', () => {
        const body = draw({ ...payload, status: 'error', hint: 'fixture' }, 29);
        expect(body).toMatch(/<p[^>]*class="[^"]*\bsaid\b[^"]*"[^>]*>Cluster unreachable/);
    });
    it('draws the fetching line through the empty primitive while the cluster is starting', () => {
        const body = draw({ ...payload, status: 'starting' }, 30);
        const at = body.search(/class="empty[\s"]/);
        expect(at).toBeGreaterThan(-1);
        expect(body.slice(at, body.indexOf('</p>', at))).toContain('Fetching job status...');
    });
    it.each([
        ['an answering cluster', { ...payload, sinfo: [] }],
        [
            'an unreachable cluster with disk rows',
            {
                ...payload,
                status: 'unreachable' as const,
                hint: 'fixture',
                sinfo: [],
                jobs: [],
                running: 0,
                pending: 0,
                total: 0,
                recent: []
            }
        ]
    ])(
        'draws no capacity fold with no sinfo rows, for %s, and keeps the disk meters',
        (_, data) => {
            const body = draw(data, 31);
            expect(foldTag(body, 'capacity')).toBe('');
            // sinfo answered no partition, so there is no capacity to head
            expect(body).not.toContain('Cluster capacity');
            expect(body).not.toMatch(/<details[^>]*>\s*<summary[^>]*>sinfo/);
            // the one meters grid left is the disk's: the capacity draws no empty grid of its own
            expect(body.match(/class="meters\s/g)).toHaveLength(1);
            expect(body).toContain('home disk usage');
        }
    );
});
