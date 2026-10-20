// Layer 1, data. The whole-file shapes of oculus's own catalogs, config/catalogs/*.yml, of the
// options files, config/options/*.yml, and of the text files, config/text/**, each a zod object
// whose keys are the file's top-level keys, by the file it governs. The shapes are in the folder
// catalog-files/, one file per catalog or group of catalogs, each key described for the editor.
// The JSON Schema of the file in the editor is `z.toJSONSchema` of the same object, and loadConfig
// parses each file's content with it, so every issue of the shape is a finding on the config
// channel (data/shapes/shape-issues.ts). The readers that take rows of a catalog build their row
// shapes from the shapes there (the glyph stand-in, the LaTeX rows), so a row the editor marks is
// a row the reader leaves out, for the same reason.
//
// A shape is strict: a key the file's reader does not name is refused. Each key is optional, since
// a reader takes a key that is missing as empty and the merged config may hold a file without it.

import type { z } from 'zod';
import { agentsFileShape, agentsWords } from './catalog-files/agents.ts';
import { under, type Owned } from './catalog-files/common.ts';
import { glyphsFileShape, iconsFileShape } from './catalog-files/glyphs.ts';
import { latexFileShape, unimathFileShape } from './catalog-files/latex.ts';
import { metaFileShape, nestingFileShape } from './catalog-files/meta.ts';
import { optionsFileShape, readSpecWords } from './catalog-files/options.ts';
import { textFileShape } from './catalog-files/text.ts';
import { vocabFileShape } from './catalog-files/vocab.ts';

/**
 * A catalog file of the config folder with the shape its content is read through, and the keys
 * its own reader already words when it drops them (`owned`), so the shape's issue about the same
 * row is not a second finding.
 */
export type CatalogFile = { name: string; file: string; shape: z.ZodType; owned: Owned };

/** The catalog files that have a whole-file shape, each named by the file under config/. */
export const CATALOG_FILES: readonly CatalogFile[] = [
    { name: 'catalogs/vocab', file: 'catalogs/vocab.yml', shape: vocabFileShape, owned: under() },
    {
        name: 'catalogs/glyphs',
        file: 'catalogs/glyphs.yml',
        shape: glyphsFileShape,
        owned: under('glyphs')
    },
    { name: 'catalogs/icons', file: 'catalogs/icons.yml', shape: iconsFileShape, owned: under() },
    {
        name: 'catalogs/agents',
        file: 'catalogs/agents.yml',
        shape: agentsFileShape,
        owned: agentsWords
    },
    {
        name: 'catalogs/file-nesting',
        file: 'catalogs/file-nesting.yml',
        shape: nestingFileShape,
        owned: under('patterns')
    },
    {
        name: 'catalogs/latex',
        file: 'catalogs/latex.yml',
        shape: latexFileShape,
        owned: under(
            'latex_editing.at',
            'latex_editing.environments',
            'latex_editing.chords',
            'latex_editing.symbols'
        )
    },
    { name: 'catalogs/meta', file: 'catalogs/meta.yml', shape: metaFileShape, owned: under() },
    {
        name: 'catalogs/unimath',
        file: 'catalogs/unimath.yml',
        shape: unimathFileShape,
        owned: under()
    },
    { name: 'options', file: 'options/*.yml', shape: optionsFileShape, owned: readSpecWords }
];

/** The shape a file of the config folder is read through, by its name relative to config/. */
export function fileShapeOf(name: string): { shape: z.ZodType; owned: Owned } | undefined {
    const norm = name.replaceAll('\\', '/');
    if (norm.startsWith('text/')) return { shape: textFileShape, owned: under('text') };
    const glob = norm.replace(/^options\/[^/]+\.yml$/, 'options/*.yml');
    const catalog = CATALOG_FILES.find((one) => one.file === glob);
    return catalog === undefined ? undefined : { shape: catalog.shape, owned: catalog.owned };
}
