// Layer 1, data. The whole-file shapes of config/catalogs/latex.yml, the editing tables of the
// LaTeX editor, and config/catalogs/unimath.yml, the Unicode math symbols of its completion, with a
// description on every key. The reader of each file (data/sources/config/catalog/latex-tables.ts)
// builds its row shapes from the rows here, so a row the editor marks is a row the reader leaves
// out.

import { z } from 'zod';
import { text } from './common.ts';

/** One `@` suggestion of latex.yml: what is typed after the `@`, the snippet it inserts. */
export const latexAtRow = z.strictObject({
    prefix: text.min(1).describe('What is typed to offer the suggestion, starting with @.'),
    body: text
        .min(1)
        .describe(
            'The snippet the suggestion inserts, with $1, $2 and $0 for the stops of the cursor.'
        ),
    description: text.optional().describe('The words the suggestion list shows beside it.')
});

/** One environment `\envname` completes, with the arguments it takes after `\begin{name}`. */
export const latexEnvironmentRow = z.strictObject({
    name: text
        .regex(/^[A-Za-z]+\*?$/)
        .describe('The name of the environment, letters and an optional *.'),
    arguments: text
        .optional()
        .describe('The arguments the environment takes after \\begin{name}, inserted with it.')
});

/** One math symbol: its name, the TeX it is drawn from, the snippet it inserts. */
export const latexSymbolRow = z.strictObject({
    name: text.min(1).describe('The name the symbol is listed and found by.'),
    source: text.min(1).describe('The TeX the symbol is drawn from in the list.'),
    insert: text.min(1).describe('The snippet a press on the symbol inserts.'),
    keywords: text.optional().describe('More words the symbol is found by.')
});

/** One group of math symbols. */
const latexSymbolGroup = z.strictObject({
    name: text.min(1).describe('The heading the group is listed under.'),
    items: z.array(latexSymbolRow).describe("The group's symbols, in the order they are listed.")
});

/** The chords of a kind: the key (one character) and the name of the command it wraps in. */
const latexChords = z.record(
    z.string().regex(/^[A-Za-z0-9-]$/),
    text.regex(/^[A-Za-z]+$/).describe('The name of the command the selection is wrapped in.')
);

/** config/catalogs/latex.yml: the editing tables of the LaTeX editor. */
export const latexFileShape = z.strictObject({
    latex_editing: z
        .strictObject({
            notice: text
                .optional()
                .describe('The notice of the project the tables follow, shown with them.'),
            at: z
                .array(latexAtRow)
                .optional()
                .describe('The suggestions offered after typing @ in a LaTeX tab.'),
            environments: z
                .array(latexEnvironmentRow)
                .optional()
                .describe('The environments \\envname completes.'),
            chords: z
                .strictObject({
                    text: latexChords
                        .optional()
                        .describe('The formatting chords of text, by the key the chord ends with.'),
                    math: latexChords
                        .optional()
                        .describe('The formatting chords of math, by the key the chord ends with.')
                })
                .optional()
                .describe(
                    'The formatting shortcuts: each key with the command it wraps the selection in.'
                ),
            symbols: z
                .array(latexSymbolGroup)
                .optional()
                .describe("The math symbol groups of the TeX view's Math Symbols section.")
        })
        .optional()
        .describe('The editing tables of a LaTeX tab and of the TeX view.')
});

/** One Unicode math symbol: the command without its backslash, its glyph line and its words. */
export const latexUnimathRow = z.strictObject({
    command: text.regex(/^[A-Za-z]+$/).describe('The command name without its backslash.'),
    detail: text
        .min(1)
        .describe('The glyph, followed in some rows by the package that defines the command.'),
    documentation: text.describe('The words that describe the symbol.')
});

/** config/catalogs/unimath.yml: the Unicode math symbols of the LaTeX completion. */
export const unimathFileShape = z.strictObject({
    latex_unimath: z
        .array(latexUnimathRow)
        .optional()
        .describe(
            'The Unicode math symbols the LaTeX completion offers after a backslash while latex.unimath_symbols is true.'
        )
});
