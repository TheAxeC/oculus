<script lang="ts">
    // Layer 3, partial of views/sources/repositories/Repo.svelte. VS Code's Source Control Graph:
    // Incoming and Outgoing first when the branch has an upstream (what the upstream holds that
    // HEAD does not, and the other way round), then one row per commit of the checked-out branch's
    // history with its lanes drawn from its parents, the branch and tag names on it and the head
    // marked, fifty at a time with a Load More row after them.
    //
    // Pressing a commit opens its changed files under it, each of which opens that commit's diff of
    // the file; a commit's own menu copies its id or its message. The commit whose files are open
    // is the view's instance state, so the blame of the source tab can open a commit here: one the
    // loaded pages do not reach is drawn above them, with its files, rather than paged for.
    //
    // The history is not on the `git` channel, which carries twenty commits for a glance: it is
    // read from GET /api/git a page at a time, again from the first page whenever the branch's
    // head, its distance from the upstream or its names move, and the rows drawn are handed up for
    // the keyboard's order, the open commit's files under the commit. A commit row opens and closes
    // by a press or by the blame, never by a key, so it is handed up held as it is drawn. A
    // repository with no commit yet has no history to read, so the section says so without asking
    // git, whose log refuses such a branch.
    //
    // The loaded commits grow a page at a time with no cap, so they are drawn through
    // ui/tree/VirtualRows.svelte, which draws only the commits in view of the pane and holds the
    // height of the rest, each commit one item with its files when it is the open one. The open
    // commit stays drawn wherever the list is scrolled, so its files are read once; a key moving to
    // a commit not drawn has it scrolled in first, and the type-ahead reads every commit's subject.

    import { untrack } from 'svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import VirtualRows from '$lib/ui/tree/VirtualRows.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { KeyRow, TreeNav } from '$lib/ui/tree/tree-keys';
    import type { Attachment } from 'svelte/attachments';
    import Lanes from './Lanes.svelte';
    import CommitFiles from './CommitFiles.svelte';
    import { stamp } from '$lib/state/shared/words/format';
    import { laneRows } from '$lib/state/sources/repositories/graph-lanes';
    import {
        graphUrl,
        noCommitYet,
        type GitGraphCommit,
        type GitGraphPage
    } from '$lib/state/sources/repositories/repositories';
    import type { GitState } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        root: string;
        git: GitState;
        nav: TreeNav;
        open: boolean;
        ontoggle: () => void;
        /** The commit whose files are open, the empty string for none. */
        commit: string;
        onpick: (hash: string) => void;
        /** Handed the rows drawn under the section, in order, for the keyboard. */
        onrows: (rows: KeyRow[]) => void;
    };

    let { root, git, nav, open, ontoggle, commit, onpick, onrows }: Props = $props();

    let commits: GitGraphCommit[] = $state([]);
    let incoming: GitGraphCommit[] = $state([]);
    let outgoing: GitGraphCommit[] = $state([]);
    let more = $state(false);
    /** The ids of the open commit's file rows, which follow that commit's row. */
    let fileRows: string[] = $state([]);
    let failure = $state('');
    let reading = $state(false);
    /** Each read takes the next number, and only the newest may write what it read. */
    let asked = 0;

    const lanes = $derived(laneRows(commits));
    const missing = $derived(
        commit !== '' &&
            !commits.some((one) => one.hash === commit) &&
            !incoming.some((one) => one.hash === commit)
    );
    /** What moves the history: the head, the distance from the upstream, the names on commits. */
    const moved = $derived(
        [
            root,
            git.log.at(0)?.hash ?? '',
            git.branch,
            git.ahead,
            git.behind,
            git.tags.map((tag) => tag.name).join(','),
            git.branches.map((branch) => branch.name).join(',')
        ].join('|')
    );

    $effect(() => {
        if (moved === '') return;
        if (untrack(() => noCommitYet(git))) {
            asked += 1;
            commits = [];
            incoming = [];
            outgoing = [];
            more = false;
            failure = '';
            return;
        }
        void load(0);
    });

    $effect(() => {
        const rows: KeyRow[] = [];
        const under = (id: string): void => {
            rows.push({ id, parent: 'graph' });
        };
        /** A commit's row, and its files under it when it is the open one. */
        const row = (id: string, hash: string): void => {
            const open = hash === commit;
            rows.push({ id, parent: 'graph', open, fixed: true });
            if (open) for (const file of fileRows) rows.push({ id: file, parent: id });
        };
        if (missing) row(`commit:${commit}`, commit);
        if (incoming.length > 0) {
            under('graph:incoming');
            for (const one of incoming) row(`in:${one.hash}`, one.hash);
        }
        if (outgoing.length > 0) {
            under('graph:outgoing');
            for (const one of outgoing) row(`out:${one.hash}`, one.hash);
        }
        for (const one of commits) row(`commit:${one.hash}`, one.hash);
        if (more) under('graph:more');
        onrows(rows);
    });

    /** The index of the loaded commit drawing the row `id`: its own, or a file of the open one. */
    function commitAt(id: string): number {
        const hash = id.startsWith('commit:') ? id.slice('commit:'.length) : '';
        const held = fileRows.includes(id) ? commit : hash;
        return held === '' ? -1 : commits.findIndex((one) => one.hash === held);
    }

    /** The open commit's index among the loaded ones, kept drawn so its files are read once. */
    const opened = $derived.by(() => {
        const at = commits.findIndex((one) => one.hash === commit);
        return at < 0 ? [] : [at];
    });

    /** The subject of a loaded commit by its row id, for the type-ahead. */
    function subjectOf(id: string): string | undefined {
        if (!id.startsWith('commit:')) return undefined;
        const hash = id.slice('commit:'.length);
        return commits.find((one) => one.hash === hash)?.subject;
    }

    async function load(skip: number): Promise<void> {
        asked += 1;
        const mine = asked;
        reading = true;
        try {
            const response = await fetch(graphUrl(root, skip));
            const body = (await response.json()) as { page?: GitGraphPage; error?: string };
            if (mine !== asked) return;
            if (!response.ok || body.page === undefined) {
                failure = body.error ?? t('repositories.graph_failed');
                return;
            }
            failure = '';
            const page = body.page;
            commits = skip === 0 ? page.commits : [...commits, ...page.commits];
            if (skip === 0) {
                incoming = page.incoming;
                outgoing = page.outgoing;
            }
            more = page.more;
        } catch {
            if (mine === asked) failure = t('repositories.graph_failed');
        } finally {
            if (mine === asked) reading = false;
        }
    }

    /** A commit's menu: its id or its whole message to the clipboard. */
    function copied(one: GitGraphCommit, id: string): void {
        void navigator.clipboard.writeText(id === 'id' ? one.hash : one.message);
    }

    const menu = [
        { id: 'id', label: t('repositories.copy_id') },
        { id: 'message', label: t('repositories.copy_message') }
    ];
