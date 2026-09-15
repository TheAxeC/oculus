<script lang="ts">
    // Layer 3, Present partial. One field of a slide as the reader sees it: Markdown with its
    // formulas typeset. Every field of every slide kind is drawn through this, so the sanitiser and
    // the typesetter are named in one place and a field is never drawn raw by mistake.

    import { body, words } from './markup';

    type Props = {
        /** The field as the file wrote it. */
        text: string;
        /** A whole document rather than one line: headings, lists and tables are rendered. */
        block?: boolean;
    };

    let { text, block = false }: Props = $props();

    const html = $derived(block ? body(text) : words(text));
</script>

{#if block}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- body() sanitises the file's markup and leaves only KaTeX's own -->
    <div class="block">{@html html}</div>
{:else}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- words() sanitises the file's markup and leaves only KaTeX's own -->
    <span class="inline">{@html html}</span>
{/if}

<style>
    /* The span is a wrapper and nothing else, so a field keeps the box its caller gave it. */
    .inline {
        display: contents;
    }

    .block :global(img) {
        max-width: 100%;
        border-radius: var(--radius-sm);
    }

    .block :global(table) {
        border-collapse: collapse;
        font-size: var(--fs-sm);
    }

    .block :global(th),
    .block :global(td) {
        padding: 4px 9px;
        border: 1px solid var(--line);
    }
</style>
