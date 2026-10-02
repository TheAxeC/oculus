// What server/git/git-write.ts's commit does in a repository with no configured identity: git is
// told `user.useConfigOnly` through its environment, so it refuses with its own message instead of
// taking a name and an address guessed from the machine, and the argument vector is the one the
// write gate reads, `-C <root> commit ...`.
//
// The `EMAIL` variable stands for the address git guesses when it may: without the setting the
// first case would commit as that address.
//
// What this does NOT cover: an identity set only in the global configuration, which this file
// replaces by an empty one on purpose.

import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import { commit } from '../../../../src/lib/server/git/git-write.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { git, isolateGit, put } from './repo.ts';

/** Every argument vector the module ran with its environment, recorded by the mock below. */
const ran = vi.hoisted(() => [] as { args: string[]; env: Record<string, string | undefined> }[]);
vi.mock('node:child_process', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:child_process')>();
    return {
        ...actual,
        execFile: ((file: string, args: string[], ...rest: unknown[]) => {
            const options = (rest[0] ?? {}) as { env?: Record<string, string | undefined> };
            if ((new Error().stack ?? '').includes('/src/lib/server/')) {
                ran.push({ args, env: options.env ?? {} });
            }
            return (actual.execFile as (...held: unknown[]) => unknown)(file, args, ...rest);
        }) as typeof actual.execFile
    };
});

isolateGit();

/** A repository with a staged file and no `user.name` or `user.email` anywhere. */
function anonymous(): string {
    const root = scratchDir('oculus-identity-');
    git(root, 'init', '-q', '-b', 'main');
    git(root, 'config', 'commit.gpgsign', 'false');
    put(root, 'a.txt', 'a\n');
    git(root, 'add', 'a.txt');
    return root;
}

/** An address git would take for the committer when it is allowed to guess one. */
const GUESSABLE = 'guess@example.invalid';

describe('commit without a configured identity', () => {
    let held: string | undefined;
    beforeEach(() => {
        held = process.env.EMAIL;
        process.env.EMAIL = GUESSABLE;
    });
    afterEach(() => {
        if (held === undefined) delete process.env.EMAIL;
        else process.env.EMAIL = held;
    });

    it('is refused with git own message and makes no commit', async () => {
        const root = anonymous();
        const answer = await commit(root, 'First', [root]);
        expect(answer.ok).toBe(false);
        expect(answer.error).toBe('Author identity unknown');
        expect(() => git(root, 'rev-parse', '--verify', 'HEAD')).toThrow();
    });

    it('commits once the repository names an identity', async () => {
        const root = anonymous();
        git(root, 'config', 'user.name', 'Nobody');
        git(root, 'config', 'user.email', 'nobody@example.invalid');
        const answer = await commit(root, 'First', [root]);
        expect(answer.ok).toBe(true);
        expect(git(root, 'log', '-1', '--format=%an <%ae>%n%s').trim()).toBe(
            'Nobody <nobody@example.invalid>\nFirst'
        );
    });

    it('runs the vector the write gate reads, with the setting in the environment only', async () => {
        const root = anonymous();
        git(root, 'config', 'user.name', 'Nobody');
        git(root, 'config', 'user.email', 'nobody@example.invalid');
        ran.length = 0;
        await commit(root, 'First', [root]);
        const call = ran.find((one) => one.args[2] === 'commit');
        expect(call?.args.slice(0, 3)).toEqual(['-C', root, 'commit']);
        expect(call?.args).not.toContain('-c');
        expect(call?.args.join(' ')).not.toContain('useConfigOnly');
        expect(call?.env).toMatchObject({
            GIT_CONFIG_COUNT: '1',
            GIT_CONFIG_KEY_0: 'user.useConfigOnly',
            GIT_CONFIG_VALUE_0: 'true'
        });
    });
});
