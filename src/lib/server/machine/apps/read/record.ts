// Layer 2, server. The files of one app folder and the content hash an approval is keyed by.
//
// What belongs to an app is its regular files, found by a walk of its folder: a symbolic link is
// neither recorded, hashed nor served, and neither is a file or folder whose name starts with a
// dot, so a link cannot carry a file from outside the folder into the app and a hidden file cannot
// ride along with it. Each recorded file keeps its size, modification time and change time
// (`ctime`, which `cp -p` and `rsync -t` cannot set), which the file route compares before it
// serves a byte.
//
// The hash is SHA-256 over the real folder path, the name, the manifest's bytes and each recorded
// file in sorted path order, each field framed by its length so that no two different inputs give
// one text. A file that cannot be read stops the hash with an error naming it, since an app whose
// content cannot be read whole cannot be approved by that content.

import { createHash, type Hash } from 'node:crypto';
import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** One recorded file of an app: its path under the app folder with `/`, and what a stat says. */
export type AppFile = { path: string; size: number; mtimeMs: number; ctimeMs: number };

/** What a walk found: the recorded files, their bytes, and whether a limit was passed. */
export type AppWalk = { files: AppFile[]; bytes: number; tooLarge: boolean };

/** The most files and bytes an app folder may hold. */
export type WalkLimits = { files: number; bytes: number };

/** The recorded files of an app folder in sorted path order, stopping once a limit is passed. */
export function walkApp(dir: string, limits: WalkLimits): AppWalk {
    const files: AppFile[] = [];
    let bytes = 0;
    const pending: string[] = [''];
    while (pending.length > 0) {
        const below = pending.pop() ?? '';
        let entries;
        try {
            entries = readdirSync(join(dir, below), { withFileTypes: true });
        } catch {
            continue;
        }
        for (const entry of entries) {
            if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue;
            const path = below === '' ? entry.name : `${below}/${entry.name}`;
            if (entry.isDirectory()) {
                pending.push(path);
                continue;
            }
            if (!entry.isFile()) continue;
            let stat;
            try {
                stat = lstatSync(join(dir, path));
            } catch {
                continue;
            }
            files.push({ path, size: stat.size, mtimeMs: stat.mtimeMs, ctimeMs: stat.ctimeMs });
            bytes += stat.size;
            if (files.length > limits.files || bytes > limits.bytes) {
                return { files: [], bytes, tooLarge: true };
            }
        }
    }
    files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
    return { files, bytes, tooLarge: false };
}

/** Add one field to the hash, framed by its byte length. */
function field(hash: Hash, bytes: Uint8Array | string): void {
    const data = typeof bytes === 'string' ? Buffer.from(bytes, 'utf8') : bytes;
    hash.update(`${data.length}:`);
    hash.update(data);
}

/**
 * The content hash of an app as hex: the real folder path, the name, the manifest's bytes and, for
 * each recorded file in sorted path order, its path and its bytes. Throws an error naming the file
 * that could not be read.
 */
export function hashApp(dir: string, name: string, manifest: Uint8Array, files: AppFile[]): string {
    const hash = createHash('sha256');
    field(hash, dir);
    field(hash, name);
    field(hash, manifest);
    for (const file of files) {
        field(hash, file.path);
        let bytes: Uint8Array;
        try {
            bytes = readFileSync(join(dir, file.path));
        } catch (error) {
            const why = error instanceof Error ? error.message.split('\n')[0] : String(error);
            throw new Error(`${file.path}: ${why}`, { cause: error });
        }
        field(hash, bytes);
    }
    return hash.digest('hex');
}
