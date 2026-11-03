<script lang="ts">
    // Layer 3, partial of ChangesSection.svelte beside it. The repository the session works in, as
    // the second group row of the Changes section: The repository, a row of the section's tree that
    // folds, with the number of files in its change groups as a badge whenever git has read it, "0"
    // for a clean repository as the Repositories view's groups say, and no badge while it is not
    // readable; under it while it is open whichever of its six shapes the repository is in. Five
    // say why there is nothing to draw (no workspace, no folder, no repository, a failed read, not
    // read yet) in one row; a readable one is ChangesRepo.svelte. It asks before a write and
    // presses through state/sources/repositories/repositories.svelte.ts, the store the
    // Repositories view presses through, so which repository has a write in flight and what the
    // last write answered are the same in both. The branches are listed while the section is open,
    // once when it opens and again whenever the repository's state changes, and not at all while
    // it is closed.

    import AskConfirm from '$lib/views/shared/writes/AskConfirm.svelte';
    import type { Ask } from '$lib/views/shared/writes/ask';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { readJson } from '$lib/data/shapes/shapes';
    import { t } from '$lib/state/shared/words/text';
    import { branchesOf } from '$lib/state/sources/repositories/answers';
    import type { GroupFolds } from '$lib/state/sources/repositories/change-tree';
    import { changeCount, repoShape } from '$lib/state/sources/repositories/repositories';
    import ChangesRepo from './ChangesRepo.svelte';
    import { REPOSITORY_ROW } from './changes-folds';
    import type { GroupedSession } from '$lib/state/client/selectors.svelte';
    import { shownGate, useShown, useState } from '$lib/state/client/use';

    const {
        repositories,
        selectors: { gitFor, touchers }
    } = useState();

    type Props = {
        record: GroupedSession;
        nav: TreeNav;
        /** Whether the group row is open. */
        open: boolean;
        ontoggle: () => void;
        /** Whether the change groups list their files or draw them as folders. */
        mode: 'list' | 'tree';
        /** The ids the change groups and folders fold under, and which of them are folded. */
        folds: GroupFolds;
        /** Fold or unfold the change group or folder that folds under this id. */
        onfold: (id: string) => void;
        /** The ids of the change rows selected. */
        picked: readonly string[];
        /** A press on a change row: true when it only changed the selection. */
        onpress: (id: string, event: MouseEvent) => boolean;
    };

    let { record, nav, open, ontoggle, mode, folds, onfold, picked, onpress }: Props = $props();
    const gate = shownGate(useShown());
    type Branch = { name: string; upstream: string; current: boolean };

    const workspace = $derived(record.workspace);
    const repo = $derived(workspace === '' ? null : gitFor(workspace));
    const shape = $derived(repoShape(workspace, repo));
    const readable = $derived(shape === 'readable' ? repo : null);
    /** The files of the change groups while git has read the repository, else nothing to count. */
    const count = $derived(readable === null ? undefined : changeCount(readable));
    let branchName = $state('');
    let asking: Ask | null = $state(null);
    let branches: Branch[] = $state([]);
    // Each listing asked for takes the next number, and only the newest one may write `branches`: a
    // listing that answers after the workspace changed, or after a later listing was asked for, is
    // for a state the section does not draw.
    let asked = 0;
    const busy = $derived(workspace !== '' && repositories.busy(workspace));
    const outcome = $derived(workspace === '' ? '' : repositories.outcome(workspace));

    $effect(() => {
        const root = workspace;
        // The state itself is read, so every state the channel sends lists again: a commit or a
        // switch made elsewhere changes the branches without changing the shape. A hidden tab lists
        // again once when it is shown, if a state came meanwhile.
        const state = repo;
        if (repoShape(root, state) !== 'readable') {
            asked += 1;
            branches = [];
            gate.clear();
            return;
        }
        if (gate.due([state])) void load(root);
    });

    async function load(root: string): Promise<void> {
        asked += 1;
        const mine = asked;
        let listed: Branch[];
        try {
            const response = await fetch(`/api/git?root=${encodeURIComponent(root)}`);
            listed = branchesOf(await readJson(response));
        } catch {
            listed = [];
        }
        if (mine === asked) branches = listed;
    }

    function shared(path: string): string[] {
        if (path === '') return [];
        return touchers(`${workspace}/${path}`, record.id).map((session) => session.title);
    }

    function ask(question: string, detail: string, run: () => void, confirm?: string): void {
        asking = { message: question, detail, act: run, confirm };
    }
    function switchTo(name: string): void {
        if (name === '' || name === repo?.branch) return;
        const root = workspace;
        ask(t('git.branch_switch_confirm', name), t('git.branch_switch_detail'), async () => {
            await repositories.switchBranch(root, name);
            await load(root);
        });
    }
    function createBranch(): void {
        const name = branchName.trim();
        if (name === '') return;
        const root = workspace;
        ask(t('git.branch_new_confirm', name), t('git.branch_switch_detail'), async () => {
            await repositories.createBranch(root, name);
            branchName = '';
            await load(root);
        });
    }
    const branchItems = $derived<MenuItem[]>(
        branches.map((one) => ({ id: one.name, label: one.name, active: one.current }))
    );

    /** The one row a repository with nothing to draw says, and whether it says a failure. */
    const said = $derived.by(() => {
        if (shape === 'unplaced') return { words: t('sessions.ch_noworkspace'), error: false };
        if (shape === 'missing') return { words: t('sessions.ch_nofolder'), error: false };
        if (shape === 'none') return { words: t('sessions.ch_norepo'), error: false };
        if (shape === 'failed') {
            return { words: t('sessions.ch_failed', repo?.error ?? ''), error: true };
        }
        return { words: t('sessions.ch_reading'), error: false };
    });
</script>

<li role="none" data-repository>
    <TreeItem
        label={t('sessions.ch_repo')}
        id={REPOSITORY_ROW}
        {nav}
        level={2}
        depth={1}
        {count}
        badge
        expanded={open}
        title={workspace === '' ? undefined : workspace}
        onclick={ontoggle}
    />
</li>
{#if open && readable !== null}
    <ChangesRepo
        root={workspace}
        state={readable}
        session={record.id}
        {nav}
        {mode}
        {folds}
        {onfold}
        {picked}
        {onpress}
        {ask}
        {branchItems}
        {busy}
        busyWords={repositories.busyWords(workspace)}
        {branchName}
        {outcome}
        {shared}
        onswitch={switchTo}
        onbranch={createBranch}
        onbranchname={(next: string) => (branchName = next)}
        oncancel={repositories.suggesting(workspace)
            ? undefined
            : () => void repositories.cancel(workspace)}
    />
{:else if open}
    <!-- git's reason as the row's hover words: ui/tree/TreeItem.svelte draws its own tooltip only
         for a row that is pressed, and this row is text. -->
    <li
        role="none"
        data-repo={shape}
        title={shape === 'missing' || shape === 'none' ? (repo?.error ?? undefined) : undefined}
    >
        <TreeItem label={said.words} tone={said.error ? 'error' : 'muted'} depth={2} />
    </li>
{/if}
<li role="none">
    <AskConfirm {asking} onclose={() => (asking = null)} />
</li>
