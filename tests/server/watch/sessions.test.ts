// watchSessions against synthetic stores in temporary directories.
//
// Nothing outside those directories is read or written: the transcript store, the Codex store, the
// registry, the cache and the overrides are all made here, every write asserts its path is inside
// first, and the liveness probes are stubs, so no process is signalled and `ps` is never run. Every
// watcher a test opens is closed when the test ends.

import { appendFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Hub } from '../../../src/lib/server/channels.ts';
import type { Sink } from '../../../src/lib/server/channels.ts';
import {
    liveSignature,
    watchSessions,
    type SessionsWatcher
} from '../../../src/lib/server/watch/sessions.ts';
import type { Watcher } from '../../../src/lib/server/watch/portfolio.ts';
import type { Message, SessionsPayload } from '../../../src/lib/data/model.ts';
import type { Probe } from '../../../src/lib/server/sessions/registry.ts';
import type { CodexProbe } from '../../../src/lib/server/sessions/codex.ts';

// A watcher test waits on real file events, and the suite runs several files at once, so the waits
// are generous: they are how long a failure takes, not how long a pass takes.
vi.setConfig({ testTimeout: 20000 });

/** How long a publish is waited for before the assertion runs and fails. */
const WAIT = 6000;

const SLUG = '-tmp-fixture-workspace';
const SID = 'cccccccc-1111-2222-3333-dddddddddddd';
const PID = 5151;
const CONTEXT = {
    cwd: '/tmp/fixture/workspace',
    gitBranch: 'main',
    version: '9.9.9',
    permissionMode: 'auto',
    entrypoint: 'cli'
};

type Json = Record<string, unknown>;

const watchers: Watcher[] = [];

afterEach(() => {
    while (watchers.length > 0) watchers.pop()?.close();
});

function prompt(stamp: string, text: string): Json {
    return {
        type: 'user',
        timestamp: stamp,
        origin: { kind: 'human' },
        message: { role: 'user', content: text },
        ...CONTEXT
    };
}

function answer(stamp: string, text: string): Json {
    return {
        type: 'assistant',
        timestamp: stamp,
        message: {
            role: 'assistant',
            model: 'claude-test',
            content: [{ type: 'text', text }],
            usage: {
                input_tokens: 5,
                output_tokens: 7,
                cache_read_input_tokens: 0,
                cache_creation_input_tokens: 0
            }
        },
        ...CONTEXT
    };
}

/** One synthetic pair of stores, with the registry, the cache and the overrides beside them. */
class Fixture {
    root: string;
    store: string;
    codexStore: string;
    registry: string;
    cache: string;
    overrides: string;
    path: string;
    alive = new Set<number>();

