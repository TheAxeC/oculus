<script lang="ts">
    // Layer 3, partial of views/Source.svelte. One textarea over its escaped highlight mirror,
    // sharing font, padding, whitespace, and scroll position so the coloured text stays aligned.
    //
    // The mirror is painted by the same highlighter the code window uses, over the language the
    // file's own name gives it, so a file is coloured the same whether it is being written here or
    // shown read only; the token classes are the code window's and are coloured from the same six
    // hues of the palette.
    //
    // A Markdown file is written and read at once: the row under the toolbar splits into the editor
    // and the rendered half, with the handle between them, and the toolbar carries the control that
    // takes the rendered half away. A file of any other kind is the editor alone.
    //
    // Every file drawn here can be written: one the tab may not write is the code window under the
    // line that says why, so nothing here draws a Save that would be refused.

    import Preview from './Preview.svelte';
    import Sash from '$lib/ui/Sash.svelte';
    import TextArea from '$lib/ui/TextArea.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import { SASH_PX } from '$lib/ui/sash-size';
    import { PLAIN, codeHtml } from '$lib/state/languages';
    import { languageOf } from '$lib/state/fs';
    import { t } from '$lib/state/text';
    import { useState } from '$lib/state/use';

    const {
        selectors: { paintLimit }
    } = useState();

    type Props = {
        path: string;
        text: string;
        message?: string;
        /** Whether the reader wants the rendered half, for a file that has one. */
        rendered?: boolean;
        oninput: (value: string) => void;
        onsave: () => void;
        onrevert: () => void;
        /** Show or hide the rendered half. */
        onrendered: () => void;
    };

    let {
        path,
        text,
        message = '',
        rendered = true,
        oninput,
        onsave,
        onrevert,
        onrendered
    }: Props = $props();

    let mirror: HTMLPreElement | undefined = $state();
    let box: HTMLDivElement | undefined = $state();
    /** The share of the row the editor holds. The rendered half takes what is left. */
    let share = $state(0.5);
    /** How far the editor is scrolled through its text, which is what the rendered half follows. */
    let fraction = $state(0);

    /**
     * Whether the mirror is coloured: the file is under `editor.paint_limit_kb` of
     * config/behavior.yml. The mirror is painted again on every keystroke and the grammars cost more
     * than a frame past that size, so a larger file is written over escaped text. A cap the
     * configuration has not delivered yet is no cap to paint under, so those frames are plain too.
     */
    const coloured = $derived.by(() => {
        const limit = paintLimit();
        return limit !== null && text.length <= limit;
    });
    // The trailing newline keeps a last mirror line under the textarea's empty last line, which a
    // pre would otherwise drop, so the two scroll to the same height.
    const painted = $derived(codeHtml(text, coloured ? languageOf(path) : PLAIN) + '\n');
    /** Whether this file has a rendered half at all, which is what a Markdown file has. */
    const markdown = $derived(languageOf(path) === 'markdown');
    const split = $derived(markdown && rendered);

    function sync(event: Event): void {
        if (!(event.currentTarget instanceof HTMLTextAreaElement)) return;
        const area = event.currentTarget;
        if (mirror !== undefined) {
            mirror.scrollTop = area.scrollTop;
            mirror.scrollLeft = area.scrollLeft;
        }
        const room = area.scrollHeight - area.clientHeight;
        fraction = room > 0 ? area.scrollTop / room : 0;
    }

    /** A drag is pixels; what the two halves are laid out by is a share, so the row's width sets it. */
    function moved(delta: number): void {
        const room = (box?.clientWidth ?? 0) - SASH_PX;
        if (room <= 0) return;
        share = Math.min(0.9, Math.max(0.1, share + delta / room));
    }

    function reset(): void {
        share = 0.5;
    }
</script>

<div class="source-editor" data-source-editor={path}>
    <Toolbar label={t('source.edit')}>
        <ToolButton label={t('editor.save')} glyph="check" onclick={onsave} />
        <ToolButton
            label={t('editor.revert')}
            glyph={t('editor.revert_glyph')}
            onclick={onrevert}
        />
        {#if markdown}
            <ToolButton
                label={t('source.preview')}
                glyph={t('source.preview_glyph')}
                pressed={rendered}
                onclick={onrendered}
            />
        {/if}
        {#if message !== ''}
            <span class="message" aria-live="polite">{message}</span>
        {/if}
    </Toolbar>
    <div class="row" bind:this={box}>
        <div class="editor-wrap" style="flex: {split ? share : 1} 1 0">
            <!-- Keep pre and code on one line: a line break inside pre would enter the mirror's text. -->
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- highlight.js escapes the file text before it emits its own span classes -->
            <pre class="mirror" bind:this={mirror} aria-hidden="true"><code>{@html painted}</code
                ></pre>
            <div class="input">
                <TextArea
                    value={text}
                    label={path}
                    rows={24}
                    spellcheck={false}
                    {oninput}
                    onscroll={sync}
                />
            </div>
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
        grid-template-rows: auto minmax(0, 1fr);
        gap: 8px;
        height: 100%;
        min-height: 0;
    }

    .message {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
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
