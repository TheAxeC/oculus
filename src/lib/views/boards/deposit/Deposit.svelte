<script module lang="ts">
    // Layer 3, view registration. A deposit opens from a project and is not listed in the view
    // catalogue.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'deposit',
        label: 'views.deposit',
        glyph: 'views.deposit_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. The deposit of one project uses a mirror clone under the machine-local state
    // folder, into which the
    // project's `code/` is synced and committed, and from which the tool pushes, lists, creates and
    // switches branches. One instance per project, and the project it is for is the `id` in its
    // instance state, exactly as the editor and the project tab read their own.
    //
    // Every write goes to POST /api/deposit with the write token, and the seven that write outside
    // this machine or over `code/` (commit, push, snapshot, the two branch actions, and For review
    // and Publish of the Zenodo section, DepositZenodo.svelte) carry a confirm this view sets only
    // from the yes of views/shared/writes/AskConfirm.svelte. Nothing here acts on a timer or on a
    // payload arriving; a write happens when a button is pressed and never otherwise. The Zenodo
    // section needs no mirror and is drawn whether or not the mirror exists.
    //
    // The sync plan, its files, changes and findings, is DepositPlan.svelte. A changed file of the
    // plan and a file that differs from `origin/main` each open their diff in the diff editor
    // (DepositFile.svelte, DepositCompare.svelte), over the two texts the deposit route serves;
    // Fetch updates `origin/main` in the mirror.
    //
    // The commit message is suggested by POST /api/git with the mirror as its root, which is why
    // server/git/git-write.ts's allowedRoots names the mirrors folder beside the workspaces and the
    // hub.
    //
    // A finding of the scan (a possible secret, an oversized file, a missing README.md) disables
    // the commit, the push and the snapshot, with the reason on the control. The refusal is the
    // server's as well: server/git/deposit/deposit.ts refuses those three while the plan has
    // findings, so a control wired past this would be refused rather than quietly obeyed.

    import AskConfirm from '$lib/views/shared/writes/AskConfirm.svelte';
    import DepositCompare from './DepositCompare.svelte';
    import DepositPlan from './DepositPlan.svelte';
    import DepositZenodo from './DepositZenodo.svelte';
    import type { Ask } from '$lib/views/shared/writes/ask';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import TextArea from '$lib/ui/forms/TextArea.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { MirrorState, Plan } from '$lib/state/system/deposit.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { stateRecord } from '$lib/state/workbench/layout';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        deposit: { mirror, reload },
        selectors: { projectOf },
        writes: { writeDeposit, writeGit }
    } = useState();

    let { instance }: ViewProps = $props();

    /** How tall the commit box opens. */
    const ROWS = 4;

    /** One row of `git branch --format`, as POST /api/deposit answers it. */
    type Branch = { name: string; upstream: string; current: boolean };

    /** The project this instance was opened for, from the state the card handed openView. */
    const id = $derived(stateRecord(instance.state));
    const held = $derived(mirror(id));
    // Named `now` rather than `state`: a variable called `state` in a component is read as the
    // store prefix of `$state`, which svelte-check refuses.
    const now = $derived(held.state);
    const plan = $derived(now?.plan ?? null);
    /** The project's `code_availability` as the snapshot holds it, read by the Zenodo section. */
    const code = $derived(id === '' ? undefined : projectOf(id)?.codeAvailability);

    /** The message in the box. It survives a suggestion and is what a commit sends. */
    let message = $state('');
    /** The name typed into the new-branch box. */
    let branchName = $state('');
    /** The last thing the endpoint said, shown under the controls. */
    let outcome = $state('');
    /** Set while a request is in flight, so a second click cannot start a second write. */
    let busy = $state(false);
    /** Set while `claude` is writing a message, which takes seconds rather than milliseconds. */
    let suggesting = $state(false);
    /** The dialog, or null when nothing is being asked. */
    let asking: Ask | null = $state(null);
    /** The branches of the mirror, as the last `branches` action answered. */
    let rows: Branch[] = $state([]);

    const items = $derived<MenuItem[]>(
        rows.map((one) => ({ id: one.name, label: one.name, active: one.current }))
    );

    /** Why a write cannot be pressed right now, or the empty string when it can. */
    const why = $derived(reason(now, plan, busy));

    function reason(one: MirrorState | null, made: Plan | null, working: boolean): string {
        if (working) return t('deposit.why_busy');
        if (!one?.exists) return t('deposit.why_no_mirror');
        if (made === null) return t('deposit.why_no_plan');
        if (made.findings.length > 0) return t('deposit.why_findings');
        return '';
    }

    /**
     * One action on this project. `confirmed` is set by the caller that came through the dialog,
     * and by no other: the endpoint refuses the five destructive actions without it.
     */
    async function act(
        action: string,
        fields: Record<string, unknown> = {},
        confirmed = false
    ): Promise<{ ok: boolean; output: string }> {
        if (id === '' || busy) return { ok: false, output: '' };
        busy = true;
        outcome = '';
        const answer = await writeDeposit(
            action,
            id,
            confirmed ? { ...fields, confirm: true } : fields
        );
        busy = false;
        outcome = answer.ok ? t('deposit.done') : (answer.error ?? '');
        reload(id);
        // The branch menu has no state of its own, so the rows are read again after anything that
        // can have moved them, which is every write this panel makes.
        if (answer.ok) await listBranches();
        return { ok: answer.ok, output: answer.output ?? '' };
    }

    /**
     * One Zenodo action, which the section calls from the yes of its own dialog, with `busy` set so
     * no other write of this panel starts while it runs.
     */
    async function press(
        action: 'zenodoReview' | 'zenodoPublish'
    ): Promise<{ ok: boolean; output: string; error: string }> {
        if (id === '' || busy) return { ok: false, output: '', error: t('deposit.why_busy') };
        busy = true;
        const answer = await writeDeposit(action, id, { confirm: true });
        busy = false;
        return { ok: answer.ok, output: answer.output ?? '', error: answer.error ?? '' };
    }

    function ask(question: string, detail: string, run: () => void): void {
        asking = { message: question, detail, act: run };
    }

    function adopt(): void {
        void act('adopt');
    }

    function fetchOrigin(): void {
        void act('fetch');
    }

    function makePlan(): void {
        void act('plan');
    }

    async function suggest(): Promise<void> {
        if (busy || suggesting || !now?.exists) return;
        suggesting = true;
        const answer = await writeGit('suggest', now.mirror);
        suggesting = false;
        if (answer.ok && (answer.output ?? '') !== '') message = answer.output ?? '';
        else if (!answer.ok) outcome = answer.error ?? '';
    }

    function commitIt(): void {
        if (why !== '' || message.trim() === '') return;
        const count = plan?.changes.length ?? 0;
        const branch = plan?.branch ?? '';
        ask(
            count === 1
                ? t('deposit.commit_confirm_one', branch)
                : t('deposit.commit_confirm', count, branch),
            t('deposit.commit_detail'),
            async () => {
                const answer = await act('commit', { message }, true);
                if (answer.ok) message = '';
            }
        );
    }

    function pushIt(): void {
        if (why !== '' || now === null) return;
        const made = now.remote !== '';
        ask(
            made
                ? t('deposit.push_confirm', now.branch, now.remote)
                : t('deposit.push_create_confirm', now.repo),
            t('deposit.push_detail'),
            () => {
                void act('push', {}, true);
            }
        );
    }

    function snapshotIt(): void {
        if (why !== '' || message.trim() === '' || now === null) return;
        ask(t('deposit.snapshot_confirm', now.repo), t('deposit.snapshot_detail'), () => {
            void act('snapshot', { message }, true);
        });
    }

    async function listBranches(): Promise<void> {
        if (id === '' || busy) return;
        const answer = await writeDeposit('branches', id);
        rows = answer.branches ?? [];
    }

    function switchTo(name: string): void {
        if (name === '' || name === now?.branch) return;
        ask(
            t('deposit.branch_switch_confirm', name),
            t('deposit.branch_switch_detail'),
            async () => {
                await act('switchBranch', { name }, true);
                await listBranches();
            }
        );
    }

    function createBranch(): void {
        const name = branchName.trim();
        if (name === '') return;
        ask(t('deposit.branch_new_confirm', name), t('deposit.branch_new_detail'), async () => {
            await act('createBranch', { name }, true);
            branchName = '';
            await listBranches();
        });
    }
