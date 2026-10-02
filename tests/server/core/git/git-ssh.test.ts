// Layer 2, server tests. The ssh command a repository names, `core.sshCommand`, as
// server/core/git/reads.ts reads it for the automatic fetch. The gate over the vector it runs is
// tests/server/core/git/git.test.ts's.

import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect } from 'vitest';
import { sshCommand } from '../../../../src/lib/server/core/git/reads.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { gitText as git, repositoryIn } from '../../root/watch/repos.ts';

let dir = '';
let repo = '';

beforeEach(() => {
    dir = scratchDir('oculus-git-ssh-');
    repo = repositoryIn(dir, 'repo');
});

describe('the configured ssh command', () => {
    /** Runs a read without the machine's own git configuration, so only the repository speaks. */
    function alone<T>(read: () => T): T {
        const saved = [process.env.GIT_CONFIG_GLOBAL, process.env.GIT_CONFIG_NOSYSTEM];
        process.env.GIT_CONFIG_GLOBAL = '/dev/null';
        process.env.GIT_CONFIG_NOSYSTEM = '1';
        try {
            return read();
        } finally {
            const [global, system] = saved;
            if (global === undefined) delete process.env.GIT_CONFIG_GLOBAL;
            else process.env.GIT_CONFIG_GLOBAL = global;
            if (system === undefined) delete process.env.GIT_CONFIG_NOSYSTEM;
            else process.env.GIT_CONFIG_NOSYSTEM = system;
        }
    }

    it('answers the value core.sshCommand holds, without its line end', () => {
        git(repo, 'config', 'core.sshCommand', 'ssh -i /some/key -o IdentitiesOnly=yes');
        expect(alone(() => sshCommand(repo))).toBe('ssh -i /some/key -o IdentitiesOnly=yes');
    });

    it('answers the empty text when the key is unset', () => {
        expect(alone(() => sshCommand(repo))).toBe('');
    });

    it('answers the empty text for a folder that is no repository', () => {
        const plain = join(dir, 'plain');
        mkdirSync(plain);
        expect(alone(() => sshCommand(plain))).toBe('');
    });

    it('answers null when the read fails, for a root that does not exist', () => {
        expect(alone(() => sshCommand(join(dir, 'missing')))).toBeNull();
    });

    it('leaves the repository exactly as it was', () => {
        git(repo, 'config', 'core.sshCommand', 'ssh');
        const before = readFileSync(join(repo, '.git', 'config'), 'utf8');
        alone(() => sshCommand(repo));
        expect(readFileSync(join(repo, '.git', 'config'), 'utf8')).toBe(before);
    });
});
