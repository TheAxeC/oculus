<script lang="ts">
    // Layer 3, shared view. One read-only code window: the line numbers down the left and the
    // file's text painted beside them. The source tab draws it instead of an editor for a file it
    // holds but may not write, one this machine's mode locks and one too long for the tab to hold
    // whole, and the Config view draws each configuration file it opens with it, so a file is
    // painted in the same hues wherever it is read. It sits under views/shared because two views
    // draw it and a view may not import another view's partial.
    //
    // The two columns scroll as one box rather than two synchronised ones, so a long line moves the
    // text under fixed numbers and nothing has to be kept in step by hand. The source tab hands its
    // own gutter (Gutter.svelte) in place of the plain numbers, which draws them with the quick
    // diff marks and the blame, and is told every scroll of the text so its lines follow. The
    // highlighter's token classes are coloured by themes/code.css from the palette's own code hues,
    // the one stylesheet a painted Markdown block is coloured by too, so the window follows the
    // theme the reader picked.

    import type { Snippet } from 'svelte';
    import { codeHtml, lineNumbers } from '$lib/state/shared/words/languages';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The file's text, already cut at the read's limit by the store. */
        text: string;
        /** The highlighter's name for the language, from the file's own extension. */
        language: string;
        /** The file's path, which names the window for a reader on the keyboard. */
        path: string;
        /** The tab's own gutter, drawn in place of the plain line numbers. */
        gutter?: Snippet;
        /** How far the text is scrolled down, said on every scroll. */
        onscrolled?: (top: number) => void;
    };

    let { text, language, path, gutter, onscrolled }: Props = $props();

    function scrolled(event: Event): void {
        if (event.currentTarget instanceof HTMLElement) onscrolled?.(event.currentTarget.scrollTop);
    }

    const painted = $derived(codeHtml(text, language));
    const numbers = $derived(lineNumbers(text));
</script>

<div class="code" data-fs-code={path} data-language={language}>
    {#if gutter}
        {@render gutter()}
    {:else}
        <pre class="gutter" aria-hidden="true">{numbers.join('\n')}</pre>
    {/if}
    <!-- Keep pre and code on one line: a line break inside pre would enter the drawn text. -->
    <!-- eslint-disable svelte/no-at-html-tags -- highlight.js escapes the file text before it emits its own span classes -->
    <pre class="text" role="region" aria-label={t('source.code', path)} onscroll={scrolled}><code
            >{@html painted}</code
        ></pre>
    <!-- eslint-enable svelte/no-at-html-tags -->
</div>

<style>
    .code {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        height: 100%;
        min-height: 0;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--chip);
        overflow: hidden;
    }

    :global(body.wall) .code {
        background: color-mix(in srgb, var(--chip) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .gutter,
    .text {
        margin: 0;
        padding: 8px;
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        line-height: 1.45;
        white-space: pre;
    }

    /* The numbers do not scroll with the text sideways, and are never selected with it. */
    .gutter {
        border-right: 1px solid var(--line);
        color: var(--muted-txt, var(--muted));
        text-align: right;
        overflow: hidden;
        user-select: none;
    }

    .text {
        color: var(--ink-txt, var(--ink));
        overflow: auto;
    }
</style>
