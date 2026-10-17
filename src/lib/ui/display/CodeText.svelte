<script lang="ts">
    // Layer 3, primitive. One catalog line with its backticked words drawn as code, for a line that
    // names a key, a field or a file: the Settings view's descriptions, the Audit view's messages
    // and every Empty line. It draws the pieces ui/html.ts's codeSpans cuts the line into, a code
    // piece as `code` and a plain piece as text, with no element of its own around them, so the
    // line sits in its parent's layout as the bare text did. The pieces are Svelte markup rather
    // than HTML, so nothing here passes through the sanitiser and a code piece is escaped like any
    // other text. The code look is the manual's inline code in views/shared/prose/Markdown.svelte.

    import { codeSpans } from '../html';

    type Props = {
        /** The line, already translated or filled in, with its code in backticks. */
        text: string;
    };

    let { text }: Props = $props();

    const pieces = $derived(codeSpans(text));
</script>

{#each pieces as piece, index (index)}
    {#if piece.code}
        <code>{piece.text}</code>
    {:else}
        {piece.text}
    {/if}
{/each}

<style>
    code {
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        background: var(--chip);
        border-radius: var(--radius-sm);
        padding: 0 3px;
    }

    /* Over a wallpaper a code piece paints nothing under it, as the manual's inline code does,
       and is outlined in the line colour instead, so it is told from the words beside it, a rice
       theme's mono words among them. */
    :global(body.wall) code {
        background: transparent;
        outline: 1px solid var(--line);
        outline-offset: -1px;
    }
</style>
