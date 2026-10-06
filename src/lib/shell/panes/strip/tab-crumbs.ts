// Layer 3, shell. The breadcrumb over a file tab: the segments of the path its tab names (the root,
// each folder, the file), then the symbols of the file that contain the caret, outermost first,
// and what a press on one opens. Apart from the component so both can be read without a DOM.
//
// A press on the root or a folder runs `showFolderInFiles` and a press on the file runs
// `showInFiles`; the home folder is written `~` in the tab's tooltip once the server's roots answer
// has come. The Files tree draws no breadcrumb.

import type { Instance } from '$lib/state/workbench/layout';
import { crumbsOf, fileOfTab } from '$lib/state/workbench/navigation/pages';
import type { SymbolRow } from '$lib/state/system/machine/lsp/symbols';

/** The symbol a segment stands for: where it starts, and the icon its kind draws. */
type CrumbSymbol = { line: number; column: number; glyph: string; colour: string };

/**
 * One segment: its words, the root and the path it names, and whether it is the file itself. A
 * segment after the file is a symbol of it and carries the symbol.
 */
export type Crumb = {
    label: string;
    root: string;
    path: string;
    file: boolean;
    symbol?: CrumbSymbol;
};

/**
 * The segments of the path a tab shows, outermost first, then the symbols that contain the caret,
 * or none for a tab that names no file and for a file under a root the server does not serve, which
 * the Files view could not show.
 */
export function tabCrumbs(
    tab: Pick<Instance, 'id' | 'view' | 'state'>,
    served: readonly string[],
    symbols: readonly SymbolRow[] = []
): Crumb[] {
    const file = fileOfTab(tab);
    if (file === null || !served.includes(file.root)) return [];
    const segments = crumbsOf(file);
    return [
        ...segments.map((segment, at) => ({
            label: segment.label,
            root: segment.row.root,
            path: segment.row.path,
            file: at === segments.length - 1
        })),
        ...symbols.map((one) => ({
            label: one.title,
            root: file.root,
            path: file.path,
            file: false,
            symbol: { line: one.line, column: one.column, glyph: one.glyph, colour: one.colour }
        }))
    ];
}

/** What a press on a segment calls: the Files view shown at a folder, and at a file. */
export type CrumbDeps = {
    showFolderInFiles: (path: string, root?: string) => string;
    showInFiles: (path: string, root?: string) => string;
    /** Move the caret of the tab the crumbs are of to a symbol's start. */
    goTo: (line: number, column: number) => void;
};

/**
 * A press on a segment: a folder or the root opens the Files view there, the file reveals it, and
 * a symbol moves the caret to its start.
 */
export function crumbPicked(crumb: Crumb, deps: CrumbDeps): void {
    if (crumb.symbol !== undefined) deps.goTo(crumb.symbol.line, crumb.symbol.column);
    else if (crumb.file) deps.showInFiles(crumb.path, crumb.root);
    else deps.showFolderInFiles(crumb.path, crumb.root);
}
