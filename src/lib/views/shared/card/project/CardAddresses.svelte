<script lang="ts">
    // Layer 3, shared view. The `links:` of a project's manifest, one line each. An entry is
    // an address only when views/shared/card/feed/posting.ts says it names a web page; every other
    // entry is drawn as the words it is.

    import Glyph from '$lib/ui/display/Glyph.svelte';
    import { posting } from '../feed/posting';
    import type { BoardItem } from '$lib/state/boards/board';

    type Props = {
        /** The joined board item whose links are drawn. */
        item: BoardItem;
    };
    let { item }: Props = $props();

    const links = $derived(item.project.links ?? []);
</script>

{#if links.length > 0}
    <ul class="links">
        {#each links as link, index (`${index}:${link}`)}
            {@const href = posting(link)}
            <li>
                {#if href !== undefined}
                    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the address is data, an external web page, and no route id resolve() takes -->
                    <a {href} target="_blank" rel="noreferrer">
                        <Glyph name="link" />
                        <span>{link}</span>
                    </a>
                {:else}
                    <span>{link}</span>
                {/if}
            </li>
        {/each}
    </ul>
{/if}

<style>
    .links {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin: 6px 0 0;
        padding: 0;
        overflow-wrap: anywhere;
        list-style: none;
        font-size: var(--fs-sm);
    }

    .links a {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--accent-txt, var(--accent));
    }
</style>
