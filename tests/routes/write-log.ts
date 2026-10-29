// Layer 4, test helper. The writer a route test hands a route that writes through the Files writer:
// one served root, a change log and a history folder of its own in a scratch folder, the writes
// History lists of it, and the undo of the Files view taken over them, so a case reads a write back
// as History shows it and takes it back the way its Undo button does.

import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from 'vitest';
import { scratchDir } from '../fixtures/scratch.ts';
import { readChanges, type Change } from '../../src/lib/server/core/changes.ts';
import { fsWrites } from '../../src/lib/server/core/json.ts';
import { undoFiles } from '../../src/lib/server/edit/writes/file-undo.ts';
import type { WriteTarget } from '../../src/lib/server/edit/writes.ts';
import type { OpsTarget } from '../../src/lib/server/files/fs/ops.ts';

/** The writes of one case over one served root, read back and undone as History does. */
export class WriteLog {
    private base = '';
    private ops = fsWrites();
    private changes = { file: '', keep: 500, writes: fsWrites() };
    /** The `at` of each write the case undid, which the History route records as `undoes`. */
    private undone = new Set<string>();

    /** `key` is the served root's key and `dir` the folder it serves, read at each write. */
    constructor(
        private readonly key: string,
        private readonly dir: () => string
    ) {}

    /** Start a case: a new scratch folder named after `prefix`, an empty log, nothing undone. */
    start(prefix: string): void {
        this.base = scratchDir(prefix);
        this.ops = fsWrites();
        // The change log waits on a chain of its own, as the process's does, apart from the
        // writes'.
        this.changes = { file: join(this.base, 'changes.jsonl'), keep: 500, writes: fsWrites() };
        this.undone = new Set();
    }

    /** The writer the route is handed. */
    writer(): OpsTarget {
        return {
            roots: [{ key: this.key, dir: this.dir() }],
            writes: this.ops,
            changes: this.changes,
            history: join(this.base, 'history')
        };
    }

    /** The writes History lists that no undo has taken back, newest first. */
    listed(): Change[] {
        return readChanges(this.changes).filter((one) => !this.undone.has(one.at));
    }

    /** Undo the newest write History lists and answer it. */
    async undoNewest(): Promise<Change> {
        const newest = this.listed()[0];
        await this.undo(newest);
        return newest;
    }

    /** Undo every write History lists now, newest first. */
    async undoAll(): Promise<void> {
        for (const one of this.listed()) await this.undo(one);
    }

    /** Undo one write the way the Undo button of History does; the undo must not be refused. */
    private async undo(change: Change): Promise<void> {
        const target = {
            files: {
                roots: () => this.writer().roots,
                history: join(this.base, 'history'),
                writes: this.ops
            }
        } as unknown as WriteTarget;
        const done = await undoFiles(target, change, {
            trash: (path) => {
                rmSync(path, { recursive: true, force: true });
                return Promise.resolve();
            }
        });
        expect((done as { error?: string }).error).toBeUndefined();
        this.undone.add(change.at);
    }
}
