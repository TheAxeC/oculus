// Layer 1, data test. config/catalogs/agents.yml read by data/sources/config/agents.ts: the shipped
// file seeds the composer with no finding, every refusal names the line it is on and leaves the
// rest of the file read, and the argv words a start takes come from the parsed file and nothing
// else.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    cacheModels,
    choiceArgs,
    parseAgents,
    passable,
    withCacheModels
} from '../../../src/lib/data/sources/config/agents.ts';
import { engineDir } from '../../../src/lib/data/sources/config.ts';

/** The shipped catalog's text. */
function shipped(): string {
    return readFileSync(join(engineDir(), 'config', 'catalogs', 'agents.yml'), 'utf8');
}

/** One agent's catalog text with one picker, its lines numbered from 1 as the file's are. */
function one(agent: string, list: string[]): string {
    return ['agents:', `    ${agent}:`, '        label: Probe', '        lists:', ...list].join(
        '\n'
    );
}

/** A picker body under `lists:`, its values one per line. */
function picker(flag: string, fallback: string, values: string[]): string[] {
    return [
        '            probe:',
        '                label: Probe',
        `                flag: ${flag}`,
        `                default: ${fallback}`,
        '                values:',
        ...values.map((value) => `                    - ${value}`)
    ];
}

describe('the shipped agents catalog', () => {
    // revert: config/catalogs/agents.yml "- { id: opus, label: Opus, pass: opus }" => - { id: cli, label: 'CLI default', pass: -x }
    it('seeds the composer with both agents, their pickers and no finding', () => {
        const read = parseAgents(shipped());
        expect(read.findings).toEqual([]);
        expect(read.agents.map((agent) => agent.agent)).toEqual(['claude', 'codex']);
        const keys = read.agents.map((agent) => agent.lists.map((list) => list.key));
        expect(keys).toEqual([
            ['model', 'effort', 'mode'],
            ['model', 'effort', 'sandbox', 'approval']
        ]);
        const codexModel = read.agents[1].lists[0];
        expect(codexModel.cache).toBe('models_cache.json');
    });

    // revert: src/lib/data/sources/config/agents.ts "if (value.pass !== null) args.push(list.flag, value.pass);" => args.push(list.flag, value.pass ?? '');
    it('starts each agent with its defaults: the flags that pass something, and no others', () => {
        const [claude, codex] = parseAgents(shipped()).agents;
        expect(choiceArgs(claude, {})).toEqual(['--permission-mode', 'manual']);
        expect(choiceArgs(codex, {})).toEqual(['-s', 'workspace-write']);
        expect(choiceArgs(claude, { model: 'opus', effort: 'max', mode: 'plan' })).toEqual([
            '--model',
            'opus',
            '--effort',
            'max',
            '--permission-mode',
            'plan'
        ]);
        expect(choiceArgs(codex, { effort: 'high', approval: 'never' })).toEqual([
            '-c',
            'model_reasoning_effort="high"',
            '-s',
            'workspace-write',
            '-a',
            'never'
        ]);
    });

    // revert: src/lib/data/sources/config/agents.ts "if (value === undefined) throw new Error(`${list.key} has no choice ${id}`);" => if (value === undefined) continue;
    it('refuses a pick naming a value its picker does not hold, empty or made up', () => {
        const [claude] = parseAgents(shipped()).agents;
        expect(() => choiceArgs(claude, { model: 'gpt' })).toThrow('model has no choice gpt');
        expect(() => choiceArgs(claude, { model: '' })).toThrow('model has no choice');
        expect(() => choiceArgs(claude, { effort: '--dangerously-skip-permissions' })).toThrow(
            'effort has no choice'
        );
    });
});

