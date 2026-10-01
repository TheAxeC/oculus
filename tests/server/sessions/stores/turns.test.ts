// The turns of one session: what a Claude transcript and a Codex rollout become when the transcript
// view asks for the conversation itself.
//
// Every file here is synthetic and written under mkdtemp; no test reads ~/.claude or ~/.codex, and
// nothing is written anywhere else. Real transcripts hold private research content and never enter
// a test.

import { appendFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { TURN_CHARS, readTurns } from '../../../../src/lib/server/sessions/stores/turns.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';

type Json = Record<string, unknown>;

const CONTEXT = { cwd: '/tmp/fixture/workspace', gitBranch: 'main' };
const UUID = '01a07d03-c92a-7a91-8667-7f0520b8197f';

function human(stamp: string, said: string): Json {
    return {
        type: 'user',
        timestamp: stamp,
        origin: { kind: 'human' },
        message: { role: 'user', content: said },
        ...CONTEXT
    };
}

function assistant(
    stamp: string,
    options: Partial<{ text: string; thinking: string; tools: [string, string, Json][] }> = {}
): Json {
    const content: Json[] = [];
    if (options.thinking !== undefined) {
        content.push({ type: 'thinking', thinking: options.thinking });
    }
    if (options.text !== undefined) content.push({ type: 'text', text: options.text });
    for (const [id, name, args] of options.tools ?? []) {
        content.push({ type: 'tool_use', id, name, input: args });
    }
    return {
        type: 'assistant',
        timestamp: stamp,
        message: { role: 'assistant', model: 'claude-test', content },
        ...CONTEXT
    };
}

function outcome(stamp: string, id: string, error = false): Json {
    return {
        type: 'user',
        timestamp: stamp,
        message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: id, content: 'done', is_error: error }]
        },
        ...CONTEXT
    };
}

function line(timestamp: string, type: string, payload: Json): Json {
    return { timestamp, type, payload };
}

function meta(timestamp: string): Json {
    return line(timestamp, 'session_meta', { id: UUID, cwd: '/synthetic/space/hub' });
}

function item(timestamp: string, body: Json): Json {
    return line(timestamp, 'event_msg', { type: 'item_completed', item: body });
}

/**
 * One temporary directory, checked to be under the system temporary root before anything is
 * written.
 */
function store(): string {
    const root = scratchDir('oculus-turns-');
    return root;
}

function write(root: string, name: string, records: Json[]): string {
    const path = join(root, name);
    writeFileSync(path, records.map((record) => JSON.stringify(record) + '\n').join(''));
    return path;
}

function append(path: string, records: Json[]): void {
    appendFileSync(path, records.map((record) => JSON.stringify(record) + '\n').join(''));
}

