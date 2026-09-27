// The launch note read back: a missing, empty or garbled note, the records it keeps, and a launch
// joined to its parent session's agents with its harness, model, state, the builder's own session
// and a Codex builder's token totals, and a launch whose builder's pid is recorded read by that
// process: running while it runs, done once it is gone or its pid names a later process.
//
// Every store, note and transcript is made here under the temporary directory, and the liveness
// probes are stubs: no test reads ~/.claude, ~/.codex or ~/.oculus, and nothing is signalled.

import { mkdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
    builderProcesses,
    pendingBuilders,
    readDispatches,
    stampEnded,
    type DispatchNote
} from '../../../../src/lib/server/sessions/stores/dispatches.ts';
import { scan } from '../../../../src/lib/server/sessions/stores/transcripts.ts';
import { formatStamp } from '../../../../src/lib/server/sessions/registry.ts';
import type { SessionAgent, SessionRecord } from '../../../../src/lib/data/model/index.ts';
import { scratchDir, sweepScratch } from '../../../fixtures/scratch.ts';

afterAll(sweepScratch);

const SLUG = '-tmp-fixture-workspace';
const PARENT = 'bbbbbbbb-0000-0000-0000-00000000000p';
const CHILD = 'bbbbbbbb-0000-0000-0000-00000000000c';
const ROLLOUT = '01a07d03-c92a-7a91-8667-7f0520b8197f';

type Json = Record<string, unknown>;

/**
 * When the builder process of a launch started, in epoch seconds, and when its launch was written,
 * a second later: an hour before the run, so the launch is inside the scan's two-day window on
 * whatever day the suite runs.
 */
const BEGAN = Math.floor(Date.now() / 1000) - 3600;
const STARTED_AT = new Date((BEGAN + 1) * 1000).toISOString();

/** A launch record as bin/dispatch-note.mjs writes it, with the fields a case changes. */
function launch(fields: Partial<DispatchNote> = {}): DispatchNote {
    return {
        id: 'launch-one',
        launcher: 'plan-orchestration',
        label: 'O99',
        harness: 'claude',
        model: 'claude-opus-test',
        parent: PARENT,
        cwd: '/tmp/fixture/worktree',
        transcript: '',
        startedAt: STARTED_AT,
        endedAt: '',
        pid: 0,
        pidStart: '',
        ...fields
    };
}

function prompt(stamp: string, text: string): Json {
    return {
        type: 'user',
        timestamp: stamp,
        cwd: '/tmp/fixture/workspace',
        origin: { kind: 'human' },
        message: { role: 'user', content: text }
    };
}

/** An assistant turn that dispatches one native subagent under the given tool-use id. */
function dispatch(stamp: string, id: string): Json {
    return {
        type: 'assistant',
        timestamp: stamp,
        cwd: '/tmp/fixture/workspace',
        message: {
            role: 'assistant',
            model: 'claude-parent',
            content: [
                {
                    type: 'tool_use',
                    id,
                    name: 'Agent',
                    input: { description: 'a native subagent', subagent_type: 'Explore' }
                }
            ]
        }
    };
}

/** A Claude and a Codex store with a note beside them, all under the temporary directory. */
class Fixture {
    root = scratchDir('oculus-dispatches-');
    store: string;
    codexStore: string;
    note: string;
    registry: string;
    /** The pids the liveness probe answers running for. */
    alive = new Set<number>();
    /** The start time, in epoch seconds, the probe's `ps` answers for a pid. */
    startOf = new Map<number, number>();
    /** Every pid the probe was asked whether it runs. */
    asked: number[] = [];
    /** The watcher's memory of reused launches whose stamp is not written yet, across scans. */
    reused = new Map<string, string>();
    /** The pids of every `starts` call the probe answered, one list per call. */
    startsCalls: number[][] = [];

