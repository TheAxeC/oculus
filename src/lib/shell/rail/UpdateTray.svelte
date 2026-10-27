<script lang="ts">
    // Layer 3, shell. The update tray. It holds two sections under its heading. Schedules
    // (ScheduleList.svelte) lists the entries of `schedules.yml` in the hub's `.oculus` folder with
    // their next and latest runs and the controls that edit, pause, run and delete them. Tasks
    // lists one row for each hub's update task whose file `.oculus/tasks/<task>.md` that hub
    // holds (the schedule store's `offered`), the primary's first, each named by its hub when two
    // or more hubs hold that task, and one line in their place when no hub holds a task file or
    // the workspace holds no hub: each control starts the server-built Claude command in that
    // hub's folder in a terminal, selects it, and shows it in the Terminal tab of the page on
    // screen, or a new one (the terminals store's `showTerminal`); beside each control, a cell
    // gives the last run with its label (that hub's row of the snapshot's feed summary, `byHub`,
    // supplies it, and the inbox triage's comes from the `inbox` channel, whose notes file is what
    // that task writes, the same for every hub), a separator, a cell saying which schedule runs
    // the task of that hub next, and the control that opens the schedule dialog for the task of
    // that hub.
    //
    // A task is an ordinary Claude session, so its permission prompts are answered in the terminal
    // pane and a press starts it straight away. From the press until the start is answered (the
    // terminal is shown, or the refusal is said) the pressed control draws the sync glyph turning
    // before its label, and no glyph at rest; the run then goes on in the terminal. A run that goes
    // unattended is a schedule's Run unattended choice and no press's.
    //
    // The tray stands on the modal ground ui/frame/Modal.svelte draws: the focus moves into it when
    // it opens, Tab stays inside it, and the focus goes back where it was when it closes. Escape
    // closes it, and a dialog raised over it (the delete confirmation, the schedule dialog) takes
    // the first Escape, so the tray stays open behind it and the next Escape closes it. A press on
    // the ground beside it closes it, and a schedule dialog left open goes with it.
    //
    // Schedules and Tasks are each the group every grouping of a view is drawn as
    // (ui/controls/heads/GroupHead.svelte). The tray has no pane state, so it holds whether each of
    // the two is open for the life of the page, across its closing and opening, and saves nothing.

    import Confirm from '$lib/ui/controls/confirm/Confirm.svelte';
    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Modal from '$lib/ui/frame/Modal.svelte';
    import ScheduleDialog from './ScheduleDialog.svelte';
    import ScheduleList from './ScheduleList.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { UpdateTask } from '$lib/state/sessions/terminals.svelte';
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
    /** Whether the Schedules section and the Tasks section are open, for the life of the page. */
    let schedulesOpen = $state(true);
    let tasksOpen = $state(true);
    /** The key of the row whose start is awaited, its task and its hub. */
    let running: string | null = $state(null);
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
    const byHub = $derived(current.snapshot?.entities.feeds.byHub ?? []);

    /** The last run of a task of one hub: that hub's feed, or the machine's inbox triage. */
    function lastRun(kind: UpdateTask, hub: string): string | null | undefined {
        if (kind === 'inbox') return current.notesRun ?? undefined;
        const own = byHub.find((one) => one.hub === hub);
        if (kind === 'litwatch') return own?.radar?.lastRun;
        if (kind === 'scout') return own?.scout?.lastRun;
        return own?.linkedin?.lastPost;
    }

    const tasks = $derived(
        schedule.offered().map((pair) => ({
            key: JSON.stringify([pair.task, pair.hub]),
            kind: pair.task,
            hub: pair.hub,
            label: schedule.taskLabel(pair),
            note: NOTES[pair.task](),
            last: lastRun(pair.task, pair.hub),
            next: schedule.nextOfTask(pair)
        }))
    );

    /** The row's last-run words: the date with its label, or that the task has not run yet. */
    function lastLine(kind: UpdateTask, last: string | null | undefined): string {
        if (last === null || last === undefined || last === '') return t('app.tasks.last_none');
        return kind === 'linkedin' ? t('app.tasks.last_post', last) : t('app.tasks.last', last);
    }

    async function start(task: { key: string; kind: UpdateTask; hub: string }): Promise<void> {
        running = task.key;
        said = '';
        const answer = await startTask(task.kind, task.hub);
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
                    open={schedulesOpen}
                    ontoggle={() => (schedulesOpen = !schedulesOpen)}
                />
                <GroupHead
                    data-tasks
                    aria-label={t('app.tasks.tasks')}
                    label={t('app.tasks.tasks')}
                    open={tasksOpen}
                    ontoggle={() => (tasksOpen = !tasksOpen)}
                >
                    <div class="tasks">
                        {#if schedule.noTasks() !== ''}
                            <p class="none">{schedule.noTasks()}</p>
                        {/if}
                        {#each tasks as task (task.key)}
                            <div class="task" data-task={task.kind} data-hub={task.hub}>
                                <ToolButton
                                    label={task.label}
                                    title={task.note}
                                    glyph={running === task.key ? 'sync' : undefined}
                                    turning={running === task.key}
                                    active={running === task.key}
                                    disabled={running !== null || chatting}
                                    onclick={() => start(task)}
                                />
                                <span class="last">{lastLine(task.kind, task.last)}</span>
                                <span class="sep" aria-hidden="true">{t('sessions.meta_sep')}</span>
                                <span class="next" data-next>{task.next}</span>
                                <ToolButton
                                    label={t('app.tasks.schedule')}
                                    compact
                                    onclick={() =>
                                        schedule.openDialog({
                                            task: task.kind,
                                            hub: task.hub,
                                            name: task.label
                                        })}
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
                    </div>
                </GroupHead>
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

    /* The tray floats over a pane, so it keeps more of its colour than the pane does. A group's
       sticky strip inside it paints the panel share of a wallpaper layer, which here is the tray's
       own fill, so what scrolls under the strip stays hidden. */
    :global(body.wall) .tray {
        --panel-on-wall: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        background: var(--panel-on-wall);
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
    .none,
    .said {
        margin: 0;
    }

    h2 {
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
    .sep,
    .next,
    .note,
    .none,
    .said {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .note {
        flex-basis: 100%;
    }
</style>
