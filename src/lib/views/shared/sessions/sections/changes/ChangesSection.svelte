<script lang="ts">
    // Layer 3, partial of ../SessionSections.svelte. The Changes section of a session, headed with
    // the count of the files it touched: two group rows of its tree, one over those files
    // (ChangesTouched.svelte, `sessions.ch_touched`) and The repository over the repository it
    // works in (ChangesRepository.svelte), whose change groups are the Repositories view's own
    // (views/shared/changes/groups/GroupList.svelte), selected by the same piece
    // (change-picks.svelte.ts there). The section is one stop of the focus order: the arrows walk
    // its group rows and their rows, Left and Right fold them, and the branch menu, the new-branch
    // field and the commit box are reached by Tab.
    //
    // The head carries the control that draws the change groups as lists or as folders, the one the
    // Repositories view carries for its own. The mode and the selected change rows are kept in the
    // tab's view state (`mode`, `picked`, ../session-sections.ts) and the group rows' folds in its
    // folds (changes-folds.ts), so each tab keeps its own and a reload keeps them. Cmd+Enter on a
    // tracked row opens its diff as the session's, beside the pane, and on an untracked row its
    // file beside the pane.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import type { SectionMove } from '$lib/views/shared/explorer/sections/list-drag.svelte';
    import { usePaneFold } from '$lib/views/shared/card/pane-fold';
    import { createChangePicks } from '$lib/views/shared/changes/groups/change-picks.svelte';
    import { repoShape } from '$lib/state/sources/repositories/repositories';
    import type { GroupedSession } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import SessionSection from '../SessionSection.svelte';
    import { changesViewOf, withChangesView } from '../session-sections';
    import ChangesRepository from './ChangesRepository.svelte';
    import ChangesTouched from './ChangesTouched.svelte';
    import {
        changesFolds,
        changesRows,
        foldOfRow,
        repositoryOpen,
        touchedOpen,
        REPOSITORY_ROW,
        TOUCHED_ROW
    } from './changes-folds';

    const {
        repositories,
        selectors: { gitFor },
        ui: { instanceState, setInstanceState }
    } = useState();

    type Props = {
        /** The tab whose state keeps the mode and the selection. */
        owner: string;
        record: GroupedSession;
        open: boolean;
        ontoggle: () => void;
        move?: SectionMove;
        /** Leave out the line across the head's top edge, for the section right under a divider. */
        noTopLine?: boolean;
    };

    let { owner, record, open, ontoggle, move, noTopLine = false }: Props = $props();

    const fold = usePaneFold();
    const folded = (id: string): boolean => !fold.open(id);

    const view = $derived(changesViewOf(instanceState(owner)));
    const workspace = $derived(record.workspace);
    const repo = $derived(workspace === '' ? null : gitFor(workspace));
    const readable = $derived(repoShape(workspace, repo) === 'readable' ? repo : null);
    const files = $derived(record.files);

    const rows = $derived(
        changesRows({
            files: files.map((file) => file.path),
            git: readable,
            root: workspace,
            mode: view.mode,
            folded
        })
    );

    const picks = createChangePicks({
        rows: () => rows,
        picked: () => view.picked,
        onpicked: (ids: string[]) => keep({ picked: ids }),
        openSide: (group: string, path: string) => {
            if (group === 'untracked') repositories.openChangeBeside(workspace, group, path);
            else repositories.openChange(workspace, group, path, record.id);
        }
    });

    function keep(part: { mode?: 'list' | 'tree'; picked?: string[] }): void {
        setInstanceState(owner, withChangesView(instanceState(owner), part));
    }

    function folding(id: string): void {
        const key = foldOfRow(id, workspace);
        if (key !== null) fold.toggle(key);
    }
</script>

{#snippet modes(reach: number)}
    {#if view.mode === 'tree'}
        <ToolButton
            label={t('repositories.view_list')}
            glyph="list"
            compact
            tabindex={reach}
            onclick={() => keep({ mode: 'list' })}
        />
    {:else}
        <ToolButton
            label={t('repositories.view_tree')}
            glyph="view_tree"
            compact
            tabindex={reach}
            onclick={() => keep({ mode: 'tree' })}
        />
    {/if}
{/snippet}

<SessionSection
    id="changes"
    label={t('sessions.section_changes')}
    count={files.length}
    {rows}
    {open}
    {ontoggle}
    onfold={folding}
    {move}
    more={modes}
    keymap={picks.keymap}
    onkey={picks.keyed}
    {noTopLine}
>
    {#snippet body(tree: TreeNav)}
        {@const nav = picks.keep(tree)}
        <ChangesTouched
            recordId={record.id}
            {files}
            {workspace}
            {nav}
            open={touchedOpen(folded)}
            ontoggle={() => folding(TOUCHED_ROW)}
        />
        <ChangesRepository
            {record}
            {nav}
            open={repositoryOpen(folded)}
            ontoggle={() => folding(REPOSITORY_ROW)}
            mode={view.mode}
            folds={changesFolds(folded)}
            onfold={(id: string) => fold.toggle(id)}
            picked={picks.live}
            onpress={picks.pressed}
        />
    {/snippet}
</SessionSection>