    constructor() {
        expect(resolve(this.root).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        this.store = join(this.root, 'claude', 'projects');
        this.codexStore = join(this.root, 'codex', 'sessions');
        this.note = join(this.root, 'oculus', 'dispatches.json');
        this.registry = join(this.root, 'claude', 'sessions');
        mkdirSync(join(this.store, SLUG), { recursive: true });
        mkdirSync(join(this.root, 'oculus'), { recursive: true });
    }

    /** One Claude transcript; `daysOld` ages it past the scan's window. */
    transcript(id: string, records: Json[], daysOld = 0): string {
        const path = join(this.store, SLUG, `${id}.jsonl`);
        writeFileSync(path, records.map((record) => `${JSON.stringify(record)}\n`).join(''));
        if (daysOld > 0) {
            const when = Date.now() / 1000 - daysOld * 86400;
            utimesSync(path, when, when);
        }
        return path;
    }

    /** One Codex rollout whose last usage event carries the given lifetime totals. */
    rollout(input: number, output: number): string {
        const folder = join(this.codexStore, '2026', '09', '23');
        mkdirSync(folder, { recursive: true });
        const path = join(folder, `rollout-2026-09-23T10-00-00-${ROLLOUT}.jsonl`);
        const stamp = '2026-09-23T10:00:06.000Z';
        const lines = [
            { timestamp: stamp, type: 'session_meta', payload: { id: ROLLOUT, cwd: '/tmp/w' } },
            { timestamp: stamp, type: 'turn_context', payload: { model: 'gpt-rollout' } },
            {
                timestamp: stamp,
                type: 'event_msg',
                payload: { type: 'token_count', info: { total_token_usage: { input_tokens: 1 } } }
            },
            {
                timestamp: stamp,
                type: 'event_msg',
                payload: {
                    type: 'token_count',
                    info: { total_token_usage: { input_tokens: input, output_tokens: output } }
                }
            }
        ];
        writeFileSync(path, lines.map((line) => `${JSON.stringify(line)}\n`).join(''));
        return path;
    }

    /** One registry entry for a session whose process the probe says is running. */
    enrol(id: string, pid: number): void {
        mkdirSync(this.registry, { recursive: true });
        this.alive.add(pid);
        writeFileSync(join(this.registry, `${pid}.json`), JSON.stringify({ pid, sessionId: id }));
    }

    write(notes: unknown): void {
        writeFileSync(this.note, typeof notes === 'string' ? notes : JSON.stringify(notes));
    }

    scan(): SessionRecord[] {
        return scan({
            stores: [this.store],
            codexStores: [this.codexStore],
            registries: [this.registry],
            cachePath: join(this.root, 'oculus', 'transcript-cache.json'),
            overridesPath: join(this.root, 'oculus', 'sessions.json'),
            dispatchesPath: this.note,
            reused: this.reused,
            probe: {
                running: (pid) => {
                    this.asked.push(pid);
                    return this.alive.has(pid);
                },
                starts: (pids) => {
                    this.startsCalls.push([...pids]);
                    return new Map(pids.flatMap((pid) => this.startsFor(pid)));
                }
            },
            codexProbe: { commands: () => [] }
        });
    }

    /**
     * A builder process the probe answers running, started at `seconds`; its launch fields, with
     * the start time written as the writer writes it, `ps` in UTC.
     */
    builder(pid: number, seconds: number): Pick<DispatchNote, 'pid' | 'pidStart'> {
        this.alive.add(pid);
        this.startOf.set(pid, seconds);
        return { pid, pidStart: formatStamp(seconds, true) };
    }

    startsFor(pid: number): [number, number][] {
        const start = this.startOf.get(pid);
        return start === undefined ? [] : [[pid, start]];
    }

    /** The one record with this id, which the case expects the scan to hold. */
    record(id: string): SessionRecord {
        const [found] = this.scan().filter((record) => record.id === id);
        expect(found).toBeDefined();
        return found;
    }

    /** The launched rows of the parent's agents. */
    launched(): SessionAgent[] {
        return this.record(PARENT).agents.filter((agent) => agent.dispatch !== undefined);
    }
}

const NOW = new Date().toISOString();

describe('reading the launch note', () => {
    it('reads a missing, empty, garbled or non-list note as no records', () => {
        const f = new Fixture();
        // revert: src/lib/server/sessions/stores/dispatches.ts "for (const item of list(readJson(path))) {" => for (const item of readJson(path) as unknown[]) {
        expect(readDispatches(f.note)).toEqual([]);
        for (const body of ['', '{not json', '{"id": "one"}', 'null', '"a string"']) {
            f.write(body);
            expect(readDispatches(f.note)).toEqual([]);
        }
    });

    it('keeps a record with an id, a parent and a known harness, once per id', () => {
        const f = new Fixture();
        f.write([
            launch(),
            // revert: src/lib/server/sessions/stores/dispatches.ts "if (seen.has(note.id)) continue;" => delete
            launch({ label: 'the same id again' }),
            launch({ id: '' }),
            launch({ id: 'no-parent', parent: '' }),
            launch({ id: 'odd-harness', harness: 'gemini' }),
            'not a record',
            launch({ id: 'launch-two', harness: 'codex' })
        ]);
        const kept = readDispatches(f.note);
        expect(kept.map((note) => note.id)).toEqual(['launch-one', 'launch-two']);
        expect(kept[0].label).toBe('O99');
    });

    it('reads a field of the wrong type as empty rather than refusing the record', () => {
        const f = new Fixture();
        // revert: src/lib/server/sessions/stores/dispatches.ts "model: text(item.model)," => model: item.model as string,
        f.write([{ ...launch(), model: 42, endedAt: null, transcript: ['x'] }]);
        const [note] = readDispatches(f.note);
        expect(note.model).toBe('');
        expect(note.endedAt).toBe('');
        expect(note.transcript).toBe('');
    });
});

describe('a launch joined to its parent', () => {
    it("joins the launch to its parent's agents, marked as launched, with its harness and model", () => {
        const f = new Fixture();
        f.transcript(PARENT, [prompt(NOW, 'orchestrate')]);
        // revert: src/lib/server/sessions/stores/dispatches.ts "parent.agents = [...parent.agents, agent];" => delete
        f.write([launch()]);
        const [row] = f.launched();
        expect(row.id).toBe('dispatch:launch-one');
        expect(row.description).toBe('O99');
        expect(row.subagentType).toBe('plan-orchestration');
        expect(row.model).toBe('claude-opus-test');
        expect(row.started).toBe(STARTED_AT);
        expect(row.status).toBe('running');
        expect(row.dispatch).toEqual({
            launcher: 'plan-orchestration',
            harness: 'claude',
            cwd: '/tmp/fixture/worktree',
            transcript: '',
            session: null,
            tokens: null
        });
    });

    it('says a launch whose note is stamped ended is done, with its end', () => {
        const f = new Fixture();
        f.transcript(PARENT, [prompt(NOW, 'orchestrate')]);
        // revert: src/lib/server/sessions/stores/dispatches.ts "status: done ? 'done' : 'running'," => status: 'running',
        f.write([launch({ endedAt: '2026-09-23T10:30:00.000Z' })]);
        const [row] = f.launched();
        expect(row.status).toBe('done');
        expect(row.ended).toBe('2026-09-23T10:30:00.000Z');
    });

    it("names the builder's own session when the scan found its transcript", () => {
        const f = new Fixture();
        f.transcript(PARENT, [prompt(NOW, 'orchestrate')]);
        const child = f.transcript(CHILD, [prompt(NOW, 'build it')]);
        // revert: src/lib/server/sessions/stores/transcripts.ts "(note) => (note.transcript ? (byReal.get(realFolder(note.transcript)) ?? null) : null)," => () => null,
        f.write([launch({ transcript: child })]);
        const [row] = f.launched();
        expect(row.dispatch?.session).toBe(CHILD);
        expect(row.dispatch?.tokens).toBeNull();
    });

    it('audits that a builder older than the window is not listed and its row opens nothing', () => {
        const f = new Fixture();
        f.transcript(PARENT, [prompt(NOW, 'orchestrate')]);
        const child = f.transcript(CHILD, [prompt('2026-09-01T10:00:00.000Z', 'build it')], 10);
        f.write([launch({ transcript: child })]);
        const records = f.scan();
        expect(records.map((record) => record.id)).toEqual([PARENT]);
        expect(records[0].agents[0].dispatch?.session).toBeNull();
        expect(records[0].agents[0].status).toBe('running');
    });

    it("reads a launch with no end stamp by its builder's own session: running while live, done after", () => {
        const f = new Fixture();
        f.transcript(PARENT, [prompt(NOW, 'orchestrate')]);
        const child = f.transcript(CHILD, [prompt(NOW, 'build it')]);
        f.write([launch({ transcript: child })]);
        f.enrol(CHILD, 7171);
        const [live] = f.launched();
        expect(live.status).toBe('running');
        expect(live.ended).toBeNull();
        // The builder's process is gone and its launcher never stamped the end.
        // revert: src/lib/server/sessions/stores/dispatches.ts "const done = note.endedAt !== '' || (builderLive === null ? unwitnessed : !builderLive);" => const done = note.endedAt !== '';
        f.alive.delete(7171);
        const [gone] = f.launched();
        expect(gone.status).toBe('done');
        expect(gone.ended).toBe(NOW);
    });

    it('reads a launch as running while its launcher lives, whatever its builder reads', () => {
        const f = new Fixture();
        f.transcript(PARENT, [prompt(NOW, 'orchestrate')]);
        const child = f.transcript(CHILD, [prompt(NOW, 'build it')]);
        f.write([launch({ transcript: child })]);
        // The launcher is live and the builder reads not live, which a Codex builder inside a long
        // command does; the launcher will stamp the end, so the row keeps reading running.
        f.enrol(PARENT, 7272);
        // revert: src/lib/server/sessions/stores/dispatches.ts "const done = note.endedAt !== '' || (builderLive === null ? unwitnessed : !builderLive);" => const done = note.endedAt !== '' || (child !== null && !child.live);
        const [row] = f.launched();
        expect(row.status).toBe('running');
        expect(row.ended).toBeNull();
    });

    it('carries a Codex builder its token totals from the last usage event, and its model', () => {
        const f = new Fixture();
        f.transcript(PARENT, [prompt(NOW, 'orchestrate')]);
        const rollout = f.rollout(900, 70);
        // revert: src/lib/server/sessions/stores/dispatches.ts "tokens: child !== null && child.tool === 'codex' ? { ...child.tokens } : null" => tokens: null
        f.write([launch({ harness: 'codex', model: '', transcript: rollout })]);
        const [row] = f.launched();
        expect(row.dispatch?.session).toBe(ROLLOUT);
        expect(row.dispatch?.tokens).toEqual({
            input: 900,
            output: 70,
            cacheRead: 0,
            cacheCreation: 0,
            thinking: 0
        });
        expect(row.model).toBe('gpt-rollout');
    });

    it('joins nothing for a parent the scan does not hold', () => {
        const f = new Fixture();
        f.transcript(PARENT, [prompt(NOW, 'orchestrate')]);
        // revert: src/lib/server/sessions/stores/dispatches.ts "if (parent === undefined) continue;" => delete
        f.write([launch({ parent: 'no-such-session' })]);
        const records = f.scan();
        expect(records.map((record) => record.id)).toEqual([PARENT]);
        expect(records[0].agents).toEqual([]);
    });

    it('keeps a launch and a subagent apart when the note reuses the subagent id', () => {
        const f = new Fixture();
        f.transcript(PARENT, [prompt(NOW, 'orchestrate'), dispatch(NOW, 'toolu_same')]);
        // revert: src/lib/server/sessions/stores/dispatches.ts "id: `${DISPATCH_PREFIX}${note.id}`," => id: note.id,
        f.write([launch({ id: 'toolu_same' })]);
        const ids = f.record(PARENT).agents.map((agent) => agent.id);
        expect(ids.sort()).toEqual(['dispatch:toolu_same', 'toolu_same']);
    });
});

describe("a launch read by its builder's process", () => {
    it('watches only the unstamped launches with a pid that started inside the window', () => {
        const since = Date.parse('2026-09-23T00:00:00.000Z');
        const recent = launch({ id: 'recent', pid: 7272 });
        const old = launch({ id: 'old', pid: 8108, startedAt: '2026-09-20T10:00:05.000Z' });
        const ended = launch({ id: 'ended', pid: 9191, endedAt: '2026-09-23T11:00:00.000Z' });
        const none = launch({ id: 'none' });
        // revert: src/lib/server/sessions/stores/dispatches.ts "(note) => note.pid > 0 && note.endedAt === '' && !(Date.parse(note.startedAt) < since)" => (note) => note.pid > 0 && note.endedAt === ''
        expect(pendingBuilders([recent, old, ended, none], since).map((note) => note.id)).toEqual([
            'recent'
        ]);
    });

    it('reads running while the recorded process runs, though its launcher and session are gone', () => {
        const f = new Fixture();
        f.transcript(PARENT, [prompt(NOW, 'orchestrate')]);
        // The builder's session is not live and neither is its launcher's, which alone reads done.
        const child = f.transcript(CHILD, [prompt(NOW, 'build it')]);
        // revert: src/lib/server/sessions/stores/dispatches.ts "const done = note.endedAt !== '' || (builderLive === null ? unwitnessed : !builderLive);" => const done = note.endedAt !== '' || unwitnessed;
        f.write([launch({ transcript: child, ...f.builder(8101, BEGAN) })]);
        const [row] = f.launched();
        expect(row.status).toBe('running');
        expect(row.ended).toBeNull();
    });

    it('reads done once the recorded process is gone, though its launcher lives', () => {
        const f = new Fixture();
        f.transcript(PARENT, [prompt(NOW, 'orchestrate')]);
        f.enrol(PARENT, 7272);
        const fields = f.builder(8102, BEGAN);
        f.write([launch(fields)]);
        expect(f.launched()[0].status).toBe('running');
        // revert: src/lib/server/sessions/stores/dispatches.ts "if (!running) return 'gone';" => delete
        f.alive.delete(8102);
        f.startOf.delete(8102);
        expect(f.launched()[0].status).toBe('done');
    });

    it('leaves the end unknown of a launch read done because its process exited unstamped', () => {
        const f = new Fixture();
        f.transcript(PARENT, [prompt(NOW, 'orchestrate')]);
        // The builder's own session is held, and its last activity says nothing of when it exited.
        const child = f.transcript(CHILD, [prompt(NOW, 'build it')]);
        const fields = f.builder(8113, BEGAN);
        f.write([launch({ transcript: child, ...fields })]);
        // revert: src/lib/server/sessions/stores/dispatches.ts "const byChild = done && builderLive === null ? (child?.lastActivity ?? null) : null;" => const byChild = done ? (child?.lastActivity ?? null) : null;
        f.alive.delete(8113);
        f.startOf.delete(8113);
        const [row] = f.launched();
        expect(row.status).toBe('done');
        expect(row.ended).toBeNull();
        expect(row.started).toBe(launch().startedAt);
    });

    it('reads done when the pid now names a process with another start time', () => {
        const f = new Fixture();
        f.transcript(PARENT, [prompt(NOW, 'orchestrate')]);
        f.enrol(PARENT, 7272);
        const fields = f.builder(8103, BEGAN);
        // The builder exited and a later process took its pid an hour on.
        f.startOf.set(8103, BEGAN + 3600);
        // revert: src/lib/server/sessions/stores/dispatches.ts "return Math.abs(recorded.utc - actual) <= PROC_START_SLACK ? 'running' : 'reused';" => return 'running';
        f.write([launch(fields)]);
        expect(f.launched()[0].status).toBe('done');
    });

    it('reads running while the pid runs with a start time inside the slack', () => {
        const f = new Fixture();
        f.transcript(PARENT, [prompt(NOW, 'orchestrate')]);
        f.enrol(PARENT, 7272);
        const fields = f.builder(8109, BEGAN);
        // `ps` may round the start a second away from what the launcher recorded.
        f.startOf.set(8109, BEGAN + 1);
        // revert: src/lib/server/sessions/stores/dispatches.ts "return Math.abs(recorded.utc - actual) <= PROC_START_SLACK ? 'running' : 'reused';" => return 'reused';
        f.write([launch(fields)]);
        expect(f.launched()[0].status).toBe('running');
    });

    it('stamps a launch seen under a reused pid ended in the note, once, so it stays done', () => {
        const f = new Fixture();
        f.transcript(PARENT, [prompt(NOW, 'orchestrate')]);
        f.enrol(PARENT, 7272);
        const fields = f.builder(8110, BEGAN);
        f.startOf.set(8110, BEGAN + 3600);
        f.write([launch(fields), launch({ id: 'other' })]);
        // revert: src/lib/server/sessions/stores/transcripts.ts "if (stampEnded(options.dispatchesPath ?? defaultDispatchesPath(), reused)) reused.clear();" => delete
        expect(f.launched()[0].status).toBe('done');
        const [stamped, other] = readDispatches(f.note);
        expect(stamped.endedAt).not.toBe('');
        // The other launch had no reused pid, so its record is left as it was.
        expect(other.endedAt).toBe('');
        const written = readFileSync(f.note, 'utf8');
        // The transcript cache is thrown away, and `ps` fails: the pid still answers signal 0 and
        // this scan has no start time for it. The note alone says the launch ended.
        rmSync(join(f.root, 'oculus', 'transcript-cache.json'), { force: true });
        f.startOf.delete(8110);
        const [row] = f.launched();
        expect(row.status).toBe('done');
        expect(row.ended).toBe(stamped.endedAt);
        // A launch already stamped is not written again.
        expect(readFileSync(f.note, 'utf8')).toBe(written);
    });

    it("puts off a stamp the note's lock holds without waiting, reads the launch ended meanwhile, and writes it once the lock is free", () => {
        // revert: bin/dispatch-note.mjs "if (once) throw new Error('the note is locked by another writer', { cause: error });" => delete
        // revert: src/lib/server/sessions/stores/transcripts.ts "if (at !== undefined) note.endedAt ||= at;" => delete
        const f = new Fixture();
        f.transcript(PARENT, [prompt(NOW, 'orchestrate')]);
        f.enrol(PARENT, 7272);
        const fields = f.builder(8114, BEGAN);
        f.startOf.set(8114, BEGAN + 3600);
        f.write([launch(fields)]);
        // A live writer holds the note's lock: this process, with a lock born now.
        const lock = `${f.note}.lock`;
        writeFileSync(lock, `${process.pid} held`);
        const began = Date.now();
        expect(f.launched()[0].status).toBe('done');
        // The scan did not stop for the lock, which a waiting writer holds for two seconds.
        expect(Date.now() - began).toBeLessThan(1000);
        expect(readDispatches(f.note)[0].endedAt).toBe('');
        const first = f.reused.get('launch-one');
        expect(first).toBeDefined();
        // `ps` fails on the next scan: the pid answers signal 0 with no start time, and the lock is
        // still held. The launch reads ended all the same.
        f.startOf.delete(8114);
        expect(f.launched()[0].status).toBe('done');
        expect(readDispatches(f.note)[0].endedAt).toBe('');
        // The lock goes: the next scan writes the stamp, at the moment the reuse was first seen.
        rmSync(lock);
        const [row] = f.launched();
        expect(row.status).toBe('done');
        expect(readDispatches(f.note)[0].endedAt).toBe(first);
        expect(f.reused.size).toBe(0);
    });

    it('keeps a stamp another writer put in the note before this one', () => {
        // revert: src/lib/server/sessions/stores/dispatches.ts "if (stamp !== undefined && !record.endedAt) record.endedAt = stamp;" => if (stamp !== undefined) record.endedAt = stamp;
        const f = new Fixture();
        f.write([launch({ id: 'stamped', endedAt: '2026-09-24T10:00:00.000Z' })]);
        expect(stampEnded(f.note, new Map([['stamped', '2026-09-24T11:00:00.000Z']]))).toBe(true);
        expect(readDispatches(f.note)[0].endedAt).toBe('2026-09-24T10:00:00.000Z');
    });

    it('names the launches whose pid runs another process, and no other', () => {
        const reused = launch({ id: 'reused', pid: 8111, pidStart: formatStamp(BEGAN, true) });
        const running = launch({ id: 'running', pid: 8112, pidStart: formatStamp(BEGAN, true) });
        const gone = launch({ id: 'gone', pid: 8113, pidStart: formatStamp(BEGAN, true) });
        // revert: src/lib/server/sessions/stores/dispatches.ts "if (state === 'reused') reused.push(note.id);" => reused.push(note.id);
        const found = builderProcesses(
            [reused, running, gone],
            new Set([8111, 8112]),
            new Map([
                [8111, BEGAN + 3600],
                [8112, BEGAN]
            ])
        );
        expect(found.reused).toEqual(['reused']);
        expect([...found.live]).toEqual([
            ['reused', false],
            ['running', true],
            ['gone', false]
        ]);
    });

    it('reads a record without the pid fields, or with a pid that is not one, by the rules without a pid', () => {
        const f = new Fixture();
        f.transcript(PARENT, [prompt(NOW, 'orchestrate')]);
        // A record without the pid fields.
        const older: Json = { ...launch({ id: 'older-writer' }) };
        delete older.pid;
        delete older.pidStart;
        // revert: src/lib/server/sessions/stores/dispatches.ts "(note) => note.pid > 0 && note.endedAt === '' && !(Date.parse(note.startedAt) < since)" => (note) => note.endedAt === '' && !(Date.parse(note.startedAt) < since)
        f.write([
            older,
            launch({ id: 'no-pid' }),
            { ...launch({ id: 'negative' }), pid: -5 },
            { ...launch({ id: 'fraction' }), pid: 1.5 },
            { ...launch({ id: 'text' }), pid: '8104', pidStart: 42 }
        ]);
        // The launcher is gone and no builder session is held: no witness, so running till the end.
        const rows = f.launched();
        expect(rows.map((row) => row.status)).toEqual([
            'running',
            'running',
            'running',
            'running',
            'running'
        ]);
        expect(f.asked).toEqual([]);
        expect(readDispatches(f.note).map((note) => [note.pid, note.pidStart])).toEqual(
            Array.from({ length: 5 }, () => [0, ''])
        );
    });

    it('asks nothing about a launch whose end is stamped, which reads done by the stamp', () => {
        const f = new Fixture();
        f.transcript(PARENT, [prompt(NOW, 'orchestrate')]);
        const fields = f.builder(8105, BEGAN);
        // revert: src/lib/server/sessions/stores/dispatches.ts "(note) => note.pid > 0 && note.endedAt === '' && !(Date.parse(note.startedAt) < since)" => (note) => note.pid > 0 && !(Date.parse(note.startedAt) < since)
        f.write([launch({ ...fields, endedAt: '2026-09-23T10:30:00.000Z' })]);
        const [row] = f.launched();
        expect(row.status).toBe('done');
        expect(f.asked).toEqual([]);
    });

    it('reads running while the recorded process runs and `ps` gave no start time for it', () => {
        const f = new Fixture();
        f.transcript(PARENT, [prompt(NOW, 'orchestrate')]);
        f.enrol(PARENT, 7272);
        const fields = f.builder(8106, BEGAN);
        // Signal 0 answers, and `ps` failed or timed out, so no start time came back.
        f.startOf.delete(8106);
        // revert: src/lib/server/sessions/stores/dispatches.ts "if (actual === undefined || recorded === null) return 'running';" => return 'gone';
        f.write([launch(fields)]);
        expect(f.launched()[0].status).toBe('running');
    });

    it('reads running while the recorded process runs and its recorded start does not parse', () => {
        const f = new Fixture();
        f.transcript(PARENT, [prompt(NOW, 'orchestrate')]);
        f.enrol(PARENT, 7272);
        const { pid } = f.builder(8107, BEGAN);
        // revert: src/lib/server/sessions/stores/dispatches.ts "if (actual === undefined || recorded === null) return 'running';" => return 'gone';
        f.write([launch({ pid, pidStart: 'not a start time' }), launch({ id: 'empty', pid })]);
        expect(f.launched().map((row) => row.status)).toEqual(['running', 'running']);
    });

    it("asks `ps` once per scan for the registry's sessions and the launched builders together", () => {
        const f = new Fixture();
        f.transcript(PARENT, [prompt(NOW, 'orchestrate')]);
        f.enrol(PARENT, 7272);
        f.write([launch(f.builder(8108, BEGAN))]);
        // revert: src/lib/server/sessions/stores/transcripts.ts "const starts = probe.starts([...candidates.map((entry) => entry.pid), ...answered]);" => const starts = new Map([...probe.starts(candidates.map((entry) => entry.pid)), ...probe.starts([...answered])]);
        f.startsCalls = [];
        expect(f.launched()[0].status).toBe('running');
        expect(f.startsCalls.map((pids) => [...pids].sort())).toEqual([[7272, 8108]]);
    });
});
