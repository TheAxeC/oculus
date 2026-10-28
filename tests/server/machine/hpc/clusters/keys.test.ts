// Layer 4, server test. Make key of Account setup's cluster section (keys.ts): a key file or its
// `.pub` that is there is used as it is, with nothing run and no byte changed; a missing one is
// made by `ssh-keygen` from an argument vector, its folder made at mode 0700; and only a path under
// the home folder whose last part is a plain name not ending in `.pub` may be made. No `ssh-keygen`
// starts: the run is injected.

import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import {
    makeablePath,
    makeKey,
    type KeyRun
} from '../../../../../src/lib/server/machine/hpc/clusters/keys.ts';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';

const made = (): ReturnType<KeyRun> => Promise.resolve({ stdout: '', stderr: '', ok: true });

describe('Make key', () => {
    it.each([
        ['the key file', 'k'],
        ['its .pub alone', 'k.pub']
    ])(
        'uses %s that is there as it is, running nothing and changing no byte (G135)',
        async (_name, there) => {
            const home = scratchDir('oculus-keys-');
            mkdirSync(join(home, '.ssh'));
            writeFileSync(join(home, '.ssh', there), 'held\n');
            const run = vi.fn<KeyRun>(made);
            const path = join(home, '.ssh', 'k');
            expect(await makeKey(path, 'ed25519', 'utwente', run)).toEqual({ exists: path });
            expect(run).not.toHaveBeenCalled();
            expect(readFileSync(join(home, '.ssh', there), 'utf8')).toBe('held\n');
        }
    );

    it('runs ssh-keygen from an argument vector with its input closed, the folder made at 0700 (G135)', async () => {
        const home = scratchDir('oculus-keys-');
        const run = vi.fn<KeyRun>(made);
        const path = join(home, '.ssh', 'id_ed25519_utwente');
        expect(await makeKey(path, 'ed25519', 'utwente', run)).toEqual({ made: path });
        expect(run.mock.calls).toEqual([
            ['ssh-keygen', ['-t', 'ed25519', '-f', path, '-N', '', '-C', 'oculus-utwente']]
        ]);
        expect(statSync(join(home, '.ssh')).mode & 0o777).toBe(0o700);
    });

    it('answers the first line of what ssh-keygen wrote when it fails (G135)', async () => {
        const home = scratchDir('oculus-keys-');
        const run = vi.fn<KeyRun>(() =>
            Promise.resolve({
                stdout: '',
                stderr: '\nSaving key failed: No such file\nmore\n',
                ok: false
            })
        );
        expect(await makeKey(join(home, 'k'), 'rsa', 'b', run)).toEqual({
            failed: 'Saving key failed: No such file'
        });
    });
});

describe('the key file Make key may make', () => {
    const home = '/home/me';

    it.each([
        ['~/.ssh/id_ed25519_utwente', '/home/me/.ssh/id_ed25519_utwente'],
        ['/home/me/keys/a.b-c_d', '/home/me/keys/a.b-c_d'],
        ['~/.ssh/k.pub', null],
        ['/etc/ssh/k', null],
        ['~/../other/.ssh/k', null],
        ['.ssh/k', null],
        ["~/.ssh/it's", null],
        ['~/.ssh/k;rm', null],
        ['~/', null]
    ])('reads %s as %s (G135)', (value, path) => {
        expect(makeablePath(value, home)).toBe(path);
    });
});
