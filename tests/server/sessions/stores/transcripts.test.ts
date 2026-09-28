// Transcript folding, the live-registry merge, dismissals and the incremental read cache.
//
// Every fixture here is synthetic, the session registry included: no test reads ~/.claude or
// ~/.codex, no test writes anywhere but the temporary directory it made, and the liveness check
// is answered by a stub, so nothing is ever signalled and `ps` is never run. Real transcripts hold
// private research content and never enter a test.

import {
    appendFileSync,
    mkdirSync,
    readFileSync,
    statSync,
    utimesSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
    readSession,
    scan,
    type ScanOptions
} from '../../../../src/lib/server/sessions/stores/transcripts.ts';
import {
    formatStamp,
    liveFrom,
    registryCandidates,
    type Probe
} from '../../../../src/lib/server/sessions/registry.ts';
import { hiddenIds, setHidden } from '../../../../src/lib/server/sessions/overrides.ts';
import { CACHE_VERSION } from '../../../../src/lib/server/sessions/cache.ts';
import { spentTokens } from '../../../../src/lib/server/sessions/fold.ts';
import type { LiveEntry, SessionRecord } from '../../../../src/lib/data/model/index.ts';
import { scratchDir, sweepScratch } from '../../../fixtures/scratch.ts';

/** The registry's live sessions alone: signal 0 per entry, then one `ps` for the ones that ran. */
function liveSessions(registries: string[], probe: Probe): Map<string, LiveEntry> {
    const candidates = registryCandidates(registries, probe);
    return liveFrom(candidates, probe.starts(candidates.map((entry) => entry.pid)));
}

afterAll(sweepScratch);

const SLUG = '-tmp-fixture-workspace';
const SID = 'aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb';
const PID = 4242;
const CONTEXT = {
    cwd: '/tmp/fixture/workspace',
    gitBranch: 'main',
    version: '9.9.9',
    permissionMode: 'auto',
    entrypoint: 'cli'
};

type Json = Record<string, unknown>;

function usage(
    options: Partial<{
        input: number;
        output: number;
        read: number;
        created: number;
        thinking: number;
        window: string;
    }> = {}
): Json {
    const input = options.input ?? 5;
    const output = options.output ?? 7;
    const read = options.read ?? 0;
    const created = options.created ?? 0;
    const block: Json = {
        input_tokens: input,
        output_tokens: output,
        cache_read_input_tokens: read,
        cache_creation_input_tokens: created,
        output_tokens_details: { thinking_tokens: options.thinking ?? 0 }
    };
    if (options.window !== undefined) {
        block.cache_creation = {
            ephemeral_1h_input_tokens: options.window === '1h' ? created : 0,
            ephemeral_5m_input_tokens: options.window === '5m' ? created : 0
        };
    }
    return block;
}

function human(stamp: string, text: string): Json {
    return {
        type: 'user',
        timestamp: stamp,
        origin: { kind: 'human' },
        message: { role: 'user', content: text },
        ...CONTEXT
    };
}

function assistant(
    stamp: string,
    options: Partial<{
        text: string;
        tools: [string, string, Json][];
        tokens: Json | null;
        model: string;
        effort: string;
    }> = {}
): Json {
    const content: Json[] = [];
    if (options.text !== undefined) content.push({ type: 'text', text: options.text });
    for (const [id, name, args] of options.tools ?? []) {
        content.push({ type: 'tool_use', id, name, input: args });
    }
    return {
        type: 'assistant',
        timestamp: stamp,
        effort: options.effort ?? 'high',
        message: {
            role: 'assistant',
            model: options.model ?? 'claude-test',
            content,
            ...(options.tokens === null ? {} : { usage: options.tokens ?? usage() })
        },
        ...CONTEXT
    };
}

function outcome(stamp: string, id: string, content: unknown = 'done', error = false): Json {
    return {
        type: 'user',
        timestamp: stamp,
        message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: id, content, is_error: error }]
        },
        ...CONTEXT
    };
}

function turn(stamp: string, millis = 1200): Json {
    return {
        type: 'system',
        subtype: 'turn_duration',
        durationMs: millis,
        timestamp: stamp,
        ...CONTEXT
    };
}

