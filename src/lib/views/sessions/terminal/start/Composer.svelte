<script lang="ts">
    // Layer 3, view partial. The composer of a new session: one box holding the prompt, with its
    // controls in its foot as VS Code's chat input holds them, the attach control, the pickers
    // (workspace, agent, account, and the agent's own lists out of config/catalogs/agents.yml)
    // and Start. The Terminal view draws it alone while a tab shows no terminal, and right of the
    // row of terminals while the tab is composing (New With a Prompt, or the `n` key).
    //
    // What each picker last chose is kept in the tab's instance state
    // (state/sessions/terminal/composer/composer.ts), so the tab's next composer opens on the same
    // accounts and picks; the prompt being typed is this component's own. A Shell takes none of the
    // agent pickers, and its prompt is the first command it runs. A composer shown for a tab that
    // has a folder starts in it, which the workspace picker offers first when none of its places
    // holds it; one shown for a tab with none starts in a new composer's own folder and kind.
    //
    // The prompt goes to the server as one field and reaches the agent as one argument; nothing on
    // this side quotes, splits or escapes it, since nothing on either side hands it to a shell.
    //
    // A composer opened on a hub task shows the seed the server built for it above the prompt box,
    // read-only, and offers Claude and Codex; what is typed is added to the seed. A start whose
    // permission mode skips what the agent asks is confirmed first, and a task's seed that was
    // never approved for the folder and agent is shown for approval first.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import TextArea from '$lib/ui/forms/TextArea.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import AgentFindings from './AgentFindings.svelte';
    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import AttachPicker from './AttachPicker.svelte';
    import SeedApproval from './SeedApproval.svelte';
    import TaskBlock from './TaskBlock.svelte';
    import WorkspacePicker from '$lib/views/shared/sessions/WorkspacePicker.svelte';
    import {
        accountFor,
        accountsOf,
        branchOf,
        composeStart,
        composerOf,
        composerPlaces,
        composerWorkspace,
        insertMention,
        mention,
        offeredPlaces,
        promptKey,
        picksFor,
        relativeIn,
        skipQuestion,
        withComposer,
        type SkipQuestion,
        type ComposerAgent,
        type ComposerRecord
    } from '$lib/state/sessions/terminal/composer/composer';
    import type { AgentChoices } from '$lib/state/sessions/agents.svelte';
    import type { SeedApproval as Approval } from '$lib/state/sessions/terminals.svelte';
    import { FILE_DRAG } from '$lib/state/sources/fs';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        /** The tab whose instance state keeps the picks. */
        owner: string;
        /** What a start that landed does with the terminal it made, and the words for its tab. */
        onstarted: (id: string, label: string) => void;
    };

    let { owner, onstarted }: Props = $props();

    const {
        agents: { agentChoices },
        entities: { git },
        fs: { workspaces },
        selectors: { hubRoot, sessionsByWorkspace },
        terminals: { approveSeed, composeTerminal, dropTask, loadTask, taskOf },
        ui: { instanceState, setInstanceState }
    } = useState();

    /** The prompt being typed, and where the caret was when the box last moved it. */
    let prompt = $state('');
    let caret = 0;

    /** The files attached by path, which a Codex start passes on as images. */
    let attached: string[] = $state([]);

    /** Whether the attach picker is open, and what the last start or drop was refused with. */
    let picking = $state(false);
    let failure = $state('');
    let starting = $state(false);

    /** The confirmation a start waits on, and the approval of a task's seed it waits on. */
    let asking: SkipQuestion | null = $state(null);
    let approving: Approval | null = $state(null);
    let approvingNow = $state(false);
    let loadingTask = false;

    const record = $derived(composerOf(instanceState(owner)));
    const hub = $derived(hubRoot());
    const places = $derived(
        offeredPlaces(composerPlaces(hub, workspaces().folders, sessionsByWorkspace(true)), record)
    );
    const workspace = $derived(composerWorkspace(record, places, hub));
    const branch = $derived(branchOf(workspace, git()));
    const agent = $derived(record.agent);
    const base = $derived(agentChoices().value);
    const accounts = $derived(accountsOf(base?.accounts ?? [], agent));
    const account = $derived(
        accountFor(
            base?.accounts ?? [],
            agent,
            agent === 'shell' ? undefined : record.accounts[agent]
        )
    );
    /** The chosen agent's lists, read again for a Codex account whose cache names its models. */
    const choices = $derived.by((): AgentChoices | null => {
        if (agent === 'shell') return null;
        const read = agent === 'codex' && account !== '' ? agentChoices(account).value : base;
        return read?.agents.find((one) => one.agent === agent) ?? null;
    });
    const picks = $derived(agent === 'shell' ? {} : picksFor(choices, record.picks[agent]));
    const findings = $derived(base?.findings ?? []);
    const promptWords = $derived(
        agent === 'shell'
            ? t('composer.command')
            : record.task === undefined
              ? t('composer.prompt')
              : t('composer.prompt_more')
    );

    const task = $derived(taskOf(owner));
    const AGENTS: ComposerAgent[] = $derived(
        record.task === undefined ? ['claude', 'codex', 'shell'] : ['claude', 'codex']
    );

    // A composer restored with a task reference and no seed asks the server for the seed again; a
    // refusal is said here and the task is dropped from the record.
    $effect(() => {
        if (record.task === undefined || task !== null || loadingTask) return;
        loadingTask = true;
        void loadTask(owner).then((words) => {
            loadingTask = false;
            if (words !== '') failure = words;
        });
    });

    function agentLabel(one: ComposerAgent): string {
        if (one === 'claude') return t('sessions.kind_claude');
        if (one === 'codex') return t('sessions.kind_codex');
        return t('sessions.kind_shell');
    }

    function agentGlyph(one: ComposerAgent): string {
        if (one === 'claude') return t('sessions.kind_claude_glyph');
        if (one === 'codex') return t('sessions.kind_codex_glyph');
        return t('sessions.kind_shell_glyph');
    }

    /** Keep one change of the record in the tab's instance state. */
    function keep(next: Partial<ComposerRecord>): void {
        setInstanceState(owner, withComposer(instanceState(owner), { ...record, ...next }));
    }

    function pickList(key: string, id: string): void {
        if (agent === 'shell') return;
        keep({ picks: { ...record.picks, [agent]: { ...picks, [key]: id } } });
    }

    function pickAccount(label: string): void {
        if (agent === 'shell') return;
        keep({ accounts: { ...record.accounts, [agent]: label } });
    }

    /** Put a file into the prompt as a mention of its path inside the workspace. */
    function attach(path: string): void {
        const relative = relativeIn(workspace, path);
        if (relative === null) {
            failure = t('composer.outside', path);
            return;
        }
        failure = '';
        const next = insertMention(prompt, caret, mention(relative));
        prompt = next.text;
        caret = next.caret;
        if (!attached.includes(path)) attached = [...attached, path];
        picking = false;
    }

    /** A file dropped from a Files tab: its absolute path, carried under the file drag type. */
    function dropped(event: DragEvent): void {
        const path = event.dataTransfer?.getData(FILE_DRAG) ?? '';
        if (path === '') return;
        event.preventDefault();
        attach(path);
    }

    function dragOver(event: DragEvent): void {
        if (event.dataTransfer?.types.includes(FILE_DRAG) === true) event.preventDefault();
    }

    function typed(value: string): void {
        prompt = value;
        // A mention the reader deleted from the text is no longer attached.
        attached = attached.filter((path) => {
            const relative = relativeIn(workspace, path);
            return relative !== null && value.includes(mention(relative));
        });
    }

    function keyed(event: KeyboardEvent): void {
        const field = event.currentTarget;
        if (field instanceof HTMLTextAreaElement) caret = field.selectionStart;
        if (promptKey(event) !== 'send') return;
        event.preventDefault();
        void start();
    }

    /** Remember the caret as the reader leaves the box, which is where an attached file goes. */
    function left(event: FocusEvent): void {
        const field = event.target;
        if (field instanceof HTMLTextAreaElement) caret = field.selectionStart;
    }

    /** Start, asking first when a value the start resolves to skips what the agent asks. */
    async function start(confirmed = false): Promise<void> {
        if (starting) return;
        const question =
            agent === 'shell' ? null : skipQuestion(agent, agentLabel(agent), choices, picks);
        if (question !== null && !confirmed) {
            asking = question;
            return;
        }
        starting = true;
        failure = '';
        const shape = composeStart(
            agent,
            workspace,
            account,
            picks,
            prompt,
            attached,
            record.task === undefined || task === null
                ? undefined
                : { ref: record.task, seed: task.seed },
            question !== null
        );
        // The folder and kind the start used stay with this composer, whether or not it lands.
        keep({ workspace, agent });
        const answer = await composeTerminal(shape, owner);
        starting = false;
        // A start whose tab closed meanwhile was ended by the store, and there is nothing to say.
        if (!answer.ok && answer.id === '' && answer.error === '') return;
        if (answer.seedApproval !== undefined) {
            approving = answer.seedApproval;
            return;
        }
        if (!answer.ok || answer.id === '') {
            failure = answer.error === '' ? t('composer.failed') : answer.error;
            // The server's seed differs from the one shown: show the current one.
            if (answer.refused === 'task-changed') void loadTask(owner, true);
            return;
        }
        prompt = '';
        attached = [];
        onstarted(answer.id, agentLabel(agent));
    }

    /** Approve the seed shown in the approval panel, then make the same start again. */
    async function approve(): Promise<void> {
        const asked = approving;
        if (asked === null || record.task === undefined || approvingNow) return;
        approvingNow = true;
        const answer = await approveSeed(record.task, asked.seed, asked.cwd, asked.agent);
        approvingNow = false;
        approving = null;
        if (!answer.ok) {
            failure = answer.error === '' ? t('composer.failed') : answer.error;
            if (answer.refused === 'task-changed') void loadTask(owner, true);
            return;
        }
        await start(true);
    }

    /** The words of the value a list has picked. */
    function pickedLabel(key: string): string {
        const list = choices?.lists.find((one) => one.key === key);
        return list?.values.find((one) => one.id === picks[key])?.label ?? '';
    }
