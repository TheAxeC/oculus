// Layer 1, data tests. A hub's own `.oculus/local.yml`, read from text the case writes: checkLocal
// over every shape of wrong value, in the order the reader refuses them, and readLocal, loadMachine
// and localFindings over a scratch hub whose local.yml the case writes, the `downloads` rows among
// them. A key that is wrong costs that key alone. No hub's real local.yml is ever opened.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { describe, expect, vi } from 'vitest';
import {
    DEFAULT_PORT,
    basicServices,
    checkLocal,
    engineDir,
    loadConfig,
    loadMachine,
    localFile,
    localFindings
} from '../../../../../src/lib/data/sources/config.ts';
import { readLocal, readLocalText } from '../../../../../src/lib/data/sources/config/local.ts';
import { readMachine, userProblems } from '../../../../../src/lib/data/sources/config/machine.ts';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';
import { FIXTURE_CONFIG } from '../../../../server/core/reader/rows.ts';

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
        ['port: x', 'local.yml: port must be an integer'],
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
        ['literature: abc', 'local.yml: literature must be a map'],
        ["literature: { mailto: '' }", 'local.yml: literature.mailto must be a non-empty string']
    ])('answers %j with the sentence it would throw', (text, expected) => {
        expect(sentence(text)).toBe(expected);
    });

    it.each(['notes', 'bookmarks', 'schedules', 'apps_dir'])(
        'takes a %s key as a key it does not know, which readLocal names as unknown',
        (key) => {
            const text = `${key}: ~/elsewhere`;
            expect(sentence(text)).toBeNull();
            const hub = hubWith(text);
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            try {
                const read = readLocal(hub, true);
                expect(read.problems).toStrictEqual([]);
                expect(read.unknown).toStrictEqual([key]);
                expect(read.config).not.toHaveProperty(key);
            } finally {
                warn.mockRestore();
            }
        }
    );
});

describe('readLocalText', () => {
    const hub = '/hub';

    it('keeps the good keys when one is wrong', () => {
        const read = readLocalText('port: x\nrite_dap_bin: a', hub);
        expect(read.config.port).toBe(DEFAULT_PORT);
        expect(read.config.riteDapBin).toBe('a');
        expect(named(hub, 'port: x\nrite_dap_bin: a')).toStrictEqual(['port: value']);
        expect(read.unread).toBe(false);

        const wrongMap = readLocalText('port: 9001\nliterature: abc', hub);
        expect(wrongMap.config.port).toBe(9001);
        expect(wrongMap.config.literature).toBeUndefined();
        expect(wrongMap.problems.map((one) => one.key)).toStrictEqual(['literature']);
        const wrongKey = readLocalText('port: 9001\nliterature: { mailto: 3 }', hub);
        expect(wrongKey.config.port).toBe(9001);
        expect(wrongKey.config.literature).toBeUndefined();
        expect(wrongKey.problems.map((one) => one.key)).toStrictEqual(['literature.mailto']);
    });
});

describe('a literature key and the downloads rows of a reader row', () => {
    it('reads literature.wos_key as a key it does not know, and takes a downloads row of any service', () => {
        const text = [
            'literature: { wos_key: x }',
            'downloads:',
            '  - { service: wos, secret: x }',
            '  - { service: openalex, secret: y }'
        ].join('\n');
        expect(sentence(text)).toBeNull();
        const hub = hubWith(text);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        try {
            const read = readLocal(hub, true);
            expect(read.problems).toStrictEqual([]);
            expect(read.unknown).toStrictEqual(['literature.wos_key']);
            expect(read.config.literature).toBeUndefined();
            expect(read.config.downloads).toStrictEqual([
                { service: 'wos', secret: 'x' },
                { service: 'openalex', secret: 'y' }
            ]);
        } finally {
            warn.mockRestore();
        }
    });
});

describe('downloads', () => {
    const config = loadConfig(engineDir()).config;
    const SECRET = 'download-secret-of-the-test-xyz';

    it.each([
        [
            'an empty service, an empty user and a repeated kaggle row',
            [
                'downloads:',
                `  - { service: '', user: dropper, secret: ${SECRET} }`,
                `  - { service: dropbox, user: '', secret: ${SECRET} }`,
                `  - { service: kaggle, user: kaggler, secret: ${SECRET} }`,
                `  - { service: kaggle, user: kaggler, secret: ${SECRET} }`
            ],
            ['downloads[0].service: row', 'downloads[1].user: row', 'downloads[3].service: repeat'],
            ['kaggle']
        ],
        [
            'a row for each service, a kaggle row and a kaggle-token row among them',
            [
                'downloads:',
                `  - { service: physionet, user: reader, secret: ${SECRET} }`,
                `  - { service: kaggle, user: reader, secret: ${SECRET} }`,
                `  - { service: kaggle-token, secret: ${SECRET} }`,
                `  - { service: synapse, secret: ${SECRET} }`
            ],
            [],
            ['physionet', 'kaggle', 'kaggle-token', 'synapse']
        ],
        [
            'a row of any service that names a user',
            ['downloads:', `  - { service: kaggle-token, user: kaggler, secret: ${SECRET} }`],
            [],
            ['kaggle-token']
        ]
    ])('reads %s', (_name, lines, problems, services) => {
        const hub = hubWith(lines.join('\n'));
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        try {
            const read = readLocal(hub, true);
            expect(read.problems.map((one) => `${one.key}: ${one.kind}`)).toStrictEqual(problems);
            expect(read.config.downloads.map((row) => row.service)).toStrictEqual(services);
            expect(warn).not.toHaveBeenCalled();
            const findings = localFindings(
                config,
                read.problems.map((problem) => ({ file: localFile(hub), problem }))
            );
            for (const finding of findings) {
                for (const value of [SECRET, 'dropbox', 'dropper', 'kaggler']) {
                    expect(finding.message, finding.key).not.toContain(value);
                }
            }
        } finally {
            warn.mockRestore();
        }
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

        const literature = hubWith('literature: { mailto: a@b.c, foo: x }');
        const again = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        try {
            const read = readLocal(literature, true);
            expect(read.problems).toStrictEqual([]);
            expect(read.unknown).toStrictEqual(['literature.foo']);
            expect(read.config.literature).toStrictEqual({ mailto: 'a@b.c' });
            expect(again).toHaveBeenCalledTimes(1);
            expect(String(again.mock.calls[0][0])).toContain(
                'ignoring unknown key(s) literature.foo'
            );
        } finally {
            again.mockRestore();
        }
    });
});

