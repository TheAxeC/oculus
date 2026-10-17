// Layer 2, server. The rules every route that serves a picture out of a configured folder obeys:
// which extensions are pictures (PICTURE_EXTENSIONS of data/file-ops.ts), what each is sent as, how
// long a browser may hold one, whether a path is inside its folder, and the response that streams
// one file. Where the request came from is answered before any of them, by the origin guard in
// src/hooks.server.ts.
//
// It is one module rather than a copy per route because the rules are the security of those routes:
// the folder is resolved under its hub and replaced by the standard one if it is not inside it, the
// chosen file is resolved and refused if it is not inside the folder, and a name that carries a
// path rather than a file name is refused outright. A second copy of that would be a second place
// for one of the four to go missing. server/content/wallpaper.ts and server/content/memories.ts are
// the two readers.
//
// A picture's width and height are read here too, since the Memories wall draws each tile at its
// picture's proportions before the picture arrives. The head of the file, its first READ_CAP bytes
// or the whole file when it is smaller, is read through one file handle, and the format is taken
// from the bytes rather than the extension, as the browser does when it draws one. The size is the
// one the browser draws, a quarter turn applied where the picture's orientation says so:
// - A JPEG is walked here, segment by segment by their lengths, to its first frame: fill bytes
//   before a marker are stepped over, every frame kind the standard names is read, and the first
//   EXIF block met on the way gives the orientation, its first directory read at the offset the
//   block names and a damaged block read as none.
// - A PNG is sized by image-size, and its `eXIf` chunk, which image-size does not read, is walked
//   here for the orientation through every chunk before the first image data, where the PNG
//   specification places it and where the browser reads it, however many chunks come first.
// - A WebP is sized by image-size and never turned, since the browser does not turn a WebP.
// - Any other format gives no size.
// Both walks read at their position through the same handle once they pass the head, at least BLOCK
// bytes a read, so a frame or a chunk behind a large colour profile is reached however many
// segments or chunks come first, as the browser reaches it, and a run of small ones costs one read
// a block. A walk steps over what it does not need by its length and stops at the first frame or
// image data, so it reads no more of a file than what comes before that data and one block of it.
// The JPEG walk ends at its first frame, the first scan, the end of the file or a marker that is
// not one; the PNG walk at the first image data, the end of the file or a chunk whose type is not
// four letters.
// The type a picture is served as is mime's for its extension.
//
// Whether a path lies in a folder is read from server/core/paths.ts (`inside`).

import { closeSync, createReadStream, openSync, readdirSync, readSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { Readable } from 'node:stream';
import { imageSize } from 'image-size';
import mime from 'mime';
import { PICTURE_EXTENSIONS } from '../../data/file-ops.ts';
import { MEMORIES_DIR, WALLPAPER_DIR, hubFolderIn } from '../../data/helpers/files/paths.ts';
import { inside } from '../core/paths.ts';
import type { HubTarget } from '../files/roots.ts';

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
        .filter(
            (name) =>
                !name.startsWith('.') && PICTURE_EXTENSIONS.includes(extname(name).toLowerCase())
        )
        .sort();
}

/**
 * A picture's width and height in pixels, as the browser draws it: a quarter turn already applied.
 */
export type Size = { width: number; height: number };

/**
 * How much of a file its size is read from at most. A JPEG's frame comes after its EXIF block and
 * colour profile, which a camera keeps well inside this; a folder of photographs is megabytes a
 * picture, and no more than this is read of any of them.
 */
export const READ_CAP = 512 * 1024;

/** The bytes of one file from a position, as many as are there up to `length`. */
type ReadAt = (position: number, length: number) => Uint8Array;

/**
 * The bytes a read past the head takes at least, which serve the reads after it that fall inside
 * them: a page, so stepping over a run of small chunks reads the file a block at a time.
 */
const BLOCK = 4096;

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
 * or the end of what `read` gives; a chunk head that is not four letters ends the walk. Each step
 * moves on by at least a chunk head, so the walk ends at the end of the file.
 */
