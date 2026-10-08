// Layer 3, view partial of Source.svelte. What a source tab's saved state says besides the file it
// names: the line and column it was opened at, whether it is an untitled text, and whether it is
// a tab over a library file (state/sessions/source/draft.ts's `libraryTabState`). A state is read
// back safely, since a tab restored from storage carries whatever was written there: a line or a
// column that is not a positive number is none, and a column with no line is none. `tabFacts` reads
// all of it at once: the root and path the state names, its label, the version of the file at HEAD
// or in the index it holds, where it was opened, and whether it names no file.

import { z } from 'zod';
import { readAs } from '$lib/data/shapes/shapes';
import { headOf, type HeadStage } from '$lib/state/sessions/source/draft';
import { instanceText } from '$lib/state/workbench/layout/instance';

/** The line and column a tab was opened at: a number above zero each, and 0 for anything else. */
const openedAtShape = z.object({
    line: z.number().positive().catch(0),
    column: z.number().positive().catch(0)
});

/** A tab over an untitled text: it names no file until its first Save gives it one. */
const untitledShape = z.object({ untitled: z.literal(true) });

/** A tab over a library file names the address a language server's answer gave this page. */
const libraryShape = z.object({ library: z.string().min(1) });

/** Where a tab was opened, from one: 0 for a line or a column the state does not name. */
function openedAt(state: unknown): { line: number; column: number } {
    const held = readAs(openedAtShape, state);
    if (held === null || held.line === 0) return { line: 0, column: 0 };
    return held;
}

/** Whether the state is an untitled text's. */
function isUntitled(state: unknown): boolean {
    return readAs(untitledShape, state) !== null;
}

/** The library address a tab shows, or the empty string for a tab over a file. */
export function libraryAddress(state: unknown): string {
    return readAs(libraryShape, state)?.library ?? '';
}

/** What a source tab's saved state names. */
export type TabState = {
    root: string;
    path: string;
    label: string;
    /** The version of the file the tab holds, when it is the file at HEAD or in the index. */
    head: HeadStage | undefined;
    /** The line and column the tab was opened at, and zero for one opened at the file itself. */
    line: number;
    column: number;
    /** Whether the tab names no file: an untitled text, or a state that lost its address. */
    blocked: boolean;
    untitled: boolean;
};

/** Everything a tab's saved state names about its file. */
export function tabFacts(state: unknown): TabState {
    const root = instanceText(state, 'root');
    const path = instanceText(state, 'path');
    return {
        root,
        path,
        label: instanceText(state, 'label'),
        head: headOf(state),
        ...openedAt(state),
        blocked: root === '' || path === '',
        untitled: isUntitled(state)
    };
}
