<script lang="ts">
    // Layer 3, partial of views/sources/repositories/graph/Graph.svelte. One commit of the Source
    // Control Graph, drawn from its props alone so a test renders it without the graph's reads: its
    // lanes and circle (the dashed circle of its side for a commit only HEAD or only the upstream
    // holds), its subject, its author muted after it, and at the right the names on it as pills,
    // then its `...` on hover. The commit HEAD is on carries a head pill first, named by the
    // checked-out branch, or by the short hash while HEAD is detached. The pills take VS Code's
    // three colours of the graph's names: the checked-out branch and the local branches the
    // reference colour, a remote branch the remote reference colour with the cloud glyph, and the
    // upstream's base the base reference colour; a tag is a plain pill. The first pill keeps its
    // name, cut at 100 pixels; every other name is drawn as its kind's glyph alone, the names of
    // one kind (local branch, remote branch, base, tag) grouped in one pill with their count when
    // there is more than one, and the names in the pill's tooltip. The subject keeps at least four
    // characters of the row. The checked-out commit's subject and author are at weight 600. The
    // short hash and the time are in the row's hover words, not in the row.
    //
    // A commit's menu, opened by a right-click on the row or by its `...`, opens its files, copies
    // its id or its message, checks out a local branch named on it, deletes a tag on it, and
    // detaches, branches, tags, cherry-picks and compares from it (menus/graph-menu.ts). The
    // checkout and the tag's removal go through the question the Branches or Tags section asks, and
    // every other pick is handed to the graph with the commit it was made on. A right-click on a
    // local branch, a remote branch or a tag pill opens that name's own menu, and the pill of the
    // branch checked out opens Checkout and Delete Branch drawn disabled with their reason; a name
    // offering none (a write in flight) has no menu of its own, so its right-click reaches the
    // commit's.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import {
        commitMenu,
        graphPick,
        refKind,
        refMenu,
        type BranchFacts,
        type CompareFacts,
        type GraphPick,
        type HeadFacts
    } from '../menus/graph-menu';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import Lanes from './Lanes.svelte';
    import { commitPills, type Pill } from './pills';
    import {
        commitKind,
        type GraphSide,
        type LaneRow
    } from '$lib/state/sources/repositories/graph-lanes';
    import type { GitGraphCommit } from '$lib/state/sources/repositories/repositories';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        commit: GitGraphCommit;
        /** The row's id in the tree. */
        id: string;
        nav: TreeNav;
        /** The lanes of the row, in the list the commit is drawn in. */
        lane?: LaneRow;
        /** The side of the upstream the commit is on, when only one of HEAD and it holds it. */
        side?: GraphSide;
        /** Whether the commit's files are open under it. */
        open: boolean;
        branches: BranchFacts;
        /** The refs the compare items name: the upstream and the merge base. */
        compare: CompareFacts;
        /** Whether HEAD contains the commit, and whether HEAD is detached. */
        here: HeadFacts;
        /** Whether a write is in flight on the repository, which offers no checkout or removal. */
        busy: boolean;
        onpick: (hash: string) => void;
        onswitch: (name: string) => void;
        ondeletetag: (name: string) => void;
        /** A pick that acts on the commit or on a name on it, handed with the commit's hash. */
        ongraph: (pick: GraphPick, hash: string) => void;
    };

    let {
        commit,
        id,
        nav,
        lane,
        side,
        open,
        branches,
        compare,
        here,
        busy,
        onpick,
        onswitch,
        ondeletetag,
        ongraph
    }: Props = $props();

    /** The names on the commit: HEAD's pill, local branches, then remote branches, then tags. */
    const pills = $derived<Pill[]>(commitPills(commit, branches, here, compare));

    /** The pill that keeps its name. */
    const first = $derived<Pill | undefined>(pills.at(0));

    /** The other names, one pill of a kind's glyph for each kind that has any. */
    const grouped = $derived(
        (['local', 'remote', 'base', 'tag'] as const)
            .map((kind) => ({
                kind,
                names: pills
                    .slice(1)
                    .filter((one) => one.kind === kind)
                    .map((one) => one.name)
            }))
            .filter((group) => group.names.length > 0)
    );

    const items = $derived<MenuItem[]>(commitMenu(commit, branches, busy, t, compare, here));

    /** A pick from the commit's menu or from a name's on it. */
    function picked(id: string): void {
        const pick = graphPick(id);
        if (pick === null) return;
        if (pick.kind === 'open') onpick(commit.hash);
        else if (pick.kind === 'copy-id') void navigator.clipboard.writeText(commit.hash);
        else if (pick.kind === 'copy-message') void navigator.clipboard.writeText(commit.message);
        else if (pick.kind === 'checkout') onswitch(pick.name);
        else if (pick.kind === 'delete-tag') ondeletetag(pick.name);
        else ongraph(pick, commit.hash);
    }

    /** The menu of one name: a local branch's checkout and removal, a remote's, a tag's removal. */
    function pillMenu(pill: Pill): MenuItem[] {
        if (pill.kind === 'head' && here.detached) return [];
        if (pill.kind === 'tag') return refMenu(pill.name, 'tag', busy, t);
        return refMenu(pill.name, refKind(pill.name, branches), busy, t);
    }

    /** The glyph of the pill that marks the commit HEAD is at. */
    const HEAD_GLYPH = 'head';

    /** The glyph of a remote branch's pill, the base's among them. */
    const REMOTE_GLYPH = 'remote_branch';

    /** The glyph of a kind of name: a remote branch, the base among them, has the cloud. */
    function glyphOf(kind: Pill['kind']): string {
        if (kind === 'head') return HEAD_GLYPH;
        if (kind === 'remote' || kind === 'base') return REMOTE_GLYPH;
        return kind === 'tag' ? 'tag' : 'branch';
    }