    constructor() {
        this.root = mkdtempSync(join(tmpdir(), 'oculus-watch-sessions-'));
        expect(resolve(this.root).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        this.store = join(this.root, 'projects');
        this.codexStore = join(this.root, 'codex');
        this.registry = join(this.root, 'registry');
        mkdirSync(join(this.store, SLUG), { recursive: true });
        mkdirSync(this.codexStore, { recursive: true });
        mkdirSync(this.registry, { recursive: true });
        this.cache = join(this.root, 'cache', 'transcript-cache.json');
        this.overrides = join(this.root, 'sessions.json');
        this.path = join(this.store, SLUG, `${SID}.jsonl`);
    }

    write(rel: string, body: string): void {
        const full = join(this.root, rel);
        expect(resolve(full).startsWith(resolve(this.root) + sep)).toBe(true);
        mkdirSync(dirname(full), { recursive: true });
        writeFileSync(full, body);
    }

    transcript(records: Json[]): void {
        this.write(
            join('projects', SLUG, `${SID}.jsonl`),
            records.map((record) => JSON.stringify(record) + '\n').join('')
        );
    }

    append(records: Json[]): void {
        appendFileSync(this.path, records.map((record) => JSON.stringify(record) + '\n').join(''));
    }

    /** One registry entry, the way Claude Code writes it, and the process it names is alive. */
    enrol(status = 'busy'): void {
        this.alive.add(PID);
        this.write(
            join('registry', `${PID}.json`),
            JSON.stringify({
                pid: PID,
                sessionId: SID,
                cwd: CONTEXT.cwd,
                startedAt: 1788955717254,
                version: '9.9.9',
                kind: 'interactive',
                entrypoint: 'cli',
                status,
                name: 'fixture-watch'
            })
        );
    }

    /** The stub the liveness check asks instead of the kernel and `ps`. */
    probe(): Probe {
        return {
            running: (pid: number) => this.alive.has(pid),
            starts: () => new Map<number, number>()
        };
    }

    /** No codex process is ever running for these fixtures. */
    codexProbe(): CodexProbe {
        return { commands: () => [] };
    }
}

type Started = { fixture: Fixture; got: Message[]; watcher: SessionsWatcher };

function payloads(got: Message[]): SessionsPayload[] {
    return got
        .filter((message) => message.channel === 'sessions')
        .map((message) => message.payload as SessionsPayload);
}

function latest(got: Message[]): SessionsPayload {
    const found = payloads(got);
    expect(found.length).toBeGreaterThan(0);
    return found[found.length - 1];
}

function sleep(ms: number): Promise<void> {
    return new Promise((done) => setTimeout(done, ms));
}

/** Poll until the predicate holds or the time runs out; the caller asserts what it wanted. */
async function until(holds: () => boolean, ms: number): Promise<void> {
    const deadline = Date.now() + ms;
    while (!holds() && Date.now() < deadline) await sleep(20);
}

/**
 * Wait until the messages stop arriving, and answer how many there are. The first fs.watch of a
 * process on darwin can deliver an event for a write that happened shortly before the watch was
 * opened, which here is the fixture's own writes, and the watcher then rescans once more with the
 * same result. A test that counts publishes counts them from a quiet point, never from the start.
 */
/**
 * Wait until the watch over one directory is delivering events, by writing a file the scan ignores
 * and waiting for the publish it causes.
 *
 * A recursive fs.watch on darwin is an FSEvents stream, and a stream registers with the system
 * asynchronously. An event on a directory made moments before the watch opened can be lost while
 * that registration is still in flight, and on a loaded machine that window is seconds long: with
 * the whole suite running, an append made straight after the watcher started was never delivered,
 * measured against a 20 s wait. A test of what an event does therefore establishes first that
 * events arrive at all, and tests the interesting change after that.
 */
async function armed(dir: string, name: string, got: Message[]): Promise<void> {
    const deadline = Date.now() + WAIT;
    while (Date.now() < deadline) {
        const before = got.length;
        writeFileSync(join(dir, name), String(Date.now()));
        await until(() => got.length > before, 1000);
        if (got.length > before) return;
    }
}

async function quiet(got: Message[], ms = 400): Promise<number> {
    let held = -1;
    while (held !== got.length) {
        held = got.length;
        await sleep(ms);
    }
    return held;
}

function recording(): { sink: Sink; got: Message[] } {
    const got: Message[] = [];
    return {
        got,
        sink: {
            send: (text: string) => {
                got.push(JSON.parse(text) as Message);
                return Promise.resolve();
            },
            close: () => {}
        }
    };
}

/** A started watcher over a fresh fixture, with a sink already subscribed to the channel. */
function start(fixture: Fixture, liveness = 0): Started {
    const hub = new Hub();
    const client = recording();
    hub.subscribe(client.sink, ['sessions']);
    const watcher = watchSessions(hub, {
        store: fixture.store,
        codexStore: fixture.codexStore,
        registry: fixture.registry,
        cache: fixture.cache,
        overrides: fixture.overrides,
        roots: [fixture.root],
        projectFolders: () => [],
        debounce: 100,
        liveness,
        probe: fixture.probe(),
        codexProbe: fixture.codexProbe()
    });
    watchers.push(watcher);
    return { fixture, got: client.got, watcher };
}

describe('liveSignature', () => {
    it('names every live session and the state it is in, and nothing else', () => {
        const record = (id: string, live: boolean, state: string) =>
            ({ id, live, state, liveStatus: live ? 'busy' : null }) as never;
        const before = liveSignature([record('a', true, 'working'), record('b', false, 'ended')]);
        expect(before).toBe('a:working:busy');
        expect(liveSignature([record('a', true, 'idle')])).not.toBe(before);
        expect(liveSignature([])).toBe('');
    });
});

describe('watchSessions', () => {
    it('publishes the store on start, at version 1', async () => {
        const fixture = new Fixture();
        fixture.transcript([prompt('2026-09-10T10:00:00.000Z', 'first question')]);
        const started = start(fixture);
        await until(() => started.got.length >= 1, WAIT);

        expect(started.got[0].channel).toBe('sessions');
        expect(started.got[0].version).toBe(1);
        const payload = latest(started.got);
        expect(payload.records.map((record) => record.id)).toEqual([SID]);
        expect(payload.records[0].prompts).toBe(1);
        expect(payload.records[0].live).toBe(false);
        expect(payload.workspaces.length).toBe(1);
    });

    it('republishes with the new record when a transcript is appended to', async () => {
        const fixture = new Fixture();
        fixture.transcript([prompt('2026-09-10T10:00:00.000Z', 'first question')]);
        const started = start(fixture);
        await until(() => started.got.length >= 1, WAIT);
        await armed(join(fixture.store, SLUG), 'not-a-transcript.txt', started.got);

        fixture.append([
            answer('2026-09-10T10:00:05.000Z', 'an answer'),
            prompt('2026-09-10T10:00:09.000Z', 'second question')
        ]);
        await until(() => latest(started.got).records[0].prompts === 2, WAIT);

        const payload = latest(started.got);
        expect(payload.records[0].prompts).toBe(2);
        expect(payload.records[0].messages).toBe(3);
    });

    it('tells only its own onChange listeners about a rescan, never those of another watcher', async () => {
        const first = start(new Fixture());
        const second = start(new Fixture());
        first.fixture.transcript([prompt('2026-09-10T10:00:00.000Z', 'first question')]);
        await until(() => first.got.length >= 1 && second.got.length >= 1, WAIT);
        await armed(join(first.fixture.store, SLUG), 'not-a-transcript.txt', first.got);
        const heard = [0, 0];
        const off = first.watcher.onChange(() => (heard[0] += 1));
        second.watcher.onChange(() => (heard[1] += 1));

        first.fixture.append([answer('2026-09-10T10:00:05.000Z', 'an answer')]);
        await until(() => heard[0] >= 1, WAIT);
        expect(heard[1]).toBe(0);

        off();
        first.fixture.append([prompt('2026-09-10T10:00:09.000Z', 'second question')]);
        await until(() => latest(first.got).records[0].prompts === 2, WAIT);
        expect(heard).toEqual([1, 0]);
    });

    it('makes the record live when a registry file appears', async () => {
        const fixture = new Fixture();
        fixture.transcript([prompt('2026-09-10T10:00:00.000Z', 'first question')]);
        const started = start(fixture);
        await until(() => started.got.length >= 1, WAIT);
        expect(latest(started.got).records[0].live).toBe(false);
        await armed(fixture.registry, 'not-an-entry.txt', started.got);

        fixture.enrol();
        await until(() => latest(started.got).records[0].live, WAIT);

        const record = latest(started.got).records[0];
        expect(record.live).toBe(true);
        expect(record.pid).toBe(PID);
        expect(record.state).toBe('working');
    });

    it('republishes on the liveness re-check when a process dies without touching its file', async () => {
        const fixture = new Fixture();
        fixture.transcript([prompt('2026-09-10T10:00:00.000Z', 'first question')]);
        fixture.enrol();
        const started = start(fixture, 100);
        await until(() => started.got.length >= 1, WAIT);
        expect(latest(started.got).records[0].live).toBe(true);

        // The registry file stays exactly as it is; only the process is gone.
        fixture.alive.delete(PID);
        await until(() => !latest(started.got).records[0].live, WAIT);

        const record = latest(started.got).records[0];
        expect(record.live).toBe(false);
        expect(record.state).toBe('ended');
    });

    it('publishes nothing on a re-check that finds the same live sessions', async () => {
        const fixture = new Fixture();
        fixture.transcript([prompt('2026-09-10T10:00:00.000Z', 'first question')]);
        fixture.enrol();
        const started = start(fixture, 100);
        const before = await quiet(started.got);
        expect(before).toBeGreaterThan(0);

        // Six re-checks at least, none of which found a live session that moved.
        await sleep(600);
        expect(started.got.length).toBe(before);
    });

    it('rescans when a Codex rollout appears under a new day folder', async () => {
        const fixture = new Fixture();
        fixture.transcript([prompt('2026-09-10T10:00:00.000Z', 'first question')]);
        const started = start(fixture);
        await until(() => started.got.length >= 1, WAIT);
        await armed(fixture.codexStore, 'not-a-rollout.txt', started.got);

        fixture.write(
            join('codex', '2026', '09', '10', 'rollout-2026-09-10T10-30-00-abcd1234.jsonl'),
            JSON.stringify({
                timestamp: '2026-09-10T10:30:00.000Z',
                type: 'session_meta',
                payload: { id: 'rollout-one', cwd: CONTEXT.cwd, cli_version: '1.2.3' }
            }) + '\n'
        );
        await until(
            () => latest(started.got).records.some((record) => record.id === 'rollout-one'),
            WAIT
        );

        const ids = latest(started.got).records.map((record) => record.id);
        expect(ids).toContain('rollout-one');
        expect(ids).toContain(SID);
    });

    it('rescans when the overrides file changes, and not when the cache beside it does', async () => {
        const fixture = new Fixture();
        // The cache goes in the same directory as the overrides file, which is where ~/.oculus keeps
        // both: the watch is on that directory, so only the filename keeps a scan's own cache write
        // from causing the next scan.
        fixture.cache = join(fixture.root, 'transcript-cache.json');
        fixture.transcript([prompt('2026-09-10T10:00:00.000Z', 'first question')]);
        const started = start(fixture);
        await until(() => started.got.length >= 1, WAIT);
        expect(latest(started.got).records[0].hidden).toBe(false);
        await armed(fixture.root, 'sessions.json', started.got);

        // A dismissal, as api/write would have written it.
        writeFileSync(fixture.overrides, JSON.stringify({ sessions: { [SID]: { hidden: true } } }));
        await until(() => latest(started.got).records[0].hidden === true, WAIT);
        expect(latest(started.got).records[0].hidden).toBe(true);

        const before = await quiet(started.got);
        writeFileSync(fixture.cache, JSON.stringify({ version: 99, entries: {} }));
        await sleep(600);
        expect(started.got.length).toBe(before);
    });

    it('closes every handle it opened', async () => {
        const fixture = new Fixture();
        fixture.transcript([prompt('2026-09-10T10:00:00.000Z', 'first question')]);
        const started = start(fixture, 100);
        const before = await quiet(started.got);
        expect(before).toBeGreaterThan(0);

        watchers.pop()?.close();
        fixture.append([prompt('2026-09-10T10:01:00.000Z', 'after the close')]);
        rmSync(fixture.path);
        await sleep(500);

        expect(started.got.length).toBe(before);
    });
});
