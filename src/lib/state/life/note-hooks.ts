// Layer 2, client state. What the page's stores ask of the notes, built once in
// state/client/context.ts: whether a source tab's file is a note (a Markdown file of a hub's
// `.oculus/notes/`) and how long it waits, which the autosave reads to save it `notes.autosave_ms`
// after its last edit whatever `editor.autosave` says, and the explorer's three asks
// (`ExplorerNotes`): the link plan of a rename or a move
// (state/system/machine/refactor/note-link-plan.ts), the notice a refused link edit is told on, and
// what a removal does to the tabs of the notes it removed, which close with their waiting saves
// dropped, so no file is written at the place a note was removed from.

import { inNotes, isNote } from '../../data/prose/markdown/note-names.ts';
import { autosaveMs } from './notes.ts';
import type { AutosaveStore } from '../sessions/source/autosave.svelte.ts';
import type { SourceStore } from '../sessions/source/source.svelte.ts';
import type { LspEdits } from '../system/machine/lsp/edits.ts';
import type { FsStore } from '../sources/fs.svelte.ts';
import { readText } from '../sources/fs-transport.ts';
import type { ExplorerNotes, Place } from '../sources/explorer/ops.svelte.ts';
import type { FsRoot } from '../sources/explorer/view/place.ts';
import { createNoteMoves } from '../system/machine/refactor/note-link-plan.ts';

/** The root key and the path of a tab's `root/path` name, or null for one with no slash. */
function placeOfFile(file: string): Place | null {
    const at = file.indexOf('/');
    return at <= 0 ? null : { root: file.slice(0, at), path: file.slice(at + 1) };
}

/** Whether a tab's file, `root/path`, is a note: a Markdown file of a hub's notes folder. */
function isNoteFile(roots: readonly FsRoot[], file: string): boolean {
    const place = placeOfFile(file);
    if (place === null) return false;
    const inside = inNotes(place.path);
    const hub = roots.some((one) => one.key === place.root && one.hub === true);
    return hub && inside !== null && inside !== '' && isNote(inside);
}

/** The wait of a tab's file, `root/path`, when it is a note (`notes.autosave_ms`), else null. */
export function noteWait(
    roots: readonly FsRoot[],
    file: string,
    config: Record<string, unknown> | undefined
): number | null {
    return isNoteFile(roots, file) ? autosaveMs(config ?? {}) : null;
}

/** An open tab as the notes read it: its id and its view. */
type OpenTab = { id: string; view: string };

/**
 * The explorer's asks of the notes on one page, over its stores: the notes and the roots the fs
 * store holds, the source tabs' drafts, the tabs the layout holds and closes, the autosave whose
 * waiting saves a removal drops, the notices a refused link edit is told on, and the page's edit
 * plan.
 */
export function pageNotes(
    fs: Pick<FsStore, 'notes' | 'roots'>,
    source: Pick<SourceStore, 'sourceDraft'>,
    layout: { closeInstance: (id: string) => void },
    autosave: Pick<AutosaveStore, 'drop'>,
    notices: { post: (message: string, options: { tone: 'warning' }) => unknown },
    edits: Pick<LspEdits, 'plan' | 'commit'>,
    tabs: () => OpenTab[]
): ExplorerNotes {
    /** The source tabs with the file each holds, its text and whether it is read. */
    const held = () =>
        tabs()
            .filter((tab) => tab.view === 'source')
            .map((tab) => ({ id: tab.id, draft: source.sourceDraft(tab.id) }))
            .filter((tab) => tab.draft.file !== '');
    const moving = createNoteMoves({
        notes: () => fs.notes().hubs,
        draft: (root, path) => {
            const tab = held().find((one) => one.draft.file === `${root}/${path}`);
            return tab?.draft.loaded === true ? tab.draft.text : undefined;
        },
        read: async (root, path) => {
            const file = await readText(root, path);
            return file.error === '' ? file.text : null;
        },
        edits
    });

    function removed(places: Place[]): void {
        for (const tab of held()) {
            if (!isNoteFile(fs.roots(), tab.draft.file)) continue;
            const gone = places.some((place) => {
                const own = `${place.root}/${place.path}`;
                return tab.draft.file === own || tab.draft.file.startsWith(`${own}/`);
            });
            if (!gone) continue;
            autosave.drop(tab.id);
            layout.closeInstance(tab.id);
        }
    }

    return {
        moving,
        said: (sentence) => void notices.post(sentence, { tone: 'warning' }),
        removed
    };
}
