// A picture's width and height read from its header: PNG and JPEG (with the EXIF orientation that
// turns each) and the three kinds of WebP, a header cut short or not a picture at all, and how far
// into a file the reading goes.
//
// Every picture here is built byte by byte by the case itself, the header the format defines and no
// more, and written under the system temporary directory, asserted inside it before the write. The
// one real picture is the smallest JPEG a camera library writes, carried as base64. What this does
// not cover: the tile the size is drawn into, which is tests/views/memories.test.ts and
// tests/browser/memories.spec.ts.

import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { readSize, sizeOf, type ReadAt } from '../../src/lib/server/images.ts';
import { scratchDir, sweepScratch } from '../scratch.ts';

afterAll(sweepScratch);

/** One pixel of a real JPEG, as base64: a JFIF header, tables, a baseline frame and a scan. */
const REAL_JPEG =
    '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';

/** Every directory this file made, taken away when the file's cases are done. */
const made: string[] = [];

afterAll(() => {
    for (const dir of made) rmSync(dir, { recursive: true, force: true });
    made.length = 0;
});

/** A directory of this file's own inside the system temporary directory, remembered for removal. */
function scratch(): string {
    const dir = scratchDir('oculus-images-');
    made.push(dir);
    return dir;
}

/** A file of these bytes under a directory of this case's own, and its path. */
function file(name: string, bytes: Uint8Array | string): string {
    const dir = scratch();
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const full = join(dir, name);
    expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
    writeFileSync(full, bytes);
    return full;
}

/** A 16-bit number, most significant byte first, as JPEG and a Motorola TIFF write one. */
function be16(value: number): number[] {
    return [(value >> 8) & 0xff, value & 0xff];
}

