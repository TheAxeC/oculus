<script lang="ts">
    // Layer 3, primitive. The diff editor: Monaco's own, over two texts of one file, both sides
    // read-only, on the page's one load, theme and chord removal as the text editor (kit/load.ts),
    // with its actions listed for the palette as the text editor lists them. It takes values and
    // callbacks, and imports nothing of the state, the views or the shell; the values it takes and
    // hands back are types.ts's.
    //
    // It draws Monaco's diff: the two sides side by side or one inline, as the parent's layout
    // says (never switched to inline by the width), the line numbers of both, the changed words of
    // a changed line, whitespace changes shown, and the unchanged runs hidden with `context` lines
    // kept each side, which Monaco reveals on a press, unless the parent asks for every line.
    // Monaco's own hunk menu and revert arrows are off, since the parent's bars (zones.ts, above
    // lines of the modified side) carry the actions, and the diff always runs to its end, so a bar
    // never acts on a diff Monaco cut short.
    //
    // It answers its line changes after each diff, the selections of both sides on every move, and
    // its view state (the runs revealed and the scroll) as it changes, and restores a view state
    // handed in once the first diff is drawn, since Monaco ignores one restored before. Asked to,
    // it grows to its content's height, for a list of files the page scrolls; else it fills its
    // box. A text handed in again replaces its model's, the view state carried over the new diff.
    //
    // Until Monaco has loaded the modified text is a plain block, which the unit suite's server
    // render draws too.

    import { onDestroy, untrack, type Snippet } from 'svelte';
    import type * as Monaco from 'monaco-editor';
    import { modelUri, type EditorKit } from './kit/load';
    import { buildWhenHosted } from './kit/built.svelte';
    import { shikiId } from './kit/grammars';
    import { font, repaint, token } from './kit/look';
    import { chordActions } from './chords';
    import { lineBars } from './zones';
    import LineBars from './LineBars.svelte';
    import type {
        DiffCommand,
        DiffLineChange,
        DiffSelection,
        DiffSelections,
        EditorAction,
        EditorBar
    } from './types';

    type Props = {
        original: string;
        modified: string;
        /** Oculus's name for the language, which kit/grammars.ts answers the Shiki id of. */
        language: string;
        /** A name unique to the tab instance and the file, which names the two models. */
        model: string;
        /** The file's path on the modified side, which names its model and labels the editor. */
        path: string;
        /** The file's path on the original side, the modified side's when it was not renamed. */
        originalPath?: string;
        /** Side by side, or one column. */
        mode: 'side' | 'inline';
        /** The unchanged lines kept each side of a change when Monaco hides the run between. */
        context: number;
        /** Whether to hide the unchanged runs; off shows every line. */
        hideUnchanged?: boolean;
        /** A value that changes whenever the tokens or the text size do. */
        look?: string;
        /** Whether to grow to the content's height rather than fill the box. */
        sized?: boolean;
        /** A view state kept from before, restored once the first diff is drawn. */
        view?: object | null;
        bars?: EditorBar[];
        bar?: Snippet<[string]>;
        onchanges?: (changes: DiffLineChange[]) => void;
        onselect?: (selections: DiffSelections) => void;
        onview?: (view: object) => void;
        onactions?: (actions: EditorAction[]) => void;
    };

    let {
        original,
        modified,
        language,
        model: name,
        path,
        originalPath,
        mode,
        context,
        hideUnchanged = true,
        look = '',
        sized = false,
        view = null,
        bars = [],
        bar,
        onchanges,
        onselect,
        onview,
        onactions
    }: Props = $props();

    /** A hidden run is at least one line: Monaco hides any run the kept lines leave. */
    const SHORTEST_HIDDEN = 1;

    let host: HTMLDivElement | undefined = $state();
    let kit: EditorKit | null = $state.raw(null);
    let diff: Monaco.editor.IStandaloneDiffEditor | null = $state.raw(null);
    let models: { original: Monaco.editor.ITextModel; modified: Monaco.editor.ITextModel } | null =
        $state.raw(null);
    let mounted = $state(false);
    let height = $state(0);
    let alive = true;
    let painted: string | null = null;
    /** The view state to put back after the next diff: the one handed in, then one carried over. */
    let restore: object | null = null;
    /** The side the reader last worked in, where a palette action runs. */
    let focused: Monaco.editor.ICodeEditor | null = null;
    let saving = 0;
    const listeners: Monaco.IDisposable[] = [];
    const placed = lineBars();

    buildWhenHosted(
        () => host,
        () => alive,
        build
    );

    function build(loaded: EditorKit, box: HTMLDivElement): void {
        const { monaco } = loaded;
        const made = monaco.editor.createDiffEditor(box, {
            automaticLayout: true,
            readOnly: true,
            originalEditable: false,
            renderSideBySide: mode === 'side',
            useInlineViewWhenSpaceIsLimited: false,
            ignoreTrimWhitespace: false,
            renderGutterMenu: false,
            renderMarginRevertIcon: false,
            maxComputationTime: 0,
            hideUnchangedRegions: {
                enabled: hideUnchanged,
                contextLineCount: context,
                minimumLineCount: SHORTEST_HIDDEN
            },
            contextmenu: true,
            ariaLabel: path,
            scrollBeyondLastLine: !sized,
            scrollbar: { alwaysConsumeMouseWheel: !sized },
            ...font(host)
        });
        const pair = {
            original: fresh(loaded, originalPath ?? path, 'original', original),
            modified: fresh(loaded, path, 'modified', modified)
        };
        made.setModel(pair);
        const sides = [made.getOriginalEditor(), made.getModifiedEditor()];
        restore = view;
        listeners.push(
            made.onDidUpdateDiff(() => updated(made)),
            ...sides.flatMap((side) => [
                side.onDidChangeCursorSelection(() => selected(made)),
                side.onDidFocusEditorText(() => (focused = side)),
                side.onDidContentSizeChange(() => grown(made)),
                side.onDidScrollChange(() => save(made))
            ])
        );
        placed.mount(
            made.getModifiedEditor(),
            made.getModifiedEditor().getOption(monaco.editor.EditorOption.lineHeight)
        );
        diff = made;
        models = pair;
        kit = loaded;
        mounted = true;
        painted = look;
        void loaded.paint(token);
        onactions?.(chordActions(made.getModifiedEditor(), loaded.mac));
        grown(made);
    }

    /** One side's model, on its own URI under the instance's name, holding its text. */
    function fresh(
        loaded: EditorKit,
        file: string,
        side: 'original' | 'modified',
        text: string
    ): Monaco.editor.ITextModel {
        const uri = modelUri(loaded.monaco, `${name}:${side}`, file);
        loaded.monaco.editor.getModel(uri)?.dispose();
        return loaded.monaco.editor.createModel(text, shikiId(language), uri);
    }

    /** A diff drawn: its line changes said, and a view state waiting put back. */
    function updated(made: Monaco.editor.IStandaloneDiffEditor): void {
        const changes = made.getLineChanges();
        if (changes === null) return;
        if (restore !== null) {
            made.restoreViewState(restore as Monaco.editor.IDiffEditorViewState);
            restore = null;
        }
        onchanges?.(
            changes.map((change) => ({
                originalStartLineNumber: change.originalStartLineNumber,
                originalEndLineNumber: change.originalEndLineNumber,
                modifiedStartLineNumber: change.modifiedStartLineNumber,
                modifiedEndLineNumber: change.modifiedEndLineNumber
            }))
        );
    }

    function selections(side: Monaco.editor.ICodeEditor): DiffSelection[] {
        return (side.getSelections() ?? []).map((one) => ({
            startLineNumber: one.selectionStartLineNumber,
            startColumn: one.selectionStartColumn,
            endLineNumber: one.positionLineNumber,
            endColumn: one.positionColumn
        }));
    }

    function selected(made: Monaco.editor.IStandaloneDiffEditor): void {
        onselect?.({
            original: selections(made.getOriginalEditor()),
            modified: selections(made.getModifiedEditor())
        });
    }

    /** The content's height, which a sized editor takes, and the view state, which it moved. */
    function grown(made: Monaco.editor.IStandaloneDiffEditor): void {
        if (sized) {
            const sides = [made.getModifiedEditor()];
            if (mode === 'side') sides.push(made.getOriginalEditor());
            height = Math.max(...sides.map((side) => side.getContentHeight()));
        }
        save(made);
    }

    /** Say the view state once per frame, however many moves the frame held. */
    function save(made: Monaco.editor.IStandaloneDiffEditor): void {
        if (saving !== 0) return;
        saving = requestAnimationFrame(() => {
            saving = 0;
            const state = made.saveViewState();
            if (alive && state !== null) onview?.(state);
        });
    }

    // A text handed in that a model does not hold replaces it; the view state is carried over to
    // the diff Monaco draws for it.
    $effect(() => {
        const held = models;
        const made = diff;
        const texts = { original, modified };
        if (held === null || made === null) return;
        untrack(() => {
            if (
                held.original.getValue() === texts.original &&
                held.modified.getValue() === texts.modified
            ) {
                return;
            }
            restore = made.saveViewState();
            held.original.setValue(texts.original);
            held.modified.setValue(texts.modified);
        });
    });

    $effect(() => {
        const held = models;
        const id = shikiId(language);
        if (held === null || kit === null) return;
        for (const one of [held.original, held.modified]) {
            if (one.getLanguageId() !== id) kit.monaco.editor.setModelLanguage(one, id);
        }
    });

    $effect(() => {
        const enabled = hideUnchanged;
        const made = diff;
        if (made === null) return;
        made.updateOptions({ hideUnchangedRegions: { enabled } });
    });

    $effect(() => {
        const side = mode === 'side';
        const made = diff;
        if (made === null) return;
        made.updateOptions({ renderSideBySide: side });
        untrack(() => grown(made));
    });

    $effect(() => {
        const wanted = look;
        const loaded = kit;
        const made = diff;
        if (loaded === null || made === null || wanted === painted) return;
        return repaint(loaded, made, host, () => (painted = wanted));
    });

    /** Do what the parent asks: run a palette action where the reader last was, or show a line. */
    export function perform(command: DiffCommand): void {
        const made = diff;
        if (made === null) return;
        const side = focused ?? made.getModifiedEditor();
        if (command.kind === 'action') {
            side.focus();
            void side.getAction(command.id)?.run();
            return;
        }
        const target = made.getModifiedEditor();
        const line = Math.max(1, command.line);
        target.setPosition({ lineNumber: line, column: 1 });
        target.revealLineInCenterIfOutsideViewport(line);
    }

    onDestroy(() => {
        alive = false;
        if (saving !== 0) cancelAnimationFrame(saving);
        const made = diff;
        const state = made?.saveViewState() ?? null;
        if (state !== null) onview?.(state);
        for (const listener of listeners.splice(0)) listener.dispose();
        placed.unmount();
        made?.dispose();
        models?.original.dispose();
        models?.modified.dispose();
        diff = null;
    });