</script>

{#snippet head(one: MirrorState)}
    <div class="line">
        <span class="lb">{t('deposit.mirror')}</span>
        <span class="rp" title={one.mirror}>{one.repo}</span>
        {#if one.exists}
            <span class="lb">{t('deposit.branch')}</span>
            <span class="br">{one.branch}</span>
            <span class="mt">{one.remote === '' ? t('deposit.remote_none') : one.remote}</span>
        {/if}
        <ToolButton
            label={t('deposit.adopt')}
            title={t('deposit.adopt_title')}
            disabled={busy || one.exists}
            onclick={adopt}
        />
        <ToolButton
            label={t('deposit.plan')}
            title={t('deposit.plan_title')}
            disabled={busy || !one.exists}
            onclick={makePlan}
        />
    </div>
    {#if !one.exists}
        <Empty message={t('deposit.no_mirror')} />
    {/if}
{/snippet}

{#snippet branchBox(one: MirrorState)}
    <div class="line">
        <span class="lb">{t('deposit.branch')}</span>
        <Menu
            label={one.branch}
            {items}
            placement="down"
            onpick={(name: string) => switchTo(name)}
        />
    </div>
    <div class="line">
        <span class="lb">{t('deposit.branch_new')}</span>
        <TextInput
            value={branchName}
            label={t('deposit.branch_new_label')}
            oninput={(next: string) => (branchName = next)}
        />
        <ToolButton
            label={t('deposit.branch_new_create')}
            disabled={busy || branchName.trim() === ''}
            onclick={createBranch}
        />
    </div>
{/snippet}

{#snippet commitBox(one: MirrorState)}
    <div class="cm">
        <TextArea
            value={message}
            label={t('deposit.commit_label')}
            rows={ROWS}
            oninput={(next: string) => (message = next)}
        />
        <div class="acts">
            <ToolButton
                label={suggesting ? t('deposit.suggest_pending') : t('deposit.suggest')}
                title={t('deposit.suggest_title')}
                disabled={busy || suggesting || !one.exists}
                onclick={suggest}
            />
            <ToolButton
                label={t('deposit.commit')}
                title={why === '' ? t('deposit.commit_detail') : why}
                disabled={why !== '' || message.trim() === ''}
                onclick={commitIt}
            />
            <ToolButton
                label={one.remote === '' ? t('deposit.push_create') : t('deposit.push')}
                title={why === ''
                    ? one.remote === ''
                        ? t('deposit.push_create_title')
                        : t('deposit.push_title', one.remote)
                    : why}
                disabled={why !== ''}
                onclick={pushIt}
            />
            <ToolButton
                label={t('deposit.snapshot')}
                title={why === '' ? t('deposit.snapshot_title') : why}
                disabled={why !== '' || message.trim() === ''}
                onclick={snapshotIt}
            />
        </div>
        {#if why !== ''}
            <p class="none">{why}</p>
        {/if}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render busyLine()}
        {#if outcome !== ''}
            <p class="outcome">{outcome}</p>
        {/if}
    </div>
{/snippet}

{#snippet busyLine()}
    {#if busy}
        <div class="busy">
            <p class="none">{t('deposit.busy')}</p>
            <ToolButton
                small
                label={t('deposit.cancel')}
                title={t('deposit.cancel_title')}
                onclick={() => void writeDeposit('cancel', id)}
            />
        </div>
    {/if}
{/snippet}

<Pane title={t('deposit.title')} tinted>
    <div class="deposit" data-instance={instance.id}>
        {#if id === ''}
            <Empty message={t('deposit.none')} glyph={t('deposit.none_glyph')} />
        {:else if held.error !== ''}
            <Empty error message={held.error}>
                {#snippet action()}
                    <ToolButton small label={t('deposit.retry')} onclick={() => reload(id)} />
                {/snippet}
            </Empty>
        {:else if now === null && held.loading}
            <Empty message={t('deposit.loading', id)} />
        {:else if now === null}
            <Empty message={t('deposit.unknown', id)} />
        {:else}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render head(now)}
            {#if now.exists}
                {#if plan === null}
                    <Empty message={t('deposit.plan_none')} />
                {:else}
                    <DepositPlan {id} {plan} branch={now.branch} model={instance.id} />
                {/if}
                <DepositCompare
                    {id}
                    comparison={now.main}
                    upstream={now.ahead}
                    upstreamName={now.upstream}
                    {busy}
                    model={instance.id}
                    onfetch={fetchOrigin}
                />
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render branchBox(now)}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render commitBox(now)}
            {/if}
            <DepositZenodo {id} {code} ready={held.zenodo} {busy} onpress={press} />
            {#if !now.exists}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render busyLine()}
            {/if}
        {/if}
    </div>
</Pane>

<AskConfirm {asking} onclose={() => (asking = null)} />

<style>
    .deposit {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .line {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .lb {
        color: var(--muted-txt);
        font-size: var(--fs-xs);
    }

    .rp,
    .br {
        color: var(--ink-txt);
        font-family: var(--font-mono);
    }

    .mt {
        color: var(--muted-txt);
        font-size: var(--fs-sm);
    }

    .busy {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .none {
        color: var(--muted-txt);
        font-size: var(--fs-md);
        margin: 0;
    }

    .outcome {
        color: var(--ink-txt);
        font-size: var(--fs-md);
        margin: 0;
    }

    .cm {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .acts {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
    }
</style>
