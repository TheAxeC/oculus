// Layer 2, server. What an app reads of the files of a root: the bytes of a file, the names of a
// folder and the stat of either, answered under the app's own address on a dot-led first segment no
// app file can have (`.fs`, `.dir`, `.stat`), as `/apps/<name>/<key>/.fs/<root key>/<path>`. The
// root key is one percent-encoded segment, since it may hold a `/`.
//
// The route is the enforcement: the frame's `oculus.fs` methods ask the page first, and a frame
// that builds the address itself meets the same checks here. They run in this order: a machine app
// must have listed a folder of its manifest's `files` that holds the path (`not_declared`), and a
// root app reads its own root alone (`closed`); then the checks of `open({ file })` in their order
// (reach/open.ts `locate`): the segment rule and `closed_paths`, a shown root, the real path inside
// the root and outside oculus's own config folder. A refusal is the word as plain text with its
// status; an address with a wrong key, an app that is not approved or is disabled, or a dot-led
// segment before the root key is the empty 404 the app files answer.
//
// A file is streamed from a descriptor opened without following a link and without blocking, and
// the descriptor must be a regular file: a FIFO, socket or device file answers `closed` and is
// never read. The body is `application/octet-stream` and `Content-Disposition: attachment` under
// the app's sandbox policy, so an `.html` or `.svg` file of a root is never drawn as a document on
// oculus's origin. A folder lists at most `apps.scan_entries` names, the first the disk gives, and
// never a dot-led name, a name `closed_paths` closes, oculus's own config folder or a private
// folder.

import {
    closeSync,
    constants,
    createReadStream,
    fstatSync,
    lstatSync,
    openSync,
    opendirSync,
    statSync
} from 'node:fs';
import type { Stats } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { inClosedPaths, inFilesEntry } from '../../../../data/helpers/files/apps/apps.ts';
import { below, realPath } from '../../../core/paths.ts';
import type { HeldApp } from '../read/held.ts';
import { fileHeaders } from '../serve/address.ts';
import { isPrivate, locate, type OpenContext } from './open.ts';

/** The three reads, by the dot-led segment of their address. */
export type FsOp = 'read' | 'dir' | 'stat';

/** The dot-led first segments, and the read each one asks. */
export const FS_MARKERS: Record<string, FsOp> = { '.fs': 'read', '.dir': 'dir', '.stat': 'stat' };

/** VS Code's `FileType` numbers. */
const FILE = 1;
const FOLDER = 2;
const LINK = 64;

/** What a read of a root needs beyond the checks of `open`. */
export type FsContext = OpenContext & {
    /** The most names a folder lists. */
    scanEntries: number;
};

/** One request for a read of a root: the app, the decoded root key and path, and the policy. */
export type FsRequest = {
    request: Request;
    app: HeldApp;
    op: FsOp;
    root: string;
    path: string;
    /** The Content-Security-Policy the app's files are sent with. */
    policy: string;
    context: FsContext;
};

/** The word of a refusal and the status it is sent with. */
const STATUS = { closed: 403, not_declared: 403, missing: 404 } as const;

/** The headers of every answer: the app's policy, nothing sniffed, nothing kept, nothing drawn. */
function headersOf(type: string, length: number | null, policy: string): Record<string, string> {
    const headers = fileHeaders(type, length ?? 0);
    if (length === null) delete headers['content-length'];
    return {
        ...headers,
        'content-security-policy': policy,
        'content-disposition': 'attachment',
        'cache-control': 'no-store'
    };
}

/** A refusal: the word as plain text. */
function refusal(word: keyof typeof STATUS, policy: string): Response {
    return new Response(word, {
        status: STATUS[word],
        headers: headersOf('text/plain', word.length, policy)
    });
}

/** The `FileType` of a stat. */
function typeOfStat(stat: Stats): number {
    if (stat.isFile()) return FILE;
    return stat.isDirectory() ? FOLDER : 0;
}

/** The type of what a path names, 64 added for a link; a link that leads out of the root is 64. */
function entryType(path: string, rootReal: string): number {
    let own: Stats;
    try {
        own = lstatSync(path);
    } catch {
        return 0;
    }
    if (!own.isSymbolicLink()) return typeOfStat(own);
    const target = realPath(path, true);
    if (target === null || (target !== rootReal && !below(target, rootReal))) return LINK;
    try {
        return LINK + typeOfStat(statSync(target));
    } catch {
        return LINK;
    }
}

