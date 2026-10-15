// Layer 2, server. The file operations of the Files view under the served roots: create, rename,
// move to the Trash, delete for good, paste (copy or move) and upload, as POST /api/ops, and the
// comparison of two files, or of a file with one of its local-history copies (`save=`), as GET
// /api/ops. src/routes/api/(files)/ops/+server.ts is the few lines that join the request to the
// roots and the write chain.
//
// Every path is a root's key and a path under it. A path that is a symbolic link is acted on as the
// link: its parent folder is resolved by real path and its own name is kept, so a rename, a move,
// a trash or a delete of a link never reaches what it points at. The folder an item lands in is
// resolved by real path as well and must lie inside its root, so no segment of a name walks out.
//
// The refusals are made in one order: `outside`, `missing`, `root`, `invalid_name`, `exists`,
// `into_itself`, `not_a_folder`, and then what the system answers. A list of items runs in order
// and stops at the first that fails, naming the items done before it and the one it stopped at.
//
// An operation that changed something is recorded in the change log as one `files` record (see
// fs/file-changes.ts): its field is `create`, `rename`, `move`, `copy`, `upload`, `trash` or
// `delete`, and its `before` and `after` stamp the paths it took from and put in place. Before a
// trash or a delete, the content of each file named (not of the files inside a folder) up to 5 MB
// is kept in the local history, so server/edit/writes/file-undo.ts can write it back while the
// newest 50 delete copies (server/files/fs/history.ts) still hold it. The record is
// appended when the operation ends, for the items it did before an item it stopped at.
//
// A replace of the Search view is the same endpoint's `replace` operation
// (fs/operations/replace.ts): the matches a request names are replaced file by file, and the
// request is recorded as one `files` record whose field is `replace`, with each file's content
// before it kept in the local history so the undo can write it back. The Replace Preview is the
// same endpoint's `preview` operation, read-only and outside the write chain, whose body names the
// file and its hits as the replace names them.
//
// Each operation runs behind the write chain `opsWrites`, apart from the workspace chain, so a long
// copy holds up another file operation and nothing else. The Trash is a parameter of the entry
// point, so a test hands in a spy and moves nothing to the real Trash.
//
// What the system answers is mapped to a word: `EACCES`, `EPERM` and `EROFS` are `denied` and
// `ENAMETOOLONG` is `invalid_name`. An upload is one file's bytes as base64 under one name that
// holds no `/`. An upload that replaces a file keeps the replaced bytes in the local history and
// names them in its record, so its undo writes them back, and sends the file to the Trash first
// unless the caller writes in place (`trashReplaced: false`). A copy onto a taken name takes the
// next free name (`report copy.md`, then `report copy 2.md`), and a move onto a taken name is
// `exists` until the page sends `replace: true`, which sends the taken item to the Trash first. The
// GET answers the two sides of a comparison as a `DiffSides`, `with*` being the left side; a folder
// on a side is `not_a_folder` and a file over `TEXT_LIMIT` is `too_large`.
//
// A name that lands in a hub's notes folder, or a folder under it, follows the name rule of the
// notes (fs/notes.ts's noteLanding) on top of the rules here: a create, a rename, a move, a copy
// and an upload there refuse a name the rule refuses as `invalid_name` and a name another item of
// the folder has but for letter case or normalisation as `exists`, and write the name in NFC.

