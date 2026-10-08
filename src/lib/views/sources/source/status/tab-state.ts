// Layer 3, view partial of Source.svelte. What a source tab's saved state says besides the file it
// names: the place it was opened at, whether it is an untitled text, and whether it is a tab over
// a library file (state/sessions/source/draft.ts's `libraryTabState`). A state is read back
// safely, since a tab restored from storage carries whatever was written there: a line, a column,
// an end or an ask that is not a positive number is none, a column with no line is none, an end
// before the start is none, an end column with no end line is none, and a keyboard flag that is
// not a boolean is the default, which takes the keyboard. `tabFacts` reads all of it at once: the
// root and path the state names, its label, the version of the file at HEAD or in the index it
// holds, where it was opened, and whether it names no file.

import { z } from 'zod';
import { readAs } from '$lib/data/shapes/shapes';
import { endsBeforeStart, headOf, type HeadStage } from '$lib/state/sessions/source/draft';
import { instanceText } from '$lib/state/workbench/layout/instance';

/** A number above zero, and 0 for anything else. */
const positive = z.number().positive().catch(0);

/** The place a tab was opened at, as the state holds it. */
const openedAtShape = z.object({
    line: positive,
    column: positive,
    endLine: positive,
    endColumn: positive,
    asked: positive,
    wentTo: positive,
    focus: z.boolean().catch(true)
});

/**
 * Where a tab was opened, from one, with 0 for a number the state does not name. `asked` is the
 * number the page gave the open and `wentTo` the last one the editor went to: the editor goes
 * again when they differ. `focus` is whether going there takes the keyboard.
 */
export type OpenedAt = z.infer<typeof openedAtShape>;

/** A tab over an untitled text: it names no file until its first Save gives it one. */
const untitledShape = z.object({ untitled: z.literal(true) });

/** A tab over a library file names the address a language server's answer gave this page. */
const libraryShape = z.object({ library: z.string().min(1) });

export const NOWHERE: OpenedAt = {
    line: 0,
    column: 0,
    endLine: 0,
    endColumn: 0,
    asked: 0,
    wentTo: 0,
    focus: true
};

/** Where a tab was opened, read back safely from whatever its state holds. */
function openedAt(state: unknown): OpenedAt {
    const held = readAs(openedAtShape, state);
    if (held === null || held.line === 0) return NOWHERE;
    const ends = !endsBeforeStart(
        { line: held.line, column: held.column },
        { line: held.endLine, column: held.endColumn }
    );
    return { ...held, endLine: ends ? held.endLine : 0, endColumn: ends ? held.endColumn : 0 };
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
    /** The place the tab was opened at, and zeros for one opened at the file itself. */
    place: OpenedAt;
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
        place: openedAt(state),
        blocked: root === '' || path === '',
        untitled: isUntitled(state)
    };
}
