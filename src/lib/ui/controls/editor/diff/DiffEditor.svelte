<script lang="ts">
    // Layer 3, primitive. The diff editor: Monaco's own, over two texts of one file, both sides
    // read-only unless the parent makes the modified side editable (`editable`: the text typed
    // there is handed back to `oninput`), on the page's one load, theme and chord removal as the
    // text editor (kit/load.ts), with its actions listed for the palette as the text editor lists
    // them. It takes values and callbacks, and imports nothing of the state, the views or the
    // shell; the values it takes and hands back are types.ts's.
    //
    // It draws the diff of the two texts: git's line changes where the parent hands them
    // (`changes`), which the page's diff provider gives Monaco while the models hold those texts
    // (diff/git-provider.ts), else Monaco's own. The two sides are side by side or one inline, as
    // the parent's layout says, and inline whenever the editor is narrower than `NARROW` pixels, as
    // VS Code's is; in a narrower box still the gutters narrow, so the text keeps most of it
    // (diff/narrow.ts). The layout drawn is read off the diff editor, since the comment sides and
    // the sizing follow it. It shows the line numbers of both, the changed words of a changed line,
    // whitespace changes, and the unchanged runs hidden with `context` lines kept each side, which
    // Monaco reveals on a press, unless the parent asks for every line. The `options` (options.ts,
    // with no minimap) are put on both sides when it is made and again whenever they change.
    //
    // Monaco's own hunk menu and revert arrows are off, since the parent's bars (bars/zones.ts,
    // after lines of either side) carry the actions, and the diff always runs to its end, so a bar
    // never acts on a diff Monaco cut short.
    //
    // Given `oncomment`, each side it offers (both side by side, the modified side inline, where
    // Monaco draws removed lines as zones that take no decoration) shows a `+` on the hovered
    // line in its glyph margin, which stays drawn whether or not comments are offered, as
    // Monaco's default has it; a press on the `+`, or the action Add Comment on Line, which the
    // palette and the line's right-click menu list only while `oncomment` is there, asks the
    // parent for a comment on that line. Without it no `+` is drawn and no action is registered
    // or listed.
    //
    // It answers its line changes after each diff, the selections of both sides on every move, and
    // its view state (the runs revealed and the scroll) as it changes, and restores a view state
    // handed in once the first diff is drawn, since Monaco ignores one restored before. Asked to,
    // it grows to its content's height, for a list of files the page scrolls; else it fills its
    // box. A text handed in again replaces its model's, the view state carried over the new diff.
    //
    // What Monaco pops up over the text is drawn on the document body, so no list, split or float
    // clips it: the hover, the suggest list, the parameter hints and the rename box of both sides
    // on a node of this editor's, the right-click menu and the code action list on the page's node
    // (options.ts `pageWidgets`). A key typed in such a widget is dispatched again in the side that
    // owns it, and an ancestor of the box that scrolls closes the menu, the hover, the suggest list
    // and the parameter hints and places what stays open against the text again. The quick input
    // stays in the box, as Monaco scopes it.
    //
    // The parent's `extension` is added to the modified side's editor and model as the text editor
    // adds one (types.ts), and taken away with the editor or when another is given: a diff over the
    // working tree registers that model with the language server of its file through it.
    //
    // Until Monaco has loaded the modified text is a plain block, which the unit suite's server
    // render draws too.

    import { onDestroy, untrack, type Snippet } from 'svelte';
    import type * as Monaco from 'monaco-editor';
    import type { EditorKit } from '../kit/load';
    import { buildWhenHosted } from '../kit/built.svelte';
    import { shikiId } from '../kit/languages/grammars';
    import { font, paintCode, repaint } from '../kit/look';
    import { chordActions } from '../chords';
    import {
        commentActionsOn,
        commentGutter,
        commentSides,
        listedWithComment
    } from '../gutter/gutter';
    import { applyOptions, monacoOptions } from '../options';
    import type { EditorOptions, Widgets } from '../options';
    import { lineBars } from '../bars/zones';
    import LineBars from '../bars/LineBars.svelte';
    import type {
        DiffCommand,
        DiffLineChange,
        DiffSelections,
        DiffSide,
        EditorAction,
        EditorBar,
        EditorExtension
    } from '../types';
    import { holdChanges, sideModel } from './models';
    import {
        bothSelections,
        contentHeight,
        layoutWatch,
        lineChangesOf,
        type DiffLayout
    } from './read';
    import { NARROW, narrowWatch } from './narrow';
    import './comment-add.css';
    import '../kit/theme/wall.css';

    type Props = {
        original: string;
        modified: string;
        /**
         * Oculus's name for the language, which kit/languages/grammars.ts answers the Shiki id of.
         */
        language: string;
        /** A name unique to the tab instance and the file, which names the two models. */
        model: string;
        /** The file's path on the modified side, which names its model and labels the editor. */
        path: string;
        /** The file's path on the original side, the modified side's when it was not renamed. */
        originalPath?: string;
        /** Git's line changes between the two texts; absent, the diff is Monaco's own. */
        changes?: DiffLineChange[];
        /** Side by side, or one column. */
        mode: 'side' | 'inline';
        /** The unchanged lines kept each side of a change when Monaco hides the run between. */
        context: number;
        /** Word wrap, rulers, whitespace and sticky scroll; Monaco's own when absent. */
        options?: EditorOptions;
        /** Whether to hide the unchanged runs; off shows every line. */
        hideUnchanged?: boolean;
        /** Whether the modified side can be typed into; the original side never can. */
        editable?: boolean;
        /** The modified side's text each time the reader changes it. */
        oninput?: (text: string) => void;
        /** A value that changes with the tokens, the text size and every pick of a code theme. */
        look?: string;
        /** The code theme the syntax is coloured with: `tokens`, or the id of a Shiki theme. */
        codeTheme?: string;
        /** Whether to grow to the content's height rather than fill the box. */
        sized?: boolean;
        /** A view state kept from before, restored once the first diff is drawn. */
        view?: object | null;
        bars?: EditorBar[];
        bar?: Snippet<[string]>;
        /**
         * Asks for a comment on a line of a side; the editor offers comments only while it is set.
         */
        oncomment?: (side: DiffSide, line: number) => void;
        /** The label of the Add Comment on Line action, already translated by the view. */
        commentLabel?: string;
        onchanges?: (changes: DiffLineChange[]) => void;
        onselect?: (selections: DiffSelections) => void;
        onview?: (view: object) => void;
        onactions?: (actions: EditorAction[]) => void;
        /**
         * What the modified side's editor and model are given beyond the diff, as a text editor's.
         */
        extension?: EditorExtension;
    };

    let {
        original,
        modified,
        language,
        model: name,
        path,
        originalPath,
        changes,
        mode,
        context,
        hideUnchanged = true,
        editable = false,
        oninput,
        options,
        look = '',
        codeTheme = 'tokens',
        sized = false,
        view = null,
        bars = [],
        bar,
        oncomment,
        commentLabel,
        onchanges,
        onselect,
        onview,
        onactions,
        extension
    }: Props = $props();

    /** A hidden run is at least one line: Monaco hides any run the kept lines leave. */
    const SHORTEST_HIDDEN = 1;

    let host: HTMLDivElement | undefined = $state();
    let kit: EditorKit | null = $state.raw(null);
    let diff: Monaco.editor.IStandaloneDiffEditor | null = $state.raw(null);
    let models: { original: Monaco.editor.ITextModel; modified: Monaco.editor.ITextModel } | null =
        $state.raw(null);
    let mounted = $state(false);
    /** The layout Monaco draws, which is inline whenever the width is narrow. */
    let drawn: DiffLayout = $state('side');
    let height = $state(0);
    let alive = true;
    let painted: string | null = null;
    /** What the paint depends on besides the tokens: the look and the code theme. */
    const painting = $derived(JSON.stringify([look, codeTheme]));
    /** The view state to put back after the next diff: the one handed in, then one carried over. */
    let restore: object | null = null;
    /** The side the reader last worked in, where a palette action runs. */
    let focused: Monaco.editor.ICodeEditor | null = null;
    let saving = 0;
    /** Whether the text is being replaced from the parent, which is not the reader typing. */
    let replacing = false;
    const listeners: Monaco.IDisposable[] = [];
    /** The widgets of both sides, drawn on a node on the body. */
    let widgets: Widgets | null = null;
    const placed = lineBars();
    const placedOriginal = lineBars();
    /** Whether comments are offered, which turns the comment gutter and its action on and off. */
    const offering = $derived(oncomment !== undefined);
    /** The bars of each side, each side's placed in its own editor. */
    const modifiedBars = $derived(bars.filter((one) => one.side !== 'original'));
    const originalBars = $derived(bars.filter((one) => one.side === 'original'));

    buildWhenHosted(
        () => host,
        () => alive,
        build
    );

    function build(loaded: EditorKit, box: HTMLDivElement): void {
        const { monaco } = loaded;
        widgets = loaded.widgets.of(box);
        const made = monaco.editor.createDiffEditor(box, {
            automaticLayout: true,
            readOnly: !editable,
            originalEditable: false,
            renderSideBySide: mode === 'side',
            useInlineViewWhenSpaceIsLimited: true,
            renderSideBySideInlineBreakpoint: NARROW,
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
            ...widgets.options,
            ...(options === undefined ? {} : monacoOptions(options)),
            ...font(host)
        });
        widgets.tie([made.getOriginalEditor(), made.getModifiedEditor()]);
        const pair = {
            original: sideModel(loaded, name, language, originalPath ?? path, 'original', original),
            modified: sideModel(loaded, name, language, path, 'modified', modified)
        };
        holdChanges(loaded, pair.modified, { original, modified, changes });
        made.setModel(pair);
        const sides = [made.getOriginalEditor(), made.getModifiedEditor()];
        restore = view;
        listeners.push(
            made.onDidUpdateDiff(() => updated(made)),
            pair.modified.onDidChangeContent(() => {
                if (!replacing) oninput?.(pair.modified.getValue());
            }),
            ...sides.flatMap((side) => [
                side.onDidChangeCursorSelection(() => onselect?.(bothSelections(made))),
                side.onDidFocusEditorText(() => (focused = side)),
                side.onDidContentSizeChange(() => grown(made)),
                side.onDidScrollChange(() => save(made))
            ])
        );
        for (const [on, side] of [
            [made.getModifiedEditor(), placed],
            [made.getOriginalEditor(), placedOriginal]
        ] as const) {
            side.mount(on, on.getOption(monaco.editor.EditorOption.lineHeight));
        }
        listeners.push(
            layoutWatch(box, (layout) => (drawn = layout)),
            narrowWatch(box, made)
        );
        diff = made;
        models = pair;
        kit = loaded;
        mounted = true;
        painted = painting;
        void paintCode(loaded, codeTheme, () => (painted = null));
        grown(made);
    }

    /** A diff drawn: its line changes said, and a view state waiting put back. */
    function updated(made: Monaco.editor.IStandaloneDiffEditor): void {
        const changes = lineChangesOf(made);
        if (changes === null) return;
        if (restore !== null) {
            made.restoreViewState(restore as Monaco.editor.IDiffEditorViewState);
            restore = null;
        }
        onchanges?.(changes);
    }

    /** The content's height, which a sized editor takes, and the view state, which it moved. */
    function grown(made: Monaco.editor.IStandaloneDiffEditor): void {
        if (sized) height = contentHeight(made, drawn);
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
    // the diff Monaco draws for it. Git's changes are handed over first, so the diff drawn for the
    // new texts is theirs.
    $effect(() => {
        const held = models;
        const made = diff;
        const loaded = kit;
        const texts = { original, modified };
        const given = changes;
        if (held === null || made === null || loaded === null) return;
        untrack(() => {
            holdChanges(loaded, held.modified, { ...texts, changes: given });
            if (
                held.original.getValue() === texts.original &&
                held.modified.getValue() === texts.modified
            ) {
                return;
            }
            restore = made.saveViewState();
            replacing = true;
            held.original.setValue(texts.original);
            held.modified.setValue(texts.modified);
            replacing = false;
        });
    });

    $effect(() => {
        const held = models;
        const id = shikiId(language);
        if (held === null || kit === null) return;
        for (const one of [held.original, held.modified]) {
            if (one.getLanguageId() !== id) kit.monaco.editor.setModelLanguage(one, id);
        }
        void kit.ensureLanguage(language);
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

    // The sizing again when the layout drawn changes, since the original side's height counts only
    // while it is drawn.
    $effect(() => {
        const [made] = [diff, drawn];
        if (made !== null) untrack(() => grown(made));
    });

    $effect(() => {
        const held = options;
        if (diff !== null && held !== undefined) applyOptions(diff, held);
    });

    // The `+` on the hovered line, while comments are offered and again for each layout, since the
    // original side is hidden in the inline one.
    $effect(() => {
        const loaded = kit;
        const made = diff;
        const layout = drawn;
        if (loaded === null || made === null) return;
        if (!offering) return;
        const watch = commentGutter(
            commentSides(made, layout),
            loaded.monaco.editor.MouseTargetType,
            (side) => side === 'modified' || drawn === 'side',
            (side, line) => oncomment?.(side, line)
        );
        return () => watch.dispose();
    });

    // The palette's actions: the chords the editor gave up, and Add Comment on Line, registered on
    // each side offered (and so in the line's right-click menu) and listed only while comments are
    // offered.
    $effect(() => {
        const loaded = kit;
        const made = diff;
        const layout = drawn;
        const label = offering ? commentLabel : undefined;
        if (loaded === null || made === null) return;
        const added =
            label === undefined
                ? null
                : commentActionsOn(commentSides(made, layout), label, (side, line) =>
                      oncomment?.(side, line)
                  );
        const chords = chordActions(made.getModifiedEditor(), loaded.mac);
        untrack(() => onactions?.(listedWithComment(chords, offering, commentLabel)));
        return () => added?.dispose();
    });

    $effect(() => {
        const [add, loaded, made, held] = [extension, kit, diff, models];
        if (add === undefined || loaded === null || made === null || held === null) return;
        const side = made.getModifiedEditor();
        return untrack(() => add(loaded, side, held.modified));
    });

    $effect(() => {
        const wanted = painting;
        const code = codeTheme;
        const loaded = kit;
        const made = diff;
        if (loaded === null || made === null || wanted === painted) return;
        return repaint(loaded, made, host, code, (ok) => (painted = ok ? wanted : null));
    });

    /** Do what the parent asks: run a palette action where the reader last was, or show a line. */
    export function perform(command: DiffCommand): void {
        const made = diff;
        if (made === null) return;
        const side =
            drawn === 'inline' ? made.getModifiedEditor() : (focused ?? made.getModifiedEditor());
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
        placedOriginal.unmount();
        made?.dispose();
        widgets?.dispose();
        if (kit !== null && models !== null) kit.gitDiffs.release(models.modified);
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
        <LineBars bars={modifiedBars} {bar} {placed} />
        <LineBars bars={originalBars} {bar} placed={placedOriginal} />
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
</style>
