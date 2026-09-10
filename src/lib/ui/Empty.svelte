<script lang="ts">
    // Layer 3, primitive. One line saying there is nothing here. The words are the view's, since
    // only the view knows what is missing and why; this gives them the same shape everywhere.

    import Glyph from './Glyph.svelte';

    type Props = {
        /** What is not here, already translated by the view. */
        message: string;
        /** A name in `glyphs:`, drawn before the message. */
        glyph?: string;
    };

    let { message, glyph }: Props = $props();
</script>

<p class="empty">
    {#if glyph !== undefined}
        <Glyph name={glyph} />
    {/if}
    <span class="message">{message}</span>
</p>

<style>
    .empty {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0;
        padding: 10px 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    /* The terminal shape: a shell comment. */
    :global(body.rice) .empty {
        font-family: var(--font-mono);
        font-size: var(--fs-xs);
    }

    :global(body.rice) .empty::before {
        content: '# ';
        opacity: 0.8;
    }
</style>
