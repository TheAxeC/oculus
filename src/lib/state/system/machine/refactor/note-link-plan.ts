// Layer 2, client state. What a rename or a move of notes does to the `[[links]]` that name them:
// the explorer store asks this before it posts a rename, a drag or a Cut and Paste
// (state/sources/explorer/ops.svelte.ts's `noteMoving`, through state/life/note-hooks.ts), and the
// answer either refuses the move or is the edit to make once it has landed.
//
// Before the move, the links of the hub's notes are planned through the page's edit plan
// (../lsp/edits.ts): each note that links to a moved note, or to a note whose name the move makes
// shared, is read (the text of the tab that holds it, else the disk's), its links' new names are
// worked out by note-links.ts's noteMoveEdits, and the plan makes every check an edit of a language
// server gets (a note open in a tab of another page, a tab whose text no longer fits). A refused
// plan refuses the move with the plan's sentence, which names the file, and a note moved into a
// folder holding a note of that name but for letter case or normalisation is refused as taken, so
// nothing is renamed. Once the move has landed the planned files are restated at the places they
// moved to and the edit is made: a note open in a tab gets it in its text, a closed note is written
// on disk by one `lsp-edit`, which History logs and undoes. A move that landed only in part is
// planned again over what landed.
//
// Only a move inside one hub's notes folder is planned: a link never names a note of another hub,
// so another hub's notes are never read or written, and a note moved out of its notes folder leaves
// its links unresolved, as a deleted note does.

import type { HubNotes } from '../../../../data/model/index.ts';
import { pageUri } from '../../../../data/prose/lsp-addresses.ts';
import {
    movedPath,
    noteMoveEdits,
    type LinkEdit,
    type NoteMove
} from '../../../../data/prose/markdown/note-links.ts';
import {
    inNotes,
    isNote,
    nameKey,
    nameTaken,
    noteTitle
} from '../../../../data/prose/markdown/note-names.ts';
import type { EditPlan, LspEdits } from '../lsp/edits.ts';
import { noticeWords } from './notice-words.ts';
import { t } from '../../../shared/words/text.ts';
import { followedAny, type Move } from '../../../sources/explorer/follow.ts';
import { NOTHING_MOVES, type NotesMoving } from '../../../sources/explorer/notes/note-moves.ts';
import { notePath } from '../../../sources/explorer/notes/note-tree.ts';

export type NoteMovesDeps = {
    /** The notes of every hub as the page holds them. */
    notes: () => readonly HubNotes[];
    /** The text of a file the page's source tabs hold, by `root/path`, or undefined for none. */
    draft: (root: string, path: string) => string | undefined;
    /** The text of a file on disk, or null when it cannot be read. */
    read: (root: string, path: string) => Promise<string | null>;
    edits: Pick<LspEdits, 'plan' | 'commit'>;
};

/** The folder a path inside a notes folder sits in. */
function folderOf(path: string): string {
    const at = path.lastIndexOf('/');
    return at < 0 ? '' : path.slice(0, at);
}

/** The moves inside one hub's notes folder, as paths inside it, by hub. */
function movesByHub(moves: Move[], hubs: readonly HubNotes[]): Map<string, NoteMove[]> {
    const out = new Map<string, NoteMove[]>();
    for (const move of moves) {
        const from = inNotes(move.from.path);
        const to = inNotes(move.to.path);
        const hub = hubs.find((one) => one.root === move.from.root && one.state === 'ok');
        if (hub === undefined || move.to.root !== move.from.root) continue;
        if (from === null || to === null || from === '' || to === '') continue;
        out.set(hub.root, [...(out.get(hub.root) ?? []), { from, to }]);
    }
    return out;
}

/**
 * The name a move lands on that another item of its new folder already has, or null: only a move
 * into another folder is asked, since a rename in its own folder is the name rule's.
 */
function takenBy(hub: HubNotes, moves: readonly NoteMove[]): string | null {
    for (const move of moves) {
        if (folderOf(move.from) === folderOf(move.to)) continue;
        const into = folderOf(move.to);
        const names = hub.entries
            .filter((one) => folderOf(one.path) === into)
            .map((one) => one.path.slice(one.path.lastIndexOf('/') + 1));
        const name = move.to.slice(move.to.lastIndexOf('/') + 1);
        if (nameTaken(names, name)) return isNote(name) ? noteTitle(name) : name;
    }
    return null;
}

/**
 * The planned links of one hub: every file of its notes folder before the moves, the texts read,
 * by path inside the folder, and the edits.
 */
type HubPlan = {
    root: string;
    paths: string[];
    texts: Map<string, string>;
    edits: Map<string, LinkEdit[]>;
};

