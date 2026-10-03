// The LaTeX additions of a model, over a fake Monaco: the markers of a build's problems, the
// formatter Format Document runs, and the preview a pointer at rest brings up over math and over a
// picture, with the moments it goes away. The editor, the model and Monaco's namespace are
// recording fakes and the DOM is a bare element, since the node environment has none; KaTeX is
// replaced by a recorder, so what is asserted is what it was handed and not the markup it draws.
//
// What this does NOT cover: KaTeX's markup, Monaco's own hover and the widget's place on screen,
// which need a browser.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    REST_MS,
    latexExtension,
    type LatexEditorDeps
} from '../../../../../src/lib/ui/controls/editor/kit/latex-widget.ts';
import {
    createFormatting,
    type EditorKit
} from '../../../../../src/lib/ui/controls/editor/kit/load.ts';

const render = vi.fn();
vi.mock('katex', () => ({
    default: {
        render: (...args: unknown[]): void => {
            render(...args);
        }
    }
}));
vi.mock('katex/dist/katex.min.css', () => ({}));

/** A bare element: what the widget sets on its nodes, recorded. */
type Node = {
    className: string;
    style: { cssText: string; color: string };
    textContent: string;
    children: Node[];
    src: string;
    alt: string;
    append: (child: Node) => void;
};

function element(): Node {
    const node: Node = {
        className: '',
        style: { cssText: '', color: '' },
        textContent: '',
        children: [],
        src: '',
        alt: '',
        append: (child) => node.children.push(child)
    };
    return node;
}

type Handler = (event?: unknown) => void;

/** The editor, the model and Monaco as the extension is handed them, with their calls recorded. */
function fakes(text: string) {
    const handlers: Record<string, Handler> = {};
    const on = (name: string) => (handler: Handler) => {
        handlers[name] = handler;
        return { dispose: vi.fn() };
    };
    const added: { getDomNode: () => Node; getPosition: () => unknown }[] = [];
    const removed: unknown[] = [];
    const editor = {
        onMouseMove: on('move'),
        onMouseLeave: on('leave'),
        onDidScrollChange: on('scroll'),
        onDidChangeModelContent: on('content'),
        onKeyDown: on('key'),
        addContentWidget: (widget: (typeof added)[number]) => added.push(widget),
        removeContentWidget: (widget: unknown) => removed.push(widget)
    };
    let current = text;
    const model = {
        getValue: () => current,
        setValue: (next: string) => {
            current = next;
        },
        getOffsetAt: (position: { lineNumber: number; column: number }) => {
            const lines = current.split('\n');
            let offset = 0;
            for (let at = 0; at < position.lineNumber - 1; at += 1) offset += lines[at].length + 1;
            return offset + position.column - 1;
        },
        getLineCount: () => current.split('\n').length,
        getLineFirstNonWhitespaceColumn: () => 1,
        getLineMaxColumn: (line: number) => current.split('\n')[line - 1].length + 1,
        getLanguageId: () => 'latex',
        getFullModelRange: () => ({ full: true })
    };
    const markers: unknown[][] = [];
    const providers: { provideDocumentFormattingEdits: (m: unknown) => Promise<unknown[]> }[] = [];
    const disposed = vi.fn();
    const monaco = {
        MarkerSeverity: { Error: 8, Warning: 4 },
        editor: {
            setModelMarkers: (_model: unknown, _owner: string, list: unknown[]) =>
                markers.push(list),
            ContentWidgetPositionPreference: { ABOVE: 1, BELOW: 2 },
            MouseTargetType: { CONTENT_TEXT: 6 }
        },
        languages: {
            registerDocumentFormattingEditProvider: (_language: string, provider: never) => {
                providers.push(provider);
                return { dispose: disposed };
            }
        }
    };
    const kit = {
        monaco,
        formatting: createFormatting(monaco as never)
    } as unknown as EditorKit;
    return { handlers, added, removed, editor, model, markers, providers, disposed, kit };
}