</script>

<div
    class="diff-editor"
    class:sized
    data-diff-editor={path}
    data-diff-mode={mode}
    style:height={sized && mounted ? `${String(height)}px` : undefined}
>
    <div class="monaco" bind:this={host}></div>
    {#if !mounted}
        <pre class="plain">{modified}</pre>
    {/if}
    {#if bar !== undefined}
        <LineBars {bars} {bar} {placed} />
    {/if}
</div>

<style>
    .diff-editor {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;
        font-size: var(--fs-sm);
    }

    .diff-editor.sized {
        height: auto;
    }

    .monaco {
        position: absolute;
        inset: 0;
    }

    .plain {
        box-sizing: border-box;
        margin: 0;
        overflow: hidden;
        padding: 0 0 0 8ch;
        background: var(--panel);
        color: var(--ink-txt, var(--ink));
        font-family: var(--font-mono);
        line-height: 1.45;
        white-space: pre;
    }

    .sized .plain {
        position: static;
    }

    .diff-editor:not(.sized) .plain {
        position: absolute;
        inset: 0;
    }

    :global(body.wall) .diff-editor {
        backdrop-filter: blur(var(--wall-blur));
    }

    :global(body.wall) .plain {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
    }

    :global(body.wall) .diff-editor :global(.monaco-editor),
    :global(body.wall) .diff-editor :global(.monaco-editor-background),
    :global(body.wall) .diff-editor :global(.monaco-editor .margin) {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
    }
</style>
