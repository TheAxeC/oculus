// Layer 5, test support. The real configuration's words and glyphs, installed for a test that
// renders a view: every catalog line and every glyph is the shipped one, so an assertion names a
// word by its key.

import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';

/** Install the real catalog and the real glyphs. */
export function installRealText(): void {
    const { config } = loadConfig(engineDir());
    setCatalog(textCatalog(config));
    setGlyphs(glyphCatalog(config));
}
