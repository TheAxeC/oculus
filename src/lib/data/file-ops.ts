// Layer 1, data. The rules of a file operation, once: what a file or folder name may be, the name a
// copy takes, the sizes the page and the server both hold, the words a refusal is one of, and the
// shapes of the request and of the answer.
//
// It exists once because the Files view refuses a name while it is typed and the server refuses
// the same name when it arrives, and a copy of the rule on each side would let the two disagree
// about what a name is. The name rule is VS Code's `validateFileName` on macOS: a name is made well
// formed (tabs trimmed from its ends, trailing `/` and `\` dropped), `/` and `\` both separate
// segments, and an empty segment is dropped, so `a//b` is `a/b`. The copy name is VS Code's simple
// `incrementFileName`: `report.md` becomes `report copy.md`, then `report copy 2.md`.
//
// The change log records each operation that changed something as one `files` record whose `before`
// and `after` are lists of FileStamp, so the server that writes them, the server that takes them
// back and the History view that draws them read one shape.
//
// A replace names the hits it replaces by the line and the place in it where each match starts,
// with the text matched, which is what lets the server refuse a file that has changed since the
// search. Its answer carries the hits of every file it wrote as they are after the write
// (`Reread`), each with the place it had before the write when the write did not change its text,
// so the page holds the hits the file has now and keeps what the reader dismissed.
//
// An `lsp-edit` is the edit a language server asks for in files no tab holds: it names each file
// by its root and path, the SHA-256 of the bytes the edit was computed for and the edits of the
// protocol, and the server writes all of them or none. A `writing-fix` has the same shape: the
// edits the writing rules' folder Fix All made for the files its reader ticked, written the same
// way.
//
// Nothing here runs a process or touches a file: text in, a verdict out.

import type { SearchHit } from './model/model-search.ts';
import type { TextEdit } from './prose/text-edits.ts';

/** The largest text a code window draws, and the largest file a comparison reads. */
export const TEXT_LIMIT = 2 * 1024 * 1024;

/**
 * The largest file whose copy the local history keeps before a delete or a language server's edit
 * changes it, and the largest a language server's edit reads and writes, in bytes.
 */
export const WRITE_MAX_BYTES = 5 * 1024 * 1024;

/** The same limit in megabytes, which the sentences that name it say. */
export const WRITE_MAX_MEGABYTES = WRITE_MAX_BYTES / (1024 * 1024);

/** The largest file one upload carries, in bytes, which the Memories wall's pictures share. */
export const MAX_UPLOAD_BYTES = 32 * 1024 * 1024;

/** The same limit in MB, as the sentences that refuse a larger file name it. */
export const MAX_UPLOAD_MB = MAX_UPLOAD_BYTES / (1024 * 1024);

/**
 * How long the desktop host waits for a deck's print route to say it is ready, loading included.
 */
export const READY_WAIT_MS = 60_000;

/** The largest text one unsaved draft carries to the deck route, in bytes. */
export const MAX_DRAFT_BYTES = 1024 * 1024;

/**
 * The extensions a picture folder is filtered to, and the only ones a folder's route serves: the
 * server's reader of a wallpaper or Memories folder reads the list.
 */
export const PICTURE_EXTENSIONS: readonly string[] = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * The longest name of one file or folder, in UTF-16 units, as VS Code's `isValidBasename` counts.
 */
export const MAX_NAME_LENGTH = 255;

/** The endpoint every file operation is posted to, and a comparison is read from. */
export const OPS_PATH = '/api/ops';

/**
 * The words a refused operation is one of. `token` and `not-an-action` are the two a request is
 * refused with before it is read; the others name the check that refused it, in the order the
 * server makes them.
 */
export type OpsRefusal =
    | 'token'
    | 'not-an-action'
    | 'outside'
    | 'missing'
    | 'root'
    | 'protected'
    | 'invalid_name'
    | 'exists'
    | 'into_itself'
    | 'not_a_folder'
    | 'denied'
    | 'trash_failed'
    | 'too_large'
    | 'not_base64'
    | 'bad-query'
    | 'binary'
    | 'search-failed'
    | 'changed'
    | 'marker';

/** Every refusal word, for a map that must name each of them. */
export const OPS_REFUSALS: readonly OpsRefusal[] = [
    'token',
    'not-an-action',
    'outside',
    'missing',
    'root',
    'protected',
    'invalid_name',
    'exists',
    'into_itself',
    'not_a_folder',
    'denied',
    'trash_failed',
    'too_large',
    'not_base64',
    'bad-query',
    'binary',
    'search-failed',
    'changed',
    'marker'
];

