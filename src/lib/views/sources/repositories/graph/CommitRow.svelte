<script lang="ts">
    // Layer 3, partial of views/sources/repositories/graph/Graph.svelte. One commit of the Source
    // Control Graph, drawn from its props alone so a test renders it without the graph's reads: its
    // lanes and circle, its subject, its author muted after it, and at the right the branch and tag
    // names on it as pills, then its `...` on hover. The checked-out commit's subject and author
    // are at weight 600. The short hash and the time are in the row's hover words, not in the row.
    //
    // A commit's menu, opened by a right-click on the row or by its `...`, opens its files, copies
    // its id or its message, checks out a local branch named on it and deletes a tag on it, each
    // through the question the Branches or Tags section asks. A right-click on a local branch or a
    // tag pill opens that name's own menu; a name offering none (a write in flight) has no menu of
    // its own, so its right-click reaches the commit's.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import { commitMenu, graphPick, refKind, refMenu, type BranchFacts } from '../menus/graph-menu';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import Lanes from './Lanes.svelte';
    import { commitKind, type LaneRow } from '$lib/state/sources/repositories/graph-lanes';
    import type { GitGraphCommit } from '$lib/state/sources/repositories/repositories';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        commit: GitGraphCommit;
        /** The row's id in the tree. */
        id: string;
        nav: TreeNav;
        /** The lanes of the row, in the list the commit is drawn in. */
        lane?: LaneRow;
        /** Whether the commit's files are open under it. */
        open: boolean;
        branches: BranchFacts;
        /** Whether a write is in flight on the repository, which offers no checkout or removal. */
        busy: boolean;
        onpick: (hash: string) => void;
        onswitch: (name: string) => void;
        ondeletetag: (name: string) => void;
    };

    let { commit, id, nav, lane, open, branches, busy, onpick, onswitch, ondeletetag }: Props =
        $props();

    type Pill = { name: string; kind: 'local' | 'remote' | 'tag' };

    /** The names on the commit: local branches first, then remote branches, then tags. */
    const pills = $derived<Pill[]>([
        ...commit.refs
            .filter((name) => branches.local.includes(name))
            .map((name): Pill => ({ name, kind: 'local' })),
        ...commit.refs
            .filter((name) => !branches.local.includes(name))
            .map((name): Pill => ({ name, kind: 'remote' })),
        ...commit.tags.map((name): Pill => ({ name, kind: 'tag' }))
    ]);

    const items = $derived<MenuItem[]>(commitMenu(commit, branches, busy, t));

    /** A pick from the commit's menu or from a name's on it. */
    function picked(id: string): void {
        const pick = graphPick(id);
        if (pick === null) return;
        if (pick.kind === 'open') onpick(commit.hash);
        else if (pick.kind === 'copy-id') void navigator.clipboard.writeText(commit.hash);
        else if (pick.kind === 'copy-message') void navigator.clipboard.writeText(commit.message);
        else if (pick.kind === 'checkout') onswitch(pick.name);
        else ondeletetag(pick.name);
    }

    /** The menu of one pill: a checkout on a local branch not checked out, a tag's removal. */
    function pillMenu(pill: Pill): MenuItem[] {
        if (pill.kind === 'tag') return refMenu(pill.name, 'tag', busy, t);
        return refMenu(pill.name, refKind(pill.name, branches), busy, t);
    }
</script>

{#snippet pillOf(pill: Pill)}
    <span class="pill" data-pill={pill.kind} title={pill.name}>
        <Glyph name={pill.kind === 'tag' ? 'tag' : 'branch'} />
        <span class="pname">{pill.name}</span>
    </span>
{/snippet}

<li role="none" class="commit" data-commit={commit.hash}>
    {#if lane !== undefined}
        <Lanes row={lane} kind={commitKind(commit, commit.head)} />
    {/if}
    <div class="item">
        <ContextMenu label={commit.subject} {items} onpick={picked}>
            <TreeItem
                label={commit.subject}
                {id}
                {nav}
                level={2}
                strong={commit.head}
                expanded={open}
                trailing
                title={t(
                    'repositories.commit_title',
                    commit.short,
                    commit.author,
                    commit.when.slice(0, 10),
                    commit.when.slice(11, 16)
                )}
                onclick={() => onpick(open ? '' : commit.hash)}
            >
                {#snippet detail()}
                    <span class="author">{commit.author}</span>
                {/snippet}
                {#snippet end()}
                    {#each pills as pill (`${pill.kind}:${pill.name}`)}
                        {@const menu = pillMenu(pill)}
                        {#if menu.length > 0}
                            <ContextMenu label={pill.name} items={menu} own onpick={picked}>
                                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                                {@render pillOf(pill)}
                            </ContextMenu>
                        {:else}
                            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                            {@render pillOf(pill)}
                        {/if}
                    {/each}
                {/snippet}
                {#snippet actions(reach: number)}
                    <Menu
                        label={t('repositories.commit_menu')}
                        glyph="more"
                        compact
                        bare
                        tabindex={reach}
                        placement="down"
                        align="right"
                        {items}
                        onpick={picked}
                    />
                {/snippet}
            </TreeItem>
        </ContextMenu>
    </div>
</li>

<style>
    /* The ring of a circle is the row's own background, which the lanes, drawn beside the row and
       not inside it, read from here: the two values TreeItem gives its own line at rest and under
       the pointer (a graph row is never drawn selected, so its third value has no row here).
       Under the pointer the same background is painted under the lanes, so the row reads as one
       line with its circle. */
    .commit {
        display: flex;
        align-items: center;
        min-width: 0;
        border-radius: var(--radius-sm);
        --row-bg: var(--panel);
    }

    .commit:hover {
        --row-bg: var(--chip);
        --actions-opacity: 1;
        background: var(--row-bg);
    }

    .item {
        flex: 1 1 auto;
        min-width: 0;
    }

    /* The author after the subject: 0.9 of the row's size (the detail part is drawn at the small
       size, so it is sized from the tree's font token), dimmed, half an em from it. */
    .author {
        font-size: calc(var(--tree-font) * var(--text-scale, 1) * 0.9);
        margin-left: 0.5em;
        opacity: 0.7;
    }

    /* A name on the commit: 10px round, an 18px line of words at the button size (12px), 4px from
       the next, the icon and then the name cut at 100px, the sizes at the text's own scale. It
       does not shrink; the row's subject is what is cut. */
    .pill {
        display: inline-flex;
        flex: none;
        align-items: center;
        margin-left: 4px;
        padding: 0 4px;
        border: 1px solid var(--line);
        border-radius: 10px;
        background: var(--panel);
        color: var(--ink-txt, var(--ink));
        font-family: var(--font-ui);
        font-variant-numeric: tabular-nums;
        font-size: calc(var(--button-font) * var(--text-scale, 1));
        line-height: calc(18px * var(--text-scale, 1));
    }

    :global(body.wall) .pill {
        background: transparent;
    }

    .pill[data-pill='local'],
    :global(body.wall) .pill[data-pill='local'] {
        background: var(--accent-bg);
        color: var(--on-accent-bg, var(--ink));
    }

    .pname {
        max-width: calc(100px * var(--text-scale, 1));
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>
