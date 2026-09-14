<script module lang="ts">
    // Layer 3, view registration. Changes registration stays on the component because the registry
    // discovers this file directly.
    import type { ViewRegistration } from '$lib/views/registry';
    export const registration: ViewRegistration = {
        id: 'changes',
        label: 'sessions.view_changes',
        glyph: 'sessions.changes_glyph',
        group: 'sessions',
        order: 5
    };
</script>

<script lang="ts">
    // Layer 3, sessions view. The Changes frame owns repository writes and confirmation state
    // because touched-file and git markup change independently.

    import Confirm from '$lib/ui/Confirm.svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import type { MenuItem } from '$lib/ui/Menu.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import { instanceLayoutState, pinInstance, unpinInstance } from '$lib/state/layout.svelte';
    import { pinnedSession } from '$lib/state/selection.svelte';
    import { gitFor, sessionFor, touchers, type GitState } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';
    import { writeGit } from '$lib/state/writes.svelte';
    import type { ViewProps } from '$lib/views/registry';
    import ChangesRepo from './ChangesRepo.svelte';
    import ChangesTouched from './ChangesTouched.svelte';

    let { instance }: ViewProps = $props();
    type Branch = { name: string; upstream: string; current: boolean };
    type Ask = { message: string; detail: string; act: () => void };

    const record = $derived(sessionFor(instance.id));
    const panePin = $derived(pinnedSession(instanceLayoutState(instance.id)));
    const workspace = $derived(record?.workspace ?? '');
    const files = $derived(record?.files ?? []);
    const repo = $derived(workspace === '' ? null : gitFor(workspace));
    let message = $state('');
    let branchName = $state('');
    let outcome = $state('');
    let busy = $state(false);
    let suggesting = $state(false);
    let asking: Ask | null = $state(null);
    let branches: Branch[] = $state([]);
    const staged = $derived(repo?.staged ?? []);
    const current = $derived(branches.find((one) => one.current) ?? null);
    const upstream = $derived(current?.upstream ?? '');
    const canCommit = $derived(staged.length > 0 && message.trim() !== '' && !busy);

    function togglePanePin(): void {
        if (panePin !== null) {
            unpinInstance(instance.id);
            return;
        }
        if (record !== null) pinInstance(instance.id, record.id, record.title);
    }

    $effect(() => {
        const root = workspace;
        const state = repo;
        if (root === '' || state?.error !== null) {
            branches = [];
            return;
        }
        void load(root);
    });

    async function load(root: string): Promise<void> {
        try {
            const response = await fetch(`/api/git?root=${encodeURIComponent(root)}`);
            const body = (await response.json()) as { branches?: Branch[] };
            branches = Array.isArray(body.branches) ? body.branches : [];
        } catch {
            branches = [];
        }
    }

    function shared(path: string): string[] {
        if (record === null || path === '') return [];
        return touchers(`${workspace}/${path}`, record.id).map((session) => session.title);
    }

    function branchState(state: GitState): string {
        const bits: string[] = [];
        if (state.detached) bits.push(t('sessions.ch_detached'));
        if (state.ahead > 0) bits.push(t('sessions.ch_ahead', state.ahead));
        if (state.behind > 0) bits.push(t('sessions.ch_behind', state.behind));
        if (bits.length === 0) bits.push(t('sessions.ch_insync'));
        return bits.join(` ${t('sessions.meta_sep')} `);
    }

    async function act(
        action: string,
        fields: Record<string, unknown> = {},
        confirmed = false
    ): Promise<{ ok: boolean; output: string }> {
        if (workspace === '' || busy) return { ok: false, output: '' };
        busy = true;
        outcome = '';
        const answer = await writeGit(
            action,
            workspace,
            confirmed ? { ...fields, confirm: true } : fields
        );
        busy = false;
        outcome = answer.ok ? t('git.done') : (answer.error ?? '');
        return { ok: answer.ok, output: answer.output ?? '' };
    }

    function ask(question: string, detail: string, run: () => void): void {
        asking = { message: question, detail, act: run };
    }
    function answered(): void {
        const held = asking;
        asking = null;
        held?.act();
    }
    function stagePath(path: string): void {
        void act('stage', { paths: [path] });
    }
    function unstagePath(path: string): void {
        void act('unstage', { paths: [path] });
    }
    function discardPath(path: string): void {
        ask(t('git.discard_confirm', path), t('git.discard_detail'), () => {
            void act('discard', { paths: [path] }, true);
        });
    }
    function pushIt(): void {
        if (upstream === '') return;
        ask(
            t('git.push_confirm', repo?.branch ?? '', upstream),
            t('git.push_detail', repo?.ahead ?? 0),
            () => {
                void act('push', {}, true);
            }
        );
    }
    function commitIt(): void {
        if (!canCommit) return;
        ask(
            t('git.commit_confirm', staged.length, repo?.branch ?? ''),
            t('git.commit_detail'),
            async () => {
                const answer = await act('commit', { message }, true);
                if (answer.ok) message = '';
            }
        );
    }
    async function suggest(): Promise<void> {
        if (busy || suggesting) return;
        suggesting = true;
        const answer = await act('suggest');
        suggesting = false;
        if (answer.ok && answer.output !== '') message = answer.output;
    }
    function switchTo(name: string): void {
        if (name === '' || name === repo?.branch) return;
        ask(t('git.branch_switch_confirm', name), t('git.branch_switch_detail'), async () => {
            await act('switchBranch', { name }, true);
            await load(workspace);
        });
    }
    function createBranch(): void {
        const name = branchName.trim();
        if (name === '') return;
        ask(t('git.branch_new_confirm', name), t('git.branch_switch_detail'), async () => {
            await act('createBranch', { name }, true);
            branchName = '';
            await load(workspace);
        });
    }
    const branchItems = $derived<MenuItem[]>(
        branches.map((one) => ({ id: one.name, label: one.name, active: one.current }))
    );
