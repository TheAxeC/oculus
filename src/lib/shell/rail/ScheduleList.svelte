<script lang="ts">
    // Layer 3, shell. The Schedules section of the update tray: the entries of `schedules.yml` in
    // the hub's `.oculus` folder as rows, each with what it runs, its pattern, why it does not run
    // when it does not, its next run and its latest runs, and the controls that edit, pause, run or
    // delete it. The file that does not read is said first, one line for each file, because nothing
    // runs while one of them is unread.
    //
    // Everything a row shows is already worded by the `schedule` store, and every press is a call
    // on it; this draws the rows and tells the tray what to do with an answer. A Run now that
    // starts a terminal hands its id to the tray, which shows it and closes itself as a task
    // press does; a Run now that starts nothing, or any refusal, is a line in the tray's `said`.
    // A delete is asked by the tray's confirmation, which stands over the tray, so the row only
    // names the row to ask about. While any press runs every control of the section is disabled;
    // the Run now pressed also draws the sync glyph turning before its words until the start is
    // answered, and no glyph at rest.
    //
    // The section is the group every grouping of a view is drawn as
    // (ui/controls/heads/GroupHead.svelte), with Add at its heading's right end. The tray has no
    // pane state, so the tray holds whether the section is folded for the life of the page,
    // unsaved.

    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const { schedule } = useState();

    type Props = {
        /** Select a terminal, show it and put the tray away. */
        onshow: (id: string) => void;
        /** Put a sentence in the tray's line. */
        onsaid: (text: string) => void;
        /** Ask whether to delete the row at that position, named as the page read it. */
        ondelete: (at: number, name: string) => void;
        /** Whether the section is open, and the press of its fold control; the tray holds it. */
        open: boolean;
        ontoggle: () => void;
    };

    let { onshow, onsaid, ondelete, open, ontoggle }: Props = $props();
    let busy = $state(false);
    /** The key of the row whose Run now is waiting for its start to be answered, or null. */
    let starting: string | null = $state(null);

    const rows = $derived(schedule.rows());

    /** Run one press of a row and say its refusal; a landed write is seen as the row changing. */
    async function press(act: () => ReturnType<typeof schedule.pause>): Promise<void> {
        busy = true;
        onsaid('');
        const answer = await act();
        busy = false;
        if (!answer.ok) onsaid(answer.error);
        else if (answer.terminal !== null) onshow(answer.terminal);
        else if (answer.skipped !== '') onsaid(answer.skipped);
    }

    /** Run a row now, its control turning until the start is answered. */
    async function runNow(row: (typeof rows)[number]): Promise<void> {
        starting = row.key;
        try {
            await press(() => schedule.runNow(row));
        } finally {
            starting = null;
        }
    }
</script>

<GroupHead
    data-schedules
    aria-label={t('app.schedules.heading')}
    label={t('app.schedules.heading')}
    {open}
    {ontoggle}
>
    {#snippet actions()}
        <ToolButton
            label={t('app.schedules.add')}
            onclick={() => schedule.openDialog({})}
            disabled={busy}
        />
    {/snippet}
    <div class="schedules">
        {#each schedule.unread() as line (line)}
            <p class="said" data-schedule-unread>{line}</p>
        {/each}
        {#if schedule.none() !== ''}
            <p class="note" data-schedule-none>{schedule.none()}</p>
        {/if}
        <ul class="rows">
            {#each rows as row (row.key)}
                <li class="row" data-schedule={row.name} data-paused={row.paused || undefined}>
                    <div class="line">
                        {#if row.name !== ''}
                            <strong class="name">{row.name}</strong>
                        {/if}
                        {#if row.what !== ''}
                            <span class="what">{row.what}</span>
                        {/if}
                        {#if row.pattern !== ''}
                            <code class="pattern">{row.pattern}</code>
                        {/if}
                        {#if row.paused}
                            <span class="paused" data-paused-mark>{t('app.schedules.paused')}</span>
                        {/if}
                    </div>
                    {#if row.problem !== ''}
                        <p class="said" data-schedule-problem>{row.problem}</p>
                    {/if}
                    {#if row.next !== ''}
                        <span class="next" data-next>{row.next}</span>
                    {/if}
                    {#if row.runs.length > 0}
                        <ul class="runs">
                            {#each row.runs as run (run.key)}
                                <li data-run>
                                    {#if run.terminal !== null}
                                        {@const id = run.terminal.id}
                                        <ToolButton
                                            label={run.text}
                                            compact
                                            onclick={() => onshow(id)}
                                        />
                                    {:else}
                                        <span>{run.text}</span>
                                    {/if}
                                </li>
                            {/each}
                        </ul>
                    {/if}
                    <div class="actions">
                        {#if row.readable}
                            <ToolButton
                                label={t('app.schedules.edit')}
                                compact
                                disabled={busy}
                                onclick={() => schedule.openDialog({ at: row.at })}
                            />
                            {#if row.paused}
                                <ToolButton
                                    label={t('app.schedules.resume')}
                                    compact
                                    disabled={busy}
                                    onclick={() => press(() => schedule.resume(row))}
                                />
                            {:else}
                                <ToolButton
                                    label={t('app.schedules.pause')}
                                    compact
                                    disabled={busy}
                                    onclick={() => press(() => schedule.pause(row))}
                                />
                            {/if}
                            <ToolButton
                                label={t('app.schedules.run_now')}
                                glyph={starting === row.key ? 'sync' : undefined}
                                turning={starting === row.key}
                                compact={starting !== row.key}
                                disabled={busy}
                                onclick={() => runNow(row)}
                            />
                        {/if}
                        <ToolButton
                            label={t('app.schedules.delete')}
                            compact
                            disabled={busy}
                            onclick={() => ondelete(row.at, row.name)}
                        />
                    </div>
                </li>
            {/each}
        </ul>
    </div>
</GroupHead>

<style>
    .schedules {
        display: grid;
        gap: 6px;
    }

    .said,
    .note {
        margin: 0;
    }

    .rows,
    .runs {
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .rows {
        display: grid;
        gap: 8px;
    }

    .row {
        display: grid;
        gap: 2px;
        padding-left: 8px;
        border-left: 2px solid var(--line);
    }

    .line,
    .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 8px;
    }

    .actions {
        align-items: center;
    }

    .runs {
        padding-left: 16px;
    }

    .what,
    .pattern,
    .next,
    .note,
    .said,
    .runs {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .pattern {
        font-family: var(--font-mono);
    }

    .paused {
        color: var(--accent-txt, var(--accent));
        font-size: var(--fs-sm);
    }
</style>
