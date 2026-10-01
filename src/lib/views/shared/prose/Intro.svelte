<script lang="ts">
    // Layer 3, shared view partial. The words directly under a pane header, in plain muted type. It
    // accepts catalog HTML, optional additional lines, or structured content such as a status chip.
    // A line may carry a value from a hub file, so what it is given is sanitised before it is
    // drawn.

    import type { Snippet } from 'svelte';
    import { sanitise } from '$lib/ui/html';

    type Props = {
        html?: string;
        lines?: string[];
        /**
         * Whether the lines and the html are catalog text: the tree's own words, from
         * config/text*.yml through t(), which are drawn as written. A caller that leaves it off
         * is handing over a hub value and its markup is sanitised first.
         */
        trusted?: boolean;
        actions?: Snippet;
        children?: Snippet;
    };

    let { html, lines, trusted = false, actions, children }: Props = $props();

    /** One line as it is drawn: catalog words as written, a hub value with its markup cut down. */
    function drawn(line: string): string {
        return trusted ? line : sanitise(line);
    }
</script>

<div class="intro">
    <div class="content">
        {#if lines !== undefined}
            {#each lines as line, index (`${index}:${line}`)}
                <!-- eslint-disable-next-line svelte/no-at-html-tags -- drawn() sanitises unless the words were marked trusted, and a trusted site draws a catalog line -->
                <p>{@html drawn(line)}</p>
            {/each}
        {:else if html !== undefined}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- drawn() sanitises unless the words were marked trusted, and a trusted site draws a catalog line -->
            {@html drawn(html)}
        {:else if children}
            {@render children()}
        {/if}
    </div>
    {#if actions}
        <div class="actions">{@render actions()}</div>
    {/if}
</div>

<style>
    /* Plain words in the muted colour, with the view's controls after them: no box, rule or
       fill, as VS Code draws the text above a view's content. */
    .intro {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 12px;
        margin: 0 0 10px;
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

    /* A narrow pane stacks the words over the controls rather than pushing the controls past the
       block's own edge. */
    @media (max-width: 640px) {
        .actions {
            margin-left: 0;
        }
    }
</style>
