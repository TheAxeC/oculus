// Layer 4, test helper. What a case over a watcher needs of the channel bus and of the clock: a
// sink that records what was published, the two waits a real file event is watched for, the file
// system's watches taken into the case's own hand, the run of events every watcher's debounce is
// held to on fake timers, and the synthetic hub and engine the portfolio watcher is built over.
//
// A watcher case waits on the operating system rather than on a promise of its own, so it polls:
// the wait is how long a failure takes and not how long a pass takes. A debounce case holds the
// watches instead, so no event reaches the watcher but the ones the case fires.

import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import type * as Fs from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect, vi } from 'vitest';
import type { Message } from '../../../../src/lib/data/model/index.ts';
import type { Sink } from '../../../../src/lib/server/core/channels.ts';
import { engineDir } from '../../../../src/lib/data/sources/config.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';

/** A subscriber that keeps every message it is sent, in the order the hub sent them. */
export function recording(): { sink: Sink; got: Message[] } {
    const got: Message[] = [];
    return {
        got,
        sink: {
            send: (text: string) => {
                got.push(JSON.parse(text) as Message);
                return Promise.resolve();
            },
            close: noop
        }
    };
}

export function sleep(ms: number): Promise<void> {
    return new Promise((done) => setTimeout(done, ms));
}

/** Wait until the condition holds, or until the time is up and the assertion after it fails. */
export async function until(holds: () => boolean, ms: number): Promise<void> {
    const deadline = Date.now() + ms;
    while (!holds() && Date.now() < deadline) await sleep(20);
}

/** A listener a watch was opened with, whatever it is handed. */
type Listener = (...args: unknown[]) => void;

/**
 * Whether the file system's watches are held, and the listener each held one was opened with, by
 * the path it was opened on. A test file hoists one with vi.hoisted and hands it to heldWatches.
 */
export type HeldWatches = { held: boolean; listeners: Map<string, Listener> };

/**
 * The file system as it is, but for `watch`, `watchFile` and `unwatchFile` while `state.held` is
 * set: a watch is then opened on nothing, its listener is kept under its path, and the handle it
 * answers closes nothing. A test file mocks node:fs with this, so its cases over real events run
 * as they did and a debounce case fires the listener itself.
 */
export function heldWatches(actual: typeof Fs, state: HeldWatches): typeof Fs {
    const hold = (path: unknown, args: unknown[]): void => {
        state.listeners.set(String(path), args.at(-1) as Listener);
    };
    const watch = (path: Fs.PathLike, ...args: unknown[]): unknown => {
        if (!state.held) return (actual.watch as (...all: unknown[]) => unknown)(path, ...args);
        hold(path, args);
        return { close: noop };
    };
    const watchFile = (path: Fs.PathLike, ...args: unknown[]): unknown => {
        if (!state.held) return (actual.watchFile as (...all: unknown[]) => unknown)(path, ...args);
        hold(path, args);
        return { ref: noop, unref: noop };
    };
    const unwatchFile = (path: Fs.PathLike, ...args: unknown[]): void => {
        if (!state.held) (actual.unwatchFile as (...all: unknown[]) => void)(path, ...args);
    };
    return { ...actual, watch, watchFile, unwatchFile } as typeof Fs;
}

/**
 * The debounce every watcher keeps, on fake timers: three events inside the wait make one rebuild
 * once the wait has passed since the last of them, one event after that makes one more after the
 * full wait, and an event followed by the close makes none, however long the clock then runs.
 * `count` answers how many rebuilds have run, read once what the start published has been sent;
 * the caller installs the fake timers.
 */
export async function holdsDebounce(
    event: () => void,
    wait: number,
    count: () => number,
    close: () => void
): Promise<void> {
    await vi.advanceTimersByTimeAsync(0);
    const start = count();
    event();
    await vi.advanceTimersByTimeAsync(wait / 2);
    event();
    await vi.advanceTimersByTimeAsync(wait / 2);
    event();
    await vi.advanceTimersByTimeAsync(wait - 1);
    expect(count()).toBe(start);
    await vi.advanceTimersByTimeAsync(1);
    expect(count()).toBe(start + 1);
    event();
    await vi.advanceTimersByTimeAsync(wait - 1);
    expect(count()).toBe(start + 1);
    await vi.advanceTimersByTimeAsync(1);
    expect(count()).toBe(start + 2);
    event();
    close();
    await vi.advanceTimersByTimeAsync(wait * 4);
    expect(count()).toBe(start + 2);
}

/**
 * The fake timers a watcher's debounce runs on. The debounce reads the clock as well as the
 * timers, so `Date` is faked beside them; a case that needs an interval of its own names it.
 */
export function fakeClock(...also: ('setInterval' | 'clearInterval')[]): void {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', ...also] });
}

/** How far the clock moves between two looks at the rebuild count, in ms. */
const STEP = 10;

/** Move the clock by `ms`, in steps, so a rebuild that falls due inside it runs. */
async function pass(ms: number): Promise<void> {
    await vi.advanceTimersByTimeAsync(ms);
}