import { json } from '@sveltejs/kit';
import { constants, lstatSync, readFileSync, statSync } from 'node:fs';
import { cp, lstat, mkdir, open, rename, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import trashLibrary from 'trash';
import {
    MAX_UPLOAD_BYTES,
    TEXT_LIMIT,
    checkName,
    freeName,
    type OpsAnswer,
    type OpsRefusal,
    type OpsRequest
} from '../../../data/file-ops.ts';
import { hubDirs, privateFolders } from '../../../data/helpers/files/private-folders.ts';
import {
    FILES_KIND,
    type FileField,
    type FileStamp,
    type UploadField
} from '../../../data/file-ops.ts';
import type { DiffSides } from '../../../data/model/index.ts';
import { tokenedBody } from '../../core/auth.ts';
import { logChanges, type ChangeLog } from '../../core/changes.ts';
import { chained, writeBytesAtomic, type FsWrites } from '../../core/json.ts';
import { below, inside, realPath } from '../../core/paths.ts';
import { resolveRootPath, type Root } from '../files.ts';
import { isBinaryFile } from '../source/source.ts';
import type { SearchRunner } from '../search/search.ts';
import { recordOf, stampKept, stampOf, unkeep } from './file-changes.ts';
import { defaultHistoryDir, historyPath, readCopy } from './history.ts';
import { lspEditFiles } from './lsp-edit.ts';
import { noteLanding, type Landing } from './notes.ts';
import { opsShape } from './operations/ops-shape.ts';
import { previewReplace, replaceFiles } from './operations/replace.ts';

/** What an operation runs over: the roots it may touch and the chain that orders its writes. */
export type OpsTarget = {
    roots: Root[];
    writes: FsWrites;
    /**
     * The change log each operation that changed something is recorded in; none records nothing.
     */
    changes?: ChangeLog;
    /** The home folder, whose `.oculus` folder no edit is made in; the machine's by default. */
    home?: string;
    /**
     * The local history folder a trash or a delete keeps the content of a file in; none keeps none.
     */
    history?: string;
    /**
     * Milliseconds the search of one file is given when a replace or its preview runs ripgrep, from
     * `search.timeout_s`; none refuses a replace as `search-failed`.
     */
    searchTimeout?: number;
};

/** The calls a test replaces: the Trash, a step held inside the write chain, and ripgrep. */
export type OpsDeps = {
    trash?: (path: string, options: { glob: false }) => Promise<void>;
    /**
     * Whether an upload that replaces a file sends the replaced file to the Trash first; it does by
     * default. A caller that writes files in place (the hosts of apps) passes false: the local
     * history keeps the replaced bytes and the record's undo writes them back.
     */
    trashReplaced?: boolean;
    slow?: () => Promise<void>;
    search?: SearchRunner;
    /** The view id of the app whose host made the write, recorded on its change record. */
    app?: string;
    /**
     * What an upload is recorded as when the caller names it: else `write-file` for an upload an
     * app's host makes (its `workspace.fs.writeFile`), and `upload` for any other.
     */
    uploadAs?: UploadField;
};

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/** A refusal before any item, or the stop of an operation with no items. */
export type Fail = { ok: false; error: OpsRefusal };

const fail = (error: OpsRefusal): Fail => ({ ok: false, error });

/** Whether a step answered a refusal rather than its value. */
function refused(step: unknown): step is Fail {
    return typeof step === 'object' && step !== null && 'ok' in step && step.ok === false;
}

/** The name a landing writes, or the refusal it answers. */
function landingOf(landing: Landing): string | Fail {
    return 'refused' in landing ? fail(landing.refused) : landing.name;
}

/** What one operation runs with: the roots, the Trash and the rest of an operation's inputs. */
export type Scope = {
    roots: Root[];
    trash: NonNullable<OpsDeps['trash']>;
    /** Whether an upload that replaces a file sends the replaced file to the Trash first. */
    trashReplaced: boolean;
    /** The folders no `lsp-edit` or `writing-fix` writes in (`privateFolders`). */
    withheld: readonly string[];
    /** The folders of the served hubs, whose notes folders a name lands in by their rule. */
    hubs: readonly string[];
    history?: string;
    /** The search timeout and the ripgrep runner a replace uses. */
    search: { timeout?: number; run?: SearchRunner };
    /** What the operation has changed so far, which becomes its record. */
    note: Note;
    /** The field an upload is recorded under. */
    uploadAs: UploadField;
};

/** The change one operation made: its field, and the stamps before and after. */
type Note = { field: FileField | null; before: FileStamp[]; after: FileStamp[] };

/** Say an operation changed something: the stamps of what was there and of what is there now. */
function noted(
    scope: Scope,
    field: FileField,
    before: (FileStamp | null)[],
    after: (FileStamp | null)[]
) {
    scope.note.field = field;
    scope.note.before.push(...before.filter((one) => one !== null));
    scope.note.after.push(...after.filter((one) => one !== null));
}

/** The refusal a system error stands for, or null for one that is not a refusal. */
function refusalOf(error: unknown): OpsRefusal | null {
    const code = (error as NodeJS.ErrnoException | null)?.code;
    if (code === 'EACCES' || code === 'EPERM' || code === 'EROFS') return 'denied';
    if (code === 'ENAMETOOLONG') return 'invalid_name';
    if (code === 'ENOENT') return 'missing';
    if (code === 'EEXIST' || code === 'ENOTEMPTY') return 'exists';
    if (code === 'ENOTDIR') return 'not_a_folder';
    return null;
}

/** Run a change to the disk, answering a refusal for an error the system gives, else rethrowing. */
async function attempt(change: () => Promise<unknown>): Promise<Fail | null> {
    try {
        await change();
        return null;
    } catch (error) {
        const why = refusalOf(error);
        if (why === null) throw error;
        return fail(why);
    }
}

/** The stat of a path itself, a link not followed, or null when nothing is there. */
async function lstatOrNull(path: string): Promise<Awaited<ReturnType<typeof lstat>> | null> {
    try {
        return await lstat(path);
    } catch {
        return null;
    }
}

/** The real path of a served root's folder, `outside` for a key not served, `missing` if gone. */
function rootFolder(roots: Root[], key: string): string | Fail {
    const root = roots.find((one) => one.key === key);
    if (root === undefined) return fail('outside');
    return realPath(root.dir) ?? fail('missing');
}

/** An item as an operation names it: where it really is, and whether it is its root's folder. */
type Item = { real: string; rootFolder: string; isRoot: boolean };

/**
 * The item a root's key and a path name, a link taken as the link: its parent folder is resolved by
 * real path and must lie in the root, and the item's own name is kept.
 */
function resolveItem(roots: Root[], key: string, path: string): Item | Fail {
    const folder = rootFolder(roots, key);
    if (typeof folder !== 'string') return folder;
    const candidate = resolve(folder, path);
    if (!inside(candidate, folder)) return fail('outside');
    if (candidate === folder) return { real: folder, rootFolder: folder, isRoot: true };
    const parent = resolveRootPath(roots, key, relative(folder, dirname(candidate)));
    if ('error' in parent) return fail(parent.error);
    const real = join(parent.path, basename(candidate));
    if (!pathExists(real)) return fail('missing');
    return { real, rootFolder: folder, isRoot: false };
}

/** The folder a root's key and a path name, which must be a folder. */
function resolveFolder(roots: Root[], key: string, path: string): Item | Fail {
    const folder = rootFolder(roots, key);
    if (typeof folder !== 'string') return folder;
    const found = resolveRootPath(roots, key, path);
    if ('error' in found) return fail(found.error);
    try {
        if (!statSync(found.path).isDirectory()) return fail('not_a_folder');
    } catch {
        return fail('missing');
    }
    return { real: found.path, rootFolder: folder, isRoot: found.path === folder };
}

/** The path of an item under its root, with `/` between segments. */
function under(rootDir: string, real: string): string {
    return relative(rootDir, real).split(sep).join('/');
}

/**
 * The deepest folder of a name's leading segments that exists, starting at `from`, and the segments
 * after it that are still to be made. A segment that is a file is `not_a_folder`, and one that is
 * a link out of the root is `outside`.
 */
function walkTo(
    rootDir: string,
    from: string,
    segments: string[]
): { dir: string; rest: string[] } | Fail {
    let dir = from;
    for (const [index, segment] of segments.entries()) {
        const next = join(dir, segment);
        if (!pathExists(next)) return { dir, rest: segments.slice(index) };
        const real = realPath(next);
        if (real === null) return fail('not_a_folder');
        if (!inside(real, rootDir)) return fail('outside');
        if (!statSync(real).isDirectory()) return fail('not_a_folder');
        dir = real;
    }
    return { dir, rest: [] };
}

/** Whether anything is at the path, a link counting for itself. */
function pathExists(path: string): boolean {
    try {
        lstatSync(path);
        return true;
    } catch {
        return false;
    }
}

/** Move one item to the Trash, answering `trash_failed` when the call fails. */
async function sendToTrash(scope: Scope, real: string): Promise<Fail | null> {
    try {
        await scope.trash(real, { glob: false });
        return null;
    } catch {
        return fail('trash_failed');
    }
}

/** The answer of an operation over a list of items that stopped at one of them. */
function stopped(error: OpsRefusal, done: string[], failed: string): OpsAnswer {
    return { ok: false, error, done, failed };
}

/** An empty file made at the path, which fails when something is already there. */
async function newFile(path: string): Promise<void> {
    const handle = await open(path, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY);
    await handle.close();
}

/**
 * The segments of a name still to be made under a folder that is there, each as it lands by the
 * rule of a notes folder where it lands in one.
 */
function landedSegments(scope: Scope, dir: string, segments: string[]): string[] | Fail {
    const out: string[] = [];
    for (const segment of segments) {
        const one = landingOf(noteLanding(scope.hubs, join(dir, ...out), segment));
        if (refused(one)) return one;
        out.push(one);
    }
    return out;
}

/** A new empty file or folder, with the folders its name names made between. */
async function createItem(
    scope: Scope,
    request: Extract<OpsRequest, { op: 'create' }>
): Promise<OpsAnswer> {
    const folder = resolveFolder(scope.roots, request.root, request.path);
    if (refused(folder)) return folder;
    const made = checkName(request.name);
    if (!made.ok) return fail('invalid_name');
    const walked = walkTo(folder.rootFolder, folder.real, made.segments.slice(0, -1));
    if (refused(walked)) return walked;
    const named = landedSegments(scope, walked.dir, [...walked.rest, made.segments.at(-1) ?? '']);
    if (refused(named)) return named;
    const target = join(walked.dir, ...named);
    if (walked.rest.length === 0 && pathExists(target)) return fail('exists');
    const outcome = await attempt(async () => {
        if (walked.rest.length > 0) await mkdir(dirname(target), { recursive: true });
        if (request.folder) await mkdir(target);
        else await newFile(target);
    });
    if (outcome !== null) return outcome;
    const first = walked.rest.length > 0 ? join(walked.dir, named[0] ?? '') : target;
    noted(scope, 'create', [], [stampOf(first)]);
    return { ok: true, path: under(folder.rootFolder, target) };
}

/**
 * Whether two paths are one file under two spellings of its name, as a volume that ignores case.
 */
async function sameFile(first: string, second: string): Promise<boolean> {
    if (dirname(first) !== dirname(second)) return false;
    if (basename(first).toLowerCase() !== basename(second).toLowerCase()) return false;
    const [one, other] = await Promise.all([lstatOrNull(first), lstatOrNull(second)]);
    return one !== null && other !== null && one.ino === other.ino && one.dev === other.dev;
}

/** One item renamed in its folder, or moved into the folders its new name names. */
async function renameItem(
    scope: Scope,
    request: Extract<OpsRequest, { op: 'rename' }>
): Promise<OpsAnswer> {
    const item = resolveItem(scope.roots, request.root, request.path);
    if (refused(item)) return item;
    if (item.isRoot) return fail('root');
    const made = checkName(request.name);
    if (!made.ok) return fail('invalid_name');
    const name = made.segments.at(-1) ?? '';
    const middle = made.segments.slice(0, -1);
    const lexical = join(dirname(item.real), ...made.segments);
    const isFolder = (await lstatOrNull(item.real))?.isDirectory() === true;
    if (isFolder && below(lexical, item.real)) return fail('into_itself');
    const walked = walkTo(item.rootFolder, dirname(item.real), middle);
    if (refused(walked)) return walked;
    const own = walked.dir === dirname(item.real) ? basename(item.real) : undefined;
    const rest = landedSegments(scope, walked.dir, walked.rest);
    if (refused(rest)) return rest;
    const last = landingOf(noteLanding(scope.hubs, join(walked.dir, ...rest), name, own));
    if (refused(last)) return last;
    const target = join(walked.dir, ...rest, last);
    if (isFolder && below(target, item.real)) return fail('into_itself');
    if (target !== item.real && walked.rest.length === 0 && pathExists(target)) {
        if (!(await sameFile(item.real, target))) return fail('exists');
    }
    const was = stampOf(item.real);
    const outcome = await attempt(async () => {
        if (walked.rest.length > 0) await mkdir(dirname(target), { recursive: true });
        if (target !== item.real) await rename(item.real, target);
    });
    if (outcome !== null) return outcome;
    if (target !== item.real) noted(scope, 'rename', [was], [stampOf(target)]);
    return { ok: true, path: under(item.rootFolder, target) };
}

/**
 * The items of a list that are to be acted on: one a path appears for twice is kept once, and one
 * that lies inside another item of the list is dropped, since acting on the folder acts on it. An
 * item that could not be resolved stays, so the list stops at it in its place.
 */
function distinct<T extends { found: Item | Fail }>(items: T[]): T[] {
    const reals = items.flatMap((one) => (refused(one.found) ? [] : [one.found.real]));
    const seen = new Set<string>();
    return items.filter((one) => {
        if (refused(one.found)) return true;
        const real = one.found.real;
        if (seen.has(real)) return false;
        seen.add(real);
        return !reals.some((other) => below(real, other));
    });
}

/** Each item of a list moved to the Trash, or removed for good, in order. */
async function removeItems(
    scope: Scope,
    request: Extract<OpsRequest, { op: 'trash' | 'delete' }>
): Promise<OpsAnswer> {
    const folder = rootFolder(scope.roots, request.root);
    if (typeof folder !== 'string') return folder;
    const listed = request.paths.map((path) => ({
        path,
        found: resolveItem(scope.roots, request.root, path)
    }));
    const done: string[] = [];
    for (const { path, found } of distinct(listed)) {
        if (refused(found)) return stopped(found.error, done, path);
        if (found.isRoot) return stopped('root', done, path);
        const was = stampKept(found.real, scope.history);
        const outcome =
            request.op === 'trash'
                ? await sendToTrash(scope, found.real)
                : await attempt(() => rm(found.real, { recursive: true }));
        if (outcome !== null) {
            unkeep(was, scope.history);
            return stopped(outcome.error, done, path);
        }
        noted(scope, request.op, [was], []);
        done.push(path);
    }
    return { ok: true };
}

/** Copy `from` to `to`, a link kept a link with its target as written. */
function copyItem(from: string, to: string): Promise<void> {
    return cp(from, to, {
        recursive: true,
        verbatimSymlinks: true,
        errorOnExist: true,
        force: false
    });
}

/** Move `from` to `to`, a copy then a removal where the two are on different volumes. */
async function moveItem(from: string, to: string): Promise<void> {
    try {
        await rename(from, to);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EXDEV') throw error;
        await copyItem(from, to);
        await rm(from, { recursive: true });
    }
}

/** Each item of a list copied or moved into a folder, in order. */
async function pasteItems(
    scope: Scope,
    request: Extract<OpsRequest, { op: 'paste' }>
): Promise<OpsAnswer> {
    const dest = resolveFolder(scope.roots, request.root, request.path);
    if (refused(dest)) return dest;
    const listed = request.items.map((one) => ({
        path: one.path,
        found: resolveItem(scope.roots, one.root, one.path)
    }));
    const done: string[] = [];
    const paths: string[] = [];
    for (const { path, found } of distinct(listed)) {
        if (refused(found)) return stopped(found.error, done, path);
        if (found.isRoot && request.mode === 'move') return stopped('root', done, path);
        const name = basename(found.real);
        const isFolder = (await lstatOrNull(found.real))?.isDirectory() === true;
        if (isFolder && inside(dest.real, found.real)) return stopped('into_itself', done, path);
        const moves = request.mode === 'move' && dirname(found.real) !== dest.real;
        const own = request.replace ? name : undefined;
        const kept = moves ? landingOf(noteLanding(scope.hubs, dest.real, name, own)) : name;
        if (refused(kept)) return stopped(kept.error, done, path);
        const taken = join(dest.real, kept);
        let landed = taken;
        if (request.mode === 'copy') {
            const free = freeName(name, (one) => pathExists(join(dest.real, one)), isFolder);
            const copied = landingOf(noteLanding(scope.hubs, dest.real, free));
            if (refused(copied)) return stopped(copied.error, done, path);
            landed = join(dest.real, copied);
            const outcome = await attempt(() => copyItem(found.real, landed));
            if (outcome !== null) return stopped(outcome.error, done, path);
            noted(scope, 'copy', [], [stampOf(landed)]);
        } else if (moves) {
            const from = stampOf(found.real);
            if (pathExists(taken)) {
                if (!request.replace) return stopped('exists', done, path);
                if (below(found.real, taken)) return stopped('into_itself', done, path);
                const trashed = await sendToTrash(scope, taken);
                if (trashed !== null) return stopped(trashed.error, done, path);
            }
            const outcome = await attempt(() => moveItem(found.real, taken));
            if (outcome !== null) return stopped(outcome.error, done, path);
            noted(scope, 'move', [from], [stampOf(taken)]);
        }
        done.push(path);
        paths.push(under(dest.rootFolder, landed));
    }
    return { ok: true, paths };
}

/** The bytes of a base64 text, or the refusal: `too_large` over the cap, `not_base64` otherwise. */
function decoded(data: string): Buffer | Fail {
    if (data.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(data)) return fail('not_base64');
    const padding = data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0;
    if ((data.length / 4) * 3 - padding > MAX_UPLOAD_BYTES) return fail('too_large');
    return Buffer.from(data, 'base64');
}

/** One file's bytes written into a folder under a single-segment name. */
async function uploadItem(
    scope: Scope,
    request: Extract<OpsRequest, { op: 'upload' }>
): Promise<OpsAnswer> {
    const dest = resolveFolder(scope.roots, request.root, request.path);
    if (refused(dest)) return dest;
    const made = checkName(request.name);
    const single = made.ok && made.segments.length === 1 && !/[\\/]/.test(request.name);
    if (!made.ok || !single) return fail('invalid_name');
    const own = request.replace ? (made.segments[0] ?? '') : undefined;
    const name = landingOf(noteLanding(scope.hubs, dest.real, made.segments[0] ?? '', own));
    if (refused(name)) return name;
    const target = join(dest.real, name);
    const bytes = decoded(request.data);
    if (refused(bytes)) return bytes;
    const there = await lstatOrNull(target);
    let replaced: FileStamp | null = null;
    if (there !== null) {
        if (!request.replace) return fail('exists');
        if (there.isDirectory()) return fail('not_a_folder');
        replaced = there.isFile() ? stampKept(target, scope.history) : null;
        if (scope.trashReplaced) {
            const trashed = await sendToTrash(scope, target);
            if (trashed !== null) {
                unkeep(replaced, scope.history);
                return trashed;
            }
        }
        // The library writes through a link, so a link left standing is unlinked first.
        if ((await lstatOrNull(target))?.isSymbolicLink() === true) {
            const unlinked = await attempt(() => rm(target));
            if (unlinked !== null) return unlinked;
        }
    }
    const outcome = await attempt(() => {
        writeBytesAtomic(target, bytes);
        return Promise.resolve();
    });
    if (outcome !== null) {
        if (!scope.trashReplaced) unkeep(replaced, scope.history);
        return outcome;
    }
    // A replaced file whose bytes the history holds is named, so the record's undo writes them
    // back.
    noted(scope, scope.uploadAs, replaced?.kept === undefined ? [] : [replaced], [stampOf(target)]);
    return { ok: true, path: under(dest.rootFolder, target) };
}

/** Run one operation that writes. */
function run(scope: Scope, request: Exclude<OpsRequest, { op: 'preview' }>): Promise<OpsAnswer> {
    switch (request.op) {
        case 'create':
            return createItem(scope, request);
        case 'rename':
            return renameItem(scope, request);
        case 'trash':
        case 'delete':
            return removeItems(scope, request);
        case 'paste':
            return pasteItems(scope, request);
        case 'upload':
            return uploadItem(scope, request);
        case 'replace':
            return replaceFiles(
                {
                    roots: scope.roots,
                    history: scope.history,
                    timeout: scope.search.timeout,
                    run: scope.search.run,
                    note: (before, after) => noted(scope, 'replace', before, after)
                },
                request
            );
        case 'lsp-edit':
        case 'writing-fix':
            return Promise.resolve(
                lspEditFiles(
                    {
                        roots: scope.roots,
                        withheld: scope.withheld,
                        history: scope.history,
                        note: (before, after) => noted(scope, request.op, before, after)
                    },
                    request.files,
                    request.op
                )
            );
    }
}

/**
 * Append what an operation changed to the change log as one `files` record, with the id of the app
 * that made it when an app's host did. An operation that changed nothing, and a target with no log,
 * record nothing.
 */
async function recordNote(into: OpsTarget, note: Note, app: string | undefined): Promise<void> {
    if (note.field === null || into.changes === undefined) return;
    const record = recordOf(note.field, note.before, note.after);
    await logChanges(into.changes, FILES_KIND, [
        { ...record, file: resolve(record.file), ...(app === undefined ? {} : { app }) }
    ]);
}

/**
 * POST /api/ops: one operation, behind the process's token and in its place in the write chain.
 * A body that is no operation is `not-an-action`. The `preview` operation writes nothing, so it
 * runs outside the chain.
 */
export async function handleOps(
    request: Request,
    token: string,
    into: OpsTarget,
    deps: OpsDeps = {}
): Promise<Response> {
    const read = await tokenedBody(request, token, {
        headers: NO_STORE,
        words: { token: 'token', json: 'not-json' }
    });
    if (read instanceof Response) return read;
    const body = opsShape.safeParse(read.body);
    if (!body.success) return json({ error: 'not-an-action' }, { status: 400, headers: NO_STORE });
    const operation = body.data;
    if (operation.op === 'preview') return previewed(operation, into, deps);
    const answer = await runOps(into, operation, deps);
    return json(answer, { status: answer.ok ? 200 : 400, headers: NO_STORE });
}

/**
 * One operation that writes, in its place in the write chain and recorded in the change log. The
 * route and the hosts of apps (`workspace.applyEdit`) both write through it.
 */
export function runOps(
    into: OpsTarget,
    operation: Exclude<OpsRequest, { op: 'preview' }>,
    deps: OpsDeps = {}
): Promise<OpsAnswer> {
    return runOpsFrom(into, () => operation, deps);
}

/**
 * One operation that writes, made inside the write chain: `make` is called when the operation's
 * turn comes, so a file it reads is the one the operation then writes over, and it answers the
 * operation or the refusal that stops it.
 */
export function runOpsFrom(
    into: OpsTarget,
    make: () => Exclude<OpsRequest, { op: 'preview' }> | Fail,
    deps: OpsDeps = {}
): Promise<OpsAnswer> {
    const trash = deps.trash ?? ((path, options) => trashLibrary(path, options));
    return chained(into.writes, async () => {
        await deps.slow?.();
        const operation = make();
        if (refused(operation)) return operation;
        const scope: Scope = {
            roots: into.roots,
            trash,
            trashReplaced: deps.trashReplaced ?? true,
            withheld: privateFolders(hubDirs(into.roots), into.home ?? homedir()),
            hubs: hubDirs(into.roots),
            history: into.history,
            search: { timeout: into.searchTimeout, run: deps.search },
            note: { field: null, before: [], after: [] },
            uploadAs: deps.uploadAs ?? (deps.app === undefined ? 'upload' : 'write-file')
        };
        try {
            return await run(scope, operation);
        } finally {
            await recordNote(into, scope.note, deps.app);
        }
    });
}

/** One side of a comparison: the file's text and whether it is binary, or why it is refused. */
function side(roots: Root[], key: string, path: string): { text: string; binary: boolean } | Fail {
    const found = resolveRootPath(roots, key, path);
    if ('error' in found) return fail(found.error);
    const info = statSync(found.path);
    if (!info.isFile()) return fail(info.isDirectory() ? 'not_a_folder' : 'missing');
    if (info.size > TEXT_LIMIT) return fail('too_large');
    if (isBinaryFile(found.path)) return { text: '', binary: true };
    return { text: readFileSync(found.path, 'utf8'), binary: false };
}

/**
 * One copy of the file in the local history as a side of a comparison, or why it is refused. The id
 * is taken only from the file's own `entries.json`, so any other id is `missing`.
 */
function savedSide(
    roots: Root[],
    history: string,
    key: string,
    path: string,
    id: string
): { text: string; binary: boolean } | Fail {
    const real = historyPath(roots, key, path);
    if (real === null) return fail('outside');
    const copy = readCopy(history, real, id);
    if (copy === null) return fail('missing');
    return { text: copy.toString('utf8'), binary: false };
}

/**
 * GET /api/ops: the comparison of two files as the diff pane reads one. `with*` is the file
 * selected for compare and is the left side; `root` and `path` are the file asked for, the right.
 * `save=<id>` in place of `with*` makes the left side the copy of that file the local history
 * holds under that id.
 */
export function handleCompare(
    url: URL,
    roots: Root[],
    history: string = defaultHistoryDir()
): Response {
    const get = (key: string): string => url.searchParams.get(key) ?? '';
    const [root, path, withRoot, withPath, save] = [
        get('root'),
        get('path'),
        get('withRoot'),
        get('withPath'),
        get('save')
    ];
    const modified = side(roots, root, path);
    if (refused(modified)) return json(modified, { status: 400, headers: NO_STORE });
    const original =
        save === '' ? side(roots, withRoot, withPath) : savedSide(roots, history, root, path, save);
    if (refused(original)) return json(original, { status: 400, headers: NO_STORE });
    const binary = original.binary || modified.binary;
    // Two files, or a file and a version of it, that no git diff compares: no git line changes, so
    // the pane draws Monaco's own diff.
    const files: DiffSides[] = [
        {
            oldPath: save === '' ? `${withRoot}:${withPath}` : `${root}:${path}@${save}`,
            newPath: `${root}:${path}`,
            head: [],
            binary,
            encoded: false,
            original: binary ? '' : original.text,
            modified: binary ? '' : modified.text
        }
    ];
    return json({ ok: true, files }, { headers: NO_STORE });
}

/**
 * POST /api/ops `preview`: the file as it is and as it would be with the named matches replaced,
 * as the two sides of the diff pane the Replace Preview opens. A file the preview cannot show is
 * refused with the word of the check that refused it.
 */
async function previewed(
    request: Extract<OpsRequest, { op: 'preview' }>,
    into: Pick<OpsTarget, 'roots' | 'searchTimeout'>,
    deps: Pick<OpsDeps, 'search'>
): Promise<Response> {
    const { root, path } = request;
    const preview = await previewReplace(
        {
            roots: into.roots,
            timeout: into.searchTimeout,
            run: deps.search
        },
        { root, path },
        request
    );
    if (refused(preview)) return json(preview, { status: 400, headers: NO_STORE });
    // A file and the text the replacements would leave, which no git diff compares: no git line
    // changes, so the pane draws Monaco's own diff.
    const files: DiffSides[] = [
        {
            oldPath: `${root}:${path}`,
            newPath: `${root}:${path}`,
            head: [],
            binary: false,
            encoded: false,
            original: preview.original,
            modified: preview.modified
        }
    ];
    return json({ ok: true, files }, { headers: NO_STORE });
}
