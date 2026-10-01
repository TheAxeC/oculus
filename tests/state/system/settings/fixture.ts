// Layer 2, test fixture. What the Settings state suites share: the real config with its words and
// themes installed, the shipped options catalog, and a file text as the fs store answers it once a
// file has been read.

import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { catalogOf } from '../../../../src/lib/data/sources/config/options.ts';
import { setAppearance } from '../../../../src/lib/state/shared/words/appearance.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import type { FileText } from '../../../../src/lib/state/sources/fs-transport.ts';

export const config = loadConfig(engineDir()).config;

export const shipped = catalogOf(config);

setCatalog(textCatalog(config));
setAppearance(config);

/** A file text as the fs store answers it once it has been read. */
export function text(content: string): FileText {
    return { text: content, truncated: false, error: '', loading: false };
}
