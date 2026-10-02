// Layer 4, test helper. Entries added to a local history's index of delete copies
// (`deletes.json`, server/files/fs/history.ts), so a case reaches the limit of kept delete copies
// with one real delete instead of fifty.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** One delete copy as the index lists it. */
export type DeleteListed = { folder: string; id: string; at: number };

/** The delete copies the history's index lists, oldest first. */
export function deletesListed(history: string): DeleteListed[] {
    const held = JSON.parse(readFileSync(join(history, 'deletes.json'), 'utf8')) as {
        deletes: DeleteListed[];
    };
    return held.deletes;
}

/**
 * Append `count` delete copies to the index, one millisecond apart from `at`, each in a folder of
 * its own that holds nothing, so dropping one removes no file.
 */
export function listDeletes(history: string, count: number, at: number): void {
    const held = existsSync(join(history, 'deletes.json')) ? deletesListed(history) : [];
    const added = Array.from({ length: count }, (_, n) => ({
        folder: `listed-${n}`,
        id: `20231114T221320${String(n).padStart(3, '0')}`,
        at: at + n
    }));
    writeFileSync(
        join(history, 'deletes.json'),
        `${JSON.stringify({ deletes: [...held, ...added] })}\n`
    );
}
