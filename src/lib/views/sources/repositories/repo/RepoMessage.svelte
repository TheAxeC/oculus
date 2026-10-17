<script lang="ts">
    // Layer 3, partial of views/sources/repositories/repo/Repo.svelte. The message line of one
    // repository, laid over the foot of the pane: while a write is in flight on the root it says
    // what runs, the words of the action (Committing..., Pushing...) or Working for an action that
    // says none, with Cancel; after the write it says what the write answered, with a close
    // control that clears the answer, and the next write replaces it. It takes no room of its own,
    // so no row moves under the pointer when it shows or clears.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        root: string;
    };

    let { root }: Props = $props();

    const { repositories } = useState();

    const busy = $derived(repositories.busy(root));
    const outcome = $derived(repositories.outcome(root));
</script>

{#if busy || outcome !== ''}
    <div class="anchor">
        <div class="line" data-repo-message aria-live="polite">
            {#if busy}
                <p class="none">{repositories.busyWords(root)}</p>
                {#if !repositories.suggesting(root)}
                    <span class="act">
                        <ToolButton
                            small
                            label={t('git.cancel')}
                            title={t('git.cancel_title')}
                            onclick={() => void repositories.cancel(root)}
                        />
                    </span>
                {/if}
            {:else}
                <p class="outcome">{outcome}</p>
                <span class="act">
                    <ToolButton
                        label={t('repositories.outcome_close')}
                        glyph={t('repositories.outcome_close_glyph')}
                        compact
                        small
                        onclick={() => repositories.clearOutcome(root)}
                    />
                </span>
            {/if}
        </div>
    </div>
{/if}

<style>
    /* A zero-height block at the end of the section, pushed to the pane's foot when the rows are
       shorter than the pane and stuck to the foot of the scrolled pane when they are longer: the
       line hangs from it upward and over the rows, so no row moves when it shows or clears. The
       pane's body keeps 10px of padding below the rows (ui/frame/Pane.svelte), and both offsets
       take the line over it to the pane's edge. */
    .anchor {
        position: sticky;
        bottom: -10px;
        z-index: 2;
        height: 0;
        margin-top: auto;
        margin-bottom: -10px;
    }

    .line {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 0;
        background: var(--panel);
    }

    .none {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    .outcome {
        flex: 1 1 auto;
        min-width: 0;
        margin: 0;
        font-size: var(--fs-md);
        overflow-wrap: anywhere;
    }

    /* The line's button keeps its own width, so in a narrow pane the sentence wraps beside it and
       the button stays inside the line. */
    .act {
        flex: none;
    }
</style>
