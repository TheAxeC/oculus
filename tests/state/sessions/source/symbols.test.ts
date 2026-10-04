// Layer 2, client-state tests. The document symbols a source tab gives Monaco for sticky scroll and
// the outline: a tree of the headings of a Markdown or LaTeX text with their ranges, and the
// provider that answers for its own model only, waits for a LaTeX parser that has not loaded, and
// answers nothing for a text that was typed into meanwhile, a cancelled request or a tab that
// closed.
//
// What this does NOT cover: that Monaco's sticky scroll draws these symbols, which the look does.

import { describe, expect, it } from 'vitest';
import {
    createLatexReader,
    latexOutline,
    markdownOutline,
    type OutlineItem
} from '../../../../src/lib/state/sources/explorer/sections/outline.ts';
import {
    headingTree,
    symbolsExtension,
    type SymbolReader
} from '../../../../src/lib/views/sources/source/symbols.ts';

type Provider = {
    provideDocumentSymbols: (
        model: FakeModel,
        token: { isCancellationRequested: boolean }
    ) => Promise<Symbol[] | undefined> | Symbol[] | undefined;
};
type Symbol = {
    name: string;
    kind: number;
    range: { startLineNumber: number; endLineNumber: number };
    selectionRange: { startLineNumber: number; endLineNumber: number };
    children: Symbol[];
};
type FakeModel = ReturnType<typeof model>;

const LIVE = { isCancellationRequested: false };

/** A promise settled by hand. */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
    let resolve: (value: T) => void = () => undefined;
    const promise = new Promise<T>((done) => {
        resolve = done;
    });
    return { promise, resolve };
}

/** A model of a text: its lines, its version, and the length of each line. */
function model(initial: string, language: string) {
    let text = initial;
    let version = 1;
    return {
        getValue: () => text,
        getVersionId: () => version,
        getLanguageId: () => language,
        getLineCount: () => text.split('\n').length,
        getLineMaxColumn: (line: number) => (text.split('\n')[line - 1] ?? '').length + 1,
        type: (next: string) => {
            text = next;
            version += 1;
        }
    };
}

/** A Monaco that records the symbol providers registered and the ones disposed. */
function kit() {
    const registered: { language: string; provider: Provider; disposed: boolean }[] = [];
    const monaco = {
        languages: {
            SymbolKind: { String: 14 },
            registerDocumentSymbolProvider: (language: string, provider: Provider) => {
                const entry = { language, provider, disposed: false };
                registered.push(entry);
                return {
                    dispose: () => {
                        entry.disposed = true;
                    }
                };
            }
        }
    };
    return { registered, kit: { monaco } as never };
}

/** The symbols as `name:start-end`, with children in brackets, for a short comparison. */
function shape(symbols: Symbol[] | undefined): string[] {
    return (symbols ?? []).map(
        (one) =>
            `${one.name}:${String(one.range.startLineNumber)}-${String(one.range.endLineNumber)}` +
            (one.children.length > 0 ? `[${shape(one.children).join(',')}]` : '')
    );
}

/** A heading tree as `name:start-end`, with children in brackets. */
function treeShape(tree: ReturnType<typeof headingTree>): string[] {
    return tree.map(
        (one) =>
            `${one.name}:${String(one.start)}-${String(one.end)}` +
            (one.children.length > 0 ? `[${treeShape(one.children).join(',')}]` : '')
    );
}

/** The extension on a model, and its dispose. */
function attach(read: SymbolReader, on: FakeModel) {
    const { registered, kit: given } = kit();
    const stop = symbolsExtension(read)(given, {} as never, on as never);
    return { registered, stop, provider: registered[0].provider };
}

const MARKDOWN = '# A\n## B\n## C\n# D';

