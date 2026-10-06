// Layer 1, data tests. The machine's own file, read from text the case writes: checkLocal over
// every shape of wrong value, in the order the reader refuses them, and readLocal, loadLocal and
// localFindings over a scratch engine whose local.yml the case writes. A key that is wrong costs
// that key alone. The real config/local.yml is never opened.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, vi } from 'vitest';
import {
    DEFAULT_PORT,
    checkLocal,
    engineDir,
    loadConfig,
    loadLocal,
    localFile,
    localFindings,
    readLocal
} from '../../../../src/lib/data/sources/config.ts';
import { readLocalText } from '../../../../src/lib/data/sources/config/local.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';

/** A scratch engine whose config/local.yml holds the text, never the real file. */
function engineWith(text: string | null): string {
    const engine = scratchDir('oculus-local-');
    const file = localFile(engine);
    if (!file.startsWith(tmpdir() + sep) && !file.startsWith(`/private${tmpdir()}${sep}`)) {
        throw new Error(`the scratch local.yml is outside the temporary directory: ${file}`);
    }
    mkdirSync(join(engine, 'config'), { recursive: true });
    if (text !== null) writeFileSync(file, text);
    return engine;
}

/** The problems of a read as key and kind. */
function named(engine: string, text: string): string[] {
    return readLocalText(text, engine).problems.map((one) => `${one.key}: ${one.kind}`);
}

/** The sentence checkLocal gives for a text, which names the file as `local.yml`. */
const sentence = (text: string) => checkLocal(text);

describe('checkLocal', () => {
    it.each([
        ['[]', 'local.yml: expected a map of keys'],
        ['accounts: {}', 'local.yml: accounts must be a list'],
        ['accounts: [3]', 'local.yml: accounts[0] must be a map'],
        [
            'accounts: [{ tool: gemini, dir: d, label: a }]',
            'local.yml: accounts[0].tool must be claude or codex'
        ],
        [
            "accounts: [{ tool: claude, dir: '', label: a }]",
            'local.yml: accounts[0].dir must be a path'
        ],
        [
            "accounts: [{ tool: claude, dir: d, label: '' }]",
            'local.yml: accounts[0].label must be words'
        ],
        [
            'accounts: [{ tool: claude, dir: d, label: A b }, { tool: claude, dir: e, label: a-b }]',
            'local.yml: accounts[1].label duplicates a Claude label or reduced label: a-b'
        ],
        ['hub: 3\nport: x', 'local.yml: hub must be a path'],
        ['schedules: 3', 'local.yml: schedules must be a path'],
        ['port: x', 'local.yml: port must be an integer'],
        ["hpc_host: ''", 'local.yml: hpc_host must be a non-empty string'],
        [
            'calendars: [{ provider: yahoo, label: a }]',
            'local.yml: calendars[0].provider must be google, microsoft or ics'
        ],
        [
            'calendars: [{ provider: ics, label: A }]',
            'local.yml: calendars[0].label must be lowercase letters, digits and dashes'
        ],
        [
            'calendars: [{ provider: ics, label: a }, { provider: ics, label: a }]',
            'local.yml: calendars[1].label repeats a for ics'
        ],
        [
            'mail: [{ provider: ics, label: a }]',
            'local.yml: mail[0].provider must be google or microsoft'
        ],
        ['literature: abc', 'local.yml: literature must be a map'],
        ['literature: { wos_key: 3 }', 'local.yml: literature.wos_key must be a non-empty string'],
        ["literature: { mailto: '' }", 'local.yml: literature.mailto must be a non-empty string']
    ])('answers %j with the sentence it would throw', (text, expected) => {
        expect(sentence(text)).toBe(expected);
    });
});

describe('readLocalText', () => {
    const engine = '/engine';

    it('keeps the good keys when one is wrong', () => {
        const read = readLocalText('hub: /h\nport: x\nhpc_host: a', engine);
        expect(read.config.hub).toBe('/h');
        expect(read.config.port).toBe(DEFAULT_PORT);
        expect(read.config.hpcHost).toBe('a');
        expect(named(engine, 'hub: /h\nport: x\nhpc_host: a')).toStrictEqual(['port: value']);
        expect(read.unread).toBe(false);

        const wrongMap = readLocalText('port: 9001\nliterature: abc', engine);
        expect(wrongMap.config.port).toBe(9001);
        expect(wrongMap.config.literature).toBeUndefined();
        expect(wrongMap.problems.map((one) => one.key)).toStrictEqual(['literature']);
        const wrongKey = readLocalText(
            'port: 9001\nliterature: { wos_key: 3, mailto: a@b.c }',
            engine
        );
        expect(wrongKey.config.port).toBe(9001);
        expect(wrongKey.config.literature).toStrictEqual({ mailto: 'a@b.c' });
        expect(wrongKey.problems.map((one) => one.key)).toStrictEqual(['literature.wos_key']);
    });
});

describe('readLocal and loadLocal', () => {
    it('warns of an unknown key only when asked, and loadLocal asks every call', () => {
        const engine = engineWith('colour: teal');
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        try {
            expect(readLocal(engine).problems).toStrictEqual([]);
            expect(warn).not.toHaveBeenCalled();
            readLocal(engine, true);
            expect(warn).toHaveBeenCalledTimes(1);
            loadLocal(engine);
            loadLocal(engine);
            expect(warn).toHaveBeenCalledTimes(3);
        } finally {
            warn.mockRestore();
        }

        const literature = engineWith('literature: { wos_key: k, foo: x }');
        const again = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        try {
            const read = readLocal(literature, true);
            expect(read.problems).toStrictEqual([]);
            expect(read.unknown).toStrictEqual(['literature.foo']);
            expect(read.config.literature).toStrictEqual({ wosKey: 'k' });
            expect(again).toHaveBeenCalledTimes(1);
            expect(String(again.mock.calls[0][0])).toContain(
                'ignoring unknown key(s) literature.foo'
            );
        } finally {
            again.mockRestore();
        }
    });
});

describe('localFindings', () => {
    const config = loadConfig(engineDir()).config;

    it('words each problem against local.yml with no value of the file in it', () => {
        const engine = engineWith(null);
        const texts = [
            'hub: /h\nport: x\nhpc_host: a',
            'accounts: [{ tool: claude, dir: d, label: A b }, { tool: gemini, dir: e, label: a-b }, { tool: claude, dir: f, label: a-b }]',
            'a: [',
            'port: 9001\nliterature: abc',
            'port: 9001\nliterature: { wos_key: 3, mailto: a@b.c }'
        ];
        for (const text of texts) {
            const { problems } = readLocalText(text, engine);
            expect(problems.length).toBeGreaterThan(0);
            const findings = localFindings(engine, config, problems);
            expect(findings).toHaveLength(problems.length);
            for (const [at, finding] of findings.entries()) {
                expect(finding.file).toBe(localFile(engine));
                expect(finding.key).toBe(problems[at].key);
                for (const secret of ['a-b', 'gemini', 'did not find', 'flow']) {
                    expect(finding.message.toLowerCase(), finding.key).not.toContain(secret);
                }
            }
        }
    });
});
