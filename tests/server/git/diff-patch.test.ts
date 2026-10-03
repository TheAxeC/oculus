// The patch the diff pane cuts from a file's two versions
// (state/sources/repositories/diff/diff-patch.ts), over the hunks and chosen rows of diff-hunks.ts
// and the line changes Monaco draws, applied by the real git through the index write
// (server/git/git-index.ts's applyHunk). Each case reads the file through GET /api/git as the pane
// does, cuts the patch and reads what the index or the worktree holds after. Every repository is
// made in the system temporary directory.
// @module-tag slow: its cases start real git processes, so npm test leaves it out.

import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect } from 'vitest';
import { allowedRoots } from '../../../src/lib/server/git/git-write.ts';
import { applyHunk } from '../../../src/lib/server/git/git-index.ts';
import { handleGitGet } from '../../../src/lib/server/git/git-reads.ts';
import {
    chosenRows,
    hunkRows,
    hunksOf,
    type ChosenRows,
    type LineSelection
} from '../../../src/lib/state/sources/repositories/diff/diff-hunks.ts';
import {
    sidesPatch,
    type PatchMode
} from '../../../src/lib/state/sources/repositories/diff/diff-patch.ts';
import type { DiffSides } from '../../../src/lib/data/model/index.ts';
import { monacoLineChanges } from '../../ui/controls/editor/monaco-diff.ts';
import { gitText as git, put, repositoryIn } from '../root/watch/repos.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

let repo = '';
let ROOTS: string[] = [];

beforeEach(() => {
    repo = repositoryIn(scratchDir('oculus-diff-patch-'), 'repo');
    ROOTS = allowedRoots([repo]);
});

function read(root: string, name: string): string {
    return readFileSync(join(root, name), 'utf8');
}

/** The porcelain of a repository, one line per path. */
function status(root: string): string[] {
    return git(root, 'status', '--porcelain')
        .split('\n')
        .filter((line) => line.trim() !== '');
}

/** The unstaged diff of kept.txt as git prints it. */
function diffOf(root: string): string {
    return git(root, 'diff', '--', 'kept.txt');
}

