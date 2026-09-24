<script lang="ts">
    // Layer 3, partial of views/sources/source/Source.svelte. One textarea over its escaped
    // highlight mirror, sharing font, padding, whitespace, and scroll position so the coloured text
    // stays aligned.
    //
    // The mirror is painted by the same highlighter the code window uses, over the language the tab
    // hands it (the one chosen from the status bar, or the file name's), so a file is coloured the
    // same whether it is being written here or shown read only; the token classes are the code
    // window's and are coloured from the same six hues of the palette.
    //
    // It reports where the caret is on every move, for the status bar, and moves the caret to a
    // line the status bar asks for. Tab inserts one step of the tab's indentation; Escape and then
    // Tab moves the focus on as Tab does anywhere else, so the keyboard is never held here.
    //
    // A Markdown file is written and read at once: the row splits into the editor and the rendered
    // half, with the handle between them. A file of any other kind is the editor alone.
    //
    // The controls that act on the text (Save, Revert and the rendered half) are the pane's own
    // bar, which Source.svelte draws, so the tab spends one row on its controls and the editor
    // none.

    import { untrack } from 'svelte';
    import Preview from './Preview.svelte';
    import Sash from '$lib/ui/frame/Sash.svelte';
    import TextArea from '$lib/ui/forms/TextArea.svelte';
    import { SASH_PX } from '$lib/ui/frame/sash-size';
    import { PLAIN, codeHtml } from '$lib/state/words/languages';
    import { lineStart } from '$lib/state/sessions/source.svelte';
    import { languageOf } from '$lib/state/sources/fs';
    import {
        DEFAULT_INDENT,
        caretOf,
        indentUnit,
        type Caret,
        type Indent
    } from '$lib/state/workbench/navigation/editor-text';
    import { useState } from '$lib/state/client/use';

    const {
        selectors: { paintLimit }
    } = useState();

    type Props = {
        path: string;
        text: string;
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
        /** A line the status bar asked the caret to go to, numbered so each ask moves it once. */
        jump?: { line: number; seq: number } | null;
        /** Whether the reader wants the rendered half, for a file that has one. */
        rendered?: boolean;
        oninput: (value: string) => void;
        /** Where the caret is now, said on every move. */
        oncaret?: (caret: Caret) => void;
    };

    let {
        path,
        line = 0,
        text,
        language: chosen,
        indent = DEFAULT_INDENT,
        jump = null,
        rendered = true,
        oninput,
        oncaret
    }: Props = $props();

    let mirror: HTMLPreElement | undefined = $state();
    let box: HTMLDivElement | undefined = $state();
    /** The editor's own row, which is where the textarea the line is scrolled to is found. */
    let wrap: HTMLDivElement | undefined = $state();
    /** The line already scrolled to, so a redraw does not take the reader back to it. */
    let placed = $state(0);
    /** The status bar's ask already acted on, so a redraw does not act on it again. */
    let jumped = $state(0);
    /** Whether Escape was the last key, which lets the next Tab move the focus on. */
    let escaped = false;
    /** The share of the row the editor holds. The rendered half takes what is left. */
    let share = $state(0.5);
    /** How far the editor is scrolled through its text, which is what the rendered half follows. */
    let fraction = $state(0);

    /**
     * Whether the mirror is coloured: the file is under `editor.paint_limit_kb` of
     * config/behavior.yml. The mirror is painted again on every keystroke and the grammars cost
     * more than a frame past that size, so a larger file is written over escaped text. A cap the
     * configuration has not delivered yet is no cap to paint under, so those frames are plain too.
     */
    const coloured = $derived.by(() => {
        const limit = paintLimit();
        return limit !== null && text.length <= limit;
    });
    const language = $derived(chosen ?? languageOf(path));
    /**
     * The text as the textarea holds it, every line ending a line feed, which is what the mirror
     * paints and every offset into the textarea counts.
     */
    const shown = $derived(text.replace(/\r\n/g, '\n'));
    // The trailing newline keeps a last mirror line under the textarea's empty last line, which a
    // pre would otherwise drop, so the two scroll to the same height.
    const painted = $derived(codeHtml(shown, coloured ? language : PLAIN) + '\n');
    /** Whether this file has a rendered half at all, which is what a Markdown file has. */
    const markdown = $derived(language === 'markdown');
    const split = $derived(markdown && rendered);

    /** Put the cursor on the line the tab was opened at and bring it into view. */
    $effect(() => {
        const wanted = line;
        const held = shown;
        if (wanted === 0 || held === '') return;
        untrack(() => {
            if (placed === wanted || area() === null) return;
            placed = wanted;
            place(held, wanted);
        });
    });

    // A line the status bar asked for, through the palette's go-to-line: acted on once per ask.
    $effect(() => {
        const asked = jump;
        const held = shown;
        if (asked === null) return;
        untrack(() => {
            if (jumped === asked.seq || area() === null) return;
            jumped = asked.seq;
            place(held, asked.line);
        });
    });

    // The caret said on every move: a key, a click, a selection, typing, and the focus coming back.
    // The document's selectionchange is heard too, since a selection moved by the keyboard fires
    // nothing on the textarea in every browser.
    $effect(() => {
        const field = area();
        if (field === null) return;
        const report = (): void => {
            oncaret?.(
                caretOf(
                    field.value,
                    field.selectionStart,
                    field.selectionEnd,
                    field.selectionDirection === 'backward'
                )
            );
        };
        const moved = (): void => {
            if (document.activeElement === field) report();
        };
        const events = ['keyup', 'mouseup', 'input', 'select', 'focus'] as const;
        for (const name of events) field.addEventListener(name, report);
        document.addEventListener('selectionchange', moved);
        return () => {
            for (const name of events) field.removeEventListener(name, report);
            document.removeEventListener('selectionchange', moved);
        };
    });

    /** The editor's textarea, once it is drawn. */
    function area(): HTMLTextAreaElement | null {
        const found = wrap?.querySelector('textarea');
        return found instanceof HTMLTextAreaElement ? found : null;
    }

    /**
     * Put the caret at the start of one line and bring it into the middle of the view. The mirror
     * is moved with the textarea, as a scroll of the reader's own moves it: the two hold the same
     * text at the same height, so one scroll position serves both.
     */
    function place(held: string, wanted: number): void {
        const field = area();
        if (field === null) return;
        const at = lineStart(held, wanted);
        field.focus();
        field.setSelectionRange(at, at);
        const step = rowHeight(field);
        field.scrollTop = Math.max(0, (rowOf(held, at) - 1) * step - field.clientHeight / 2);
        if (mirror !== undefined) mirror.scrollTop = field.scrollTop;
        oncaret?.(caretOf(field.value, at, at, false));
    }

    /**
     * Tab inserts one step of the tab's indentation where the caret is, over a selection. Escape
     * first lets it move the focus on, and a Tab held with a modifier is the browser's.
     */
    function keys(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            escaped = true;
            return;
        }
        const leave = escaped;
        escaped = false;
        if (event.key !== 'Tab' || leave) return;
        if (event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) return;
        const field = event.currentTarget;
        if (!(field instanceof HTMLTextAreaElement)) return;
        event.preventDefault();
        field.setRangeText(indentUnit(indent), field.selectionStart, field.selectionEnd, 'end');
        oninput(field.value);
        oncaret?.(caretOf(field.value, field.selectionStart, field.selectionEnd, false));
    }

    /** One painted line's height, which the mirror and the textarea share. */
    function rowHeight(field: HTMLTextAreaElement): number {
        const said = Number.parseFloat(getComputedStyle(field).lineHeight);
        if (Number.isFinite(said) && said > 0) return said;
        const size = Number.parseFloat(getComputedStyle(field).fontSize);
        return Number.isFinite(size) && size > 0 ? size * 1.45 : 18;
    }

    /**
     * Which line an offset sits on, counting from one, so a line past the end lands on the last.
     */
    function rowOf(held: string, at: number): number {
        return held.slice(0, at).split('\n').length;
    }

    function sync(event: Event): void {
        if (!(event.currentTarget instanceof HTMLTextAreaElement)) return;
        const field = event.currentTarget;
        if (mirror !== undefined) {
            mirror.scrollTop = field.scrollTop;
            mirror.scrollLeft = field.scrollLeft;
        }
        const room = field.scrollHeight - field.clientHeight;
        fraction = room > 0 ? field.scrollTop / room : 0;
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
>
    <div class="row" bind:this={box}>
        <div class="editor-wrap" bind:this={wrap} style="flex: {split ? share : 1} 1 0">
            <!-- Keep pre and code on one line: a line break inside pre would enter the mirror's
                 text. -->
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- highlight.js escapes the file text before it emits its own span classes -->
            <pre class="mirror" bind:this={mirror} aria-hidden="true"><code>{@html painted}</code
                ></pre>
            <div class="input">
                <TextArea
                    value={shown}
                    label={path}
                    rows={24}
                    spellcheck={false}
                    {oninput}
                    onkeydown={keys}
                    onscroll={sync}
                />
            </div>
        </div>
        {#if split}
            <Sash dir="row" {share} onresize={moved} onreset={reset} />
            <div class="rendered" style="flex: {1 - share} 1 0">
                <Preview {path} text={shown} {fraction} />
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
        position: relative;
        min-width: 0;
        min-height: 240px;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--chip);
    }

    :global(body.wall) .editor-wrap {
        background: color-mix(in srgb, var(--chip) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .mirror,
    .input {
        position: absolute;
        inset: 0;
        box-sizing: border-box;
        margin: 0;
    }

    .mirror {
        overflow: hidden;
        padding: 8px;
        color: var(--ink-txt, var(--ink));
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        line-height: 1.45;
        white-space: pre;
        pointer-events: none;
    }

    .input :global(.area) {
        display: block;
        width: 100%;
        height: 100%;
        resize: none;
        overflow: auto;
        border: 0;
        border-radius: 0;
        background: transparent;
        color: transparent;
        caret-color: var(--ink-txt, var(--ink));
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        line-height: 1.45;
        padding: 8px;
        white-space: pre;
    }

    .mirror :global(.hljs-keyword),
    .mirror :global(.hljs-built_in),
    .mirror :global(.hljs-literal),
    .mirror :global(.hljs-type),
    .mirror :global(.hljs-selector-tag) {
        color: var(--c-code-keyword-txt);
    }

    .mirror :global(.hljs-string),
    .mirror :global(.hljs-regexp),
    .mirror :global(.hljs-addition),
    .mirror :global(.hljs-quote) {
        color: var(--c-code-string-txt);
    }

    .mirror :global(.hljs-number),
    .mirror :global(.hljs-symbol),
    .mirror :global(.hljs-bullet),
    .mirror :global(.hljs-deletion) {
        color: var(--c-code-number-txt);
    }

    .mirror :global(.hljs-title),
    .mirror :global(.hljs-name),
    .mirror :global(.hljs-attr),
    .mirror :global(.hljs-attribute),
    .mirror :global(.hljs-section),
    .mirror :global(.hljs-selector-id),
    .mirror :global(.hljs-selector-class) {
        color: var(--c-code-name-txt);
    }

    .mirror :global(.hljs-meta),
    .mirror :global(.hljs-doctag),
    .mirror :global(.hljs-tag),
    .mirror :global(.hljs-params),
    .mirror :global(.hljs-punctuation),
    .mirror :global(.hljs-variable),
    .mirror :global(.hljs-template-variable) {
        color: var(--c-code-meta-txt);
    }

    .mirror :global(.hljs-comment) {
        color: var(--c-code-comment-txt);
    }

    .mirror :global(.hljs-strong) {
        font-weight: 700;
    }

    .mirror :global(.hljs-emphasis) {
        font-style: italic;
    }
</style>
