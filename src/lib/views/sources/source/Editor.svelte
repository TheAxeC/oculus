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
    // The editor holds the theme and the font as values, so it is handed the theme and the text
    // size in force, and builds its look again whenever either changes. It is also handed the code
    // theme, whose syntax colours the editor paints its text with.
    //
    // A Markdown file is written and read at once: the row splits into the editor and the rendered
    // half, with the handle between them, and the rendered half follows how far the editor is
    // scrolled through its text. A file of any other kind is the editor alone.
    //
    // The controls that act on the text (Save, Revert and the rendered half) are the pane's own
    // bar, which Source.svelte draws, so the tab spends one row on its controls and the editor
    // none. What the status bar and the palette ask of the tab, Source.svelte hands to `perform`.

    import { untrack } from 'svelte';
    import Preview from './Preview.svelte';
    import Sash from '$lib/ui/frame/Sash.svelte';
    import { SASH_PX } from '$lib/ui/frame/sash-size';
    import MonacoEditor from '$lib/ui/controls/editor/Editor.svelte';
    import type {
        EditorAction,
        EditorCaret,
        EditorCommand,
        EditorHandle
    } from '$lib/ui/controls/editor/types';
    import type { EditorBlame, EditorMark } from '$lib/ui/controls/editor/gutter';
    import { languageOf } from '$lib/state/sources/fs';
    import {
        DEFAULT_INDENT,
        shownLanguage,
        type Indent,
        type LineEnding
    } from '$lib/state/workbench/navigation/editor-text';
    import { useState } from '$lib/state/client/use';
    import { t } from '$lib/state/shared/words/text';

    const {
        selectors: { languages, paintLimit },
        ui: { codeTheme, theme, textScale }
    } = useState();

    type Props = {
        path: string;
        text: string;
        /** The tab instance, which names the editor's model. */
        instance?: string;
        /**
         * The line the tab was opened at, and zero for one opened at the file itself. It is acted
         * on once per line the tab is pointed at: every scroll after that is the reader's own.
         */
        line?: number;
        /**
         * The highlighter's name for the language the text is painted in, the file name's when the
         * tab hands none.
         */
        language?: string;
        /** What one step of Tab inserts, VS Code's default when the tab hands none. */
        indent?: Indent;
        ending?: LineEnding;
        /** Whether the reader wants the rendered half, for a file that has one. */
        rendered?: boolean;
        marks?: EditorMark[];
        blame?: EditorBlame[];
        /** Every change of the text, in the line ending the editor holds it in. */
        oninput: (value: string) => void;
        /** Where the caret is now, said on every move. */
        oncaret?: (caret: EditorCaret) => void;
        onmark?: (mark: EditorMark) => void;
        onblame?: (row: EditorBlame) => void;
        /** The editor's actions the palette offers, said once the editor has loaded. */
        onactions?: (actions: EditorAction[]) => void;
    };

    let {
        path,
        text,
        instance = 'tab',
        line = 0,
        language: chosen,
        indent = DEFAULT_INDENT,
        ending = 'LF',
        rendered = true,
        marks = [],
        blame = [],
        oninput,
        oncaret,
        onmark,
        onblame,
        onactions
    }: Props = $props();

    let editor: EditorHandle | undefined = $state();
    let box: HTMLDivElement | undefined = $state();
    /** The line already gone to, so a redraw does not take the reader back to it. */
    let placed = 0;
    /** The share of the row the editor holds. The rendered half takes what is left. */
    let share = $state(0.5);
    /** How far the editor is scrolled through its text, which is what the rendered half follows. */
    let fraction = $state(0);

    const language = $derived(chosen ?? languageOf(path, languages()));
    /** The language the editor opens the text under, plaintext past the paint limit. */
    const shown = $derived(shownLanguage(language, text, paintLimit()));
    /** Whether this file has a rendered half at all, which is what a Markdown file has. */
    const markdown = $derived(language === 'markdown');
    const split = $derived(markdown && rendered);
    /** The theme and the text size in force, which the editor's look is built from. */
    const look = $derived(`${theme()} ${String(textScale() ?? 1)}`);

    // Go to the line the tab was opened at, once per line it is pointed at.
    $effect(() => {
        const wanted = line;
        const held = editor;
        if (wanted === 0 || held === undefined) return;
        untrack(() => {
            if (placed === wanted) return;
            placed = wanted;
            held.perform({ kind: 'goto', line: wanted });
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
        const room = (box?.clientWidth ?? 0) - SASH_PX;
        if (room <= 0) return;
        share = Math.min(0.9, Math.max(0.1, share + delta / room));
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
                {path}
                {indent}
                {ending}
                {look}
                codeTheme={codeTheme()}
                {marks}
                {blame}
                {oncaret}
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
            />
        </div>
        {#if split}
            <Sash dir="row" {share} onresize={moved} onreset={reset} />
            <div class="rendered" style="flex: {1 - share} 1 0">
                <Preview {path} {text} {fraction} />
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
