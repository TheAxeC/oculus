// Layer 4, server test. Put the key on the cluster (put-key.ts): the remote command, run here by
// `sh -c` as the cluster's login shell runs it with HOME a scratch folder and the key on its input,
// makes `~/.ssh` and `~/.ssh/authorized_keys` at modes 0700 and 0600, appends the key as a line of
// its own without changing a line the file holds, and does not append it again when the file holds
// it; the ssh is started with password login alone and `BatchMode=no`, so a `BatchMode yes` of the
// reader's ssh config does not stop the password, the password in no argument, no variable and no
// input, and the helper is closed whichever way the ssh ends.
// @module-tag slow: the cases of the remote command start sh.

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, vi } from 'vitest';
import type { Askpass } from '../../../../../src/lib/server/machine/hpc/clusters/askpass.ts';
import {
    putKey,
    type PutDeps
} from '../../../../../src/lib/server/machine/hpc/clusters/put-key.ts';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';

const KEY = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOfthecase oculus-utwente';
const PASSWORD = 'the password of this case';

/** The fake ssh of a case: what putKey hands the ssh, and how it ends. */
type PutRun = PutDeps['run'];

/** A helper that serves nothing, for reading the command alone. */
const idleHelper = (): Askpass => ({ env: {}, asked: () => 0, close: () => Promise.resolve() });

/** The remote command putKey hands its ssh, the last of its arguments. */
let command = '';

beforeAll(async () => {
    const run = vi.fn<PutRun>(() => Promise.resolve({ code: 0, stderr: '' }));
    await putKey({ host: 'cluster.example.org' }, PASSWORD, KEY, {
        run,
        askpass: () => Promise.resolve(idleHelper())
    });
    command = run.mock.calls[0][0].at(-1) ?? '';
});

/** The remote command run by a POSIX shell with HOME the folder and the key line on its input. */
function authorize(home: string, input = `${KEY}\n`): number | null {
    return spawnSync('/bin/sh', ['-c', command], {
        input,
        env: { HOME: home, PATH: '/usr/bin:/bin' },
        encoding: 'utf8'
    }).status;
}

/** A home folder whose `~/.ssh/authorized_keys` holds the text. */
function homeWith(text: string): string {
    const home = scratchDir('oculus-put-key-');
    mkdirSync(join(home, '.ssh'), { mode: 0o700 });
    writeFileSync(join(home, '.ssh', 'authorized_keys'), text, { mode: 0o600 });
    return home;
}

const keysOf = (home: string): string =>
    readFileSync(join(home, '.ssh', 'authorized_keys'), 'utf8');
const modeOf = (path: string): number => statSync(path).mode & 0o777;

describe('the remote command of Put the key', () => {
    it('makes ~/.ssh at 0700 and authorized_keys at 0600 holding the key, once over two runs (G135)', () => {
        const home = scratchDir('oculus-put-key-');
        expect(authorize(home)).toBe(0);
        expect(authorize(home)).toBe(0);
        expect(keysOf(home)).toBe(`${KEY}\n`);
        expect(modeOf(join(home, '.ssh'))).toBe(0o700);
        expect(modeOf(join(home, '.ssh', 'authorized_keys'))).toBe(0o600);
    });

    it.each([
        ['ending in a line break', 'ssh-rsa AAAA one\n# a comment\n'],
        ['ending without one', 'ssh-rsa AAAA one\nssh-ed25519 BBBB two']
    ])(
        'appends the key after the lines of a file %s and changes none of them (G135)',
        (_name, held) => {
            const home = homeWith(held);
            expect(authorize(home)).toBe(0);
            const after = keysOf(home);
            expect(after.startsWith(held)).toBe(true);
            expect(after.split('\n').filter((line) => line !== '')).toEqual([
                ...held.split('\n').filter((line) => line !== ''),
                KEY
            ]);
        }
    );

    it('leaves a file that holds the key as it is (G135)', () => {
        const held = `ssh-rsa AAAA one\n${KEY}\nssh-ed25519 BBBB two\n`;
        const home = homeWith(held);
        expect(authorize(home)).toBe(0);
        expect(keysOf(home)).toBe(held);
    });

    it('writes nothing for an empty input (G135)', () => {
        const home = homeWith('ssh-rsa AAAA one\n');
        expect(authorize(home, '')).toBe(2);
        expect(keysOf(home)).toBe('ssh-rsa AAAA one\n');
    });
});

