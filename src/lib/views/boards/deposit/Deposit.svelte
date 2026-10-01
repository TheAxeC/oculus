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
    // Every write goes to POST /api/deposit with the write token, and the five that can lose work
    // (commit, push, snapshot, the two branch actions) carry a confirm this view sets only from
    // the yes of views/shared/AskConfirm.svelte. Nothing here acts on a timer or on a payload
    // arriving; a write happens when a button is pressed and never otherwise.
    //
    // The commit message is suggested by POST /api/git with the mirror as its root, which is why
    // server/git/git-write.ts's allowedRoots names the mirrors folder beside the workspaces and the
    // hub.
    //
    // A finding of the scan (a possible secret, an oversized file, a missing README.md) disables
    // the commit, the push and the snapshot, with the reason on the control. The refusal is the
    // server's as well: server/git/deposit.ts refuses those three while the plan has findings, so a
    // control wired past this would be refused rather than quietly obeyed.

    import AskConfirm from '$lib/views/shared/AskConfirm.svelte';
    import type { Ask } from '$lib/views/shared/ask';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import TextArea from '$lib/ui/forms/TextArea.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { Finding, MirrorState, Plan } from '$lib/state/system/deposit.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { instanceText } from '$lib/state/workbench/layout';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        deposit: { mirror, reload },
        writes: { writeDeposit, writeGit }
    } = useState();

    let { instance }: ViewProps = $props();

    /** How tall the commit box opens. */
    const ROWS = 4;

    /** One row of `git branch --format`, as POST /api/deposit answers it. */
    type Branch = { name: string; upstream: string; current: boolean };

    /** The project this instance was opened for, from the state the card handed openView. */
    const id = $derived(instanceText(instance.state, 'id'));
    const held = $derived(mirror(id));
    // Named `now` rather than `state`: a variable called `state` in a component is read as the
    // store prefix of `$state`, which svelte-check refuses.
    const now = $derived(held.state);
    const plan = $derived(now?.plan ?? null);

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

    function findingWords(one: Finding): string {
        if (one.kind === 'secret') return t('deposit.finding_secret', one.path);
        if (one.kind === 'large') return t('deposit.finding_large', one.mb, one.path);
        return t('deposit.finding_readme');
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

    function ask(question: string, detail: string, run: () => void): void {
        asking = { message: question, detail, act: run };
    }

    function adopt(): void {
        void act('adopt');
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
        ask(
            t('deposit.commit_confirm', plan?.changes.length ?? 0, plan?.branch ?? ''),
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
            {#if one.ahead > 0}
                <span class="mt">{t('deposit.ahead', one.ahead)}</span>
            {/if}
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

{#snippet made(one: Plan)}
    <div class="grp">
        <div class="grp-h">
            <span>{t('deposit.files', one.files.length)}</span>
        </div>
        {#each one.files as file (file)}
            <div class="fl"><span class="pa">{file}</span></div>
        {/each}
    </div>
    <div class="grp">
        <div class="grp-h">
            <span>{t('deposit.changes', one.changes.length)}</span>
        </div>
        {#if one.changes.length === 0}
            <Empty message={t('deposit.changes_none')} />
        {:else}
            {#each one.changes as change (change.path)}
                <div class="fl">
                    <span class="st">{change.letters}</span>
                    <span class="pa">{change.path}</span>
                </div>
            {/each}
        {/if}
    </div>
    {#if one.findings.length > 0}
        <div class="grp">
            <div class="grp-h"><span>{t('deposit.findings')}</span></div>
            {#each one.findings as finding (finding.kind + finding.path)}
                <p class="warn">{findingWords(finding)}</p>
            {/each}
        </div>
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
        {#if busy}
            <p class="none">{t('deposit.busy')}</p>
        {/if}
        {#if outcome !== ''}
            <p class="outcome">{outcome}</p>
        {/if}
    </div>
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
        {:else if now === null}
            <Empty message={t('deposit.unknown', id)} />
        {:else}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render head(now)}
            {#if now.exists}
                {#if plan === null}
                    <Empty message={t('deposit.plan_none')} />
                {:else}
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render made(plan)}
                {/if}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render branchBox(now)}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render commitBox(now)}
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

    .grp {
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 6px 8px;
    }

    .grp-h {
        color: var(--muted-txt);
        font-size: var(--fs-xs);
        margin-bottom: 4px;
    }

    /* A file of the plan is one line of the tree's row height, its words the main words of a
       row. */
    .fl {
        display: flex;
        gap: 8px;
        align-items: center;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        font-size: var(--fs-md);
    }

    .st {
        color: var(--muted-txt);
        font-family: var(--font-mono);
        white-space: pre;
    }

    .pa {
        font-family: var(--font-mono);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .none {
        color: var(--muted-txt);
        font-size: var(--fs-md);
        margin: 0;
    }

    .warn {
        color: var(--c-amber-txt);
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
