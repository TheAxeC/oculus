<script lang="ts">
    // Layer 3, view partial of Source.svelte. The row under the editor: the save outcome while the
    // text may be written, and what the tab said, whether or not the text may be written: a refused
    // first Save, LaTeX action or Submit, drawn as an alert, and Submit's progress and success
    // lines, drawn as a status. Source.svelte draws the row when either has words and hands in the
    // save outcome only while the text may be written.

    import Glyph from '$lib/ui/display/Glyph.svelte';
    import type { SaidTone } from './said-tone';

    type Props = {
        /** The save outcome, empty when there is none to show. */
        message: string;
        /** Whether the save outcome is a refusal, which draws the cross glyph beside it. */
        failed: boolean;
        /** What the tab said under the editor, empty when it said nothing. */
        said: string;
        /** Whether `said` is a refusal or a status. */
        tone: SaidTone;
    };

    let { message, failed, said, tone }: Props = $props();
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
        {#if tone === 'refusal'}
            <span class="refused" role="alert">{said}</span>
        {:else}
            <span class="said" role="status">{said}</span>
        {/if}
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

    /* What a refused first Save, LaTeX action or Submit said: alert words at the line's end. */
    .refused {
        color: var(--c-red-txt);
        font-size: var(--fs-sm);
    }

    /* Submit's progress and success lines: the ordinary text colour at the end of the line. */
    .said {
        font-size: var(--fs-sm);
    }
</style>
