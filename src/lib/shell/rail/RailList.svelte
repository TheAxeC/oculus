<script lang="ts">
    // Layer 3, shell. The rail's list of entries: it takes the height above the foot, scrolls
    // inside it with no bar, and fades at an edge that has more entries past it. The rail puts its
    // entries in and this knows nothing about them; what it owns is the scroll position and what
    // that says.
    //
    // The fades are state read from the list's own scroll numbers through `listFade` of
    // shell/rail/rail.ts, so whether an edge fades is a fact of the list rather than of a
    // stylesheet, and they are drawn over the list rather than inside it so they stay put while the
    // entries move.

    import { listFade, type ListFade } from '$lib/shell/rail/rail';
    import type { Snippet } from 'svelte';

    let { children }: { children: Snippet } = $props();

    /** The scrolling list of entries, and the column inside it whose height is the entries' own. */
    let list: HTMLElement | undefined = $state();
    let entries: HTMLElement | undefined = $state();

    /**
     * Which edges of the list have more entries past them. It is read from the list's own scroll
     * numbers on every scroll and on every change of either height, so a group arriving with the
     * configuration, a window made shorter and a text size stepped up all redraw the fades.
     */
    let fade = $state<ListFade>({ above: false, below: false });

    function measureFade(): void {
        // A measure queued before the list unmounts finds the binding null, not undefined.
        if (!list) return;
        fade = listFade(list.scrollTop, list.scrollHeight, list.clientHeight);
    }

    $effect(() => {
        const node = list;
        const inner = entries;
        if (node === undefined || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(measureFade);
        observer.observe(node);
        if (inner !== undefined) observer.observe(inner);
        return () => observer.disconnect();
    });
</script>

<div class="list">
    <div class="views" bind:this={list} onscroll={measureFade}>
        <div class="entries" bind:this={entries}>
            {@render children()}
        </div>
    </div>
    {#if fade.above}
        <span class="fade above" data-fade="above" aria-hidden="true"></span>
    {/if}
    {#if fade.below}
        <span class="fade below" data-fade="below" aria-hidden="true"></span>
    {/if}
</div>

<style>
    /* The list fills the rail above the foot whatever the entries need, so the foot sits at the
       rail's bottom edge and the list, not the foot, is what gives way on a short window. */
    .list {
        position: relative;
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
    }

    /* The list scrolls on a short window, with no scrollbar drawn: a bar in the rail covers the
       controls it sits beside, and the wheel and the trackpad reach every entry without it. */
    .views {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        scrollbar-width: none;
    }

    .views::-webkit-scrollbar {
        display: none;
    }

    /* The items sit flush one under the next, as VS Code's activity bar draws them. */
    .entries {
        display: flex;
        flex-direction: column;
    }

    /* The fade over an edge with more past it: the rail's own surface running out to nothing, so
       the entry under it dims into the edge rather than being cut there. It takes no pointer, so
       the entry under it is still pressed through it. */
    .fade {
        position: absolute;
        left: 0;
        right: 0;
        height: 28px;
        pointer-events: none;
    }

    .fade.above {
        top: 0;
        background-image: linear-gradient(to bottom, var(--bg), transparent);
    }

    .fade.below {
        bottom: 0;
        background-image: linear-gradient(to top, var(--bg), transparent);
    }

    /* Over a wallpaper the rail is the panel's colour at its translucent share, so the fade is
       too. */
    :global(body.wall) .fade {
        opacity: var(--wall-panel);
    }

    :global(body.wall) .fade.above {
        background-image: linear-gradient(to bottom, var(--panel), transparent);
    }

    :global(body.wall) .fade.below {
        background-image: linear-gradient(to top, var(--panel), transparent);
    }
</style>