describe('the patch the diff pane cuts, applied by git', () => {
    /** Twenty numbered lines, the file the cases below change. */
    const TWENTY = Array.from({ length: 20 }, (_, at) => `l${at + 1}\n`).join('');

    /** TWENTY with the lines at the given numbers rewritten. */
    function rewritten(...numbers: number[]): string {
        return TWENTY.split('\n')
            .map((line, at) => (numbers.includes(at + 1) ? `${line} changed` : line))
            .join('\n');
    }

    /** Commit kept.txt as the given text, the version the index and HEAD then hold. */
    function base(text: string = TWENTY): void {
        put(repo, 'kept.txt', text);
        git(repo, 'commit', '-qam', 'Base');
    }

    /** kept.txt's one file as the pane reads it through the endpoint, staged or not. */
    async function sidesOf(staged = false, path = 'kept.txt'): Promise<DiffSides> {
        const query = new URLSearchParams({ diff: repo, path, staged: staged ? '1' : '0' });
        const response = await handleGitGet(new Request(`http://localhost/api/git?${query}`), {
            rootsFor: () => ROOTS
        });
        const body = (await response.json()) as { files?: DiffSides[] };
        expect(body.files ?? [], JSON.stringify(body)).toHaveLength(1);
        return (body.files ?? [])[0];
    }

    /**
     * The patch of the chosen rows, over the line changes Monaco draws for the file's two texts.
     */
    function patchOf(file: DiffSides, rows: ChosenRows, mode: PatchMode): string {
        return sidesPatch(file, monacoLineChanges(file.original, file.modified), rows, mode);
    }

    /** A whole line selected. */
    function picked(line: number): LineSelection {
        return { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 3 };
    }

    /** The rows a selection chooses in the file's one hunk. */
    function rowsOf(
        sides: DiffSides,
        modified: LineSelection[],
        original: LineSelection[]
    ): ChosenRows {
        const [hunk] = hunksOf(monacoLineChanges(sides.original, sides.modified));
        return chosenRows(hunk, modified, original);
    }

    /** Every row of the file's hunks, one hunk after another. */
    function hunksIn(sides: DiffSides): ChosenRows[] {
        return hunksOf(monacoLineChanges(sides.original, sides.modified)).map(hunkRows);
    }

    it('stages one hunk of two, leaving the index equal to the worktree there and the other unstaged', async () => {
        base();
        put(repo, 'kept.txt', rewritten(2, 15));
        const sides = await sidesOf();
        const [first, second] = hunksIn(sides);
        expect(second).toBeDefined();
        const answer = await applyHunk(repo, patchOf(sides, first, 'stage'), 'stage', ROOTS);
        expect(answer.ok, answer.error).toBe(true);
        expect(git(repo, 'show', ':kept.txt')).toBe(rewritten(2));
        expect(diffOf(repo)).toContain('+l15 changed');
        expect(diffOf(repo)).not.toContain('l2 changed');
    });

    it('stages one added line of three, and one removed line of two', async () => {
        base();
        put(repo, 'kept.txt', TWENTY.replace('l3\n', 'l3\nA\nB\nC\n'));
        const added = await sidesOf();
        const cut = patchOf(added, rowsOf(added, [picked(5)], []), 'stage');
        expect((await applyHunk(repo, cut, 'stage', ROOTS)).ok).toBe(true);
        expect(git(repo, 'show', ':kept.txt')).toBe(TWENTY.replace('l3\n', 'l3\nB\n'));

        git(repo, 'restore', '--staged', 'kept.txt');
        put(repo, 'kept.txt', TWENTY.replace('l4\nl5\n', ''));
        const removed = await sidesOf();
        const out = patchOf(removed, rowsOf(removed, [], [picked(5)]), 'stage');
        expect((await applyHunk(repo, out, 'stage', ROOTS)).ok).toBe(true);
        expect(git(repo, 'show', ':kept.txt')).toBe(TWENTY.replace('l5\n', ''));
    });

    it('unstages one staged line and leaves the other staged', async () => {
        base();
        put(repo, 'kept.txt', rewritten(2, 3));
        git(repo, 'add', 'kept.txt');
        const staged = await sidesOf(true);
        const cut = patchOf(staged, rowsOf(staged, [picked(3)], []), 'unstage');
        expect((await applyHunk(repo, cut, 'unstage', ROOTS)).ok).toBe(true);
        expect(git(repo, 'show', ':kept.txt')).toBe(rewritten(2));
        expect(read(repo, 'kept.txt')).toBe(rewritten(2, 3));
    });

    it('stages the first of two changed lines and keeps each line in its place', async () => {
        base();
        put(repo, 'kept.txt', rewritten(2, 3));
        const sides = await sidesOf();
        const cut = patchOf(sides, rowsOf(sides, [picked(2)], []), 'stage');
        expect((await applyHunk(repo, cut, 'stage', ROOTS)).ok).toBe(true);
        expect(git(repo, 'show', ':kept.txt')).toBe(rewritten(2));
    });

    it('reverts one line in the worktree and leaves the other change', async () => {
        base();
        put(repo, 'kept.txt', rewritten(2, 3));
        const sides = await sidesOf();
        const cut = patchOf(sides, rowsOf(sides, [picked(2)], []), 'revert');
        expect((await applyHunk(repo, cut, 'revert', ROOTS)).ok).toBe(true);
        expect(read(repo, 'kept.txt')).toBe(rewritten(3));
    });

    it('stages a hunk at the first line, and one at a last line with no newline', async () => {
        base();
        put(repo, 'kept.txt', rewritten(1));
        const top = await sidesOf();
        const [first] = hunksIn(top);
        expect((await applyHunk(repo, patchOf(top, first, 'stage'), 'stage', ROOTS)).ok).toBe(true);
        expect(git(repo, 'show', ':kept.txt')).toBe(rewritten(1));

        const unended = TWENTY.replace('l20\n', 'the end');
        put(repo, 'kept.txt', unended);
        const bottom = await sidesOf();
        // The worktree also takes line 1's change back, a hunk of its own left unstaged.
        const cut = patchOf(bottom, hunksIn(bottom).at(-1) ?? { removed: [], added: [] }, 'stage');
        expect(cut).toContain('\\ No newline at end of file');
        expect((await applyHunk(repo, cut, 'stage', ROOTS)).ok).toBe(true);
        expect(git(repo, 'show', ':kept.txt')).toBe(rewritten(1).replace('l20\n', 'the end'));
    });

    it('unstages a new file whole, and stages a deletion whole', async () => {
        put(repo, 'fresh.txt', 'fresh\nlines\n');
        git(repo, 'add', 'fresh.txt');
        const created = await sidesOf(true, 'fresh.txt');
        const [made] = hunksIn(created);
        const back = patchOf(created, made, 'unstage');
        expect((await applyHunk(repo, back, 'unstage', ROOTS)).ok).toBe(true);
        expect(status(repo)).toContain('?? fresh.txt');

        rmSync(join(repo, 'kept.txt'));
        const deleted = await sidesOf();
        const [gone] = hunksIn(deleted);
        const cut = patchOf(deleted, gone, 'stage');
        expect((await applyHunk(repo, cut, 'stage', ROOTS)).ok).toBe(true);
        expect(status(repo)).toContain('D  kept.txt');
    });

    it('stages two chosen changes four lines apart as one hunk, and a choice of nothing as no patch', async () => {
        base();
        put(repo, 'kept.txt', rewritten(5, 10));
        const sides = await sidesOf();
        const cut = patchOf(sides, { removed: [5, 10], added: [5, 10] }, 'stage');
        expect(cut.match(/^@@ /gm)).toHaveLength(1);
        expect((await applyHunk(repo, cut, 'stage', ROOTS)).ok).toBe(true);
        expect(git(repo, 'show', ':kept.txt')).toBe(rewritten(5, 10));
        expect(patchOf(sides, { removed: [], added: [] }, 'stage')).toBe('');
    });
});
