<script lang="ts">
    // Layer 3, shell. The update-task tray. Each task starts the server-built Claude command in a
    // terminal, selects it, and opens the Terminal view; the snapshot's feed summary supplies the
    // last-run value beside each control.

    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { findView } from '$lib/state/layout';
    import { openView, workbench } from '$lib/state/layout.svelte';
    import { paletteSource } from '$lib/state/palette-source.svelte';
    import { select } from '$lib/state/selection.svelte';
    import { startChat, startTask, type TaskKind } from '$lib/state/terminals.svelte';
    import { t } from '$lib/state/text';

    type Props = {
        open: boolean;
        onclose: () => void;
    };

    let { open, onclose }: Props = $props();
    let running: TaskKind | null = $state(null);
    let chatting = $state(false);
    let said = $state('');
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
            last: summary?.inbox?.run
        }
    ]);

    function terminalOpen(): boolean {
        return [workbench().main, workbench().panel].some(
            (tree) => findView(tree, 'terminal', null) !== null
        );
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
        if (!terminalOpen()) openView('terminal', 'main');
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
        if (!terminalOpen()) openView('terminal', 'main');
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
                    <div class="task" data-task={task.kind}>
                        <ToolButton
                            label={task.label}
                            title={task.note}
                            active={running === task.kind}
                            disabled={running !== null || chatting}
                            onclick={() => start(task.kind)}
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