describe('the turns of a Claude transcript', () => {
    it('draws the prompt, the answer and the call in order, with the result on the call', () => {
        const path = write(store(), 'one.jsonl', [
            human('2026-09-11T08:00:00.000Z', 'do the thing'),
            assistant('2026-09-11T08:00:05.000Z', {
                text: 'Doing it.',
                tools: [['t1', 'Edit', { file_path: '/tmp/fixture/workspace/main.tex' }]]
            }),
            outcome('2026-09-11T08:00:06.000Z', 't1')
        ]);
        const answer = readTurns(path, 'claude', 0);
        expect(answer.turns.map((turn) => turn.role)).toEqual(['user', 'assistant', 'tool']);
        expect(answer.turns[0].text).toBe('do the thing');
        expect(answer.turns[0].at).toBe('2026-09-11T08:00:00.000Z');
        expect(answer.turns[2].tool).toEqual({
            id: 't1',
            name: 'Edit',
            summary: '/tmp/fixture/workspace/main.tex',
            ok: true
        });
        expect(answer.results).toEqual({});
        expect(answer.offset).toBeGreaterThan(0);
    });

    it('renders the answer as markdown and leaves the prompt as it was typed', () => {
        const path = write(store(), 'two.jsonl', [
            human('2026-09-11T08:00:00.000Z', '# not a heading'),
            assistant('2026-09-11T08:00:05.000Z', { text: '# A heading\n\nand a line.' })
        ]);
        const answer = readTurns(path, 'claude', 0);
        expect(answer.turns[0].html).toBe('');
        expect(answer.turns[1].html).toContain('<h1>A heading</h1>');
        expect(answer.turns[1].html).toContain('<p>and a line.</p>');
    });

    it('paints the fenced code of an answer and leaves a prompt with code in it as typed', () => {
        const path = write(store(), 'code.jsonl', [
            human('2026-09-11T08:00:00.000Z', '```ts\nconst a = 1;\n```'),
            assistant('2026-09-11T08:00:05.000Z', { text: '```ts\nconst b = 2;\n```' })
        ]);
        const answer = readTurns(path, 'claude', 0);
        expect(answer.turns[0].html).toBe('');
        expect(answer.turns[1].html).toContain('<span class="hljs-keyword">const</span>');
    });

    it('drops a thinking block and keeps the text beside it', () => {
        const path = write(store(), 'three.jsonl', [
            assistant('2026-09-11T08:00:05.000Z', {
                thinking: 'the private reasoning',
                text: 'the answer'
            })
        ]);
        const answer = readTurns(path, 'claude', 0);
        expect(answer.turns).toHaveLength(1);
        expect(answer.turns[0].text).toBe('the answer');
        expect(answer.turns[0].html).not.toContain('private reasoning');
    });

    it('yields no turn for a record that is only tool results', () => {
        const path = write(store(), 'four.jsonl', [outcome('2026-09-11T08:00:06.000Z', 't9')]);
        expect(readTurns(path, 'claude', 0).turns).toEqual([]);
    });

    it('reads only what was appended, and reports a result whose call was read before', () => {
        const path = write(store(), 'five.jsonl', [
            human('2026-09-11T08:00:00.000Z', 'do the thing'),
            assistant('2026-09-11T08:00:05.000Z', {
                tools: [['t1', 'Bash', { command: 'ls -l', description: 'list' }]]
            })
        ]);
        const first = readTurns(path, 'claude', 0);
        expect(first.turns).toHaveLength(2);
        expect(first.turns[1].tool?.summary).toBe('ls -l');
        expect(first.turns[1].tool?.ok).toBeNull();

        append(path, [
            outcome('2026-09-11T08:00:06.000Z', 't1', true),
            human('2026-09-11T08:00:07.000Z', 'again')
        ]);
        const tail = readTurns(path, 'claude', first.offset);
        expect(tail.turns.map((turn) => turn.text)).toEqual(['again']);
        expect(tail.results).toEqual({ t1: false });
        expect(tail.offset).toBeGreaterThan(first.offset);
    });

    it('cuts a turn over the cap and says so', () => {
        const said = 'x'.repeat(TURN_CHARS + 500);
        const path = write(store(), 'six.jsonl', [human('2026-09-11T08:00:00.000Z', said)]);
        const answer = readTurns(path, 'claude', 0);
        expect(answer.turns[0].cut).toBe(true);
        expect(answer.turns[0].text).toHaveLength(TURN_CHARS);
    });

    it('answers with nothing for a file that is not there', () => {
        const answer = readTurns(join(store(), 'no-such-file.jsonl'), 'claude', 0);
        expect(answer).toEqual({ turns: [], offset: 0, results: {} });
    });
});