function deps(over: Partial<LatexEditorDeps> = {}): LatexEditorDeps {
    return {
        problems: [],
        folder: () => Promise.resolve('ms'),
        exists: () => Promise.resolve(false),
        address: (path) => `/api/file/hub/${path}`,
        format: () => Promise.resolve({ text: null, error: '' }),
        say: vi.fn(),
        ...over
    };
}

/** Add the extension to the fakes. */
function add(f: ReturnType<typeof fakes>, d: LatexEditorDeps): () => void {
    return latexExtension(d)(f.kit, f.editor as never, f.model as never);
}

/** The mouse event for a pointer over a text position. */
const over = (lineNumber: number, column: number) => ({
    target: { type: 6, position: { lineNumber, column } }
});

/** Let the timers and the answers that follow them land. */
async function rest(): Promise<void> {
    await vi.advanceTimersByTimeAsync(REST_MS);
    for (let turn = 0; turn < 10; turn += 1) await Promise.resolve();
}

beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('document', { createElement: element });
    render.mockReset();
});

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe('the markers of a build', () => {
    // Revert: leave `setModelMarkers` out of latexExtension in kit/latex-widget.ts.
    it('draws each problem on its line, errors and warnings apart, and clears them with the model', () => {
        const f = fakes('a\nbb\nccc');

        const stop = add(
            f,
            deps({
                problems: [
                    { line: 2, severity: 'error', message: 'Missing $ inserted.' },
                    { line: 3, severity: 'warning', message: 'LaTeX: x.' },
                    { line: 99, severity: 'error', message: 'past the end' }
                ]
            })
        );

        expect(f.markers[0]).toEqual([
            expect.objectContaining({
                severity: 8,
                startLineNumber: 2,
                endLineNumber: 2,
                endColumn: 3,
                message: 'Missing $ inserted.'
            }),
            expect.objectContaining({ severity: 4, startLineNumber: 3, endColumn: 4 }),
            expect.objectContaining({ severity: 8, startLineNumber: 3, message: 'past the end' })
        ]);
        stop();
        expect(f.markers.at(-1)).toEqual([]);
    });
});

