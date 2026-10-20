// Layer 1, data. The whole-file shapes of config/catalogs/glyphs.yml, the glyph vocabulary with
// the ASCII stand-in a terminal theme draws for each name, and config/catalogs/icons.yml, the line
// icon each name is drawn as, with a description on every key.

import { z } from 'zod';
import { text } from './common.ts';

/**
 * A glyph's stand-in: one to three printable ASCII characters, which a terminal font is sure to
 * hold and the three-character box of ui/display/Glyph.svelte is sure to fit.
 */
export const standInShape = z.string().regex(/^[\x20-\x7E]{1,3}$/);

/** config/catalogs/glyphs.yml: each glyph name with the stand-in a terminal theme draws for it. */
export const glyphsFileShape = z.strictObject({
    glyphs: z
        .record(
            z.string(),
            standInShape.describe(
                'The one to three printable ASCII characters a terminal theme draws in place of the icon.'
            )
        )
        .optional()
        .describe('Every glyph name a component draws, with the ASCII stand-in of its icon.')
});

/** config/catalogs/icons.yml: each glyph name with the icon the package draws for it. */
export const iconsFileShape = z.strictObject({
    icons: z
        .record(
            z.string(),
            text.describe('The name of the icon file in the icon package, without `.svg`.')
        )
        .optional()
        .describe('The line icon each glyph name of glyphs.yml is drawn as, one row per name.')
});
