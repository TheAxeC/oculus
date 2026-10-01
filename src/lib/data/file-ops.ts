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
// Nothing here runs a process or touches a file: text in, a verdict out.

/** The largest text a code window draws, and the largest file a comparison reads. */
export const TEXT_LIMIT = 2 * 1024 * 1024;

/** The largest file one upload carries, in bytes, which the Memories wall's pictures share. */
export const MAX_UPLOAD_BYTES = 32 * 1024 * 1024;

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
    | 'not_base64';

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
    'not_base64'
];

/** A file or folder as an operation names it: a served root's key and a path under it. */
export type OpsPlace = { root: string; path: string };

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
      };

/**
 * What an operation answers. A list of items that stopped part way names the items done before it
 * and the one it stopped at, both by the path the request gave.
 */
export type OpsAnswer =
    | { ok: true; path?: string; paths?: string[] }
    | { ok: false; error: OpsRefusal; done?: string[]; failed?: string };

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
