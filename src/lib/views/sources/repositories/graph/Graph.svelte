<script lang="ts">
    // Layer 3, partial of views/sources/repositories/Repo.svelte. VS Code's Source Control Graph:
    // Incoming and Outgoing first when the branch has an upstream (what the upstream holds that
    // HEAD does not, and the other way round), then one row per commit of the checked-out branch's
    // history with its lanes drawn from its parents, the branch and tag names on it as pills and
    // the head's subject in bold, fifty at a time with a Load More row after them.
    //
    // While the section is open its head carries, on hover, Go to Current (HEAD's row scrolled into
    // view with the focus on it; not drawn for a repository with no commit), Fetch, Pull and Push
    // when the branch has an upstream, and Publish Branch when it has none and a remote to go to.
    // Fetch acts at once; Pull, Push and Publish ask the question the view's `...` menu asks. All
    // but Go to Current wait while a write is in flight on the repository.
    //
    // The commits under Incoming and under Outgoing are drawn as the others are, each list with
    // its own lanes laid out over its commits alone, under the head row's dashed circle.
    //
    // Pressing a commit opens its changed files under it, each of which opens that commit's diff of
    // the file, with the lanes that pass beside them. A commit's menu and its names' menus are
    // graph/CommitRow.svelte's. The commit whose files are open is the view's instance state, so
    // the blame of the source tab can open a commit here: one the loaded pages do not reach is
    // drawn above them, with its files, rather than paged for.
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
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { BranchFacts } from '../menus/graph-menu';
    import type { KeyRow, TreeNav } from '$lib/ui/tree/tree-keys';
    import type { Attachment } from 'svelte/attachments';
    import CommitRow from './CommitRow.svelte';
    import CommitFiles from './CommitFiles.svelte';
    import GraphHead from './GraphHead.svelte';
    import { readJson } from '$lib/data/shapes/shapes';
    import { graphPageOf } from '$lib/state/sources/repositories/answers';
    import {
        laneRows,
        lanesBelow,
        type LaneRow
    } from '$lib/state/sources/repositories/graph-lanes';
    import {
        canPublish,
        graphUrl,
        noCommitYet,
        publishWords,
        pullWords,
        pushWords,
        upstreamOf,
        type GitGraphCommit
    } from '$lib/state/sources/repositories/repositories';
    import type { GitState } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

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
        /** Whether a write is in flight on the repository, which offers no checkout or removal. */
        busy: boolean;
        /** Check a local branch out, through the Branches section's question. */
        onswitch: (name: string) => void;
        /** Delete a tag, through the Tags section's question. */
        ondeletetag: (name: string) => void;
        /** Ask a question, then run what it is about on a yes. */
        ask: (message: string, detail: string, act: () => void) => void;
        /** Whether the open commit's files are listed or drawn as a tree. */
        mode?: 'list' | 'tree';
        /** The ids of the folders and sections the reader closed. */
        collapsed?: readonly string[];
        /** Open or close a folder of the open commit's files. */
        onfolder?: (id: string) => void;
        /**
         * The lists the component starts with, before its read replaces them. A render that runs
         * no effect, as a server rendering does not, draws these.
         */
        seed?: {
            commits?: GitGraphCommit[];
            incoming?: GitGraphCommit[];
            outgoing?: GitGraphCommit[];
        };
    };

    let {
        root,
        git,
        nav,
        open,
        ontoggle,
        commit,
        onpick,
        onrows,
        busy,
        onswitch,
        ondeletetag,
        ask,
        mode = 'list',
        collapsed = [],
        onfolder = () => undefined,
        seed = {}
    }: Props = $props();

    const { repositories } = useState();

    // The seed is the lists the component starts with; the read below replaces them.
    let commits: GitGraphCommit[] = $state(untrack(() => seed.commits ?? []));
    let incoming: GitGraphCommit[] = $state(untrack(() => seed.incoming ?? []));
    let outgoing: GitGraphCommit[] = $state(untrack(() => seed.outgoing ?? []));
    let more = $state(false);
    /** The open commit's file and folder rows, which follow that commit's row. */
    let fileRows: Partial<Record<string, KeyRow[]>> = $state({});
    let failure = $state('');
    let reading = $state(false);
    /** Each read takes the next number, and only the newest may write what it read. */
    let asked = 0;

    /** The lanes of each list, laid out over that list's commits alone. */
    const lanes = $derived(laneRows(commits));
    const lanesIncoming = $derived(laneRows(incoming));
    const lanesOutgoing = $derived(laneRows(outgoing));
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
        const row = (id: string, hash: string, place: string): void => {
            const open = hash === commit;
            rows.push({ id, parent: 'graph', open, fixed: true });
            if (open)
                for (const file of fileRows[place] ?? [])
                    rows.push({ ...file, parent: file.parent ?? id });
        };
        if (missing) row(`commit:${commit}`, commit, 'outside');
        if (incoming.length > 0) {
            under('graph:incoming');
            for (const one of incoming) row(`in:${one.hash}`, one.hash, 'in');
        }
        if (outgoing.length > 0) {
            under('graph:outgoing');
            for (const one of outgoing) row(`out:${one.hash}`, one.hash, 'out');
        }
        for (const one of commits) row(`commit:${one.hash}`, one.hash, 'log');
        if (more) under('graph:more');
        onrows(rows);
    });

    /** The index of the loaded commit drawing the row `id`: its own, or a file of the open one. */
    function commitAt(id: string): number {
        const hash = id.startsWith('commit:') ? id.slice('commit:'.length) : '';
        const held = (fileRows.log ?? []).some((file) => file.id === id) ? commit : hash;
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
            const read = graphPageOf(response.ok, await readJson(response));
            if (mine !== asked) return;
            if (read.page === null) {
                failure = read.failure;
                return;
            }
            failure = '';
            const page = read.page;
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

    /** The local branches a name on a commit is read against. */
    const branches = $derived<BranchFacts>({
        local: git.branches.map((branch) => branch.name),
        current: git.detached ? '' : git.branch
    });

    /** Whether the branch has an upstream to pull from and push to. */
    const tracked = $derived(git.upstream === true && upstreamOf(git) !== '');

    /** Ask a question, then run the write it names. */
    function question(words: { message: string; detail: string }, act: () => void): void {
        ask(words.message, words.detail, act);
    }

    /** Scroll HEAD's row into view and put the focus on it. */
    function gotoCurrent(): void {
        const head = commits.find((one) => one.head) ?? commits.at(0);
        if (head !== undefined) nav.focus(`commit:${head.hash}`);
    }
</script>

{#snippet entry(one: GitGraphCommit, id: string, place: string, lane: LaneRow | undefined)}
    <CommitRow
        commit={one}
        {id}
        {nav}
        {lane}
        open={commit === one.hash}
        {branches}
        {busy}
        {onpick}
        {onswitch}
        {ondeletetag}
    />
    {#if commit === one.hash}
        <CommitFiles
            {root}
            hash={one.hash}
            {place}
            {nav}
            passing={lane === undefined ? [] : lanesBelow(lane)}
            open={lane === undefined ? -1 : lane.lane}
            {mode}
            {collapsed}
            {onfolder}
            onrows={(rows: KeyRow[]) => (fileRows[place] = rows)}
        />
    {/if}
{/snippet}

{#snippet headActions(reach: number)}
    {#if open}
        {#if !noCommitYet(git)}
            <ToolButton
                label={t('repositories.goto_current')}
                glyph="goto_current"
                compact
                tabindex={reach}
                onclick={gotoCurrent}
            />
        {/if}
        <ToolButton
            label={t('repositories.fetch')}
            title={busy ? t('git.busy') : undefined}
            glyph="fetch"
            compact
            tabindex={reach}
            disabled={busy}
            onclick={() => void repositories.fetch(root)}
        />
        {#if tracked}
            <ToolButton
                label={t('repositories.pull')}
                title={busy ? t('git.busy') : undefined}
                glyph="pull"
                compact
                tabindex={reach}
                disabled={busy}
                onclick={() => question(pullWords(git), () => void repositories.pull(root))}
            />
            <ToolButton
                label={t('git.push')}
                title={busy ? t('git.busy') : undefined}
                glyph="push"
                compact
                tabindex={reach}
                disabled={busy}
                onclick={() => question(pushWords(git), () => void repositories.push(root))}
            />
        {:else if canPublish(git)}
            <ToolButton
                label={t('repositories.publish')}
                title={busy ? t('git.busy') : undefined}
                glyph="publish"
                compact
                tabindex={reach}
                disabled={busy}
                onclick={() =>
                    question(
                        publishWords(git, git.remotes[0]),
                        () => void repositories.publish(root, git.remotes[0])
                    )}
            />
        {/if}
    {/if}
{/snippet}

<div data-group="graph">
    <TreeSection
        label={t('repositories.graph')}
        id="graph"
        {nav}
        count={commits.length}
        badge
        {open}
        {ontoggle}
        actions={headActions}
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
            <CommitFiles
                {root}
                hash={commit}
                place="outside"
                {nav}
                passing={[]}
                open={-1}
                {mode}
                {collapsed}
                {onfolder}
                onrows={(rows: KeyRow[]) => (fileRows.outside = rows)}
            />
        {/if}
        {#if incoming.length > 0}
            <GraphHead kind="incoming" {nav} count={incoming.length} />
            {#each incoming as one, at (one.hash)}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render entry(one, `in:${one.hash}`, 'in', lanesIncoming[at])}
            {/each}
        {/if}
        {#if outgoing.length > 0}
            <GraphHead kind="outgoing" {nav} count={outgoing.length} />
            {#each outgoing as one, at (one.hash)}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render entry(one, `out:${one.hash}`, 'out', lanesOutgoing[at])}
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
                        {@render entry(commits[at], `commit:${commits[at].hash}`, 'log', lanes[at])}
                    </ul>
                </li>
            {/snippet}
        </VirtualRows>
        {#if more}
            <GraphHead kind="more" {nav} onmore={() => void load(commits.length)} />
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
</style>
