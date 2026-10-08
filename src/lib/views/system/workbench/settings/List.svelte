<script lang="ts">
    // Layer 3, view partial. The list of the Settings view: a group per subject heading, with one
    // line under it for each file the heading draws from (the file's name, the tag on the machine's
    // own file, the control that opens the file in a source tab, and the file's description), a
    // title per section, and one item per setting. The Catalogs and Texts groups list files
    // instead: one row per file with its path and the same open control. A file that is being read,
    // could not be read, is cut or does not parse says so on its line and has no setting in any
    // heading; a folder that is not listed says so under its group. Each heading and each section
    // carries the id the table of contents scrolls to.

    import CodeText from '$lib/ui/display/CodeText.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { ENGINE_ROOT } from '$lib/state/sources/fs';
    import { sourceTabState } from '$lib/state/sessions/source/draft';
    import { t } from '$lib/state/shared/words/text';
    import type { Group } from '$lib/state/system/config/groups';
    import type { EditorWriter } from '$lib/state/system/config/editors/writer';
    import type { Lists } from '$lib/state/system/config/editors/sources';
    import type { RowWriter } from '$lib/state/system/config/write';
    import { useState } from '$lib/state/client/use';
    import Item from './Item.svelte';
    import { said } from './said';

    const {
        layout: { openView }
    } = useState();

    type Props = {
        groups: Group[];
        id: string;
        writer: RowWriter;
        editors: EditorWriter;
        lists: Lists;
    };

    let { groups, id, writer, editors, lists }: Props = $props();

    /** Open one file of the engine's config tree in a source tab. */
    function openFile(file: string): void {
        openView('source', sourceTabState(ENGINE_ROOT, file));
    }
</script>

{#each groups as group (group.id)}
    <section class="group" data-settings-group={group.id} data-toc-target={group.id}>
        <div class="group-head">
            <h2 class="group-title">{group.title}</h2>
        </div>
        {#each group.lines as line (line.file)}
            <div class="file" data-file={line.file}>
                <div class="file-head">
                    <span class="file-path">{line.file}</span>
                    {#if line.local}
                        <Tag label={t('settings.local_tag')} />
                    {/if}
                    <ToolButton
                        label={t('views.open_source')}
                        glyph="edit"
                        title={t('views.open_source_tip', line.file)}
                        compact
                        onclick={() => openFile(line.file)}
                    />
                </div>
                {#if line.description !== ''}
                    <p class="about"><CodeText text={line.description} /></p>
                {/if}
                {#if line.said !== null}
                    <p class="note">{said(line.said)}</p>
                {/if}
            </div>
        {/each}
        {#if group.about !== ''}
            <p class="about"><CodeText text={group.about} /></p>
        {/if}
        {#if group.said !== null}
            <p class="note">{said(group.said)}</p>
        {/if}
        {#each group.sections as section (section.id)}
            <div class="section" data-toc-target={section.id}>
                {#if section.title !== ''}
                    <h3 class="section-title">{section.title}</h3>
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
                        <Item {row} {id} {writer} {editors} {lists} />
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

    .file .note {
        margin: 4px 0 0;
    }

    .note {
        margin: 4px 14px 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
