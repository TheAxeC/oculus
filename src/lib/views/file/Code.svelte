<script lang="ts">
    // Layer 3, partial of views/File.svelte. One read-only code window: the line numbers down the
    // left and the file's text painted beside them.
    //
    // The two columns scroll as one box rather than two synchronised ones, so a long line moves the
    // text under fixed numbers and nothing has to be kept in step by hand. The highlighter's token
    // classes are coloured from the palette's own code hues, so the window follows the theme the
    // reader picked instead of carrying a stylesheet of its own.

    import { codeHtml, lineNumbers } from '$lib/state/languages';
    import { t } from '$lib/state/text';

    type Props = {
        /** The file's text, already cut at the window's limit by the store. */
        text: string;
        /** The highlighter's name for the language, from the file's own extension. */
        language: string;
        /** The file's path, which names the window for a reader on the keyboard. */
        path: string;
    };

    let { text, language, path }: Props = $props();

    const painted = $derived(codeHtml(text, language));
    const numbers = $derived(lineNumbers(text));
</script>

<div class="code" data-fs-code={path} data-language={language}>
    <pre class="gutter" aria-hidden="true">{numbers.join('\n')}</pre>
    <!-- Keep pre and code on one line: a line break inside pre would enter the drawn text. -->
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- highlight.js escapes the file text before it emits its own span classes -->
    <pre class="text" role="region" aria-label={t('file.code', path)}><code>{@html painted}</code
        ></pre>
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

    .text :global(.hljs-keyword),
    .text :global(.hljs-built_in),
    .text :global(.hljs-literal),
    .text :global(.hljs-type),
    .text :global(.hljs-selector-tag) {
        color: var(--c-code-keyword-txt);
    }

    .text :global(.hljs-string),
    .text :global(.hljs-regexp),
    .text :global(.hljs-addition),
    .text :global(.hljs-quote) {
        color: var(--c-code-string-txt);
    }

    .text :global(.hljs-number),
    .text :global(.hljs-symbol),
    .text :global(.hljs-bullet),
    .text :global(.hljs-deletion) {
        color: var(--c-code-number-txt);
    }

    .text :global(.hljs-title),
    .text :global(.hljs-name),
    .text :global(.hljs-attr),
    .text :global(.hljs-attribute),
    .text :global(.hljs-section),
    .text :global(.hljs-selector-id),
    .text :global(.hljs-selector-class) {
        color: var(--c-code-name-txt);
    }

    .text :global(.hljs-meta),
    .text :global(.hljs-doctag),
    .text :global(.hljs-tag),
    .text :global(.hljs-params),
    .text :global(.hljs-punctuation),
    .text :global(.hljs-variable),
    .text :global(.hljs-template-variable) {
        color: var(--c-code-meta-txt);
    }

    .text :global(.hljs-comment) {
        color: var(--c-code-comment-txt);
    }

    .text :global(.hljs-strong) {
        font-weight: 700;
    }

    .text :global(.hljs-emphasis) {
        font-style: italic;
    }
</style>
