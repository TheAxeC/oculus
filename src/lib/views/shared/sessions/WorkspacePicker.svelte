<script lang="ts">
    // Layer 3, shared view. The workspace a new session starts in, or the Customizations section
    // reads: a menu of the places it is handed (the hubs, every root of every saved workspace,
    // every workspace a session sits in, and a split terminal's folder when a place of its own),
    // each by the words placeNames() of place-names.ts gives it, a hub by its own name and any
    // other folder by its last segment, lengthened until no two places read the same, with the
    // whole path as its tooltip.

    import Menu from '$lib/ui/menu/Menu.svelte';
    import { placeNames, type HubPlace } from './place-names';

    type Props = {
        /** The folder picked, absolute. */
        workspace: string;
        /** The folders offered, absolute, in the order the menu lists them. */
        places: string[];
        /** The hubs of the open workspace, each offered under its own name (hubPlaces()). */
        hubs: HubPlace[];
        /** Which way the list opens: down from a composer, up from the list's foot. */
        placement: 'up' | 'down';
        onpick: (dir: string) => void;
    };

    let { workspace, places, hubs, placement, onpick }: Props = $props();

    /** The words of every folder offered and of the one picked, by folder. */
    const names = $derived(placeNames([...new Set([...places, workspace])], hubs));

    /** The words a folder is listed by. */
    function short(dir: string): string {
        return names.get(dir) ?? dir;
    }
</script>

<span class="picker" data-picker="workspace">
    <Menu
        label={short(workspace)}
        glyph="folder"
        {placement}
        items={places.map((dir) => ({
            id: dir,
            label: short(dir),
            title: dir,
            active: dir === workspace
        }))}
        {onpick}
    />
</span>

<style>
    .picker {
        display: inline-flex;
        min-width: 0;
    }
</style>
