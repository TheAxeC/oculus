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
    import { OCULUS_CONFIG_ROOT } from '$lib/state/sources/fs';
    import { openTarget } from '$lib/state/system/config/config-files';
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
        fs: { workspaces },
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

    /** Where a file opens in a source tab: through the workspace folder that holds it, if any. */
    const targetOf = (root: string, file: string) => openTarget(root, file, workspaces());

    /**
     * Open one file of oculus's config tree, or the primary hub's settings file, in a source tab.
     */
    function openFile(root: string, file: string): void {
        const target = targetOf(root, file);
        if (target !== null) openView('source', sourceTabState(target.root, target.path));
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
                    {#if targetOf(line.root, line.file) !== null}
                        <ToolButton
                            label={t('views.open_source')}
                            glyph="edit"
                            title={t('views.open_source_tip', line.file)}
                            compact
                            onclick={() => openFile(line.root, line.file)}
                        />
                    {:else}
                        <span class="unavailable">
                            {t('workbench.settings_open_unavailable', line.file)}
                        </span>
                    {/if}
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
                                {#if targetOf(OCULUS_CONFIG_ROOT, row.file) !== null}
                                    <ToolButton
                                        label={t('views.open_source')}
                                        glyph="edit"
                                        title={t('views.open_source_tip', row.file)}
                                        compact
                                        onclick={() => openFile(OCULUS_CONFIG_ROOT, row.file)}
                                    />
                                {:else}
                                    <span class="unavailable">
                                        {t('workbench.settings_open_unavailable', row.file)}
                                    </span>
                                {/if}
                            </div>
                            {#if row.help !== ''}
                                <p class="about"><CodeText text={row.help} /></p>
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

    .unavailable {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
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
