// Transcript folding, the live-registry merge, dismissals and the incremental read cache.
//
// Every fixture here is synthetic, the session registry included, and transcript-fixture.ts builds
// them: no test reads ~/.claude or ~/.codex, no test writes anywhere but the temporary directory it
// made, and the liveness check is answered by a stub, so nothing is ever signalled and `ps` is
// never run. Real transcripts hold private research content and never enter a test.

import {
    appendFileSync,
    mkdirSync,
    readFileSync,
    statSync,
    utimesSync,
    writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { readSession } from '../../../../src/lib/server/sessions/stores/transcripts.ts';
import {
    formatStamp,
    liveFrom,
    registryCandidates,
    type Probe
} from '../../../../src/lib/server/sessions/registry.ts';
import { hiddenIds, setHidden } from '../../../../src/lib/server/sessions/overrides.ts';
import { CACHE_VERSION, loadCache } from '../../../../src/lib/server/sessions/cache.ts';
import { spentTokens } from '../../../../src/lib/server/sessions/fold.ts';
import type { LiveEntry } from '../../../../src/lib/data/model/index.ts';
import { it } from '../../../fixtures/scratch.ts';
import {
    CONTEXT,
    PID,
    SID,
    SLUG,
    assistant,
    human,
    make,
    outcome,
    turn,
    usage,
    type Fixture,
    type Json
} from './transcript-fixture.ts';

/** The registry's live sessions alone: signal 0 per entry, then one `ps` for the ones that ran. */
function liveSessions(registries: string[], probe: Probe): Map<string, LiveEntry> {
    const candidates = registryCandidates(registries, probe);
    return liveFrom(candidates, probe.starts(candidates.map((entry) => entry.pid)));
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

    const LITWATCH =
        '<command-message>research-cockpit</command-message>\n<command-name>/research-cockpit</command-name>\n<command-args>litwatch</command-args>';

    /** The title of a session whose one record is a human prompt of this text. */
    function titled(prompt: string): string {
        const f = make();
        f.write([human('2026-01-01T10:00:00.000Z', prompt)]);
        return f.only().title;
    }

    it('titles a session opened by a slash command with the command and its arguments', () => {
        expect(titled(LITWATCH)).toBe('/research-cockpit litwatch');
        expect(
            titled(
                '<command-message>spec</command-message>\n<command-name>/spec</command-name>\n<command-args>38.2 20b</command-args>'
            )
        ).toBe('/spec 38.2 20b');
    });

    it('titles a slash command that carries no arguments with the command alone', () => {
        expect(
            titled(
                '<command-message>research-cockpit</command-message>\n<command-name>/research-cockpit</command-name>'
            )
        ).toBe('/research-cockpit');
        expect(
            titled(
                '<command-name>/model</command-name>\n            <command-message>model</command-message>\n            <command-args></command-args>'
            )
        ).toBe('/model');
    });

    it('makes the arguments one line and cuts the title where an opening is cut', () => {
        const title = titled(
            '<command-message>plan-orchestration</command-message>\n<command-name>/plan-orchestration</command-name>\n<command-args>38.4 inline\n\nPlease properly read the skills. Some additional notes, only commit on important events</command-args>'
        );
        expect(title).toBe('/plan-orchestration 38.4 inline Please properly read the ski');
        expect(title).toHaveLength(60);
    });

    it("keeps the model's title over a slash command's", () => {
        const f = make();
        f.write([
            human('2026-01-01T10:00:00.000Z', LITWATCH),
            { type: 'ai-title', aiTitle: 'Named by the model' }
        ]);
        expect(f.only().title).toBe('Named by the model');
    });

    it('titles a prompt that quotes the markup mid-sentence by its opening', () => {
        expect(
            titled(
                'Why does <command-name>/x</command-name> show up in the list of sessions I have open today?'
            )
        ).toBe('Why does <command-name>/x</command-name> show up in the list');
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

    it('hides nothing from a corrupt overrides file', () => {
        const f = make();
        writeFileSync(f.overrides, '{not json');
        f.write([human('2026-01-01T10:00:00.000Z', 'go')]);
        expect(f.only().hidden).toBe(false);
        expect(hiddenIds(f.overrides).size).toBe(0);
    });
});

/** A timestamp of the transcript below, `second` seconds past ten. */
function at(second: number): string {
    return `2026-01-01T10:00:${String(second).padStart(2, '0')}.000Z`;
}

/** A message record whose content is the given value, of whatever type. */
function said(type: string, second: number, content: unknown, extra: Json = {}, inner: Json = {}) {
    return { type, timestamp: at(second), message: { content, ...inner }, ...extra };
}

function use(id: unknown, name: unknown, input?: unknown): Json {
    return { type: 'tool_use', id, name, input };
}

function result(id: unknown, content: unknown, error?: unknown): Json {
    return { type: 'tool_result', tool_use_id: id, content, is_error: error };
}

/** Records of the kinds the fold reads whose fields hold values of the wrong type. */
const WRONG_TYPES: unknown[] = [
    [],
    null,
    's',
    { type: 'ai-title', aiTitle: 3 },
    { type: 'user', timestamp: at(0), origin: { kind: 'human' }, message: [], cwd: 5 },
    said('user', 1, 'first ask', { origin: { kind: 'human' }, cwd: '/w', version: 9 }),
    {
        type: 'assistant',
        timestamp: at(2),
        message: {
            model: 'claude-test',
            content: [],
            usage: {
                input_tokens: 2.7,
                output_tokens: '4',
                cache_creation: { ephemeral_5m_input_tokens: 3 }
            }
        }
    },
    said('assistant', 3, [use('t1', ''), use('t2', 'Agent', []), 7, null, use(5, 'Bash')]),
    said(
        'user',
        5,
        [result(7, 'x'), result('t2', [{ type: 'text', text: 'abc' }, { text: 5 }, 'z'], 'yes')],
        { toolUseResult: { totalTokens: 12 } }
    ),
    said('assistant', 7, [], { effort: 3 }, { effort: 'high' }),
    said('assistant', 8, [], { effort: '' }, { effort: 'high' }),
    said('assistant', 9, [
        use('t3', 'Edit', { file_path: 3, notebook_path: 'x' }),
        use('t4', 'NotebookEdit', { notebook_path: '/n.ipynb' })
    ]),
    { type: 'system', subtype: 'turn_duration', durationMs: '5', timestamp: at(10) },
    { type: 'system', subtype: 'turn_duration', durationMs: 7.9, timestamp: 5 },
    { type: 'attachment', timestamp: at(11), attachment: [] },
    {
        type: 'attachment',
        timestamp: at(12),
        attachment: { commandMode: 'task-notification', prompt: 5 }
    },
    { type: 'last-prompt', lastPrompt: '' }
];

/** What the fold makes of the transcript above. */
const FOLDED = {
    id: 'aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb',
    slug: '-tmp-fixture-workspace',
    tool: 'claude',
    cwd: '/w',
    branch: null,
    title: 'first ask',
    lastPrompt: '',
    model: 'claude-test',
    effort: null,
    permissionMode: null,
    version: null,
    entrypoint: null,
    started: '2026-01-01T10:00:00.000Z',
    lastActivity: '2026-01-01T10:00:09.000Z',
    state: 'idle',
    live: false,
    liveStatus: null,
    pid: null,
    registryName: null,
    hidden: false,
    prompts: 2,
    messages: 8,
    tokens: { input: 2, output: 0, cacheRead: 0, cacheCreation: 0, thinking: 0 },
    contextTokens: 2,
    lastCacheRead: 0,
    contextWindow: null,
    cache: { ttl: '5m', lastCreation: null, lastRead: null, busts: 0 },
    tools: { Agent: 1, Bash: 1, Edit: 1, NotebookEdit: 1 },
    files: [{ path: '/n.ipynb', tool: 'NotebookEdit', count: 1, last: '2026-01-01T10:00:09.000Z' }],
    agents: [
        {
            id: 't2',
            description: '',
            subagentType: '',
            model: null,
            started: '2026-01-01T10:00:03.000Z',
            ended: '2026-01-01T10:00:05.000Z',
            status: 'done',
            resultChars: 3,
            tokens: 12
        }
    ],
    timeline: [
        { ts: '2026-01-01T10:00:01.000Z', kind: 'prompt', text: 'first ask' },
        { ts: '2026-01-01T10:00:03.000Z', kind: 'tool', text: 'Agent' },
        { ts: '2026-01-01T10:00:03.000Z', kind: 'tool', text: 'Bash' },
        { ts: '2026-01-01T10:00:09.000Z', kind: 'edit', text: 'Edit' },
        { ts: '2026-01-01T10:00:09.000Z', kind: 'edit', text: '/n.ipynb' },
        { ts: '2026-01-01T10:00:10.000Z', kind: 'turn', text: '0' },
        { ts: null, kind: 'turn', text: '7' }
    ],
    truncated: false,
    hook: null
};

describe('a transcript whose records hold values of the wrong type', () => {
    it('folds a field of the wrong type as absent and a record of no known kind as nothing', () => {
        const f = make();
        const lines = ['this line is not json', ...WRONG_TYPES.map((one) => JSON.stringify(one))];
        writeFileSync(f.path, lines.join('\n') + '\n');
        expect(readSession(f.path)).toStrictEqual({ ...FOLDED, path: f.path });
    });
});

describe('the cache file of an older shape or a hand edit', () => {
    type Stored = { version: number; entries: Record<string, Record<string, unknown>> };

    /** A fixture that has been scanned once, so its cache holds the entry of its transcript. */
    function scanned(): { f: Fixture; stored: Stored; entry: Record<string, unknown> } {
        const f = make();
        f.write([human('2026-01-01T10:00:00.000Z', 'go'), turn('2026-01-01T10:00:01.000Z')]);
        f.only();
        const stored = JSON.parse(readFileSync(f.cache, 'utf8')) as Stored;
        return { f, stored, entry: stored.entries[f.path] };
    }

    /** What loadCache keeps of a cache file holding the given text. */
    function loaded(f: Fixture, text: string) {
        writeFileSync(f.cache, text);
        return loadCache(f.cache);
    }

    it('keeps nothing of a cache of another version or with an entries list', () => {
        const { f, stored } = scanned();
        for (const patch of [{ version: CACHE_VERSION + 1 }, { entries: [] }]) {
            expect(loaded(f, JSON.stringify({ ...stored, ...patch }))).toStrictEqual({});
        }
    });

    it('drops an entry whose acc is no map and keeps the other entry as it was written', () => {
        const { f, stored, entry } = scanned();
        const kept = { ...entry, extra: [1] };
        const entries = { [f.path]: kept, broken: { ...entry, acc: [] } };
        expect(loaded(f, JSON.stringify({ ...stored, entries }))).toStrictEqual({ [f.path]: kept });
    });

    it('takes an entry under the key __proto__ as the assignment kept[key] = value does', () => {
        const { f, entry } = scanned();
        const text = `{"version":${CACHE_VERSION},"entries":{"__proto__":${JSON.stringify(entry)}}}`;
        const found = loaded(f, text);
        expect(Object.keys(found)).toStrictEqual([]);
        expect(Object.getPrototypeOf(found)).toStrictEqual(entry);
    });

    it('drops an entry with a field of the wrong type, and the scan folds from zero', () => {
        const wrong = (entry: Record<string, unknown>): Record<string, unknown>[] => [
            { ...entry, offset: '5' },
            { ...entry, acc: { ...(entry.acc as object), aiTitle: 3 } }
        ];
        for (const index of [0, 1]) {
            const { f, stored, entry } = scanned();
            const clean = f.only();
            const text = JSON.stringify({ ...stored, entries: { [f.path]: wrong(entry)[index] } });
            expect(loaded(f, text)).toStrictEqual({});
            writeFileSync(f.cache, text);
            expect(f.only()).toEqual(clean);
        }
    });
});