/** The workspace edit of planned links, with the text each file's edits were made on. */
function editOf(plans: readonly HubPlan[], moves: Map<string, NoteMove[]>, after: boolean) {
    const changes: unknown[] = [];
    const held = new Map<string, string>();
    for (const plan of plans) {
        for (const [path, list] of plan.edits) {
            const at = after ? movedPath(path, moves.get(plan.root) ?? []) : path;
            const uri = pageUri({ root: plan.root, path: notePath(at) });
            changes.push({ textDocument: { uri, version: null }, edits: list });
            held.set(uri, plan.texts.get(path) ?? '');
        }
    }
    return { edit: { documentChanges: changes }, held };
}

/** The planned files restated at the places the moves took them. */
function restated(plan: EditPlan, moves: Move[]): EditPlan {
    return {
        ...plan,
        files: plan.files.map((file) => {
            const place = followedAny(file.place, moves);
            return place === null ? file : { ...file, place, name: `${place.root}/${place.path}` };
        })
    };
}

/** Whether two lists of moves are the same moves. */
function sameMoves(left: Move[], right: Move[]): boolean {
    const key = (move: Move) =>
        `${move.from.root}/${move.from.path}\n${move.to.root}/${move.to.path}`;
    const own = new Set(left.map(key));
    return left.length === right.length && right.every((one) => own.has(key(one)));
}

export function createNoteMoves(deps: NoteMovesDeps): NotesMoving {
    /** The links of one hub's notes that the moves rewrite, read from the tabs and the disk. */
    async function planHub(hub: HubNotes, moves: readonly NoteMove[]): Promise<HubPlan | null> {
        const paths = hub.entries.filter((one) => one.kind === 'file').map((one) => one.path);
        const moved = paths.filter((path) => movedPath(path, moves) !== path);
        const names = new Set(
            moved
                .flatMap((path) => [noteTitle(path), noteTitle(movedPath(path, moves))])
                .map(nameKey)
        );
        const touched = (to: string) => moved.includes(to) || names.has(nameKey(noteTitle(to)));
        const texts = new Map<string, string>();
        for (const note of hub.entries) {
            if (note.kind !== 'file' || !isNote(note.path)) continue;
            const draft = deps.draft(hub.root, notePath(note.path));
            if (draft !== undefined) {
                texts.set(note.path, draft);
                continue;
            }
            if (!(note.links ?? []).some((link) => touched(link.to))) continue;
            const text = await deps.read(hub.root, notePath(note.path));
            if (text === null) return null;
            texts.set(note.path, text);
        }
        return { root: hub.root, paths, texts, edits: noteMoveEdits(paths, moves, texts) };
    }

    /** The plans of every hub the moves touch, or the sentence that refuses the moves. */
    async function planAll(
        byHub: Map<string, NoteMove[]>
    ): Promise<{ plans: HubPlan[] } | { refused: string }> {
        const plans: HubPlan[] = [];
        for (const [root, moves] of byHub) {
            const hub = deps.notes().find((one) => one.root === root);
            if (hub === undefined) continue;
            const taken = takenBy(hub, moves);
            if (taken !== null) return { refused: t('notes.name_taken', taken) };
            const plan = await planHub(hub, moves);
            if (plan === null) return { refused: t('notes.links_unread', root) };
            if (plan.edits.size > 0) plans.push(plan);
        }
        return { plans };
    }

    /** Plan the edit of the planned links, at their places before or after the moves. */
    async function planned(
        plans: readonly HubPlan[],
        byHub: Map<string, NoteMove[]>,
        after: boolean
    ): Promise<{ plan: EditPlan } | { refused: string }> {
        const { edit, held } = editOf(plans, byHub, after);
        const answer = await deps.edits.plan(edit, held);
        if (answer.ok) return { plan: answer.plan };
        const outcome = answer.outcome;
        return { refused: outcome.applied ? '' : noticeWords(outcome.notice, outcome.words) };
    }

    return async (moves) => {
        const byHub = movesByHub(moves, deps.notes());
        if (byHub.size === 0) return NOTHING_MOVES;
        const all = await planAll(byHub);
        if ('refused' in all) return all;
        if (all.plans.length === 0) return NOTHING_MOVES;
        const first = await planned(all.plans, byHub, false);
        if ('refused' in first) return first;
        return {
            landed: async (done) => {
                if (done.length === 0) return '';
                if (sameMoves(done, moves)) {
                    const made = await deps.edits.commit(restated(first.plan, done));
                    return made.applied ? '' : noticeWords(made.notice, made.words);
                }
                const kept = movesByHub(done, deps.notes());
                const plans = all.plans.flatMap((plan) => {
                    const own = kept.get(plan.root);
                    if (own === undefined) return [];
                    const edits = noteMoveEdits(plan.paths, own, plan.texts);
                    return edits.size === 0 ? [] : [{ ...plan, edits }];
                });
                if (plans.length === 0) return '';
                const again = await planned(plans, kept, true);
                if ('refused' in again) return again.refused;
                const made = await deps.edits.commit(again.plan);
                return made.applied ? '' : noticeWords(made.notice, made.words);
            }
        };
    };
}
