<script lang="ts">
    // Layer 3, view partial. The list of the Settings view: a group per subject heading, with one
    // line under it for each file the heading draws from, a title per section, and one item per
    // setting. A line of a file the options folder describes holds the file's subject as its title,
    // its description and Show Defaults (oculus's file of the values in force where the user sets
    // none, the defaults file or the catalog or schema file itself, in a source tab that only reads
    // it; none for the workspace's words, whose default is the whole text catalog). The machine's
    // own file has a line with its title, its description and its tag. No line opens a user's
    // file: the user's values are set in the rows, in the file of the scope on screen. The
    // Catalogs, Schemas and Texts groups list oculus's own files instead: one row per file with its
    // path and the control that shows it. A folder that is not listed says so under its group.
    // Each heading and each section carries the id the table of contents scrolls to.
    //
    // Each group is the group every grouping of a view is drawn as
    // (ui/controls/heads/GroupHead.svelte), headed with its title and the count of the rows the
    // search leaves in it, and folds by its id under `folded` of the tab's state
    // (views/shared/card/pane-fold.ts). A section's title is a sub-heading
    // (ui/controls/heads/SubHead.svelte). `unfold` opens the folded group that holds a heading or a
    // row, so the view's scroll to it from the table of contents or the rail's reveal lands.

    import { tick } from 'svelte';
    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import SubHead from '$lib/ui/controls/heads/SubHead.svelte';
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
    import type { RowWriter } from '$lib/state/system/config/scopes/write';
    import { useState } from '$lib/state/client/use';
    import { usePaneFold } from '$lib/views/shared/card/pane-fold';
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
        /** The lists a row's controls draw from: the Hub scope's hub's for a row of that hub. */
        listsFor: (row: Row) => Lists;
        /** Show the Repository scope of a folder. */
        onrepo: (root: string) => void;
    };

    let { groups, id, writer, editors, listsFor, onrepo }: Props = $props();

    const fold = usePaneFold();

    /**
     * Open the folded group whose id, a section's id or a row's id is `target`, and wait for it to
     * be drawn, so a scroll to the target lands. An open group and an id no group holds change
     * nothing.
     */
    export async function unfold(target: string): Promise<void> {
        const group = groups.find(
            (one) =>
                one.id === target ||
                one.sections.some(
                    (section) =>
                        section.id === target || section.rows.some((row) => row.id === target)
                )
        );
        if (group === undefined || fold.open(group.id)) return;
        fold.toggle(group.id);
        await tick();
    }

    /** Where a file opens in a source tab: through the workspace folder that holds it, if any. */
    const targetOf = (root: string | null, file: string | null) =>
        openTarget(root, file, workspaces());

    /** Open one file of oculus's config tree in a source tab. */
    function openFile(root: string | null, file: string | null): void {
        const target = targetOf(root, file);
        if (target !== null) openView('source', sourceTabState(target.root, target.path));
    }

    /** Open oculus's file a line's Show Defaults names in a source tab, which cannot save it. */
    function showDefaults(path: string): void {
        openView('source', sourceTabState(OCULUS_CONFIG_ROOT, path));
    }
</script>

<div class="groups">
    {#each groups as group (group.id)}
        <GroupHead
            data-settings-group={group.id}
            data-toc-target={group.id}
            label={group.title}
            count={group.sections.reduce((rows, section) => rows + section.rows.length, 0)}
            open={fold.open(group.id)}
            ontoggle={() => fold.toggle(group.id)}
        >
            {#each group.lines as line (line.file)}
                <div class="file" data-file={line.file}>
                    <div class="file-head">
                        <span class="file-title">{line.title}</span>
                        {#if line.local}
                            <Tag label={t('settings.local_tag')} />
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
                        <SubHead label={section.title} />
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
                            <Item {row} {id} {writer} {editors} lists={listsFor(row)} {onrepo} />
                        {/if}
                    {/each}
                </div>
            {/each}
        </GroupHead>
    {/each}
</div>

<style>
    .groups {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 8px 0 12px;
    }

    /* A section scrolled to from the table of contents stands under its group's sticky strip. */
    .section {
        scroll-margin-top: var(--group-strip, 0);
    }

    .section + .section {
        margin-top: 8px;
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

    .note {
        margin: 4px 14px 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
