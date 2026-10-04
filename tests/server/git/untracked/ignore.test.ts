// What server/git/git-index.ts's addToGitignore writes to a repository's .gitignore: one line per
// path as VS Code's Add to .gitignore writes it.
//
// What this does NOT cover: the source tab the page then opens on the file.
// @module-tag slow: its cases start real git processes, so npm test leaves it out.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { addToGitignore } from '../../../../src/lib/server/git/git-index.ts';
import { it } from '../../../fixtures/scratch.ts';
import { isolateGit, scratchRepo } from '../refs/repo.ts';

isolateGit();

const read = (root: string): string => readFileSync(join(root, '.gitignore'), 'utf8');

describe('addToGitignore', () => {
    it('appends a path relative to the root, made when the file is missing', async () => {
        const root = scratchRepo();
        const answer = await addToGitignore(root, ['a/b.txt'], [root]);
        expect(answer.ok).toBe(true);
        expect(read(root)).toBe('a/b.txt\n');
    });
});
