// Layer 2, server. The answer to a request for an app's file under /apps/, and for the two shared
// files the apps load their bridge from.
//
// The route is outside /api/, so the origin guard of src/hooks.server.ts does not judge it: a frame
// with an opaque origin sends `Sec-Fetch-Site: cross-site` and `Origin: null`, which the guard
// would refuse. What stands in its place is every condition below, and each failure is the same
// empty 404, which says nothing about the disk:
//
//  - the method is GET or HEAD;
//  - the origin of the request's URL, which Kit builds from the Host header, names this machine
//    (the `Origin` header is not the input, since a module script from the opaque frame sends
//    `null`; the Host-built origin is also what stops a rebound host name);
//  - the address parses, each segment decoded alone, and the path holds no empty, dot or dot-led
//    segment and no backslash, NUL or slash after decoding;
//  - the root part, when there is one, and the name name an app the watcher holds as approved, and
//    the key equals the app's current key;
//  - the path is one of the app's recorded files, its stat equals the record (or the app, hashed
//    again, equals the approved hash, or for an app kept approved its manifest is unchanged),
//    and its real path lies inside the app's real folder.
//
// The two shared files need no app, key or approval: GET or HEAD from this machine, and the path
// after `/apps/-/` is exactly one of their names.

import { lstatSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { APP_NAME, pathSegmentsOpen } from '../../../data/helpers/files/apps.ts';
import { allowedOrigin } from '../../core/auth.ts';
import { below, realPath } from '../../core/paths.ts';
import { typeOf } from '../../files/files.ts';
import {
    appAddress,
    appPolicy,
    appType,
    fileHeaders,
    sameKey,
    SHARED,
    SHARED_FILES
} from './address.ts';
import { appOf, type AppsHeld, type HeldApp } from './held.ts';
import { hashApp, walkApp, type AppFile, type WalkLimits } from './record.ts';

/** What a request for an app file is answered from. */
export type ServeInput = {
    request: Request;
    held: AppsHeld;
    /** The limits a folder walked again is held to, read only when a file differs from its record.
     * */
    limits: () => WalkLimits;
    /** The bytes of penpal's module, or null when they cannot be read. */
    penpal: () => Uint8Array | null;
    /** The text of oculus.js, the app half of the bridge. */
    oculus: string;
};

const NOT_FOUND = (): Response => new Response(null, { status: 404 });

/** A segment decoded alone, or null for a malformed escape. */
function decoded(segment: string): string | null {
    try {
        return decodeURIComponent(segment);
    } catch {
        return null;
    }
}

/** Whether the file is what was recorded, or the app holds its approval. */
function stillApproved(app: HeldApp, file: AppFile, limits: () => WalkLimits): boolean {
    let stat;
    try {
        stat = lstatSync(join(app.row.folder, file.path));
    } catch {
        return false;
    }
    if (!stat.isFile()) return false;
    if (stat.size === file.size && stat.mtimeMs === file.mtimeMs && stat.ctimeMs === file.ctimeMs) {
        return true;
    }
    const walk = walkApp(app.row.folder, limits());
    if (walk.tooLarge) return false;
    try {
        const manifest = readFileSync(join(app.row.folder, 'app.yml'));
        if (app.row.kept) {
            return createHash('sha256').update(manifest).digest('hex') === app.manifestHash;
        }
        return hashApp(app.row.folder, app.row.name, manifest, walk.files) === app.row.hash;
    } catch {
        return false;
    }
}

/** The answer for bytes: the headers of a GET, and the body only for a GET. */
function answer(
    request: Request,
    bytes: Uint8Array,
    type: string,
    extra: Record<string, string>
): Response {
    const headers = { ...fileHeaders(type, bytes.length), ...extra };
    return new Response(request.method === 'HEAD' ? null : Buffer.from(bytes), { headers });
}

/** One of the two shared files, or the empty 404. */
function sharedFile(name: string, input: ServeInput): Response {
    if (!SHARED_FILES.some((one) => one === name)) return NOT_FOUND();
    const bytes = name === 'penpal.js' ? input.penpal() : Buffer.from(input.oculus, 'utf8');
    if (bytes === null) return NOT_FOUND();
    return answer(input.request, bytes, typeOf(name), {});
}

/** Answer a request whose path starts with `/apps/`. */
export function serveApp(input: ServeInput): Response {
    const { request, held } = input;
    if (request.method !== 'GET' && request.method !== 'HEAD') return NOT_FOUND();
    const url = new URL(request.url);
    if (!allowedOrigin(url.origin) || !url.pathname.startsWith('/apps/')) return NOT_FOUND();
    const raw = url.pathname.slice('/apps/'.length).split('/');
    if (raw[0] === SHARED) return raw.length === 2 ? sharedFile(raw[1], input) : NOT_FOUND();

    const rooted = raw[0].startsWith('@');
    const lead = rooted ? 3 : 2;
    if (raw.length <= lead) return NOT_FOUND();
    const parts = raw.map(decoded);
    if (parts.some((one) => one === null)) return NOT_FOUND();
    const text = parts as string[];
    const root = rooted ? text[0].slice(1) : '';
    const name = text[lead - 2];
    const key = text[lead - 1];
    const segments = text.slice(lead);
    if (rooted && root === '') return NOT_FOUND();
    if (!APP_NAME.test(name) || segments.some((one) => one.includes('/'))) return NOT_FOUND();
    const path = segments.join('/');
    if (!pathSegmentsOpen(path)) return NOT_FOUND();

    const app = appOf(held, root, name);
    if (app === undefined || !app.row.approved || !sameKey(app.row.key, key)) return NOT_FOUND();
    const file = app.files.find((one) => one.path === path);
    if (file === undefined || !stillApproved(app, file, input.limits)) return NOT_FOUND();
    const full = join(app.row.folder, path);
    const real = realPath(full, true);
    if (real === null || !below(real, app.row.folder)) return NOT_FOUND();
    let bytes: Uint8Array;
    try {
        bytes = readFileSync(real);
    } catch {
        return NOT_FOUND();
    }
    const host = url.host;
    const policy = appPolicy({
        host,
        base: `${host}${appAddress(root, name, key)}`,
        shared: `${host}/apps/${SHARED}/`,
        connects: app.row.connects
    });
    return answer(request, bytes, appType(path), { 'content-security-policy': policy });
}
