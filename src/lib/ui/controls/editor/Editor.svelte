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
    // Change. The decorations of the marks, the breakpoints, the paused line and the blame, the
    // press in the gutter, the hint dot, the breakpoints' lines read back after an edit and the
    // action over the marks from the caret's line are gutter/editor-gutter.ts's, which this file
    // calls with the editor, the model and the values it holds. The `actions` prop adds the actions
    // the parent owns (Alt+Z's toggle of word wrap), each bound to its key when it has one and
    // listed to the palette. A parent may also tint runs of lines (`highlights`, the merge editor's
    // conflicts) and draw bars of its own above lines (`bars`, rendered by its `bar` snippet,
    // placed by bars/zones.ts), and add to the model what it needs once the model exists
    // (`extension`, types.ts).
    //
    // Tab inserts indentation. An Escape Monaco did not take arms the next Tab to move the focus
    // on (tab-out.ts): the key is read before Monaco, where a Tab that leaves is kept from it, and
    // after it, where an Escape it left untaken arms.
    //
    // What Monaco pops up over the text is drawn on the document body, so no pane, split or float
    // clips it: the hover, the suggest list, the parameter hints and the rename box on a node of
    // this editor's, the right-click menu and the code action list on the page's node (options.ts
    // `pageWidgets`). A key typed in such a widget is dispatched again in the editor that owns it,
    // where the handlers above read it, and an ancestor of the box that scrolls closes the menu,
    // the hover, the suggest list and the parameter hints and places what stays open against the
    // text again. The quick input (Go to Line, Go to Symbol) stays in the box, as Monaco scopes it.

    import { onDestroy, untrack, type Snippet } from 'svelte';
    import type * as Monaco from 'monaco-editor';
    import { eolOf, keyCode, keysCode, modelUri, type EditorKit } from './kit/load';
    import { buildWhenHosted } from './kit/built.svelte';
    import { shikiId } from './kit/languages/grammars';
    import { font, paintCode, repaint } from './kit/look';
    import { chordActions, ownListing } from './chords';
    import {
        changeActions,
        type EditorBlame,
        type EditorBreakpoint,
        type EditorMark
    } from './gutter/gutter';
    import {
        actOnMarks,
        drawGutter,
        drawHighlights,
        followGutter,
        gutterCollections,
        type GutterCollections
    } from './gutter/editor-gutter';
    import { tabOut } from './tab-out';
    import { followFirstLine, reachedBy, runCommand, type FirstLine } from './commands';
    import { applyIndent, applyOptions, monacoOptions } from './options';
    import type { EditorOptions, Widgets } from './options';
    import { lineBars } from './bars/zones';
    import LineBars from './bars/LineBars.svelte';
    import './gutter/marks.css';
    import './kit/theme/rename.css';
    import './kit/theme/wall.css';
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
        EditorOwnAction,
        EditorReach
    } from './types';

    /** The most characters of selected text handed to `onselect`; a longer selection hands none. */
    const SELECTED_MAX = 65536;

    type Props = {
        text: string;
        /**
         * The edits the text was last changed by, read when the text differs from the model's;
         * null for a text typed or set whole.
         */
        reached?: () => EditorReach | null;
        /**
         * Oculus's name for the language, which kit/languages/grammars.ts answers the Shiki id of.
         */
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
        /** The breakpoints, each on its line and drawn by its state. */
        breakpoints?: EditorBreakpoint[];
        /** The line a paused program is on, tinted and marked with an arrow. */
        paused?: number | null;
        onchange?: (text: string, edit: EditorEdit) => void;
        oncaret?: (caret: EditorCaret) => void;
        /** The editor's text area lost focus. */
        onblur?: () => void;
        /** The selected text on every caret move; empty with none or a selection too long. */
        onselect?: (text: string) => void;
        /** How far the text is scrolled, 0 at the top and 1 at the bottom. */
        onscroll?: (fraction: number) => void;
        /** The first line the editor shows, from one, said when the reader changes it. */
        onfirst?: (line: number) => void;
        /** The line the text first shows at the top, from one. */
        startLine?: number;
        onmark?: (mark: EditorMark) => void;
        onblame?: (row: EditorBlame) => void;
        /** A press in the glyph margin; with it given, the margin shows a dot under the pointer. */
        onglyph?: (line: number) => void;
        /** The lines the breakpoints sit on once an edit moved them, in the order given. */
        onbreakpoints?: (lines: number[]) => void;
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
        reached,
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
        paused = null,
        onchange,
        oncaret,
        onblur,
        onselect,
        onscroll,
        onfirst,
        startLine = 1,
        onmark,
        onblame,
        onglyph,
        onbreakpoints,
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
    let firstLine: FirstLine | null = null;
    /** The look and code theme the editor's theme and font were last read under. */
    let painted: string | null = null;
    /** What the paint depends on besides the tokens: the look and the code theme. */
    const painting = $derived(JSON.stringify([look, codeTheme]));
    const listeners: Monaco.IDisposable[] = [];
    /** The widgets of the editor, drawn on a node on the body. */
    let widgets: Widgets | null = null;
    let collections: GutterCollections | null = null;
    const placed = lineBars();

    const lines = $derived(text.split('\n').length);

    // Load the editor once the host is drawn, and build it in the host.
    buildWhenHosted(
        () => host,
        () => alive,
        build
    );

    function build(loaded: EditorKit, box: HTMLDivElement): void {
        widgets = loaded.widgets.of(box);
        const made = loaded.monaco.editor.create(box, {
            automaticLayout: true,
            glyphMargin: true,
            readOnly: !writable,
            contextmenu: true,
            detectIndentation: false,
            ariaLabel: path,
            model: null,
            ...widgets.options,
            ...(options === undefined ? {} : monacoOptions(options)),
            ...font(host)
        });
        widgets.tie([made]);
        collections = gutterCollections(made);
        placed.mount(made, made.getOption(loaded.monaco.editor.EditorOption.lineHeight));
        firstLine = followFirstLine(made, (line) => onfirst?.(line));
        listeners.push(
            made.onDidChangeCursorSelection((event) => caretMoved(event.selection)),
            made.onDidBlurEditorWidget(() => onblur?.()),
            made.onDidScrollChange((event) => {
                const room = event.scrollHeight - made.getLayoutInfo().height;
                onscroll?.(room > 0 ? Math.min(1, event.scrollTop / room) : 0);
            }),
            firstLine.listener,
            ...followGutter(loaded.monaco, made, collections, () => ({
                values: { marks, blame, breakpoints, paused },
                lines: model?.getLineCount() ?? lines,
                handlers: { onmark, onblame, onglyph, onbreakpoints },
                applying
            }))
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
    // the actions the parent owns (in the right-click menu too, when one names a group), added
    // again when the labels, the mark state or the parent's actions change, and said to the
    // palette.
    $effect(() => {
        const loaded = kit;
        const made = editor;
        const words = changeWords;
        if (loaded === null || made === null) return;
        const listed = words === undefined ? [] : changeActions(words, loaded.mac, marked);
        const added = listed.map(({ id, label, press, does }) => {
            const keybindings = press === null ? [] : [keyCode(loaded.monaco, press)];
            return made.addAction({
                id,
                label,
                keybindings,
                run: () => actOnMarks(made, does, marks, model?.getLineCount() ?? lines, onmark)
            });
        });
        const said = listed.map(({ id, label, hint }): EditorAction => ({ id, label, hint }));
        for (const { id, label, key, menu, order, disabled, run } of actions) {
            const keybindings = key === undefined ? [] : [keysCode(loaded.monaco, key)];
            const at = order === undefined ? {} : { contextMenuOrder: order };
            const group = menu === undefined ? {} : { contextMenuGroupId: menu, ...at };
            const precondition = disabled === true ? { precondition: 'false' } : {};
            added.push(
                made.addAction({
                    id,
                    label,
                    keybindings,
                    ...group,
                    ...precondition,
                    run: () => run()
                })
            );
        }
        said.push(...ownListing(actions, loaded.mac));
        untrack(() => onactions?.([...said, ...chordActions(made, loaded.mac)]));
        return () => {
            for (const action of added) action.dispose();
        };
    });

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
        const start = untrack(() => startLine);
        firstLine?.settle(loaded.monaco, created, start);
        return () => {
            changes.dispose();
            // An editor already disposed with the component holds no model to take away.
            if (alive && made.getModel() === created) made.setModel(null);
            created.dispose();
            model = null;
        };
    });

    // A text the parent hands in that the model does not hold already reaches the model as the
    // edits it was made by when the parent names them, and as one replacement otherwise, in the
    // line ending asked for; the text the reader typed comes back equal and is left.
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
                if (!reachedBy(loaded.monaco, held, reached?.() ?? null, wanted)) {
                    held.pushEditOperations(
                        [],
                        [{ range: held.getFullModelRange(), text: wanted }],
                        () => null
                    );
                }
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
        const held = { marks, blame, breakpoints, paused };
        if (editor === null || model === null || collections === null) return;
        drawGutter(editor, model, collections, held, count);
    });

    // The parent's extension, added to the model and taken away with it or when another is given.
    // What the extension reads while it adds itself is not a reason to add it again.
    $effect(() => {
        const [add, loaded, made, held] = [extension, kit, editor, model];
        if (add === undefined || loaded === null || made === null || held === null) return;
        return untrack(() => add(loaded, made, held));
    });

    $effect(() => {
        const runs = highlights;
        if (collections !== null) drawHighlights(collections, runs);
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
        widgets?.dispose();
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
</style>