</script>

{#snippet pillOf(kind: Pill['kind'], names: string[], whole: boolean)}
    <span class="pill" class:alone={!whole} data-pill={kind} title={names.join('\n')}>
        <Glyph name={glyphOf(kind)} />
        {#if whole}
            <span class="pname">{names[0]}</span>
        {:else if names.length > 1}
            <span class="pcount">{names.length}</span>
        {/if}
    </span>
{/snippet}

{#snippet pillMenued(kind: Pill['kind'], names: string[], whole: boolean)}
    {@const menu = names.length === 1 ? pillMenu({ name: names[0], kind }) : []}
    {#if menu.length > 0}
        <ContextMenu label={names[0]} items={menu} own onpick={picked}>
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render pillOf(kind, names, whole)}
        </ContextMenu>
    {:else}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render pillOf(kind, names, whole)}
    {/if}
{/snippet}

<li role="none" class="commit" data-commit={commit.hash}>
    {#if lane !== undefined}
        <Lanes row={lane} kind={commitKind(commit, commit.head, side)} />
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
                nameStyle="flex: 1 1 auto; min-width: 4ch"
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
                    {#if first !== undefined}
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render pillMenued(first.kind, [first.name], true)}
                    {/if}
                    {#each grouped as group (group.kind)}
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render pillMenued(group.kind, group.names, false)}
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
       line with its circle. The row stands one step in from the Graph's section head, the width
       of one guide of a tree row, its lanes included. */
    .commit {
        display: flex;
        align-items: center;
        min-width: 0;
        padding-left: calc(var(--tree-guide-gap, 4px) + var(--tree-indent) * var(--text-scale, 1));
        border-radius: var(--radius-sm);
        --row-bg: var(--panel);
    }

    .commit:hover {
        --row-bg: var(--chip);
        --actions-display: flex;
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

    /* VS Code's three colours of the graph's names, filled, the words in the ink that reads on the
       fill: the checked-out branch and every local branch in the reference colour, a remote branch
       in the remote reference colour, the upstream's base in the base reference colour. A tag
       keeps the plain pill. */
    .pill[data-pill='head'],
    .pill[data-pill='local'],
    :global(body.wall) .pill[data-pill='head'],
    :global(body.wall) .pill[data-pill='local'] {
        border-color: var(--c-graph-ref);
        background: var(--c-graph-ref);
        color: var(--on-c-graph-ref, var(--ink));
    }

    .pill[data-pill='remote'],
    :global(body.wall) .pill[data-pill='remote'] {
        border-color: var(--c-graph-remote);
        background: var(--c-graph-remote);
        color: var(--on-c-graph-remote, var(--ink));
    }

    .pill[data-pill='base'],
    :global(body.wall) .pill[data-pill='base'] {
        border-color: var(--c-graph-base);
        background: var(--c-graph-base);
        color: var(--on-c-graph-base, var(--ink));
    }

    .pill.alone {
        gap: 2px;
    }

    .pcount {
        font-size: calc(var(--button-font) * var(--text-scale, 1));
    }

    .pname {
        max-width: calc(100px * var(--text-scale, 1));
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>
