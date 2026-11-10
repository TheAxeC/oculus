// Layer 1, data test. The worktree rules of data/helpers/worktrees.ts under a worktrees folder the
// setting `git.worktrees_dir` names: where a worktree goes, which paths are one, and whether a
// .gitignore keeps the folder out. The folder is not the shipped one, so a folder written in code
// instead of taken from the argument fails a row.

import { describe, expect } from 'vitest';
import {
    ignoreRule,
    ignoresWorktrees,
    isWorktreePath,
    worktreePath
} from '../../../src/lib/data/helpers/worktrees.ts';
import { it } from '../../fixtures/scratch.ts';

const DIR = 'kept/trees';

describe('the worktree rules under the configured folder', () => {
    it('places a worktree in the folder and takes only its direct folders for worktrees (G13)', () => {
        expect(worktreePath('/repo/', 'one', DIR)).toBe('/repo/kept/trees/one');
        expect([
            isWorktreePath('/repo', '/repo/kept/trees/one', DIR),
            isWorktreePath('/repo', '/repo/kept/trees/one/deeper', DIR),
            isWorktreePath('/repo', '/repo/.agents/worktrees/one', DIR)
        ]).toEqual([true, false, false]);
    });

    it('reads the folder ignored with or without its slashes, and a comment as nothing (G13)', () => {
        expect(ignoreRule(DIR)).toBe('/kept/trees/');
        expect([
            ignoresWorktrees('/kept/trees/\n', DIR),
            ignoresWorktrees('kept/trees\n', DIR),
            ignoresWorktrees('# /kept/trees/\n', DIR),
            ignoresWorktrees('/.agents/worktrees/\n', DIR)
        ]).toEqual([true, true, false, false]);
    });
});
