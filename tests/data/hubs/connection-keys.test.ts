// Layer 1, data tests. The keys that set this machine's connections (`slurm.resource`,
// `clusters.key_type`, `clusters.key_file`, `connections.failures`, `sign_in`,
// `recover.node_download`): their readers, each answering its default with the key named for a
// wrong value and leaving out a row it does not read with the row and the field named; and the
// rule that they are read from the primary hub's settings file alone, a hub other than the primary
// that sets one being a finding naming the key and that hub, its value not read.

import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { readOtherHub } from '../../../src/lib/data/index.ts';
import { HUB_FILE } from '../../../src/lib/data/helpers/hub-names.ts';
import {
    clusterKeySettings,
    engineDir,
    failureRows,
    loadConfig,
    signInRows
} from '../../../src/lib/data/sources/config.ts';
import type { SettingProblem } from '../../../src/lib/data/sources/config/settings/reader.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';

/** The shipped options catalog of behavior.yml, which the readers take their defaults from. */
const OPTIONS = (loadConfig(engineDir()).config.options as Record<string, unknown>)['behavior.yml'];

/** A reader's answer over the shipped catalog with `held` set, and its problems as key and kind. */
function readOver(
    read: (map: Record<string, unknown>, problems: SettingProblem[]) => unknown,
    held: Record<string, unknown>
): { value: unknown; problems: string[] } {
    const found: SettingProblem[] = [];
    const value = read({ options: { 'behavior.yml': OPTIONS }, ...held }, found);
    const named = (one: SettingProblem): string =>
        `${one.key}: ${'problem' in one ? one.problem.kind : one.where}`;
    return { value, problems: found.map(named) };
}

/** The key path oculus ships in config/defaults/behavior.yml. */
const SHIPPED_FILE = '~/.ssh/id_{type}_{resource}';

describe('clusterKeySettings', () => {
    it.each([
        [
            'a type and a path',
            { key_type: 'rsa', key_file: '~/.ssh/cluster_{resource}' },
            { keyType: 'rsa', keyFile: '~/.ssh/cluster_{resource}' },
            []
        ],
        ['neither', {}, { keyType: 'ed25519', keyFile: SHIPPED_FILE }, []],
        [
            'a type no key is made of',
            { key_type: 'dsa' },
            { keyType: 'ed25519', keyFile: SHIPPED_FILE },
            ['clusters.key_type: choice']
        ],
        [
            'a path that is no text',
            { key_type: 'rsa', key_file: 3 },
            { keyType: 'rsa', keyFile: SHIPPED_FILE },
            ['clusters.key_file: text']
        ]
    ])(
        'reads %s, the default with the key named for a wrong value (G13)',
        (_row, clusters, value, problems) => {
            expect(readOver(clusterKeySettings, { clusters })).toStrictEqual({ value, problems });
        }
    );
});

describe('failureRows', () => {
    const KEY = {
        kind: 'Key refused',
        match: 'Permission denied (publickey)',
        fix: 'Put the key on the cluster'
    };
    /** KEY as it is read, with no `for` reading both connections. */
    const BOTH = { ...KEY, for: ['cluster', 'git'] };

    it.each([
        ['a row', [KEY], [BOTH], []],
        [
            'a row for the cluster alone',
            [{ ...KEY, for: ['cluster'] }],
            [{ ...KEY, for: ['cluster'] }],
            []
        ],
        ['a row for git alone', [{ ...KEY, for: ['git'] }], [{ ...KEY, for: ['git'] }], []],
        [
            'a row for a connection that is none',
            [{ ...KEY, for: ['mail'] }, KEY],
            [BOTH],
            ['connections.failures[0].for: choice']
        ],
        [
            'a row for no connection',
            [{ ...KEY, for: [] }, KEY],
            [BOTH],
            ['connections.failures[0].for: empty']
        ],
        [
            'a row with an empty match',
            [{ ...KEY, match: '' }, KEY],
            [BOTH],
            ['connections.failures[0].match: empty']
        ],
        ['a row that is no map', ['x', KEY], [BOTH], ['connections.failures[0]: records']],
        ['a value that is no list', 'x', [], ['connections.failures: family']]
    ])(
        'reads %s in order, naming the key of each row it leaves out (G13)',
        (_row, failures, value, problems) => {
            const held = { connections: { failures } };
            expect(readOver(failureRows, held)).toStrictEqual({ value, problems });
        }
    );
});

describe('signInRows', () => {
    const GITHUB = {
        key: 'github',
        token: 'https://github.com/login/oauth/access_token',
        credential_address: 'https://github.com'
    };
    const READ = {
        key: 'github',
        name: 'github',
        token: 'https://github.com/login/oauth/access_token',
        credentialAddress: 'https://github.com'
    };

    it.each([
        ['a git host row', [GITHUB], [READ], []],
        ['a key that is a path', [{ key: '../x' }, GITHUB], [READ], ['sign_in[0].key: form']],
        ['a key holding a semicolon', [{ key: 'a;b' }, GITHUB], [READ], ['sign_in[0].key: form']],
        [
            'a key named twice',
            [GITHUB, { ...GITHUB, token: 'https://x.example/t' }],
            [READ],
            ['sign_in: repeat']
        ],
        [
            'an address that is no https address',
            [{ ...GITHUB, token: 'http://x' }],
            [],
            ['sign_in[0].token: form']
        ],
        [
            'a credential address that is no https origin',
            [{ ...GITHUB, credential_address: 'https://x.helper=!cmd #' }],
            [{ key: 'github', name: 'github', token: GITHUB.token }],
            ['sign_in[0].credential_address: form']
        ]
    ])(
        'reads %s, naming the row and the field it does not read (G13)',
        (_row, rows, value, problems) => {
            expect(readOver(signInRows, { sign_in: rows })).toStrictEqual({ value, problems });
        }
    );
});

describe('the connection keys of a hub that is not the primary', () => {
    it('are each a finding naming the key and the hub, and a key each hub reads from its own file is none (G13)', () => {
        const lab = plantScratch('oculus-connection-keys-', {
            [HUB_FILE]: [
                'slurm:',
                '  resource: [b]',
                'sign_in:',
                '  - { key: github, token: https://github.com/login/oauth/access_token }',
                'connections:',
                "  failures: [{ kind: K, match: 'Permission denied', fix: F }]",
                'lint:',
                '  writing_skip: []',
                'memories_dir: .oculus/photos',
                ''
            ].join('\n')
        });
        const read = readOtherHub(
            { key: 'lab', dir: lab },
            loadConfig(engineDir(), { hub: lab, other: 'lab' })
        );
        const named = read.findings.filter((one) => one.message.includes('primary hub'));
        expect(named.map((one) => [one.file, one.key])).toEqual([
            [join(lab, HUB_FILE), 'slurm.resource'],
            [join(lab, HUB_FILE), 'sign_in'],
            [join(lab, HUB_FILE), 'connections.failures'],
            [join(lab, HUB_FILE), 'lint.writing_skip']
        ]);
        for (const one of named) expect(one.message).toContain('lab');
    });
});