describe('the turns of a Codex rollout', () => {
    it('draws the two message items as turns and every other item as a tool', () => {
        const path = write(store(), `rollout-2026-09-11T08-00-00-${UUID}.jsonl`, [
            meta('2026-09-11T08:00:00.000Z'),
            item('2026-09-11T08:00:01.000Z', {
                type: 'UserMessage',
                content: [{ type: 'text', text: 'do the thing' }]
            }),
            item('2026-09-11T08:00:02.000Z', { type: 'Reasoning', content: [] }),
            item('2026-09-11T08:00:03.000Z', {
                type: 'AgentMessage',
                content: [{ type: 'text', text: 'Doing **it**.' }]
            }),
            item('2026-09-11T08:00:04.000Z', {
                type: 'CommandExecution',
                command: 'ls -l',
                exit_code: 0
            }),
            item('2026-09-11T08:00:05.000Z', {
                type: 'FileChange',
                changes: { '/synthetic/space/hub/main.tex': 'a diff' }
            })
        ]);
        const answer = readTurns(path, 'codex', 0);
        expect(answer.turns.map((turn) => turn.role)).toEqual([
            'user',
            'assistant',
            'tool',
            'tool'
        ]);
        expect(answer.turns[1].html).toContain('<strong>it</strong>');
        expect(answer.turns[2].tool).toEqual({
            id: '',
            name: 'CommandExecution',
            summary: 'ls -l',
            ok: true
        });
        expect(answer.turns[3].tool?.name).toBe('FileChange');
        expect(answer.turns[3].tool?.summary).toBe('/synthetic/space/hub/main.tex');
        expect(answer.turns[3].tool?.ok).toBeNull();
    });

    it('takes a command that is a list as the summary even when it joins to nothing', () => {
        const commands: unknown[] = [[''], ['', 3], [], ['', ''], [3], '', ['ls', 3]];
        const path = write(
            store(),
            `rollout-2026-09-11T08-00-00-${UUID}.jsonl`,
            commands.map((command, index) =>
                item(`2026-09-11T08:00:0${index}.000Z`, {
                    type: 'CommandExecution',
                    command,
                    path: 'src/a.ts',
                    exit_code: 0
                })
            )
        );
        const summaries = readTurns(path, 'codex', 0).turns.map((turn) => turn.tool?.summary);
        expect(summaries).toStrictEqual(['', '', 'src/a.ts', '', 'src/a.ts', 'src/a.ts', 'ls']);
    });
});

