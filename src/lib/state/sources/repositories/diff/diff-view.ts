// Layer 2, client state. The view state of a diff pane: its layout, the unchanged runs and files
// folded, and each file's editor view state, as the instance state keeps them (`diffViewOf`), with
// the keeping of the view states its editors say (`viewKeeper`); the key each file of a diff is
// kept under (`fileKeys`); what a file whose type changed says above its diff and whether a file
// the diff deletes is on disk; and whether a re-read holds the same files, so the view state stays
// (`sameFiles`). The identity of a diff pane is subject.ts's; the reads it asks for are
// ../repositories.ts's.

import type { DiffSides } from '../../../../data/model/index.ts';
import { z } from 'zod';
import { fieldItemsShape, mapOfShape, mapShape, readAs } from '../../../../data/shapes/shapes.ts';
import { t } from '../../../shared/words/text.ts';

/** How a diff pane lays its two sides out, kept per pane. */
export type DiffMode = 'side' | 'inline';

/**
 * A diff pane's own remembered choices: its layout; whether the unchanged runs of every file are
 * folded; the files folded to their header, by the key `fileKeys` gives; and each file's diff
 * editor view state (the unchanged runs the reader revealed and the scroll), by the file's path,
 * as Monaco's `saveViewState` gives it and `restoreViewState` takes it back.
 */
export type DiffView = {
    mode: DiffMode;
    views: Record<string, object>;
    unchanged: 'folded' | 'shown';
    folded: string[];
};

/** A diff pane's remembered choices as the instance state stores them, each one repaired alone. */
const diffViewShape = z.object({
    mode: z.enum(['side', 'inline']).catch('side'),
    views: mapOfShape(mapShape).catch(() => ({})),
    unchanged: z.enum(['folded', 'shown']).catch('folded'),
    folded: fieldItemsShape
});

/**
 * A diff pane's remembered choices, every field defaulted: side by side, the unchanged runs
 * folded, no file folded, no view state. A view state that is not an object is dropped, and so is
 * one keyed to a path not among `paths`, the files of the diff, when they are given; a folded file
 * not among them is dropped the same way.
 */
export function diffViewOf(state: unknown, paths?: readonly string[]): DiffView {
    const held = readAs(diffViewShape, state) ?? {
        mode: 'side' as const,
        views: {},
        unchanged: 'folded' as const,
        folded: []
    };
    const among = (path: string): boolean => paths === undefined || paths.includes(path);
    return {
        ...held,
        views: Object.fromEntries(Object.entries(held.views).filter(([path]) => among(path))),
        folded: held.folded.filter(among)
    };
}

/** The folded files with `key` folded if it was open and opened if it was folded. */
export function toggleFolded(folded: readonly string[], key: string): string[] {
    return folded.includes(key) ? folded.filter((one) => one !== key) : [...folded, key];
}

/** The folded files without `key`, which a step onto its change opens. */
export function unfolded(folded: readonly string[], key: string): string[] {
    return folded.filter((one) => one !== key);
}

/** The mode git's head lines give after `prefix`, or null where no line starts with it. */
function modeAfter(file: Pick<DiffSides, 'head'>, prefix: string): string | null {
    const line = file.head.find((one) => one.startsWith(prefix));
    return line === undefined ? null : line.slice(prefix.length).trim();
}

/** The words a side of a git mode is: a symbolic link (120000), a submodule (160000), a file. */
function typeWords(mode: string): string {
    if (mode === '120000') return t('repositories.diff_type_link');
    if (mode === '160000') return t('repositories.diff_type_submodule');
    return t('repositories.diff_type_file');
}

/**
 * What a file whose type changed says above its diff: which side is the old type and which the
 * new, read from the modes of the deletion and the creation the server joins it from (a file
 * turned into a symbolic link reads `the file's text` on the left and `the symbolic link's target`
 * on the right). The inline diff has no left and right, so there the old type is in the removed
 * lines and the new one in the added lines. The empty string for a file whose type stayed.
 */
export function typeChangeWords(file: Pick<DiffSides, 'head'>, mode: DiffMode): string {
    const from = modeAfter(file, 'deleted file mode ');
    const to = modeAfter(file, 'new file mode ');
    if (from === null || to === null) return '';
    return mode === 'inline'
        ? t('repositories.diff_type_changed_inline', typeWords(from), typeWords(to))
        : t('repositories.diff_type_changed', typeWords(from), typeWords(to));
}

