// Layer 4, server test. A subagent a Claude session starts in the background: the Agent call's
// answer is only its launch notice, so the row stays running until the session's completion notice
// names its agent id, or, without one, until its own transcript has been still past the idle time.
//
// Every transcript is synthetic and written under the temporary directory, and the liveness probe
// is a stub, so nothing reads ~/.claude and nothing is signalled.

import { mkdirSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { scan } from '../../../../src/lib/server/sessions/stores/transcripts.ts';
import type { SessionRecord } from '../../../../src/lib/data/model/index.ts';
import { scratchDir, sweepScratch } from '../../../fixtures/scratch.ts';

afterAll(sweepScratch);

const SLUG = '-tmp-fixture-workspace';
const SID = 'dddddddd-1111-2222-3333-eeeeeeeeeeee';
const CONTEXT = { cwd: '/tmp/fixture/workspace', gitBranch: 'main', version: '9.9.9' };

type Json = Record<string, unknown>;

/** One record of the session: who wrote it, when, and the message content it carries. */
function entry(
    role: 'user' | 'assistant',
    stamp: string,
    content: unknown,
    extra: Json = {}
): Json {
    return { type: role, timestamp: stamp, message: { role, content }, ...CONTEXT, ...extra };
}

/** What the person asked. */
function human(stamp: string, text: string): Json {
    return entry('user', stamp, text, { origin: { kind: 'human' } });
}

/** An assistant turn that makes the given tool calls. */
function assistant(stamp: string, options: { tools: [string, string, Json][] }): Json {
    const calls = options.tools.map(([id, name, input]) => ({ type: 'tool_use', id, name, input }));
    return entry('assistant', stamp, calls);
}

/** The answer of one tool call. */
function outcome(stamp: string, id: string, content: unknown): Json {
    return entry('user', stamp, [{ type: 'tool_result', tool_use_id: id, content }]);
}

/** One session's transcript in a store of its own, and the scan over it. */
class Fixture {
    root = scratchDir('oculus-background-');
    store: string;
    path: string;

    constructor() {
        expect(resolve(this.root).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        this.store = join(this.root, 'projects');
        mkdirSync(join(this.store, SLUG), { recursive: true });
        this.path = join(this.store, SLUG, `${SID}.jsonl`);
    }

    write(records: Json[]): void {
        writeFileSync(this.path, records.map((record) => JSON.stringify(record) + '\n').join(''));
    }

    append(records: Json[]): void {
        const held = records.map((record) => JSON.stringify(record) + '\n').join('');
        writeFileSync(this.path, held, { flag: 'a' });
    }

    only(): SessionRecord {
        const found = scan({
            stores: [this.store],
            cachePath: join(this.root, 'cache', 'transcript-cache.json'),
            registries: [],
            overridesPath: join(this.root, 'sessions.json'),
            dispatchesPath: join(this.root, 'dispatches.json'),
            probe: { running: () => false, starts: () => new Map<number, number>() },
            codexProbe: { commands: () => [] }
        });
        expect(found.length).toBe(1);
        return found[0];
    }
}

describe('a subagent started in the background', () => {
    /**
     * A background Agent call, its launch answer, and the subagent's own transcript, fresh. The
     * call asks for the background (`flagged`) or leaves it to the answer, which is the shape
     * Claude Code writes; the answer names the agent id or not (`named`).
     */
    function launched(f: Fixture, flagged = true, named = true): string {
        const input: Json = { description: 'builder', subagent_type: 'general-purpose' };
        if (flagged) input.run_in_background = true;
        const answer: Json = { isAsync: true, status: 'async_launched' };
        if (named) answer.agentId = 'agent7';
        f.write([
            assistant('2026-01-01T10:00:00.000Z', { tools: [['b1', 'Agent', input]] }),
            {
                ...outcome(
                    '2026-01-01T10:00:01.000Z',
                    'b1',
                    named
                        ? 'Async agent launched successfully.\nagentId: agent7 (internal id)'
                        : 'Async agent launched successfully.'
                ),
                toolUseResult: answer
            }
        ]);
        const folder = join(f.store, SLUG, SID, 'subagents');
        mkdirSync(folder, { recursive: true });
        const own = join(folder, 'agent-agent7.jsonl');
        expect(resolve(own).startsWith(resolve(f.root) + sep)).toBe(true);
        writeFileSync(own, JSON.stringify(human('2026-01-01T10:00:02.000Z', 'build it')) + '\n');
        return own;
    }

    /**
     * Date the subagent's own file at the one line it wrote, before any notice, as a subagent that
     * has stopped leaves it.
     */
    function stopped(own: string): void {
        const wrote = Date.parse('2026-01-01T10:00:02.000Z') / 1000;
        utimesSync(own, wrote, wrote);
    }

    /**
     * One completion notice that reached a busy session: the transcript carries it as the
     * attachment of the queued command, not as a user message.
     */
    function queued(stamp: string, ids: { task?: string; call?: string }, status: string): Json {
        const lines = ['<task-notification>'];
        if (ids.task !== undefined) lines.push(`<task-id>${ids.task}</task-id>`);
        if (ids.call !== undefined) lines.push(`<tool-use-id>${ids.call}</tool-use-id>`);
        lines.push(`<status>${status}</status>`, '</task-notification>');
        return {
            type: 'attachment',
            timestamp: stamp,
            attachment: {
                type: 'queued_command',
                prompt: lines.join('\n'),
                commandMode: 'task-notification'
            }
        };
    }

    /** One completion notice, as the session records it when the subagent stops. */
    function notice(stamp: string, ids: { task?: string; call?: string }, status: string): Json {
        const lines = ['<task-notification>'];
        if (ids.task !== undefined) lines.push(`<task-id>${ids.task}</task-id>`);
        if (ids.call !== undefined) lines.push(`<tool-use-id>${ids.call}</tool-use-id>`);
        lines.push(
            `<status>${status}</status>`,
            '<result>all six</result>',
            '</task-notification>'
        );
        return entry('user', stamp, lines.join('\n'));
    }

    it('keeps a subagent started in the background running after its launch answer', () => {
        // revert: src/lib/server/sessions/fold.ts:111 => if (false) {
        const f = new Fixture();
        launched(f);
        const [agent] = f.only().agents;
        expect(agent.status).toBe('running');
        expect(agent.ended).toBeNull();
        expect(agent.resultChars).toBe(0);
    });

    it('knows a launch by its answer when the call does not ask for the background', () => {
        // revert: src/lib/server/sessions/stores/background.ts:55 => return false;
        const f = new Fixture();
        launched(f, false);
        const [agent] = f.only().agents;
        expect(agent.status).toBe('running');
        expect(agent.ended).toBeNull();
    });

    it('ends a background subagent at the completion notice naming its agent id', () => {
        // revert: src/lib/server/sessions/fold.ts:121 => delete
        const f = new Fixture();
        const own = launched(f, false);
        f.append([notice('2026-01-01T10:05:00.000Z', { task: 'someone-else' }, 'completed')]);
        expect(f.only().agents[0].status).toBe('running');
        stopped(own);
        f.append([notice('2026-01-01T10:09:00.000Z', { task: 'agent7' }, 'completed')]);
        const [agent] = f.only().agents;
        expect(agent.status).toBe('done');
        expect(agent.ended).toBe('2026-01-01T10:09:00.000Z');
        expect(agent.resultChars).toBe('all six'.length);
    });

    it('ends one by the notice naming its call when the launch answer named no agent id', () => {
        // revert: src/lib/server/sessions/stores/background.ts:82 => false
        const f = new Fixture();
        stopped(launched(f, false, false));
        f.append([notice('2026-01-01T10:09:00.000Z', { task: 'agent7', call: 'b1' }, 'completed')]);
        const [agent] = f.only().agents;
        expect(agent.status).toBe('done');
        expect(agent.ended).toBe('2026-01-01T10:09:00.000Z');
    });

    it('reads a subagent killed before it finished as stopped', () => {
        // revert: src/lib/server/sessions/stores/background.ts:38 => const ENDED_AS: Record<string, string> = { completed: 'done' };
        const f = new Fixture();
        stopped(launched(f, false));
        f.append([notice('2026-01-01T10:09:00.000Z', { task: 'agent7', call: 'b1' }, 'killed')]);
        const [agent] = f.only().agents;
        expect(agent.status).toBe('stopped');
        expect(agent.ended).toBe('2026-01-01T10:09:00.000Z');
    });

    it('reads a subagent resumed after its notice by the latest notice', () => {
        // revert: src/lib/server/sessions/stores/background.ts:89 => agent.ended = stamp; delete acc.background[id ?? ''];
        const f = new Fixture();
        stopped(launched(f, false));
        f.append([notice('2026-01-01T10:09:00.000Z', { task: 'agent7', call: 'b1' }, 'killed')]);
        expect(f.only().agents[0].status).toBe('stopped');
        f.append([notice('2026-01-01T10:30:00.000Z', { task: 'agent7', call: 'b1' }, 'completed')]);
        const [agent] = f.only().agents;
        expect(agent.status).toBe('done');
        expect(agent.ended).toBe('2026-01-01T10:30:00.000Z');
    });

    it('reads a subagent resumed after its notice as running while it writes again, and by its next notice after', () => {
        // revert: src/lib/server/sessions/stores/background.ts:128 => if (false) {
        const f = new Fixture();
        const own = launched(f, false);
        stopped(own);
        f.append([notice('2026-01-01T10:09:00.000Z', { task: 'agent7', call: 'b1' }, 'completed')]);
        expect(f.only().agents[0].status).toBe('done');
        // Resumed: the subagent writes its own transcript again, well after that notice.
        const resumed = Date.parse('2026-01-01T10:20:00.000Z') / 1000;
        utimesSync(own, resumed, resumed);
        const [running] = f.only().agents;
        expect(running.status).toBe('running');
        expect(running.ended).toBeNull();
        // It stops again, and the next notice ends the row again.
        const idle = Date.parse('2026-01-01T10:29:00.000Z') / 1000;
        utimesSync(own, idle, idle);
        f.append([notice('2026-01-01T10:30:00.000Z', { task: 'agent7', call: 'b1' }, 'completed')]);
        const [again] = f.only().agents;
        expect(again.status).toBe('done');
        expect(again.ended).toBe('2026-01-01T10:30:00.000Z');
    });

    it('ends a subagent by a notice queued while the session was busy, and reads a killed one stopped', () => {
        // revert: src/lib/server/sessions/fold.ts:66 => if (false) {
        const f = new Fixture();
        stopped(launched(f, false));
        f.append([queued('2026-01-01T10:09:00.000Z', { task: 'agent7' }, 'killed')]);
        const [agent] = f.only().agents;
        expect(agent.status).toBe('stopped');
        expect(agent.ended).toBe('2026-01-01T10:09:00.000Z');
    });

    it('reads a background subagent by its own transcript: running while it grows, done once still', () => {
        // revert: src/lib/server/sessions/stores/background.ts:135 => continue;
        const f = new Fixture();
        const own = launched(f);
        // The session's own file has been still for two hours; the subagent's transcript has not.
        const fresh = Date.now() / 1000;
        utimesSync(own, fresh, fresh);
        const old = fresh - 2 * 3600;
        utimesSync(f.path, old, old);
        expect(f.only().agents[0].status).toBe('running');
        utimesSync(own, old, old);
        const [agent] = f.only().agents;
        expect(agent.status).toBe('done');
        expect(agent.ended).toBe(new Date(statSync(own).mtimeMs).toISOString());
    });
});
