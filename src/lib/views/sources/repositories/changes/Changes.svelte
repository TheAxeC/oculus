<script lang="ts">
    // Layer 3, partial of views/sources/repositories/Repositories.svelte. What is changed in one
    // repository, as the Changes section: a head that opens and closes with the count of every
    // changed path as a badge, and under it the change groups (Merge Changes, Staged, Changed and
    // Untracked) one step in, drawn by views/shared/changes/groups/GroupList.svelte, the part a
    // session's Changes section draws too. The section, its groups and the folders of the tree
    // mode close by their ids in the instance's list of closed rows: the section by `changes`, a
    // group by its own id and a folder by its folder id (state/sources/repositories/change-tree.ts
    // `collapsedFolds`).

    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import GroupList from '$lib/views/shared/changes/groups/GroupList.svelte';
    import { changeCount } from '$lib/state/sources/repositories/repositories';
    import { collapsedFolds } from '$lib/state/sources/repositories/change-tree';
    import type { GitState } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        root: string;
        git: GitState;
        nav: TreeNav;
        /** The section, group and folder ids the reader closed. */
        collapsed: string[];
        ontoggle: (id: string) => void;
        /** Ask before a write that loses work, in the view's own dialog. */
        ask: (message: string, detail: string, act: () => void, confirm?: string) => void;
        /** Whether the groups list their files or draw them as folders. */
        mode?: 'list' | 'tree';
        /** The ids of the rows the reader selected, which the rows' controls act on together. */
        picked: readonly string[];
        /** A press on a row: true when it only changed the selection, so the row does not open. */
        onpress: (id: string, event: MouseEvent) => boolean;
    };

    let {
        root,
        git,
        nav,
        collapsed,
        ontoggle,
        ask,
        mode = 'list',
        picked,
        onpress
    }: Props = $props();

    const total = $derived(changeCount(git));
    const folds = $derived(collapsedFolds(collapsed, root));
</script>

<div data-group="changes">
    <TreeSection
        label={t('repositories.changes')}
        id="changes"
        {nav}
        count={total}
        badge
        open={!collapsed.includes('changes')}
        ontoggle={() => ontoggle('changes')}
    >
        <GroupList
            {root}
            {git}
            {nav}
            level={2}
            depth={1}
            {mode}
            {folds}
            {ontoggle}
            {ask}
            {picked}
            {onpress}
        />
    </TreeSection>
</div>
