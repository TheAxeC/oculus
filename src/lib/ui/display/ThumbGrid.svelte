<script lang="ts">
    // Layer 3, primitive. A grid of small picture tiles, one of which is chosen, in groups that
    // each carry a heading. A tile is a picture drawn small by the browser from the address it is
    // given, or, with no address, a tile of words alone (the Random and None choices of a picker).
    // The grid is a radio group: one tile is checked, a press on another reports its id, and the
    // arrow keys move between the tiles of the whole grid.
    //
    // The pictures are drawn at the size of the tile whatever their own size is, cropped to fill
    // it, and loaded lazily, so a folder of large photographs costs the page what its visible tiles
    // cost.

    export type Thumb = {
        /** What a press reports, and what `chosen` is compared with. */
        id: string;
        /**
         * The tile's words: its tooltip and accessible name, and its face when it has no picture.
         */
        label: string;
        /** The address of the picture the tile draws, or none for a tile of words alone. */
        src?: string;
    };

    export type ThumbGroup = {
        /** The group's heading, already translated by the view; empty draws none. */
        heading: string;
        tiles: Thumb[];
    };

    type Props = {
        groups: ThumbGroup[];
        /** The id of the chosen tile, or the empty string when no tile is chosen. */
        chosen: string;
        /** The accessible name of the whole grid, already translated by the view. */
        label: string;
        onpick: (id: string) => void;
    };

    let { groups, chosen, label, onpick }: Props = $props();

    /** The tiles in reading order, which the arrow keys walk. */
    const all = $derived(groups.flatMap((one) => one.tiles));

    /** The id the arrow key from a tile moves to, or null where the walk ends. */
    function next(from: string, key: string): string | null {
        const at = all.findIndex((one) => one.id === from);
        if (at < 0) return null;
        if (key === 'ArrowRight' || key === 'ArrowDown') return all[at + 1]?.id ?? null;
        if (key === 'ArrowLeft' || key === 'ArrowUp') return all[at - 1]?.id ?? null;
        return null;
    }

    function walk(event: KeyboardEvent, from: string): void {
        const to = next(from, event.key);
        if (to === null) return;
        event.preventDefault();
        const target = (event.currentTarget as HTMLElement)
            .closest('.grid')
            ?.querySelector<HTMLElement>(`[data-thumb="${CSS.escape(to)}"]`);
        target?.focus();
    }

    /** The tile that takes the tab stop: the chosen one, else the first. */
    const stop = $derived(all.some((one) => one.id === chosen) ? chosen : (all[0]?.id ?? ''));
</script>

<div class="grid" role="radiogroup" aria-label={label}>
    {#each groups as group, at (at)}
        {#if group.heading !== ''}
            <p class="heading">{group.heading}</p>
        {/if}
        <div class="tiles">
            {#each group.tiles as tile (tile.id)}
                <button
                    type="button"
                    class="tile"
                    class:words={tile.src === undefined}
                    role="radio"
                    aria-checked={tile.id === chosen}
                    aria-label={tile.label}
                    title={tile.label}
                    data-thumb={tile.id}
                    tabindex={tile.id === stop ? 0 : -1}
                    onclick={() => onpick(tile.id)}
                    onkeydown={(event) => walk(event, tile.id)}
                >
                    {#if tile.src !== undefined}
                        <img src={tile.src} alt="" loading="lazy" decoding="async" />
                    {:else}
                        <span class="face">{tile.label}</span>
                    {/if}
                </button>
            {/each}
        </div>
    {/each}
</div>

<style>
    .grid {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }

    .heading {
        margin: 6px 0 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .tiles {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .tile {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 96px;
        height: 64px;
        padding: 0;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: var(--input-radius);
        background: var(--chip);
        color: var(--ink-txt, inherit);
        cursor: pointer;
        font: inherit;
        font-size: var(--fs-sm);
    }

    .tile:hover {
        border-color: var(--accent);
    }

    .tile[aria-checked='true'] {
        outline: 2px solid var(--accent);
        outline-offset: 1px;
    }

    .tile:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
    }

    img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .face {
        padding: 0 6px;
        text-align: center;
    }
</style>