/**
 * How long a rebuild is held back while a source is written without a pause: `event` runs at once
 * and then every `every` ms, the clock moves in steps of 10 ms, and the answer is the elapsed
 * time when the first rebuild had run, or -1 when none had run by `limit`. The caller bounds it by
 * the watcher's maximum wait. `count` answers how many rebuilds have run.
 */
async function heldFor(
    event: () => void,
    every: number,
    count: () => number,
    limit: number
): Promise<number> {
    await pass(0);
    const start = count();
    event();
    for (let elapsed = STEP; elapsed <= limit; elapsed += STEP) {
        await pass(STEP);
        if (count() > start) return elapsed;
        if (elapsed % every === 0) event();
    }
    return -1;
}

/**
 * The quiet and the maximum wait together: a burst of three events 100 ms apart that then stops is
 * one rebuild, and so is the same burst after a stretch of writes long enough to reach the maximum
 * wait and a pause longer than the quiet. The burst's events are closer together than the quiet.
 */
async function holdsBursts(
    event: () => void,
    quiet: number,
    maxWait: number,
    count: () => number
): Promise<void> {
    const burst = async (): Promise<number> => {
        const before = count();
        event();
        await pass(100);
        event();
        await pass(100);
        event();
        await pass(quiet * 3);
        return count() - before;
    };
    await pass(0);
    expect(await burst(), 'a burst of three events').toBe(1);
    for (let at = 0; at < maxWait + 300; at += 100) {
        event();
        await pass(100);
    }
    await pass(quiet * 3);
    expect(await burst(), 'a burst of three events after a long stretch of writes').toBe(1);
}

/** Events spaced 1.2 times the quiet apart are one rebuild each, however many there are. */
async function holdsSlowWrites(
    event: () => void,
    quiet: number,
    count: () => number
): Promise<void> {
    await pass(0);
    const before = count();
    const every = Math.round(quiet * 1.2);
    for (let written = 1; written <= 4; written += 1) {
        event();
        await pass(every);
        expect(count() - before, `after ${written} writes`).toBe(written);
    }
}

/**
 * A close in the middle of writes that have gone on longer than the maximum wait, with a rebuild
 * pending, runs no rebuild after it however long the clock then runs.
 */
async function holdsCloseDuringWrites(
    event: () => void,
    maxWait: number,
    count: () => number,
    close: () => void
): Promise<void> {
    await pass(0);
    for (let at = 0; at < maxWait + 300; at += 100) {
        event();
        await pass(100);
    }
    event();
    close();
    const after = count();
    await pass(maxWait * 4);
    expect(count()).toBe(after);
}

/**
 * An injected quiet longer than the module's maximum wait is the wait: three events 100 ms apart
 * run no rebuild before the quiet has passed since the first, and one rebuild after it.
 */
async function holdsLongQuiet(
    event: () => void,
    quiet: number,
    count: () => number
): Promise<void> {
    await pass(0);
    const before = count();
    event();
    await pass(100);
    event();
    await pass(100);
    event();
    await pass(quiet - 300);
    expect(count() - before, 'before the quiet has passed').toBe(0);
    await pass(quiet);
    expect(count() - before, 'after the quiet').toBe(1);
}

/** An injected quiet of 0 runs a rebuild for each of three events 100 ms apart. */
async function holdsNoQuiet(event: () => void, count: () => number): Promise<void> {
    await pass(0);
    const before = count();
    for (let written = 1; written <= 3; written += 1) {
        event();
        await pass(100);
        expect(count() - before, `after ${written} events`).toBe(written);
    }
}

/** What the cases over a watcher's quiet and maximum wait need of the watcher a case holds. */
export type HeldWatcher = { event: () => void; count: () => number; close: () => void };

/**
 * The cases every watcher's lodash debounce is held to: its first run is no later than the maximum
 * wait while writes keep coming, bursts and slow writes run once each, a close in the middle of
 * writes runs nothing more, an injected quiet of 0 runs once per event, and one longer than the
 * maximum wait is the wait. `held` starts a watcher on fake timers with an optional injected quiet;
 * `what` names one run of it in the case names.
 */