describe('Format Document', () => {
    it('answers one edit over the whole text with the formatted text', async () => {
        const f = fakes('a\n');
        add(f, deps({ format: () => Promise.resolve({ text: '  a\n', error: '' }) }));

        const edits = await f.providers[0].provideDocumentFormattingEdits(f.model);

        expect(edits).toEqual([{ range: { full: true }, text: '  a\n' }]);
    });

    it('answers no edit and says the reason when the program refused', async () => {
        const f = fakes('a\n');
        const d = deps({ format: () => Promise.resolve({ text: null, error: 'error: x' }) });
        add(f, d);

        expect(await f.providers[0].provideDocumentFormattingEdits(f.model)).toEqual([]);
        expect(d.say).toHaveBeenCalledExactlyOnceWith('error: x');
    });

    it('answers no edit for another model, and for a text typed into while the program ran', async () => {
        const f = fakes('a\n');
        const d = deps({
            format: () => {
                f.model.setValue('typed\n');
                return Promise.resolve({ text: '  a\n', error: '' });
            }
        });
        add(f, d);

        expect(await f.providers[0].provideDocumentFormattingEdits({ other: true })).toEqual([]);
        expect(await f.providers[0].provideDocumentFormattingEdits(f.model)).toEqual([]);
    });

    it('takes the formatter away with the model', () => {
        const f = fakes('a');
        const stop = add(f, deps());

        stop();

        expect(f.disposed).toHaveBeenCalledOnce();
    });

    // Revert: register a provider for each model in latexExtension, so the others answer [].
    it('registers one provider for two mounted models, each formatted by its own formatter', async () => {
        const first = fakes('first\n');
        const second = fakes('second\n');
        const formatFirst = vi.fn(() => Promise.resolve({ text: 'FIRST\n', error: '' }));
        const formatSecond = vi.fn(() => Promise.resolve({ text: 'SECOND\n', error: '' }));
        add(first, deps({ format: formatFirst }));
        latexExtension(deps({ format: formatSecond }))(
            first.kit,
            second.editor as never,
            second.model as never
        );

        const editsOfFirst = await first.providers[0].provideDocumentFormattingEdits(first.model);
        const editsOfSecond = await first.providers[0].provideDocumentFormattingEdits(second.model);

        expect(first.providers).toHaveLength(1);
        expect(formatFirst).toHaveBeenCalledExactlyOnceWith('first\n');
        expect(formatSecond).toHaveBeenCalledExactlyOnceWith('second\n');
        expect(editsOfFirst).toEqual([{ range: { full: true }, text: 'FIRST\n' }]);
        expect(editsOfSecond).toEqual([{ range: { full: true }, text: 'SECOND\n' }]);
    });

    // Revert: dispose the language's provider when any one model closes.
    it('keeps formatting the other model after one is closed, and drops the provider with the last', async () => {
        const first = fakes('first\n');
        const second = fakes('second\n');
        const stopFirst = add(
            first,
            deps({ format: () => Promise.resolve({ text: 'A', error: '' }) })
        );
        const stopSecond = latexExtension(
            deps({ format: () => Promise.resolve({ text: 'B', error: '' }) })
        )(first.kit, second.editor as never, second.model as never);

        stopFirst();

        expect(first.disposed).not.toHaveBeenCalled();
        expect(await first.providers[0].provideDocumentFormattingEdits(second.model)).toEqual([
            { range: { full: true }, text: 'B' }
        ]);
        expect(await first.providers[0].provideDocumentFormattingEdits(first.model)).toEqual([]);
        stopSecond();
        expect(first.disposed).toHaveBeenCalledOnce();
    });
});

describe('the preview over math', () => {
    const TEXT = 'before\n$x^2$ and more\nafter';

    // Revert: draw the widget without waiting REST_MS in previewing of kit/latex-widget.ts.
    it('appears after the pointer has rested 300 ms on a formula, typeset with KaTeX untrusted', async () => {
        const f = fakes(TEXT);
        add(f, deps());

        f.handlers.move(over(2, 3));
        await vi.advanceTimersByTimeAsync(REST_MS - 1);
        expect(f.added).toHaveLength(0);
        await rest();

        expect(f.added).toHaveLength(1);
        expect(render).toHaveBeenCalledExactlyOnceWith(
            'x^2',
            f.added[0].getDomNode(),
            expect.objectContaining({
                displayMode: false,
                throwOnError: false,
                trust: false,
                maxSize: 50,
                maxExpand: 1000
            })
        );
    });

    it('sets a display formula in display mode', async () => {
        const f = fakes('$$a=b$$');
        add(f, deps());

        f.handlers.move(over(1, 3));
        await rest();

        expect(render).toHaveBeenCalledWith(
            'a=b',
            expect.anything(),
            expect.objectContaining({ displayMode: true })
        );
    });

    // Revert: leave `editor.onMouseLeave(hide)` out of previewing in kit/latex-widget.ts.
    it('goes when the pointer leaves the editor, moves off the formula, the editor scrolls or the text changes', async () => {
        for (const away of [
            (f: ReturnType<typeof fakes>) => f.handlers.leave(),
            (f: ReturnType<typeof fakes>) => f.handlers.move(over(1, 2)),
            (f: ReturnType<typeof fakes>) => f.handlers.scroll(),
            (f: ReturnType<typeof fakes>) => f.handlers.content(),
            (f: ReturnType<typeof fakes>) => f.handlers.key()
        ]) {
            const f = fakes(TEXT);
            add(f, deps());
            f.handlers.move(over(2, 3));
            await rest();
            expect(f.added).toHaveLength(1);

            away(f);

            expect(f.removed).toEqual([f.added[0]]);
        }
    });

    it('stays while the pointer moves inside the same formula', async () => {
        const f = fakes(TEXT);
        add(f, deps());
        f.handlers.move(over(2, 2));
        await rest();

        f.handlers.move(over(2, 4));
        await rest();

        expect(f.added).toHaveLength(1);
        expect(f.removed).toEqual([]);
    });

    it('draws nothing for a pointer that leaves before the rest, or rests off any math', async () => {
        const f = fakes(TEXT);
        add(f, deps());

        f.handlers.move(over(2, 3));
        await vi.advanceTimersByTimeAsync(100);
        f.handlers.leave();
        await rest();
        f.handlers.move(over(1, 2));
        await rest();

        expect(f.added).toEqual([]);
    });

    // Revert: drop the `mine !== turn` check after the preview resolves in kit/latex-widget.ts.
    it('drops an answer that arrives after the pointer has gone', async () => {
        const f = fakes('\\includegraphics{fig/a}');
        let release: (found: boolean) => void = () => undefined;
        add(
            f,
            deps({
                exists: () =>
                    new Promise<boolean>((resolve) => {
                        release = resolve;
                    })
            })
        );
        f.handlers.move(over(1, 5));
        await rest();

        f.handlers.leave();
        release(true);
        await rest();

        expect(f.added).toEqual([]);
    });
});

