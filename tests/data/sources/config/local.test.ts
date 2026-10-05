// Layer 1, data tests. The machine's own file, read from text the case writes: checkLocal over
// every shape of wrong value, in the order the reader refuses them, and readLocal, loadLocal and
// localFindings over a scratch engine whose local.yml the case writes. A key that is wrong costs
// that key alone; a row that is wrong costs that row; a file that cannot be read costs every key.
// The real config/local.yml is never opened.

import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, vi } from 'vitest';
import {
    DEFAULT_PORT,
    checkLocal,
    engineDir,
    loadConfig,
    loadLocal,
    localDefaults,
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
        ]
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
    });

    it('names two wrong keys and answers both defaults', () => {
        const text = "port: x\nhpc_host: ''";
        const read = readLocalText(text, engine);
        expect(read.config.port).toBe(DEFAULT_PORT);
        expect(read.config.hpcHost).toBe(localDefaults(engine).hpcHost);
        expect(named(engine, text)).toStrictEqual(['port: value', 'hpc_host: value']);
    });

    it('leaves out the row that is wrong and reads the rows around it', () => {
        const accounts =
            'accounts: [{ tool: claude, dir: /a, label: a }, { tool: gemini, dir: /b, label: b }]';
        const read = readLocalText(accounts, engine);
        expect(read.config.accounts.map((one) => one.label)).toStrictEqual(['a']);
        expect(named(engine, accounts)).toStrictEqual(['accounts[1].tool: row']);

        const every = readLocalText('accounts: [{ tool: gemini, dir: /b, label: b }]', engine);
        expect(every.config.accounts).toStrictEqual([]);
        expect(every.problems).toHaveLength(1);

        const none = readLocalText('accounts: {}', engine);
        expect(none.config.accounts).toStrictEqual(localDefaults(engine).accounts);
        expect(named(engine, 'accounts: {}')).toStrictEqual(['accounts: value']);

        const repeated = 'calendars: [{ provider: ics, label: a }, { provider: ics, label: a }]';
        expect(readLocalText(repeated, engine).config.calendars).toHaveLength(1);
        expect(named(engine, repeated)).toStrictEqual(['calendars[1].label: repeat']);
    });

    it('leaves a path key absent when it is empty', () => {
        const read = readLocalText("notes: ''", engine);
        expect(read.config.notes).toBeUndefined();
        expect(named(engine, "notes: ''")).toStrictEqual(['notes: value']);
    });

    it('answers every default and one problem for a text that does not read', () => {
        for (const [text, kind] of [
            ['a: [', 'unparsed'],
            ['[]', 'not-a-map']
        ]) {
            const read = readLocalText(text, engine);
            expect(read.unread).toBe(true);
            expect(read.config).toStrictEqual(localDefaults(engine));
            expect(read.problems).toMatchObject([{ key: '', kind }]);
        }
    });

    it('reads the corrected text with no problem', () => {
        const read = readLocalText('port: 8791', engine);
        expect(read.config.port).toBe(8791);
        expect(read.problems).toStrictEqual([]);
    });
});

describe('readLocal and loadLocal', () => {
    it('answers every default and no problem for a missing file', () => {
        const engine = engineWith(null);
        const read = readLocal(engine);
        expect(read.problems).toStrictEqual([]);
        expect(read.unread).toBe(false);
        expect(read.config).toStrictEqual(localDefaults(engine));
        expect(loadLocal(engine)).toStrictEqual(localDefaults(engine));
    });

    it('answers every default and the error code for a folder at the file path', () => {
        const engine = engineWith(null);
        mkdirSync(localFile(engine));
        const read = readLocal(engine);
        expect(read.unread).toBe(true);
        expect(read.config).toStrictEqual(localDefaults(engine));
        expect(read.problems).toMatchObject([{ key: '', kind: 'unreadable', code: 'EISDIR' }]);
    });

    it.skipIf(process.getuid?.() === 0)('answers the error code for a file nobody may read', () => {
        const engine = engineWith('port: 8791');
        chmodSync(localFile(engine), 0);
        const read = readLocal(engine);
        expect(read.unread).toBe(true);
        expect(read.problems).toMatchObject([{ key: '', kind: 'unreadable', code: 'EACCES' }]);
    });

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
    });

    it('reads a wrong port as the default port', () => {
        const engine = engineWith('port: x');
        expect(loadLocal(engine).port).toBe(DEFAULT_PORT);
    });
});

describe('localFindings', () => {
    const config = loadConfig(engineDir()).config;

    it('words each problem against local.yml with no value of the file in it', () => {
        const engine = engineWith(null);
        const texts = [
            'hub: /h\nport: x\nhpc_host: a',
            'accounts: [{ tool: claude, dir: d, label: A b }, { tool: gemini, dir: e, label: a-b }, { tool: claude, dir: f, label: a-b }]',
            'a: ['
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
