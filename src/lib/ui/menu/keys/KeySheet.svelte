<script lang="ts">
    // Layer 3, primitive. A modal reference sheet on the modal ground ui/frame/Modal.svelte draws.
    // Its words arrive translated and its only event closes it: Escape, a press on the ground, and
    // a press anywhere in the compact reference panel. The focus moves into the sheet while it
    // shows, stays inside it, and goes back where it was when it closes.

    import { Dialog } from 'bits-ui';
    import Modal from '../../frame/Modal.svelte';
    import { sheetRows } from '$lib/ui/menu/keys/key-rows';
    type Props = {
        title: string;
        hint: string;
        rows: string;
        onclose: () => void;
    };

    let { title, hint, rows, onclose }: Props = $props();
    const entries = $derived(sheetRows(rows));
</script>

<Modal level="sheet" {onclose}>
    {#snippet children(props)}
        <!-- The panel is the pointer path out of the sheet as the ground is: a press anywhere on it
             closes it, and Escape is the keyboard's. -->
        <div {...props} class="sheet" onclick={onclose}>
            <header>
                <Dialog.Title>
                    {#snippet child({ props: heading })}
                        <h2 {...heading}>{title}</h2>
                    {/snippet}
                </Dialog.Title>
                <span>{hint}</span>
            </header>
            <div class="rows">
                {#each entries as entry (`${entry.key}:${entry.meaning}`)}
                    <div class="row">
                        <kbd>{entry.key}</kbd>
                        <span>{entry.meaning}</span>
                    </div>
                {/each}
            </div>
        </div>
    {/snippet}
</Modal>

<style>
    .sheet {
        position: relative;
        width: min(34rem, 100%);
        max-height: min(42rem, calc(100vh - 32px));
        overflow: auto;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--panel);
        color: var(--ink-txt, var(--ink));
        box-shadow: var(--shadow);
    }

    /* The sheet floats over a pane, so it keeps more of its colour than the pane does. */
    :global(body.wall) .sheet {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 12px;
        border-bottom: 1px solid var(--line);
    }

    h2 {
        margin: 0;
        font-size: var(--fs-xl);
    }

    header span {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .rows {
        display: grid;
        gap: 1px;
        padding: 8px 12px 12px;
    }

    .row {
        display: grid;
        grid-template-columns: minmax(9rem, 1fr) 2fr;
        gap: 12px;
        align-items: baseline;
        padding: 4px 0;
    }

    kbd {
        color: var(--accent-txt, var(--accent));
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        font-weight: 700;
    }

    .row span {
        font-size: var(--fs-md);
    }

    :global(body.rice) .sheet {
        border-radius: var(--radius-sm);
        box-shadow: none;
    }
</style>
