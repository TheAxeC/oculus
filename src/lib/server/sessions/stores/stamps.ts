// Layer 2, server. When a transcript was last written to, as the timestamp its latest record
// carries. A transcript's records are appended in time order, so the stamp is read from the file's
// end, a piece at a time, and only as far back as the last record that carries one.
//
// The stamp is the record's own and never the file's modification time: a copy, a restore or a
// sync moves that time while no record is written. The modification time and the size only say
// whether a file read before may hold a newer record, so the stamps of one sessions watch are kept
// with both and a file is read again only when either of them changed.

import { closeSync, fstatSync, openSync, readSync } from 'node:fs';
import { z } from 'zod';
import { stampShape } from '../record.ts';

/** How much of a transcript's end is read at a time while looking for its latest record. */
const TAIL_BYTES = 64 * 1024;

/** One record of a transcript, as far as its stamp goes. */
const stampedShape = z.object({ timestamp: stampShape }).catch({ timestamp: null });

/** The latest record stamps of the transcripts one owner reads, each with what it was read at. */
export type Stamps = {
    /**
     * The stamp of a transcript's latest record that carries one, in milliseconds, or null when the
     * file cannot be read or no record carries one.
     */
    of: (path: string) => number | null;
};

/** The stamp of one line of a transcript, in milliseconds, or null for a line that carries none. */
function stampOfLine(line: string): number | null {
    let raw: unknown;
    try {
        raw = JSON.parse(line);
    } catch {
        return null;
    }
    const stamp = stampedShape.parse(raw).timestamp;
    const time = stamp === null ? NaN : Date.parse(stamp);
    return Number.isNaN(time) ? null : time;
}

/**
 * The stamp of the latest stamped record of the file open as `fd`, whose size is `size`. A line cut
 * by the start of a piece is read whole with the piece before it, and its bytes are carried as
 * bytes, so a character cut in two is joined before the line is decoded.
 */
function lastStampOf(fd: number, size: number): number | null {
    let end = size;
    let carry = Buffer.alloc(0);
    while (end > 0) {
        const start = Math.max(0, end - TAIL_BYTES);
        const piece = Buffer.alloc(end - start);
        readSync(fd, piece, 0, piece.length, start);
        const bytes = Buffer.concat([piece, carry]);
        // At the start of the file every byte belongs to a whole line; before it, a piece with no
        // new line is the middle of one line, read whole once its start is reached.
        const cut = start === 0 ? -1 : bytes.indexOf(0x0a);
        end = start;
        if (start > 0 && cut === -1) {
            carry = bytes;
            continue;
        }
        carry = cut === -1 ? Buffer.alloc(0) : bytes.subarray(0, cut);
        const lines = bytes
            .subarray(cut + 1)
            .toString('utf8')
            .split('\n');
        for (let at = lines.length - 1; at >= 0; at -= 1) {
            const time = stampOfLine(lines[at]);
            if (time !== null) return time;
        }
    }
    return null;
}

/**
 * The stamps of one owner, a sessions watch or a single read. A file is read again only when its
 * size or its modification time differs from the one its kept stamp was read at.
 */
export function createStamps(): Stamps {
    const kept = new Map<string, { size: number; mtimeMs: number; stamp: number | null }>();
    return {
        of(path) {
            let fd: number;
            try {
                fd = openSync(path, 'r');
            } catch {
                kept.delete(path);
                return null;
            }
            try {
                const { size, mtimeMs } = fstatSync(fd);
                const held = kept.get(path);
                if (held?.size === size && held.mtimeMs === mtimeMs) {
                    return held.stamp;
                }
                const stamp = lastStampOf(fd, size);
                kept.set(path, { size, mtimeMs, stamp });
                return stamp;
            } catch {
                kept.delete(path);
                return null;
            } finally {
                closeSync(fd);
            }
        }
    };
}
