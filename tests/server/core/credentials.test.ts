// Layer 4, server test. A git host's token reaches git only in the credential helper's answer for
// the credential address it was granted for, and only while a git host row of `sign_in` with the
// file's key names that address: the helper (connect/credential-helper.mjs), run as git runs it
// with HOME a scratch folder and the key and the address it is named for as its arguments, answers
// the login and the token for that origin and nothing for another origin, another key's file,
// another action, a missing or broken file or a token holding a line break, and always exits 0
// with nothing on its error output; the config every git start and terminal is given
// (core/git/credentials.ts) names the helper for each signed-in address a row names and holds no
// token; a path holding a single quote sets no helper, which is a finding on `sign_in`.
// @module-tag slow: every case of the helper starts node.

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { HUB_FILE } from '../../../src/lib/data/helpers/hub-names.ts';
import { engineDir, loadConfig, type SignInRow } from '../../../src/lib/data/sources/config.ts';
import {
    gitCredentials,
    helperFindings,
    helperPath,
    type CredentialPlaces,
    type GitCredentials
} from '../../../src/lib/server/core/git/credentials.ts';
import { it, plantScratch, scratchDir } from '../../fixtures/scratch.ts';

const TOKEN = 'gho_the_token_of_this_case';
const HELPER = helperPath(engineDir());

/** A home folder whose `~/.oculus/connect/` holds the files, by name. */
function homeWith(files: Record<string, unknown>): string {
    const home = scratchDir('oculus-credentials-');
    const folder = join(home, '.oculus', 'connect');
    mkdirSync(folder, { recursive: true });
    for (const [name, held] of Object.entries(files)) {
        writeFileSync(join(folder, name), typeof held === 'string' ? held : JSON.stringify(held));
    }
    return home;
}

/**
 * The helper run as git runs it, named for a key and an address, with HOME the folder and git's
 * request on its input.
 */
function helper(
    home: string,
    action: string,
    request: string,
    named: [string, string] = ['github', 'https://github.com']
) {
    const run = spawnSync(process.execPath, [HELPER, ...named, action], {
        input: request,
        env: { HOME: home, PATH: process.env.PATH ?? '' },
        encoding: 'utf8'
    });
    return { status: run.status, out: run.stdout, err: run.stderr };
}

const SIGNED_IN = {
    'git-github.json': {
        client_id: 'Iv1.abc',
        token: TOKEN,
        login: 'reader',
        credential_address: 'https://github.com'
    }
};

/** The git host row of `sign_in` with the key `github`, naming `address`. */
function githubRow(address?: string): SignInRow {
    return address === undefined
        ? { key: 'github', name: 'GitHub' }
        : { key: 'github', name: 'GitHub', credentialAddress: address };
}

describe('the credential helper', () => {
    it('answers the login and the token for the origin the token was granted for (G135)', () => {
        const home = homeWith(SIGNED_IN);
        for (const request of [
            'protocol=https\nhost=github.com\n\n',
            'protocol=https\nhost=github.com\nport=443\npath=me/repo.git\n'
        ]) {
            expect(helper(home, 'get', request)).toEqual({
                status: 0,
                out: `username=reader\npassword=${TOKEN}\n`,
                err: ''
            });
        }
    });

    it.each([
        ['another host', SIGNED_IN, 'get', 'protocol=https\nhost=gitlab.com\n\n'],
        [
            'a host whose name begins with the origin',
            SIGNED_IN,
            'get',
            'protocol=https\nhost=github.com.example.org\n\n'
        ],
        ['another port', SIGNED_IN, 'get', 'protocol=https\nhost=github.com\nport=8443\n\n'],
        ['http', SIGNED_IN, 'get', 'protocol=http\nhost=github.com\n\n'],
        [
            'store',
            SIGNED_IN,
            'store',
            `protocol=https\nhost=github.com\nusername=reader\npassword=${TOKEN}\n\n`
        ],
        ['erase', SIGNED_IN, 'erase', 'protocol=https\nhost=github.com\n\n'],
        ['no file', {}, 'get', 'protocol=https\nhost=github.com\n\n'],
        [
            'a broken file',
            { 'git-github.json': `{ token ${TOKEN}` },
            'get',
            'protocol=https\nhost=github.com\n\n'
        ],
        [
            'a token holding a line break',
            {
                'git-github.json': {
                    ...SIGNED_IN['git-github.json'],
                    token: `${TOKEN}\nusername=x`
                }
            },
            'get',
            'protocol=https\nhost=github.com\n\n'
        ]
    ])(
        'answers nothing for %s, exits 0 and writes no error (G135)',
        (_name, files, action, request) => {
            expect(helper(homeWith(files), action, request)).toEqual({
                status: 0,
                out: '',
                err: ''
            });
        }
    );

    it('answers nothing and exits 0 when the connect folder is not there (G135)', () => {
        const home = scratchDir('oculus-credentials-');
        expect(helper(home, 'get', 'protocol=https\nhost=github.com\n\n')).toEqual({
            status: 0,
            out: '',
            err: ''
        });
    });

    it.each([
        ['a key whose file is not there', ['gitlab', 'https://github.com']],
        ['an address the file was not granted for', ['github', 'https://github.example.org']],
        ['a key that is no file name', ['../github', 'https://github.com']]
    ])('answers nothing when named for %s, and exits 0 (G135)', (_name, named) => {
        const home = homeWith({
            ...SIGNED_IN,
            'git-other.json': { ...SIGNED_IN['git-github.json'], login: 'other' }
        });
        expect(
            helper(home, 'get', 'protocol=https\nhost=github.com\n\n', named as [string, string])
        ).toEqual({ status: 0, out: '', err: '' });
    });
});