</script>

<div class="composer" data-composer>
    <AgentFindings {findings} />
    {#if approving !== null}
        <div class="box">
            <SeedApproval
                seed={approving.seed}
                folder={approving.cwd}
                agent={agentLabel(agent)}
                busy={approvingNow}
                onapprove={() => void approve()}
                oncancel={() => (approving = null)}
            />
        </div>
    {:else}
        <div
            class="box"
            role="group"
            aria-label={t('composer.title')}
            ondrop={dropped}
            ondragover={dragOver}
            onfocusout={left}
        >
            {#if task !== null}
                <TaskBlock seed={task.seed} onremove={() => dropTask(owner)} />
            {/if}
            <div class="prompt" data-composer-prompt>
                <TextArea
                    value={prompt}
                    label={agent === 'shell' ? t('composer.command') : t('composer.prompt')}
                    placeholder={promptWords}
                    rows={4}
                    bare
                    oninput={typed}
                    onkeydown={keyed}
                />
            </div>
            {#if picking}
                <AttachPicker {workspace} onpick={attach} onclose={() => (picking = false)} />
            {/if}
            <div class="foot" data-composer-foot>
                <ToolButton
                    label={t('composer.attach')}
                    title={t('composer.attach_title')}
                    glyph="expand"
                    compact
                    bare
                    pressed={picking}
                    onclick={() => (picking = !picking)}
                />
                <WorkspacePicker
                    {workspace}
                    {places}
                    {hub}
                    placement="down"
                    onpick={(dir: string) => keep({ workspace: dir })}
                />
                {#if branch !== ''}
                    <span class="branch" data-composer-branch title={t('composer.branch_title')}>
                        <Glyph name="branch" />
                        <span class="branch-name">{branch}</span>
                    </span>
                {/if}
                <span class="picker" data-picker="agent">
                    <Menu
                        label={agentLabel(agent)}
                        glyph={agentGlyph(agent)}
                        placement="down"
                        items={AGENTS.map((one) => ({
                            id: one,
                            label: agentLabel(one),
                            glyph: agentGlyph(one),
                            active: one === agent
                        }))}
                        onpick={(id) => keep({ agent: id as ComposerAgent })}
                    />
                </span>
                {#if accounts.length > 1}
                    <span class="picker" data-picker="account">
                        <Menu
                            label={account}
                            placement="down"
                            items={accounts.map((one) => ({
                                id: one.label,
                                label: one.label,
                                title: one.dir,
                                active: one.label === account
                            }))}
                            onpick={pickAccount}
                        />
                    </span>
                {/if}
                {#each choices?.lists ?? [] as list (list.key)}
                    <span class="picker" data-picker={list.key}>
                        <Menu
                            label={pickedLabel(list.key)}
                            placement="down"
                            groups={[
                                {
                                    id: list.key,
                                    heading: list.label,
                                    items: list.values.map((one) => ({
                                        id: one.id,
                                        label: one.label,
                                        active: one.id === picks[list.key]
                                    }))
                                }
                            ]}
                            items={[]}
                            onpick={(id: string) => pickList(list.key, id)}
                        />
                    </span>
                {/each}
                <span class="grow"></span>
                <ToolButton
                    label={t('composer.start')}
                    title={t('composer.start_title')}
                    glyph="launch"
                    disabled={starting}
                    onclick={() => void start()}
                />
            </div>
        </div>
    {/if}
    {#if failure !== ''}
        <div class="failure" data-composer-failure>
            <Empty error message={failure} />
        </div>
    {/if}
    {#if asking !== null}
        <Confirm
            message={asking.message}
            detail={asking.detail}
            confirm={t('composer.confirm_skip_yes')}
            cancel={t('composer.confirm_skip_no')}
            onconfirm={() => {
                asking = null;
                void start(true);
            }}
            oncancel={() => (asking = null)}
        />
    {/if}
</div>

<style>
    .composer {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }

    .box {
        display: flex;
        flex-direction: column;
        min-width: 0;
        border: 1px solid var(--line);
        border-radius: var(--input-radius);
        background: var(--chip);
        overflow: visible;
    }

    .box:focus-within {
        border-color: var(--accent);
    }

    .prompt {
        padding: 6px 8px 0;
    }

    .foot {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px;
        min-width: 0;
        padding: 4px 6px;
    }

    .grow {
        flex: 1 1 auto;
    }

    .branch {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
        padding: 0 4px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .branch-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .picker {
        display: inline-flex;
        min-width: 0;
    }

    /* Over the wallpaper the box sits on the tinted box of the view, which is its surface there. */
    :global(body.wall) .box {
        background: transparent;
    }

    :global(body.rice) .box {
        background: none;
        font-family: var(--font-mono);
    }
</style>