describe('the heading tree', () => {
    // Red when a range runs to the next heading of any level, or the last heading stops early.
    it.each([
        ['headings of two levels', markdownOutline(MARKDOWN), 4, ['A:1-3[B:2-2,C:3-3]', 'D:4-4']],
        [
            'a skipped level, which nests one step',
            [
                { title: 'A', line: 1, level: 1, depth: 0 },
                { title: 'C', line: 3, level: 3, depth: 1 },
                { title: 'B', line: 6, level: 2, depth: 1 }
            ],
            9,
            ['A:1-9[C:3-5,B:6-9]']
        ],
        ['no headings', [], 3, []]
    ] as [string, OutlineItem[], number, string[]][])(
        'ranges %s',
        (_name, items, lines, ranges) => {
            expect(treeShape(headingTree(items, lines))).toEqual(ranges);
        }
    );
});

describe('the provider', () => {
    const TEX = '\\section{A}\n\\subsection{B}';

    it('is registered for its model s language and answers its headings', async () => {
        const own = model(MARKDOWN, 'markdown');
        const { registered, provider } = attach((text) => markdownOutline(text), own);
        expect(registered.map((one) => one.language)).toEqual(['markdown']);
        const symbols = await provider.provideDocumentSymbols(own, LIVE);
        expect(shape(symbols)).toEqual(['A:1-3[B:2-2,C:3-3]', 'D:4-4']);
        expect(symbols?.[0].selectionRange.startLineNumber).toBe(1);
    });

    // Red when the first request on a freshly opened file answers none while the parser loads:
    // sticky scroll would stay empty until the next edit.
    it('answers once the LaTeX parser has loaded', async () => {
        const own = model(TEX, 'latex');
        const gate = deferred<undefined>();
        const reader = createLatexReader();
        const { provider } = attach(async (text) => {
            await gate.promise;
            return latexOutline(reader, text);
        }, own);
        const asked = provider.provideDocumentSymbols(own, LIVE);
        gate.resolve(undefined);
        expect(shape((await asked) ?? [])).toEqual(['A:1-2[B:2-2]']);
    });

    // Red when a second editor of the language gets the first one's headings, or a stale, cancelled
    // or closed request answers.
    it.each([
        [
            'another model of the language',
            () => {
                const { provider } = attach(
                    (text) => markdownOutline(text),
                    model(MARKDOWN, 'markdown')
                );
                return provider.provideDocumentSymbols(model('# Other', 'markdown'), LIVE);
            }
        ],
        [
            'a tab that closed, whose provider is taken away',
            () => {
                const own = model(MARKDOWN, 'markdown');
                const { registered, provider, stop } = attach((text) => markdownOutline(text), own);
                stop();
                expect(registered[0].disposed).toBe(true);
                return provider.provideDocumentSymbols(own, LIVE);
            }
        ],
        [
            'a text typed into while the request waited',
            () => {
                const own = model(TEX, 'latex');
                const gate = deferred<OutlineItem[]>();
                const { provider } = attach(() => gate.promise, own);
                const stale = provider.provideDocumentSymbols(own, LIVE);
                own.type('\\section{C}');
                gate.resolve([{ title: 'A', line: 1, level: 1, depth: 0 }]);
                return stale;
            }
        ],
        [
            'a request Monaco cancelled',
            () => {
                const own = model(TEX, 'latex');
                const token = { isCancellationRequested: false };
                const { provider } = attach(
                    () => [{ title: 'A', line: 1, level: 1, depth: 0 }],
                    own
                );
                const cancelled = provider.provideDocumentSymbols(own, token);
                token.isCancellationRequested = true;
                return cancelled;
            }
        ],
        [
            'a tab that closed while the request waited',
            () => {
                const own = model(TEX, 'latex');
                const gate = deferred<OutlineItem[]>();
                const { provider, stop } = attach(() => gate.promise, own);
                const late = provider.provideDocumentSymbols(own, LIVE);
                stop();
                gate.resolve([{ title: 'A', line: 1, level: 1, depth: 0 }]);
                return late;
            }
        ]
    ])('answers nothing for %s', async (_name, ask) => {
        expect(await ask()).toEqual([]);
    });
});
