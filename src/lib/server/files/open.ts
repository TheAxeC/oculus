// Layer 2, server. The authenticated open action for a file or a folder, and the two ways oculus
// hands anything to macOS `open`.
//
// A requested path is resolved inside one of the roots the file browser serves, with realpath on
// both ends, before the operating system sees it. The boundary is the roots: a dotfile or a file
// under a build folder, which the tree leaves out of its listing, is resolved like any other path
// under a root.
//
// A folder is never opened: it is revealed, `open -R`, which has Finder select it in its parent's
// window and launches nothing, so an application or installer bundle is shown rather than run. A
// symlink named like a file that points at a folder is revealed as that folder.
//
// A file is opened by the one application `open.program_ext` of config/behavior.yml names for its
// extension, `open -b <bundle id>`, so neither a per-file Open With choice nor the machine's
// default for the type decides the program. The extension of the name asked for and of the real
// name must both have an entry, and the real one's names the application. A listed file is still
// refused when its mode carries an execute bit, when its first bytes are a Finder bookmark (`book`,
// four bytes, `mark`), or when its `com.apple.FinderInfo` attribute marks it as an alias, since
// `open` follows an alias to wherever it points. The map is read at every request, so an edit to it
// applies at once.

import { scalar } from '../../data/helpers/guards.ts';
import { execFile } from 'node:child_process';
import { closeSync, openSync, readSync, realpathSync, statSync } from 'node:fs';
import { basename, isAbsolute, resolve, sep } from 'node:path';
import { isBundleId, programFor, type ProgramApps } from '../../data/helpers/opens-in-program.ts';
import { hasToken, sameOrigin } from '../core/auth.ts';
import { HUB_ROOT, resolveRootPath, type Root } from './files.ts';

// The URL opener is declared beside the connect flow that is its other reader, and handed on here
// with the path opener, so the composition root takes both from this module.
import type { Opener } from '../accounts/connect/oauth.ts';

export type { Opener };

/**
 * What the open endpoint hands to the operating system: a file and its application, or a folder.
 */
export type OpenTarget =
    { kind: 'file'; path: string; app: string } | { kind: 'folder'; path: string };

/**
 * How a file or a folder reaches the operating system. It is injectable so route tests open
 * nothing.
 */
export type PathOpener = (target: OpenTarget) => Promise<void> | void;

/**
 * What reads a file's `com.apple.FinderInfo` extended attribute: its bytes, or null when the file
 * carries no such attribute. Any other failure rejects. It is injectable so a test can make it
 * fail.
 */
export type FinderInfoReader = (path: string) => Promise<Buffer | null>;

/** The system binaries this module runs, by absolute path so no PATH entry stands in for them. */
const OPEN = '/usr/bin/open';
const XATTR = '/usr/bin/xattr';

/** The sentence every refusal of a path outside the roots carries. */
const OUTSIDE = 'the path is outside the configured roots';

/** The sentence a refusal of a path with nothing to open at it carries. */
const MISSING = 'there is no file or folder at the path';

/** The sentence a refusal of a file no application may be handed carries. */
const RUNS = 'the file would run rather than open';

/** The sentence a refusal of a root key no root carries. */
const NO_ROOT = 'the root names no served root';

/** How many bytes of a file are read to tell a Finder bookmark, whose header fits in them. */
const BOOKMARK_HEAD = 16;

/** The byte of FinderInfo holding the high byte of the Finder flags, and its alias bit. */
const FINDER_FLAGS_BYTE = 8;
const ALIAS_FLAG = 0x80;

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' }
    });
}

/** A refusal of one field of the body, in the shape the page's write answers read. */
function refuse(status: number, field: string, reason: string): Response {
    return json(status, { error: reason, refused: [{ field, reason }] });
}

/** Whether a resolved path is the root itself or below it. */
function inside(path: string, root: string): boolean {
    return path === root || path.startsWith(root + sep);
}

/** Whether a real path is a directory or a regular file right now. */
function fileOrFolder(real: string): boolean {
    try {
        const stat = statSync(real);
        return stat.isDirectory() || stat.isFile();
    } catch {
        return false;
    }
}

/** Run one system binary with an argument list and no shell, answering its standard output. */
function run(binary: string, args: string[]): Promise<string> {
    return new Promise((resolveRun, reject) => {
        execFile(binary, args, (error, stdout, stderr) => {
            if (error === null) {
                resolveRun(stdout);
                return;
            }
            const reason = stderr.trim() === '' ? scalar(error.message, 'failed') : stderr.trim();
            reject(new Error(reason));
        });
    });
}

