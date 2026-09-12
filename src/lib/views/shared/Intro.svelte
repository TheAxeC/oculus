<script lang="ts">
    // Layer 3, shared view partial. The bordered block directly under a pane title. It accepts trusted catalog HTML, optional additional catalog lines, or structured content such as a status chip.

    import type { Snippet } from 'svelte';

    type Props = {
        html?: string;
        lines?: string[];
        actions?: Snippet;
        children?: Snippet;
    };

    let { html, lines, actions, children }: Props = $props();
</script>

<div class="intro">
    <div class="content">
        {#if lines !== undefined}
            {#each lines as line, index (`${index}:${line}`)}
                <p>{@html line}</p>
            {/each}
        {:else if html !== undefined}
            {@html html}
        {:else if children}
            {@render children()}
        {/if}
    </div>
    {#if actions}
        <div class="actions">{@render actions()}</div>
    {/if}
</div>

<style>
    .intro {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin: 0 0 10px;
        padding: 8px 10px;
        border: 1px solid var(--line);
        border-left: 3px solid var(--accent);
        border-radius: var(--radius-sm);
        background: var(--chip);
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    .content {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }

    .content :global(p) {
        flex-basis: 100%;
        margin: 0;
    }

    .actions {
        flex: 0 0 auto;
        margin-left: auto;
    }
</style>
