<script lang="ts">
    // Layer 3, partial of views/sources/repositories/Repo.svelte. VS Code's Source Control Graph:
    // Incoming and Outgoing first when the branch has an upstream (what the upstream holds that
    // HEAD does not, and the other way round), then one row per commit of the checked-out branch's
    // history with its lanes drawn from its parents, the names on it as pills (the first whole, the
    // rest as glyphs grouped by kind, and a head pill on HEAD's commit) and the head's subject in
    // bold, fifty at a time with a Load More row after them.
    //
    // While the section is open its head carries, on hover, Go to Current (HEAD's row scrolled into
    // view with the focus on it; not drawn for a repository with no commit), Fetch, Pull and Push
    // when the branch has an upstream, and Publish Branch when it has none and a remote to go to.
    // Fetch acts at once; Pull, Push and Publish ask the question the view's `...` menu asks. All
    // but Go to Current wait while a write is in flight on the repository.
    //
    // The commits under Incoming and under Outgoing are drawn as the others are, each list with its
    // own lanes laid out over its commits alone, under the head row's dashed circle.
    //
    // Pressing a commit opens its changed files under it, each of which opens that commit's diff of
    // the file, with the lanes that pass beside them. A commit's menu and its names' menus are
    // graph/CommitRow.svelte's, and the section head's actions graph/GraphActions.svelte's. The
    // commit whose files are open is the view's instance state, so the blame of the source tab can
    // open a commit here: one the loaded pages do not reach is drawn above them, with its files,
    // rather than paged for.
    //
    // The picks of a commit's menu that write or compare are answered here: Checkout (Detached),
    // Cherry Pick and Delete Branch behind a question, Create Branch and Create Tag in a prompt
    // that asks for the name, and for a tag its message, the new ref starting at the commit, both
    // built in graph-picks.ts, and the compare items opening a diff pane. Compare with Remote names
    // the checked-out branch's upstream, Compare with Merge Base the base the first page of the
    // history carries, and Compare with... asks for any ref in a quick pick over the refs git
    // lists.
    //
    // The history is not on the `git` channel, which carries twenty commits for a glance: it is
    // read from GET /api/git a page at a time, again from the first page whenever the branch's
    // head, its distance from the upstream or its names move (a hidden tab reads once, when it is
    // shown), and the rows drawn are handed up for the keyboard's order, the open commit's files
    // under the commit. A commit row opens and closes by a press or by the blame, never by a key,
    // so it is handed up held as it is drawn. A repository with no commit yet has no history to
    // read, so the section says so without asking git, whose log refuses such a branch.
    //
    // The loaded commits grow a page at a time with no cap, so they are drawn through
    // ui/tree/list/VirtualRows.svelte, which draws only the commits in view of the pane and holds
    // the height of the rest, each commit one item with its files when it is the open one. The open
    // commit stays drawn wherever the list is scrolled, so its files are read once; a key moving to
    // a commit not drawn has it scrolled in first, and the type-ahead reads every commit's subject.

    import { untrack } from 'svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import VirtualRows from '$lib/ui/tree/list/VirtualRows.svelte';
    import Prompt from '$lib/ui/forms/Prompt.svelte';
    import type { PromptRequest } from '$lib/ui/forms/prompt';
    import QuickPick from '$lib/ui/forms/choice/QuickPick.svelte';
    import type { Choice } from '$lib/ui/forms/choice/quick-pick';
    import type { BranchFacts, GraphPick, HeadFacts } from '../menus/graph-menu';
    import { askPick, namePrompt } from './graph-picks';
    import type { KeyRow, TreeNav } from '$lib/ui/tree/tree-keys';
    import type { Attachment } from 'svelte/attachments';
    import CommitRow from './CommitRow.svelte';
    import CommitFiles from './CommitFiles.svelte';
    import GraphHead from './GraphHead.svelte';
    import GraphActions from './GraphActions.svelte';
    import { readJson } from '$lib/data/shapes/shapes';
    import { graphPageOf, refNamesOf } from '$lib/state/sources/repositories/answers';
    import {
        laneRows,
        lanesBelow,
        type LaneRow
    } from '$lib/state/sources/repositories/graph-lanes';
    import {
        graphUrl,
        refsUrl,
        noCommitYet,
        upstreamOf,
        type GitGraphCommit
    } from '$lib/state/sources/repositories/repositories';
    import type { GitState } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { shownGate, useShown, useState } from '$lib/state/client/use';

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
        ask: (message: string, detail: string, act: () => void, confirm?: string) => void;
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
    const gate = shownGate(useShown());

    // The seed is the lists the component starts with; the read below replaces them.
    let commits: GitGraphCommit[] = $state(untrack(() => seed.commits ?? []));
    let incoming: GitGraphCommit[] = $state(untrack(() => seed.incoming ?? []));
    let outgoing: GitGraphCommit[] = $state(untrack(() => seed.outgoing ?? []));
    let more = $state(false);
    /** The open commit's file and folder rows, which follow that commit's row. */
    let fileRows: Partial<Record<string, KeyRow[]>> = $state({});
    let failure = $state('');
    /** The merge base the first page named for the checked-out branch, or the empty string. */
    let base = $state('');
    /** The prompt of Create Branch or Create Tag while one is open. */
    let prompting: PromptRequest | null = $state(null);
    /** The refs and the commit of Compare with... while its quick pick is open. */
    let comparing: { hash: string; choices: Choice[] } | null = $state(null);
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
            gate.clear();
            return;
        }
        if (gate.due([moved])) void load(0);
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
                base = page.base ?? '';
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
        current: git.detached ? '' : git.branch,
        remotes: git.remotes
    });

    /** The refs the compare items name: the upstream and the merge base. */
    const compare = $derived({ upstream: upstreamOf(git), base });

    /** What HEAD says of a commit of a list: the log and the outgoing commits are HEAD's own. */
    function hereOf(place: string): HeadFacts {
        return { contained: place !== 'in', detached: git.detached };
    }

    /** Open the refs git lists in a quick pick, to compare the commit with the one chosen. */
    async function graphCompareWith(hash: string): Promise<void> {
        try {
            const response = await fetch(refsUrl(root));
            const names = refNamesOf(response.ok, await readJson(response));
            if (names === null) {
                failure = t('repositories.refs_failed');
                return;
            }
            comparing = { hash, choices: names.map((name) => ({ id: name, label: name })) };
        } catch {
            failure = t('repositories.refs_failed');
        }
    }

    /** A pick of a commit's menu that the commit row does not answer itself. */
    function graphPicked(pick: GraphPick, hash: string): void {
        if (pick.kind === 'create-branch' || pick.kind === 'create-tag') {
            prompting = namePrompt(pick, hash, { root, repositories, t }, () => {
                prompting = null;
            });
        } else if (pick.kind === 'compare-remote')
            repositories.openCompare(root, compare.upstream, hash);
        else if (pick.kind === 'compare-base') repositories.openCompare(root, compare.base, hash);
        else if (pick.kind === 'compare-with') void graphCompareWith(hash);
        else {
            const onto = git.detached ? 'HEAD' : git.branch;
            askPick(pick, hash, { root, onto, ask, repositories, t });
        }
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
        {compare}
        here={hereOf(place)}
        {busy}
        {onpick}
        {onswitch}
        {ondeletetag}
        ongraph={graphPicked}
    />
    {#if commit === one.hash}
        <CommitFiles
            {root}
            hash={one.hash}
            short={one.short}
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
        <GraphActions {root} {git} {busy} {reach} {ask} ongoto={gotoCurrent} />
    {/if}
{/snippet}

<div data-group="graph">
    <TreeSection
        label={t('repositories.graph')}
        id="graph"
        {nav}
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
                short={commit.slice(0, 7)}
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

{#if prompting !== null}
    <Prompt
        request={prompting}
        cancel={t('ui.confirm_cancel')}
        oncancel={() => (prompting = null)}
    />
{/if}

{#if comparing !== null}
    <QuickPick
        title={t('repositories.compare_title')}
        placeholder={t('repositories.compare_placeholder')}
        choices={comparing.choices}
        onpick={(ref: string) => {
            const hash = comparing?.hash ?? '';
            comparing = null;
            repositories.openCompare(root, ref, hash);
        }}
        onclose={() => (comparing = null)}
    />
{/if}

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