/** A 32-bit number, most significant byte first. */
function be32(value: number): number[] {
    return [(value >>> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

/** A 16-bit number, least significant byte first, as WebP and an Intel TIFF write one. */
function le16(value: number): number[] {
    return [value & 0xff, (value >> 8) & 0xff];
}

/** A 32-bit number, least significant byte first. */
function le32(value: number): number[] {
    return [...le16(value & 0xffff), ...le16((value >>> 16) & 0xffff)];
}

/** The ASCII bytes of a four-letter code or a signature. */
function ascii(text: string): number[] {
    return [...Buffer.from(text, 'ascii')];
}

/** The bytes of a PNG that ends straight after its IHDR chunk's size fields. */
function pngHeader(width: number, height: number): Uint8Array {
    return Uint8Array.from([
        0x89,
        ...ascii('PNG'),
        0x0d,
        0x0a,
        0x1a,
        0x0a,
        ...be32(13),
        ...ascii('IHDR'),
        ...be32(width),
        ...be32(height)
    ]);
}

/** A whole PNG header: the IHDR chunk with its depth, colour type, methods and checksum bytes. */
function png(width: number, height: number): Uint8Array {
    return Uint8Array.from([...pngHeader(width, height), 8, 2, 0, 0, 0, 0, 0, 0, 0]);
}

/** One JPEG segment: its marker, its length (which counts itself) and its body. */
function segment(code: number, body: number[]): number[] {
    return [0xff, code, ...be16(body.length + 2), ...body];
}

/** A frame header segment of the given marker: precision, height, width and three components. */
function frame(width: number, height: number, code = 0xc0): number[] {
    return segment(code, [
        8,
        ...be16(height),
        ...be16(width),
        3,
        1,
        0x22,
        0,
        2,
        0x11,
        1,
        3,
        0x11,
        1
    ]);
}

/** A JFIF APP0 segment, which is what opens most JPEGs. */
const JFIF = segment(0xe0, [...ascii('JFIF'), 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]);

/** A scan header and a few bytes of scan, which is where a frame must already have been met. */
const SCAN = [...segment(0xda, [1, 1, 0, 0, 0x3f, 0]), 0x12, 0x34, 0xff, 0xd9];

/** A JPEG of the start mark, the given segments and a scan. */
function jpeg(...parts: number[][]): Uint8Array {
    return Uint8Array.from([0xff, 0xd8, ...parts.flat(), ...SCAN]);
}

/**
 * An APP1 EXIF segment whose first directory names `orientation`, in either byte order, with
 * `padding` bytes after the directory standing for a thumbnail and the rest of a camera's block.
 */
function exif(orientation: number, order: 'II' | 'MM', padding = 0): number[] {
    return segment(0xe1, [...ascii('Exif'), 0, 0, ...tiff(orientation, order, padding)]);
}

/**
 * A TIFF structure whose first directory names `orientation` after a Make entry, as a camera writes
 * one, followed by `padding` bytes: the body of an EXIF block after its header, and the whole body of
 * a PNG `eXIf` chunk.
 */
function tiff(orientation: number, order: 'II' | 'MM', padding = 0): number[] {
    const u16 = order === 'II' ? le16 : be16;
    const u32 = order === 'II' ? le32 : be32;
    return [
        ...ascii(order),
        ...u16(42),
        ...u32(8),
        ...u16(2),
        // A Make entry before the orientation, as a camera writes one: tag, type, count, offset.
        ...u16(0x010f),
        ...u16(2),
        ...u32(4),
        ...ascii('Cam'),
        0,
        ...u16(0x0112),
        ...u16(3),
        ...u32(1),
        ...u16(orientation),
        0,
        0,
        ...u32(0),
        ...new Array<number>(padding).fill(0)
    ];
}

/** An XMP APP1 segment, which shares the EXIF block's marker and carries no orientation tag. */
const XMP = segment(0xe1, [
    ...ascii('http://ns.adobe.com/xap/1.0/'),
    0,
    ...ascii(
        '<x:xmpmeta xmlns:x="adobe:ns:meta/"><tiff:Orientation>1</tiff:Orientation></x:xmpmeta>'
    )
]);

/** One PNG chunk: its length, its four-letter code, its body and four checksum bytes. */
function chunk(code: string, body: number[] | Uint8Array): Uint8Array {
    return Uint8Array.from([...be32(body.length), ...ascii(code), ...body, 0, 0, 0, 0]);
}

/** A PNG of its IHDR chunk and then the given chunks, in order. */
function pngWith(width: number, height: number, ...chunks: Uint8Array[]): Uint8Array {
    return Buffer.concat([png(width, height), ...chunks]);
}

/** A RIFF WebP of one chunk: the container's head, the chunk's code, its length and its body. */
function webp(code: string, body: number[]): Uint8Array {
    const chunk = [...ascii(code), ...le32(body.length), ...body];
    return Uint8Array.from([
        ...ascii('RIFF'),
        ...le32(chunk.length + 4),
        ...ascii('WEBP'),
        ...chunk
    ]);
}

/** A lossy WebP's key frame header: the frame tag, the start code, each side with no scaling. */
function vp8(width: number, height: number): Uint8Array {
    return webp('VP8 ', [
        0x30,
        0x01,
        0x00,
        0x9d,
        0x01,
        0x2a,
        ...le16(width),
        ...le16(height),
        0,
        0
    ]);
}

/** A lossless WebP's header: the signature, then each side less one in fourteen bits. */
function vp8l(width: number, height: number): Uint8Array {
    const bits = (width - 1) | ((height - 1) << 14);
    return webp('VP8L', [0x2f, ...le32(bits), 0, 0, 0]);
}

/** An extended WebP's header: flags, three reserved bytes, the canvas's sides less one. */
function vp8x(width: number, height: number): Uint8Array {
    const w = width - 1;
    const h = height - 1;
    return webp('VP8X', [
        0x10,
        0,
        0,
        0,
        w & 0xff,
        (w >> 8) & 0xff,
        (w >> 16) & 0xff,
        h & 0xff,
        (h >> 8) & 0xff,
        (h >> 16) & 0xff
    ]);
}

/** A reader over bytes in memory that counts every byte it hands back. */
function counted(bytes: Uint8Array): { read: ReadAt; total: () => number } {
    let total = 0;
    return {
        read: (position, length) => {
            const got = bytes.subarray(position, position + length);
            total += got.byteLength;
            return got;
        },
        total: () => total
    };
}

describe('the size of a PNG', () => {
    it('is the width and height of its IHDR chunk', () => {
        expect(sizeOf(file('wide.png', png(870, 691)))).toEqual({ width: 870, height: 691 });
        expect(sizeOf(file('tall.png', png(777, 1200)))).toEqual({ width: 777, height: 1200 });
    });

    it('swaps the sides for an eXIf orientation of a quarter turn before the image data', () => {
        const turned = pngWith(
            400,
            300,
            chunk('tEXt', ascii('Comment\0a picture')),
            chunk('eXIf', tiff(6, 'MM')),
            chunk('IDAT', [1, 2, 3]),
            chunk('IEND', [])
        );
        expect(sizeOf(file('turned.png', turned))).toEqual({ width: 300, height: 400 });
        const upright = pngWith(400, 300, chunk('eXIf', tiff(3, 'II')), chunk('IEND', []));
        expect(sizeOf(file('upright.png', upright))).toEqual({ width: 400, height: 300 });
    });

    it('reads no orientation from a chunk after the image data', () => {
        const late = pngWith(400, 300, chunk('IDAT', [1, 2, 3]), chunk('eXIf', tiff(6, 'MM')));
        expect(sizeOf(file('late.png', late))).toEqual({ width: 400, height: 300 });
    });

    it('is read from a file that ends where the size fields end', () => {
        expect(sizeOf(file('cut.png', pngHeader(4000, 3000)))).toEqual({
            width: 4000,
            height: 3000
        });
    });
});

describe('the size of a JPEG', () => {
    it('is the frame of a real baseline JPEG', () => {
        expect(sizeOf(file('pixel.jpg', Buffer.from(REAL_JPEG, 'base64')))).toEqual({
            width: 1,
            height: 1
        });
    });

    it('is the first frame, after the segments before it, baseline or progressive', () => {
        expect(sizeOf(file('baseline.jpg', jpeg(JFIF, frame(640, 480))))).toEqual({
            width: 640,
            height: 480
        });
        expect(sizeOf(file('progressive.jpg', jpeg(JFIF, frame(1024, 768, 0xc2))))).toEqual({
            width: 1024,
            height: 768
        });
    });

    it('reads through a large EXIF block before the frame', () => {
        const bytes = jpeg(exif(1, 'MM', 60000), frame(2048, 1536));
        expect(bytes.byteLength).toBeGreaterThan(60000);
        expect(sizeOf(file('exif.jpg', bytes))).toEqual({ width: 2048, height: 1536 });
    });

    it('swaps the sides for an orientation of a quarter turn, in either byte order', () => {
        expect(sizeOf(file('six.jpg', jpeg(JFIF, exif(6, 'II'), frame(4032, 3024))))).toEqual({
            width: 3024,
            height: 4032
        });
        for (const turn of [5, 7, 8]) {
            expect(readSize(counted(jpeg(exif(turn, 'MM'), frame(300, 200))).read)).toEqual({
                width: 200,
                height: 300
            });
        }
    });

    it('keeps the sides for an orientation that is not a quarter turn', () => {
        for (const turn of [1, 2, 3, 4]) {
            expect(readSize(counted(jpeg(exif(turn, 'II'), frame(300, 200))).read)).toEqual({
                width: 300,
                height: 200
            });
        }
    });

    it('steps over a Huffman table and an arithmetic coding table before the frame', () => {
        // Read as a frame, the table's first five bytes would give a height of 256 and a width of 512.
        const huffman = segment(0xc4, [
            0x00,
            0x01,
            0x00,
            0x02,
            0x00,
            ...new Array<number>(16).fill(0)
        ]);
        // Read as a frame, the conditioning table would give a height of 768 and a width of 1024.
        const arithmetic = segment(0xcc, [0x00, 0x03, 0x00, 0x04, 0x00]);
        // 0xc8 is reserved for JPEG extensions and is no frame either; read as one it would give a
        // height of 96 and a width of 128.
        const extension = segment(0xc8, [0x00, 0x00, 0x60, 0x00, 0x80, 0x00]);
        expect(sizeOf(file('tables.jpg', jpeg(JFIF, huffman, frame(640, 480))))).toEqual({
            width: 640,
            height: 480
        });
        expect(sizeOf(file('coding.jpg', jpeg(JFIF, arithmetic, frame(640, 480))))).toEqual({
            width: 640,
            height: 480
        });
        expect(sizeOf(file('extension.jpg', jpeg(JFIF, extension, frame(640, 480))))).toEqual({
            width: 640,
            height: 480
        });
    });

    it('reads the orientation of an EXIF block that comes after an XMP block', () => {
        expect(sizeOf(file('xmp.jpg', jpeg(JFIF, XMP, exif(6, 'II'), frame(4032, 3024))))).toEqual({
            width: 3024,
            height: 4032
        });
    });

    it('steps over fill bytes before a marker', () => {
        const padded = Uint8Array.from([
            0xff,
            0xd8,
            ...JFIF,
            0xff,
            0xff,
            ...frame(10, 20),
            ...SCAN
        ]);
        expect(readSize(counted(padded).read)).toEqual({ width: 10, height: 20 });
    });
});

describe('the size of a WebP', () => {
    it('is read from a lossy, a lossless and an extended header', () => {
        expect(sizeOf(file('lossy.webp', vp8(1920, 1080)))).toEqual({ width: 1920, height: 1080 });
        expect(sizeOf(file('lossless.webp', vp8l(300, 9000)))).toEqual({
            width: 300,
            height: 9000
        });
        expect(sizeOf(file('extended.webp', vp8x(16383, 20000)))).toEqual({
            width: 16383,
            height: 20000
        });
    });
});

describe('a file that gives no size', () => {
    it('is a file that is not a picture, and throws nothing', () => {
        expect(sizeOf(file('notes.jpg', 'this is not a picture'))).toBeNull();
        expect(sizeOf(file('empty.png', new Uint8Array(0)))).toBeNull();
    });

    it('is a header cut short, of each format', () => {
        expect(sizeOf(file('sig.png', png(10, 10).subarray(0, 8)))).toBeNull();
        expect(sizeOf(file('half.png', pngHeader(10, 10).subarray(0, 20)))).toBeNull();
        expect(sizeOf(file('start.jpg', Uint8Array.from([0xff, 0xd8, 0xff])))).toBeNull();
        const beforeFrame = jpeg(JFIF, frame(640, 480));
        expect(sizeOf(file('cut.jpg', beforeFrame.subarray(0, 2 + JFIF.length + 6)))).toBeNull();
        expect(sizeOf(file('cut.webp', vp8x(10, 10).subarray(0, 26)))).toBeNull();
    });

    it('is a JPEG whose scan comes before any frame, or whose segment length is broken', () => {
        expect(sizeOf(file('scan.jpg', jpeg(JFIF)))).toBeNull();
        const broken = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x01, 0x00]);
        expect(sizeOf(file('broken.jpg', broken))).toBeNull();
        const stray = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0x12, 0x34, 0x56, 0x78]);
        expect(sizeOf(file('stray.jpg', stray))).toBeNull();
    });

    it('is a frame that names a side of zero', () => {
        expect(sizeOf(file('zero.jpg', jpeg(frame(640, 0))))).toBeNull();
        expect(sizeOf(file('zero.png', png(0, 10)))).toBeNull();
    });

    it('is a damaged EXIF block, which gives the frame unturned rather than no size', () => {
        const block = exif(6, 'MM');
        // The first directory's offset pointed past the end of the block.
        block.splice(4 + 6 + 4, 4, ...be32(0xfffff));
        expect(readSize(counted(jpeg(block, frame(300, 200))).read)).toEqual({
            width: 300,
            height: 200
        });
    });

    it('is a path that is not there, and a folder under a picture name', () => {
        const dir = scratch();
        expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        expect(sizeOf(join(dir, 'gone.png'))).toBeNull();
        mkdirSync(join(dir, 'folder.png'));
        expect(sizeOf(join(dir, 'folder.png'))).toBeNull();
    });

    it('is a named pipe under a picture name, answered without waiting for a writer', () => {
        const dir = scratch();
        const pipe = join(dir, 'pipe.jpg');
        expect(resolve(pipe).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        execFileSync('mkfifo', [pipe]);
        expect(sizeOf(pipe)).toBeNull();
    });
});

