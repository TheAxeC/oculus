<script lang="ts">
    // Layer 3, Present partial. One field of a slide as the reader sees it: Markdown with its
    // formulas typeset. Every field of every slide kind is drawn through this, so the sanitiser and
    // the typesetter are named in one place and a field is never drawn raw by mistake. A press on a
    // fragment link in a narrative (a `[TOC]` entry among them) is handled by the prose partial's
    // jump.ts, so a slide answers it as every other drawn document does.

    import { useHtmlMemo } from '$lib/ui/html/html';
    import { jump } from '$lib/views/shared/prose/jump';
    import { body, words } from '../markup';

    type Props = {
        /** The field as the file wrote it. */
        text: string;
        /** A whole document rather than one line: headings, lists and tables are rendered. */
        block?: boolean;
    };

    let { text, block = false }: Props = $props();

    /** The page's memo of drawings, so a field drawn again on any slide is not parsed again. */
    const memo = useHtmlMemo();

    const html = $derived(block ? body(text) : words(text, memo));
</script>

{#if block}
    <!-- The press is the links' own: each link is a keyboard stop whose Enter is a click, and the
         box only hears it bubble up, so the box itself takes no key and no focus. -->
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- body() sanitises the file's markup and leaves only KaTeX's own -->
    <div class="block" onclick={jump}>{@html html}</div>
{:else}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- words() sanitises the file's markup and leaves only KaTeX's own -->
    <span class="inline">{@html html}</span>
{/if}

<style>
    /* The span is a wrapper and nothing else, so a field keeps the box its caller gave it. */
    .inline {
        display: contents;
    }

    /* An image in the Markdown is no wider than the text's box and no taller than the room under
       the slide's heading at the factor the slide is drawn at (`--slide-room-height`,
       Slide.svelte), at its own proportions. */
    .block :global(img) {
        max-width: 100%;
        max-height: var(--slide-room-height, none);
        border-radius: var(--radius-sm);
    }

    .inline :global(.gap),
    .block :global(.gap) {
        padding: 0.15625cqw 0.625cqw;
        outline: 1px dashed var(--line);
        outline-offset: -1px;
        border-radius: var(--radius-sm);
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-small);
    }

    /* A table's lines take no room: each cell draws its right and bottom edges and the table its
       top and left, so two cells share one line. */
    .block :global(table) {
        border-collapse: collapse;
        font-size: var(--slide-fs-small);
        box-shadow: inset 1px 1px 0 0 var(--line);
    }

    .block :global(th),
    .block :global(td) {
        padding: 0.3125cqw 0.703125cqw;
        box-shadow: inset -1px -1px 0 0 var(--line);
    }

    /* A rule in the Markdown is a line with no height, so it takes no room beyond its margins. */
    .block :global(hr) {
        height: 0;
        border: 0;
        box-shadow: 0 0 0 0.5px var(--line);
    }

    /* A task list's checkbox follows the type of the line it stands on. */
    .inline :global(input[type='checkbox']),
    .block :global(input[type='checkbox']) {
        width: 1em;
        height: 1em;
        margin: 0 0.4em 0 0;
        font-size: inherit;
    }
</style>
