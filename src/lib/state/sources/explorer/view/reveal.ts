// Layer 2, client state, pure. Showing one path in the file browser: the ask another view writes
// into the instance's state, the reads of the folders on its way, what an answer writes and when it
// writes nothing.
//
// An answer arrives after the reader may have asked for another path or closed the tab, so every
// write is checked against the ask the instance holds now (`sameAsk`) and is dropped when it holds
// another.

import { isMap } from '../../../../data/helpers/guards.ts';
import { sectionOpened } from '../sections/section-state.ts';
import { filesViewOf, type FilesView, type RevealAsk, type RevealOutcome } from './files-view.ts';
import {
    HUB_ROOT,
    ancestorsOf,
    normalisePath,
    rowKey,
    setExpanded,
    type FsEntry,
    type RowRef
} from './place.ts';

/**
 * An instance's state with one more ask to show a path in it, the rest kept. A path given with no
 * root is a path of the hub, and it is asked for by its segments (collection.ts's normalisePath),
 * so `network/../funding` is `funding`; a path still climbing above its root is asked for as it is
 * and is shown at the root's own line, since no listing holds an entry named `..`. The filter is
 * cleared, since a filter would leave the row asked for out of the tree, and the last ask's outcome
 * goes with it. With `open` the folder asked for is shown open as well as selected, and with
 * `timeline` the Timeline section is opened and scrolled to in place of the row.
 */
export function revealAsked(
    state: unknown,
    path: string,
    root: string = HUB_ROOT,
    open = false,
    timeline = false
): object {
    const kept = isMap(state) ? state : {};
    const revealing = filesViewOf(state).revealing + 1;
    const reveal: RevealAsk = {
        root,
        path: normalisePath(path),
        asked: revealing,
        settled: false,
        ...(open ? { open: true as const } : {}),
        ...(timeline ? { timeline: true as const } : {})
    };
    return { ...kept, filter: '', reveal, revealed: null, revealing };
}

/**
 * Read the folders on the way to one path, outermost first, each only after the one above it said
 * the next name is a folder, and say what the path came to. The reader is the store's own listing
 * read, which answers a folder already read without a request.
 */
export async function resolveReveal(
    ask: RowRef,
    roots: string[],
    read: (root: string, path: string) => Promise<{ entries: FsEntry[]; error: string }>
): Promise<RevealOutcome> {
    const asked = { root: ask.root, path: ask.path };
    if (!roots.includes(ask.root)) return { kind: 'no-root', asked, shown: null, error: '' };
    const parts = ask.path.split('/').filter((part) => part !== '');
    for (let at = 0; at < parts.length; at += 1) {
        const folder = { root: ask.root, path: parts.slice(0, at).join('/') };
        const listing = await read(folder.root, folder.path);
        if (listing.error !== '') {
            return { kind: 'unread', asked, shown: folder, error: listing.error };
        }
        const entry = listing.entries.find((one) => one.name === parts[at]);
        const last = at === parts.length - 1;
        if (entry === undefined || (!last && entry.kind !== 'dir')) {
            return { kind: 'missing', asked, shown: folder, error: '' };
        }
    }
    return { kind: 'found', asked, shown: asked, error: '' };
}

/**
 * What an ask comes to while the file browser could not read its roots: nothing can be looked for,
 * so the ask is answered at once with the reason rather than left waiting for a later read, which
 * would select a row long after the press that asked for it.
 */
export function rootsUnread(ask: RowRef, error: string): RevealOutcome {
    return { kind: 'no-roots', asked: { root: ask.root, path: ask.path }, shown: null, error };
}

/** Whether the ask an instance holds is this very ask, in the same phase. */
function sameAsk(held: RevealAsk | null, ask: RevealAsk): boolean {
    return (
        held !== null &&
        held.root === ask.root &&
        held.path === ask.path &&
        held.asked === ask.asked &&
        held.settled === ask.settled
    );
}

/**
 * What an answered ask writes, or null when the instance no longer holds that ask: a later ask
 * replaced it, the reader closed the tab (whose record is then gone), or another reading of the
 * same ask has already settled it. The folders above the row shown are opened, the row is
 * selected, and the ask waits for its scroll; a root the workspace lacks has nothing to scroll to.
 * An ask for the Timeline opens that section in either case and releases a pin, so the Timeline
 * shows the file asked for.
 */
export function revealSettled(
    now: FilesView,
    ask: RevealAsk,
    outcome: RevealOutcome
): Partial<FilesView> | null {
    if (ask.settled || !sameAsk(now.reveal, ask)) return null;
    const revealed = outcome.kind === 'found' ? null : outcome;
    const sections = ask.timeline === true ? sectionOpened(now, 'timeline') : null;
    const opened = sections === null ? {} : { opened: sections.opened, timelinePinned: null };
    if (outcome.shown === null) return { reveal: null, revealed, ...opened };
    const opening = ask.open === true && outcome.kind === 'found' ? [outcome.shown] : [];
    const expanded = [...ancestorsOf(outcome.shown), ...opening].reduce(
        (open, row) => (open.includes(rowKey(row)) ? open : setExpanded(open, rowKey(row), true)),
        now.expanded
    );
    return {
        expanded,
        selected: outcome.shown,
        reveal: { ...ask, settled: true },
        revealed,
        ...opened
    };
}

/** What the scroll to a settled ask writes, or null when the instance holds another ask. */
export function revealScrolled(now: FilesView, ask: RevealAsk): Partial<FilesView> | null {
    return ask.settled && sameAsk(now.reveal, ask) ? { reveal: null } : null;
}
