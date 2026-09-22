// The Codex CLI rollout fold, its liveness check, and the two stores merging into one list.
//
// Every rollout here is synthetic and lives in a temporary directory; no test reads ~/.codex or
// ~/.claude, and the process probe is a stub, so `ps` is never run and nothing is ever signalled.

import { mkdirSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { readSession, scan } from '../../../../src/lib/server/sessions/stores/transcripts.ts';
import {
    CODEX_FRESH_SECONDS,
    codexLive,
    codexRunning,
    rolloutId,
    type CodexProbe
} from '../../../../src/lib/server/sessions/stores/codex.ts';
import type { SessionRecord } from '../../../../src/lib/data/model.ts';
import { scratchDir, sweepScratch } from '../../../fixtures/scratch.ts';

afterAll(sweepScratch);

const UUID = '01a07d03-c92a-7a91-8667-7f0520b8197f';
const NAME = `rollout-2026-09-07T19-56-35-${UUID}.jsonl`;
const CWD = '/synthetic/space/hub';

type Json = Record<string, unknown>;

function line(timestamp: string, type: string, payload: Json): Json {
    return { timestamp, type, payload };
}

function meta(
    timestamp: string,
    options: Partial<{ id: string; cwd: string; branch: string }> = {}
): Json {
    return line(timestamp, 'session_meta', {
        id: options.id ?? UUID,
        session_id: options.id ?? UUID,
        cwd: options.cwd ?? CWD,
        originator: 'codex_exec',
        cli_version: '0.153.4',
        model_provider: 'openai',
        git: { branch: options.branch ?? 'main', commit_hash: 'abc123' }
    });
}

function item(timestamp: string, body: Json): Json {
    return line(timestamp, 'event_msg', { type: 'item_completed', item: body });
}

/** One temporary Codex store holding one rollout. */
class Rollout {
    root: string;
    store: string;
    path: string;
    cache: string;
    overrides: string;
    claudeStore: string;
    registry: string;

    constructor() {
        this.root = scratchDir('oculus-codex-');
        expect(resolve(this.root).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        this.store = join(this.root, 'sessions');
        mkdirSync(join(this.store, '2026', '09', '07'), { recursive: true });
        this.path = join(this.store, '2026', '09', '07', NAME);
        this.cache = join(this.root, 'cache.json');
        this.overrides = join(this.root, 'sessions.json');
        // Stores that do not exist: no test of this file reads the real Claude transcripts.
        this.claudeStore = join(this.root, 'no-claude-store');
        this.registry = join(this.root, 'no-registry');
    }

    write(records: Json[]): void {
        writeFileSync(this.path, records.map((record) => JSON.stringify(record) + '\n').join(''));
    }

    age(seconds: number): void {
        const when = Date.now() / 1000 - seconds;
        utimesSync(this.path, when, when);
    }

    read(): SessionRecord {
        return readSession(this.path, this.store);
    }

    scan(probe: CodexProbe): SessionRecord[] {
        return scan({
            store: this.claudeStore,
            codexStore: this.store,
            cachePath: this.cache,
            registry: this.registry,
            overridesPath: this.overrides,
            probe: { running: () => false, starts: () => new Map() },
            codexProbe: probe
        });
    }
}

/** A probe answering with the process names given, and nothing else. */
function probe(...commands: string[]): CodexProbe {
    return { commands: () => commands };
}

describe('the rollout fold', () => {
    it('opens the record from the session meta and keeps a fork from renaming it', () => {
        const roll = new Rollout();
        roll.write([
            meta('2026-09-07T17:56:35.426Z'),
            // A forked rollout carries the meta of the session it forked from after its own.
            meta('2026-09-07T17:56:35.500Z', {
                id: 'the-parent',
                cwd: '/elsewhere',
                branch: 'other'
            })
        ]);
        const record = roll.read();
        expect(record.id).toBe(UUID);
        expect(record.tool).toBe('codex');
        expect(record.slug).toBe(join('2026', '09', '07'));
        expect(record.cwd).toBe(CWD);
        expect(record.branch).toBe('main');
        expect(record.version).toBe('0.153.4');
        expect(record.entrypoint).toBe('codex_exec');
        expect(record.started).toBe('2026-09-07T17:56:35.426Z');
    });

    it('takes the model and the mode from the turn context', () => {
        const roll = new Rollout();
        roll.write([
            meta('2026-09-07T17:56:35.426Z'),
            line('2026-09-07T17:56:36.942Z', 'turn_context', {
                cwd: CWD,
                model: 'gpt-6-astra',
                collaboration_mode: { mode: 'default', settings: { reasoning_effort: 'xhigh' } }
            })
        ]);
        const record = roll.read();
        expect(record.model).toBe('gpt-6-astra');
        expect(record.permissionMode).toBe('default');
        expect(record.effort).toBe('xhigh');
    });

    it('counts a prompt and takes the fallback title from the first one', () => {
        const roll = new Rollout();
        roll.write([
            meta('2026-09-07T17:56:35.426Z'),
            item('2026-09-07T17:56:36.963Z', {
                type: 'UserMessage',
                id: 'u1',
                content: [{ type: 'text', text: 'x'.repeat(90) }]
            }),
            item('2026-09-07T17:56:40.000Z', {
                type: 'AgentMessage',
                id: 'm1',
                content: [{ type: 'Text', text: 'on it' }]
            })
        ]);
        const record = roll.read();
        expect(record.prompts).toBe(1);
        expect(record.messages).toBe(2);
        expect(record.title).toBe('x'.repeat(60));
        expect(record.lastPrompt).toBe('x'.repeat(90));
        expect(record.timeline.map((event) => event.kind)).toEqual(['prompt']);
        expect(record.timeline[0].text.length).toBe(90);
    });

    it('turns task_started and task_complete into one turn, and closes an aborted one', () => {
        const roll = new Rollout();
        roll.write([
            meta('2026-09-07T17:56:35.426Z'),
            line('2026-09-07T17:56:35.427Z', 'event_msg', {
                type: 'task_started',
                model_context_window: 258400
            }),
            line('2026-09-07T18:13:43.309Z', 'event_msg', {
                type: 'task_complete',
                duration_ms: 1027882
            })
        ]);
        const done = roll.read();
        expect(done.contextWindow).toBe(258400);
        expect(done.timeline).toEqual([
            { ts: '2026-09-07T18:13:43.309Z', kind: 'turn', text: '1027882' }
        ]);
        expect(done.state).toBe('idle');

        roll.write([
            meta('2026-09-07T17:56:35.426Z'),
            line('2026-09-07T17:56:35.427Z', 'event_msg', { type: 'task_started' }),
            line('2026-09-07T17:57:00.000Z', 'event_msg', {
                type: 'turn_aborted',
                reason: 'interrupted'
            })
        ]);
        const aborted = roll.read();
        expect(aborted.state).toBe('idle');
        expect(aborted.timeline).toEqual([]);
    });

    it('assigns the lifetime sums and reads the occupancy off the last turn', () => {
        const roll = new Rollout();
        const counts = (total: Json, last: Json): Json =>
            line('2026-09-07T17:56:46.716Z', 'event_msg', {
                type: 'token_count',
                info: {
                    total_token_usage: total,
                    last_token_usage: last,
                    model_context_window: 258400
                }
            });
        roll.write([
            meta('2026-09-07T17:56:35.426Z'),
            counts(
                {
                    input_tokens: 100,
                    cached_input_tokens: 10,
                    cache_write_input_tokens: 5,
                    output_tokens: 20,
                    reasoning_output_tokens: 7
                },
                { input_tokens: 100, cached_input_tokens: 10 }
            ),
            // The sums are cumulative, so the later record replaces the earlier one.
            counts(
                {
                    input_tokens: 17911,
                    cached_input_tokens: 900,
                    cache_write_input_tokens: 40,
                    output_tokens: 251,
                    reasoning_output_tokens: 30
                },
                { input_tokens: 2000, cached_input_tokens: 120 }
            )
        ]);
        const record = roll.read();
        expect(record.tokens).toEqual({
            input: 17911,
            output: 251,
            cacheRead: 900,
            cacheCreation: 40,
            thinking: 30
        });
        expect(record.contextTokens).toBe(2120);
        expect(record.contextWindow).toBe(258400);
    });

    it('reads the occupancy and the window off a count that carries no totals', () => {
        const roll = new Rollout();
        roll.write([
            meta('2026-09-07T17:56:35.426Z'),
            line('2026-09-07T17:56:46.716Z', 'event_msg', {
                type: 'token_count',
                info: { total_token_usage: { input_tokens: 100, output_tokens: 5 } }
            }),
            line('2026-09-07T17:56:47.716Z', 'event_msg', {
                type: 'token_count',
                info: {
                    last_token_usage: { input_tokens: 100, cached_input_tokens: 25 },
                    model_context_window: 258400
                }
            })
        ]);
        const record = roll.read();
        expect(record.tokens.input).toBe(100);
        expect(record.tokens.output).toBe(5);
        expect(record.contextTokens).toBe(125);
        expect(record.contextWindow).toBe(258400);
    });

    it('assigns decreased and partial cumulative totals exactly', () => {
        const roll = new Rollout();
        const counts = (total: Json): Json =>
            line('2026-09-07T17:56:46.716Z', 'event_msg', {
                type: 'token_count',
                info: { total_token_usage: total }
            });
        const hundred = {
            input_tokens: 100,
            output_tokens: 100,
            cached_input_tokens: 100,
            cache_write_input_tokens: 100,
            reasoning_output_tokens: 100
        };
        roll.write([
            meta('2026-09-07T17:56:35.426Z'),
            counts(hundred),
            counts({
                input_tokens: 10,
                output_tokens: 10,
                cached_input_tokens: 10,
                cache_write_input_tokens: 10,
                reasoning_output_tokens: 10
            })
        ]);
        expect(roll.read().tokens).toEqual({
            input: 10,
            output: 10,
            cacheRead: 10,
            cacheCreation: 10,
            thinking: 10
        });

        roll.write([
            meta('2026-09-07T17:56:35.426Z'),
            counts(hundred),
            counts({ output_tokens: 4 })
        ]);
        expect(roll.read().tokens).toEqual({
            input: 0,
            output: 4,
            cacheRead: 0,
            cacheCreation: 0,
            thinking: 0
        });
    });

    it('counts every path a FileChange touched', () => {
        const roll = new Rollout();
        const first = `${CWD}/code/run.py`;
        const second = `${CWD}/README.md`;
        roll.write([
            meta('2026-09-07T17:56:35.426Z'),
            item('2026-09-07T18:00:00.000Z', {
                type: 'FileChange',
                id: 'exec-1',
                status: 'completed',
                changes: {
                    [first]: { type: 'update', unified_diff: '@@' },
                    [second]: { type: 'add', unified_diff: '@@' }
                }
            })
        ]);
        const record = roll.read();
        expect(record.files.map((file) => file.path).sort()).toEqual([second, first].sort());
        expect(record.files[0].tool).toBe('FileChange');
        expect(record.timeline.map((event) => event.kind)).toEqual(['edit', 'edit']);
    });

    it('counts a command, an mcp call, an extension and an image view as tools', () => {
        const roll = new Rollout();
        roll.write([
            meta('2026-09-07T17:56:35.426Z'),
            item('2026-09-07T18:00:00.000Z', { type: 'CommandExecution', id: 'c1', command: 'ls' }),
            item('2026-09-07T18:00:01.000Z', { type: 'CommandExecution', id: 'c2', command: 'ls' }),
            item('2026-09-07T18:00:02.000Z', {
                type: 'McpToolCall',
                id: 'm1',
                server: 's',
                tool: 'js'
            }),
            item('2026-09-07T18:00:03.000Z', { type: 'Extension', id: 'e1', kind: 'web.search' }),
            item('2026-09-07T18:00:04.000Z', { type: 'ImageView', id: 'i1', path: '/tmp/a.png' }),
            // Reasoning is the model thinking aloud and is counted nowhere.
            item('2026-09-07T18:00:05.000Z', { type: 'Reasoning', id: 'r1', summary_text: 'hm' })
        ]);
        const record = roll.read();
        expect(record.tools).toEqual({
            CommandExecution: 2,
            McpToolCall: 1,
            Extension: 1,
            ImageView: 1
        });
        expect(record.timeline.map((event) => event.text)).toEqual([
            'CommandExecution',
            'CommandExecution',
            'McpToolCall',
            'Extension',
            'ImageView'
        ]);
    });

    it('counts a custom tool call and a function call by name', () => {
        const roll = new Rollout();
        roll.write([
            meta('2026-09-07T17:56:35.426Z'),
            line('2026-09-07T18:00:00.000Z', 'response_item', {
                type: 'custom_tool_call',
                name: 'exec',
                input: 'ls'
            }),
            line('2026-09-07T18:00:01.000Z', 'response_item', {
                type: 'function_call',
                name: 'spawn_agent',
                arguments: '{}'
            }),
            line('2026-09-07T18:00:02.000Z', 'response_item', { type: 'reasoning', id: 'r1' })
        ]);
        expect(roll.read().tools).toEqual({ exec: 1, spawn_agent: 1 });
    });

    it('opens an agent from a subagent activity and closes it when it completes', () => {
        const roll = new Rollout();
        roll.write([
            meta('2026-09-07T17:56:35.426Z'),
            item('2026-09-07T18:00:00.000Z', {
                type: 'SubAgentActivity',
                id: 'call_1',
                kind: 'started',
                agent_thread_id: 'thread-1',
                agent_path: '/root/loewner_bibliography'
            }),
            // The root's own activity is the session itself, not a subagent.
            item('2026-09-07T18:00:01.000Z', {
                type: 'SubAgentActivity',
                id: 'call_2',
                kind: 'interacted',
                agent_path: '/root'
            }),
            item('2026-09-07T18:00:02.000Z', {
                type: 'SubAgentActivity',
                id: 'call_3',
                kind: 'completed',
                agent_path: '/root/loewner_bibliography'
            })
        ]);
        const record = roll.read();
        expect(record.agents.length).toBe(1);
        expect(record.agents[0].id).toBe('/root/loewner_bibliography');
        expect(record.agents[0].subagentType).toBe('loewner_bibliography');
        expect(record.agents[0].status).toBe('done');
        expect(record.agents[0].ended).toBe('2026-09-07T18:00:02.000Z');
    });

    it('opens an agent from an inter-agent message', () => {
        const roll = new Rollout();
        roll.write([
            meta('2026-09-07T17:56:35.426Z'),
            line('2026-09-07T18:00:00.000Z', 'response_item', {
                type: 'agent_message',
                author: '/root',
                recipient: '/root/llm_novelty',
                content: []
            }),
            line('2026-09-07T18:00:01.000Z', 'response_item', {
                type: 'agent_message',
                author: '/root/llm_novelty',
                recipient: '/root',
                content: []
            })
        ]);
        const record = roll.read();
        expect(record.agents.map((agent) => agent.id)).toEqual(['/root/llm_novelty']);
        expect(record.agents[0].status).toBe('running');
    });

    it('puts a context compaction on the timeline', () => {
        const roll = new Rollout();
        roll.write([
            meta('2026-09-07T17:56:35.426Z'),
            item('2026-09-07T18:00:00.000Z', { type: 'ContextCompaction', id: 'k1' }),
            // A compacted record repeats the history that was replaced and is not folded.
            line('2026-09-07T18:00:01.000Z', 'compacted', { message: '', replacement_history: [] })
        ]);
        const record = roll.read();
        expect(record.timeline).toEqual([
            { ts: '2026-09-07T18:00:00.000Z', kind: 'compaction', text: '' }
        ]);
        expect(record.messages).toBe(0);
    });

    it('reads the state off the open turn', () => {
        const roll = new Rollout();
        roll.write([line('2026-09-07T17:56:35.000Z', 'world_state', { full: true })]);
        expect(roll.read().state).toBe('unknown');

        roll.write([
            meta('2026-09-07T17:56:35.426Z'),
            line('2026-09-07T17:56:35.427Z', 'event_msg', { type: 'task_started' })
        ]);
        expect(roll.read().state).toBe('working');

        roll.write([
            meta('2026-09-07T17:56:35.426Z'),
            line('2026-09-07T17:56:35.427Z', 'event_msg', { type: 'task_started' }),
            line('2026-09-07T17:57:00.000Z', 'event_msg', {
                type: 'task_complete',
                duration_ms: 10
            })
        ]);
        expect(roll.read().state).toBe('idle');
    });

    it('reads the id off the filename when the meta is not there yet', () => {
        expect(rolloutId(`/store/2026/09/07/${NAME}`)).toBe(UUID);
    });
});

describe('liveness', () => {
    it('sees the CLI and ignores the desktop app', () => {
        expect(codexRunning(probe('codex'))).toBe(true);
        expect(codexRunning(probe('/opt/homebrew/Caskroom/codex/0.153.4/bin/codex'))).toBe(true);
        expect(
            codexRunning(
                probe(
                    '/Applications/ChatGPT.app/Contents/Frameworks/Codex Framework.framework/Helpers/Codex (Renderer).app/Contents/MacOS/Codex (Renderer)',
                    '/opt/homebrew/Caskroom/codex/0.153.4/bin/codex-code-mode-host',
                    '/Applications/ChatGPT.app/Contents/Resources/codex'
                )
            )
        ).toBe(false);
    });

    it('is live only while a process is up and the rollout is fresh', () => {
        const now = Date.now();
        expect(codexLive('working', now / 1000, true, now)?.status).toBe('busy');
        expect(codexLive('idle', now / 1000, true, now)?.status).toBe('idle');
        expect(codexLive('idle', now / 1000 - CODEX_FRESH_SECONDS - 1, true, now)).toBeUndefined();
        expect(codexLive('idle', now / 1000, false, now)).toBeUndefined();
    });

    it('marks a fresh rollout live and a stale one ended', () => {
        const roll = new Rollout();
        roll.write([
            meta('2026-09-07T17:56:35.426Z'),
            line('2026-09-07T17:56:35.427Z', 'event_msg', { type: 'task_started' })
        ]);
        const live = roll.scan(probe('codex'));
        expect(live.length).toBe(1);
        expect(live[0].live).toBe(true);
        expect(live[0].liveStatus).toBe('busy');
        expect(live[0].state).toBe('working');
        expect(live[0].pid).toBeNull();

        roll.age(CODEX_FRESH_SECONDS + 60);
        const stale = roll.scan(probe('codex'));
        expect(stale[0].live).toBe(false);
        expect(stale[0].state).toBe('ended');

        roll.age(1);
        const gone = roll.scan(probe('Codex (Renderer)'));
        expect(gone[0].live).toBe(false);
        expect(gone[0].state).toBe('ended');
    });
});

describe('the two stores', () => {
    it('merge into one list, newest first, each record naming its tool', () => {
        const roll = new Rollout();
        mkdirSync(join(roll.claudeStore, '-synthetic-space-hub'), { recursive: true });
        const transcript = join(roll.claudeStore, '-synthetic-space-hub', 'aaaa-bbbb.jsonl');
        writeFileSync(
            transcript,
            JSON.stringify({
                type: 'user',
                timestamp: '2026-09-07T10:00:00.000Z',
                origin: { kind: 'human' },
                message: { role: 'user', content: 'claude side' },
                cwd: CWD
            }) + '\n'
        );
        roll.write([
            meta('2026-09-07T17:56:35.426Z'),
            item('2026-09-07T17:56:36.000Z', {
                type: 'UserMessage',
                id: 'u1',
                content: [{ type: 'text', text: 'codex side' }]
            })
        ]);
        const older = Date.now() / 1000 - 3600;
        utimesSync(transcript, older, older);

        const found = roll.scan(probe('nothing'));
        expect(found.map((record) => record.tool)).toEqual(['codex', 'claude']);
        expect(found.map((record) => record.title)).toEqual(['codex side', 'claude side']);
        expect(found.every((record) => record.state === 'ended')).toBe(true);
    });
});
