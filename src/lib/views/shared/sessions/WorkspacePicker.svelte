<script lang="ts">
    // Layer 3, shared view. The workspace a new session starts in, or the Customizations section
    // reads: a menu of the places it is handed (the hub, every root of every saved workspace, every
    // workspace a session sits in, and a split terminal's folder when a place of its own), each by
    // the last segment of its folder with the whole path as its tooltip.

    import Menu from '$lib/ui/menu/Menu.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The folder picked, absolute. */
        workspace: string;
        /** The folders offered, absolute, in the order the menu lists them. */
        places: string[];
        /** The hub's folder, which is offered under its own name. */
        hub: string;
        /** Which way the list opens: down from a composer, up from the list's foot. */
        placement: 'up' | 'down';
        onpick: (dir: string) => void;
    };

    let { workspace, places, hub, placement, onpick }: Props = $props();

    /** The last segment of a folder, which is what the picker has room for. */
    function short(dir: string): string {
        if (dir === hub) return t('composer.hub');
        const at = dir.lastIndexOf('/');
        return at < 0 ? dir : dir.slice(at + 1);
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
