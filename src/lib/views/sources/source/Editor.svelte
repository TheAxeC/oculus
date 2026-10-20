<script lang="ts">
    // Layer 3, partial of views/sources/source/Source.svelte. The source tab's use of the editor
    // primitive, ui/controls/editor/Editor.svelte: the tab's text in Monaco under the language the
    // tab hands it (the one chosen from the status bar, or the file name's), with the tab's
    // indentation, the gutter's quick diff marks and blame, and the caret said on every move for
    // the status bar. The editor's actions over the marks take their labels from the view's words.
    //
    // A file over `editor.paint_limit_kb` of config/behavior.yml opens as plaintext, which the
    // editor does not colour, as does any file before the configuration has delivered the limit.
    //
    // The word wrap and the rulers are the tab's, resolved in Source.svelte; the minimap, the
    // whitespace and sticky scroll are the configured ones, which every source editor takes alike.
    // The actions the tab owns (Alt+Z's toggle of word wrap among them) are handed to the editor,
    // which binds their keys and lists them to the palette. Show Suggestions, Monaco's own action,
    // takes its label from the view's words, and the suggest list's description panel is the ui
    // store's: the reader's own choice, else `editor.suggest_details` of config/behavior.yml.
    //
    // The editor holds the theme and the font as values, so it is handed a look that changes with
    // the theme, the text size and every pick of a code theme (the ui store's editorLook()), and
    // builds its look again whenever it changes. It is also handed the code theme, whose syntax
    // colours the editor paints its text with.
    //
    // A Markdown file opens as the editor alone. With the rendered half turned on, the row splits
    // into the editor and the rendered half, with the handle between them: the rendered half takes
    // at most half the row (`EDITOR_LEAST`) and follows how far the editor is scrolled through its
    // text. A file of any other kind is the editor alone.
    //
    // A note of a hub (a Markdown file of its `.oculus/notes/`) takes a picture pasted into it, and
    // a file dropped on it from outside the page, into `attachments/` of its hub's notes folder and
    // inserts `![[<file name>]]` at the caret (views/shared/explorer/control/note-actions.ts); a
    // file refused inserts nothing and is said on the tab's line (`onsaid`). Any other paste and
    // drop, and every paste and drop in a file that is no note, is the editor's own.
    //
    // The editor spends no row on controls: Save, Revert, Blame and the rendered half are palette
    // actions of the tab, and Cmd+S saves it. The rendered half is
    // views/shared/prose/RenderedMarkdown.svelte. What the status bar and the palette ask of the
    // tab, Source.svelte hands to `perform`.

    import { untrack } from 'svelte';
    import RenderedMarkdown from '$lib/views/shared/prose/RenderedMarkdown.svelte';
    import Sash from '$lib/ui/frame/sash/Sash.svelte';
    import { SASH_PX, draggedShare } from '$lib/ui/frame/sash/sash-size';
    import MonacoEditor from '$lib/ui/controls/editor/Editor.svelte';
    import type {
        EditorAction,
        EditorCaret,
        EditorCommand,
        EditorExtension,
        EditorHandle,
        EditorOwnAction,
        EditorReach
    } from '$lib/ui/controls/editor/types';
    import type { EditorGutter } from './source-gutter.svelte';
    import { NOWHERE, type OpenedAt } from './status/tab-state';
    import type { EditorOptions } from '$lib/ui/controls/editor/options';
    import { languageOf } from '$lib/state/sources/fs';
    import { noteOf } from '$lib/state/sources/explorer/notes/note-index';
    import type { Attached } from '$lib/state/sources/explorer/notes/note-attach';
    import { attachToNote } from '$lib/views/shared/explorer/control/note-actions';
    import {
        shownLanguage,
        type Indent,
        type LineEnding,
        type WordWrap
    } from '$lib/state/workbench/navigation/editor-text';
    import { useState } from '$lib/state/client/use';
    import { t } from '$lib/state/shared/words/text';

    const client = useState();
    const {
        fs: { notes },
        selectors: { editorOptions, languages, paintLimit },
        ui: { codeTheme, editorLook, suggestDetails, setSuggestDetails }
    } = client;

    type Props = {
        path: string;
        /** The root the file is under, which a note is read in; none for a file of no root. */
        root?: string;
        /** Says why a file pasted or dropped into a note was refused, '' when none was. */
        onsaid?: (words: string) => void;
        text: string;
        /** The edits the text was last replaced by, which the editor makes as they are. */
        reached?: () => EditorReach | null;
        /** The tab instance, which names the editor's model. */
        instance?: string;
        /**
         * The place the tab was opened at, and zeros for one opened at the file itself. It is
         * acted on once per ask: every scroll after that is the reader's own. A place with an
         * `asked` is gone to when `asked` differs from `wentTo`, and `onwent` then says the value
         * gone to; one without goes once per line, column and end it is pointed at.
         */
        place?: OpenedAt;
        onwent?: (asked: number) => void;
        /**
         * The highlighter's name for the language the text is painted in, the file name's when the
         * tab hands none.
         */
        language?: string;
        /** What one step of Tab inserts; the editor's own while the tab hands none. */
        indent?: Indent | null;
        ending?: LineEnding;
        /** The word wrap and the rulers the tab resolved; the editor's own when it hands none. */
        wrap?: WordWrap | null;
        rulers?: number[] | null;
        /** The actions the tab owns, such as Alt+Z's toggle of word wrap. */
        actions?: EditorOwnAction[];
        /** Whether the reader wants the rendered half, for a file that has one. */
        rendered?: boolean;
        /** The marks, blame and breakpoints of the gutter, and what a press in it does. */
        gutter?: EditorGutter;
        /** What the tab's language adds to the editor, such as LaTeX's markers and preview. */
        extension?: EditorExtension;
        /** Whether the editor takes typing; false for a file this machine's mode locks. */
        writable?: boolean;
        /** The first line the editor opens showing, from one; `onfirst` says each change of it. */
        first?: number;
        onfirst?: (line: number) => void;
        /** Every change of the text, in the line ending the editor holds it in. */
        oninput: (value: string) => void;
        /** Where the caret is now, said on every move. */
        oncaret?: (caret: EditorCaret) => void;
        /** The editor lost focus. */
        onblur?: () => void;
        /** The selected text on every caret move, empty with no selection. */
        onselect?: (text: string) => void;
        /** The editor's actions the palette offers, said once the editor has loaded. */
        onactions?: (actions: EditorAction[]) => void;
    };

    let {
        path,
        root = '',
        onsaid,
        text,
        reached,
        instance = 'tab',
        place = NOWHERE,
        onwent,
        first = 1,
        onfirst,
        language: chosen,
        indent = null,
        ending = 'LF',
        wrap = null,
        rulers = null,
        actions = [],
        rendered = false,
        gutter,
        extension,
        writable = true,
        oninput,
        oncaret,
        onblur,
        onselect,
        onactions
    }: Props = $props();

    let editor: EditorHandle | undefined = $state();
    let box: HTMLDivElement | undefined = $state();
    /** The place already gone to, so a redraw does not take the reader back to it. */
    let placed = '';
    /** The editor's least and most share of the row; the rendered half takes at most half. */
    const EDITOR_LEAST = 0.5;
    const EDITOR_MOST = 0.9;

    /** The share of the row the editor holds, at least half. The rendered half takes the rest. */
    let share = $state(0.5);
    /** How far the editor is scrolled through its text, which is what the rendered half follows. */
    let fraction = $state(0);

    const language = $derived(chosen ?? languageOf(path, languages()));
    /** The language the editor opens the text under, plaintext past the paint limit. */
    const shown = $derived(shownLanguage(language, text, paintLimit()));
    /**
     * The options the editor takes: the tab's word wrap and rulers, the configured rest, and none
     * of them until the configuration has arrived.
     */
    const configured = $derived(editorOptions());
    const options = $derived<EditorOptions>({
        ...(wrap === null ? {} : { wordWrap: wrap }),
        ...(rulers === null ? {} : { rulers }),
        ...(configured === null
            ? {}
            : {
                  minimap: configured.minimap,
                  renderWhitespace: configured.renderWhitespace,
                  stickyScroll: configured.stickyScroll
              })
    });
    /** Whether this file has a rendered half at all, which is what a Markdown file has. */
    const markdown = $derived(language === 'markdown');
    const split = $derived(markdown && rendered);
    /** The theme, the text size and the code theme picks, which the editor's look is built from. */
    const look = $derived(editorLook());

    /** The editor's command for a place: its range, the word at its column, or its line. */
    function goingTo(at: OpenedAt): EditorCommand {
        const focus = at.focus ? {} : { focus: false };
        if (at.endLine > 0) {
            const { line, column, endLine, endColumn } = at;
            return {
                kind: 'range',
                line,
                column: Math.max(column, 1),
                endLine,
                endColumn,
                ...focus
            };
        }
        if (at.column > 0) return { kind: 'word', line: at.line, column: at.column, ...focus };
        return { kind: 'goto', line: at.line, ...focus };
    }

    // Go to the place the tab was opened at, once per ask of it: a place with an `asked` is gone
    // to when the ask is not the one already gone to, which a reload keeps, so the same place
    // asked for again is gone to again. A place with none is gone to once per line, column and end.
    $effect(() => {
        const at = place;
        const held = editor;
        if (at.line === 0 || held === undefined) return;
        untrack(() => {
            const ask =
                at.asked > 0
                    ? `asked ${String(at.asked)}`
                    : [at.line, at.column, at.endLine, at.endColumn].join(':');
            if (placed === ask) return;
            placed = ask;
            if (at.asked > 0 && at.asked === at.wentTo) return;
            held.perform(goingTo(at));
            if (at.asked > 0) onwent?.(at.asked);
        });
    });

    /** Perform an ask of the status bar or the palette on the editor. */
    export function perform(command: EditorCommand): void {
        editor?.perform(command);
    }

    /**
     * A drag is pixels; what the two halves are laid out by is a share, so the row's width sets it.
     */
    function moved(delta: number): void {
        share = draggedShare(
            share,
            delta,
            (box?.clientWidth ?? 0) - SASH_PX,
            EDITOR_LEAST,
            EDITOR_MOST
        );
    }

    function reset(): void {
        share = 0.5;
    }

    /** Whether the file is a note of a hub, which takes pictures and dropped files. */
    const note = $derived(root !== '' && noteOf(notes().hubs, root, path) !== null);

    /** Write files into the note's attachments and insert their links at the caret. */
    async function attach(files: Attached[]): Promise<void> {
        const answer = await attachToNote(client, root, files);
        if (answer.inserted !== '') editor?.perform({ kind: 'insert', text: answer.inserted });
        onsaid?.(answer.said);
    }

    /** A paste into a note holding pictures writes them; any other paste is the editor's. */
    function pasted(event: ClipboardEvent): void {
        const files = [...(event.clipboardData?.files ?? [])];
        const pictures = files.filter((file) => file.type.startsWith('image/'));
        if (!note || pictures.length === 0) return;
        event.preventDefault();
        event.stopPropagation();
        void attach(pictures.map((file) => ({ file, pasted: true })));
    }

    /** Whether a drag carries files from outside the page, which a note takes. */
    function carriesFiles(event: DragEvent): boolean {
        return note && (event.dataTransfer?.types.includes('Files') ?? false);
    }

    /** A drag of files over a note is let drop; any other drag is the editor's. */
    function dragging(event: DragEvent): void {
        if (!carriesFiles(event)) return;
        event.preventDefault();
        event.stopPropagation();
    }

    /** Files dropped on a note are written; any other drop is the editor's. */
    function dropped(event: DragEvent): void {
        const files = [...(event.dataTransfer?.files ?? [])];
        if (!carriesFiles(event) || files.length === 0) return;
        event.preventDefault();
        event.stopPropagation();
        void attach(files.map((file) => ({ file, pasted: false })));
    }
