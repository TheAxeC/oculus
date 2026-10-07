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
    // which binds their keys and lists them to the palette.
    //
    // The editor holds the theme and the font as values, so it is handed the theme and the text
    // size in force, and builds its look again whenever either changes. It is also handed the code
    // theme, whose syntax colours the editor paints its text with.
    //
    // A Markdown file opens as the editor alone. With the rendered half turned on, the row splits
    // into the editor and the rendered half, with the handle between them: the rendered half takes
    // at most half the row (`EDITOR_LEAST`) and follows how far the editor is scrolled through its
    // text. A file of any other kind is the editor alone.
    //
    // The editor spends no row on controls: Save, Revert, Blame and the rendered half are palette
    // actions of the tab, and Cmd+S saves it. The rendered half is
    // views/shared/prose/RenderedMarkdown.svelte. What the status bar and the palette ask of the
    // tab, Source.svelte hands to `perform`.

    import { untrack } from 'svelte';
    import RenderedMarkdown from '$lib/views/shared/prose/RenderedMarkdown.svelte';
    import Sash from '$lib/ui/frame/Sash.svelte';
    import { SASH_PX, draggedShare } from '$lib/ui/frame/sash-size';
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
    import type { EditorBlame, EditorMark } from '$lib/ui/controls/editor/gutter/gutter';
    import type { EditorOptions } from '$lib/ui/controls/editor/options';
    import { languageOf } from '$lib/state/sources/fs';
    import {
        shownLanguage,
        type Indent,
        type LineEnding,
        type WordWrap
    } from '$lib/state/workbench/navigation/editor-text';
    import { useState } from '$lib/state/client/use';
    import { t } from '$lib/state/shared/words/text';

    const {
        selectors: { editorOptions, languages, paintLimit },
        ui: { codeTheme, theme, textScale }
    } = useState();

    type Props = {
        path: string;
        text: string;
        /** The edits the text was last replaced by, which the editor makes as they are. */
        reached?: () => EditorReach | null;
        /** The tab instance, which names the editor's model. */
        instance?: string;
        /**
         * The line the tab was opened at, and zero for one opened at the file itself. It is acted
         * on once per line and column the tab is pointed at: every scroll after that is the
         * reader's own.
         */
        line?: number;
        /** The column of the place the tab was opened at, from one, or 0 for none. */
        column?: number;
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
        marks?: EditorMark[];
        blame?: EditorBlame[];
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
        /** The selected text on every caret move, empty with no selection. */
        onselect?: (text: string) => void;
        onmark?: (mark: EditorMark) => void;
        onblame?: (row: EditorBlame) => void;
        /** The editor's actions the palette offers, said once the editor has loaded. */
        onactions?: (actions: EditorAction[]) => void;
    };

    let {
        path,
        text,
        reached,
        instance = 'tab',
        line = 0,
        column = 0,
        first = 1,
        onfirst,
        language: chosen,
        indent = null,
        ending = 'LF',
        wrap = null,
        rulers = null,
        actions = [],
        rendered = false,
        marks = [],
        blame = [],
        extension,
        writable = true,
        oninput,
        oncaret,
        onselect,
        onmark,
        onblame,
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
    /** The theme and the text size in force, which the editor's look is built from. */
    const look = $derived(`${theme()} ${String(textScale() ?? 1)}`);

    // Go to the place the tab was opened at, once per line and column it is pointed at: the word at
    // the column is selected, and a line alone is gone to.
    $effect(() => {
        const wanted = line;
        const at = column;
        const held = editor;
        if (wanted === 0 || held === undefined) return;
        untrack(() => {
            const place = `${String(wanted)}:${String(at)}`;
            if (placed === place) return;
            placed = place;
            held.perform(
                at === 0
                    ? { kind: 'goto', line: wanted }
                    : { kind: 'word', line: wanted, column: at }
            );
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
</script>

<div
    class="source-editor"
    data-source-editor={path}
    data-source-line={line === 0 ? undefined : line}
    data-language={shown}
>
    <div class="row" bind:this={box}>
        <div class="editor-wrap" style="flex: {split ? share : 1} 1 0">
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
                {marks}
                {blame}
                {extension}
                {writable}
                {oncaret}
                {onselect}
                {onmark}
                {onblame}
                {onactions}
                changeWords={{
                    next: t('source.next_change'),
                    previous: t('source.previous_change'),
                    open: t('source.open_change')
                }}
                language={shown}
                model={instance}
                onchange={oninput}
                onscroll={(next: number) => (fraction = next)}
                startLine={line === 0 ? first : 1}
                {onfirst}
            />
        </div>
        {#if split}
            <Sash dir="row" {share} onresize={moved} onreset={reset} />
            <div class="rendered" style="flex: {1 - share} 1 0">
                <RenderedMarkdown {path} {text} {fraction} />
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
