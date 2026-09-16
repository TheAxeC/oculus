<script lang="ts">
    // Layer 3, shell. The update-task tray. Each task starts the server-built Claude command in a
    // terminal, selects it, and opens the Terminal view; the snapshot's feed summary supplies the
    // last-run value beside each control, and the inbox triage's comes from the `inbox` channel,
    // whose notes file is what that task writes.
    //
    // A task is an ordinary Claude session, so its permission prompts are answered in the terminal
    // pane and a press starts it straight away. While `tasks.skip_permissions` is on there is nobody
    // to answer them and the session decides for itself, so the press asks first: the confirmation
    // is the one place a reader is told which of the two a press is about to do. It is asked once
    // per press and not remembered, since the answer is about this run and not about the setting.

    import Confirm from '$lib/ui/Confirm.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { findView } from '$lib/state/layout';
    import type { TaskKind } from '$lib/state/terminals.svelte';
    import { t } from '$lib/state/text';
    import { useState } from '$lib/state/use';

    const {
        layout: { layout, openView },
        paletteSource: { paletteSource },
        selection: { select },
        terminals: { startChat, startTask, taskSkipsPermissions }
    } = useState();

    type Props = {
        open: boolean;
        onclose: () => void;
    };

    let { open, onclose }: Props = $props();
    let running: TaskKind | null = $state(null);
    let asking: TaskKind | null = $state(null);
    let chatting = $state(false);
    let said = $state('');
    const skipping = $derived(taskSkipsPermissions());
    const current = $derived(paletteSource());
    const summary = $derived(current.snapshot?.entities.feeds);
    const tasks = $derived([
        {
            kind: 'litwatch' as const,
            label: t('app.tasks.lit_label'),
            note: t('app.tasks.lit_note'),
            last: summary?.radar?.lastRun
        },
        {
            kind: 'scout' as const,
            label: t('app.tasks.scout_label'),
            note: t('app.tasks.scout_note'),
            last: summary?.scout?.lastRun
        },
        {
            kind: 'linkedin' as const,
            label: t('app.tasks.linkedin_label'),
            note: t('app.tasks.linkedin_note'),
            last: summary?.linkedin?.lastPost
        },
        {
            kind: 'inbox' as const,
            label: t('app.tasks.inbox_label'),
            note: t('app.tasks.inbox_note'),
            last: current.notesRun ?? undefined
        }
    ]);

    function terminalOpen(): boolean {
        return findView(layout(), 'terminal', null) !== null;
    }

    /** One task's words, for a sentence outside the row that draws it. */
    function taskLabel(kind: TaskKind): string {
        return tasks.find((task) => task.kind === kind)?.label ?? kind;
    }

    /** What a press does: start the task, or ask first when the task would run unattended. */
    function press(kind: TaskKind): void {
        if (skipping) {
            asking = kind;
            return;
        }
        void start(kind);
    }

    async function start(kind: TaskKind): Promise<void> {
        running = kind;
        said = '';
        const answer = await startTask(kind);
        running = null;
        if (!answer.ok) {
            said = t('editor.failed', answer.error);
            return;
        }
        select(answer.id);
        if (!terminalOpen()) openView('terminal');
        onclose();
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
        select(answer.id);
        if (!terminalOpen()) openView('terminal');
        onclose();
    }
</script>

{#if open}
    <div
        class="ground"
        role="presentation"
        onclick={(event) => {
            if (event.target === event.currentTarget) onclose();
        }}
    >
        <div class="tray" role="dialog" aria-modal="true" aria-label={t('app.tasks.update_tasks')}>
            <header>
                <h2>{t('app.tasks.update_tasks')}</h2>
                <ToolButton
                    label={t('app.tasks.close')}
                    glyph="dismiss"
                    compact
                    onclick={onclose}
                />
            </header>
            <div class="tasks">
                {#each tasks as task (task.kind)}
                    <div class="task" data-task={task.kind} data-confirms={skipping || undefined}>
                        <ToolButton
                            label={task.label}
                            title={task.note}
                            active={running === task.kind}
                            disabled={running !== null || chatting}
                            onclick={() => press(task.kind)}
                        />
                        <span class="last">{task.last ?? t('app.palette_unavailable')}</span>
                        {#if task.kind === 'inbox'}
                            <span class="note">{t('app.tasks.note_prefix', task.note)}</span>
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
            {#if said !== ''}
                <p class="said">{said}</p>
            {/if}
        </div>
        {#if asking !== null}
            {@const kind = asking}
            <Confirm
                message={t('app.tasks.skip_confirm', taskLabel(kind))}
                confirm={t('app.tasks.skip_confirm_ok')}
                cancel={t('ui.confirm_cancel')}
                onconfirm={() => {
                    // The kind is read before the dialog is put away: `kind` is the const over
                    // `asking`, and once that is null there is no task to read from it.
                    const started = kind;
                    asking = null;
                    void start(started);
                }}
                oncancel={() => (asking = null)}
            />
        {/if}
    </div>
{/if}

<style>
    .ground {
        position: fixed;
        inset: 0;
        z-index: 65;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 10vh 16px 16px;
    }

    .ground::before {
        position: absolute;
        inset: 0;
        content: '';
        background: var(--bg);
        opacity: 0.72;
    }

    .tray {
        position: relative;
        display: grid;
        gap: 10px;
        width: min(42rem, 100%);
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
    .note,
    .said {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .note {
        flex-basis: 100%;
    }
</style>
