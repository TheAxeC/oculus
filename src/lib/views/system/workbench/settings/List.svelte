<script lang="ts">
    // Layer 3, view partial. The list of the Settings view: a group per file with the control that
    // opens the file in a source tab, the file's description under its heading, the tag on the
    // machine's own file, a heading per section, and one item per setting. The Catalogs and Texts
    // groups list files instead: one row per file with its path and the same open control. A group
    // whose file or folder is being read, could not be read, is cut or does not parse says so in
    // one line and draws no setting. Each heading carries the id the table of contents scrolls to.

    import CodeText from '$lib/ui/display/CodeText.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { ENGINE_ROOT } from '$lib/state/sources/fs';
    import { sourceTabState } from '$lib/state/sessions/source.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { Group } from '$lib/state/system/config/groups';
    import type { EditorWriter } from '$lib/state/system/config/editors/writer';
    import type { RowWriter } from '$lib/state/system/config/write';
    import { useState } from '$lib/state/client/use';
    import Item from './Item.svelte';
    import { said } from './said';

    const {
        layout: { openView }
    } = useState();

    type Props = { groups: Group[]; id: string; writer: RowWriter; editors: EditorWriter };

    let { groups, id, writer, editors }: Props = $props();

    /** Open one file of the engine's config tree in a source tab. */
    function openFile(file: string): void {
        openView('source', sourceTabState(ENGINE_ROOT, file));
    }
</script>

{#each groups as group (group.id)}
    <section class="group" data-settings-group={group.id} data-toc-target={group.id}>
        <div class="group-head">
            <h2 class="group-title">{group.title}</h2>
            {#if group.local}
                <Tag label={t('settings.local_tag')} />
            {/if}
            {#if group.file !== null}
                {@const file = group.file}
                <ToolButton
                    label={t('views.open_source')}
                    glyph="edit"
                    title={t('views.open_source_tip', file)}
                    compact
                    onclick={() => openFile(file)}
                />
            {/if}
        </div>
        {#if group.description !== ''}
            <p class="about"><CodeText text={group.description} /></p>
        {/if}
        {#if group.said !== null}
            <p class="note">{said(group.said)}</p>
        {/if}
        {#each group.sections as section (section.id)}
            <div class="section" data-toc-target={section.id}>
                {#if section.heading !== ''}
                    <h3 class="section-title">{section.heading}</h3>
                {/if}
                {#each section.rows as row (row.id)}
                    {#if row.kind === 'file'}
                        <div class="file" data-file={row.file}>
                            <div class="file-head">
                                <span class="file-path">{row.file}</span>
                                <ToolButton
                                    label={t('views.open_source')}
                                    glyph="edit"
                                    title={t('views.open_source_tip', row.file)}
                                    compact
                                    onclick={() => openFile(row.file)}
                                />
                            </div>
                            {#if row.description !== ''}
                                <p class="about"><CodeText text={row.description} /></p>
                            {/if}
                        </div>
                    {:else}
                        <Item {row} {id} {writer} {editors} />
                    {/if}
                {/each}
            </div>
        {/each}
    </section>
{/each}

<style>
    .group {
        padding: 0 0 12px;
    }

    .group-head {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 14px 4px;
    }

    .group-title {
        margin: 0;
        font-size: var(--fs-xl);
        font-weight: 600;
    }

    .section-title {
        margin: 8px 0 0;
        padding: 0 14px;
        font-size: var(--fs-md);
        font-weight: 600;
    }

    .about {
        margin: 0;
        padding: 0 14px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .file {
        padding: 6px 14px 8px;
    }

    .file-head {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .file-path {
        font-family: var(--font-mono);
        font-size: var(--fs-md);
    }

    .file .about {
        padding: 0;
    }

    .note {
        margin: 4px 14px 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