/** A file or folder as an operation names it: a served root's key and a path under it. */
export type OpsPlace = { root: string; path: string };

/** One match a replace names: its line, where it starts in the line, and the text it matched. */
export type ReplaceHit = {
    /** The line's number in the file, counting from one. */
    line: number;
    /** Where the match starts in the whole line, in UTF-16 units counted from zero. */
    at: number;
    /** The text the match covered when the search found it. */
    match: string;
};

/** One file a replace names, with the matches in it to replace. */
type ReplaceItem = { root: string; path: string; hits: ReplaceHit[] };

/** The half of a search that decides what matches: the pattern, how it is read, and its folder. */
export type ReplaceQuery = {
    q: string;
    word: boolean;
    case: boolean;
    regex: boolean;
    /** The folder under the root the search was scoped to, the empty string for the whole root. */
    under: string;
};

/** One operation, as the page posts it and the server reads it. */
export type OpsRequest =
    | { op: 'create'; root: string; path: string; name: string; folder: boolean }
    | { op: 'rename'; root: string; path: string; name: string }
    | { op: 'trash'; root: string; paths: string[] }
    | { op: 'delete'; root: string; paths: string[] }
    | {
          op: 'paste';
          mode: 'copy' | 'move';
          items: OpsPlace[];
          root: string;
          path: string;
          replace: boolean;
      }
    | {
          op: 'upload';
          root: string;
          path: string;
          name: string;
          data: string;
          replace: boolean;
      }
    | {
          op: 'replace';
          query: ReplaceQuery;
          /** The replace text as typed, read as the search view's replace box reads it. */
          replace: string;
          preserveCase: boolean;
          items: ReplaceItem[];
      }
    | {
          op: 'preview';
          query: ReplaceQuery;
          /** The replace text as typed, read as the search view's replace box reads it. */
          replace: string;
          preserveCase: boolean;
          /** The one file previewed. */
          root: string;
          path: string;
          /** The matches to replace; one the file no longer holds is left unreplaced. */
          hits: Pick<ReplaceHit, 'line' | 'at'>[];
      }
    | { op: 'lsp-edit'; files: LspEditFile[] }
    | { op: 'writing-fix'; files: LspEditFile[] };

/**
 * One file of an `lsp-edit` or a `writing-fix`: where it is, the SHA-256 of its bytes as the edit
 * was computed for them (lower-case hex), and the edits in the protocol's positions, which name
 * the text before any edit.
 */
export type LspEditFile = { root: string; path: string; hash: string; edits: TextEdit[] };

/**
 * A hit of a written file read again: the hit, and its place before the write when it had one, with
 * `edited` when the write changed other text on the hit's line.
 */
export type RereadHit = SearchHit & { was?: { line: number; at: number; edited?: true } };

/**
 * The hits one written file holds after the write, in file order, or `failed` when they could not
 * be read (the search timed out or failed, or the file holds more than a page keeps).
 */
export type Reread = { root: string; path: string; hits: RereadHit[]; failed?: boolean };

/**
 * What an operation answers. A list of items that stopped part way names the items done before it
 * and the one it stopped at, both by the path the request gave; a replace names a file as its root
 * and its path joined by a slash.
 */
export type OpsAnswer =
    | { ok: true; path?: string; paths?: string[]; rereads?: Reread[] }
    | { ok: false; error: OpsRefusal; done?: string[]; failed?: string; rereads?: Reread[] };

/**
 * What a typed name comes to: the segments it makes and whether any has whitespace at an end (a
 * warning, never a refusal), or why it is refused. `leading_slash` is a name opening with `/` or
 * `\`, and `invalid` a segment that is `.`, `..`, only whitespace, holds a NUL or is too long.
 */
export type NameCheck =
    | { ok: true; segments: string[]; whitespace: boolean }
    | { ok: false; why: 'empty' | 'leading_slash' | 'invalid' };

/** A name with the tabs at its ends and the slashes after its last segment taken off. */
function wellFormed(name: string): string {
    return name
        .replace(/^\t+|\t+$/g, '')
        .replace(/\/+$/, '')
        .replace(/\\+$/, '');
}

/** Whether one segment can be the name of a file or folder on macOS. */
function validSegment(segment: string): boolean {
    if (/^\s+$/.test(segment) || segment === '.' || segment === '..') return false;
    if (segment.includes('\0')) return false;
    return segment.length <= MAX_NAME_LENGTH;
}

