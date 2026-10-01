// The machine's own file, read from text the case writes: checkLocal over every shape of wrong
// value, in the order the reader refuses them, and loadLocal over a scratch engine folder. The
// real config/local.yml is never opened.

import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { LOCAL_NAME, checkLocal, loadLocal } from '../../../../src/lib/data/sources/config.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';

/** The sentence checkLocal gives for a text, which names the file as `local.yml`. */
const sentence = (text: string) => checkLocal(text);

/** An engine folder of this case's own holding the machine's file with `body`. */
function engineWith(body: string): string {
    const dir = scratchDir('oculus-local-');
    const folder = join(dir, 'config');
    const file = join(folder, LOCAL_NAME);
    expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(folder, { recursive: true });
    writeFileSync(file, body);
    return dir;
}

describe('checkLocal', () => {
    it.each([
        ['[]', 'local.yml: expected a map of keys'],
        ['x', 'local.yml: expected a map of keys'],
        ['3', 'local.yml: expected a map of keys'],
        ['accounts: {}', 'local.yml: accounts must be a list'],
        ['accounts: x', 'local.yml: accounts must be a list'],
        ['accounts: [3]', 'local.yml: accounts[0] must be a map'],
        ['accounts: [[]]', 'local.yml: accounts[0] must be a map'],
        [
            'accounts: [{ tool: gemini, dir: d, label: a }]',
            'local.yml: accounts[0].tool must be claude or codex'
        ],
        [
            "accounts: [{ tool: claude, dir: '', label: a }]",
            'local.yml: accounts[0].dir must be a path'
        ],
        [
            'accounts: [{ tool: claude, dir: 3, label: a }]',
            'local.yml: accounts[0].dir must be a path'
        ],
        [
            "accounts: [{ tool: claude, dir: d, label: '' }]",
            'local.yml: accounts[0].label must be words'
        ],
        [
            'accounts: [{ tool: claude, dir: d, label: 3 }]',
            'local.yml: accounts[0].label must be words'
        ],
        [
            "accounts: [{ tool: claude, dir: '', label: '' }]",
            'local.yml: accounts[0].dir must be a path'
        ],
        [
            'accounts: [{ tool: claude, dir: d, label: A b }, { tool: claude, dir: e, label: a-b }]',
            'local.yml: accounts[1].label duplicates a Claude label or reduced label: a-b'
        ],
        ['hub: 3\nport: x', 'local.yml: hub must be a path'],
        ["hub: ''", 'local.yml: hub must be a path'],
        ['port: x', 'local.yml: port must be an integer'],
        ['port: 1.5', 'local.yml: port must be an integer'],
        ['port: .nan', 'local.yml: port must be an integer'],
        ['port: .inf', 'local.yml: port must be an integer'],
        ["port: '8790'", 'local.yml: port must be an integer'],
        ["hpc_host: ''", 'local.yml: hpc_host must be a non-empty string'],
        ['hpc_host: 3', 'local.yml: hpc_host must be a non-empty string'],
        ['claude_bin: 3', 'local.yml: claude_bin must be a non-empty string'],
        ["open_bin: ''", 'local.yml: open_bin must be a non-empty string'],
        ['calendars: {}', 'local.yml: calendars must be a list'],
        ['calendars: [3]', 'local.yml: calendars[0] must be a map'],
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
        ['mail: x', 'local.yml: mail must be a list'],
        [
            'mail: [{ provider: ics, label: a }]',
            'local.yml: mail[0].provider must be google or microsoft'
        ],
        ["notes: ''", 'local.yml: notes must be a path'],
        ['workspaces: 3', 'local.yml: workspaces must be a path'],
        ['mail_dir: []', 'local.yml: mail_dir must be a path'],
        ['calendar_dir: [x]', 'local.yml: calendar_dir must be a path']
    ])('answers %j with the sentence it would throw', (text, expected) => {
        expect(sentence(text)).toBe(expected);
    });

    it.each([
        [''],
        ['{}'],
        [
            'hub: /somewhere\nport: 8791\nhpc_host: ssh-alias\nclaude_bin: claude\nopen_bin: /usr/bin/open'
        ],
        ['accounts:\n  - { tool: codex, dir: ~/.codex, label: codex }'],
        [
            'calendars:\n  - { provider: ics, label: feed }\nmail:\n  - { provider: google, label: work }'
        ],
        ['notes: /tmp/notes\nunknown_key: 1']
    ])('answers null for the readable text %j', (text) => {
        expect(sentence(text)).toBeNull();
    });

    it('gives the first line of a parse error', () => {
        const message = sentence('a: [');
        expect(message).not.toBeNull();
        expect(message).not.toContain('\n');
    });

    it('names the file it is given', () => {
        expect(checkLocal('port: x', '/m/local.yml')).toBe('/m/local.yml: port must be an integer');
    });
});

describe('loadLocal', () => {
    it('reads each key it holds into the machine values', () => {
        const dir = engineWith(
            [
                'hub: ../hub',
                'port: 8791',
                'hpc_host: ssh-alias',
                'claude_bin: /bin/claude',
                'open_bin: /usr/bin/open',
                'accounts:',
                '  - { tool: claude, dir: ~/.claude, label: Work }',
                '  - { tool: codex, dir: rel/codex, label: codex }',
                'calendars:',
                '  - { provider: ics, label: feed }',
                'mail:',
                '  - { provider: microsoft, label: uni }',
                'notes: notes-here',
                'mail_dir: /abs/mail',
                ''
            ].join('\n')
        );
        expect(loadLocal(dir)).toStrictEqual({
            hub: resolve(dir, '../hub'),
            port: 8791,
            hpcHost: 'ssh-alias',
            claudeBin: '/bin/claude',
            openBin: '/usr/bin/open',
            accounts: [
                { tool: 'claude', dir: join(homedir(), '.claude'), label: 'Work' },
                { tool: 'codex', dir: resolve(dir, 'rel/codex'), label: 'codex' }
            ],
            calendars: [{ provider: 'ics', label: 'feed' }],
            mail: [{ provider: 'microsoft', label: 'uni' }],
            notes: resolve(dir, 'notes-here'),
            mailDir: '/abs/mail'
        });
    });

    it('answers the defaults for a folder with no machine file', () => {
        const dir = scratchDir('oculus-local-none-');
        expect(loadLocal(dir)).toStrictEqual({
            hub: resolve(dir, '..', '..'),
            port: 8790,
            claudeBin: 'claude',
            accounts: [
                { tool: 'claude', dir: join(homedir(), '.claude'), label: 'claude' },
                { tool: 'codex', dir: join(homedir(), '.codex'), label: 'codex' }
            ],
            calendars: [],
            mail: []
        });
    });

    it('throws the sentence of a key of the wrong type, naming the file', () => {
        const dir = engineWith('port: 1.5\n');
        expect(() => loadLocal(dir)).toThrow(
            `${join(dir, 'config', LOCAL_NAME)}: port must be an integer`
        );
    });
});
