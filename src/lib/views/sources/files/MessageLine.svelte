<script lang="ts">
    // Layer 3, view partial of Files.svelte. The one message line of the Files view: a refusal (the
    // note, which a bookmark rename or removal answers on too) or the outcome of an ask to show a
    // path. It is laid over the foot of the view and takes no room of its own, so no row of the
    // tree moves when it shows or clears. Its own close control clears it; Escape in the view and
    // the next action that sets or clears the note clear it too, which Files.svelte does. A refusal
    // is drawn in the error box; any other message is one row, the words on the left and the close
    // control on the right, so the line covers one row of the tree.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import CodeText from '$lib/ui/display/text/CodeText.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** What the line says; nothing is drawn for the empty text. */
        message: string;
        /** Whether it is a refusal, drawn in the error box. */
        error?: boolean;
        /** The close control was pressed. */
        onclose: () => void;
    };

    let { message, error = false, onclose }: Props = $props();
</script>

{#snippet closeControl()}
    <ToolButton
        label={t('files.message_close')}
        glyph={t('files.message_close_glyph')}
        compact
        small
        onclick={onclose}
    />
{/snippet}

{#if message !== ''}
    <div class="anchor">
        <div class="line" data-fs-message aria-live="polite">
            {#if error}
                <Empty error {message} action={closeControl} />
            {:else}
                <p class="said">
                    <span class="words"><CodeText text={message} /></span>
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render closeControl()}
                </p>
            {/if}
        </div>
    </div>
{/if}

<style>
    /* A zero-height block at the end of the view, pushed to the pane's foot when the rows are
       shorter than the pane and stuck to the foot of the scrolled pane when they are longer: the
       line hangs from it upward and over the rows, and the flow of the view above is the same with
       it or without. The pane's body keeps 10px of padding below the rows
       (ui/frame/Pane.svelte), and both offsets take the line over it to the pane's edge. */
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
        background: var(--panel);
    }

    .said {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        padding: 4px 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    .words {
        flex: 1 1 auto;
        min-width: 0;
        overflow-wrap: anywhere;
    }
</style>
