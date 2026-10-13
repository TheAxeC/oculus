// Layer 3, view partial of Source.svelte. The document symbols a Markdown or LaTeX tab gives
// Monaco: the headings of the text as a tree, each with the lines it covers, which sticky scroll
// pins at the top of the editor and the outline reads. The headings come from the outline reader
// (state/sources/explorer/sections/outline.ts), so the editor, the Outline section and the server
// agree on what a heading is.
//
// A symbol provider is registered per language, and a page holds many editors of one language, so
// each provider answers for the model it was made for alone and for no other. While a language
// server serves the model the provider answers nothing, as the brace folding does
// (ui/controls/editor/kit/languages/folding.ts): Monaco joins the symbols of every provider of a
// language, so the headings and the server's tree together would draw one heading twice in sticky
// scroll and in the path over the tab. The provider is registered again when what is served
// changes, which makes Monaco ask once more.

import type * as Monaco from 'monaco-editor';
import type { OutlineItem } from '$lib/state/sources/explorer/sections/outline';
import type { EditorExtension } from '$lib/ui/controls/editor/types';

/** A heading with the lines it covers and the headings under it. */
export type HeadingNode = { name: string; start: number; end: number; children: HeadingNode[] };

/** Reads the headings of a text; a LaTeX reader answers once its parser has loaded. */
export type SymbolReader = (text: string) => OutlineItem[] | Promise<OutlineItem[]>;

/**
 * The headings as a tree. A heading covers the lines up to the one before the next heading of its
 * level or a higher one, the last to `lastLine`; a heading under a skipped level nests one step.
 */
export function headingTree(items: OutlineItem[], lastLine: number): HeadingNode[] {
    const roots: HeadingNode[] = [];
    const open: { level: number; node: HeadingNode }[] = [];
    for (const item of items) {
        while (open.length > 0 && open[open.length - 1].level >= item.level) {
            const closed = open.pop();
            if (closed !== undefined) closed.node.end = Math.max(closed.node.start, item.line - 1);
        }
        const node: HeadingNode = {
            name: item.title,
            start: item.line,
            end: lastLine,
            children: []
        };
        (open.length > 0 ? open[open.length - 1].node.children : roots).push(node);
        open.push({ level: item.level, node });
    }
    for (const left of open) left.node.end = Math.max(left.node.start, lastLine);
    return roots;
}

/** The tree as Monaco's symbols, each a string symbol spanning whole lines. */
function symbolsOf(
    nodes: HeadingNode[],
    monaco: Pick<typeof Monaco, 'languages'>,
    model: Pick<Monaco.editor.ITextModel, 'getLineMaxColumn'>
): Monaco.languages.DocumentSymbol[] {
    return nodes.map((node) => ({
        name: node.name,
        detail: '',
        kind: monaco.languages.SymbolKind.String,
        tags: [],
        range: {
            startLineNumber: node.start,
            startColumn: 1,
            endLineNumber: node.end,
            endColumn: model.getLineMaxColumn(node.end)
        },
        selectionRange: {
            startLineNumber: node.start,
            startColumn: 1,
            endLineNumber: node.start,
            endColumn: model.getLineMaxColumn(node.start)
        },
        children: symbolsOf(node.children, monaco, model)
    }));
}

/**
 * The extension that registers the symbol provider of one model's language and answers with the
 * model's headings. It answers nothing for another model, for a model a language server serves,
 * for a request Monaco cancelled, for a text typed into while the request waited, or after it was
 * taken away with the tab.
 */
export function symbolsExtension(read: SymbolReader): EditorExtension {
    return (kit, _editor, model) => {
        let alive = true;
        const stopped = (): boolean => !alive;
        const provider: Monaco.languages.DocumentSymbolProvider = {
            displayName: 'headings',
            provideDocumentSymbols: async (asked, token) => {
                if (stopped() || asked !== model || kit.lsp.served.has(model)) return [];
                const version = model.getVersionId();
                const items = await read(model.getValue());
                if (
                    stopped() ||
                    token.isCancellationRequested ||
                    model.getVersionId() !== version
                ) {
                    return [];
                }
                return symbolsOf(headingTree(items, model.getLineCount()), kit.monaco, model);
            }
        };
        const register = (): Monaco.IDisposable =>
            kit.monaco.languages.registerDocumentSymbolProvider(model.getLanguageId(), provider);
        // Monaco has no event for a provider whose answer changed; registering it again makes the
        // sticky scroll and the path over the tab ask once more.
        let registered = register();
        let serving = kit.lsp.served.has(model);
        const watching = kit.lsp.served.onChange(() => {
            const now = kit.lsp.served.has(model);
            if (now === serving) return;
            serving = now;
            registered.dispose();
            registered = register();
        });
        return () => {
            alive = false;
            watching.dispose();
            registered.dispose();
        };
    };
}
