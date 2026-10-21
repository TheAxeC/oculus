// Layer 2, server. The photo wall's folder: which pictures are in it, one of them streamed, and one
// added. routes/api/(docs)/memories/+server.ts is the endpoint and holds nothing but its GET and
// POST, since a route module may export only its verbs.
//
// The rules the folders are read under are server/content/images.ts's, the same ones the wallpaper
// route obeys: each folder is resolved under its hub and replaced by the standard one if it is not
// inside it, a path that leaves the folder is refused, only the four picture extensions are served,
// and every request is judged by where it came from. What is here is the wall's own half: the list
// the view draws its tiles from, which holds the photo wall of every hub of the workspace with
// every folder under it, each picture's hub and path in the folder with its width and height so a
// tile has its picture's shape before the picture arrives, a picture served as
// `<hub name>/<file path>`, and the upload of one picture into the primary hub's folder itself (the
// first hub's when the workspace has no primary).
//
// An upload is behind the write token as well as the origin guard, and the name is reduced to its
// last segment before anything is done with it, so a name that tried to reach out of the folder is
// a file name in the folder or is refused. The three extensions the wall accepts are the JPEG and
// PNG ones: a picture arrives from a camera or a phone, and `.webp` is served if the reader puts
// one in the folder by hand but is not something the control offers to write.
//
// The extension is not taken as the reader's word for what the file is: the first bytes must be the
// ones that format starts with, and must be the format the extension names, so a script or a text
// file cannot be written under a picture's name into a folder the page then draws from.

import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { byKey } from '../../data/helpers/guards.ts';
import { MAX_UPLOAD_BYTES } from '../../data/file-ops.ts';
import type { Picture } from '../../data/model/index.ts';
import { tokenedBody } from '../core/auth.ts';
import { writeBytesAtomic } from '../core/json.ts';
import { words } from '../core/words.ts';
import { images, isName, sizeOf, stream, type HubPictures } from './images.ts';
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
 * The largest picture the wall takes, in bytes, which is data/file-ops.ts's limit for one uploaded
 * file. It is the decoded size, so the request that carries it is a third larger again;
 * `BODY_LIMIT_BYTES` is what the server tells its own request parser and `src/server.ts` is where
 * that is set. The page checks the file against this before it encodes one, so an oversized
 * picture reads a sentence rather than a refused request.
 */
export { MAX_UPLOAD_BYTES };

/** The same limit in whole megabytes, which is what the reader is told. */
export const MAX_UPLOAD_MB = MAX_UPLOAD_BYTES / (1024 * 1024);

/**
 * The request body the server accepts, which is the picture base64-encoded (four bytes per three)
 * inside a small JSON wrapper. A request above it is refused by the parser before any route runs,
 * so it is set from the picture's own limit rather than guessed.
 */
export const BODY_LIMIT_BYTES = Math.ceil((MAX_UPLOAD_BYTES * 4) / 3) + 64 * 1024;

/**
 * The pictures of every hub's photo wall and the folders under it, hubs in the workspace's order
 * and each hub's pictures in path order, each with the size the head of its file gives. The sizes
 * are read on every listing rather than kept, since a kept size would be stale the moment a picture
 * of the same name replaced it; a listing reads the head of each, READ_CAP bytes, and past it the
 * heads of the segments or chunks a walk steps over (images.ts).
 */
export function pictures(hubs: readonly HubPictures[]): Picture[] {
    return hubs.flatMap((one) =>
        images(one.memories).map((name) => {
            const size = sizeOf(join(one.memories, name));
            return { hub: one.hub, name, width: size?.width ?? null, height: size?.height ?? null };
        })
    );
}

/** What an upload was asked to write: the file's own name, and its bytes as base64. */
export type Upload = { name: string; data: string };

/** What an upload answers with: the name it wrote, or the one word saying what was wrong. */
export type UploadOutcome =
    { written: string } | { error: 'name' | 'data' | 'taken' | 'unwritable' };

/**
 * The folder an upload goes to: the primary hub's photo wall, else the first hub's, and null when
 * the workspace has no hub.
 */
export function addFolder(hubs: readonly HubPictures[], primary: string | null): string | null {
    const own = hubs.find((one) => one.hub === primary) ?? hubs.at(0);
    return own?.memories ?? null;
}

/** The body of an upload: a name and the data, each text. */
const uploadShape = z.object({ name: z.string(), data: z.string() }) satisfies z.ZodType<Upload>;

/** Read the body of an upload, or null when it is not one. */
export function upload(body: unknown): Upload | null {
    const held = uploadShape.safeParse(body);
    return held.success ? held.data : null;
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

/** The pictures of every hub's photo wall with their sizes, as JSON. */
export function listing(hubs: readonly HubPictures[]): Response {
    return json({ images: pictures(hubs) });
}

/**
 * One picture of a photo wall, named `<hub name>/<file path>`, streamed. The hub is the part
 * before the first `/`, so the file path may name a folder under the wall. 404 for a hub the
 * workspace does not list and for anything not there.
 */
export function serve(hubs: readonly HubPictures[], asked: string | null): Response {
    const cut = asked === null ? -1 : asked.indexOf('/');
    if (asked === null || cut < 1) return new Response(null, { status: 404 });
    const held = hubs.find((one) => one.hub === asked.slice(0, cut));
    if (held === undefined) return new Response(null, { status: 404 });
    return stream(held.memories, asked.slice(cut + 1));
}

/**
 * One picture added to the wall. The order is the write endpoint's: the request must carry the
 * process token, the body must be a picture, and only then is a file written. A refusal names what
 * was wrong and the folder is untouched.
 */
export async function add(
    dir: string | null,
    request: Request,
    token: string,
    text: () => Record<string, string>
): Promise<Response> {
    const read = await tokenedBody(request, token, { text });
    if (read instanceof Response) return read;
    const body = read.body;
    const asked = upload(body);
    if (asked === null) return json({ error: 'the body is not a picture to add' }, { status: 400 });
    if (dir === null) {
        return json({ error: words(text(), 'server.memories.no_wall') }, { status: 404 });
    }
    const outcome = write(dir, asked);
    if ('error' in outcome) {
        return json(
            { error: outcome.error },
            { status: outcome.error === 'unwritable' ? 500 : 400 }
        );
    }
    return json({ ok: true, written: outcome.written });
}
