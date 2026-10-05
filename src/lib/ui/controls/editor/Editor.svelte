<script lang="ts">
    // Layer 3, primitive. The text editor: Monaco, holding one model per tab instance, coloured by
    // the Shiki grammars under a theme built from the tokens, with the gutter drawn as Monaco
    // decorations. It takes values and callbacks, and imports nothing of the state, the views or
    // the shell; the values it takes and what its parent asks of it are types.ts.
    //
    // The page renders no component on the server (`ssr = false` in src/routes/+layout.ts). Until
    // Monaco has loaded (kit/load.ts, once per page) the text is a plain block, which the unit
    // suite's server render draws too; the parent's `perform` calls made before then wait for it.
    //
    // The text the parent hands in is the model's while the reader types: every change of the
    // model is handed back through `onchange`, as the model writes it, in its own line ending, with
    // whether the change was typing or the editor's undo or redo, as its change event says; and
    // a text the parent hands in that the model does not hold already (a load, a revert) replaces
    // the model's as one edit, which undo takes back. A line ending asked for is set on the model,
    // and the text it gives is handed back as a change, as a conversion of the indentation is.
    //
    // Theme and font are values Monaco holds, so they are read off the computed tokens of the body
    // when the editor mounts and again whenever `look` or `codeTheme` changes, one frame later,
    // after the body has taken the new theme's class; the parent hands in a `look` that changes
    // with the theme and the text size, as the terminal follows them, and the code theme (`tokens`
    // or a Shiki theme id) whose syntax colours the theme is painted with. The `options`
    // (options.ts) are put on the editor when it is made and again whenever they change.
    //
    // The keyboard reaches the quick diff marks through three editor actions, which the palette
    // lists while the text holds a mark (gutter/gutter.ts `changeActions`): Next, Previous, Open
    // Change. The `actions` prop adds the actions the parent owns (Alt+Z's toggle of word wrap),
    // each bound to its key when it has one and listed to the palette. A parent may also tint runs
    // of lines (`highlights`, the merge editor's conflicts) and draw bars of its own above lines
    // (`bars`, rendered by its `bar` snippet, placed by bars/zones.ts), and add to the model what
    // it needs once the model exists (`extension`, types.ts).
    //
    // Tab inserts indentation. An Escape Monaco did not take arms the next Tab to move the focus
    // on (tab-out.ts): the key is read before Monaco, where a Tab that leaves is kept from it, and
    // after it, where an Escape it left untaken arms.

    import { onDestroy, untrack, type Snippet } from 'svelte';
    import type * as Monaco from 'monaco-editor';
    import { eolOf, keyCode, modelUri, type EditorKit } from './kit/load';
    import { buildWhenHosted } from './kit/built.svelte';
    import { shikiId } from './kit/grammars';
    import { font, paintCode, repaint } from './kit/look';
    import { chordActions, ownListing } from './chords';
    import {
        blameDecorations,
        blameNumbers,
        blameWidth,
        breakpointDecorations,
        changeActions,
        markAction,
        markDecorations,
        type ChangeAction,
        type EditorBlame,
        type EditorMark
    } from './gutter/gutter';
    import { tabOut } from './tab-out';
    import { runCommand } from './commands';
    import { applyIndent, applyOptions, monacoOptions } from './options';
    import type { EditorOptions } from './options';
    import { lineBars } from './bars/zones';
    import LineBars from './bars/LineBars.svelte';
    import './gutter/marks.css';
    import type {
        EditorAction,
        EditorBar,
        EditorCaret,
        EditorChangeWords,
        EditorCommand,
        EditorEdit,
        EditorEnding,
        EditorExtension,
        EditorIndent,
        EditorOwnAction
    } from './types';

    /** The most characters of selected text handed to `onselect`; a longer selection hands none. */
    const SELECTED_MAX = 65536;

    type Props = {
        text: string;
        /** Oculus's name for the language, which kit/grammars.ts answers the Shiki id of. */
        language: string;
        /** Whether the reader may change the text. */
        writable?: boolean;
        /** What one step of Tab inserts; Monaco's own while the parent hands none. */
        indent?: EditorIndent;
        /** Word wrap, rulers, minimap, whitespace and sticky scroll; Monaco's own when absent. */
        options?: EditorOptions;
        /** The line ending the model is written in when it is made or its text is replaced. */
        ending?: EditorEnding;
        /** A name unique to the tab instance, which names the model. */
        model: string;
        /** The file's path, which names the model after the instance and labels the editor. */
        path: string;
        /** A value that changes whenever the tokens or the text size do. */
        look?: string;
        /** The code theme the syntax is coloured with: `tokens`, or the id of a Shiki theme. */
        codeTheme?: string;
        marks?: EditorMark[];
        blame?: EditorBlame[];
        /** The lines a breakpoint sits on. */
        breakpoints?: number[];
        onchange?: (text: string, edit: EditorEdit) => void;
        oncaret?: (caret: EditorCaret) => void;
        /** The selected text on every caret move; empty with none or a selection too long. */
        onselect?: (text: string) => void;
        /** How far the text is scrolled, 0 at the top and 1 at the bottom. */
        onscroll?: (fraction: number) => void;
        onmark?: (mark: EditorMark) => void;
        onblame?: (row: EditorBlame) => void;
        onglyph?: (line: number) => void;
        /** The labels of the actions over the marks; without them the editor adds none. */
        changeWords?: EditorChangeWords;
        /** The actions the parent owns: each is bound to its key, if it has one, and listed. */
        actions?: EditorOwnAction[];
        /** The actions the palette lists, said once loaded and again when the labels change. */
        onactions?: (actions: EditorAction[]) => void;
        /** Markers, widgets or providers the parent adds to the model once it exists. */
        extension?: EditorExtension;
        /** Runs of lines tinted, each from its first line (from one) for its count. */
        highlights?: { line: number; count: number }[];
        /** Bars above lines, each drawn by `bar` with its id. */
        bars?: EditorBar[];
        bar?: Snippet<[string]>;
    };

    let {
        text,
        language,
        writable = true,
        indent,
        options,
        ending = 'LF',
        model: name,
        path,
        look = '',
        codeTheme = 'tokens',
        marks = [],
        blame = [],
        breakpoints = [],
        onchange,
        oncaret,
        onselect,
        onscroll,
        onmark,
        onblame,
        onglyph,
        changeWords,
        actions = [],
        onactions,
        extension,
        highlights = [],
        bars = [],
        bar
    }: Props = $props();

    let host: HTMLDivElement | undefined = $state();
    // Monaco's objects are held as they are, never wrapped in a proxy.
    let kit: EditorKit | null = $state.raw(null);
    let editor: Monaco.editor.IStandaloneCodeEditor | null = $state.raw(null);
    let model: Monaco.editor.ITextModel | null = $state.raw(null);
    /** Whether Monaco has put the editor in the host, which takes the plain block away. */
    let mounted = $state(false);
    /** Whether the model's text is being set from the parent's, which is no change to hand back. */
    let applying = false;
    const keys = tabOut();
    /** The asks made before the editor loaded, performed once it has. */
    let waiting: EditorCommand[] = [];
    let alive = true;
    /** The look and code theme the editor's theme and font were last read under. */
    let painted: string | null = null;
    /** What the paint depends on besides the tokens: the look and the code theme. */
    const painting = $derived(JSON.stringify([look, codeTheme]));
    const listeners: Monaco.IDisposable[] = [];
    let collections: {
        marks: Monaco.editor.IEditorDecorationsCollection;
        blame: Monaco.editor.IEditorDecorationsCollection;
        breakpoints: Monaco.editor.IEditorDecorationsCollection;
        highlights: Monaco.editor.IEditorDecorationsCollection;
    } | null = null;
    const placed = lineBars();

    const lines = $derived(text.split('\n').length);

    // Load the editor once the host is drawn, and build it in the host.
    buildWhenHosted(
        () => host,
        () => alive,
        build
    );

    function build(loaded: EditorKit, box: HTMLDivElement): void {
        const made = loaded.monaco.editor.create(box, {
            automaticLayout: true,
            glyphMargin: true,
            readOnly: !writable,
            contextmenu: true,
            detectIndentation: false,
            ariaLabel: path,
            model: null,
            ...(options === undefined ? {} : monacoOptions(options)),
            ...font(host)
        });
        collections = {
            marks: made.createDecorationsCollection(),
            blame: made.createDecorationsCollection(),
            breakpoints: made.createDecorationsCollection(),
            highlights: made.createDecorationsCollection()
        };
        placed.mount(made, made.getOption(loaded.monaco.editor.EditorOption.lineHeight));
        listeners.push(
            made.onDidChangeCursorSelection((event) => caretMoved(event.selection)),
            made.onDidScrollChange((event) => {
                const room = event.scrollHeight - made.getLayoutInfo().height;
                onscroll?.(room > 0 ? Math.min(1, event.scrollTop / room) : 0);
            }),
            made.onMouseDown((event) => pressed(loaded, event.target))
        );
        editor = made;
        kit = loaded;
        mounted = true;
        painted = painting;
        void paintCode(loaded, codeTheme, () => (painted = null));
    }

    /** Whether the text holds a mark, which is when the actions over the marks are there. */
    const marked = $derived(marks.length > 0);

    // The actions over the marks, added under the parent's labels while the text holds a mark, and
    // the actions the parent owns, added again when the labels, the mark state or the parent's
    // actions change, and said to the palette.
    $effect(() => {
        const loaded = kit;
        const made = editor;
        const words = changeWords;
        if (loaded === null || made === null) return;
        const listed = words === undefined ? [] : changeActions(words, loaded.mac, marked);
        const added = listed.map(({ id, label, press, does }) => {
            const keybindings = press === null ? [] : [keyCode(loaded.monaco, press)];
            return made.addAction({ id, label, keybindings, run: () => act(made, does) });
        });
        const said = listed.map(({ id, label, hint }): EditorAction => ({ id, label, hint }));
        for (const { id, label, key, run } of actions) {
            const keybindings = key === undefined ? [] : [keyCode(loaded.monaco, key)];
            added.push(made.addAction({ id, label, keybindings, run: () => run() }));
        }
        said.push(...ownListing(actions, loaded.mac));
        untrack(() => onactions?.([...said, ...chordActions(made, loaded.mac)]));
        return () => {
            for (const action of added) action.dispose();
        };
    });

    /** An action over the marks, from the caret's line: the mark opened, or the caret moved. */
    function act(made: Monaco.editor.IStandaloneCodeEditor, does: ChangeAction['does']): void {
        const line = made.getPosition()?.lineNumber ?? 1;
        const done = markAction(does, marks, line, model?.getLineCount() ?? lines);
        if (done?.mark !== undefined) onmark?.(done.mark);
        if (done?.line === undefined) return;
        made.setPosition({ lineNumber: done.line, column: 1 });
        made.revealLineInCenterIfOutsideViewport(done.line);
    }

    function caretMoved(selection: Monaco.Selection): void {
        const held = model;
        if (held === null || kit === null) return;
        const LF = kit.monaco.editor.EndOfLinePreference.LF;
        oncaret?.({
            line: selection.positionLineNumber,
            column: selection.positionColumn,
            selected: held.getValueLengthInRange(selection, LF)
        });
        const length = held.getValueLengthInRange(selection, LF);
        onselect?.(length > 0 && length <= SELECTED_MAX ? held.getValueInRange(selection, LF) : '');
    }

    /** A press in the gutter: a quick diff mark, a blamed line number, or the glyph margin. */
    function pressed(loaded: EditorKit, target: Monaco.editor.IMouseTarget): void {
        const line = target.position?.lineNumber;
        if (line === undefined) return;
        const { MouseTargetType } = loaded.monaco.editor;
        if (target.type === MouseTargetType.GUTTER_LINE_DECORATIONS) {
            const done = markAction('open', marks, line, model?.getLineCount() ?? lines);
            if (done?.mark !== undefined) onmark?.(done.mark);
        } else if (target.type === MouseTargetType.GUTTER_LINE_NUMBERS) {
            const row = blame.find((one) => one.line === line);
            if (row !== undefined && row.commit !== '') onblame?.(row);
        } else if (target.type === MouseTargetType.GUTTER_GLYPH_MARGIN) {
            onglyph?.(line);
        }
    }

    // The values that name the model, held as values: a prop handed in as a member of an object (a
    // tab instance's id) is a read of that object, and keeping a preview tab replaces the object
    // with a copy of the same id. The effect reads these two, so it runs again only when the name
    // or the path changes, and not when the object they came from is replaced.
    const named = $derived(name);
    const filed = $derived(path);

    // The instance's model, made on its own URI and set on the editor, and made again when the
    // tab is pointed at another file. The one before it is disposed with it.
    $effect(() => {
        const loaded = kit;
        const made = editor;
        if (loaded === null || made === null) return;
        const uri = modelUri(loaded.monaco, named, filed);
        const created = untrack(() => {
            loaded.monaco.editor.getModel(uri)?.dispose();
            const fresh = loaded.monaco.editor.createModel(text, shikiId(language), uri);
            fresh.setEOL(eolOf(loaded.monaco, ending));
            if (indent !== undefined) applyIndent(fresh, indent);
            return fresh;
        });
        const changes = created.onDidChangeContent((event) => {
            const edit = event.isUndoing ? 'undo' : event.isRedoing ? 'redo' : 'type';
            if (!applying) onchange?.(created.getValue(), edit);
        });
        made.setModel(created);
        model = created;
        untrack(flush);
        return () => {
            changes.dispose();
            // An editor already disposed with the component holds no model to take away.
            if (alive && made.getModel() === created) made.setModel(null);
            created.dispose();
            model = null;
        };
    });

    // A text the parent hands in that the model does not hold already replaces the model's as one
    // edit, in the line ending asked for; the text the reader typed comes back equal and is left.
    $effect(() => {
        const held = model;
        const wanted = text;
        if (held === null || kit === null) return;
        const LF = kit.monaco.editor.EndOfLinePreference.LF;
        if (held.getValue(LF) === wanted.replace(/\r\n/g, '\n')) return;
        const loaded = kit;
        untrack(() => {
            applying = true;
            try {
                held.pushEditOperations(
                    [],
                    [{ range: held.getFullModelRange(), text: wanted }],
                    () => null
                );
                held.pushEOL(eolOf(loaded.monaco, ending));
            } finally {
                applying = false;
            }
        });
    });

    $effect(() => {
        const held = model;
        const id = shikiId(language);
        if (held === null || kit === null) return;
        if (held.getLanguageId() !== id) kit.monaco.editor.setModelLanguage(held, id);
        void kit.ensureLanguage(language);
    });

    $effect(() => {
        if (indent === undefined) return;
        const { tabs, size } = indent;
        if (model !== null) applyIndent(model, { tabs, size });
    });

    $effect(() => {
        editor?.updateOptions({ readOnly: !writable });
    });

    $effect(() => {
        if (editor !== null && options !== undefined) applyOptions(editor, options);
    });

    // The gutter: the marks and the breakpoints as decorations, the blame in the number column.
    $effect(() => {
        const count = lines;
        const held = [marks, blame, breakpoints] as const;
        if (editor === null || model === null || collections === null) return;
        collections.marks.set(markDecorations(held[0], model.getLineCount()));
        collections.breakpoints.set(breakpointDecorations(held[2]));
        collections.blame.set(blameDecorations(held[1]));
        editor.updateOptions({
            lineNumbers: held[1].length === 0 ? 'on' : blameNumbers(held[1], count),
            lineNumbersMinChars: blameWidth(held[1], count)
        });
    });

    // The parent's extension, added to the model and taken away with it or when another is given.
    $effect(() => {
        const [add, loaded, made, held] = [extension, kit, editor, model];
        if (add === undefined || loaded === null || made === null || held === null) return;
        return add(loaded, made, held);
    });

    $effect(() => {
        const runs = highlights;
        collections?.highlights.set(
            runs.map(({ line, count }) => ({
                range: {
                    startLineNumber: line,
                    startColumn: 1,
                    endLineNumber: line + count - 1,
                    endColumn: 1
                },
                options: { isWholeLine: true, className: 'oculus-highlight' }
            }))
        );
    });

    // The theme and the font again whenever the look or the code theme changes from the one the
    // editor was built or last painted under, on the next frame, once the body carries the new
    // theme's tokens.
    $effect(() => {
        const wanted = painting;
        const code = codeTheme;
        const loaded = kit;
        const made = editor;
        if (loaded === null || made === null || wanted === painted) return;
        return repaint(loaded, made, host, code, (ok) => (painted = ok ? wanted : null));
    });

    /** Perform what the parent asks; an ask made before the editor loaded waits for it. */
    export function perform(command: EditorCommand): void {
        if (editor === null || model === null || kit === null) {
            waiting.push(command);
            return;
        }
        runCommand(kit, editor, model, command);
    }

    function flush(): void {
        const asks = waiting;
        waiting = [];
        for (const command of asks) perform(command);
    }

    onDestroy(() => {
        alive = false;
        for (const listener of listeners.splice(0)) listener.dispose();
        placed.unmount();
        editor?.dispose();
        editor = null;
    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="editor"
    data-editor-host={path}
    data-editor-writable={writable ? 'true' : 'false'}
    onkeydowncapture={keys.before}
    onkeydown={keys.after}
>
    <div class="monaco" bind:this={host}></div>
    {#if !mounted}
        <pre class="plain">{text}</pre>
    {/if}
    {#if bar !== undefined}
        <LineBars {bars} {bar} {placed} />
    {/if}
</div>

<style>
    .editor {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;
        font-size: var(--fs-sm);
    }

    .monaco,
    .plain {
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

    /* Under the wall the editor is a translucent pane over the picture, as the rest of the page
       is: its surfaces, which Monaco paints in the panel's colour from the theme, and the plain
       text drawn before it loads take the pane's share of the panel. */
    :global(body.wall) .editor {
        backdrop-filter: blur(var(--wall-blur));
    }

    :global(body.wall) .plain {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
    }

    :global(body.wall) .editor :global(.monaco-editor),
    :global(body.wall) .editor :global(.monaco-editor-background),
    :global(body.wall) .editor :global(.monaco-editor .margin) {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
    }
</style>
