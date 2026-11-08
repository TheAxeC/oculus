<script lang="ts">
    // Layer 3, shared view. One long field of a hub's data (a note, a description, a next action)
    // as its Markdown, on a card and on a record's page: its paragraphs, lists and quotes, written
    // once here rather than at every site that draws a field. The HTML is ui/html/html.ts's
    // fieldMarkdown, which sanitises it, and its formulas are typeset once KaTeX is in
    // (views/shared/latex/card-math.svelte.ts).
    //
    // It takes the size, weight and colour of the box it sits in, and a field of one paragraph is
    // as tall as its words alone, so a box that held the words directly holds this and looks the
    // same. The box is a block element, never a `<p>`, since a block cannot stand inside one.
    // Nothing widens the card's column: a long word breaks, and a code block, a table, a formula
    // and an image stay inside it. The gap between blocks is the variable `--field-gap`, which
    // Clamp.svelte beside this file turns off while it cuts the text, so the cut falls on whole
    // lines.
    //
    // A press on a link opens the link and goes no further, as in LinkedText.svelte, so the row or
    // card the field sits in does not take the press as its own, and a link with no tab of its own
    // (a relative address, a fragment) is not followed, since a field has no folder or document to
    // read the address against. It is listened for here, since the link is the sanitiser's markup
    // and carries no handler of its own.

    import { fieldMarkdown, useHtmlMemo } from '$lib/ui/html/html';
    import { createCardMath } from '$lib/views/shared/latex/card-math.svelte';

    type Props = {
        /** The field as the data holds it. */
        text: string;
    };

    let { text }: Props = $props();

    const cardMath = createCardMath();
    const memo = useHtmlMemo();

    /**
     * Keep a press on a link inside the field from reaching what the field sits in, and from
     * following a link the sanitiser gave no tab of its own.
     */
    function linksKeepPress(node: HTMLElement): () => void {
        const stop = (event: MouseEvent): void => {
            const link = event.target instanceof Element ? event.target.closest('a') : null;
            if (link === null) return;
            event.stopPropagation();
            if (!link.hasAttribute('target')) event.preventDefault();
        };
        node.addEventListener('click', stop);
        return () => {
            node.removeEventListener('click', stop);
        };
    }
</script>

<div class="field" {@attach linksKeepPress}>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- fieldMarkdown sanitises what it renders -->
    {@html fieldMarkdown(text, cardMath(text), memo)}
</div>

<style>
    /* The HTML reaches the page as markup, so every rule under the root is :global. */
    .field {
        min-width: 0;
        overflow-wrap: anywhere;
    }

    /* A block is spaced from the one before it and the first of its parent has no gap, so a field
       of one paragraph has no margin at all. A list item has none of its own. */
    .field :global(:where(p, ul, ol, blockquote, pre, table, h1, h2, h3, h4, h5, h6)) {
        margin: var(--field-gap, 0.45em) 0 0;
    }

    .field :global(:where(p, ul, ol, blockquote, pre, table, h1, h2, h3, h4, h5, h6):first-child) {
        margin-top: 0;
    }

    .field :global(li) {
        margin: 0;
    }

    .field :global(ul),
    .field :global(ol) {
        padding-left: 1.25em;
    }

    /* A heading is the field's text in bold, so a `#` in a note never outgrows the card's title. */
    .field :global(:where(h1, h2, h3, h4, h5, h6)) {
        font-size: 1em;
        font-weight: 700;
    }

    .field :global(a) {
        color: var(--accent-txt, var(--accent));
    }

    /* The look of a code piece, as ui/display/text/CodeText.svelte draws one. */
    .field :global(code) {
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        background: var(--chip);
        border-radius: var(--radius-sm);
        padding: 0 3px;
    }

    /* Over a wallpaper a code piece paints nothing under it and is outlined in the line colour. */
    :global(body.wall) .field :global(code) {
        background: transparent;
        outline: 1px solid var(--line);
        outline-offset: -1px;
    }

    :global(body.wall) .field :global(pre code) {
        outline: none;
    }

    .field :global(pre code) {
        background: none;
        padding: 0;
    }

    .field :global(blockquote) {
        padding-left: 8px;
        border-left: 2px solid var(--accent);
    }

    /* A code block, a table and a display formula scroll inside the card, and an image is at most
       as wide as the card, so none of them widens the column. */
    .field :global(pre) {
        overflow-x: auto;
        padding: 8px;
        background: var(--chip);
        border-radius: var(--radius-sm);
    }

    :global(body.wall) .field :global(pre) {
        background: transparent;
    }

    .field :global(table) {
        display: block;
        max-width: 100%;
        overflow-x: auto;
        border-collapse: collapse;
    }

    /* A cell breaks at spaces and not inside a word, so no column shrinks to one letter. */
    .field :global(th),
    .field :global(td) {
        border: 1px solid var(--line);
        padding: 3px 6px;
        text-align: left;
        overflow-wrap: normal;
    }

    .field :global(.katex-display) {
        overflow-x: auto;
        overflow-y: hidden;
    }

    .field :global(img) {
        max-width: 100%;
    }
</style>
