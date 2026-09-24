<script lang="ts">
    // Layer 3, shared view partial. One fetched Markdown document drawn as prose: the answer is
    // still being read, it failed, or it is the HTML the server rendered.
    //
    // The HTML is a file on disk turned into markup by marked, so it is drawn through ui/html.ts's
    // sanitise and holds only what that profile allows. The words for the two states the document
    // is not in come from the view that owns the document, since each of them names what it is
    // reading.

    import { sanitise } from '$lib/ui/html';
    import type { DocState } from '$lib/state/system/docs.svelte';

    type Props = {
        /** What state/system/docs.svelte.ts holds for this document. */
        doc: DocState;
        /** The line drawn while the first answer is still to come. */
        loading: string;
        /** The line drawn when the read failed, already carrying the reason. */
        failed: string;
    };

    let { doc, loading, failed }: Props = $props();
</script>

{#if doc.error !== ''}
    <p class="note">{failed}</p>
{:else if doc.loading}
    <p class="note">{loading}</p>
{:else}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- the sanitiser writes this -->
    <div class="doc">{@html sanitise(doc.html)}</div>
{/if}

<style>
    .note {
        margin: 0;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }

    /* The document. The Markdown reaches the DOM as HTML, so every rule below is :global. */
    .doc {
        font-size: var(--fs-md);
        color: var(--ink-txt, var(--ink));
        overflow-wrap: anywhere;
    }

    .doc :global(h1),
    .doc :global(h2),
    .doc :global(h3),
    .doc :global(h4) {
        margin: 12px 0 4px;
        color: var(--ink-txt, var(--ink));
    }

    .doc :global(h1) {
        font-size: var(--fs-3xl);
    }

    .doc :global(h2) {
        font-size: var(--fs-2xl);
    }

    .doc :global(h3) {
        font-size: var(--fs-xl);
    }

    .doc :global(h4) {
        font-size: var(--fs-md);
    }

    .doc :global(p),
    .doc :global(ul),
    .doc :global(ol) {
        margin: 6px 0;
    }

    .doc :global(a) {
        color: var(--accent-txt, var(--accent));
    }

    .doc :global(img) {
        max-width: 100%;
    }

    .doc :global(code) {
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        background: var(--chip);
        border-radius: var(--radius-sm);
        padding: 0 3px;
    }

    .doc :global(pre) {
        overflow-x: auto;
        padding: 8px;
        background: var(--chip);
        border-radius: var(--radius-sm);
    }

    /* Over a wallpaper the document is drawn on a translucent surface already: the box of a view
       that draws it asks for the tint, and the source preview frames it in one. A code span or
       block inside it paints nothing in turn, since a second layer reads as a nearly solid one,
       and a blur behind a span that wraps covers the whole box around both of its halves, which
       blurs the prose between them. */
    :global(body.wall) .doc :global(code) {
        background: transparent;
    }

    :global(body.wall) .doc :global(pre) {
        background: transparent;
    }

    .doc :global(pre code) {
        background: none;
        padding: 0;
    }

    /* A table wider than the pane scrolls inside its own box rather than widening the document. */
    .doc :global(table) {
        display: block;
        overflow-x: auto;
        border-collapse: collapse;
        font-size: var(--fs-md);
    }

    .doc :global(th),
    .doc :global(td) {
        border: 1px solid var(--line);
        padding: 3px 6px;
        text-align: left;
    }

    .doc :global(blockquote) {
        margin: 6px 0;
        padding-left: 8px;
        border-left: 2px solid var(--line);
        color: var(--muted-txt, var(--muted));
    }
</style>
