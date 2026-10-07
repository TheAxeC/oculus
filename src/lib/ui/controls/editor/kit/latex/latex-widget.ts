// Layer 3, primitive. LaTeX in the editor: the problems of a build as markers, the preview a
// pointer at rest shows over math and over a picture, and Format Document through a formatter the
// parent hands in. It is an EditorExtension (types.ts), added to a LaTeX model once Monaco has
// loaded and taken away with the model; kit/latex/latex.ts finds the spans and the picture files.
//
// The preview is a Monaco content widget below the position the pointer rests on, drawn after the
// pointer has stayed 300 ms on one span. Math is typeset by KaTeX with `trust: false`, so no
// command can emit a link or HTML, and a formula that does not parse is drawn as its source in the
// error colour. A picture is drawn through the address the parent gives for the file (the file
// route), never from the path in the text, and only once the browser has decoded it, so the box is
// sized around the drawn image; a picture that does not decode gives no preview. A PDF is drawn as
// its name. The widget is removed when the pointer leaves the span or the editor, when the text
// changes and when the editor scrolls, and an answer that arrives after that is dropped.
//
// A `\ref`-like command's label shows its number and the block of text it sits in (the formula,
// typeset, when the block is a math environment) with a link that shows the place in the PDF, and a
// `\usepackage` name shows a link to the package's documentation. The pointer on the preview keeps
// it so the links can be pressed.

import type * as Monaco from 'monaco-editor';
import { t } from '$lib/state/shared/words/text';
import { mathSpanAt, pictureAt, pictureFile, type MathSpan } from './latex';
import { packageAt, refAt } from './references';
import type { EditorExtension, EditorProblem } from '../../types';

/** How long the pointer rests on a span before its preview is drawn, in milliseconds. */
export const REST_MS = 300;

/** What a LaTeX model needs from its page. */
export type LatexEditorDeps = {
    problems: EditorProblem[];
    /** The folder, against the root, that a picture path in the text is resolved from. */
    folder: () => Promise<string>;
    /** Whether a file of the root exists. */
    exists: (path: string) => Promise<boolean>;
    /** The address the file route serves a file of the root at. */
    address: (path: string) => string;
    /** The text formatted, or the reason it was not. */
    format: (text: string) => Promise<{ text: string | null; error: string }>;
    /** Say a refusal where the reader sees it. */
    say: (words: string) => void;
    /** The number and the block of text of a label the root defines, or null when it has none. */
    label: (name: string) => Promise<LabelFacts | null>;
    /** Show where a label was typeset in the PDF. */
    viewOnPdf: (name: string) => void;
    /** Open the documentation of a package. */
    texdoc: (name: string) => void;
};

/** What the page knows of a label: the number its build gave it and the block it sits in. */
type LabelFacts = { number: string; text: string; math: boolean };

/** The owner Monaco files the build's markers under. */
const OWNER = 'oculus-latex';

/**
 * The widest a picture is drawn: the box's 480 px less its horizontal padding and border. A length
 * rather than a percentage, since the box takes its width from its content.
 */
const PICTURE_MAX_WIDTH = 458;

/** KaTeX's bounds on one formula: how far it may stretch (em) and how often macros may expand. */
const KATEX = { trust: false, strict: 'ignore', maxSize: 50, maxExpand: 1000 } as const;

/** The marker for a problem: the whole line it is on, or the first line when it names none. */
function markerOf(
    monaco: typeof Monaco,
    model: Monaco.editor.ITextModel,
    problem: EditorProblem
): Monaco.editor.IMarkerData {
    const line = Math.min(Math.max(1, problem.line), model.getLineCount());
    return {
        severity:
            problem.severity === 'error'
                ? monaco.MarkerSeverity.Error
                : monaco.MarkerSeverity.Warning,
        message: problem.message,
        source: 'latex',
        startLineNumber: line,
        startColumn: model.getLineFirstNonWhitespaceColumn(line) || 1,
        endLineNumber: line,
        endColumn: model.getLineMaxColumn(line)
    };
}