</script>

<div
    class="source-editor"
    data-source-editor={path}
    data-source-line={place.line === 0 ? undefined : place.line}
    data-language={shown}
>
    <div class="row" bind:this={box}>
        <div
            class="editor-wrap"
            style="flex: {split ? share : 1} 1 0"
            onpastecapture={pasted}
            ondragovercapture={dragging}
            ondropcapture={dropped}
        >
            <MonacoEditor
                bind:this={editor}
                {text}
                {reached}
                {path}
                indent={indent ?? undefined}
                {options}
                {actions}
                {ending}
                {look}
                codeTheme={codeTheme()}
                marks={gutter?.marks}
                blame={gutter?.blame}
                breakpoints={gutter?.breakpoints}
                paused={gutter?.paused}
                onglyph={gutter?.onglyph}
                onbreakpoints={gutter?.onbreakpoints}
                {extension}
                {writable}
                {oncaret}
                {onblur}
                {onselect}
                onmark={gutter?.onmark}
                onblame={gutter?.onblame}
                {onactions}
                changeWords={{
                    next: t('source.next_change'),
                    previous: t('source.previous_change'),
                    open: t('source.open_change')
                }}
                suggest={{
                    label: t('source.show_suggestions'),
                    details: suggestDetails() ?? configured?.suggestDetails ?? true,
                    ondetails: setSuggestDetails
                }}
                language={shown}
                model={instance}
                onchange={oninput}
                onscroll={(next: number) => (fraction = next)}
                startLine={place.line === 0 ? first : 1}
                {onfirst}
            />
        </div>
        {#if split}
            <Sash dir="row" {share} onresize={moved} onreset={reset} />
            <div class="rendered" style="flex: {1 - share} 1 0">
                <RenderedMarkdown {path} {root} {text} {fraction} />
            </div>
        {/if}
    </div>
</div>

<style>
    .source-editor {
        display: grid;
        grid-template-rows: minmax(0, 1fr);
        height: 100%;
        min-height: 0;
    }

    .row {
        display: flex;
        min-width: 0;
        min-height: 0;
    }

    .rendered {
        min-width: 0;
        min-height: 0;
    }

    .editor-wrap {
        display: flex;
        min-width: 0;
        min-height: 240px;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
    }
</style>
