<script module lang="ts">
    // Layer 3, view registration. Changes follows Session detail in the Sessions page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'changes',
        label: 'sessions.view_changes',
        glyph: 'sessions.changes_glyph',
        group: 'sessions',
        order: 5
    };
</script>

<script lang="ts">
    // Layer 3, sessions view. The Changes frame asks before a write and presses through
    // state/sources/repositories/repositories.svelte.ts, the store the Repositories view presses
    // through, so which repository has a write in flight and what the last write answered are the
    // same in both. The touched files and the repository are drawn by partials of their own, since
    // the two change independently.

    import AskConfirm from '$lib/views/shared/AskConfirm.svelte';
    import type { Ask } from '$lib/views/shared/ask';
    import PickSession from '$lib/views/shared/sessions/PickSession.svelte';
    import SessionPicker from '$lib/views/shared/sessions/SessionPicker.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import { readJson } from '$lib/data/shapes/shapes';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { branchesOf } from '$lib/state/sources/repositories/answers';
    import { repoShape } from '$lib/state/sources/repositories/repositories';
    import ChangesRepo from './ChangesRepo.svelte';
    import ChangesTouched from './ChangesTouched.svelte';
    import { shownGate, useShown, useState } from '$lib/state/client/use';

    const {
        repositories,
        selectors: { gitFor, sessionFor, touchers }
    } = useState();

    let { instance }: ViewProps = $props();
    const gate = shownGate(useShown());
    type Branch = { name: string; upstream: string; current: boolean };

    const record = $derived(sessionFor(instance.id));
    const workspace = $derived(record?.workspace ?? '');
    const files = $derived(record?.files ?? []);
    const repo = $derived(workspace === '' ? null : gitFor(workspace));
    const shape = $derived(repoShape(workspace, repo));
    const readable = $derived(shape === 'readable' ? repo : null);
    let branchName = $state('');
    let asking: Ask | null = $state(null);
    let branches: Branch[] = $state([]);
    // Each listing asked for takes the next number, and only the newest one may write `branches`: a
    // listing that answers after the workspace changed, or after a later listing was asked for, is
    // for a state the panel no longer draws.
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
        if (record === null || path === '') return [];
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
                t('git.discard_all_confirm', repo?.unstaged.length ?? 0),
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

{#snippet bar()}
    <Toolbar label={t('sessions.changes_bar')}>
        <SessionPicker instance={instance.id} />
    </Toolbar>
{/snippet}

<Pane title={t('sessions.view_changes')} {bar} tinted>
    <div class="changes" data-instance={instance.id}>
        {#if record === null}
            <PickSession message={t('sessions.detail_empty')} glyph={t('sessions.empty_glyph')} />
        {:else}
            <ChangesTouched recordId={record.id} {files} {workspace} />
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
                        repositories.openChange(workspace, kind, path)}
                />
            {/if}
        {/if}
    </div>
</Pane>

<AskConfirm {asking} onclose={() => (asking = null)} />

<style>
    .changes {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    /* A section heading: the group label in the size of a label, bold and in capitals. */
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
    :global(body.rice) .changes {
        font-family: var(--font-mono);
    }
</style>