/**
 * One temporary fixture: a store with one transcript, a registry, a cache and an overrides file.
 */
class Fixture {
    root: string;
    store: string;
    path: string;
    cache: string;
    registry: string;
    overrides: string;
    codexStore: string;
    alive = new Set<number>();
    starts = new Map<number, number>();

    constructor() {
        this.root = scratchDir('oculus-sessions-');
        expect(resolve(this.root).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        this.store = join(this.root, 'projects');
        mkdirSync(join(this.store, SLUG), { recursive: true });
        this.path = join(this.store, SLUG, `${SID}.jsonl`);
        this.cache = join(this.root, 'cache', 'transcript-cache.json');
        this.registry = join(this.root, 'registry');
        mkdirSync(this.registry);
        this.overrides = join(this.root, 'sessions.json');
        // A store that does not exist: no test of this file reads the real Codex rollouts.
        this.codexStore = join(this.root, 'no-codex-store');
    }

    /** The stub the liveness check asks instead of the kernel and `ps`. */
    probe(): Probe {
        return {
            running: (pid: number) => this.alive.has(pid),
            starts: (pids: number[]) => {
                const found = new Map<number, number>();
                for (const pid of pids) {
                    const start = this.starts.get(pid);
                    if (start !== undefined) found.set(pid, start);
                }
                return found;
            }
        };
    }

    /** Write one session-registry entry, the way Claude Code does. */
    enrol(
        options: Partial<{
            pid: number;
            status: string | null;
            name: string;
            id: string;
            procStart: string;
        }> = {}
    ): void {
        const pid = options.pid ?? PID;
        const entry: Json = {
            pid,
            sessionId: options.id ?? SID,
            cwd: CONTEXT.cwd,
            startedAt: 1788955717254,
            version: '9.9.9',
            kind: 'interactive',
            entrypoint: 'cli',
            name: options.name ?? 'fixture-01'
        };
        const status = options.status === undefined ? 'busy' : options.status;
        if (status !== null) entry.status = status;
        if (options.procStart !== undefined) entry.procStart = options.procStart;
        this.alive.add(pid);
        writeFileSync(join(this.registry, `${pid}.json`), JSON.stringify(entry));
    }

    dismiss(id = SID, hidden = true): void {
        writeFileSync(this.overrides, JSON.stringify({ sessions: { [id]: { hidden } } }));
    }

    write(records: Json[], raw = ''): void {
        writeFileSync(
            this.path,
            records.map((record) => JSON.stringify(record) + '\n').join('') + raw
        );
    }

    append(records: Json[] = [], raw = ''): void {
        appendFileSync(
            this.path,
            records.map((record) => JSON.stringify(record) + '\n').join('') + raw
        );
    }

    scan(options: ScanOptions = {}): SessionRecord[] {
        return scan({
            stores: [this.store],
            codexStores: [this.codexStore],
            cachePath: this.cache,
            registries: [this.registry],
            overridesPath: this.overrides,
            probe: this.probe(),
            ...options
        });
    }

    only(options: ScanOptions = {}): SessionRecord {
        const found = this.scan(options);
        expect(found.length).toBe(1);
        return found[0];
    }

    cacheFile(): { version: number; entries: Record<string, { offset: number }> } {
        return JSON.parse(readFileSync(this.cache, 'utf8')) as {
            version: number;
            entries: Record<string, { offset: number }>;
        };
    }

    /** Age the transcript, which is how the idle threshold is reached without waiting. */
    age(seconds: number): void {
        const when = Date.now() / 1000 - seconds;
        utimesSync(this.path, when, when);
    }

    /**
     * A scanned record carries the registry's answer (live, its status, the pid, the dismissal); a
     * bare read of the file cannot know any of that. Everything else must agree.
     */
    matchesFullRead(record: SessionRecord): void {
        const full = readSession(this.path);
        const merged = {
            ...full,
            state: record.state,
            live: record.live,
            liveStatus: record.liveStatus,
            pid: record.pid,
            registryName: record.registryName,
            hidden: record.hidden
        };
        expect(record).toEqual(merged);
    }
}

function make(): Fixture {
    return new Fixture();
}

describe('the fold', () => {
    it('turns a minimal transcript into a record', () => {
        const f = make();
        f.write([
            human('2026-01-01T10:00:00.000Z', 'first ask'),
            assistant('2026-01-01T10:00:01.000Z', { tools: [['t1', 'Bash', { command: 'ls' }]] }),
            outcome('2026-01-01T10:00:02.000Z', 't1'),
            assistant('2026-01-01T10:00:03.000Z', {
                tools: [['t2', 'Edit', { file_path: '/tmp/fixture/workspace/a.py' }]]
            }),
            outcome('2026-01-01T10:00:04.000Z', 't2'),
            assistant('2026-01-01T10:00:05.000Z', { text: 'all set' }),
            turn('2026-01-01T10:00:06.000Z'),
            { type: 'ai-title', aiTitle: 'Fixture session' },
            { type: 'last-prompt', lastPrompt: 'first ask' }
        ]);
        const record = f.only();
        expect(record.id).toBe(SID);
        expect(record.slug).toBe(SLUG);
        expect(record.path).toBe(f.path);
        expect(record.tool).toBe('claude');
        expect(record.title).toBe('Fixture session');
        expect(record.lastPrompt).toBe('first ask');
        expect(record.cwd).toBe(CONTEXT.cwd);
        expect(record.branch).toBe('main');
        expect(record.version).toBe('9.9.9');
        expect(record.permissionMode).toBe('auto');
        expect(record.entrypoint).toBe('cli');
        expect(record.model).toBe('claude-test');
        expect(record.effort).toBe('high');
        expect(record.started).toBe('2026-01-01T10:00:00.000Z');
        expect(record.lastActivity).toBe('2026-01-01T10:00:05.000Z');
        expect(record.prompts).toBe(1);
        expect(record.messages).toBe(6);
        expect(record.tools).toEqual({ Bash: 1, Edit: 1 });
        expect(record.files).toEqual([
            {
                path: '/tmp/fixture/workspace/a.py',
                tool: 'Edit',
                count: 1,
                last: '2026-01-01T10:00:03.000Z'
            }
        ]);
        expect(record.timeline.map((event) => event.kind)).toEqual([
            'prompt',
            'tool',
            'edit',
            'turn'
        ]);
        expect(record.agents).toEqual([]);
        expect(record.truncated).toBe(false);
        // No registry entry: the process is gone.
        expect(record.state).toBe('ended');
        expect(record.live).toBe(false);
        expect(record.liveStatus).toBeNull();
        expect(record.pid).toBeNull();
        expect(record.registryName).toBeNull();
        expect(record.hidden).toBe(false);
        expect(Object.keys(record.tokens).sort()).toEqual([
            'cacheCreation',
            'cacheRead',
            'input',
            'output',
            'thinking'
        ]);
    });

    it('skips malformed lines', () => {
        const f = make();
        let text = JSON.stringify(human('2026-01-01T10:00:00.000Z', 'hello')) + '\n';
        text += 'not json at all\n{"type": "assistant"\n\n';
        text += JSON.stringify(assistant('2026-01-01T10:00:01.000Z', { text: 'fine' })) + '\n';
        writeFileSync(f.path, text);
        const record = f.only();
        expect(record.prompts).toBe(1);
        expect(record.messages).toBe(2);
    });

    it('falls back through three levels of title', () => {
        const f = make();
        f.write([human('2026-01-01T10:00:00.000Z', 'x'.repeat(90))]);
        expect(f.only().title).toBe('x'.repeat(60));

        f.append([{ type: 'ai-title', aiTitle: 'Named by the model' }]);
        expect(f.only().title).toBe('Named by the model');

        writeFileSync(f.path, 'garbage\n');
        expect(f.only().title).toBe(SID);
    });

    it('sums the tokens and counts a cache bust', () => {
        const f = make();
        f.write([
            assistant('2026-01-01T10:00:00.000Z', {
                tokens: usage({
                    input: 3,
                    output: 11,
                    read: 0,
                    created: 20000,
                    thinking: 4,
                    window: '1h'
                })
            }),
            assistant('2026-01-01T10:00:01.000Z', {
                tokens: usage({ input: 2, output: 5, read: 20000, created: 0 })
            }),
            // A big fresh write after a big read: one bust.
            assistant('2026-01-01T10:00:02.000Z', {
                tokens: usage({ input: 1, output: 6, read: 20000, created: 30000 })
            }),
            // A small creation after a big read is not a bust.
            assistant('2026-01-01T10:00:03.000Z', {
                tokens: usage({ input: 1, output: 1, read: 20000, created: 50 })
            })
        ]);
        const record = f.only();
        expect(record.tokens).toEqual({
            input: 7,
            output: 23,
            cacheRead: 60000,
            cacheCreation: 50050,
            thinking: 4
        });
        expect(record.cache.busts).toBe(1);
        expect(record.cache.ttl).toBe('1h');
        expect(record.cache.lastCreation).toBe('2026-01-01T10:00:03.000Z');
        expect(record.cache.lastRead).toBe('2026-01-01T10:00:03.000Z');
    });

    it('puts a cache bust on the timeline', () => {
        const f = make();
        f.write([
            assistant('2026-01-01T10:00:00.000Z', {
                tokens: usage({ input: 1, output: 1, read: 20000, created: 0 })
            }),
            assistant('2026-01-01T10:00:01.000Z', {
                tokens: usage({ input: 1, output: 1, read: 20000, created: 30000 })
            })
        ]);
        const record = f.only();
        const busts = record.timeline.filter((event) => event.kind === 'bust');
        expect(record.cache.busts).toBe(1);
        expect(busts.length).toBe(1);
        expect(busts[0].text).toBe('30000');
        expect(busts[0].ts).toBe('2026-01-01T10:00:01.000Z');
    });

    it('takes the model but changes no usage state when an assistant has no usage map', () => {
        const f = make();
        f.write([
            assistant('2026-01-01T10:00:00.000Z', {
                tokens: usage({ input: 1, output: 2, read: 20000, created: 0 }),
                model: 'before'
            }),
            assistant('2026-01-01T10:00:01.000Z', {
                tokens: null,
                model: 'model-only'
            }),
            assistant('2026-01-01T10:00:02.000Z', {
                tokens: usage({ input: 3, output: 4, read: 0, created: 30000 }),
                model: ''
            })
        ]);
        const record = f.only();
        expect(record.model).toBe('model-only');
        expect(record.tokens).toEqual({
            input: 4,
            output: 6,
            cacheRead: 20000,
            cacheCreation: 30000,
            thinking: 0
        });
        expect(record.cache.busts).toBe(1);
    });

    it('reports agents running, done and error', () => {
        const f = make();
        f.write([
            assistant('2026-01-01T10:00:00.000Z', {
                tools: [
                    [
                        'a1',
                        'Agent',
                        { description: 'first', subagent_type: 'general-purpose', model: 'opus' }
                    ],
                    ['a2', 'Agent', { description: 'second', subagent_type: 'Explore' }],
                    ['a3', 'Agent', { description: 'third', subagent_type: 'Explore' }]
                ]
            }),
            outcome('2026-01-01T10:00:09.000Z', 'a1', 'twelve chars'),
            outcome('2026-01-01T10:00:10.000Z', 'a2', [{ type: 'text', text: 'abc' }], true)
        ]);
        const agents = new Map(f.only().agents.map((agent) => [agent.id, agent]));
        expect(agents.get('a1')?.status).toBe('done');
        expect(agents.get('a1')?.model).toBe('opus');
        expect(agents.get('a1')?.description).toBe('first');
        expect(agents.get('a1')?.subagentType).toBe('general-purpose');
        expect(agents.get('a1')?.ended).toBe('2026-01-01T10:00:09.000Z');
        expect(agents.get('a1')?.resultChars).toBe(12);
        expect(agents.get('a2')?.status).toBe('error');
        expect(agents.get('a2')?.resultChars).toBe(3);
        expect(agents.get('a2')?.model).toBeNull();
        expect(agents.get('a3')?.status).toBe('running');
        expect(agents.get('a3')?.ended).toBeNull();
        expect(agents.get('a3')?.resultChars).toBe(0);
    });

    it('reports the tokens an agent result says it spent, and none where the result says nothing', () => {
        const f = make();
        const spent = outcome('2026-01-01T10:00:09.000Z', 'a1', 'done');
        spent.toolUseResult = { totalTokens: 48200 };
        const junk = outcome('2026-01-01T10:00:09.000Z', 'a2', 'done');
        junk.toolUseResult = { totalTokens: -1 };
        f.write([
            assistant('2026-01-01T10:00:00.000Z', {
                tools: [
                    ['a1', 'Agent', { description: 'first', subagent_type: 'Explore' }],
                    ['a2', 'Agent', { description: 'second', subagent_type: 'Explore' }]
                ]
            }),
            spent,
            junk
        ]);
        const agents = new Map(f.only().agents.map((agent) => [agent.id, agent]));
        expect((agents.get('a1') as { tokens?: number }).tokens).toBe(48200);
        expect((agents.get('a2') as { tokens?: number }).tokens).toBe(undefined);
        expect(spentTokens({ totalTokens: 7 })).toBe(7);
        expect([spentTokens({ totalTokens: '7' }), spentTokens(null)]).toEqual([null, null]);
    });

    it('reads the state off the tail of the transcript', () => {
        // The guess governs only a live session whose registry entry carries no status of its own.
        const f = make();
        f.enrol({ status: null });
        const base = [human('2026-01-01T10:00:00.000Z', 'go')];
        f.write([
            ...base,
            assistant('2026-01-01T10:00:01.000Z', { tools: [['t1', 'Bash', { command: 'ls' }]] })
        ]);
        expect(f.only().state).toBe('working');

        f.append([outcome('2026-01-01T10:00:02.000Z', 't1')]);
        expect(f.only().state).toBe('working');

        f.append([assistant('2026-01-01T10:00:03.000Z', { text: 'answer' })]);
        expect(f.only().state).toBe('idle');

        f.append([turn('2026-01-01T10:00:04.000Z')]);
        expect(f.only().state).toBe('idle');

        f.append([
            assistant('2026-01-01T10:00:05.000Z', { tools: [['t2', 'Bash', { command: 'ls' }]] })
        ]);
        expect(f.only().state).toBe('working');
        f.age(45 * 60);
        expect(f.only().state).toBe('idle');

        writeFileSync(f.path, 'nothing parseable here\n');
        expect(f.only().state).toBe('unknown');
    });

    it('reports the last turn as the context, not the lifetime total', () => {
        // The token sums are lifetime figures and run into the hundreds of millions. A context
        // meter needs what the model carried on the most recent turn.
        const f = make();
        f.write([
            assistant('2026-01-01T10:00:01.000Z', {
                tokens: {
                    input_tokens: 10,
                    cache_read_input_tokens: 1000,
                    cache_creation_input_tokens: 500,
                    output_tokens: 5
                }
            }),
            assistant('2026-01-01T10:00:02.000Z', {
                tokens: {
                    input_tokens: 20,
                    cache_read_input_tokens: 2000,
                    cache_creation_input_tokens: 100,
                    output_tokens: 7
                }
            })
        ]);
        const record = readSession(f.path);
        expect(record.contextTokens).toBe(2120);
        expect(record.tokens.cacheRead).toBe(3000);
        // The share the panel draws is the last turn's read over the last turn's occupancy. The
        // lifetime sum over the same occupancy would be 142% cached, which is not a share of
        // anything.
        expect(record.lastCacheRead).toBe(2000);
        expect(Math.round((100 * record.lastCacheRead) / record.contextTokens)).toBe(94);
    });
});

describe('the incremental read', () => {
    it('matches a full read after an append', () => {
        const f = make();
        f.write([
            human('2026-01-01T10:00:00.000Z', 'go'),
            assistant('2026-01-01T10:00:01.000Z', {
                tools: [['t1', 'Read', { file_path: '/tmp/fixture/workspace/a.py' }]]
            })
        ]);
        const first = f.only();
        expect(first.messages).toBe(2);
        const before = readFileSync(f.cache, 'utf8');

        f.append([
            outcome('2026-01-01T10:00:02.000Z', 't1'),
            assistant('2026-01-01T10:00:03.000Z', { text: 'answer' }),
            turn('2026-01-01T10:00:04.000Z')
        ]);
        const second = f.only();
        expect(second.messages).toBe(4);
        f.matchesFullRead(second);
        expect(readFileSync(f.cache, 'utf8')).not.toBe(before);
        expect(f.cacheFile().entries[f.path].offset).toBe(statSync(f.path).size);
    });

    it('waits for the rest of a partial trailing line', () => {
        const f = make();
        f.write([human('2026-01-01T10:00:00.000Z', 'go')]);
        const half = JSON.stringify(assistant('2026-01-01T10:00:01.000Z', { text: 'answer' }));
        f.append([], half.slice(0, 40));
        const record = f.only();
        expect(record.messages).toBe(1);
        expect(f.cacheFile().entries[f.path].offset).toBe(statSync(f.path).size - 40);

        f.append([], half.slice(40) + '\n');
        const second = f.only();
        expect(second.messages).toBe(2);
        f.matchesFullRead(second);
    });

    it('never cuts a multi-byte character in half at the end of a read', () => {
        // The offset is in bytes and a read can end in the middle of a character. The prompt is
        // built from code points rather than written as glyphs, so this file stays ASCII.
        const f = make();
        const wide = String.fromCodePoint(0x4e16, 0x754c);
        const said = `report ${wide.repeat(20)}`;
        f.write([human('2026-01-01T10:00:00.000Z', 'go')]);
        const bytes = Buffer.from(JSON.stringify(human('2026-01-01T10:00:01.000Z', said)) + '\n');
        const cut = bytes.indexOf(Buffer.from(wide)) + 1;
        expect(cut).toBeGreaterThan(1);

        appendFileSync(f.path, bytes.subarray(0, cut));
        expect(f.only().prompts).toBe(1);
        appendFileSync(f.path, bytes.subarray(cut));
        const record = f.only();
        expect(record.prompts).toBe(2);
        expect(record.timeline[1].text).toBe(said);
        f.matchesFullRead(record);
    });

    it('reads a shrunk file from zero', () => {
        const f = make();
        f.write([
            human('2026-01-01T10:00:00.000Z', 'first'),
            assistant('2026-01-01T10:00:01.000Z', { text: 'a' }),
            assistant('2026-01-01T10:00:02.000Z', { text: 'b' }),
            assistant('2026-01-01T10:00:03.000Z', { text: 'c' })
        ]);
        expect(f.only().messages).toBe(4);
        f.write([human('2026-01-01T11:00:00.000Z', 'restarted')]);
        const record = f.only();
        expect(record.messages).toBe(1);
        expect(record.started).toBe('2026-01-01T11:00:00.000Z');
        f.matchesFullRead(record);
    });

    it('discards a corrupt cache', () => {
        const f = make();
        f.write([human('2026-01-01T10:00:00.000Z', 'go')]);
        mkdirSync(join(f.root, 'cache'), { recursive: true });
        writeFileSync(f.cache, '{not json');
        expect(f.only().prompts).toBe(1);
        expect(f.cacheFile().version).toBe(CACHE_VERSION);
    });

    it('keeps to the window and the session cap', () => {
        const f = make();
        f.write([human('2026-01-01T10:00:00.000Z', 'recent')]);
        const old = join(f.store, SLUG, 'cccccccc-4444-5555-6666-dddddddddddd.jsonl');
        writeFileSync(old, JSON.stringify(human('2025-01-01T10:00:00.000Z', 'stale')) + '\n');
        const when = Date.now() / 1000 - 5 * 86400;
        utimesSync(old, when, when);
        expect(f.scan().map((record) => record.id)).toEqual([SID]);
        const both = f.scan({ windowDays: 30 });
        expect(both.length).toBe(2);
        expect(both[0].id).toBe(SID);
        expect(f.scan({ windowDays: 30, maxSessions: 1 }).map((record) => record.id)).toEqual([
            SID
        ]);
    });

    it('does not list a nested sub-agent transcript as a session', () => {
        const f = make();
        f.write([human('2026-01-01T10:00:00.000Z', 'root')]);
        const folder = join(f.store, SLUG, SID, 'subagents');
        mkdirSync(folder, { recursive: true });
        writeFileSync(
            join(folder, 'agent-one.jsonl'),
            JSON.stringify(human('2026-01-01T10:00:01.000Z', 'nested')) + '\n'
        );
        expect(f.scan({ windowDays: 30 }).map((record) => record.id)).toEqual([SID]);
    });

    it('reports an oversized first read as truncated', () => {
        const f = make();
        f.write([human('2026-01-01T10:00:00.000Z', 'go')]);
        const record = f.only({ maxFirstReadBytes: 10 });
        expect(record.truncated).toBe(true);
        expect(record.state).toBe('ended');
        expect(record.messages).toBe(0);
        expect(record.title).toBe(SID);
        expect(f.path in f.cacheFile().entries).toBe(false);
    });

    it('returns nothing for a store that is not there', () => {
        const f = make();
        expect(f.scan({ stores: [join(f.root, 'gone')] })).toEqual([]);
    });
});

describe('the live registry', () => {
    /**
     * A transcript whose tail reads as mid-turn, so a registry status has something to override.
     */
    function midTurn(f: Fixture): void {
        f.write([
            human('2026-01-01T10:00:00.000Z', 'go'),
            assistant('2026-01-01T10:00:01.000Z', { tools: [['t1', 'Bash', { command: 'ls' }]] })
        ]);
    }

    it('makes a session with a running entry live', () => {
        const f = make();
        midTurn(f);
        f.enrol({ status: 'idle', name: 'research-hub-49' });
        const record = f.only();
        expect(record.live).toBe(true);
        expect(record.liveStatus).toBe('idle');
        // The registry outranks the mid-turn tail.
        expect(record.state).toBe('idle');
        expect(record.pid).toBe(PID);
        expect(record.registryName).toBe('research-hub-49');
    });

    it('maps busy to working and passes an unknown status through', () => {
        const f = make();
        f.write([
            human('2026-01-01T10:00:00.000Z', 'go'),
            assistant('2026-01-01T10:00:01.000Z', { text: 'answer' })
        ]);
        f.enrol({ status: 'busy' });
        expect(f.only().state).toBe('working');
        f.enrol({ status: 'compacting' });
        const record = f.only();
        expect(record.state).toBe('compacting');
        expect(record.liveStatus).toBe('compacting');
    });

    it('leaves the transcript guess alone for an entry without a status', () => {
        const f = make();
        midTurn(f);
        f.enrol({ status: null });
        const record = f.only();
        expect(record.live).toBe(true);
        expect(record.liveStatus).toBeNull();
        expect(record.state).toBe('working');
    });

    it('says a session with no registry entry has ended', () => {
        const f = make();
        midTurn(f);
        f.enrol({ id: 'some-other-session' });
        const record = f.only();
        expect(record.live).toBe(false);
        expect(record.state).toBe('ended');
    });

    it('does not call an entry live when its process is gone', () => {
        const f = make();
        midTurn(f);
        f.enrol({ pid: 9191 });
        f.alive.delete(9191);
        expect(liveSessions([f.registry], f.probe()).size).toBe(0);
        expect(f.only().state).toBe('ended');
    });

    it('rejects a reused pid by the process start time', () => {
        const f = make();
        const actual = Math.floor(Date.now() / 1000) - 500;
        f.starts.set(PID, actual);
        // Written in UTC, the way the registry does.
        f.enrol({ procStart: formatStamp(actual) });
        expect(liveSessions([f.registry], f.probe()).has(SID)).toBe(true);
        // The same pid, a different process.
        f.enrol({ procStart: formatStamp(actual - 3 * 86400) });
        expect(liveSessions([f.registry], f.probe()).size).toBe(0);
        // Unreadable: the pid check stands alone.
        f.enrol({ procStart: 'not a date at all' });
        expect(liveSessions([f.registry], f.probe()).has(SID)).toBe(true);
    });

    it('accepts a stamp the registry wrote in local time', () => {
        // The registry writes UTC and `ps` reports local time, so both readings are tried; on a
        // machine whose zone is UTC the two agree and this case is the same as the one above.
        const f = make();
        const actual = Math.floor(Date.now() / 1000) - 500;
        f.starts.set(PID, actual);
        f.enrol({ procStart: formatStamp(actual, false) });
        expect(liveSessions([f.registry], f.probe()).has(SID)).toBe(true);
    });

    it('skips broken registry files and the key files beside them', () => {
        const f = make();
        writeFileSync(join(f.registry, '1.json'), '{not json');
        writeFileSync(join(f.registry, '2.json'), JSON.stringify(['a list']));
        writeFileSync(join(f.registry, '3.json'), JSON.stringify({ pid: PID }));
        writeFileSync(join(f.registry, '4.json'), JSON.stringify({ sessionId: 'x' }));
        writeFileSync(join(f.registry, `5.${'f'.repeat(8)}.key`), 'secret material');
        f.alive.add(1);
        f.alive.add(2);
        f.alive.add(3);
        f.alive.add(4);
        f.enrol();
        expect([...liveSessions([f.registry], f.probe()).keys()]).toEqual([SID]);
    });

    it('finds no live session when the registry folder is missing', () => {
        const f = make();
        expect(liveSessions([join(f.root, 'gone')], f.probe()).size).toBe(0);
    });
});

describe('dismissals', () => {
    it('marks a dismissed session that has ended hidden', () => {
        const f = make();
        f.write([human('2026-01-01T10:00:00.000Z', 'go')]);
        expect(f.only().hidden).toBe(false);
        f.dismiss();
        expect(f.only().hidden).toBe(true);
        f.dismiss(SID, false);
        expect(f.only().hidden).toBe(false);
    });

    it('never hides a live session', () => {
        // It is on screen because it is running. Hiding one and having it reappear reads as a bug.
        const f = make();
        f.write([human('2026-01-01T10:00:00.000Z', 'go')]);
        f.enrol({ status: 'busy' });
        f.dismiss();
        expect(f.only().hidden).toBe(false);
    });

    it('writes only the hidden key and keeps the rest', () => {
        const f = make();
        writeFileSync(
            f.overrides,
            JSON.stringify({
                note: 'kept',
                sessions: {
                    [SID]: { area: '/tmp/pinned', title: 'mine' },
                    other: { hidden: true }
                }
            })
        );
        setHidden(SID, true, f.overrides);
        let data = JSON.parse(readFileSync(f.overrides, 'utf8')) as Record<string, unknown>;
        let sessions = data.sessions as Record<string, unknown>;
        expect(data.note).toBe('kept');
        expect(sessions[SID]).toEqual({ area: '/tmp/pinned', title: 'mine', hidden: true });
        expect(sessions.other).toEqual({ hidden: true });

        setHidden(SID, false, f.overrides);
        data = JSON.parse(readFileSync(f.overrides, 'utf8')) as Record<string, unknown>;
        sessions = data.sessions as Record<string, unknown>;
        expect(sessions[SID]).toEqual({ area: '/tmp/pinned', title: 'mine' });
        expect([...hiddenIds(f.overrides)]).toEqual(['other']);
    });

    it('starts an overrides file that does not exist yet', () => {
        const f = make();
        setHidden(SID, true, f.overrides);
        expect(JSON.parse(readFileSync(f.overrides, 'utf8'))).toEqual({
            sessions: { [SID]: { hidden: true } }
        });
        setHidden(SID, false, f.overrides);
        expect(JSON.parse(readFileSync(f.overrides, 'utf8'))).toEqual({ sessions: {} });
    });

    it('refuses an id that is not a non-empty string', () => {
        const f = make();
        for (const bad of ['', '   ', null, 17]) {
            expect(() => setHidden(bad, true, f.overrides)).toThrow(/a session id is required/);
        }
        expect(() => readFileSync(f.overrides, 'utf8')).toThrow();
    });

    it('hides nothing from a corrupt overrides file', () => {
        const f = make();
        writeFileSync(f.overrides, '{not json');
        f.write([human('2026-01-01T10:00:00.000Z', 'go')]);
        expect(f.only().hidden).toBe(false);
        expect(hiddenIds(f.overrides).size).toBe(0);
    });
});
