// Layer 2, client-state tests. The diff pane's keys and the keeping of its view states
// (state/sources/repositories/repositories.ts): each file of a diff keyed by its path and its place
// among the entries of that path, and the view states the editors say written to the pane's
// instance state after a pause, never after the pane has closed; and the state a pane holds, the
// file or side it is over and the address it reads.

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    diffActs,
    diffState,
    diffUrl,
    fileDiffUrl,
    fileKeys,
    heldDiff,
    viewKeeper,
    worktreeDiffUrl,
    type DiffView
} from '../../../../../src/lib/state/sources/repositories/repositories.ts';
import {
    previewKey,
    previewSubject
} from '../../../../../src/lib/state/sources/repositories/replace-preview.ts';
import type { DiffSides } from '../../../../../src/lib/data/model/index.ts';

/** One entry of a diff at a path, the way git lists it. */
function entry(oldPath: string, newPath: string): DiffSides {
    return {
        oldPath,
        newPath,
        head: [`diff --git a/${oldPath} b/${newPath}`],
        binary: false,
        encoded: true,
        original: '',
        modified: ''
    };
}

const ROOT = '/hub';

afterEach(() => {
    vi.useRealTimers();
});

describe('the keys of a diff', () => {
    it('keys a path git lists twice, as a type change is, by its place among its entries', () => {
        // A file replaced by a symbolic link: deleted, then added, both at x.
        expect(fileKeys([entry('x', ''), entry('', 'x')])).toEqual(['x', 'x\u00002']);
        // Revert: a `#` separator, and the file at `x#2` shares its key with the second entry of x.
        expect(fileKeys([entry('x', ''), entry('', 'x'), entry('x#2', 'x#2')])).toEqual([
            'x',
            'x\u00002',
            'x#2'
        ]);
        expect(fileKeys([entry('a', 'a'), entry('old', 'b')])).toEqual(['a', 'b']);
    });
});

describe('the view states kept', () => {
    it('writes the view states said in one pause as one write', () => {
        vi.useFakeTimers();
        const written: DiffView[] = [];
        const keeper = viewKeeper(
            () => ({ mode: 'inline' }),
            (state) => written.push(state),
            400
        );
        keeper.viewed('a', { top: 1 });
        keeper.viewed('b', { top: 2 });
        vi.advanceTimersByTime(400);
        expect(written).toEqual([
            {
                mode: 'inline',
                views: { a: { top: 1 }, b: { top: 2 } },
                unchanged: 'folded',
                folded: []
            }
        ]);
    });

    it('writes nothing once the tab has closed, whatever was pending or is said after', () => {
        vi.useFakeTimers();
        const written: DiffView[] = [];
        const keeper = viewKeeper(
            () => null,
            (state) => written.push(state),
            400
        );
        keeper.viewed('a', { top: 1 });
        keeper.close(() => false);
        // An editor torn down after the pane says its view state on its way out.
        keeper.viewed('b', { top: 2 });
        keeper.keep();
        vi.advanceTimersByTime(1000);
        expect(written).toEqual([]);
    });

    it('keeps the last view states of a pane torn down while its tab stays open', () => {
        // Revert: `close` dropping what is pending and what is said after whatever its answer,
        // and nothing is written.
        vi.useFakeTimers();
        const written: DiffView[] = [];
        let held: DiffView | null = null;
        const keeper = viewKeeper(
            () => held,
            (state) => {
                held = state;
                written.push(state);
            },
            400
        );
        // A scroll said within the pause, then the page switched away.
        keeper.viewed('a', { top: 1 });
        keeper.close(() => true);
        // The editor torn down after the pane says its caret on its way out.
        keeper.viewed('a', { top: 1, caret: 3 });
        vi.advanceTimersByTime(1000);
        expect(written).toHaveLength(2);
        expect(held).toEqual({
            mode: 'side',
            views: { a: { top: 1, caret: 3 } },
            unchanged: 'folded',
            folded: []
        });
    });
});

