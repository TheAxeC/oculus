<script lang="ts">
    // Layer 3, view. Two sections over one session: the files it touched itself, and what git says
    // about the workspace it is sitting in. The second is the git panel of O20: it reads as it
    // always did, and every write on it is a click of Axel's.
    //
    // The first section is the session's own record. The mark on a row is the thing worth seeing at
    // once: another live session holding the same file open, named in the tooltip, which is how two
    // agents about to overwrite each other show up before they do. The same mark is drawn on a git
    // row, so a stage or a discard on a file a running session is editing is seen before it is
    // clicked.
    //
    // The second is the `git` payload for that workspace, with a control on every row and the
    // repository's own controls above them: the branch menu, the push, and the commit box with its
    // suggested message. A workspace that is not a repository says so, with git's own reason in the
    // tooltip, and draws no control at all.
    //
    // DESIGN.md, "Git", and the decision of 2026-09-10 on git writes: every write goes to POST
    // /api/git with the write token, and the five that can lose work (discard, commit, push, the two
    // branch actions) carry a confirm this view sets only from ui/Confirm.svelte. Nothing here acts
    // on a timer or on a payload arriving; a write happens when a button is pressed and never
    // otherwise.

    import Confirm from '$lib/ui/Confirm.svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import Menu, { type MenuItem } from '$lib/ui/Menu.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import TextArea from '$lib/ui/TextArea.svelte';
    import TextInput from '$lib/ui/TextInput.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { elide, relativeTo } from '$lib/state/format';
    import {
        gitFor,
        sessionFor,
        touchers,
        type GitEntry,
        type GitState,
        type SessionFile
    } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';
    import { writeGit } from '$lib/state/writes.svelte';
    import type { ViewProps } from '$lib/views/registry';

    let { instance }: ViewProps = $props();

    /** git's own letters, kept as git's letters, given a hue by what each of them means. */
    const LETTERS: Record<string, string> = {
        M: 'amber',
        A: 'green',
        D: 'red',
        R: 'violet',
        C: 'violet',
        '?': 'slate'
    };

    /** One row of `git branch --format`, as GET /api/git answers it. */
    type Branch = { name: string; upstream: string; current: boolean };

    /** What a confirm dialog is holding: what it says, and what pressing it does. */
    type Ask = { message: string; detail: string; act: () => void };

    const record = $derived(sessionFor(instance.id));
    const workspace = $derived(record?.workspace ?? '');
    const files = $derived(record?.files ?? []);
    const repo = $derived(workspace === '' ? null : gitFor(workspace));

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
    /** The branches of this workspace, as the last GET answered. */
    let branches: Branch[] = $state([]);

    const staged = $derived(repo?.staged ?? []);
    const current = $derived(branches.find((one) => one.current) ?? null);

    /** The upstream of the checked-out branch, or the empty string when it has none. */
    const upstream = $derived(current?.upstream ?? '');

    const canCommit = $derived(staged.length > 0 && message.trim() !== '' && !busy);

    // The branch list is a read of its own rather than a field of the `git` payload: the payload is
    // what the watcher publishes for every workspace on every change, and the branches of a
    // repository are wanted only while this panel is open on it.
    $effect(() => {
        const root = workspace;
        const state = repo;
        if (root === '' || state === null || state.error !== null) {
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

    /** The other live sessions holding one path open, by their titles. */
    function shared(path: string): string[] {
        if (record === null || path === '') return [];
        return touchers(path, record.id).map((session) => session.title);
    }

    /** A git row's path is relative to the repository; a session's files are absolute. */
    function absolute(path: string): string {
        return workspace === '' ? '' : `${workspace}/${path}`;
    }

    function letterStyle(status: string): string {
        const tone = LETTERS[status] ?? 'grey';
        return `--tone-txt: var(--c-${tone}-txt)`;
    }

    /** The branch line: where the checkout is against its upstream, in as few words as it takes. */
    function branchState(state: GitState): string {
        const bits: string[] = [];
        if (state.detached) bits.push(t('js.sessions.ch_detached'));
        if (state.ahead > 0) bits.push(t('js.sessions.ch_ahead', state.ahead));
        if (state.behind > 0) bits.push(t('js.sessions.ch_behind', state.behind));
        if (bits.length === 0) bits.push(t('js.sessions.ch_insync'));
        return bits.join(` ${t('js.sessions.meta_sep')} `);
    }

    /**
     * One action on this workspace. `confirm` is set by the caller that came through the dialog, and
     * by no other: the endpoint refuses the five destructive actions without it, so a control wired
     * straight to one of them would be refused rather than quietly obeyed.
     */
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
        const ahead = repo?.ahead ?? 0;
        ask(
            t('git.push_confirm', repo?.branch ?? '', upstream),
            t('git.push_detail', ahead),
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

{#snippet counts(entry: GitEntry)}
    {#if entry.added === null && entry.deleted === null}
        <span class="bin">{t('js.sessions.ch_binary')}</span>
    {:else}
        {#if entry.added}
            <span class="add">{t('js.sessions.ch_added', entry.added)}</span>
        {/if}
        {#if entry.deleted}
            <span class="del">{t('js.sessions.ch_deleted', entry.deleted)}</span>
        {/if}
    {/if}
{/snippet}

{#snippet mark(also: string[])}
    {#if also.length > 0}
        <span class="mark" title={t('js.sessions.ch_shared_tip', also.join(', '))}>
            {t('js.sessions.ch_shared')}
        </span>
    {/if}
{/snippet}

{#snippet group(label: string, entries: GitEntry[], kind: string)}
    <div class="group">
        <div class="group-h">
            <span>{label}</span>
            <span class="n">{entries.length}</span>
        </div>
        {#if entries.length === 0}
            <p class="none">{t('js.sessions.ch_group_empty')}</p>
        {:else}
            {#each entries as entry (entry.path)}
                {@const also = shared(absolute(entry.path))}
                <div class="file" class:shared={also.length > 0}>
                    <span class="st" style={letterStyle(entry.status)}>{entry.status}</span>
                    <span class="pa" title={entry.path}>{elide(entry.path)}</span>
                    {@render mark(also)}
                    {@render counts(entry)}
                    <span class="acts">
                        {#if kind === 'staged'}
                            <ToolButton
                                label={t('git.unstage')}
                                title={t('git.unstage_title')}
                                onclick={() => unstagePath(entry.path)}
                            />
                        {:else}
                            <ToolButton
                                label={t('git.stage')}
                                title={t('git.stage_title')}
                                onclick={() => stagePath(entry.path)}
                            />
                        {/if}
                        {#if kind === 'changed'}
                            <ToolButton
                                label={t('git.discard')}
                                title={t('git.discard_title')}
                                onclick={() => discardPath(entry.path)}
                            />
                        {/if}
                    </span>
                </div>
            {/each}
        {/if}
    </div>
{/snippet}

{#snippet panel(state: GitState)}
    <div class="branch">
        <span class="lb">{t('js.sessions.ch_branch')}</span>
        <Menu
            label={state.branch}
            items={branchItems}
            placement="down"
            onpick={(id) => switchTo(id)}
        />
        <span class="mt">{branchState(state)}</span>
        <ToolButton
            label={t('git.push')}
            title={upstream === ''
                ? t('git.push_none')
                : t('git.push_title', state.ahead, upstream)}
            disabled={upstream === '' || busy}
            onclick={pushIt}
        />
    </div>
    {#if upstream === ''}
        <p class="none">{t('git.push_none')}</p>
    {/if}
    <div class="newbranch">
        <span class="lb">{t('git.branch_new')}</span>
        <TextInput
            value={branchName}
            label={t('git.branch_new_label')}
            oninput={(next) => (branchName = next)}
        />
        <ToolButton label={t('git.branch_new_create')} onclick={createBranch} />
    </div>
{/snippet}

{#snippet commitBox(state: GitState)}
    <div class="commit">
        <TextArea
            value={message}
            label={t('git.commit_label')}
            rows={4}
            oninput={(next) => (message = next)}
        />
        <div class="cacts">
            <ToolButton
                label={suggesting ? t('git.suggest_pending') : t('git.suggest')}
                title={t('git.suggest_title')}
                disabled={busy || suggesting || state.staged.length === 0}
                onclick={suggest}
            />
            <ToolButton label={t('git.commit')} disabled={!canCommit} onclick={commitIt} />
            {#if state.staged.length === 0}
                <span class="none">{t('git.commit_none')}</span>
            {/if}
        </div>
        {#if busy}
            <p class="none">{t('git.busy')}</p>
        {/if}
        {#if outcome !== ''}
            <p class="outcome">{outcome}</p>
        {/if}
    </div>
{/snippet}

<Pane title={t('sessions.view_changes')}>
    <div class="changes" data-instance={instance.id}>
        {#if record === null}
            <Empty message={t('sessions.detail_empty')} glyph={t('sessions.empty_glyph')} />
        {:else}
            <section class="sec">
                <div class="sec-h">
                    <span>{t('js.sessions.ch_touched')}</span>
                    <span class="n">{files.length}</span>
                </div>
                {#if files.length === 0}
                    <p class="none">{t('js.sessions.ch_touched_empty')}</p>
                {:else}
                    {#each files as file (file.path)}
                        {@const also = shared(file.path)}
                        <div class="file" class:shared={also.length > 0}>
                            <span class="pa" title={file.path}>
                                {elide(relativeTo(file.path, workspace))}
                            </span>
                            {@render mark(also)}
                            <span class="to">{file.tool}</span>
                            <span class="ct">{t('js.sessions.ch_times', file.count)}</span>
                        </div>
                    {/each}
                {/if}
            </section>

            <section class="sec">
                <div class="sec-h"><span>{t('js.sessions.ch_repo')}</span></div>
                {#if repo === null || repo.error !== null}
                    <p class="none" title={repo?.error ?? undefined}>
                        {t('js.sessions.ch_norepo')}
                    </p>
                {:else}
                    {@render panel(repo)}
                    {@render group(t('js.sessions.ch_staged'), repo.staged, 'staged')}
                    {@render group(t('js.sessions.ch_changed'), repo.unstaged, 'changed')}
                    {@render group(t('js.sessions.ch_untracked'), repo.untracked, 'untracked')}
                    {@render commitBox(repo)}
                {/if}
            </section>
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

    .sec-h,
    .group-h {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .sec-h {
        border-bottom: 1px solid var(--line);
        padding-bottom: 2px;
        margin-bottom: 4px;
    }

    .group {
        margin-top: 6px;
    }

    .sec-h .n,
    .group-h .n {
        margin-left: auto;
        font-family: var(--font-num);
    }

    .file {
        display: flex;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
        font-size: var(--fs-sm);
    }

    .pa {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .st {
        flex: 0 0 auto;
        width: 1.2em;
        text-align: center;
        color: var(--tone-txt, var(--muted-txt));
        font-family: var(--font-mono);
    }

    .to,
    .ct,
    .mark,
    .bin,
    .none {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .to,
    .ct {
        margin-left: auto;
    }

    .ct,
    .add,
    .del {
        flex: 0 0 auto;
        font-family: var(--font-num);
        font-size: var(--fs-xs);
    }

    .add {
        color: var(--c-green-txt, var(--muted));
    }

    .del {
        color: var(--c-red-txt, var(--muted));
    }

    .mark {
        color: var(--c-amber-txt, var(--muted));
    }

    .none {
        margin: 2px 0 0;
    }

    .outcome {
        margin: 2px 0 0;
        font-size: var(--fs-xs);
    }

    /* The controls sit at the right of a row and are the last thing on it. */
    .acts {
        flex: 0 0 auto;
        display: flex;
        gap: 2px;
        margin-left: auto;
    }

    .branch,
    .newbranch,
    .cacts {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: var(--fs-sm);
    }

    .newbranch,
    .commit {
        margin-top: 6px;
    }

    .commit {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .branch .lb,
    .newbranch .lb,
    .branch .mt {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .branch .mt {
        margin-left: auto;
    }

    /* The terminal shape: a status listing, in the face git prints it in. */
    :global(body.rice) .changes {
        font-family: var(--font-mono);
    }
</style>
