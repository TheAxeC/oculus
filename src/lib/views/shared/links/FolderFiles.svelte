<script lang="ts">
    // Layer 3, shared view partial. One folder of the hub as a block of a page: a heading with the
    // controls that open a Files tab rooted at the folder and the workbench of the folder, and the
    // folder's files, each a row that opens the file in a source tab as a file browser row does.
    // The person page draws a student's supervision folder with it and the entry page draws the
    // folder an entry's link names. The heading is a snippet the page draws in its own element, so
    // the block takes the look of the other headings of the page it is on.
    //
    // The folder is listed through the file store rather than carried in the snapshot, because the
    // snapshot holds the portfolio's YAML and not what is in a folder, and the store lists it
    // again when a file under it changes. The listing is asked for the hub path and never for a
    // raw value, so a caller with no path, which is a folder that is an address or climbs above
    // the hub, asks the file route for nothing and the block says so. The block offers what a
    // source tab can hold, so a folder inside the folder is not a row: opening one would ask the
    // file route for bytes a directory has none of.

    import type { Snippet } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { openSourceFile } from './source-file';
    import { HUB_ROOT } from '$lib/state/sources/fs';
    import { fileEntries } from '$lib/state/sources/fs-transport';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        folders,
        fs: { listing },
        layout: { showFolderInFiles }
    } = client;

    type Props = {
        /** The folder as a path of the hub, or undefined for a folder the hub does not hold. */
        folder: string | undefined;
        /** The block's heading, drawn by the caller in the style of its page's headings. */
        heading: Snippet;
        /** The key of the hub that holds the folder. */
        root?: string;
    };

    let { folder, heading, root = HUB_ROOT }: Props = $props();

    const files = $derived(folder === undefined ? null : listing(root, folder));
    const documents = $derived(fileEntries(files?.entries ?? []));

    /** Open one file of the folder in the source tab. */
    function openFile(name: string): void {
        if (folder === undefined) return;
        openSourceFile(client, { root, path: `${folder}/${name}` });
    }
</script>

<div class="folder" data-folder={folder}>
    <div class="head">
        {@render heading()}
        {#if folder !== undefined}
            <ToolButton
                label={t('folder_files.show_in_files')}
                title={t('folder_files.show_in_files_tip', folder)}
                glyph="show_in_files"
                compact
                onclick={() => {
                    showFolderInFiles(folder, root);
                }}
            />
            {#if folders.served(root)}
                <ToolButton
                    label={t('folder_files.open_workbench')}
                    title={t('folder_files.open_workbench_tip', folder)}
                    glyph="app_view"
                    compact
                    onclick={() => {
                        folders.open({ root, path: folder });
                    }}
                />
            {/if}
        {/if}
    </div>
    {#if files === null}
        <Empty message={t('folder_files.outside')} glyph="warn" />
    {:else if files.loading}
        <Empty message={t('folder_files.loading')} />
    {:else if files.error !== ''}
        <Empty message={files.error} glyph="warn" />
    {:else if documents.length === 0}
        <Empty message={t('folder_files.empty')} />
    {:else}
        <ul class="rows">
            {#each documents as entry (entry.name)}
                <li>
                    <span class="link">
                        <ToolButton
                            plain
                            cut
                            label={entry.name}
                            title={t('folder_files.open_file', entry.name)}
                            onclick={() => openFile(entry.name)}
                        />
                    </span>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    /* The heading carries the control that opens the folder in a Files tab. */
    .head {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    .rows {
        display: flex;
        flex-direction: column;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .rows li {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        font-size: var(--fs-md);
    }

    /* A file opens from its name, drawn as a link: the accent colour, an underline under the
       pointer and with the focus. */
    .link {
        display: inline-flex;
        min-width: 0;
        color: var(--accent-txt, var(--accent));
    }

    .link:hover,
    .link:focus-within {
        text-decoration: underline;
    }
</style>