describe('how far into a file the size is read', () => {
    it('reads the thirty header bytes of a WebP and nothing after them', () => {
        const large = new Uint8Array(1024 * 1024);
        large.set(vp8x(870, 691));
        const reading = counted(large);
        expect(readSize(reading.read)).toEqual({ width: 870, height: 691 });
        expect(reading.total()).toBe(30);
    });

    it('steps over PNG chunks by their lengths and stops at the image data', () => {
        const reading = counted(
            pngWith(
                870,
                691,
                chunk('iCCP', new Uint8Array(60000).fill(7)),
                chunk('IDAT', new Uint8Array(1024 * 1024)),
                chunk('eXIf', tiff(6, 'MM'))
            )
        );
        expect(readSize(reading.read)).toEqual({ width: 870, height: 691 });
        expect(reading.total()).toBeLessThan(100);
    });

    it('reads a PNG eXIf chunk only as far as its first directory needs', () => {
        const reading = counted(pngWith(640, 480, chunk('eXIf', tiff(8, 'II', 60000))));
        expect(readSize(reading.read)).toEqual({ width: 480, height: 640 });
        expect(reading.total()).toBeLessThan(1200);
    });

    it('ends the PNG chunk walk at a chunk head that is not four letters', () => {
        const large = new Uint8Array(1024 * 1024);
        large.set(png(870, 691));
        const reading = counted(large);
        expect(readSize(reading.read)).toEqual({ width: 870, height: 691 });
        expect(reading.total()).toBe(38);
    });

    it('steps over a JPEG block by its length rather than reading it', () => {
        const profile = segment(0xe2, new Array<number>(65000).fill(7));
        const reading = counted(jpeg(JFIF, profile, frame(640, 480)));
        expect(readSize(reading.read)).toEqual({ width: 640, height: 480 });
        expect(reading.total()).toBeLessThan(100);
    });

    it('reads an EXIF block only as far as its first directory needs', () => {
        const reading = counted(jpeg(exif(6, 'MM', 60000), frame(640, 480)));
        expect(readSize(reading.read)).toEqual({ width: 480, height: 640 });
        expect(reading.total()).toBeLessThan(1200);
    });

    it('gives up on a file of fill bytes without reading it whole', () => {
        const fill = new Uint8Array(1024 * 1024).fill(0xff);
        fill.set([0xff, 0xd8]);
        const reading = counted(fill);
        expect(readSize(reading.read)).toBeNull();
        expect(reading.total()).toBeLessThan(4096);
    });
});
