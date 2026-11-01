<script lang="ts">
    // Layer 3, partial of views/sessions/session-detail/SessionDetail.svelte. The repository the
    // session works in, drawn in the body of the Changes section in whichever of its six shapes the
    // repository is in. It asks before a write and presses through
    // state/sources/repositories/repositories.svelte.ts, the store the Repositories view presses
    // through, so which repository has a write in flight and what the last write answered are the
    // same in both. It is drawn while the section is open, so the branches are listed once when the
    // section opens and again whenever the repository's state changes while it stays open, and not
    // at all while it is closed.

    import AskConfirm from '$lib/views/shared/writes/AskConfirm.svelte';
    import type { Ask } from '$lib/views/shared/writes/ask';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import { readJson } from '$lib/data/shapes/shapes';
    import { t } from '$lib/state/shared/words/text';
    import { branchesOf } from '$lib/state/sources/repositories/answers';
    import { repoShape } from '$lib/state/sources/repositories/repositories';
    import ChangesRepo from './ChangesRepo.svelte';
    import type { GroupedSession } from '$lib/state/client/selectors.svelte';
    import { shownGate, useShown, useState } from '$lib/state/client/use';

    const {
        repositories,
        selectors: { gitFor, touchers }
    } = useState();

    let { record }: { record: GroupedSession } = $props();
    const gate = shownGate(useShown());
    type Branch = { name: string; upstream: string; current: boolean };

    const workspace = $derived(record.workspace);
    const repo = $derived(workspace === '' ? null : gitFor(workspace));
    const shape = $derived(repoShape(workspace, repo));
    const readable = $derived(shape === 'readable' ? repo : null);
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

    function ask(question: string, detail: string, run: () => void): void {
        asking = { message: question, detail, act: run };
    }
    function stagePath(path: string): void {
        void repositories.stage(workspace, path);
    }
    function unstagePath(path: string): void {
        void repositories.unstage(workspace, path);
    }
    function discardPath(path: string): void {
        const root = workspace;
        ask(t('git.discard_confirm', path), t('git.discard_detail'), () => {
            void repositories.discard(root, path);
        });
    }
    function groupAct(which: 'stage-changed' | 'stage-untracked' | 'unstage' | 'discard'): void {
        const root = workspace;
        if (which === 'stage-changed') void repositories.stageAll(root, 'changed');
        else if (which === 'stage-untracked') void repositories.stageAll(root, 'untracked');
        else if (which === 'unstage') void repositories.unstageAll(root);
        else
            ask(
                repo?.unstaged.length === 1
                    ? t('git.discard_all_confirm_one')
                    : t('git.discard_all_confirm', repo?.unstaged.length ?? 0),
                t('git.discard_all_detail'),
                () => void repositories.discardAll(root)
            );
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
</script>

<div class="repository">
    {#if shape === 'unplaced'}
        <section class="repo" data-repo="unplaced">
            <div class="sec-h"><span>{t('sessions.ch_repo')}</span></div>
            <Empty message={t('sessions.ch_noworkspace')} />
        </section>
    {:else if shape === 'missing'}
        <section class="repo" data-repo="missing">
            <div class="sec-h"><span>{t('sessions.ch_repo')}</span></div>
            <div title={repo?.error ?? undefined}>
                <Empty message={t('sessions.ch_nofolder')} />
            </div>
        </section>
    {:else if shape === 'none'}
        <section class="repo" data-repo="none">
            <div class="sec-h"><span>{t('sessions.ch_repo')}</span></div>
            <div title={repo?.error ?? undefined}>
                <Empty message={t('sessions.ch_norepo')} />
            </div>
        </section>
    {:else if shape === 'failed'}
        <section class="repo" data-repo="failed">
            <div class="sec-h"><span>{t('sessions.ch_repo')}</span></div>
            <Empty error message={t('sessions.ch_failed', repo?.error ?? '')} />
        </section>
    {:else if shape === 'reading'}
        <section class="repo" data-repo="reading">
            <div class="sec-h"><span>{t('sessions.ch_repo')}</span></div>
            <Empty message={t('sessions.ch_reading')} />
        </section>
    {:else if readable !== null}
        <ChangesRepo
            root={workspace}
            state={readable}
            {branchItems}
            {busy}
            busyWords={repositories.busyWords(workspace)}
            {branchName}
            {outcome}
            {shared}
            onswitch={switchTo}
            onbranch={createBranch}
            onbranchname={(next: string) => (branchName = next)}
            onstage={stagePath}
            onunstage={unstagePath}
            ondiscard={discardPath}
            onresolve={(path: string) => void repositories.markResolved(workspace, path)}
            ongroup={groupAct}
            onopen={(path: string, kind: string) =>
                repositories.openChange(workspace, kind, path, record.id)}
            onopenfile={(path: string) => void repositories.openFile(workspace, path)}
            oncancel={repositories.suggesting(workspace)
                ? undefined
                : () => void repositories.cancel(workspace)}
        />
    {/if}
</div>

<AskConfirm {asking} onclose={() => (asking = null)} />

<style>
    .repository {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 4px 6px 6px;
    }
    /* A sub-heading of the section: the group label, bold, in capitals, at `--fs-xs`, the step of
       an uppercase heading. */
    .sec-h {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--muted-txt, var(--muted));
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: var(--fs-xs);
        font-weight: 700;
        border-bottom: 1px solid var(--line);
        padding-bottom: 2px;
        margin-bottom: 4px;
    }
    :global(body.rice:where(:not(.rice-sans))) .repository {
        font-family: var(--font-mono);
    }
</style>