describe('a refusal in the agents catalog', () => {
    // revert: src/lib/data/sources/config/agents.ts "if (!AGENT_FLAGS[agent].includes(flag)) {" => if (flag === '') {
    it('names a flag the agent does not take, on the flag line, and leaves the picker out', () => {
        const text = one(
            'claude',
            picker('--dangerously-skip-permissions', 'a', ['{ id: a, label: A }'])
        );
        const read = parseAgents(text);
        expect(read.findings).toEqual([
            { line: 7, why: 'flag', what: '--dangerously-skip-permissions' }
        ]);
        expect(read.agents[0].lists).toEqual([]);
    });

    // revert: src/lib/data/sources/config/agents.ts "if (closed !== undefined) return closed.includes(pass);" => if (closed !== undefined) return true;
    it('names a value outside the flag closed set on its own line, and keeps the rest', () => {
        const text = one(
            'claude',
            picker('--effort', 'low', [
                '{ id: low, label: Low, pass: low }',
                '{ id: u, label: U, pass: ultra }'
            ])
        );
        const read = parseAgents(text);
        expect(read.findings).toEqual([{ line: 11, why: 'value', what: 'ultra' }]);
        expect(read.agents[0].lists[0].values.map((value) => value.id)).toEqual(['low']);
    });

    // revert: src/lib/data/sources/config/agents.ts "return word !== '' && !word.startsWith('-') && !/[\\s\\u0000-\\u001f\\u007f]/.test(word);" => return word !== '';
    it('refuses a value that would read as an option, or holds whitespace or a control character', () => {
        const text = one(
            'claude',
            picker('--model', 'a', [
                '{ id: a, label: A, pass: opus }',
                '{ id: b, label: B, pass: --yolo }',
                "{ id: c, label: C, pass: 'two words' }",
                '{ id: d, label: D, pass: "tab\\there" }',
                "{ id: e, label: E, pass: '' }"
            ])
        );
        const read = parseAgents(text);
        expect(read.findings.map((finding) => [finding.line, finding.why])).toEqual([
            [11, 'value'],
            [12, 'value'],
            [13, 'value'],
            [14, 'value']
        ]);
        expect(read.agents[0].lists[0].values.map((value) => value.id)).toEqual(['a']);
        expect(passable('opus')).toBe(true);
        expect(passable('-x')).toBe(false);
        expect(passable('a\u0000b')).toBe(false);
    });

    // revert: src/lib/data/sources/config/agents.ts "return at > 0 && CONFIG_KEYS.includes(pass.slice(0, at)) && at < pass.length - 1;" => return at > 0;
    it('lets a Codex -c pair set only the reasoning effort, and only to a value', () => {
        const text = one(
            'codex',
            picker('-c', 'a', [
                '{ id: a, label: A, pass: "model_reasoning_effort=low" }',
                '{ id: b, label: B, pass: "sandbox_mode=danger-full-access" }',
                '{ id: c, label: C, pass: "model_reasoning_effort=" }'
            ])
        );
        const read = parseAgents(text);
        expect(read.findings.map((finding) => [finding.line, finding.what])).toEqual([
            [11, 'sandbox_mode=danger-full-access'],
            [12, 'model_reasoning_effort=']
        ]);
    });

    // revert: src/lib/data/sources/config/agents.ts "if (held.some((one) => one.id === id)) {" => if (held.some((one) => one.id === id && false)) {
    it('refuses a value id that is empty or repeated, keeping the first of a repeat', () => {
        const text = one(
            'claude',
            picker('--model', 'a', [
                '{ id: a, label: A, pass: opus }',
                '{ id: a, label: Again, pass: sonnet }',
                "{ id: '', label: Empty, pass: haiku }"
            ])
        );
        const read = parseAgents(text);
        expect(read.findings).toEqual([
            { line: 11, why: 'repeated', what: 'a' },
            { line: 12, why: 'shape', what: '' }
        ]);
        expect(read.agents[0].lists[0].values).toEqual([{ id: 'a', label: 'A', pass: 'opus' }]);
    });

    // revert: src/lib/data/sources/config/agents.ts "if (!values.some((one) => one.id === fallback)) {" => if (values.length === 0) {
    it('leaves a picker out whose default it does not offer, or that names none', () => {
        const missing = parseAgents(one('claude', picker('--model', 'z', ['{ id: a, label: A }'])));
        expect(missing.findings).toEqual([{ line: 8, why: 'default_missing', what: 'z' }]);
        expect(missing.agents[0].lists).toEqual([]);
        const text = one('claude', picker('--model', 'a', ['{ id: a, label: A }'])).replace(
            '                default: a\n',
            ''
        );
        // revert: src/lib/data/sources/config/agents.ts "if (fallback === null) {" => if (fallback === null && false) {
        expect(parseAgents(text).findings).toEqual([{ line: 5, why: 'no_default', what: 'probe' }]);
    });

    // revert: src/lib/data/sources/config/agents.ts "if (!AGENTS.includes(name as AgentId)) {" => if (name === '') {
    it('refuses an agent it does not know, the shell among them, and reads the others', () => {
        const text = [
            'agents:',
            '    shell:',
            '        lists: {}',
            '    claude:',
            '        label: Claude',
            '        lists: {}'
        ].join('\n');
        const read = parseAgents(text);
        expect(read.findings).toEqual([{ line: 2, why: 'unknown_agent', what: 'shell' }]);
        expect(read.agents.map((agent) => agent.agent)).toEqual(['claude']);
    });

    // revert: src/lib/data/sources/config/agents.ts "if (!known.includes(key)) say(pair, 'unknown_key', key);" => if (!known.includes(key) && false) say(pair, 'unknown_key', key);
    it('names every key the rule does not know, and a top key other than agents', () => {
        const text = [
            'agents:',
            '    claude:',
            '        label: Claude',
            '        colour: red',
            '        lists: {}',
            'extra: 1'
        ].join('\n');
        expect(parseAgents(text).findings).toEqual([
            { line: 4, why: 'unknown_key', what: 'colour' },
            { line: 6, why: 'unknown_key', what: 'extra' }
        ]);
    });

    // revert: src/lib/data/sources/config/agents.ts "if (cache !== null && (agent !== 'codex' || flag !== '-m' || !passable(cache))) {" => if (cache !== null && false) {
    it('takes a cache only on the Codex model picker', () => {
        const list = picker('--model', 'a', ['{ id: a, label: A, pass: opus }']);
        list.splice(3, 0, '                cache: models_cache.json');
        const read = parseAgents(one('claude', list));
        expect(read.findings).toEqual([{ line: 8, why: 'value', what: 'models_cache.json' }]);
        expect(read.agents[0].lists[0].cache).toBe(undefined);
    });

    // revert: src/lib/data/sources/config/agents.ts "if (doc.errors.length > 0) return { agents: [], findings };" => if (doc.errors.length > 99) return { agents: [], findings };
    it('says a file that does not parse, by the line, and offers nothing from it', () => {
        const read = parseAgents('agents:\n    claude: [\n');
        expect(read.agents).toEqual([]);
        expect(read.findings.every((finding) => finding.why === 'parse')).toBe(true);
        expect(read.findings.length).toBeGreaterThan(0);
        expect(parseAgents('- a list').findings).toEqual([
            { line: 1, why: 'shape', what: 'agents' }
        ]);
    });
});