function pngOrientation(read: ReadAt): number {
    const ihdr = read(8, 4);
    if (ihdr.byteLength < 4) return 0;
    let at = 8 + 12 + new DataView(ihdr.buffer, ihdr.byteOffset, 4).getUint32(0);
    for (;;) {
        const head = read(at, 8);
        if (head.byteLength < 8) return 0;
        const code = String.fromCharCode(head[4], head[5], head[6], head[7]);
        if (!/^[A-Za-z]{4}$/.test(code) || code === 'IDAT' || code === 'IEND') return 0;
        const length = new DataView(head.buffer, head.byteOffset, 8).getUint32(0);
        if (code === 'eXIf') return tiffOrientation(read(at + 8, Math.min(length, EXIF)));
        at += 12 + length;
    }
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
 * The orientation a JPEG APP1 segment's body names, or 0 when it names none: an `Exif` header and
 * then the TIFF structure a PNG's `eXIf` chunk holds bare. An APP1 of another kind (XMP) names
 * none.
 */
function exifOrientation(body: Uint8Array): number {
    if (!spells(body, 0, 'Exif') || body[4] !== 0 || body[5] !== 0) return 0;
    return tiffOrientation(body.subarray(6));
}

/**
 * A JPEG's size, from the first frame header, walking the segments before it by their lengths, so a
 * large EXIF block or colour profile before the frame is stepped over. The first EXIF block met on
 * the way is read as far as its orientation, and a quarter turn swaps the two sides, since the
 * browser draws the picture turned. A scan, the end of what `read` gives or a broken segment before
 * any frame gives no size. Each step moves on by at least a byte, so the walk ends at the end of
 * the file.
 */
function jpeg(read: ReadAt): Size | null {
    let at = 2;
    let turn = 0;
    for (;;) {
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
}

/**
 * A picture's size from its head, with `read` reading the bytes a walk needs, past the head
 * included: a JPEG walked here and turned by its EXIF orientation, a PNG sized by image-size and
 * turned by its `eXIf` chunk, a WebP sized by image-size as stored. Any other format, and a head
 * image-size cannot read, give null.
 */
function measured(head: Uint8Array, read: ReadAt): Size | null {
    if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return jpeg(read);
    let found: ReturnType<typeof imageSize>;
    try {
        found = imageSize(head);
    } catch {
        return null;
    }
    if (found.type === 'png') {
        return turned(pngOrientation(read), found.width, found.height);
    }
    if (found.type === 'webp') return sized(found.width, found.height);
    return null;
}

/**
 * The reader of a file whose head is read: a read inside the head is served from it, and a read
 * past it reads BLOCK bytes or more at its position through `handle`, which serve the reads after
 * it that fall inside them. No read goes past the head when the head came back short (`short`),
 * since the file then ended before the head did.
 */
function pastHead(handle: number, head: Uint8Array, short: boolean): ReadAt {
    let block = new Uint8Array(0);
    let start = 0;
    return (position, length) => {
        if (position + length <= head.byteLength) return head.subarray(position, position + length);
        const offset = position - start;
        if (offset >= 0 && offset + length <= block.byteLength) {
            return block.subarray(offset, offset + length);
        }
        if (short) return new Uint8Array(0);
        const bytes = new Uint8Array(Math.max(length, BLOCK));
        block = bytes.subarray(0, readSync(handle, bytes, 0, bytes.byteLength, position));
        start = position;
        return block.subarray(0, length);
    };
}

/**
 * The size of the picture at `path`, read from its head through one file handle, and null when the
 * path is not a regular file or its head gives no size. The head is READ_CAP bytes, or the file's
 * own size when that is smaller, so a small picture is not read into a buffer of READ_CAP; a walk
 * that passes the head reads on at its position through the same handle. It never throws, since one
 * unreadable file must not take the rest of a listing with it. The regular-file check comes before
 * the open because opening a named pipe waits for a writer, and a listing is read on the request.
 */
export function sizeOf(path: string): Size | null {
    let handle: number;
    let want: number;
    try {
        const stat = statSync(path);
        if (!stat.isFile()) return null;
        want = Math.min(stat.size, READ_CAP);
        handle = openSync(path, 'r');
    } catch {
        return null;
    }
    try {
        const head = new Uint8Array(want);
        let got = 0;
        while (got < want) {
            const read = readSync(handle, head, got, want - got, got);
            if (read === 0) break;
            got += read;
        }
        const read = pastHead(handle, head.subarray(0, got), got < want);
        return measured(head.subarray(0, got), read);
    } catch {
        return null;
    } finally {
        closeSync(handle);
    }
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
    const extension = extname(name).toLowerCase();
    const type = PICTURE_EXTENSIONS.includes(extension) ? mime.getType(extension) : null;
    if (type === null) return new Response(null, { status: 404 });
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
 * The folders one hub keeps pictures in: the hub's name, its wallpaper folder and its photo wall.
 */
export type HubPictures = { hub: string; wallpaper: string; memories: string };

/**
 * The picture folders of each hub: its `wallpaper_dir` and `memories_dir` resolved under the hub,
 * the standard folder where a key is absent, wrong or outside the hub (the Findings view says
 * which, from data/index.ts `sourcesFindings`). The hubs come with their settings, so a hub is read
 * through its own layer and no other hub's values reach it.
 */
export function picturesOf(hubs: readonly HubTarget[]): HubPictures[] {
    return hubs.map((one) => ({
        hub: one.key,
        wallpaper: hubFolderIn(one.hub, one.config.merged.wallpaper_dir, WALLPAPER_DIR).dir,
        memories: hubFolderIn(one.hub, one.config.merged.memories_dir, MEMORIES_DIR).dir
    }));
}
