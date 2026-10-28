// Layer 4, server test. The one-shot password helper of Put the key on the cluster (askpass.ts):
// the ssh's environment gains `SSH_ASKPASS` and `SSH_ASKPASS_REQUIRE` alone, neither holding the
// password; the folder is at mode 0700 and the password is in none of its files; the program ssh
// starts prints the password at the first ask and nothing, exiting non-zero, at the second, and
// the asks are counted; the close removes the folder; a program path holding a single quote makes
// nothing. The helper's program is run here as ssh runs it, with no argument.
// @module-tag slow: every case starts the helper's program, which starts node.

import { execFile } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { openAskpass } from '../../../../../src/lib/server/machine/hpc/clusters/askpass.ts';

const PASSWORD = 'the password of this case';

/** The helper's program run as ssh runs it: what it printed and how it ended. */
function ask(program: string): Promise<{ code: number; out: string }> {
    return new Promise((answer) => {
        execFile(program, [], { env: { PATH: process.env.PATH ?? '' } }, (error, stdout) => {
            const code = error === null ? 0 : typeof error.code === 'number' ? error.code : -1;
            answer({ code, out: stdout });
        });
    });
}

/** The permission bits of a path. */
const modeOf = (path: string): number => statSync(path).mode & 0o777;

describe('the password helper of Put the key', () => {
    it('serves the password once over its socket and keeps it out of the environment and the files (G135)', async () => {
        const helper = await openAskpass(PASSWORD);
        const program = helper.env.SSH_ASKPASS;
        const dir = dirname(program);
        try {
            expect(Object.keys(helper.env).sort()).toEqual(['SSH_ASKPASS', 'SSH_ASKPASS_REQUIRE']);
            expect(helper.env.SSH_ASKPASS_REQUIRE).toBe('force');
            expect(JSON.stringify(helper.env)).not.toContain(PASSWORD);
            expect(modeOf(dir)).toBe(0o700);
            expect(modeOf(program)).toBe(0o700);
            expect(modeOf(join(dir, 'socket'))).toBe(0o600);
            for (const name of readdirSync(dir).filter((one) => one !== 'socket')) {
                expect(readFileSync(join(dir, name), 'utf8')).not.toContain(PASSWORD);
            }
            expect(helper.asked()).toBe(0);
            expect(await ask(program)).toEqual({ code: 0, out: `${PASSWORD}\n` });
            const second = await ask(program);
            expect(second.out).toBe('');
            expect(second.code).not.toBe(0);
            expect(helper.asked()).toBe(2);
        } finally {
            await helper.close();
        }
        expect(existsSync(dir)).toBe(false);
    });

    it('makes nothing for a program path holding a single quote (G135)', async () => {
        const before = readdirSync(tmpdir()).filter((one) => one.startsWith('oculus-askpass-'));
        await expect(openAskpass(PASSWORD, "/Applications/It's here/node")).rejects.toThrow(
            'the program path holds a single quote'
        );
        const after = readdirSync(tmpdir()).filter((one) => one.startsWith('oculus-askpass-'));
        expect(after).toEqual(before);
    });
});