describe("a Codex account's model cache", () => {
    // revert: src/lib/data/sources/config/agents.ts "if (!passable(slug) || found.some((one) => one.id === slug)) continue;" => if (slug === '') continue;
    it('reads a list or a map holding one, each model by its slug and its display name', () => {
        expect(
            cacheModels({
                models: [
                    { slug: 'gpt-5.6-sol', display_name: 'GPT 5.6 Sol' },
                    { id: 'o9' },
                    { slug: 'gpt-5.6-sol' },
                    { slug: '--oops' },
                    { slug: 'two words' },
                    'not a model'
                ]
            })
        ).toEqual([
            { id: 'gpt-5.6-sol', label: 'GPT 5.6 Sol', pass: 'gpt-5.6-sol' },
            { id: 'o9', label: 'o9', pass: 'o9' }
        ]);
        expect(cacheModels([{ model: 'm1', name: 'Model one' }])).toEqual([
            { id: 'm1', label: 'Model one', pass: 'm1' }
        ]);
        expect(cacheModels(null)).toEqual([]);
        expect(cacheModels({ models: 'none' })).toEqual([]);
    });

    // revert: src/lib/data/sources/config/agents.ts "const values = [...list.values.filter((one) => one.pass === null), ...models];" => const values = [...models];
    it('puts the cached models in place of the file list, the CLI default kept in front', () => {
        const codex = parseAgents(shipped()).agents[1];
        const merged = withCacheModels(codex, [{ id: 'm1', label: 'M1', pass: 'm1' }]);
        expect(merged.lists[0].values.map((value) => value.id)).toEqual(['cli', 'm1']);
        expect(merged.lists[0].default).toBe('cli');
        expect(merged.lists.slice(1)).toEqual(codex.lists.slice(1));
        expect(withCacheModels(codex, [])).toBe(codex);
    });
});
