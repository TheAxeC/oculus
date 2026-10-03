// Layer 2, test fixture. What the Settings state suites share: the real config with its words and
// themes installed, the shipped options catalog, a file text as the fs store answers it once a file
// has been read, and the rows of the five tracked files as the repository ships them.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { catalogOf } from '../../../../src/lib/data/sources/config/catalog/options.ts';
import { setAppearance } from '../../../../src/lib/state/shared/words/appearance.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { FILES } from '../../../../src/lib/state/system/config/groups.ts';
import { fileRows, type ConfigRow } from '../../../../src/lib/state/system/config/rows.ts';
import type { FsEntry } from '../../../../src/lib/state/sources/fs.ts';
import type { FileText } from '../../../../src/lib/state/sources/fs-transport.ts';

export const config = loadConfig(engineDir()).config;

export const shipped = catalogOf(config);

setCatalog(textCatalog(config));
setAppearance(config);

/** A file the file browser lists. */
export function file(name: string): FsEntry {
    return { name, kind: 'file', size: 1, mtime: 0 };
}

/** A folder the file browser lists. */
export function dir(name: string): FsEntry {
    return { name, kind: 'dir', size: 0, mtime: 0 };
}

/** A file text as the fs store answers it once it has been read. */
export function text(content: string): FileText {
    return { text: content, truncated: false, error: '', loading: false };
}

/** The rows of the five tracked files as the repository ships them, in file then catalog order. */
export function shippedRows(): ConfigRow[] {
    return FILES.flatMap((name) => {
        const held = text(readFileSync(join(engineDir(), 'config', name), 'utf8'));
        return fileRows(name, shipped[name], held).rows;
    });
}

/** The one row of a list that `match` names; a list without one fails the test that asked. */
export function rowOf(rows: ConfigRow[], match: (row: ConfigRow) => boolean): ConfigRow {
    const found = rows.find(match);
    if (found === undefined) throw new Error('no row matches');
    return found;
}