</script>

{#snippet tools()}
    <Toolbar label={t('sessions.view_changes')}>
        {#if record !== null || panePin !== null}
            <ToolButton
                label={panePin === null ? t('sessions.pin_pane') : t('sessions.unpin_pane')}
                title={panePin === null ? t('sessions.pin_pane') : t('sessions.unpin_pane')}
                pressed={panePin !== null}
                onclick={togglePanePin}
            />
        {/if}
    </Toolbar>
{/snippet}

<Pane title={t('sessions.view_changes')} toolbar={tools} tinted>
    <div class="changes" data-instance={instance.id}>
        {#if record === null}
            <Empty message={t('sessions.detail_empty')} glyph={t('sessions.empty_glyph')} />
        {:else}
            <ChangesTouched recordId={record.id} {files} {workspace} />
            {#if repo?.error !== null}
                <section class="repo">
                    <div class="sec-h"><span>{t('sessions.ch_repo')}</span></div>
                    <p class="none" title={repo?.error ?? undefined}>{t('sessions.ch_norepo')}</p>
                </section>
            {:else}
                <ChangesRepo
                    state={repo}
                    {branchItems}
                    {upstream}
                    {busy}
                    {suggesting}
                    {canCommit}
                    {message}
                    {branchName}
                    {outcome}
                    {shared}
                    {branchState}
                    onswitch={switchTo}
                    onpush={pushIt}
                    onbranch={createBranch}
                    onbranchname={(next) => (branchName = next)}
                    onstage={stagePath}
                    onunstage={unstagePath}
                    ondiscard={discardPath}
                    onmessage={(next) => (message = next)}
                    onsuggest={suggest}
                    oncommit={commitIt}
                />
            {/if}
        {/if}
    </div>
</Pane>

{#if asking !== null}
    <Confirm
        message={asking.message}
        detail={asking.detail}
        confirm={t('ui.confirm_ok')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={answered}
        oncancel={() => (asking = null)}
    />
{/if}

<style>
    .changes {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .sec-h {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--muted-txt, var(--muted));
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: var(--fs-sm);
        border-bottom: 1px solid var(--line);
        padding-bottom: 2px;
        margin-bottom: 4px;
    }
    .none {
        margin: 2px 0 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }
    :global(body.rice) .changes {
        font-family: var(--font-mono);
    }
</style>
