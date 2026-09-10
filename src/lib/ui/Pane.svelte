<script lang="ts">
    // Layer 3, primitive. The box a view fills: a header row with the view's title and its controls,
    // and a body that scrolls. A view renders this at its root, so the shell's pane box is filled
    // edge to edge and the scrolling happens inside the view rather than around it.

    import type { Snippet } from 'svelte';

    type Props = {
        /** The view's own words, already translated. */
        title: string;
        /** The controls at the right of the header, usually a Toolbar. */
        toolbar?: Snippet;
        /** The body. */
        children?: Snippet;
    };

    let { title, toolbar, children }: Props = $props();
</script>

<section class="pane">
    <header>
        <h2 class="title">{title}</h2>
        {#if toolbar}
            <div class="tools">{@render toolbar()}</div>
        {/if}
    </header>
    <div class="body">
        {#if children}
            {@render children()}
        {/if}
    </div>
</section>

<style>
    .pane {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
        box-sizing: border-box;
        background: var(--panel);
    }

    header {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
        padding: 6px 12px;
        border-bottom: 1px solid var(--line);
    }

    .title {
        margin: 0;
        font-size: var(--fs-md);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted-txt, var(--muted));
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .tools {
        margin-left: auto;
        display: flex;
        align-items: center;
        min-width: 0;
    }

    /* The one thing that scrolls: min-height zero is what lets it, inside a column flex box. */
    .body {
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
        overflow: auto;
        padding: 10px 12px;
        box-sizing: border-box;
    }

    /* The terminal shape: the header row is a titlebar strip on the chip colour. */
    :global(body.rice) header {
        background: var(--chip);
    }

    :global(body.rice) .title {
        text-transform: none;
        letter-spacing: 0.06em;
    }
</style>