describe('what one diff pane is over', () => {
    it('names the file and the side, so two sides of one path are two panes', () => {
        const changed = diffState(
            { root: ROOT, path: 'a.txt', staged: false, worktree: false },
            'a'
        );
        const staged = diffState({ root: ROOT, path: 'a.txt', staged: true, worktree: false }, 'a');
        expect(changed.id).not.toBe(staged.id);
        expect(changed.label).toBe('a');
        expect(
            diffState({ root: ROOT, path: 'a.txt', staged: false, worktree: false }, 'a').id
        ).toBe(changed.id);
    });

    it('reads a file from the diff address and a worktree from its own', () => {
        expect(fileDiffUrl(ROOT, 'a b.txt', true)).toBe(
            '/api/git?diff=%2Fhub&path=a+b.txt&staged=1'
        );
        expect(fileDiffUrl(ROOT, 'a.txt', false)).toBe('/api/git?diff=%2Fhub&path=a.txt&staged=0');
        // The repository is named beside the worktree: a worktree of the hub is a root of its own
        // on the channel, so the server never works the repository out from the path.
        expect(worktreeDiffUrl(ROOT, '/hub/.agents/worktrees/one')).toBe(
            '/api/git?worktree=%2Fhub%2F.agents%2Fworktrees%2Fone&root=%2Fhub'
        );
        expect(
            diffUrl({
                root: ROOT,
                path: '/hub/.agents/worktrees/one',
                staged: false,
                worktree: true
            })
        ).toBe(worktreeDiffUrl(ROOT, '/hub/.agents/worktrees/one'));
    });
});

describe('a diff pane over two files', () => {
    const subject = {
        root: 'hub',
        path: 'notes/a.md',
        staged: false,
        worktree: false,
        against: { root: 'work', path: 'old/b.md' }
    };

    it('reads the comparison address, the file first and the file selected for compare second', () => {
        expect(diffUrl(subject)).toBe(
            '/api/ops?root=hub&path=notes%2Fa.md&withRoot=work&withPath=old%2Fb.md'
        );
    });

    it('keeps a well-formed against and drops a malformed one', () => {
        expect(
            heldDiff({ root: 'hub', path: 'a', against: { root: 'work', path: 'b' } })
        ).toMatchObject({
            against: { root: 'work', path: 'b' }
        });
        for (const against of [
            { root: 'work' },
            { path: 'b' },
            { root: 7, path: 'b' },
            { root: 'work', path: 7 },
            { root: '', path: 'b' }
        ]) {
            expect(
                heldDiff({ root: 'hub', path: 'a', against }).against,
                JSON.stringify(against)
            ).toBeUndefined();
        }
        expect(heldDiff({ root: 'hub', path: 'a' }).against).toBeUndefined();
    });

    it('does not act on hunks of a comparison', () => {
        expect(diffActs(subject)).toBe(false);
        expect(diffActs({ ...subject, against: undefined })).toBe(true);
    });

    it('makes two comparisons two panes, and neither the pane of the file alone', () => {
        const one = diffState(subject, 'a vs b');
        const other = diffState(
            { ...subject, against: { root: 'work', path: 'old/c.md' } },
            'a vs c'
        );
        const swapped = diffState(
            { ...subject, path: 'old/b.md', against: { root: 'hub', path: 'notes/a.md' } },
            'b vs a'
        );
        const alone = diffState({ ...subject, against: undefined }, 'a');
        expect(new Set([one.id, other.id, swapped.id, alone.id]).size).toBe(4);
        expect(diffState(subject, 'a vs b').id).toBe(one.id);
    });
});

describe('a diff pane previewing a replace', () => {
    const query = { q: 'foo', word: false, case: true, regex: true, under: 'src' };
    const file = { root: 'hub', path: 'src/a.ts', hits: [{ line: 3, at: 4 }] };
    const subject = previewSubject(file, { query, replace: 'bar', preserve: true }, 3);

    it('carries the query, the replace text, Preserve Case and the hits of the file, opened at the hit', () => {
        expect(subject).toEqual({
            root: 'hub',
            path: 'src/a.ts',
            staged: false,
            worktree: false,
            line: 3,
            replace: { query, replace: 'bar', preserveCase: true, hits: [{ line: 3, at: 4 }] }
        });
    });

    it('acts on no hunks of a preview', () => {
        expect(diffActs(subject)).toBe(false);
    });

    it('is one pane for a file whatever the replace text, and reads again when the replace text changes', () => {
        const other = previewSubject(file, { query, replace: 'baz', preserve: true }, 3);
        expect(diffState(other, 'x').id).toBe(diffState(subject, 'x').id);
        expect(diffState(subject, 'x').id).not.toBe(
            diffState({ ...subject, replace: undefined }, 'x').id
        );
        expect(previewKey(other.replace)).not.toBe(previewKey(subject.replace));
        expect(previewKey(undefined)).toBe('');
    });

    it('keeps the replace field when it is read back from the pane state', () => {
        expect(heldDiff(diffState(subject, 'x')).replace).toEqual(subject.replace);
    });
});