describe('a preview whose answer is still out', () => {
    // Revert: drop the `mine !== turn` check after the preview resolves in kit/latex-widget.ts.
    it('draws the second span and not the first when the pointer moved on before the first answered', async () => {
        const f = fakes('\\includegraphics{fig/a}\n\\includegraphics{fig/b}');
        const pending: { path: string; release: (found: boolean) => void }[] = [];
        add(
            f,
            deps({
                exists: (path) =>
                    new Promise<boolean>((release) => {
                        pending.push({ path, release });
                    })
            })
        );
        f.handlers.move(over(1, 5));
        await rest();
        f.handlers.move(over(2, 5));
        await rest();

        for (const one of pending.filter((ask) => ask.path.includes('fig/a'))) one.release(true);
        await rest();
        expect(f.added).toEqual([]);
        for (const one of pending.filter((ask) => ask.path.includes('fig/b'))) one.release(true);
        await rest();

        expect(f.added).toHaveLength(1);
        const drawn = f.added[0].getDomNode();
        expect(`${drawn.textContent}${drawn.children.map((one) => one.src).join('')}`).toMatch(
            /b\.(pdf|png)|fig\/b/
        );
    });
});

describe('the preview over a picture', () => {
    it('shows the picture through the file route address, never the path in the text', async () => {
        const f = fakes('\\includegraphics[width=3cm]{fig/a}');
        add(f, deps({ exists: (path) => Promise.resolve(path === 'ms/fig/a.png') }));

        f.handlers.move(over(1, 10));
        await rest();

        const picture = f.added[0].getDomNode().children[0];
        expect(picture.src).toBe('/api/file/hub/ms/fig/a.png');
        expect(picture.src).not.toBe('fig/a');
    });

    it('shows a PDF as its name only', async () => {
        const f = fakes('\\includegraphics{fig/a}');
        add(f, deps({ exists: (path) => Promise.resolve(path.endsWith('.pdf')) }));

        f.handlers.move(over(1, 10));
        await rest();

        const node = f.added[0].getDomNode();
        expect(node.textContent).toBe('a.pdf');
        expect(node.children).toEqual([]);
    });

    it.each([
        ['leaves the root', '\\includegraphics{../../etc/x.png}'],
        ['is absolute', '\\includegraphics{/etc/x.png}'],
        ['names no file', '\\includegraphics{gone}']
    ])('shows nothing for a path that %s', async (_name, text) => {
        const f = fakes(text);
        add(f, deps({ exists: () => Promise.resolve(false) }));

        f.handlers.move(over(1, 10));
        await rest();

        expect(f.added).toEqual([]);
    });
});
