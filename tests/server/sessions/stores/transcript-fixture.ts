// Layer 4, test fixture. The synthetic transcript store the session suites fold and scan: the
// records a transcript is made of (a human prompt, an assistant turn with its usage, a tool
// outcome, a turn's duration) and one temporary store with its registry, cache and overrides
// file. Every fixture is synthetic: nothing reads ~/.claude or ~/.codex, nothing is written outside
// the temporary directory the store asserts it is in, and the liveness check is a stub.

import { appendFileSync, mkdirSync, readFileSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from 'vitest';
import {
    readSession,
    scan,
    type ScanOptions
} from '../../../../src/lib/server/sessions/stores/transcripts.ts';
import type { Probe } from '../../../../src/lib/server/sessions/registry.ts';
import type { SessionRecord } from '../../../../src/lib/data/model/index.ts';
import { scratchDir } from '../../../fixtures/scratch.ts';

export const SLUG = '-tmp-fixture-workspace';
export const SID = 'aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb';
export const PID = 4242;
export const CONTEXT = {
    cwd: '/tmp/fixture/workspace',
    gitBranch: 'main',
    version: '9.9.9',
    permissionMode: 'auto',
    entrypoint: 'cli'
};

export type Json = Record<string, unknown>;

export function usage(
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

export function human(stamp: string, text: string): Json {
    return {
        type: 'user',
        timestamp: stamp,
        origin: { kind: 'human' },
        message: { role: 'user', content: text },
        ...CONTEXT
    };
}

export function assistant(
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

export function outcome(stamp: string, id: string, content: unknown = 'done', error = false): Json {
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

export function turn(stamp: string, millis = 1200): Json {
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
export class Fixture {
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

export function make(): Fixture {
    return new Fixture();
}
