<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The workspaces as a section under the
    // trees: a head that opens and closes it and carries the control that saves the roots in force
    // under a name, and one explorer row per workspace, a press switching to it. The workspace in
    // force is drawn as the one in force, a bold name with a check, and never as the reader's
    // selection.
    //
    // The configured roots are the first row and have no name: that workspace is the configured
    // roots and whatever the reader added without saving, which is exactly what a cleared field
    // means everywhere else in this tree, so its row carries the words for it instead. The section is
    // one stop of the focus order through ui/tree/TreeView.svelte.
    //
    // The head is drawn in every state, since it is where the roots in force are saved: a read that
    // failed says why in one row in place of the list, with the control that reads it again beside
    // it, so the reader is never offered the configured roots as the whole truth about a read that
    // never landed. That read is the roots' as well, so the view says above the tree that the roots
    // could not be read, and this control asks again for both.

    import { workspaceChoices } from '$lib/state/sources/fs';
    import Failed from '../tree/Failed.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/words/text';

    type Props = {
        current: string;
        names: string[];
        /** What reading the workspaces failed with, or the empty string. */
        error: string;
        /** Whether the section is open. */
        open: boolean;
        /** Whether the form that names a workspace is open. */
        saving: boolean;
        ontoggle: () => void;
        onsave: () => void;
        onselect: (name: string) => void;
        /** Ask for the workspaces again, which the failed line's own control offers. */
        onretry: () => void;
    };

    let { current, names, error, open, saving, ontoggle, onsave, onselect, onretry }: Props =
        $props();

    const rows = $derived(error === '' ? workspaceChoices(names) : []);

    const keyRows = $derived([
        { id: 'head', parent: null, open },
        ...(open ? rows.map((name) => ({ id: `space:${name}`, parent: 'head' })) : [])
    ]);

    function labelOf(name: string): string {
        return name === '' ? t('files.workspace_default') : name;
    }
</script>

<div class="spaces" data-fs-workspaces>
    <TreeView label={t('files.workspaces')} rows={keyRows} {ontoggle}>
        {#snippet children(nav: TreeNav)}
            <TreeSection
                label={t('files.workspaces')}
                id="head"
                {nav}
                count={rows.length}
                {open}
                {ontoggle}
            >
                {#snippet actions(reach: number)}
                    <ToolButton
                        label={t('files.save_as')}
                        title={t('files.save_as_title')}
                        glyph="save"
                        compact
                        tabindex={reach}
                        expanded={saving}
                        onclick={onsave}
                    />
                {/snippet}
                {#if error !== ''}
                    <li role="none">
                        <Failed
                            label={t('files.workspaces_failed', error)}
                            title={t('files.read_again_workspaces')}
                            {onretry}
                        />
                    </li>
                {/if}
                {#each rows as name (name)}
                    <li role="none" data-fs-workspace={name}>
                        <TreeItem
                            label={labelOf(name)}
                            id={`space:${name}`}
                            {nav}
                            level={2}
                            glyph={t('files.folder_glyph')}
                            title={t('files.workspace_open_title', labelOf(name))}
                            current={name === current}
                            onclick={() => onselect(name)}
                        />
                    </li>
                {/each}
            </TreeSection>
        {/snippet}
    </TreeView>
</div>

<style>
    .spaces {
        margin-top: 6px;
    }
</style>