/**
 * Whether git's head lines for a file say the diff deletes it, so it is not on disk to open; a
 * path whose type changed is deleted and created again, and is on disk.
 */
export function fileDeleted(file: Pick<DiffSides, 'head'>): boolean {
    return (
        modeAfter(file, 'deleted file mode ') !== null && modeAfter(file, 'new file mode ') === null
    );
}

/**
 * The key of each file of a diff, for its section, its view state and its models: its path (the
 * old one for a deleted file), and for a path the diff lists again, the path, a NUL and its place
 * among that path's entries (`x`, then `x` NUL `2`), so no two sections share a key. No git path
 * holds a NUL, so the key of an entry listed again never equals another file's path.
 */
export function fileKeys(files: readonly DiffSides[]): string[] {
    const seen = new Map<string, number>();
    return files.map((file) => {
        const path = file.newPath === '' ? file.oldPath : file.newPath;
        const place = (seen.get(path) ?? 0) + 1;
        seen.set(path, place);
        return place === 1 ? path : `${path}\0${String(place)}`;
    });
}

/**
 * What keeps a diff pane's view states: `viewed` says one, `keep` writes those said so far, and
 * `close` ends the keeping when the pane is torn down, told whether its tab is still open.
 */
export type ViewKeeper = {
    viewed: (key: string, state: object) => void;
    keep: () => void;
    close: (open: () => boolean) => void;
};

/**
 * The keeping of a diff pane's view states: those its editors say within `after` milliseconds
 * are written in one write over what `read` gives, through `write`. At `close`, a pane whose tab
 * is still open (a page switch, a tab moved, a split changed) writes what is pending, and each
 * view state its editors say as they are torn down after it is written at once, so the reopened
 * pane shows the last scroll and caret. A pane whose tab has closed writes nothing again: its
 * instance state is gone with the tab, and an editor torn down after it would write it back.
 */
export function viewKeeper(
    read: () => unknown,
    write: (state: DiffView) => void,
    after: number
): ViewKeeper {
    let pending: Record<string, object> = {};
    let timer: ReturnType<typeof setTimeout> | null = null;
    // Open while the pane is drawn; `torn` once it is torn down with its tab open, `gone` with it
    // closed.
    let phase: 'open' | 'torn' | 'gone' = 'open';
    function keep(): void {
        if (phase === 'gone') return;
        if (timer !== null) clearTimeout(timer);
        timer = null;
        if (Object.keys(pending).length === 0) return;
        const now = diffViewOf(read());
        write({ ...now, views: { ...now.views, ...pending } });
        pending = {};
    }
    return {
        viewed(key, state) {
            if (phase === 'gone') return;
            pending = { ...pending, [key]: state };
            if (phase === 'torn') keep();
            else timer ??= setTimeout(keep, after);
        },
        keep,
        close(open) {
            if (open()) {
                keep();
                phase = 'torn';
                return;
            }
            phase = 'gone';
            if (timer !== null) clearTimeout(timer);
            timer = null;
            pending = {};
        }
    };
}

/** Whether two lists of git's line changes are the same changes, both absent included. */
function sameChanges(a: DiffSides['changes'], b: DiffSides['changes']): boolean {
    if (a === undefined || b === undefined) return a === b;
    const numbers = (changes: NonNullable<DiffSides['changes']>): string =>
        changes
            .map((one) =>
                [
                    one.originalStartLineNumber,
                    one.originalEndLineNumber,
                    one.modifiedStartLineNumber,
                    one.modifiedEndLineNumber
                ].join(',')
            )
            .join(' ');
    return numbers(a) === numbers(b);
}

/** Whether two answers of a diff read hold the same files, so a re-read keeps the view state. */
export function sameFiles(a: readonly DiffSides[], b: readonly DiffSides[]): boolean {
    return (
        a.length === b.length &&
        a.every(
            (file, at) =>
                file.oldPath === b[at].oldPath &&
                file.newPath === b[at].newPath &&
                file.binary === b[at].binary &&
                file.encoded === b[at].encoded &&
                file.original === b[at].original &&
                file.modified === b[at].modified &&
                file.head.join('\n') === b[at].head.join('\n') &&
                sameChanges(file.changes, b[at].changes)
        )
    );
}
