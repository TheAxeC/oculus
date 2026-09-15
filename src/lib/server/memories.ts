// Layer 2, server. The photo wall's folder: which pictures are in it, one of them streamed, and one
// added. routes/api/memories/+server.ts is the endpoint and holds nothing but its GET and POST,
// since a route module may export only its verbs.
//
// The rules the folder is read under are server/images.ts's, the same ones the wallpaper route
// obeys: the folder is resolved under the hub and refused if it is not inside it, a name carrying a
// path is refused, only the four picture extensions are served, and every request is judged by where
// it came from. What is here is the wall's own half: the list the view draws its tiles from, and the
// upload, which is the one write in oculus that lands bytes rather than text.
//
// An upload is behind the write token as well as the origin check, and the name is reduced to its
// last segment before anything is done with it, so a name that tried to reach out of the folder is a
// file name in the folder or is refused. The three extensions the wall accepts are the JPEG and PNG
// ones: a picture arrives from a camera or a phone, and `.webp` is served if the reader puts one in
// the folder by hand but is not something the control offers to write.
//
// The extension is not taken as the reader's word for what the file is: the first bytes must be the
// ones that format starts with, and must be the format the extension names, so a script or a text
// file cannot be written under a picture's name into a folder the page then draws from.

import { byKey } from '../data/guards.ts';
import { hasToken } from './auth.ts';
import { writeBytesAtomic } from './sessions/json.ts';
import { engineDir } from '../data/sources/config.ts';
import { configOf, folderOf, images, isName, sameOrigin, stream } from './images.ts';
import { existsSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

/** The extensions an upload may carry. The wall serves `.webp` too; nothing writes one. */
const UPLOADED = ['.jpg', '.jpeg', '.png'];

/** The bytes each accepted format begins with, by the extension that names it. */
const MAGIC: Record<string, number[][]> = {
    '.jpg': [[0xff, 0xd8, 0xff]],
    '.jpeg': [[0xff, 0xd8, 0xff]],
    '.png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]]
};

/**
 * The largest picture the wall takes, in bytes. It is the decoded size, so the request that carries
 * it is a third larger again; `BODY_LIMIT_BYTES` is what the server tells its own request parser and
 * `src/server.ts` is where that is set. The page checks the file against this before it encodes one,
 * so an oversized picture reads a sentence rather than a refused request.
 */
export const MAX_UPLOAD_BYTES = 32 * 1024 * 1024;

/** The same limit in whole megabytes, which is what the reader is told. */
export const MAX_UPLOAD_MB = MAX_UPLOAD_BYTES / (1024 * 1024);

/**
 * The request body the server accepts, which is the picture base64-encoded (four bytes per three)
 * inside a small JSON wrapper. A request above it is refused by the parser before any route runs, so
 * it is set from the picture's own limit rather than guessed.
 */
export const BODY_LIMIT_BYTES = Math.ceil((MAX_UPLOAD_BYTES * 4) / 3) + 64 * 1024;

/** What the owning server context remembers: the folders refused once, so a bad one is said once. */
export type MemoriesMemory = { refused: Set<string> };

export function memoriesMemory(): MemoriesMemory {
    return { refused: new Set() };
}

/** What an upload was asked to write: the file's own name, and its bytes as base64. */
export type Upload = { name: string; data: string };

/** What an upload answers with: the name it wrote, or the one word saying what was wrong. */
export type UploadOutcome =
    { written: string } | { error: 'name' | 'data' | 'taken' | 'unwritable' };

/**
 * The configured folder, or null when there is none to serve. The config is read per request so an
 * edit shows on reload; a missing `dir`, or one outside the hub, serves nothing.
 */
export function folder(memory: MemoriesMemory, engine: string = engineDir()): string | null {
    return folderOf(configOf(engine).memories, engine, memory.refused, 'memories');
}

/** Read the body of an upload, or null when it is not one. */
export function upload(body: unknown): Upload | null {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
    const held = body as Record<string, unknown>;
    if (typeof held.name !== 'string' || typeof held.data !== 'string') return null;
    return { name: held.name, data: held.data };
}

/** Whether the bytes begin the way the named extension's format does. */
export function isPicture(name: string, bytes: Uint8Array): boolean {
    const wanted = byKey(MAGIC, extname(name).toLowerCase());
    if (wanted === undefined) return false;
    return wanted.some(
        (marks) => bytes.byteLength >= marks.length && marks.every((byte, at) => bytes[at] === byte)
    );
}

/**
 * Write one picture into the folder. The name is its own last segment and must end in one of the
 * three extensions; the data is base64, with a `data:` prefix tolerated, as the browser's own
 * FileReader writes one. Nothing outside the folder is ever written: the name is checked again
 * after the basename, so a name that reduces to nothing or to a dotfile is refused.
 *
 * `Buffer.from` on a string that is not base64 gives back the bytes it could read rather than
 * throwing, so what stands between a text file under a picture's name and the folder is the check
 * on the first bytes, not a decode that fails. A name already on the wall is refused, so no picture
 * is ever replaced by a press.
 */
export function write(dir: string, asked: Upload): UploadOutcome {
    const name = basename(asked.name.trim());
    if (!isName(name) || !UPLOADED.includes(extname(name).toLowerCase())) return { error: 'name' };
    const encoded = asked.data.split(',').at(-1) ?? '';
    const bytes = Buffer.from(encoded, 'base64');
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_UPLOAD_BYTES) return { error: 'data' };
    if (!isPicture(name, bytes)) return { error: 'data' };
    if (existsSync(join(dir, name))) return { error: 'taken' };
    try {
        writeBytesAtomic(join(dir, name), bytes);
    } catch {
        return { error: 'unwritable' };
    }
    return { written: name };
}

/** The pictures of the folder, by name, as JSON. 403 covers a request from another origin. */
export function listing(dir: string | null, headers: Headers): Response {
    if (!sameOrigin(headers)) return new Response(null, { status: 403 });
    return new Response(JSON.stringify({ images: dir === null ? [] : images(dir) }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
    });
}

/** One picture of the folder, streamed. 403 for another origin, 404 for anything not there. */
export function serve(dir: string | null, name: string | null, headers: Headers): Response {
    if (!sameOrigin(headers)) return new Response(null, { status: 403 });
    if (dir === null) return new Response(null, { status: 404 });
    return stream(dir, name);
}

/** What the endpoint says back, in the one shape every answer of this route has. */
function said(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' }
    });
}

/**
 * One picture added to the wall. The order is the write endpoint's: the request must come from this
 * application's own page and carry the process token, the body must be a picture, and only then is
 * a file written. A refusal names what was wrong and the folder is untouched.
 */
export async function add(dir: string | null, request: Request, token: string): Promise<Response> {
    if (!sameOrigin(request.headers)) {
        return said(403, { error: 'the request did not come from this page' });
    }
    if (!hasToken(request, token)) {
        return said(403, { error: 'the write token is missing or stale' });
    }
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return said(400, { error: 'the body is not JSON' });
    }
    const asked = upload(body);
    if (asked === null) return said(400, { error: 'the body is not a picture to add' });
    if (dir === null) return said(404, { error: 'no memories folder is configured' });
    const outcome = write(dir, asked);
    if ('error' in outcome) {
        return said(outcome.error === 'unwritable' ? 500 : 400, { error: outcome.error });
    }
    return said(200, { ok: true, written: outcome.written });
}
