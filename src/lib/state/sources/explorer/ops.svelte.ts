// Layer 2, client state. The Files view's file operations: the clipboard Cut and Copy fill and
// Paste empties, the file Select for Compare holds, and the calls that post one operation to
// /api/ops, read what it answered and leave the page as the operation left the disk. The Search
// view's replace is posted here too, as the operation `replace`.
//
// What an answer changes on the page is done here and not in the view, because it reaches past the
// view that asked: the listings of the folders the operation touched are marked to be read again,
// every open tab over a file that moved is restated at the new path (a source tab keeps the draft
// it holds), a diff pane over the file or over the file it is compared with follows it, a Files
// view's open folders and selected row follow it, and the reader's bookmarks over it are rewritten.
// The tabs and bookmarks are looked up when the answer lands and not when the request is sent, so a
// tab opened or closed while the request was out is the one that is restated or left alone, and two
// operations in flight each re-read the folders of their own answer.
//
// The questions an operation can ask (replace what is there, delete for good after the Trash
// failed) are a call handed in, `confirm`, which answers yes or no; the view that draws the
// question is the one that hands it. A cut clipboard is emptied by the paste that used it, as VS
// Code's paste does in a `finally`, except when the replace question was answered no.

import {
    MAX_UPLOAD_BYTES,
    OPS_PATH,
    OPS_REFUSALS,
    checkName,
    freeName,
    stemLength,
    type LspEditFile,
    type OpsPlace,
    type OpsRefusal,
    type OpsRequest
} from '../../../data/file-ops.ts';
import type {
    InstanceStates,
    Posted,
    WriteAnswer,
    WritesStore
} from '../../shared/stores/shapes.ts';
import type { FsRoot } from './view/place.ts';
import { FILES_VIEW } from '../fs.ts';
import { BOOKMARK_COLLECTION, type FsStore } from '../fs.svelte.ts';
import { DIFF_VIEW } from '../repositories/repositories.svelte.ts';
import {
    foldersToAdd,
    folderChoice,
    pickedOf,
    type FolderChoice,
    type FoldersAdded,
    type PickRefusal
} from './acts/folders.ts';
import { replacedPlaces, undoneMoves, type FileRecord } from './acts/undo.ts';
import { nameOf } from './file-type.ts';
import { cardTreePrefix } from './view/card-tree.ts';
import { patchedFilesView } from './view/files-view.ts';
import {
    followedAny,
    followedDiffTab,
    followedFileTab,
    followedFilesView,
    type Move
} from './follow.ts';

/** The route the folder panel is opened through. */
const PICK_PATH = '/api/folders/pick';

export { MAX_UPLOAD_BYTES, checkName, freeName, stemLength };
export type { OpsPlace as Place };

/**
 * What a file operation came to. A list that stopped part way names what it did before. A replace
 * also carries `rereads`, the hits of the files it wrote as the answer sent them, which the Search
 * store reads (state/sources/search/search.ts).
 */
export type Outcome =
    | { ok: true; paths: string[]; rereads?: unknown }
    | {
          ok: false;
          error: OpsRefusal | 'network';
          done?: string[];
          failed?: string;
          rereads?: unknown;
      };

/** The two questions an operation asks, with the name the question is about. */
export type Question = { kind: 'replace' | 'permanent'; name: string };

/** The page's answer to a question. */
export type Confirm = (question: Question) => Promise<boolean>;

/** What Cut or Copy holds for Paste. */
export type Clipboard = { mode: 'cut' | 'copy'; items: OpsPlace[] };

/** An open tab as the explorer reads it: its id, its view and the state the layout holds for it. */
export type ExplorerTab = { id: string; view: string; state: unknown };