/** JSON as the answer of a read of names or a stat. */
function jsonAnswer(request: Request, value: unknown, policy: string): Response {
    const text = JSON.stringify(value);
    const bytes = Buffer.from(text, 'utf8');
    const headers = headersOf('application/json', bytes.length, policy);
    return new Response(request.method === 'HEAD' ? null : bytes, { headers });
}

/** Whether the app lists a folder that holds the path. */
function declared(app: HeldApp, root: string, path: string, rootKeys: readonly string[]): boolean {
    if (app.row.root !== '') return true;
    return app.row.readFolders.some((entry) => inFilesEntry(entry, rootKeys, root, path));
}

/** The names of a folder with the type of each, as `readDirectory` answers them. */
function listing(
    real: string,
    rootReal: string,
    context: FsContext,
    closed: readonly string[]
): [string, number][] {
    const names: [string, number][] = [];
    const folder = opendirSync(real);
    try {
        for (let read = 0; read < context.scanEntries; read += 1) {
            const entry = folder.readSync();
            if (entry === null) break;
            const hidden =
                entry.name.startsWith('.') ||
                inClosedPaths(relativeName(real, rootReal, entry.name), closed);
            if (hidden) continue;
            names.push([entry.name, entryType(join(real, entry.name), rootReal)]);
        }
    } finally {
        folder.closeSync();
    }
    return names;
}

/** The path of a name in a folder, relative to the root, for the `closed_paths` match. */
function relativeName(real: string, rootReal: string, name: string): string {
    const under = real === rootReal ? '' : real.slice(rootReal.length + 1);
    return under === '' ? name : `${under}/${name}`;
}

/** The bytes of a regular file, streamed from a descriptor that is checked once opened. */
function fileAnswer(request: Request, real: string, policy: string): Response {
    let before: Stats;
    try {
        before = statSync(real);
    } catch {
        return refusal('missing', policy);
    }
    if (before.isDirectory()) return refusal('missing', policy);
    if (!before.isFile()) return refusal('closed', policy);
    let descriptor: number;
    try {
        descriptor = openSync(
            real,
            constants.O_RDONLY | constants.O_NONBLOCK | constants.O_NOFOLLOW
        );
    } catch {
        return refusal('missing', policy);
    }
    const opened = fstatSync(descriptor);
    if (!opened.isFile()) {
        closeSync(descriptor);
        return refusal('closed', policy);
    }
    const headers = headersOf('application/octet-stream', opened.size, policy);
    if (request.method === 'HEAD') {
        closeSync(descriptor);
        return new Response(null, { headers });
    }
    const body = Readable.toWeb(
        createReadStream('', { fd: descriptor, autoClose: true })
    ) as ReadableStream;
    return new Response(body, { headers });
}

/** Answer one read of a root. */
export function serveFs(input: FsRequest): Response {
    const { app, op, root, path, policy, context } = input;
    const rootKeys = context.roots.map((one) => one.key);
    if (!declared(app, root, path, rootKeys)) return refusal('not_declared', policy);
    const found = locate({ app, root, path }, context, op !== 'read');
    if (found.answer !== 'ok') return refusal(found.answer, policy);
    if (op === 'read') return fileAnswer(input.request, found.real, policy);

    const shown = context.roots.find((one) => one.key === root);
    const rootReal = shown === undefined ? null : context.fs.realPath(shown.dir);
    if (shown === undefined || rootReal === null) return refusal('missing', policy);
    let stat: Stats;
    try {
        stat = statSync(found.real);
    } catch {
        return refusal('missing', policy);
    }
    if (!stat.isFile() && !stat.isDirectory()) return refusal('closed', policy);
    if (op === 'stat') {
        const typed = path === '' ? shown.dir : join(shown.dir, path);
        const type = entryType(typed, rootReal);
        return jsonAnswer(
            input.request,
            {
                type: type === 0 ? typeOfStat(stat) : type,
                ctime: stat.ctimeMs,
                mtime: stat.mtimeMs,
                size: stat.size
            },
            policy
        );
    }
    if (!stat.isDirectory()) return refusal('missing', policy);
    const closed = context.closedPaths ?? [];
    const configReal = context.fs.realPath(context.configDir);
    const names = listing(found.real, rootReal, context, closed).filter(
        ([name]) =>
            (configReal === null || join(found.real, name) !== configReal) &&
            !isPrivate(join(found.real, name), context)
    );
    return jsonAnswer(input.request, names, policy);
}
