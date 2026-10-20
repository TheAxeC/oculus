<script lang="ts">
    // Layer 3, shell partial of PaneView.svelte. What a tab menu item could not do, as one line
    // under the strip. Over a wallpaper the line is read off a `Surface` that fills its own box.
    // The line's own box is the pane column's item with or without a wallpaper, so it keeps its
    // height whether the `Surface` is a box or no box at all.

    import Surface from '$lib/ui/frame/Surface.svelte';

    type Props = {
        /** The sentence the tab menu answered with. */
        words: string;
    };

    let { words }: Props = $props();
</script>

<div class="line">
    <Surface fitted>
        <p class="said" role="status">{words}</p>
    </Surface>
</div>

<style>
    .line {
        flex: none;
    }

    .said {
        margin: 0;
        padding: 2px var(--tab-pad);
        border-bottom: 1px solid var(--line);
        color: var(--c-red-txt);
        font-size: var(--fs-sm);
    }
</style>
