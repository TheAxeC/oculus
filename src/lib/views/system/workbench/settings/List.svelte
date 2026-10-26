<script lang="ts">
    // Layer 3, view partial. The list of the Settings view: a group per subject heading, with one
    // line under it for each file the heading draws from, a title per section, and one item per
    // setting. A line of a file the options folder describes holds the file's subject as its title,
    // its description, Open Settings File (the open workspace file, which keeps the user's values
    // of its settings, in a source tab; with the unsaved workspace, Save Workspace As... in its
    // place; the hub's settings file for a file whose keys are all the hub's, unavailable with no
    // primary) and Show Defaults (oculus's file of the values in force where the user sets none,
    // the defaults file or the catalog or schema file itself, in a source tab that only reads it;
    // none for the workspace's words, whose default is the whole text catalog). The hub's settings
    // file and the machine's own file have a line with their title, their description, the tag on
    // the machine's file and Open Settings File. The Catalogs, Schemas and Texts groups list files
    // instead: one row per file with its path and the control that opens it. A user's file that is
    // being read, could not be read, is cut or does not parse says so on its line, as does the
    // unsaved workspace; a folder that is not listed says so under its group. Each heading and each
    // section carries the id the table of contents scrolls to.

    import CodeText from '$lib/ui/display/text/CodeText.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { OCULUS_CONFIG_ROOT } from '$lib/state/sources/fs';
    import { openTarget } from '$lib/state/system/config/config-files';
    import { sourceTabState } from '$lib/state/sessions/source/draft';
    import { t } from '$lib/state/shared/words/text';
    import type { Group, Row } from '$lib/state/system/config/groups';
    import type { EditorWriter } from '$lib/state/system/config/editors/writer';
    import type { Lists } from '$lib/state/system/config/editors/sources';
    import type { RowWriter } from '$lib/state/system/config/write';
    import { useState } from '$lib/state/client/use';
    import Item from './Item.svelte';
    import { said } from './said';

    const {
        fs: { workspaces },
        layout: { openView },
        ui: { requestPalette }
    } = useState();

    type Props = {
        groups: Group[];
        id: string;
        writer: RowWriter;
        editors: EditorWriter;
        /** The lists a row's controls draw from: the chosen hub's for a row with one chosen. */
        listsFor: (row: Row) => Lists;
        /** Pick the hub a row of a key each hub's own file is read for shows and writes. */
        onchoose: (row: string, hub: string) => void;
    };

    let { groups, id, writer, editors, listsFor, onchoose }: Props = $props();

    /** Where a file opens in a source tab: through the workspace folder that holds it, if any. */
    const targetOf = (root: string | null, file: string | null) =>
        openTarget(root, file, workspaces());

    /**
     * Open one file of oculus's config tree, or a user's file, in a source tab.
     */
    function openFile(root: string | null, file: string | null): void {
        const target = targetOf(root, file);
        if (target !== null) openView('source', sourceTabState(target.root, target.path));
    }

    /** Open oculus's file a line's Show Defaults names in a source tab, which cannot save it. */
    function showDefaults(path: string): void {
        openView('source', sourceTabState(OCULUS_CONFIG_ROOT, path));
    }
</script>

{#each groups as group (group.id)}
    <section class="group" data-settings-group={group.id} data-toc-target={group.id}>
        <div class="group-head">
            <h2 class="group-title">{group.title}</h2>
        </div>
        {#each group.lines as line (line.file)}
            <div class="file" data-file={line.file} data-line={line.kind}>
                <div class="file-head">
                    <span class="file-title">{line.title}</span>
                    {#if line.local}
                        <Tag label={t('settings.local_tag')} />
                    {/if}
                    {#if line.opens.path === null}
                        <ToolButton
                            label={t('settings.save_workspace')}
                            glyph="save"
                            title={t('settings.save_workspace_tip')}
                            compact
                            onclick={() => requestPalette(':workspace-save ')}
                        />
                    {:else if targetOf(line.opens.root, line.opens.path) !== null}
                        <ToolButton
                            label={t('settings.open_settings_file')}
                            glyph="edit"
                            title={t('settings.open_settings_file_tip', line.opens.path)}
                            compact
                            onclick={() => openFile(line.opens.root, line.opens.path)}
                        />
                    {:else}
                        <span class="unavailable">
                            {t('workbench.settings_open_unavailable', line.opens.path)}
                        </span>
                    {/if}
                    {#if line.defaults !== null}
                        {@const defaults = line.defaults}
                        <ToolButton
                            label={t('settings.show_defaults')}
                            glyph="open_preview"
                            title={t('settings.show_defaults_tip', defaults)}
                            compact
                            onclick={() => showDefaults(defaults)}
                        />
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
                        <Item {row} {id} {writer} {editors} lists={listsFor(row)} {onchoose} />
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

    .file-title {
        font-size: var(--fs-md);
        font-weight: 600;
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
