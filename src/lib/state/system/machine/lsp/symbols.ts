// Layer 2, client state, pure. What the Outline and the breadcrumb draw of the document symbols a
// language server answered for a source tab: one row per symbol in document order with its depth,
// its kind's glyph and the colour key VS Code's `symbolIcon.*` theme keys name for it, the problem
// the symbol's range holds, and the chain of symbols that contain a caret.
//
// The kinds are the protocol's 26, in its order, and each draws as the glyph `symbol_<name>` of
// config/catalogs/glyphs.yml. The colour key is the one the theme table (ui/controls/editor/kit/
// theme/colours.ts) holds, read by the views that draw the icon.

import type { Diagnostic, DocumentSymbol } from 'vscode-languageserver-protocol';

/** One kind: the glyph it draws as and the theme key its icon is coloured by. */
type Kind = { glyph: string; colour: string };

/** The 26 kinds of the protocol, from `File` (1) to `TypeParameter` (26). */
const KINDS: readonly Kind[] = [
    { glyph: 'symbol_file', colour: 'symbolIcon.fileForeground' },
    { glyph: 'symbol_module', colour: 'symbolIcon.moduleForeground' },
    { glyph: 'symbol_namespace', colour: 'symbolIcon.namespaceForeground' },
    { glyph: 'symbol_package', colour: 'symbolIcon.packageForeground' },
    { glyph: 'symbol_class', colour: 'symbolIcon.classForeground' },
    { glyph: 'symbol_method', colour: 'symbolIcon.methodForeground' },
    { glyph: 'symbol_property', colour: 'symbolIcon.propertyForeground' },
    { glyph: 'symbol_field', colour: 'symbolIcon.fieldForeground' },
    { glyph: 'symbol_constructor', colour: 'symbolIcon.constructorForeground' },
    { glyph: 'symbol_enum', colour: 'symbolIcon.enumeratorForeground' },
    { glyph: 'symbol_interface', colour: 'symbolIcon.interfaceForeground' },
    { glyph: 'symbol_function', colour: 'symbolIcon.functionForeground' },
    { glyph: 'symbol_variable', colour: 'symbolIcon.variableForeground' },
    { glyph: 'symbol_constant', colour: 'symbolIcon.constantForeground' },
    { glyph: 'symbol_string', colour: 'symbolIcon.stringForeground' },
    { glyph: 'symbol_number', colour: 'symbolIcon.numberForeground' },
    { glyph: 'symbol_boolean', colour: 'symbolIcon.booleanForeground' },
    { glyph: 'symbol_array', colour: 'symbolIcon.arrayForeground' },
    { glyph: 'symbol_object', colour: 'symbolIcon.objectForeground' },
    { glyph: 'symbol_key', colour: 'symbolIcon.keyForeground' },
    { glyph: 'symbol_null', colour: 'symbolIcon.nullForeground' },
    { glyph: 'symbol_enum_member', colour: 'symbolIcon.enumeratorMemberForeground' },
    { glyph: 'symbol_struct', colour: 'symbolIcon.structForeground' },
    { glyph: 'symbol_event', colour: 'symbolIcon.eventForeground' },
    { glyph: 'symbol_operator', colour: 'symbolIcon.operatorForeground' },
    { glyph: 'symbol_type_parameter', colour: 'symbolIcon.typeParameterForeground' }
];

/** The glyph and colour key of a symbol kind; a kind outside the 26 draws as a variable. */
function kindOf(kind: number): Kind {
    return KINDS[kind - 1] ?? KINDS[12];
}

/** What a symbol's range holds: an error, a warning, or nothing worse than information. */
export type SymbolProblem = 'error' | 'warning' | null;

/** One symbol as a list draws it. */
export type SymbolRow = {
    key: string;
    title: string;
    /** pyright's and clangd's `detail`: a signature or a type. */
    detail: string;
    depth: number;
    /** The line the symbol's name is on, counted from one. */
    line: number;
    /** The column of the name's start, counted from one. */
    column: number;
    glyph: string;
    colour: string;
    problem: SymbolProblem;
};

/** The diagnostics inside a range, reduced to the worst severity they hold. */
function problemIn(range: DocumentSymbol['range'], problems: readonly Diagnostic[]): SymbolProblem {
    let worst: SymbolProblem = null;
    for (const one of problems) {
        const before =
            one.range.end.line < range.start.line ||
            (one.range.end.line === range.start.line &&
                one.range.end.character < range.start.character);
        const after =
            one.range.start.line > range.end.line ||
            (one.range.start.line === range.end.line &&
                one.range.start.character > range.end.character);
        if (before || after) continue;
        if (one.severity === undefined || one.severity === 1) return 'error';
        if (one.severity === 2) worst = 'warning';
    }
    return worst;
}

/** The symbols of a tree as rows in document order, each with the worst problem in its range. */
export function symbolRows(
    tree: readonly DocumentSymbol[],
    problems: readonly Diagnostic[],
    depth = 0,
    parent = ''
): SymbolRow[] {
    return tree.flatMap((one, at) => {
        const key = `${parent}/${String(at)}:${one.name}`;
        const kind = kindOf(one.kind);
        return [
            {
                key,
                title: one.name,
                detail: one.detail ?? '',
                depth,
                line: one.selectionRange.start.line + 1,
                column: one.selectionRange.start.character + 1,
                glyph: kind.glyph,
                colour: kind.colour,
                problem: problemIn(one.range, problems)
            },
            ...symbolRows(one.children ?? [], problems, depth + 1, key)
        ];
    });
}

/** Whether a position (counted from one) is inside a symbol's range. */
function holds(range: DocumentSymbol['range'], line: number, column: number): boolean {
    const [row, col] = [line - 1, column - 1];
    if (row < range.start.line || row > range.end.line) return false;
    if (row === range.start.line && col < range.start.character) return false;
    return !(row === range.end.line && col > range.end.character);
}

/** The symbols that contain a caret, outermost first, each as a row with its key. */
export function symbolsAround(
    tree: readonly DocumentSymbol[],
    line: number,
    column: number
): SymbolRow[] {
    const found: SymbolRow[] = [];
    let level = tree;
    let parent = '';
    for (let depth = 0; ; depth += 1) {
        const at = level.findIndex((one) => holds(one.range, line, column));
        if (at < 0) return found;
        const one = level[at];
        const key = `${parent}/${String(at)}:${one.name}`;
        const kind = kindOf(one.kind);
        found.push({
            key,
            title: one.name,
            detail: one.detail ?? '',
            depth,
            line: one.selectionRange.start.line + 1,
            column: one.selectionRange.start.character + 1,
            glyph: kind.glyph,
            colour: kind.colour,
            problem: null
        });
        level = one.children ?? [];
        parent = key;
    }
}