/** The credentials the server context owns, over these rows and these places on the machine. */
function credentialsOf(places: CredentialPlaces & { rows: SignInRow[] }): GitCredentials {
    return gitCredentials(
        () => places.rows,
        () => places
    );
}

describe('the credential config of a git start and a terminal', () => {
    it('names the helper for each signed-in https address and holds no token (G135)', () => {
        const home = homeWith({
            ...SIGNED_IN,
            'git-gitlab.json': { client_id: 'abc', credential_address: 'https://gitlab.com' },
            'git-other.json': {
                token: TOKEN,
                login: 'x',
                credential_address: 'http://other.example'
            }
        });
        const places = {
            folder: join(home, '.oculus', 'connect'),
            engine: engineDir(),
            execPath: '/usr/bin/node',
            rows: [
                githubRow('https://github.com'),
                { key: 'gitlab', name: 'GitLab', credentialAddress: 'https://gitlab.com' },
                { key: 'other', name: 'Other', credentialAddress: 'https://other.example' }
            ]
        };
        const command = `!ELECTRON_RUN_AS_NODE=1 '/usr/bin/node' '${HELPER}' 'github' 'https://github.com'`;
        const args = credentialsOf(places).args();
        const env = credentialsOf(places).env();
        expect(args).toEqual([
            '-c',
            'credential.https://github.com.helper=',
            '-c',
            `credential.https://github.com.helper=${command}`
        ]);
        expect(env).toEqual([
            'GIT_CONFIG_COUNT=2',
            'GIT_CONFIG_KEY_0=credential.https://github.com.helper',
            'GIT_CONFIG_VALUE_0=',
            'GIT_CONFIG_KEY_1=credential.https://github.com.helper',
            `GIT_CONFIG_VALUE_1=${command}`
        ]);
        expect(JSON.stringify([args, env])).not.toContain(TOKEN);
    });

    it.each([
        ['no row of sign_in', []],
        ['a row of the key that names no credential address', [githubRow()]],
        ['a row of the key that names another address', [githubRow('https://github.example.org')]],
        [
            'a row of another key that names the address',
            [{ key: 'gitlab', name: 'GitLab', credentialAddress: 'https://github.com' }]
        ]
    ])('gives no pair for a saved token with %s (G135)', (_name, rows) => {
        const places = {
            folder: join(homeWith(SIGNED_IN), '.oculus', 'connect'),
            engine: engineDir(),
            execPath: '/usr/bin/node',
            rows
        };
        expect(credentialsOf(places).args()).toEqual([]);
        expect(credentialsOf(places).env()).toEqual([]);
    });

    it('sets no helper when a path holds a single quote, and says so on sign_in (G135)', () => {
        const home = homeWith(SIGNED_IN);
        const quoted = "/Applications/It's here/node";
        const places = {
            folder: join(home, '.oculus', 'connect'),
            engine: engineDir(),
            rows: [githubRow('https://github.com')]
        };
        expect(credentialsOf({ ...places, execPath: quoted }).args()).toEqual([]);
        expect(credentialsOf({ ...places, execPath: quoted }).env()).toEqual([]);
        const hub = plantScratch('oculus-credentials-hub-', {
            [HUB_FILE]: [
                'sign_in:',
                '  - key: github',
                '    name: GitHub',
                '    device_code: https://github.com/login/device/code',
                '    token: https://github.com/login/oauth/access_token',
                '    user: https://api.github.com/user',
                '    git_scope: repo',
                '    credential_address: https://github.com',
                ''
            ].join('\n')
        });
        const read = loadConfig(engineDir(), { hub });
        const where = { engine: engineDir(), hub, from: read.from };
        const found = helperFindings(where, read.config, quoted);
        expect(found.map((one) => [one.file, one.key])).toEqual([[join(hub, HUB_FILE), 'sign_in']]);
        expect(helperFindings(where, read.config, '/usr/bin/node')).toEqual([]);
        const none = loadConfig(engineDir()).config;
        expect(helperFindings({ engine: engineDir(), hub: null, from: {} }, none, quoted)).toEqual(
            []
        );
    });
});