/** What a name typed for a new or renamed file or folder comes to. */
export function checkName(name: string): NameCheck {
    const made = wellFormed(name);
    if (made === '' || /^\s+$/.test(made)) return { ok: false, why: 'empty' };
    if (made.startsWith('/') || made.startsWith('\\')) return { ok: false, why: 'leading_slash' };
    const segments = made.split(/[\\/]/).filter((one) => one !== '');
    if (!segments.every(validSegment)) return { ok: false, why: 'invalid' };
    return { ok: true, segments, whitespace: segments.some((one) => /^\s|\s$/.test(one)) };
}

/** The extension of a name with its dot, and the empty string for none or for a dotfile. */
function extensionOf(name: string): string {
    const at = name.lastIndexOf('.');
    return at <= 0 ? '' : name.slice(at);
}

/** How many characters of a name come before its extension, which is what a rename selects. */
export function stemLength(name: string): number {
    return name.length - extensionOf(name).length;
}

/**
 * The name a copy takes, by VS Code's simple increment: `name` becomes `name copy`, and `name
 * copy` becomes `name copy 2`, then `name copy 3`, each keeping the extension, until `taken`
 * says the name is free. A folder has no extension, so `v1.2` becomes `v1.2 copy`.
 */
export function freeName(
    name: string,
    taken: (candidate: string) => boolean,
    folder = false
): string {
    let candidate = name;
    while (taken(candidate)) candidate = incremented(candidate, folder);
    return candidate;
}

/** One step of the increment. */
function incremented(name: string, folder: boolean): string {
    const extension = folder ? '' : extensionOf(name);
    const stem = name.slice(0, name.length - extension.length);
    const copy = /^(.+ copy)( \d+)?$/.exec(stem);
    if (copy === null) return `${stem} copy${extension}`;
    const digits = copy.at(2);
    const number = digits === undefined ? 1 : Number.parseInt(digits, 10);
    return `${copy[1]} ${number + 1}${extension}`;
}

/** The address a comparison of two files is read from. */
export function compareUrl(file: OpsPlace, against: OpsPlace): string {
    const parameters = new URLSearchParams({
        root: file.root,
        path: file.path,
        withRoot: against.root,
        withPath: against.path
    });
    return `${OPS_PATH}?${parameters.toString()}`;
}

/** The address a comparison of a file with one of its copies in the local history is read from. */
export function savedUrl(file: OpsPlace, save: string): string {
    const parameters = new URLSearchParams({ root: file.root, path: file.path, save });
    return `${OPS_PATH}?${parameters.toString()}`;
}

/** What a preview of a replace in one file is read with: the replace and the hits to replace. */
export type ReplacePreview = {
    query: ReplaceQuery;
    replace: string;
    preserveCase: boolean;
    hits: Pick<ReplaceHit, 'line' | 'at'>[];
};

/**
 * The request the file with a replace applied is read with, as the right side of a comparison with
 * the file as it is: a POST of the replace's own fields, with the file and its hits in the body so
 * that the number of hits is not limited by the length of an address.
 */
export function previewRequest(
    file: OpsPlace,
    preview: ReplacePreview
): Extract<OpsRequest, { op: 'preview' }> {
    return {
        op: 'preview',
        query: preview.query,
        replace: preview.replace,
        preserveCase: preview.preserveCase,
        root: file.root,
        path: file.path,
        hits: preview.hits.map((one) => ({ line: one.line, at: one.at }))
    };
}

/**
 * The `kind` the change log files a file operation under, which is the writer an undo goes through.
 */
export const FILES_KIND = 'files';

/**
 * The operations a `files` record names in its `field`: a paste is `copy` or `move` by its mode.
 */
export const FILE_FIELDS = [
    'create',
    'rename',
    'move',
    'copy',
    'upload',
    'trash',
    'delete',
    'replace',
    'lsp-edit',
    'writing-fix'
] as const;

/** One of the operations a `files` record names. */
export type FileField = (typeof FILE_FIELDS)[number];

/**
 * What was at a path when a record was made. `size` and `mtime` (milliseconds) are the file's own,
 * and for a folder the bytes and the newest modification below it, so a folder that something was
 * added to is not the folder the operation left. `kept` is the id of the copy of a file's content
 * the local history holds, made before a trash or a delete.
 */
export type FileStamp = {
    path: string;
    kind: 'file' | 'dir' | 'link';
    size: number;
    mtime: number;
    kept?: string;
};
