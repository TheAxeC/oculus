<script lang="ts">
    // Layer 3, view partial of Source.svelte. The row under the editor: the save outcome while the
    // text may be written, and what a refused first Save or a refused LaTeX action said, whether
    // or not the text may be written. Source.svelte draws the row when either has words and hands
    // in the save outcome only while the text may be written.

    import Glyph from '$lib/ui/display/Glyph.svelte';

    type Props = {
        /** The save outcome, empty when there is none to show. */
        message: string;
        /** Whether the save outcome is a refusal, which draws the cross glyph beside it. */
        failed: boolean;
        /** What a refused first Save or LaTeX action said, empty when nothing was refused. */
        said: string;
    };

    let { message, failed, said }: Props = $props();
</script>

<div class="note">
    {#if message !== ''}
        <span class="message" aria-live="polite">
            {#if failed}
                <Glyph name="cross" />
            {/if}
            {message}
        </span>
    {/if}
    {#if said !== ''}
        <span class="refused" role="alert">{said}</span>
    {/if}
</div>

<style>
    .note {
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: flex-end;
        padding: 2px 12px;
        border-top: 1px solid var(--line);
    }

    /* The save outcome: status words at the end of the line. */
    .message {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    /* What a refused first Save or LaTeX action said: alert words at the end of the line. */
    .refused {
        color: var(--c-red-txt);
        font-size: var(--fs-sm);
    }
</style>
