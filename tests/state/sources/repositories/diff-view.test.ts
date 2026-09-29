// The diff pane's keys and the keeping of its view states (state/sources/repositories/
// repositories.ts): each file of a diff keyed by its path and its place among the entries of that
// path, and the view states the editors say written to the pane's instance state after a pause,
// never after the pane has closed.

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    fileKeys,
    viewKeeper,
    type DiffView
} from '../../../../src/lib/state/sources/repositories/repositories.ts';
import type { DiffSides } from '../../../../src/lib/data/model/index.ts';

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
        expect(written).toEqual([{ mode: 'inline', views: { a: { top: 1 }, b: { top: 2 } } }]);
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
        expect(held).toEqual({ mode: 'side', views: { a: { top: 1, caret: 3 } } });
    });
});
