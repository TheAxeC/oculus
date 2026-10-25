<script lang="ts">
    // Layer 3, shared view partial. The top of a board's body: the one line saying what the board's
    // last write answered, drawn while it holds words, then the board's empty message when it shows
    // nothing, else what the board draws (`children`). The project boards
    // (views/boards/projects/Projects.svelte) and the collection view
    // (views/boards/collection/Collection.svelte) draw it, so the two say an outcome and an empty
    // board alike. Over a wallpaper the line is read off a `Surface`.

    import type { Snippet } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';

    type Props = {
        /** What the last write answered, already translated; '' while there is nothing to say. */
        said: string;
        /** Whether the board shows nothing: the empty message is drawn in place of `children`. */
        empty: boolean;
        /** The empty message, already translated. */
        message: string;
        /** A name in `glyphs:` drawn before the empty message; none for no glyph. */
        glyph?: string;
        /** What the board draws while it shows something. */
        children: Snippet;
    };

    let { said, empty, message, glyph, children }: Props = $props();
</script>

{#if said !== ''}
    <Surface>
        <p class="said">{said}</p>
    </Surface>
{/if}
{#if empty}
    <Empty {message} {glyph} />
{:else}
    {@render children()}
{/if}

<style>
    .said {
        margin: 0 0 8px;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }
</style>