describe('a downloads row a reader row signs in to with a user', () => {
    const config = loadConfig(engineDir()).config;

    it('is a finding naming its service when it holds no user, and none when it holds one', () => {
        const text = [
            'downloads:',
            '  - { service: physionet, secret: s }',
            '  - { service: kaggle, user: k, secret: s }',
            '  - { service: synapse, secret: s }'
        ].join('\n');
        const hub = hubWith(text);
        const read = readMachine([{ name: 'hub', dir: hub }], 'hub');
        expect(read.problems).toStrictEqual([]);
        const basic = basicServices([FIXTURE_CONFIG]);
        expect([...basic].sort()).toStrictEqual(['kaggle', 'physionet']);
        const problems = userProblems(read, localFile(hub), basic);
        expect(localFindings(config, problems)).toStrictEqual([
            {
                file: localFile(hub),
                key: 'downloads',
                message:
                    'the downloads row of physionet has no user, which a reader row signs in to physionet with; the row is not used'
            }
        ]);
    });
});

describe('localFindings', () => {
    const config = loadConfig(engineDir()).config;

    it('words each problem against local.yml with no value of the file in it', () => {
        const hub = hubWith(null);
        const texts = [
            'port: x\nrite_dap_bin: a',
            'accounts: [{ tool: claude, dir: d, label: A b }, { tool: gemini, dir: e, label: a-b }, { tool: claude, dir: f, label: a-b }]',
            'a: [',
            'port: 9001\nliterature: abc',
            'port: 9001\nliterature: { mailto: 3 }'
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

describe('clusters', () => {
    const hub = hubWith(null);
    const rows = (text: string) => readLocalText(text, hub).config.clusters;

    it('reads the user name and the key file of each row, ~/ resolved, a field left out absent (G13)', () => {
        const text = [
            'clusters:',
            '  - { resource: utwente, user: axel, key_file: ~/.ssh/k }',
            '  - { resource: b }',
            '  - { resource: c, user: me, key_file: /keys/c }'
        ].join('\n');
        expect(rows(text)).toEqual([
            { resource: 'utwente', user: 'axel', keyFile: join(homedir(), '.ssh', 'k') },
            { resource: 'b' },
            { resource: 'c', user: 'me', keyFile: '/keys/c' }
        ]);
        expect(named(hub, text)).toEqual([]);
    });

    it.each([
        [
            'a user name that would read as an option',
            "resource: a, user: '-oProxyCommand=x'",
            'clusters[0].user'
        ],
        ['a user name holding a space', "resource: a, user: 'a b'", 'clusters[0].user'],
        ['a relative key file', 'resource: a, key_file: relative/k', 'clusters[0].key_file'],
        ['a public key file', 'resource: a, key_file: ~/.ssh/k.pub', 'clusters[0].key_file'],
        [
            'a key file holding a single quote',
            `resource: a, key_file: "/keys/a'b"`,
            'clusters[0].key_file'
        ],
        [
            'the resource mac, which names this Mac',
            'resource: mac, user: me',
            'clusters[0].resource'
        ]
    ])(
        'leaves out a row with %s, with a problem naming the row and the field (G13)',
        (_row, fields, key) => {
            const text = `clusters:\n  - { ${fields} }\n  - { resource: b, user: me }\n`;
            expect(rows(text)).toEqual([{ resource: 'b', user: 'me' }]);
            expect(readLocalText(text, hub).problems.map((one) => one.key)).toEqual([key]);
            expect(checkLocal(text)).not.toContain('ProxyCommand');
        }
    );

    it('says that the resource mac names this Mac (G13)', () => {
        const read = readLocalText('clusters:\n  - { resource: mac }\n', hub);
        expect(read.problems.map((one) => one.sentence)).toEqual([
            'clusters[0].resource must be the key of a cluster other than mac, which names this Mac'
        ]);
    });

    it('uses the first of two rows of one cluster, naming the second, and names a value that is no list (G13)', () => {
        const text = 'clusters:\n  - { resource: a, user: one }\n  - { resource: a, user: two }\n';
        expect(rows(text)).toEqual([{ resource: 'a', user: 'one' }]);
        expect(named(hub, text)).toEqual(['clusters[1].resource: row']);
        expect(readLocalText(text, hub).problems.map((one) => one.sentence)).toEqual([
            'clusters[1].resource must be the key of a cluster no earlier row names'
        ]);
        expect(rows('clusters: x\n')).toEqual([]);
        expect(readLocalText('clusters: x\n', hub).problems.map((one) => one.key)).toEqual([
            'clusters'
        ]);
    });
});