/** The box the preview is drawn in, with the page's tokens for its colours. */
function box(): HTMLDivElement {
    const node = document.createElement('div');
    node.className = 'oculus-latex-preview';
    node.style.cssText =
        'padding:6px 10px;border:1px solid var(--line);border-radius:var(--radius-sm);' +
        'background:var(--panel);color:var(--ink);max-width:480px;max-height:320px;overflow:auto';
    return node;
}

/** Draw a formula into a node: KaTeX's markup, or the source in the error colour. */
async function typeset(node: HTMLElement, span: MathSpan): Promise<void> {
    const [{ default: katex }] = await Promise.all([
        import('katex'),
        import('katex/dist/katex.min.css')
    ]);
    try {
        katex.render(span.source, node, {
            ...KATEX,
            displayMode: span.display,
            throwOnError: false
        });
    } catch {
        node.textContent = span.source;
        node.style.color = 'var(--c-red-txt)';
    }
}

/** A button in a preview that runs one of the page's calls. */
function action(words: string, run: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = words;
    button.style.cssText =
        'margin-top:6px;margin-right:8px;padding:0;border:0;background:none;cursor:pointer;' +
        'color:var(--link, var(--accent));text-decoration:underline;font:inherit';
    button.addEventListener('click', run);
    return button;
}

/** A paragraph of a preview. */
function line(words: string, mono = false): HTMLDivElement {
    const node = document.createElement('div');
    node.textContent = words;
    if (mono) node.style.cssText = 'white-space:pre;font-family:var(--font-mono)';
    return node;
}

/** The preview of a label a reference names: its number, its block and the jump to the PDF. */
async function referencePreview(
    name: string,
    start: number,
    end: number,
    deps: LatexEditorDeps
): Promise<Preview | null> {
    const facts = await deps.label(name);
    if (facts === null) return null;
    const node = box();
    if (facts.number !== '') node.append(line(t('latex.hover_ref_number', facts.number)));
    if (facts.math) {
        const formula = document.createElement('div');
        const span = mathSpanAt(facts.text, facts.text.indexOf('\\begin'));
        if (span !== null) await typeset(formula, span);
        else formula.textContent = facts.text;
        node.append(formula);
    } else {
        node.append(line(facts.text, true));
    }
    node.append(action(t('latex.hover_ref_pdf'), () => deps.viewOnPdf(name)));
    return { node, start, end };
}

/** The preview of a package: its name and the link to its documentation. */
function packagePreview(name: string, start: number, end: number, deps: LatexEditorDeps): Preview {
    const node = box();
    node.append(line(t('latex.hover_package', name)));
    node.append(action(t('latex.hover_package_docs'), () => deps.texdoc(name)));
    return { node, start, end };
}

/** A preview: the node to draw and the offsets of the text it is for. */
type Preview = { node: HTMLElement; start: number; end: number };

/** The preview of the span or picture a position rests on, or null when it rests on neither. */
async function previewOf(
    text: string,
    offset: number,
    deps: LatexEditorDeps
): Promise<Preview | null> {
    const math = mathSpanAt(text, offset);
    if (math !== null) {
        const node = box();
        await typeset(node, math);
        return { node, start: math.start, end: math.end };
    }
    const ref = refAt(text, offset);
    if (ref !== null) return referencePreview(ref.name, ref.start, ref.end, deps);
    const used = packageAt(text, offset);
    if (used !== null) return packagePreview(used.name, used.start, used.end, deps);
    const call = pictureAt(text, offset);
    if (call === null) return null;
    const file = await pictureFile(call.path, await deps.folder(), deps.exists);
    if (file === null) return null;
    const node = box();
    if (file.toLowerCase().endsWith('.pdf')) {
        node.textContent = file.split('/').at(-1) ?? file;
    } else {
        const picture = document.createElement('img');
        picture.src = deps.address(file);
        picture.alt = file;
        picture.style.cssText = `display:block;max-width:${PICTURE_MAX_WIDTH}px;max-height:300px`;
        try {
            await picture.decode();
        } catch {
            return null;
        }
        node.append(picture);
    }
    return { node, start: call.start, end: call.end };
}