/** Read `com.apple.FinderInfo` through `xattr -px`, and null when the file carries none. */
export async function readFinderInfo(path: string): Promise<Buffer | null> {
    let hex: string;
    try {
        hex = await run(XATTR, ['-px', 'com.apple.FinderInfo', path]);
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        if (reason.includes('No such xattr')) return null;
        throw error;
    }
    const digits = hex.replace(/\s+/g, '');
    if (!/^([0-9a-fA-F]{2})*$/.test(digits)) throw new Error('FinderInfo is not hex');
    return Buffer.from(digits, 'hex');
}

/**
 * Whether a file's first bytes are a Finder bookmark: `book`, four bytes of length, then `mark`. At
 * most BOOKMARK_HEAD bytes are read, and a file that cannot be read counts as one.
 */
function hasBookmarkHead(real: string): boolean {
    let handle: number | null = null;
    try {
        handle = openSync(real, 'r');
        const head = Buffer.alloc(BOOKMARK_HEAD);
        const read = readSync(handle, head, 0, BOOKMARK_HEAD, 0);
        return (
            read >= 12 &&
            head.toString('latin1', 0, 4) === 'book' &&
            head.toString('latin1', 8, 12) === 'mark'
        );
    } catch {
        return true;
    } finally {
        if (handle !== null) closeSync(handle);
    }
}

/**
 * Whether FinderInfo marks a file as an alias. A read that fails for any reason but absence does.
 */
async function aliasFlagged(real: string, reader: FinderInfoReader): Promise<boolean> {
    let info: Buffer | null;
    try {
        info = await reader(real);
    } catch {
        return true;
    }
    if (info === null) return false;
    return info.length > FINDER_FLAGS_BYTE && (info[FINDER_FLAGS_BYTE] & ALIAS_FLAG) !== 0;
}

/** Whether a regular file may be handed to an application at all, whatever its name says. */
async function safeFile(real: string, reader: FinderInfoReader): Promise<boolean> {
    const stat = statSync(real);
    if (!stat.isFile() || (stat.mode & 0o111) !== 0) return false;
    if (hasBookmarkHead(real)) return false;
    return !(await aliasFlagged(real, reader));
}

/**
 * What `open` may be handed for a real path, or null. `asked` is the path as the request named it:
 * a file's asked name and real name must both have an application in the map, and the real name's
 * is the one used. A folder is always revealed. Anything that cannot be read is refused.
 */
async function openTarget(
    real: string,
    asked: string,
    apps: ProgramApps,
    reader: FinderInfoReader
): Promise<OpenTarget | null> {
    try {
        if (statSync(real).isDirectory()) return { kind: 'folder', path: real };
        const app = programFor(basename(real), apps);
        if (app === null || programFor(basename(asked), apps) === null) return null;
        return (await safeFile(real, reader)) ? { kind: 'file', path: real, app } : null;
    } catch {
        return null;
    }
}

/**
 * Resolve an absolute or hub-relative path to an existing directory or regular file, without
 * following a symlink beyond an allowed root.
 */
function allowed(path: string, roots: Root[]): string | null {
    const hub = roots.find((root) => root.key === HUB_ROOT);
    const candidate = isAbsolute(path) ? path : hub === undefined ? path : resolve(hub.dir, path);
    let real: string;
    try {
        real = realpathSync(candidate);
    } catch {
        return null;
    }
    if (!fileOrFolder(real)) return null;
    for (const root of roots) {
        try {
            if (inside(real, realpathSync(root.dir))) return real;
        } catch {
            continue;
        }
    }
    return null;
}

/**
 * What macOpenPath will hand to the operating system, which is its own rule and not its caller's:
 * an absolute path that is already its own real path, a folder that is one, or a regular file with
 * no execute bit, no bookmark head and no alias flag, given with an application named by a bundle
 * id. The endpoint's `openTarget` is the narrowing and this is the floor under it.
 */
export async function openable(
    target: OpenTarget,
    reader: FinderInfoReader = readFinderInfo
): Promise<boolean> {
    const path = target.path;
    if (!isAbsolute(path) || path.startsWith('-')) return false;
    try {
        if (realpathSync(path) !== path) return false;
        if (target.kind === 'folder') return statSync(path).isDirectory();
        return isBundleId(target.app) && (await safeFile(path, reader));
    } catch {
        return false;
    }
}

