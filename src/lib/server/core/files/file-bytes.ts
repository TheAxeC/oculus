// Layer 2, server. What the server does with a file's bytes when it replaces the file: the SHA-256
// that says whether the file is the one a caller read, and the UTF-8 byte order mark a file keeps.
//
// A save (server/files/source/source.ts) and an edit a language server asks for (server/files/fs/
// lsp-edit.ts) both compare the bytes they read with the bytes the caller says it was working from,
// by this hash, and both write a file back with the byte order mark it started with, since the
// editor works on the text after the mark and a write without it would change the file's bytes. The
// rule for which bytes are text at all is data/helpers/files/text-kind.ts.

import { createHash } from 'node:crypto';
import { BOM_BYTES, startsWithBom } from '../../../data/helpers/files/text-kind.ts';

/** The SHA-256 of bytes as lower-case hex. */
export function hashOf(bytes: Uint8Array): string {
    return createHash('sha256').update(bytes).digest('hex');
}

/** A file's bytes split into whether it starts with a byte order mark and what follows the mark. */
export function splitMark(bytes: Buffer): { marked: boolean; body: Buffer } {
    const marked = startsWithBom(bytes);
    return { marked, body: marked ? bytes.subarray(BOM_BYTES.length) : bytes };
}

/** The bytes of a text, with the byte order mark before them when the file it replaces had one. */
export function withMark(text: Buffer, marked: boolean): Buffer {
    return marked ? Buffer.concat([Buffer.from(BOM_BYTES), text]) : text;
}