</script>

{#snippet row(one: GitGraphCommit, id: string, drawn: number)}
    <li role="none" class="commit" data-commit={one.hash}>
        {#if drawn >= 0}
            <Lanes row={lanes[drawn]} head={one.head} />
        {/if}
        <div class="item">
            <TreeItem
                label={one.subject}
                {id}
                {nav}
                level={2}
                current={one.head}
                expanded={commit === one.hash}
                title={t('repositories.commit_title', one.short, one.author, one.when.slice(0, 10))}
                onclick={() => onpick(commit === one.hash ? '' : one.hash)}
            >
                {#snippet detail()}
                    {#each one.refs as name (name)}
                        <span class="ref">{name}</span>
                    {/each}
                    {#each one.tags as name (name)}
                        <span class="ref tag">{name}</span>
                    {/each}
                    <span class="hash">{one.short}</span>
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
                        items={menu}
                        onpick={(picked: string) => copied(one, picked)}
                    />
                {/snippet}
                {#snippet end()}
                    {stamp(one.when)}
                {/snippet}
            </TreeItem>
        </div>
    </li>
    {#if commit === one.hash}
        <CommitFiles {root} hash={one.hash} {nav} onrows={(ids: string[]) => (fileRows = ids)} />
    {/if}
{/snippet}

<div data-group="graph">
    <TreeSection
        label={t('repositories.graph')}
        id="graph"
        {nav}
        count={commits.length}
        {open}
        {ontoggle}
    >
        {#if failure !== ''}
            <li role="none">
                <TreeItem label={failure} tone="error" />
            </li>
        {/if}
        {#if missing}
            <li role="none" data-commit={commit}>
                <TreeItem
                    label={t('repositories.commit_outside', commit.slice(0, 7))}
                    id={`commit:${commit}`}
                    {nav}
                    level={2}
                    glyph="commit"
                    expanded
                    onclick={() => onpick('')}
                />
            </li>
            <CommitFiles {root} hash={commit} {nav} onrows={(ids: string[]) => (fileRows = ids)} />
        {/if}
        {#if incoming.length > 0}
            <li role="none" data-graph="incoming">
                <TreeItem
                    label={t('repositories.incoming')}
                    id="graph:incoming"
                    {nav}
                    level={2}
                    glyph="behind"
                    count={incoming.length}
                />
            </li>
            {#each incoming as one (one.hash)}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render row(one, `in:${one.hash}`, -1)}
            {/each}
        {/if}
        {#if outgoing.length > 0}
            <li role="none" data-graph="outgoing">
                <TreeItem
                    label={t('repositories.outgoing')}
                    id="graph:outgoing"
                    {nav}
                    level={2}
                    glyph="ahead"
                    count={outgoing.length}
                />
            </li>
            {#each outgoing as one (one.hash)}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render row(one, `out:${one.hash}`, -1)}
            {/each}
        {/if}
        {#if commits.length === 0 && failure === ''}
            <li role="none">
                <TreeItem
                    label={reading ? t('repositories.graph_pending') : t('repositories.log_empty')}
                    tone="muted"
                />
            </li>
        {/if}
        <VirtualRows
            count={commits.length}
            key={(at: number) => commits[at].hash}
            {nav}
            owns={commitAt}
            label={subjectOf}
            keep={opened}
        >
            {#snippet item(at: number, measure: Attachment<HTMLElement>)}
                <li role="none" class="entry" {@attach measure}>
                    <ul class="entry-rows" role="none">
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render row(commits[at], `commit:${commits[at].hash}`, at)}
                    </ul>
                </li>
            {/snippet}
        </VirtualRows>
        {#if more}
            <li role="none" data-graph="more">
                <TreeItem
                    label={t('repositories.graph_more')}
                    id="graph:more"
                    {nav}
                    level={2}
                    glyph="expand"
                    onclick={() => void load(commits.length)}
                />
            </li>
        {/if}
    </TreeSection>
</div>

<style>
    /* One commit of the list and its files when it is the open one, measured as one item. */
    .entry {
        min-width: 0;
    }

    .entry-rows {
        display: flex;
        flex-direction: column;
        margin: 0;
        padding: 0;
        list-style: none;
        min-width: 0;
    }

    .commit {
        display: flex;
        align-items: center;
        min-width: 0;
    }

    .item {
        flex: 1 1 auto;
        min-width: 0;
    }

    .ref {
        margin-right: 4px;
        padding: 0 4px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        color: var(--c-blue-txt);
    }

    .ref.tag {
        color: var(--c-amber-txt);
    }

    .hash {
        font-family: var(--font-mono);
    }
</style>
