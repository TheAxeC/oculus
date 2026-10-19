// Layer 2, server. The checks of Recover: a file's checksum computed by streaming it through
// `node:crypto` on this Mac, and the check rows that remember the result, so a GET never hashes a
// file. On this Mac the rows are `~/.oculus/recover/<hub>/<key>.checks.json`; on the cluster the
// check job writes them as lines of text (cluster.ts), read here by `checksFromLines`.
//
// A row holds the checksum the file gave, whether or not it matched: plan.ts states the file
// verified when that checksum is the source's and different when it is not.

import { createHash } from 'node:crypto';
import { createReadStream, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import type { Checksum } from './files.ts';
import type { CheckRow, PlanRow } from './plan.ts';

const checksumShape = z.object({
    kind: z.enum(['sha256', 'md5', 'sha1']),
    value: z.string().regex(/^[0-9a-f]+$/)
});

const checksFileShape = z.object({
    rows: z.array(
        z.object({
            name: z.string(),
            size: z.number().int().min(0),
            mtime: z.number().int(),
            checksum: checksumShape
        })
    )
});

/** The check rows of a `checks.json`; none when it is absent or does not read. */
export function readChecks(file: string): CheckRow[] {
    try {
        const read = checksFileShape.safeParse(JSON.parse(readFileSync(file, 'utf8')));
        return read.success ? read.data.rows : [];
    } catch {
        return [];
    }
}

/** The rows written over the file whole, through a file beside it that is then renamed. */
function writeChecks(file: string, rows: CheckRow[]): void {
    const next = `${file}.next`;
    writeFileSync(next, `${JSON.stringify({ rows }, null, 1)}\n`, { mode: 0o600 });
    renameSync(next, file);
}

/** The rows with one row for each name of `fresh`, an older row of that name replaced. */
function mergedChecks(held: CheckRow[], fresh: CheckRow[]): CheckRow[] {
    const names = new Set(fresh.map((row) => row.name));
    return [...held.filter((row) => !names.has(row.name)), ...fresh];
}

/** A line the check job writes: size, time, kind, checksum, then the name to the line's end. */
const CHECK_LINE = /^(\d+) (\d+) (sha256|md5|sha1) ([0-9a-f]+) (.+)$/;

/**
 * The check rows of the lines the cluster's check job appends, a later line of a name replacing an
 * earlier one, so each check of a file adds a line and the last is the one that holds.
 */
export function checksFromLines(text: string): CheckRow[] {
    const rows = new Map<string, CheckRow>();
    for (const line of text.split('\n')) {
        const found = CHECK_LINE.exec(line);
        if (found === null) continue;
        rows.delete(found[5]);
        rows.set(found[5], {
            name: found[5],
            size: Number(found[1]),
            mtime: Number(found[2]),
            checksum: { kind: found[3] as Checksum['kind'], value: found[4] }
        });
    }
    return [...rows.values()];
}

/** A file's checksum of a kind, read as a stream; `onBytes` hears each chunk's length. */
function hashFile(
    path: string,
    kind: Checksum['kind'],
    onBytes: (bytes: number) => void = () => undefined,
    signal?: AbortSignal
): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = createHash(kind);
        const stream = createReadStream(path, { signal });
        stream.on('data', (chunk) => {
            hash.update(chunk);
            onBytes(chunk.length);
        });
        stream.on('error', reject);
        stream.on('end', () => resolve(hash.digest('hex')));
    });
}

/** What a check of the rows tells as it goes. */
export type VerifyProgress = {
    /** Called with the bytes read so far over every file. */
    bytes: (done: number) => void;
    /** Called once a file is checked, with whether it matched. */
    checked: (name: string, matched: boolean) => void;
};

/**
 * Check each row's file in `folder` against its source's checksum, adding a row per file to the
 * checks file as soon as it is checked, so a check that is stopped keeps what it did.
 */
export async function verifyRows(
    folder: string,
    rows: PlanRow[],
    checksFile: string,
    progress: VerifyProgress,
    signal?: AbortSignal
): Promise<void> {
    let done = 0;
    for (const row of rows) {
        if (row.checksum === null || signal?.aborted === true) continue;
        const path = join(folder, row.name);
        const before = statSync(path);
        const value = await hashFile(
            path,
            row.checksum.kind,
            (bytes) => {
                done += bytes;
                progress.bytes(done);
            },
            signal
        );
        const fresh: CheckRow = {
            name: row.name,
            size: before.size,
            mtime: Math.floor(before.mtimeMs / 1000),
            checksum: { kind: row.checksum.kind, value }
        };
        writeChecks(checksFile, mergedChecks(readChecks(checksFile), [fresh]));
        progress.checked(row.name, value === row.checksum.value.toLowerCase());
    }
}
