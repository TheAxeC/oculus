// Layer 1, data tests. A hub's own `.oculus/local.yml`, read from text the case writes: checkLocal
// over every shape of wrong value, in the order the reader refuses them, and readLocal, loadMachine
// and localFindings over a scratch hub whose local.yml the case writes. A key that is wrong costs
// that key alone. No hub's real local.yml is ever opened.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, vi } from 'vitest';
import {
    DEFAULT_PORT,
    checkLocal,
    engineDir,
    loadConfig,
    loadMachine,
    localFile,
    localFindings
} from '../../../../src/lib/data/sources/config.ts';
import { readLocal, readLocalText } from '../../../../src/lib/data/sources/config/local.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';

/** A scratch hub whose .oculus/local.yml holds the text, never a real file. */
function hubWith(text: string | null): string {
    const hub = scratchDir('oculus-local-');
    const file = localFile(hub);
    if (!file.startsWith(tmpdir() + sep) && !file.startsWith(`/private${tmpdir()}${sep}`)) {
        throw new Error(`the scratch local.yml is outside the temporary directory: ${file}`);
    }
    mkdirSync(join(hub, '.oculus'), { recursive: true });
    if (text !== null) writeFileSync(file, text);
    return hub;
}

/** The problems of a read as key and kind. */
function named(hub: string, text: string): string[] {
    return readLocalText(text, hub).problems.map((one) => `${one.key}: ${one.kind}`);
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
        ['hub: 3\nport: x', 'local.yml: port must be an integer'],
        ['lsp: 3', 'local.yml: lsp must be a path'],
        ['schedules: 3', 'local.yml: schedules must be a path'],
        ['port: x', 'local.yml: port must be an integer'],
        ["hpc_host: ''", 'local.yml: hpc_host must be a non-empty string'],
        ["rite_dap_bin: ''", 'local.yml: rite_dap_bin must be a non-empty string'],
        ['rite_dap_bin: 5', 'local.yml: rite_dap_bin must be a non-empty string'],
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
        ['apps_dir: 3', 'local.yml: apps_dir must be a path'],
        ['literature: abc', 'local.yml: literature must be a map'],
        ['literature: { wos_key: 3 }', 'local.yml: literature.wos_key must be a non-empty string'],
        ["literature: { mailto: '' }", 'local.yml: literature.mailto must be a non-empty string']
    ])('answers %j with the sentence it would throw', (text, expected) => {
        expect(sentence(text)).toBe(expected);
    });

    it('takes a notes key as a key it does not know, which readLocal names as unknown', () => {
        const text = 'notes: ~/elsewhere';
        expect(sentence(text)).toBeNull();
        const hub = hubWith(text);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        try {
            const read = readLocal(hub, true);
            expect(read.problems).toStrictEqual([]);
            expect(read.unknown).toStrictEqual(['notes']);
            expect(read.config).not.toHaveProperty('notes');
        } finally {
            warn.mockRestore();
        }
    });
});

describe('readLocalText', () => {
    const hub = '/hub';

    it('keeps the good keys when one is wrong', () => {
        const read = readLocalText('port: x\nhpc_host: a', hub);
        expect(read.config.port).toBe(DEFAULT_PORT);
        expect(read.config.hpcHost).toBe('a');
        expect(named(hub, 'port: x\nhpc_host: a')).toStrictEqual(['port: value']);
        expect(read.unread).toBe(false);

        const wrongMap = readLocalText('port: 9001\nliterature: abc', hub);
        expect(wrongMap.config.port).toBe(9001);
        expect(wrongMap.config.literature).toBeUndefined();
        expect(wrongMap.problems.map((one) => one.key)).toStrictEqual(['literature']);
        const wrongKey = readLocalText(
            'port: 9001\nliterature: { wos_key: 3, mailto: a@b.c }',
            hub
        );
        expect(wrongKey.config.port).toBe(9001);
        expect(wrongKey.config.literature).toStrictEqual({ mailto: 'a@b.c' });
        expect(wrongKey.problems.map((one) => one.key)).toStrictEqual(['literature.wos_key']);
    });
});

describe('readLocal and loadMachine', () => {
    it('warns of an unknown key only when asked, and loadMachine asks every call', () => {
        const hub = hubWith('colour: teal');
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        try {
            expect(readLocal(hub).problems).toStrictEqual([]);
            expect(warn).not.toHaveBeenCalled();
            readLocal(hub, true);
            expect(warn).toHaveBeenCalledTimes(1);
            loadMachine([{ name: 'hub', dir: hub }], 'hub');
            loadMachine([{ name: 'hub', dir: hub }], 'hub');
            expect(warn).toHaveBeenCalledTimes(3);
        } finally {
            warn.mockRestore();
        }

        const literature = hubWith('literature: { wos_key: k, foo: x }');
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
        const hub = hubWith(null);
        const texts = [
            'port: x\nhpc_host: a',
            'accounts: [{ tool: claude, dir: d, label: A b }, { tool: gemini, dir: e, label: a-b }, { tool: claude, dir: f, label: a-b }]',
            'a: [',
            'port: 9001\nliterature: abc',
            'port: 9001\nliterature: { wos_key: 3, mailto: a@b.c }'
        ];
        for (const text of texts) {
            const { problems } = readLocalText(text, hub);
            expect(problems.length).toBeGreaterThan(0);
            const findings = localFindings(
                config,
                problems.map((problem) => ({ file: localFile(hub), problem }))
            );
            expect(findings).toHaveLength(problems.length);
            for (const [at, finding] of findings.entries()) {
                expect(finding.file).toBe(localFile(hub));
                expect(finding.key).toBe(problems[at].key);
                for (const secret of ['a-b', 'gemini', 'did not find', 'flow']) {
                    expect(finding.message.toLowerCase(), finding.key).not.toContain(secret);
                }
            }
        }
    });
});
