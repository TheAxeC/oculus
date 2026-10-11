<script lang="ts">
    // Layer 3, primitive. The icon a row of a tree draws before its name: the icon of a file or a
    // folder (an app's icon theme decides a folder's), a glyph with or without a colour of its own,
    // or a picture, a file of an app. A row that names none of them draws nothing here.

    import FileIcon from '../../display/FileIcon.svelte';
    import Glyph from '../../display/Glyph.svelte';
    import { themedFolder } from '../../display/icon-theme/held.svelte.ts';

    type Props = {
        /** The name of a file, drawn with its icon. */
        file?: string;
        /** The name of a folder, drawn with the icon an app's icon theme gives it. */
        folder?: string;
        /** Whether the row is open, which picks the open or the closed folder. */
        expanded?: boolean;
        /** A glyph of glyphs.yml. */
        glyph?: string;
        /** Custom properties for the glyph, a tone of its own. */
        glyphStyle?: string;
        /** The address of an image, drawn in the box of a glyph. */
        picture?: string;
    };

    let { file, folder, expanded, glyph, glyphStyle, picture }: Props = $props();
</script>

{#if file !== undefined}
    <FileIcon name={file} />
{:else if folder !== undefined && themedFolder(folder, expanded === true) !== null}
    <FileIcon name={folder} folder={expanded === true ? 'open' : 'closed'} />
{:else if glyph !== undefined && glyphStyle !== undefined}
    <span class="tint" style={glyphStyle}><Glyph name={glyph} /></span>
{:else if glyph !== undefined}
    <Glyph name={glyph} />
{:else if picture !== undefined}
    <img class="picture" src={picture} alt="" />
{/if}

<style>
    /* A glyph given its own colour sits in a box that takes no place of its own. */
    .tint {
        display: contents;
    }

    /* A picture takes the glyph's box. */
    .picture {
        flex: none;
        width: calc(var(--icon-box) * var(--text-scale, 1));
        height: calc(var(--icon-box) * var(--text-scale, 1));
        object-fit: contain;
    }
</style>
