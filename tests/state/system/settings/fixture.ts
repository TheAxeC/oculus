// Layer 2, test fixture. What the Settings state suites share: the real config with its words and
// themes installed, the shipped options catalog.

import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { catalogOf } from '../../../../src/lib/data/sources/config/catalog/options.ts';
import { setAppearance } from '../../../../src/lib/state/shared/words/appearance.ts';
import { vscodeRuleIds } from '../../../../src/lib/data/places/code-rules.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import type { FsEntry } from '../../../../src/lib/state/sources/fs.ts';

const config = loadConfig(engineDir()).config;

export const shipped = catalogOf(config);

setCatalog(textCatalog(config));
setAppearance(config, vscodeRuleIds());

/** A file the file browser lists. */
export function file(name: string): FsEntry {
    return { name, kind: 'file', size: 1, mtime: 0 };
}

/** A folder the file browser lists. */
export function dir(name: string): FsEntry {
    return { name, kind: 'dir', size: 0, mtime: 0 };
}
