<script lang="ts">
    // Layer 3, shell. The update-task tray. Each task starts the server-built Claude command in a
    // terminal, selects it, and opens the Terminal view; the snapshot's feed summary supplies the
    // last-run value beside each control.

    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { findView } from '$lib/state/layout';
    import { openView, workbench } from '$lib/state/layout.svelte';
    import { paletteSource } from '$lib/state/palette-source.svelte';
    import { select } from '$lib/state/selection.svelte';
    import { startTask, type TaskKind } from '$lib/state/terminals.svelte';
    import { t } from '$lib/state/text';

    type Props = {
        open: boolean;
        onclose: () => void;
    };

    let { open, onclose }: Props = $props();
    let running: TaskKind | null = $state(null);
    let said = $state('');
    const current = $derived(paletteSource());
    const summary = $derived(current.snapshot?.entities.feeds);
    const tasks = $derived([
        {
            kind: 'litwatch' as const,
            label: t('js.tasks.lit_label'),
            note: t('js.tasks.lit_note'),
            last: summary?.radar?.lastRun
        },
        {
            kind: 'scout' as const,
            label: t('js.tasks.scout_label'),
            note: t('js.tasks.scout_note'),
            last: summary?.scout?.lastRun
        },
        {
            kind: 'linkedin' as const,
            label: t('js.tasks.linkedin_label'),
            note: t('js.tasks.linkedin_note'),
            last: summary?.linkedin?.lastPost
        },
        {
            kind: 'inbox' as const,
            label: t('js.tasks.inbox_label'),
            note: t('js.tasks.inbox_note'),
            last: summary?.inbox?.run
        }
    ]);

    function terminalOpen(): boolean {
        return [workbench().main, workbench().panel].some(
            (tree) => findView(tree, 'terminal') !== null
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
</script>

{#if open}
    <div class="tray" role="dialog" aria-modal="true" aria-label={t('js.tasks.update_tasks')}>
        <header>
            <h2>{t('js.tasks.update_tasks')}</h2>
            <ToolButton label={t('js.tasks.close')} glyph="dismiss" compact onclick={onclose} />
        </header>
        <div class="tasks">
            {#each tasks as task (task.kind)}
                <div class="task" data-task={task.kind}>
                    <ToolButton
                        label={task.label}
                        title={task.note}
                        active={running === task.kind}
                        disabled={running !== null}
                        onclick={() => start(task.kind)}
                    />
                    <span class="last">{task.last ?? t('app.palette_unavailable')}</span>
                    {#if task.kind === 'inbox'}
                        <span class="note">{t('js.tasks.note_prefix', task.note)}</span>
                    {/if}
                </div>
            {/each}
        </div>
        {#if said !== ''}
            <p class="said">{said}</p>
        {/if}
    </div>
{/if}

<style>
    .tray {
        position: fixed;
        z-index: 65;
        top: 12px;
        left: calc(var(--rail-width) + 8px);
        display: grid;
        gap: 10px;
        width: min(34rem, calc(100vw - var(--rail-width) - 32px));
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        box-shadow: var(--shadow);
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