/** The pointer-at-rest preview on one editor: its listeners, and the call that takes them away. */
function previewing(
    monaco: typeof Monaco,
    editor: Monaco.editor.IStandaloneCodeEditor,
    model: Monaco.editor.ITextModel,
    deps: LatexEditorDeps
): () => void {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let widget: Monaco.editor.IContentWidget | null = null;
    /** Moves on every hide, so an answer that was asked before it is dropped. */
    let turn = 0;
    /** The offsets of the span or call the widget is for, so a move inside it keeps the widget. */
    let held: { start: number; end: number } | null = null;

    function hide(): void {
        turn += 1;
        clearTimeout(timer);
        held = null;
        if (widget !== null) editor.removeContentWidget(widget);
        widget = null;
    }

    async function show(offset: number, position: Monaco.IPosition): Promise<void> {
        const mine = turn;
        const text = model.getValue();
        const preview = await previewOf(text, offset, deps).catch(() => null);
        if (preview === null || mine !== turn) return;
        const { node } = preview;
        held = { start: preview.start, end: preview.end };
        widget = {
            getId: () => 'oculus.latex.preview',
            getDomNode: () => node,
            getPosition: () => ({
                position,
                preference: [
                    monaco.editor.ContentWidgetPositionPreference.BELOW,
                    monaco.editor.ContentWidgetPositionPreference.ABOVE
                ]
            })
        };
        editor.addContentWidget(widget);
    }

    function moved(event: Monaco.editor.IEditorMouseEvent): void {
        const position = event.target.position;
        // A pointer on the preview itself keeps it, so its links can be pressed.
        if (event.target.type === monaco.editor.MouseTargetType.CONTENT_WIDGET) return;
        const onText = event.target.type === monaco.editor.MouseTargetType.CONTENT_TEXT;
        if (position === null || !onText) {
            hide();
            return;
        }
        const offset = model.getOffsetAt(position);
        if (held !== null && offset >= held.start && offset <= held.end) return;
        hide();
        timer = setTimeout(() => void show(offset, position), REST_MS);
    }

    const listeners = [
        editor.onMouseMove(moved),
        editor.onMouseLeave(hide),
        editor.onDidScrollChange(hide),
        editor.onDidChangeModelContent(hide),
        editor.onKeyDown(hide)
    ];
    return () => {
        hide();
        for (const listener of listeners) listener.dispose();
    };
}

/** The LaTeX additions of one model, given the page's calls. */
export function latexExtension(deps: LatexEditorDeps): EditorExtension {
    return (kit, editor, model) => {
        const { monaco } = kit;
        monaco.editor.setModelMarkers(
            model,
            OWNER,
            deps.problems.map((problem) => markerOf(monaco, model, problem))
        );
        // Format Document is Monaco's own action once a formatter is registered for the language;
        // the page's formatting hands this model to the formatter here, and its edit is one
        // undoable change.
        const unformat = kit.formatting.add(model, async (asked) => {
            const sent = asked.getValue();
            const done = await deps.format(sent);
            // A text typed into while the formatter ran is not replaced by the old one's.
            if (asked.getValue() !== sent) return [];
            if (done.text === null) {
                if (done.error !== '') deps.say(done.error);
                return [];
            }
            return [{ range: asked.getFullModelRange(), text: done.text }];
        });
        const stop = previewing(monaco, editor, model, deps);
        return () => {
            stop();
            unformat();
            monaco.editor.setModelMarkers(model, OWNER, []);
        };
    };
}