/** The layout as the explorer uses it: every open tab, and a tab's state restated. */
export type ExplorerLayout = {
    tabs: () => ExplorerTab[];
    restateInstance: (id: string, state: unknown) => void;
    /** Open a view on the page the reader is in, or activate it; the instance id, '' for none. */
    openView: (view: string) => string;
    /** Show one folder as a Files tab rooted at it; the instance id, '' for none. */
    showFolderInFiles: (path: string, root?: string) => string;
};

/**
 * The source editors as the explorer uses them: whether one holds unsaved text, its file, and
 * reading its file again.
 */
export type ExplorerSource = {
    sourceDirty: (id: string) => boolean;
    sourceDraft: (id: string) => { file: string };
    reloadSource: (id: string) => Promise<void>;
};

/** What Open Folder came to: the panel's refusal, or where the folder went. */
export type FolderOpened = { ok: false; picker: PickRefusal } | { ok: true; choice: FolderChoice };

/** One client's file operations, the clipboard and the compare selection. */
export type ExplorerStore = {
    /** What Cut or Copy last held, or null. */
    clipboard: () => Clipboard | null;
    copy: (items: OpsPlace[]) => void;
    cut: (items: OpsPlace[]) => void;
    /** Empty the clipboard, which is what Escape does to a Cut. */
    clearClipboard: () => void;
    /** The file Select for Compare holds, or null. */
    compareFile: () => OpsPlace | null;
    selectForCompare: (file: OpsPlace | null) => void;
    /**
     * Post a replace of the Search view and read the answer. A clean source tab over a file the
     * replace wrote reads the file again, and the folders of those files are listed again.
     */
    replace: (request: Extract<OpsRequest, { op: 'replace' }>) => Promise<Outcome>;
    /**
     * Post the edits a language server asked for in files no tab holds, as one operation, and read
     * the answer; the folders of the files written are listed again.
     */
    lspEdit: (files: LspEditFile[]) => Promise<Outcome>;
    /**
     * Whether an open source tab holds text of the file, or of a file under the folder, not saved.
     */
    unsaved: (item: OpsPlace, folder: boolean) => boolean;
    /** Paste the clipboard into a folder. Nothing on the clipboard pastes nothing, and is ok. */
    paste: (into: OpsPlace, confirm: Confirm) => Promise<Outcome>;
    /**
     * Move items into a folder, or copy them with `copy`, as a drop does: the same operation as
     * Paste over the items given, with the clipboard left as it is.
     */
    drop: (items: OpsPlace[], into: OpsPlace, copy: boolean, confirm: Confirm) => Promise<Outcome>;
    /**
     * How many operations the server has answered since the page opened, which moves whenever the
     * change log may hold a record the page has not read.
     */
    answers: () => number;
    /** Move items to the Trash; when the Trash fails, ask whether to delete for good. */
    trash: (items: OpsPlace[], confirm: Confirm) => Promise<Outcome>;
    create: (into: OpsPlace, name: string, folder: boolean) => Promise<Outcome>;
    rename: (item: OpsPlace, name: string) => Promise<Outcome>;
    /** Write one file's bytes (base64) into a folder; ask before replacing a file of that name. */
    upload: (into: OpsPlace, name: string, data: string, confirm: Confirm) => Promise<Outcome>;
    /**
     * Take one file operation of the change log back (or take back an undo of one, which puts the
     * operation again): the endpoint's answer, with the tabs and bookmarks over a renamed or moved
     * path restated and every listing read again when it was made.
     */
    undoFile: (record: FileRecord, roots: FsRoot[]) => Promise<WriteAnswer>;
    /**
     * Add Folder to Workspace: open the folder panel and add every folder it returns that is not
     * a root already, each through the roots write of the workspace in force.
     */
    addFolders: () => Promise<FoldersAdded>;
    /**
     * Open Folder: open the folder panel and show its first folder as a Files tab rooted at it
     * when a served root holds it; a folder outside every root is said on the page's Files tab,
     * which offers Add Folder to Workspace.
     */
    openFolder: () => Promise<FolderOpened>;
};

