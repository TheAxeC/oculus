// Layer 2, server. The rules every route that serves a picture out of a configured folder obeys:
// which extensions are pictures, what each is sent as, how long a browser may hold one, whether a
// path is inside its folder, and the response that streams one file. Where the request came from is
// answered before any of them, by the origin guard in src/hooks.server.ts.
//
// It is one module rather than a copy per route because the rules are the security of those routes:
// the folder is resolved under the hub and refused if it is not inside it, the chosen file is
// resolved and refused if it is not inside the folder, and a name that carries a path rather than a
// file name is refused outright. A second copy of that would be a second place for one of the four
// to go missing. server/content/wallpaper.ts and server/content/memories.ts are the two readers.
//
// A picture's width and height are read here too, from its header bytes, since the Memories wall
// draws each tile at its picture's proportions before the picture arrives. The format is taken from
// the bytes rather than the extension, as the browser does when it draws one, and only as many
// bytes as the header needs are read through a file handle: a folder of photographs is megabytes a
// picture and a listing reads a few hundred bytes of each. No image library is used, since three
// header layouts are all the four extensions carry. The size is the one the browser draws: a JPEG's
// EXIF block and a PNG's `eXIf` chunk are read for an orientation that turns the picture a quarter,
// and a WebP's is not, since the browser does not turn a WebP. A walk stops after SEGMENTS chunks,
// so a picture whose orientation tag sits past that is drawn here at its stored shape.

import { closeSync, createReadStream, openSync, readdirSync, readSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import { byKey } from '../../data/helpers/guards.ts';
import { loadLocalOrDefaults } from '../../data/sources/config.ts';

/** The extensions a picture folder is filtered to, and the type each one is served as. */
const TYPES: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
};

/** An hour: long enough that a reload does not re-read the file, short enough to swap a picture. */
const CACHE = 'private, max-age=3600';

/** The image files of a directory, by name, dotfiles and every other extension left out. */
export function images(dir: string): string[] {
    let names: string[];
    try {
        names = readdirSync(dir);
    } catch {
        return [];
    }
    return names
        .filter((name) => !name.startsWith('.') && extname(name).toLowerCase() in TYPES)
        .sort();
}

/**
 * A picture's width and height in pixels, as the browser draws it: a quarter turn already applied.
 */
export type Size = { width: number; height: number };

/** The bytes of one file from a position, as many as are there up to `length`. */
export type ReadAt = (position: number, length: number) => Uint8Array;

/**
 * The bytes a PNG or WebP header's size sits within: the PNG IHDR and the widest WebP chunk head.
 */
const HEAD = 30;

/**
 * The JPEG segments or PNG chunks a walk passes before it gives up, so no file is read whole. A PNG
 * whose orientation chunk comes after that many chunks is sized at its stored shape, and a JPEG
 * whose frame comes after that many segments gives no size.
 */
export const SEGMENTS = 512;

/**
 * The bytes of a JPEG EXIF block or a PNG `eXIf` chunk read for its orientation. The tag sits in
 * the first directory, whose entries are in tag order with 0x0112 among the first few, so a
 * camera's block has it well inside this; the thumbnail and the rest of the block are not read.
 */
const EXIF = 1024;

/**
 * Whether a JPEG marker opens a frame: 0xC0 to 0xCF less 0xC4 (Huffman tables), 0xC8 and 0xCC
 * (coding).
 */
function isFrame(code: number): boolean {
    return code >= 0xc0 && code <= 0xcf && code !== 0xc4 && code !== 0xc8 && code !== 0xcc;
}

/**
 * Whether an EXIF orientation turns a picture a quarter (5 to 8), so its two sides trade places.
 */
function isTurned(orientation: number): boolean {
    return orientation >= 5 && orientation <= 8;
}

/** Whether the bytes at `at` are the ASCII letters of `word`. */
function spells(bytes: Uint8Array, at: number, word: string): boolean {
    if (bytes.byteLength < at + word.length) return false;
    for (let i = 0; i < word.length; i += 1) {
        if (bytes[at + i] !== word.charCodeAt(i)) return false;
    }
    return true;
}

