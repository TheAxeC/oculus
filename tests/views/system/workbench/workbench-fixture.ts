// Layer 4, test fixture. What the workbench view suites share: the real config with its catalog and
// glyphs installed.

import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';
import { setAppearance } from '../../../../src/lib/state/shared/words/appearance.ts';

const config = loadConfig(engineDir()).config;

export const catalog = textCatalog(config);

setCatalog(catalog);
setGlyphs(glyphCatalog(config));
setAppearance(config);