describe('the ssh of Put the key', () => {
    /** A helper whose asks the case sets, and whose close is recorded. */
    function fakeHelper(asked: number): Askpass & { closed: () => boolean } {
        let closed = false;
        return {
            env: { SSH_ASKPASS: '/tmp/oculus-askpass-x/askpass', SSH_ASKPASS_REQUIRE: 'force' },
            asked: () => asked,
            close: () => {
                closed = true;
                return Promise.resolve();
            },
            closed: () => closed
        };
    }

    it('logs in by password alone, with the password in no argument, variable or input (G135)', async () => {
        const helper = fakeHelper(1);
        const askpass = vi.fn(() => Promise.resolve(helper));
        const run = vi.fn<PutRun>(() => Promise.resolve({ code: 0, stderr: '' }));
        const connection = { host: 'cluster.example.org', user: 'me', keyFile: '/home/me/.ssh/k' };
        expect(await putKey(connection, PASSWORD, `${KEY}\n`, { run, askpass })).toEqual({
            put: true
        });
        expect(askpass).toHaveBeenCalledWith(PASSWORD);
        const [args, env, input] = run.mock.calls[0];
        expect(args).toEqual([
            '-o',
            'ConnectTimeout=8',
            '-o',
            'ControlMaster=no',
            '-o',
            'ControlPath=none',
            '-o',
            'BatchMode=no',
            '-o',
            'StrictHostKeyChecking=yes',
            '-o',
            'PubkeyAuthentication=no',
            '-o',
            'PreferredAuthentications=password,keyboard-interactive',
            '-o',
            'NumberOfPasswordPrompts=1',
            '-l',
            'me',
            'cluster.example.org',
            command
        ]);
        expect(args).not.toContain('BatchMode=yes');
        expect(args).not.toContain('/home/me/.ssh/k');
        expect(env).toEqual(helper.env);
        expect(input).toBe(`${KEY}\n`);
        expect(JSON.stringify([args, env, input])).not.toContain(PASSWORD);
        expect(helper.closed()).toBe(true);
    });

    it('closes the helper when the ssh fails to start (G135)', async () => {
        const helper = fakeHelper(0);
        const run = vi.fn<PutRun>(() => Promise.reject(new Error('spawn ssh ENOENT')));
        await expect(
            putKey({ host: 'cluster.example.org' }, PASSWORD, KEY, {
                run,
                askpass: () => Promise.resolve(helper)
            })
        ).rejects.toThrow('spawn ssh ENOENT');
        expect(helper.closed()).toBe(true);
    });

    it.each([
        [
            'a second ask',
            2,
            'Permission denied (keyboard-interactive).',
            { moreThanPassword: true }
        ],
        [
            'no ask and no password method',
            0,
            'me@host: Permission denied (publickey).',
            { noPassword: true }
        ],
        [
            'a refused password',
            1,
            'me@host: Permission denied (password).\n',
            { failed: 'me@host: Permission denied (password).' }
        ]
    ])('tells %s apart (G135)', async (_name, asked, stderr, expected) => {
        const helper = fakeHelper(asked);
        const run = vi.fn<PutRun>(() => Promise.resolve({ code: 255, stderr }));
        const done = await putKey({ host: 'h' }, PASSWORD, KEY, {
            run,
            askpass: () => Promise.resolve(helper)
        });
        expect(done).toEqual(expected);
        expect(helper.closed()).toBe(true);
    });
});