/**
 * The arguments `open` is run with: `-b <bundle id> <path>` for a file, `-R <path>` for a folder.
 * `open`'s manual documents no `--` separator, so none is passed; the path is an absolute real
 * path, which starts with `/` and so is never read as an option.
 */
export function openArgs(target: OpenTarget): string[] {
    return target.kind === 'file' ? ['-b', target.app, target.path] : ['-R', target.path];
}

/**
 * Hand one file to its application or reveal one folder, refusing what `openable` does not take.
 */
export async function macOpenPath(target: OpenTarget): Promise<void> {
    if (!(await openable(target))) throw new Error('open refused');
    await run(OPEN, openArgs(target));
}

/**
 * What macOpenAddress will hand to the operating system: an `https` address and nothing else, so a
 * relative path, a `file:` or `javascript:` address and an argument `open` would read as an option
 * of its own all fall outside it.
 */
export function openableAddress(target: string): boolean {
    if (target.startsWith('-') || target === '') return false;
    try {
        return new URL(target).protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * An opener that hands one `https` address to a program as its one argument, refusing anything
 * else unopened. The program is macOS's `open` unless the machine's own file names another in
 * `open_bin`, which is how a served test run is given one that records the address instead.
 */
export function addressOpener(program: string): Opener {
    return async (target: string): Promise<void> => {
        if (!openableAddress(target)) throw new Error('open refused');
        await run(program, [target]);
    };
}

/** Hand one `https` address to macOS, refusing anything else unopened. */
export const macOpenAddress: Opener = addressOpener(OPEN);

/** The real path a body names that `open` may be given, or the refusal to answer with. */
async function target(
    body: Record<string, unknown>,
    path: string,
    roots: Root[],
    apps: ProgramApps,
    reader: FinderInfoReader
): Promise<OpenTarget | Response> {
    const real = resolved(body, path, roots);
    if (real instanceof Response) return real;
    return (await openTarget(real, path, apps, reader)) ?? refuse(403, 'path', RUNS);
}

/**
 * The real file or folder a body names inside a root, or the refusal of where it points. `{ path }`
 * is an absolute or hub-relative path inside any root; `{ root, path }` is a path relative to the
 * root of that key, and a key no root carries is refused on `root` rather than looked for anywhere
 * else.
 */
function resolved(body: Record<string, unknown>, path: string, roots: Root[]): string | Response {
    if (!('root' in body)) return allowed(path, roots) ?? refuse(403, 'path', OUTSIDE);
    const key = body.root;
    if (typeof key !== 'string' || !roots.some((one) => one.key === key)) {
        return refuse(400, 'root', NO_ROOT);
    }
    const found = resolveRootPath(roots, key, path);
    if ('error' in found) {
        return found.error === 'outside'
            ? refuse(403, 'path', OUTSIDE)
            : refuse(404, 'path', MISSING);
    }
    return fileOrFolder(found.path) ? found.path : refuse(404, 'path', MISSING);
}

/**
 * Refuse an untrusted path, or hand its canonical file or folder to the opener. `appsFor` reads
 * `open.program_ext` of the configuration as it is now, once per request; a map that cannot be read
 * answers 500 naming the key.
 */
export async function handleOpen(
    request: Request,
    token: string,
    roots: Root[],
    appsFor: () => ProgramApps,
    opener: PathOpener = macOpenPath,
    reader: FinderInfoReader = readFinderInfo
): Promise<Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    if (!hasToken(request, token)) {
        return json(403, { error: 'the write token is missing or stale' });
    }
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return json(400, { error: 'the body is not JSON' });
    }
    if (
        typeof body !== 'object' ||
        body === null ||
        Array.isArray(body) ||
        typeof (body as { path?: unknown }).path !== 'string' ||
        (body as { path: string }).path.trim() === ''
    ) {
        return json(400, { error: 'the path is required' });
    }
    let apps: ProgramApps;
    try {
        apps = appsFor();
    } catch (error) {
        return json(500, { error: error instanceof Error ? error.message : String(error) });
    }
    const path = (body as { path: string }).path;
    const found = await target(body as Record<string, unknown>, path, roots, apps, reader);
    if (found instanceof Response) return found;
    try {
        await opener(found);
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return json(500, { error: `the path could not be opened: ${reason}` });
    }
    return json(200, { ok: true, changed: [], refused: [] });
}