/** A size only when both sides are whole pixels, so a zero or a missing side gives none. */
function sized(width: number, height: number): Size | null {
    return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * The size a picture is drawn at: its stored sides, traded when its orientation turns it a quarter.
 */
function turned(orientation: number, width: number, height: number): Size | null {
    return isTurned(orientation) ? sized(height, width) : sized(width, height);
}

/**
 * The orientation a PNG's `eXIf` chunk names, or 0 when it has none. The chunks after IHDR are
 * walked by their lengths as far as the first image data, where the chunk must already have come,
 * under the JPEG walk's two caps; a chunk head that is not four letters ends the walk.
 */
function pngOrientation(read: ReadAt, at: number): number {
    for (let passed = 0; passed < SEGMENTS; passed += 1) {
        const head = read(at, 8);
        if (head.byteLength < 8) return 0;
        const code = String.fromCharCode(head[4], head[5], head[6], head[7]);
        if (!/^[A-Za-z]{4}$/.test(code) || code === 'IDAT' || code === 'IEND') return 0;
        const length = new DataView(head.buffer, head.byteOffset, 8).getUint32(0);
        if (code === 'eXIf') return tiffOrientation(read(at + 8, Math.min(length, EXIF)));
        at += 12 + length;
    }
    return 0;
}

/**
 * A PNG's size, from its IHDR chunk, which the format puts first, turned by the orientation of an
 * `eXIf` chunk before the image data, since the browser draws such a PNG turned.
 */
function png(read: ReadAt, head: Uint8Array): Size | null {
    if (head.byteLength < 24 || !spells(head, 12, 'IHDR')) return null;
    const view = new DataView(head.buffer, head.byteOffset, head.byteLength);
    const width = view.getUint32(16);
    const height = view.getUint32(20);
    return turned(pngOrientation(read, 8 + 12 + view.getUint32(8)), width, height);
}

/** A WebP's size, from the lossy (VP8), lossless (VP8L) or extended (VP8X) chunk that opens it. */
function webp(head: Uint8Array): Size | null {
    const view = new DataView(head.buffer, head.byteOffset, head.byteLength);
    if (spells(head, 12, 'VP8 ')) {
        // The key frame's start code, then fourteen bits of each side and two of scaling.
        if (head.byteLength < 30) return null;
        if (head[23] !== 0x9d || head[24] !== 0x01 || head[25] !== 0x2a) return null;
        return sized(view.getUint16(26, true) & 0x3fff, view.getUint16(28, true) & 0x3fff);
    }
    if (spells(head, 12, 'VP8L')) {
        // The signature byte, then each side less one in fourteen bits, least significant first.
        if (head.byteLength < 25 || head[20] !== 0x2f) return null;
        const bits = view.getUint32(21, true);
        return sized((bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1);
    }
    if (spells(head, 12, 'VP8X')) {
        // Flags and three reserved bytes, then the canvas's sides less one in three bytes each.
        if (head.byteLength < 30) return null;
        const width = head[24] | (head[25] << 8) | (head[26] << 16);
        const height = head[27] | (head[28] << 8) | (head[29] << 16);
        return sized(width + 1, height + 1);
    }
    return null;
}

/**
 * The orientation a JPEG APP1 segment's body names, or 0 when it names none: an `Exif` header and
 * then the TIFF structure a PNG's `eXIf` chunk holds bare. An APP1 of another kind (XMP) names
 * none.
 */
function exifOrientation(body: Uint8Array): number {
    if (!spells(body, 0, 'Exif') || body[4] !== 0 || body[5] !== 0) return 0;
    return tiffOrientation(body.subarray(6));
}

/**
 * The orientation a TIFF structure's first directory names in tag 0x0112, or 0 when it names none.
 * Every offset is checked against the bytes, so a damaged block reads as no orientation.
 */
function tiffOrientation(body: Uint8Array): number {
    if (body.byteLength < 8) return 0;
    const view = new DataView(body.buffer, body.byteOffset, body.byteLength);
    let little: boolean;
    if (spells(body, 0, 'II')) little = true;
    else if (spells(body, 0, 'MM')) little = false;
    else return 0;
    if (view.getUint16(2, little) !== 42) return 0;
    const directory = view.getUint32(4, little);
    if (directory + 2 > body.byteLength) return 0;
    const count = view.getUint16(directory, little);
    for (let entry = 0; entry < count; entry += 1) {
        const at = directory + 2 + entry * 12;
        if (at + 12 > body.byteLength) return 0;
        if (view.getUint16(at, little) === 0x0112) return view.getUint16(at + 8, little);
    }
    return 0;
}

/**
 * A JPEG's size, from the first frame header, walking the segments before it by their lengths, so a
 * large EXIF block or colour profile before the frame is stepped over rather than read whole. The
 * first EXIF block met on the way is read as far as its orientation, and a quarter turn swaps the
 * two sides, since the browser draws the picture turned. A scan or the end of the file before any
 * frame gives no size.
 */
function jpeg(read: ReadAt): Size | null {
    let at = 2;
    let turn = 0;
    for (let passed = 0; passed < SEGMENTS; passed += 1) {
        const mark = read(at, 4);
        if (mark.byteLength < 2 || mark[0] !== 0xff) return null;
        const code = mark[1];
        // A marker may be padded by any number of 0xFF fill bytes before its code.
        if (code === 0xff) {
            at += 1;
            continue;
        }
        if (code === 0x01 || (code >= 0xd0 && code <= 0xd7)) {
            at += 2;
            continue;
        }
        if (code === 0xd9 || code === 0xda || mark.byteLength < 4) return null;
        const length = (mark[2] << 8) | mark[3];
        if (length < 2) return null;
        if (isFrame(code)) {
            const frame = read(at + 4, 5);
            if (frame.byteLength < 5) return null;
            const height = (frame[1] << 8) | frame[2];
            const width = (frame[3] << 8) | frame[4];
            return turned(turn, width, height);
        }
        if (code === 0xe1 && turn === 0) {
            turn = exifOrientation(read(at + 4, Math.min(length - 2, EXIF)));
        }
        at += 2 + length;
    }
    return null;
}

/**
 * A picture's size read through `read`, the format told by its first bytes: PNG, JPEG or WebP.
 * Anything else, and a header cut short, gives null.
 */
export function readSize(read: ReadAt): Size | null {
    const head = read(0, HEAD);
    if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return jpeg(read);
    if (head[0] === 0x89 && spells(head, 1, 'PNG')) return png(read, head);
    if (spells(head, 0, 'RIFF') && spells(head, 8, 'WEBP')) return webp(head);
    return null;
}

/**
 * The size of the picture at `path`, read from its header through one file handle, and null when
 * the path is not a regular file or its header cannot be read. It never throws, since one
 * unreadable file must not take the rest of a listing with it. The regular-file check comes before
 * the open because opening a named pipe waits for a writer, and a listing is read on the request.
 */
export function sizeOf(path: string): Size | null {
    let handle: number;
    try {
        if (!statSync(path).isFile()) return null;
        handle = openSync(path, 'r');
    } catch {
        return null;
    }
    try {
        return readSize((position, length) => {
            const bytes = new Uint8Array(length);
            const got = readSync(handle, bytes, 0, length, position);
            return bytes.subarray(0, got);
        });
    } catch {
        return null;
    } finally {
        closeSync(handle);
    }
}

/** Whether `path` is the directory itself or something under it, as a resolved path. */
export function inside(path: string, dir: string): boolean {
    const root = resolve(dir);
    const full = resolve(path);
    return full === root || full.startsWith(root + sep);
}

/** Whether a name is one file of a folder rather than a path reaching out of it. */
export function isName(name: string): boolean {
    if (name === '' || name.startsWith('.')) return false;
    return !name.includes('/') && !name.includes('\\') && !name.includes('..');
}

/**
 * One picture of a folder, its type and its cache header, streamed from disk. 404 covers every way
 * there is no image to send: no name, a name that leaves the folder, an extension that is not a
 * picture, a file that has gone since the listing. The origin guard has answered where it came
 * from.
 */
export function stream(dir: string, name: string | null): Response {
    if (name === null || !isName(name)) return new Response(null, { status: 404 });
    const type = byKey(TYPES, extname(name).toLowerCase());
    if (type === undefined) return new Response(null, { status: 404 });
    const path = join(dir, name);
    if (!inside(path, dir)) return new Response(null, { status: 404 });
    try {
        if (!statSync(path).isFile()) return new Response(null, { status: 404 });
    } catch {
        return new Response(null, { status: 404 });
    }
    // The bytes are streamed: a picture is megabytes and nothing here holds one in memory.
    const body = Readable.toWeb(createReadStream(path)) as ReadableStream;
    return new Response(body, {
        status: 200,
        headers: { 'content-type': type, 'cache-control': CACHE }
    });
}

/**
 * The absolute directory a config block's `dir` names, resolved under the hub, and null when the
 * block names none or names one outside the hub. `refused` is the caller's memory of the
 * directories already reported, so a bad setting is said once rather than once per request.
 */
export function folderOf(
    block: unknown,
    engine: string,
    refused: Set<string>,
    label: string
): string | null {
    if (typeof block !== 'object' || block === null || Array.isArray(block)) return null;
    const held = block as Record<string, unknown>;
    if (typeof held.dir !== 'string' || held.dir === '') return null;
    const hub = loadLocalOrDefaults(engine).hub;
    const dir = resolve(hub, held.dir);
    if (!inside(dir, hub)) {
        const key = `directory:${dir}`;
        if (!refused.has(key)) {
            refused.add(key);
            console.error(`${label}: ${dir} is outside the hub ${hub}; serving no image`);
        }
        return null;
    }
    return dir;
}
