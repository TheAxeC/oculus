<script lang="ts">
    // Layer 3, partial of views/sources/repositories/diff/DiffSection.svelte. The header row of one
    // file of a diff, as VS Code's multi-file diff editor draws it: a chevron that folds and
    // unfolds the file when the diff holds several, the file's Seti icon, its name, its folder
    // muted after it, for a rename the letter R and the old path, and Open File at the right where
    // the file is on disk. In the comparison of two files the header names the left file, name and
    // folder, and then the right file, with no rename letter. The chevron says whether the file is
    // open and is a Tab stop, then Open File is.
    //
    // The row is one tree row high and stays at the top of the pane while its file scrolls under
    // it, on the panel colour. Over a wallpaper it is read off its file's section, the surface
    // (diff/DiffSection.svelte), and paints nothing; in a diff of several files (`foldable`) the
    // files scroll under it in the pane, so it is the sticky strip of `tokens.css` and keeps a mix
    // of its own, so the lines under it do not read through its words.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import FileIcon from '$lib/ui/display/FileIcon.svelte';
    import { nameOf } from '$lib/state/sources/fs';
    import { RENAMED, statusStyle } from '$lib/state/sources/repositories/repositories';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The file's path: the new one, or the old one for a deleted file. */
        path: string;
        /** The path the file was renamed from, or the empty string. */
        oldPath: string;
        /** The left file of a comparison of two files, or the empty string for any other diff. */
        against?: string;
        /** Whether the file can be folded: the diff holds several. */
        foldable: boolean;
        folded: boolean;
        /** Whether the file is on disk to open. */
        openable: boolean;
        ontoggle: () => void;
        onopen: () => void;
    };

    let {
        path,
        oldPath,
        against = '',
        foldable,
        folded,
        openable,
        ontoggle,
        onopen
    }: Props = $props();

    /** The folder a path is in, or the empty string for a path in the top folder. */
    function folderOf(of: string): string {
        return of.includes('/') ? of.slice(0, of.lastIndexOf('/')) : '';
    }

    const folder = $derived(folderOf(path));
    const left = $derived(
        against === '' ? null : { name: nameOf(against), folder: folderOf(against) }
    );
    const fold = $derived(folded ? t('repositories.file_unfold') : t('repositories.file_fold'));
</script>

<div class="header" class:stays={foldable} data-file-header={path}>
    {#if foldable}
        <span class="chevron" class:open={!folded}>
            <ToolButton
                label={fold}
                title={fold}
                glyph="chevron"
                compact
                bare
                expanded={!folded}
                onclick={ontoggle}
            />
        </span>
    {/if}
    <FileIcon name={path} />
    {#if left !== null}
        <span class="name">{left.name}</span>
        {#if left.folder !== ''}
            <span class="folder">{left.folder}</span>
        {/if}
    {/if}
    <span class="name">{nameOf(path)}</span>
    {#if folder !== ''}
        <span class="folder">{folder}</span>
    {/if}
    {#if oldPath !== ''}
        <span class="renamed" style={statusStyle(RENAMED)}>{RENAMED}</span>
        <span class="folder">{oldPath}</span>
    {/if}
    {#if openable}
        <span class="act">
            <ToolButton
                label={t('repositories.open_file')}
                glyph="open_file"
                compact
                bare
                onclick={onopen}
            />
        </span>
    {/if}
</div>

<style>
    .header {
        position: sticky;
        top: 0;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 4px;
        box-sizing: border-box;
        height: calc(var(--tree-row) * var(--text-scale, 1));
        min-width: 0;
        background: var(--panel);
        color: var(--ink-txt, var(--ink));
        font-size: calc(var(--tree-font) * var(--text-scale, 1));
        white-space: nowrap;
    }

    :global(body.wall) .header {
        background: transparent;
    }

    :global(body.wall) .header.stays {
        background: var(--chip-on-wall);
        backdrop-filter: blur(var(--wall-blur));
    }

    .chevron {
        display: inline-flex;
        transition: transform 120ms ease;
    }

    .chevron.open {
        transform: rotate(90deg);
    }

    .name {
        flex: 0 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .folder {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--muted-txt, var(--muted));
        font-size: 0.9em;
        opacity: 0.7;
    }

    .renamed {
        color: var(--tone-txt, var(--muted-txt));
        font-size: 90%;
        font-weight: 600;
        opacity: 0.75;
    }

    .act {
        display: inline-flex;
        margin-left: auto;
    }
</style>