/** The folder a path sits in, '' for a path at the top of its root. */
function parentPath(path: string): string {
    const at = path.lastIndexOf('/');
    return at < 0 ? '' : path.slice(0, at);
}

/** The path of a name in a folder. */
function joined(folder: string, name: string): string {
    return folder === '' ? name : `${folder}/${name}`;
}

/** The items of a list once each, in order. */
function once(items: OpsPlace[]): OpsPlace[] {
    const seen = new Set<string>();
    return items.filter((one) => {
        const key = `${one.root}\0${one.path}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/** The words an answer carries as a refusal, or 'network' for an answer that was not one. */
function outcomeOf(posted: Posted): Outcome {
    const body = posted.body;
    if (posted.failed === '' && body.ok === true) {
        const paths = Array.isArray(body.paths)
            ? body.paths.filter((one): one is string => typeof one === 'string')
            : typeof body.path === 'string'
              ? [body.path]
              : [];
        return {
            ok: true,
            paths,
            ...(body.rereads === undefined ? {} : { rereads: body.rereads })
        };
    }
    const word = body.error;
    const error = OPS_REFUSALS.find((one) => one === word);
    if (posted.failed !== '' || error === undefined) return { ok: false, error: 'network' };
    const done = Array.isArray(body.done)
        ? body.done.filter((one): one is string => typeof one === 'string')
        : [];
    const failed = typeof body.failed === 'string' ? body.failed : '';
    return {
        ok: false,
        error,
        done,
        failed,
        ...(body.rereads === undefined ? {} : { rereads: body.rereads })
    };
}

/** The paths an outcome did something to: all of a list on ok, and the ones before the stop. */
function doneOf(outcome: Outcome, asked: string[]): string[] {
    if (outcome.ok) return asked;
    return outcome.done ?? [];
}

export function createExplorer(
    writes: WritesStore,
    fs: FsStore,
    layout: ExplorerLayout,
    ui: InstanceStates,
    source: ExplorerSource
): ExplorerStore {
    // Two signals, each replaced whole, so a view that reads one is drawn again when it changes.
    let clip: Clipboard | null = $state.raw(null);
    let compare: OpsPlace | null = $state.raw(null);
    let answeredCount = $state(0);

    function clipboard(): Clipboard | null {
        return clip;
    }

    function copy(items: OpsPlace[]): void {
        clip = { mode: 'copy', items: once(items) };
    }

    function cut(items: OpsPlace[]): void {
        clip = { mode: 'cut', items: once(items) };
    }

    function clearClipboard(): void {
        clip = null;
    }

    function compareFile(): OpsPlace | null {
        return compare;
    }

    function selectForCompare(file: OpsPlace | null): void {
        compare = file;
    }

    function unsaved(item: OpsPlace, folder: boolean): boolean {
        const own = `${item.root}/${item.path}`;
        return layout.tabs().some((tab) => {
            if (tab.view !== 'source' || !source.sourceDirty(tab.id)) return false;
            const file = source.sourceDraft(tab.id).file;
            return file === own || (folder && file.startsWith(`${own}/`));
        });
    }

    /** The place a replace names a file by: its root's key, a slash, and its path. */
    function placeOfName(name: string): OpsPlace | null {
        const at = name.indexOf('/');
        return at < 0 ? null : { root: name.slice(0, at), path: name.slice(at + 1) };
    }

    /** Every clean source tab over one of the places reads its file again. */
    function reloadClean(places: OpsPlace[]): void {
        const wanted = new Set(places.map((one) => `${one.root}/${one.path}`));
        for (const tab of layout.tabs()) {
            if (tab.view !== 'source' || source.sourceDirty(tab.id)) continue;
            if (wanted.has(source.sourceDraft(tab.id).file)) void source.reloadSource(tab.id);
        }
    }

    /** What the page does for files that were written in place: tabs read again, folders listed. */
    async function rewritten(places: OpsPlace[]): Promise<void> {
        reloadClean(places);
        await landed(
            [],
            places.map((one) => ({ root: one.root, path: parentPath(one.path) })),
            []
        );
    }

    /** Post a request that writes files in place and leave the page as the files were left. */
    async function writeInPlace(request: OpsRequest): Promise<Outcome> {
        const outcome = await send(request);
        const names = outcome.ok ? outcome.paths : (outcome.done ?? []);
        await rewritten(names.flatMap((one) => placeOfName(one) ?? []));
        return outcome;
    }

    function replace(request: Extract<OpsRequest, { op: 'replace' }>): Promise<Outcome> {
        return writeInPlace(request);
    }

    function lspEdit(files: LspEditFile[]): Promise<Outcome> {
        return writeInPlace({ op: 'lsp-edit', files });
    }

    /** Post one request and read the answer. */
    async function send(request: OpsRequest): Promise<Outcome> {
        const outcome = outcomeOf(await writes.postCommand(OPS_PATH, request));
        if (answered(outcome)) answeredCount += 1;
        return outcome;
    }

    /** Whether an outcome means the server answered, so the disk may have changed. */
    function answered(outcome: Outcome): boolean {
        return outcome.ok || outcome.error !== 'network';
    }

    /** Restate the draft a source tab holds so it names the file at its new place. */
    function followDraft(id: string, moves: Move[]): void {
        const draft = ui.instanceState(id);
        if (typeof draft !== 'object' || draft === null) return;
        const file = (draft as Record<string, unknown>).file;
        if (typeof file !== 'string') return;
        const at = file.indexOf('/');
        if (at < 0) return;
        const next = followedAny({ root: file.slice(0, at), path: file.slice(at + 1) }, moves);
        if (next === null) return;
        ui.setInstanceState(id, { ...draft, file: `${next.root}/${next.path}` });
    }

    /** Every tab over a path that moved is restated, from the tabs the layout holds now. */
    function followTabs(moves: Move[]): void {
        for (const tab of layout.tabs()) {
            for (const key of ui.instanceKeys(cardTreePrefix(tab.id))) {
                const kept = followedFilesView(ui.instanceState(key), moves);
                if (kept !== null) ui.setInstanceState(key, kept);
            }
            if (tab.view === FILES_VIEW) {
                const next = followedFilesView(ui.instanceState(tab.id), moves);
                if (next !== null) ui.setInstanceState(tab.id, next);
                continue;
            }
            const next =
                tab.view === DIFF_VIEW
                    ? followedDiffTab(tab.state, moves)
                    : followedFileTab(tab.view, tab.state, moves);
            if (next === null) continue;
            layout.restateInstance(tab.id, next);
            if (tab.view === 'source') followDraft(tab.id, moves);
        }
    }

    /** Rewrite each bookmark over a path that moved to its new place. */
    async function followBookmarks(moves: Move[]): Promise<void> {
        try {
            const { entries } = await fs.bookmarksNow();
            let written = false;
            for (const entry of entries) {
                const { root, path } = entry.fields;
                if (typeof root !== 'string' || typeof path !== 'string') continue;
                const next = followedAny({ root, path }, moves);
                if (next === null) continue;
                await writes.writeEntry(BOOKMARK_COLLECTION, entry.id, {
                    root: next.root,
                    path: next.path
                });
                written = true;
            }
            if (written) fs.bookmarksChanged();
        } catch {
            // The bookmarks could not be read or written; they stay at their old paths.
        }
    }

    /** What the page does once the server has answered: restate, rewrite and read again. */
    async function landed(moves: Move[], folders: OpsPlace[], gone: OpsPlace[]): Promise<void> {
        if (moves.length > 0) {
            followTabs(moves);
            await followBookmarks(moves);
        }
        for (const folder of folders) fs.relistFolder(folder.root, folder.path);
        for (const place of gone) fs.relistFolder(place.root, place.path, true);
    }

    async function create(into: OpsPlace, name: string, folder: boolean): Promise<Outcome> {
        const outcome = await send({
            op: 'create',
            root: into.root,
            path: into.path,
            name,
            folder
        });
        if (answered(outcome)) await landed([], [into], []);
        return outcome;
    }

    async function rename(item: OpsPlace, name: string): Promise<Outcome> {
        const outcome = await send({ op: 'rename', root: item.root, path: item.path, name });
        if (!answered(outcome)) return outcome;
        const parent = { root: item.root, path: parentPath(item.path) };
        const renamed = outcome.ok ? outcome.paths.at(0) : undefined;
        const moves: Move[] =
            renamed === undefined ? [] : [{ from: item, to: { root: item.root, path: renamed } }];
        await landed(moves, [parent], moves.length > 0 ? [item] : []);
        return outcome;
    }

    /** Remove items, to the Trash or for good, one root after another. */
    async function remove(op: 'trash' | 'delete', root: string, paths: string[]): Promise<Outcome> {
        const outcome = await send({ op, root, paths });
        if (!answered(outcome)) return outcome;
        const gone = doneOf(outcome, paths).map((path) => ({ root, path }));
        await landed(
            [],
            gone.map((one) => ({ root, path: parentPath(one.path) })),
            gone
        );
        return outcome;
    }

    async function trash(items: OpsPlace[], confirm: Confirm): Promise<Outcome> {
        const roots = [...new Set(once(items).map((one) => one.root))];
        const all: string[] = [];
        for (const root of roots) {
            const paths = once(items)
                .filter((one) => one.root === root)
                .map((one) => one.path);
            let outcome = await remove('trash', root, paths);
            if (!outcome.ok && outcome.error === 'trash_failed') {
                const done = outcome.done ?? [];
                const left = paths.filter((path) => !done.includes(path));
                const sure = await confirm({
                    kind: 'permanent',
                    name: nameOf(outcome.failed ?? left.at(0) ?? '')
                });
                if (!sure) return outcome;
                const rest = await remove('delete', root, left);
                outcome = rest.ok ? { ok: true, paths: [...done, ...left] } : rest;
            }
            if (!outcome.ok) return outcome;
            all.push(...outcome.paths);
        }
        return { ok: true, paths: all };
    }

    /** Where a pasted item went: the folder it was pasted into and its own name. */
    function movedTo(item: OpsPlace, into: OpsPlace): Move {
        return {
            from: item,
            to: { root: into.root, path: joined(into.path, nameOf(item.path)) }
        };
    }

    /**
     * Place items in a folder, asking whether to replace when a name is taken. A move restates the
     * tabs and bookmarks over what moved and reads the folders it touched again.
     */
    async function place(
        items: OpsPlace[],
        into: OpsPlace,
        mode: 'move' | 'copy',
        confirm: Confirm
    ): Promise<{ outcome: Outcome; kept: boolean }> {
        let waiting = once(items);
        let replace = false;
        const done: string[] = [];
        const paths: string[] = [];
        let outcome: Outcome;
        let kept = false;
        for (;;) {
            const sent = waiting;
            outcome = await send({
                op: 'paste',
                mode,
                items: sent,
                root: into.root,
                path: into.path,
                replace
            });
            if (!answered(outcome)) return { outcome, kept: true };
            const finished = doneOf(
                outcome,
                sent.map((one) => one.path)
            );
            done.push(...finished);
            if (outcome.ok) paths.push(...outcome.paths);
            const moved = sent.filter((one) => finished.includes(one.path));
            const gone = mode === 'move' ? moved : [];
            await landed(
                gone.map((one) => movedTo(one, into)),
                [into, ...gone.map((one) => ({ root: one.root, path: parentPath(one.path) }))],
                gone
            );
            if (outcome.ok || outcome.error !== 'exists' || replace) break;
            const sure = await confirm({
                kind: 'replace',
                name: nameOf(outcome.failed ?? '')
            });
            if (!sure) {
                kept = true;
                break;
            }
            replace = true;
            waiting = sent.filter((one) => !finished.includes(one.path));
        }
        return {
            outcome: outcome.ok
                ? { ok: true, paths }
                : { ok: false, error: outcome.error, done, failed: outcome.failed },
            kept
        };
    }

    async function paste(into: OpsPlace, confirm: Confirm): Promise<Outcome> {
        const used = clip;
        if (used === null) return { ok: true, paths: [] };
        const placed = await place(
            used.items,
            into,
            used.mode === 'cut' ? 'move' : 'copy',
            confirm
        );
        if (used.mode === 'cut' && !placed.kept && clip === used) clip = null;
        return placed.outcome;
    }

    async function drop(
        items: OpsPlace[],
        into: OpsPlace,
        copied: boolean,
        confirm: Confirm
    ): Promise<Outcome> {
        return (await place(items, into, copied ? 'copy' : 'move', confirm)).outcome;
    }

    async function upload(
        into: OpsPlace,
        name: string,
        data: string,
        confirm: Confirm
    ): Promise<Outcome> {
        const request = (replace: boolean): OpsRequest => ({
            op: 'upload',
            root: into.root,
            path: into.path,
            name,
            data,
            replace
        });
        let outcome = await send(request(false));
        if (!outcome.ok && outcome.error === 'exists') {
            if (!(await confirm({ kind: 'replace', name }))) return outcome;
            outcome = await send(request(true));
        }
        if (answered(outcome)) await landed([], [into], []);
        return outcome;
    }

    async function undoFile(record: FileRecord, roots: FsRoot[]): Promise<WriteAnswer> {
        const answer = await writes.undoWrite(record.at);
        if (answer.ok && answer.changed.length > 0) {
            answeredCount += 1;
            await landed(undoneMoves(record, roots), [], []);
            await rewritten(replacedPlaces(record, roots));
            fs.invalidate();
        }
        return answer;
    }

    /** Open the folder panel and read what it came to. */
    async function pick(): Promise<ReturnType<typeof pickedOf>> {
        const posted = await writes.postCommand(PICK_PATH, {});
        return pickedOf(posted.body, posted.failed);
    }

    async function addFolders(): Promise<FoldersAdded> {
        const picked = await pick();
        if (!picked.ok) return { ok: false, picker: picked.error };
        const current = fs.workspaces();
        const roots = current.workspaces.find((one) => one.name === current.current)?.roots ?? [];
        const { add, skipped } = foldersToAdd(picked.paths, roots);
        let added = 0;
        let refused = '';
        for (const dir of add) {
            const answer = await fs.addRoot(dir);
            if (answer.ok) added += 1;
            else if (refused === '') refused = answer.error ?? 'refused';
        }
        return { ok: true, added, skipped, refused };
    }

    async function openFolder(): Promise<FolderOpened> {
        const picked = await pick();
        if (!picked.ok) return { ok: false, picker: picked.error };
        const current = fs.workspaces();
        const roots = current.workspaces.find((one) => one.name === current.current)?.roots ?? [];
        const choice = folderChoice(picked.paths, roots);
        if (choice.kind === 'inside') {
            layout.showFolderInFiles(choice.path, choice.root);
        } else if (choice.kind === 'outside') {
            const id = layout.openView(FILES_VIEW);
            if (id !== '') {
                ui.setInstanceState(
                    id,
                    patchedFilesView(ui.instanceState(id), { outside: choice.dir })
                );
            }
        }
        return { ok: true, choice };
    }

    return {
        clipboard,
        copy,
        cut,
        clearClipboard,
        compareFile,
        selectForCompare,
        unsaved,
        paste,
        drop,
        answers: () => answeredCount,
        trash,
        create,
        rename,
        upload,
        undoFile,
        replace,
        lspEdit,
        addFolders,
        openFolder
    };
}
