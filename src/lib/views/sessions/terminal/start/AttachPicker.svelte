<script lang="ts">
    // Layer 3, view partial. The composer's attach picker: the chosen workspace's folders one level
    // at a time, read through the file server as the Files view reads them, a folder opening in
    // place and a file picked with one press. It lists only what the file server serves, so a
    // workspace no root of the workspace in force holds says so and lists nothing.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import { childPath, rootHolding } from '$lib/state/sources/fs';
    import { absoluteOf } from '$lib/state/workbench/navigation/pages';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        /** The workspace the session starts in, an absolute folder. */
        workspace: string;
        /** A file picked, by its absolute path. */
        onpick: (path: string) => void;
        onclose: () => void;
    };

    let { workspace, onpick, onclose }: Props = $props();

    const {
        fs: { listing, workspaces }
    } = useState();

    const held = $derived(rootHolding(workspaces().folders, workspace));

    /** The folder listed, inside the workspace, and the empty string for the workspace itself. */
    let inside = $state('');

    const path = $derived(
        held === null ? '' : [held.path, inside].filter((one) => one !== '').join('/')
    );
    const listed = $derived(
        held === null ? { entries: [], error: '', loading: false } : listing(held.root.key, path)
    );
    const rows = $derived(
        [...listed.entries].sort(
            (a, b) =>
                Number(b.kind === 'dir') - Number(a.kind === 'dir') || a.name.localeCompare(b.name)
        )
    );

    function up(): void {
        const at = inside.lastIndexOf('/');
        inside = at < 0 ? '' : inside.slice(0, at);
    }

    function pressed(name: string, kind: 'file' | 'dir'): void {
        if (kind === 'dir') {
            inside = childPath(inside, name);
            return;
        }
        if (held === null) return;
        onpick(absoluteOf(held.root.dir, childPath(path, name)));
    }
</script>

<div class="attach" data-attach-picker>
    <div class="head">
        <ToolButton
            label={t('composer.attach_up')}
            glyph="arrow_to"
            compact
            bare
            disabled={inside === ''}
            onclick={up}
        />
        <span class="where" title={path}>{inside === '' ? t('composer.attach_top') : inside}</span>
        <ToolButton
            label={t('composer.attach_close')}
            glyph="cross"
            compact
            bare
            onclick={onclose}
        />
    </div>
    {#if held === null}
        <Empty message={t('composer.attach_unserved', workspace)} />
    {:else if listed.error !== ''}
        <Empty error message={listed.error} />
    {:else if listed.loading}
        <p class="line">{t('composer.attach_loading')}</p>
    {:else if rows.length === 0}
        <Empty message={t('composer.attach_empty')} />
    {:else}
        <ul class="rows">
            {#each rows as row (row.name)}
                <li data-attach-row={row.name}>
                    <TreeItem
                        label={row.name}
                        glyph={row.kind === 'dir' ? 'folder' : 'page'}
                        expanded={row.kind === 'dir' ? false : undefined}
                        onclick={() => pressed(row.name, row.kind)}
                    />
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .attach {
        display: flex;
        flex-direction: column;
        max-height: 220px;
        margin: 4px 6px 0;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        overflow: hidden;
    }

    /* Over a wallpaper the Terminal view's tinted box is the one layer, so the picker adds none. */
    :global(body.wall) .attach {
        background: transparent;
    }

    .head {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 2px 4px;
        border-bottom: 1px solid var(--line);
    }

    .where {
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .rows {
        margin: 0;
        padding: 0;
        list-style: none;
        overflow: auto;
    }

    .line {
        margin: 0;
        padding: 4px 8px;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }
</style>
