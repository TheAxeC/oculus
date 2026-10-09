<script lang="ts">
    // Layer 3, shell. The update tray. It holds two sections under its heading. Schedules
    // (ScheduleList.svelte) lists the entries of `schedules.yml` in the hub's `.oculus` folder with
    // their next and latest runs and the controls that edit, pause, run and delete them. Tasks
    // lists the four update tasks: each control starts the server-built Claude command in a
    // terminal, selects it, and shows it in the Terminal tab of the page on screen, or a new one
    // (the terminals store's `showTerminal`); the snapshot's feed summary supplies the last-run
    // value beside each control, the inbox triage's comes from the `inbox` channel, whose notes
    // file is what that task writes, and each row says which schedule runs the task next and opens
    // the schedule dialog for the task.
    //
    // A task is an ordinary Claude session, so its permission prompts are answered in the terminal
    // pane and a press starts it straight away. A run that goes unattended is a schedule's Run
    // unattended choice and no press's.
    //
    // The tray stands on the modal ground ui/frame/Modal.svelte draws: the focus moves into it when
    // it opens, Tab stays inside it, and the focus goes back where it was when it closes. Escape
    // closes it, and a dialog raised over it (the delete confirmation, the schedule dialog) takes
    // the first Escape, so the tray stays open behind it and the next Escape closes it. A press on
    // the ground beside it closes it, and a schedule dialog left open goes with it.

    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Modal from '$lib/ui/frame/Modal.svelte';
    import ScheduleDialog from './ScheduleDialog.svelte';
    import ScheduleList from './ScheduleList.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { UPDATE_TASKS, type UpdateTask } from '$lib/state/sessions/terminals.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        paletteSource: { paletteSource },
        schedule,
        selection: { select },
        terminals: { showTerminal, startChat, startTask }
    } = useState();

    type Props = {
        open: boolean;
        onclose: () => void;
    };

    let { open, onclose }: Props = $props();
    let running: UpdateTask | null = $state(null);
    let chatting = $state(false);
    let said = $state('');
    /** The schedule a delete is being asked about, by its position and the name read there. */
    let deleting: { at: number; name: string } | null = $state(null);
    const NOTES: Record<UpdateTask, () => string> = {
        litwatch: () => t('app.tasks.lit_note'),
        scout: () => t('app.tasks.scout_note'),
        linkedin: () => t('app.tasks.linkedin_note'),
        inbox: () => t('app.tasks.inbox_note')
    };
    const current = $derived(paletteSource());
    const summary = $derived(current.snapshot?.entities.feeds);
    const lastRuns: Record<UpdateTask, () => string | null | undefined> = {
        litwatch: () => summary?.radar?.lastRun,
        scout: () => summary?.scout?.lastRun,
        linkedin: () => summary?.linkedin?.lastPost,
        inbox: () => current.notesRun ?? undefined
    };
    const tasks = $derived(
        UPDATE_TASKS.map((kind) => ({
            kind,
            label: schedule.taskLabel(kind),
            note: NOTES[kind](),
            last: lastRuns[kind](),
            next: schedule.nextOfTask(kind)
        }))
    );

    async function start(kind: UpdateTask): Promise<void> {
        running = kind;
        said = '';
        const answer = await startTask(kind);
        running = null;
        if (!answer.ok) {
            said = t('editor.failed', answer.error);
            return;
        }
        show(answer.id);
    }

    /** Select a terminal and show it, and put the tray away. */
    function show(id: string): void {
        select(id);
        showTerminal(id);
        close();
    }

    /** Put the tray away, and a schedule dialog with it. */
    function close(): void {
        schedule.closeDialog();
        deleting = null;
        onclose();
    }

    /** Delete the schedule the confirmation asked about. */
    async function remove(): Promise<void> {
        const target = deleting;
        deleting = null;
        if (target === null) return;
        const answer = await schedule.remove(target);
        if (!answer.ok) said = answer.error;
    }

    async function chat(): Promise<void> {
        chatting = true;
        said = '';
        const answer = await startChat(null);
        chatting = false;
        if (!answer.ok) {
            said = t('editor.failed', answer.error);
            return;
        }
        show(answer.id);
    }
</script>

{#if open}
    <Modal level="tray" onclose={close}>
        {#snippet children(props)}
            <div {...props} class="tray" aria-label={t('app.tasks.update_tasks')}>
                <header>
                    <h2>{t('app.tasks.update_tasks')}</h2>
                    <ToolButton
                        label={t('app.tasks.close')}
                        glyph="dismiss"
                        compact
                        onclick={close}
                    />
                </header>
                <ScheduleList
                    onshow={show}
                    onsaid={(text: string) => (said = text)}
                    ondelete={(at: number, name: string) => (deleting = { at, name })}
                />
                <section class="tasks" aria-label={t('app.tasks.tasks')}>
                    <h3>{t('app.tasks.tasks')}</h3>
                    {#each tasks as task (task.kind)}
                        <div class="task" data-task={task.kind}>
                            <ToolButton
                                label={task.label}
                                title={task.note}
                                active={running === task.kind}
                                disabled={running !== null || chatting}
                                onclick={() => start(task.kind)}
                            />
                            <span class="last">{task.last ?? t('app.palette_unavailable')}</span>
                            <span class="next" data-next>{task.next}</span>
                            <ToolButton
                                label={t('app.tasks.schedule')}
                                compact
                                onclick={() =>
                                    schedule.openDialog({ task: task.kind, name: task.label })}
                            />
                            {#if task.kind === 'inbox'}
                                <span class="note">
                                    <Glyph name="info" />
                                    {task.note}
                                </span>
                            {/if}
                        </div>
                    {/each}
                    <div class="task" data-task="chat">
                        <ToolButton
                            label={t('app.chat')}
                            glyph="chat"
                            title={t('server.chat.seed_portfolio')}
                            active={chatting}
                            disabled={running !== null || chatting}
                            onclick={chat}
                        />
                    </div>
                </section>
                {#if said !== ''}
                    <p class="said">{said}</p>
                {/if}
            </div>
        {/snippet}
        {#snippet over()}
            {#if deleting !== null}
                <Confirm
                    level="sheet"
                    message={t('app.schedules.delete_ask', deleting.name)}
                    confirm={t('app.schedules.delete')}
                    cancel={t('ui.confirm_cancel')}
                    onconfirm={remove}
                    oncancel={() => (deleting = null)}
                />
            {/if}
            <ScheduleDialog />
        {/snippet}
    </Modal>
{/if}

<style>
    .tray {
        position: relative;
        display: grid;
        gap: 10px;
        width: min(42rem, 100%);
        max-height: 100%;
        overflow: auto;
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        box-shadow: var(--shadow);
    }

    /* The tray floats over a pane, so it keeps more of its colour than the pane does. */
    :global(body.wall) .tray {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    header,
    .task {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    header {
        justify-content: space-between;
    }

    h2,
    h3,
    .said {
        margin: 0;
    }

    h2,
    h3 {
        font-size: var(--fs-md);
    }

    .tasks {
        display: grid;
        gap: 6px;
    }

    .task {
        flex-wrap: wrap;
    }

    .last,
    .next,
    .note,
    .said {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .note {
        flex-basis: 100%;
    }
</style>