export function holdsQuietAndMaxWait(spec: {
    quiet: number;
    maxWait: number;
    what: string;
    held: (debounce?: number) => HeldWatcher | Promise<HeldWatcher>;
}): void {
    const { quiet, maxWait, what, held } = spec;
    describe('with the module quiet and maximum wait', () => {
        for (const every of [100, Math.round(quiet * 0.9)]) {
            it(`makes a ${what} within the maximum wait of a source written every ${every} ms`, async () => {
                const { event, count, close } = await held();
                const at = await heldFor(event, every, count, maxWait * 3);
                close();
                expect(
                    at,
                    `the first ${what} came at ${at} ms, the bound is ${maxWait}`
                ).toBeGreaterThan(0);
                expect(at).toBeLessThanOrEqual(maxWait);
            });
        }

        it(`makes one ${what} for a burst, also after a stretch of writes that reached the maximum wait`, async () => {
            const { event, count, close } = await held();
            await holdsBursts(event, quiet, maxWait, count);
            close();
        });

        it(`makes one ${what} for each write spaced 1.2 quiets apart`, async () => {
            const { event, count, close } = await held();
            await holdsSlowWrites(event, quiet, count);
            close();
        });

        it(`makes no ${what} after a close in the middle of writes longer than the maximum wait`, async () => {
            const { event, count, close } = await held();
            await holdsCloseDuringWrites(event, maxWait, count, close);
        });
    });

    describe('with an injected quiet', () => {
        it(`runs one ${what} for each event when the quiet is 0`, async () => {
            const { event, count, close } = await held(0);
            await holdsNoQuiet(event, count);
            close();
        });

        it(`waits an injected quiet longer than the maximum wait, and a burst under it is one ${what}`, async () => {
            const injected = 2 * maxWait;
            const { event, count, close } = await held(injected);
            await holdsLongQuiet(event, injected, count);
            close();
        });
    });
}

// A synthetic hub and engine in scratch directories, which the portfolio watcher's cases use.

export const LAYOUT = [
    'scan:',
    '  - { dir: projects/ideas, type: idea }',
    '  - { dir: projects/active, type: active }',
    '  - { dir: projects/manuscripts, type: manuscript }',
    '  - { dir: projects/coauthor, nested: true }',
    '  - { dir: projects/archive, nested: true }',
    'venues_file: registries/venues.yml',
    'datasets_file: registries/data.yml',
    'pillars_file: registries/pillars.yml',
    'domains_file: registries/domains.yml',
    'collections:',
    '  - { key: funding, file: funding/funding.yml }',
    '  - { key: events, file: network/events.yml }',
    'linkedin_cadence_days: 30',
    ''
].join('\n');

const VOCAB = ['type_color:', '  idea: teal', '  active: blue', '  manuscript: amber', ''].join(
    '\n'
);

const SCHEMA = [
    'manifest_schema:',
    '  fields:',
    '    id: { label: "id" }',
    '    type: { label: "Type" }',
    '    title: { label: "Title" }',
    ''
].join('\n');

export const TEXT = ['text:', '  app:', '    title: "oculus"', ''].join('\n');

/** The keys of behavior.yml a config draws no finding of its own without. */
export const BEHAVIOR = ['editor:', '  paint_limit_kb: 64', ''].join('\n');

export const MANIFEST = 'id: loewner\ntype: active\ntitle: Loewner layers\n';

/** The machine a watcher under test is told it runs on. */
export const HOST = { name: 'test-machine', address: 'http://127.0.0.1:8799' };

export function write(root: string, rel: string, body: string): void {
    const full = join(root, rel);
    expect(resolve(full).startsWith(resolve(root) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
}

/** An engine directory holding the four config files the build reads. */
export function buildEngine(): string {
    const engine = scratchDir('oculus-engine-');
    // The block the source editor's cap lives in: a config without it is a finding of its own, and
    // what these cases are about is the findings the hub and the icon map produce.
    write(engine, 'config/behavior.yml', BEHAVIOR);
    write(engine, 'config/layout.yml', LAYOUT);
    write(engine, 'config/catalogs/vocab.yml', VOCAB);
    write(engine, 'config/catalogs/manifest-schema.yml', SCHEMA);
    write(engine, 'config/text.yml', TEXT);
    // The audit's words and the data layer's finding sentences are the engine's own catalog files,
    // so the scan and the build the watcher runs have the messages they write their findings in
    // rather than a copy of them typed into this file.
    mkdirSync(join(engine, 'config', 'text', 'views', 'system'), { recursive: true });
    for (const name of ['views/system/audit.yml', 'findings.yml']) {
        cpSync(join(engineDir(), 'config', 'text', name), join(engine, 'config', 'text', name));
    }
    return engine;
}

/** A hub with the five tiers, one project, the five registries and one collection. */
export function buildHub(): string {
    const hub = scratchDir('oculus-hub-');
    for (const tier of ['ideas', 'active', 'manuscripts', 'coauthor', 'archive']) {
        mkdirSync(join(hub, 'projects', tier), { recursive: true });
    }
    write(hub, 'projects/active/loewner/project.yml', MANIFEST);
    write(hub, 'registries/venues.yml', 'entries: []\n');
    write(hub, 'registries/data.yml', 'datasets: []\n');
    write(hub, 'registries/pillars.yml', 'entries: []\n');
    write(hub, 'registries/domains.yml', 'entries: []\n');
    write(hub, 'funding/funding.yml', 'entries: []\n');
    write(hub, 'network/events.yml', 'title: Talks\nentries: []\n');
    write(hub, 'feeds/position-leads.yml', 'meta: {}\nentries: []\n');
    write(hub, 'feeds/literature-radar.yml', 'meta: {}\nentries: []\n');
    write(
        hub,
        'theaxec.github.io/_linkedin/01-start.md',
        '---\ntitle: "Start"\ndate: 2026-09-01\n---\n\nFirst post.\n'
    );
    return hub;
}