describe('the turns of records that hold values of the wrong type', () => {
    const at = (second: number): string =>
        `2026-01-01T10:00:${String(second).padStart(2, '0')}.000Z`;
    const use = (id: unknown, name: unknown, input?: unknown): Json => ({
        type: 'tool_use',
        id,
        name,
        input
    });
    const result = (id: unknown, error?: unknown): Json => ({
        type: 'tool_result',
        tool_use_id: id,
        is_error: error
    });
    const said = (type: string, second: number, content: unknown, extra: Json = {}): Json => ({
        type,
        timestamp: at(second),
        message: { content },
        ...extra
    });
    const human = { origin: { kind: 'human' } };

    const CLAUDE: unknown[] = [
        [],
        said(
            'user',
            0,
            [
                { type: 'text', text: 'a' },
                { type: 'Text', text: 'b' },
                { text: 'c' },
                { type: 'text', text: 5 },
                'z'
            ],
            human
        ),
        said('user', 1, '', human),
        said('user', 2, 5, human),
        said('user', 3, 'not human', { origin: 'human' }),
        said('assistant', 4, [
            { type: 'text', text: 'said' },
            use('t1', 'Bash', { file_path: 3, command: 'ls\n  -l' }),
            use(5, 7, []),
            use('t3', 'Edit', { pattern: 'p', description: 'd' }),
            use('t4', 'Read', 'x'),
            use('t5', undefined),
            4,
            null
        ]),
        said(
            'user',
            5,
            [result(7), result('t1', 'yes'), result('t3', true), result('', false)],
            human
        )
    ];
    const CODEX: Json[] = [
        { type: 'turn_context', payload: {} },
        { type: 'event_msg', payload: 'x' },
        { type: 'event_msg', payload: { type: 'item_completed', item: 'x' } },
        item(at(0), { type: 'UserMessage', content: [], text: 'fallback' }),
        item(at(1), { type: 'AgentMessage', content: [{ text: 5 }], text: 7 }),
        item(at(2), { type: 'CommandExecution', command: ['ls', '-l', 5], exit_code: 0 }),
        item(at(3), { type: 'CommandExecution', command: '  ', exit_code: '0' }),
        item(at(4), { type: 'FileChange', changes: { '': 'd', '/w/a.ts': 'd' }, exit_code: 1 }),
        item(at(5), { type: 'McpToolCall', changes: [], name: 'tool', exit_code: null }),
        item(at(6), { type: 'Extension', path: 3, description: 'd' }),
        item(at(7), { type: 'Reasoning' }),
        item(at(8), { type: '' }),
        item(at(9), { type: 7 })
    ];
    const CLAUDE_TURNS = {
        turns: [
            {
                at: '2026-01-01T10:00:00.000Z',
                role: 'user',
                text: 'ab',
                html: '',
                cut: false,
                tool: null
            },
            {
                at: '2026-01-01T10:00:04.000Z',
                role: 'assistant',
                text: 'said',
                html: '<p>said</p>\n',
                cut: false,
                tool: null
            },
            {
                at: '2026-01-01T10:00:04.000Z',
                role: 'tool',
                text: '',
                html: '',
                cut: false,
                tool: { id: 't1', name: 'Bash', summary: 'ls -l', ok: true }
            },
            {
                at: '2026-01-01T10:00:04.000Z',
                role: 'tool',
                text: '',
                html: '',
                cut: false,
                tool: { id: '', name: '', summary: '', ok: null }
            },
            {
                at: '2026-01-01T10:00:04.000Z',
                role: 'tool',
                text: '',
                html: '',
                cut: false,
                tool: { id: 't3', name: 'Edit', summary: 'p', ok: false }
            },
            {
                at: '2026-01-01T10:00:04.000Z',
                role: 'tool',
                text: '',
                html: '',
                cut: false,
                tool: { id: 't4', name: 'Read', summary: '', ok: null }
            },
            {
                at: '2026-01-01T10:00:04.000Z',
                role: 'tool',
                text: '',
                html: '',
                cut: false,
                tool: { id: 't5', name: '', summary: '', ok: null }
            }
        ],
        offset: 1268,
        results: {}
    };
    const CODEX_TURNS = {
        turns: [
            {
                at: '2026-01-01T10:00:00.000Z',
                role: 'user',
                text: 'fallback',
                html: '',
                cut: false,
                tool: null
            },
            {
                at: '2026-01-01T10:00:02.000Z',
                role: 'tool',
                text: '',
                html: '',
                cut: false,
                tool: { id: '', name: 'CommandExecution', summary: 'ls -l', ok: true }
            },
            {
                at: '2026-01-01T10:00:03.000Z',
                role: 'tool',
                text: '',
                html: '',
                cut: false,
                tool: { id: '', name: 'CommandExecution', summary: '', ok: null }
            },
            {
                at: '2026-01-01T10:00:04.000Z',
                role: 'tool',
                text: '',
                html: '',
                cut: false,
                tool: { id: '', name: 'FileChange', summary: '/w/a.ts', ok: false }
            },
            {
                at: '2026-01-01T10:00:05.000Z',
                role: 'tool',
                text: '',
                html: '',
                cut: false,
                tool: { id: '', name: 'McpToolCall', summary: 'tool', ok: null }
            },
            {
                at: '2026-01-01T10:00:06.000Z',
                role: 'tool',
                text: '',
                html: '',
                cut: false,
                tool: { id: '', name: 'Extension', summary: 'd', ok: null }
            }
        ],
        offset: 1633,
        results: {}
    };

    it('reads a Claude turn from the fields of the right type', () => {
        const path = write(store(), 'wrong.jsonl', CLAUDE as Json[]);
        expect(readTurns(path, 'claude', 0)).toStrictEqual(CLAUDE_TURNS);
    });

    it('reads a Codex turn from the fields of the right type', () => {
        const path = write(store(), 'rollout-wrong.jsonl', CODEX);
        expect(readTurns(path, 'codex', 0)).toStrictEqual(CODEX_TURNS);
    });
});
