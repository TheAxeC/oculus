// Layer 1, data, pure. The editing tables of config/catalogs/latex.yml (`latex_editing:`): the `@`
// suggestions, the environments `\envname` completes, the chords of the formatting shortcuts, and
// the math symbol groups the TeX view lists, with the notice of the project they follow. The page
// reads them to build the editor's commands and the Math Symbols section, and the server words one
// finding for each list that lost a row, from the same read, so the two cannot disagree about what
// was left out. The same module reads the Unicode math symbols of config/catalogs/unimath.yml
// (`latex_unimath:`), the commands the editor completes while `latex.unimath_symbols` is true: per
// row the command without its backslash, the detail line and the words that describe it. A row
// whose command is not a name of letters or whose detail is empty is left out and the rest are
// kept; a key that is absent is no symbols, and a value that is not a list is one dropped list.
//
// A row that cannot be used is left out and the rest are kept: an `@` suggestion with no prefix or
// no body, an environment whose name is not letters with an optional star, a chord whose key is not
// one character or whose command is not a name of letters, a text chord whose second press is one
// the LaTeX tab keeps for a command of its own on some platform (`l`, `w`, and `m`,
// data/helpers/keys/oculus/editor-keys.ts `takesChordSecond`), and a symbol with no name, no
// source or nothing to insert. A group left with no symbol is left out too. A key that is absent
// is an empty table, and a value that is not the shape the key names is one dropped list.

import { z } from 'zod';
import {
    latexAtRow,
    latexEnvironmentRow,
    latexSymbolRow,
    latexUnimathRow
} from '../../../shapes/catalog-files/latex.ts';
import { filledTextShape, mapShape, optionalTextShape } from '../../../shapes/shapes.ts';
import { takesChordSecond } from '../../../helpers/keys/oculus/editor-keys.ts';

/** One `@` suggestion: what is typed after the `@`, the snippet it inserts, what it means. */
type AtSuggestion = { prefix: string; body: string; description: string };

/**
 * One environment `\envname` completes: its name and the arguments it takes after `\begin{name}`,
 * as a snippet.
 */
type EnvironmentSuggestion = { name: string; arguments: string };

/** One symbol: its name, the TeX it is drawn from, the snippet it inserts and its search words. */
type MathSymbol = { name: string; source: string; insert: string; keywords: string };

/** One group of symbols, in the order of the file. */
export type SymbolGroup = { name: string; items: MathSymbol[] };

/**
 * The commands the chords name: for the keys of the text chords and of the math chords, the
 * command each wraps the selection in. A capital letter is the shifted key.
 */
type Chords = { text: Record<string, string>; math: Record<string, string> };

/** The tables of the catalog. */
export type LatexEditing = {
    notice: string;
    at: AtSuggestion[];
    environments: EnvironmentSuggestion[];
    chords: Chords;
    symbols: SymbolGroup[];
};

/** What is left out of the tables: the keys of the lists that lost a row, in the order read. */
export type LatexEditingRead = { editing: LatexEditing; dropped: string[] };

// The rows are the file shape's rows (shapes/catalog-files.ts) read leniently: a key the row does
// not name is ignored, and an optional text that is missing or wrong is the empty text.

const atShape = z.object({
    ...latexAtRow.shape,
    description: z.string().catch('')
});

const environmentShape = z.object({
    ...latexEnvironmentRow.shape,
    arguments: optionalTextShape.transform((one) => one ?? '')
});

const symbolShape = z.object({
    ...latexSymbolRow.shape,
    keywords: optionalTextShape.transform((one) => one ?? '')
});

const groupShape = z.object({ name: z.string().min(1), items: z.array(z.unknown()) });

/** The items of a list that pass a shape, and how many did not. */
function surviving<T>(list: unknown, shape: z.ZodType<T>): { kept: T[]; lost: number } {
    if (!Array.isArray(list)) return { kept: [], lost: list === undefined ? 0 : 1 };
    const kept: T[] = [];
    for (const one of list) {
        const parsed = shape.safeParse(one);
        if (parsed.success) kept.push(parsed.data);
    }
    return { kept, lost: list.length - kept.length };
}

/**
 * The usable rows of one chord map, and whether one was left out; `taken` names the keys whose
 * press the tab keeps for a command of its own.
 */
function chordsOf(
    value: unknown,
    taken: (key: string) => boolean = () => false
): { kept: Record<string, string>; lost: boolean } {
    const kept: Record<string, string> = {};
    if (value === undefined) return { kept, lost: false };
    const map = mapShape.safeParse(value);
    if (!map.success) return { kept, lost: true };
    let lost = false;
    for (const [key, command] of Object.entries(map.data)) {
        if (
            /^[A-Za-z0-9-]$/.test(key) &&
            !taken(key) &&
            typeof command === 'string' &&
            /^[A-Za-z]+$/.test(command)
        ) {
            kept[key] = command;
        } else {
            lost = true;
        }
    }
    return { kept, lost };
}

/** Read the `latex_editing:` tables out of the merged config. */
export function readLatexEditing(config: Record<string, unknown>): LatexEditingRead {
    const held = mapShape.safeParse(config.latex_editing);
    const root: Record<string, unknown> = held.success ? held.data : {};
    const dropped: string[] = [];
    const at = surviving(root.at, atShape);
    if (at.lost > 0) dropped.push('latex_editing.at');
    const environments = surviving(root.environments, environmentShape);
    if (environments.lost > 0) dropped.push('latex_editing.environments');
    const text = chordsOf(mapShape.safeParse(root.chords).data?.text, takesChordSecond);
    const math = chordsOf(mapShape.safeParse(root.chords).data?.math);
    if (text.lost) dropped.push('latex_editing.chords.text');
    if (math.lost) dropped.push('latex_editing.chords.math');
    const groups = surviving(root.symbols, groupShape);
    if (groups.lost > 0) dropped.push('latex_editing.symbols');
    const symbols: SymbolGroup[] = [];
    for (const group of groups.kept) {
        const items = surviving(group.items, symbolShape);
        if (items.lost > 0) dropped.push(`latex_editing.symbols.${group.name}`);
        if (items.kept.length > 0) symbols.push({ name: group.name, items: items.kept });
    }
    return {
        editing: {
            notice: filledTextShape.parse(root.notice) ?? '',
            at: at.kept,
            environments: environments.kept,
            chords: { text: text.kept, math: math.kept },
            symbols
        },
        dropped
    };
}

/** One symbol: `\command` inserts it, `detail` is its glyph line, `documentation` describes it. */
export type UnimathSymbol = { command: string; detail: string; documentation: string };

/** The symbols of the catalog and how many rows were left out. */
export type LatexUnimathRead = { symbols: UnimathSymbol[]; lost: number };

/** Read the `latex_unimath:` rows out of the merged config. */
export function readLatexUnimath(config: Record<string, unknown>): LatexUnimathRead {
    const rows = config.latex_unimath;
    if (rows === undefined) return { symbols: [], lost: 0 };
    if (!Array.isArray(rows)) return { symbols: [], lost: 1 };
    const symbols: UnimathSymbol[] = [];
    for (const row of rows) {
        const parsed = latexUnimathRow.safeParse(row);
        if (parsed.success) symbols.push(parsed.data);
    }
    return { symbols, lost: rows.length - symbols.length };
}
