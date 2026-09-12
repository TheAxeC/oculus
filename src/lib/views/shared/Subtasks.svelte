<script lang="ts">
    // Layer 3, view partial under views/shared/. The subtasks block of one card: the open count, one
    // row per line with what it says and when it is due, the buttons that move it, and the one-line
    // form that adds another.
    //
    // Two views draw it: views/shared/ProjectCard.svelte, which hands it the `{ id }` of one
    // manifest, and views/collection/EntryCard.svelte, which hands it the `{ id, collection }` of one
    // entry of one collection. The host is the only difference between the two, so it is the prop,
    // and `SubtaskTarget` is the write path's own type for it.
    //
    // Every button is one call of the write path (state/writes.svelte.ts) and nothing else: the
    // line the reader sees change is the watcher's next push of the portfolio, about a fifth of a
    // second later, which is why nothing here edits what it was handed.

    import Chip from '$lib/ui/Chip.svelte';
    import DateInput from '$lib/ui/DateInput.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import TextInput from '$lib/ui/TextInput.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { t } from '$lib/state/text';
    import {
        addSubtask,
        writeSubtask,
        type SubtaskAction,
        type SubtaskTarget
    } from '$lib/state/writes.svelte';
    import type { Subtask } from '$lib/state/collection';

    type Props = {
        /** What the lines hang under: one project by its id, or one entry of one collection. */
        target: SubtaskTarget;
        subtasks: Subtask[];
        /** What a write answered, for the one outcome line the card holds. */
        onsaid: (said: string) => void;
    };

    let { target, subtasks, onsaid }: Props = $props();

    /** True while the add form is open. */
    let adding = $state(false);
    let text = $state('');
    let due = $state('');

    const open = $derived(subtasks.filter((one) => !one.done).length);

    /** One day, in milliseconds. */
    const DAY = 24 * 60 * 60 * 1000;

    /** The ISO date a snooze button writes: a week or a month from the reader's own today. */
    function snoozeDate(days: number): string {
        return new Date(Date.now() + days * DAY).toISOString().slice(0, 10);
    }

    function said(answer: { ok: boolean; changed: string[]; error?: string }): void {
        onsaid(
            answer.ok
                ? t('editor.saved', answer.changed.join(', '))
                : t('editor.failed', answer.error ?? '')
        );
    }

    /** One button: the action it names, on the line it sits in. */
    async function act(key: string, action: SubtaskAction, value?: string): Promise<void> {
        said(await writeSubtask(target, key, action, value));
    }

    /** The add form's save: one line, with the deadline when the form was given one. */
    async function add(): Promise<void> {
        if (text.trim() === '') return;
        const fields = due === '' ? { do: text.trim() } : { do: text.trim(), deadline: due };
        const answer = await addSubtask(target, fields);
        said(answer);
        if (answer.ok) {
            adding = false;
            text = '';
            due = '';
        }
    }
</script>

<div class="subtasks">
    <div class="hdr">
        <span class="label">{t('actions.subtasks')}</span>
        <span class="count">{t('actions.n_open', open)}</span>
        <ToolButton
            label={t('actions.add_subtask')}
            title={t('actions.add_subtask_tip')}
            active={adding}
            onclick={() => (adding = !adding)}
        />
    </div>

    {#if adding}
        <div class="form">
            <TextInput
                value={text}
                label={t('actions.subtask_do')}
                placeholder={t('actions.subtask_do')}
                oninput={(next) => (text = next)}
            />
            <DateInput
                value={due}
                label={t('actions.subtask_deadline')}
                oninput={(n) => (due = n)}
            />
            <ToolButton label={t('actions.subtask_save')} onclick={add} />
            <ToolButton label={t('actions.subtask_cancel')} onclick={() => (adding = false)} />
        </div>
    {/if}

    {#each subtasks as line (line.key)}
        <div class="line" class:done={line.done}>
            <span class="box">
                <Glyph name={line.done ? t('actions.box_on_glyph') : t('actions.box_off_glyph')} />
            </span>
            <span class="do">{line.do}</span>
            {#if line.deadline}
                <Chip label={line.deadline} glyph={t('cards.deadline_glyph')} />
            {/if}
            <span class="acts">
                {#if line.done}
                    <ToolButton
                        label={t('actions.reopen')}
                        onclick={() => act(line.key, 'reopen')}
                    />
                {:else}
                    <ToolButton
                        label={t('actions.done')}
                        title={t('actions.mark_done')}
                        onclick={() => act(line.key, 'done')}
                    />
                    {#if line.snooze}
                        <ToolButton
                            label={t('actions.unsnooze')}
                            onclick={() => act(line.key, 'snooze', '')}
                        />
                    {:else}
                        <ToolButton
                            label={t('actions.snooze_1w')}
                            title={t('actions.snooze_tip', t('actions.snooze_1w'))}
                            onclick={() => act(line.key, 'snooze', snoozeDate(7))}
                        />
                        <ToolButton
                            label={t('actions.snooze_1mo')}
                            title={t('actions.snooze_tip', t('actions.snooze_1mo'))}
                            onclick={() => act(line.key, 'snooze', snoozeDate(30))}
                        />
                        <ToolButton
                            label={t('actions.snooze_hide')}
                            title={t('actions.snooze_tip', t('actions.snooze_hide'))}
                            onclick={() => act(line.key, 'snooze', 'true')}
                        />
                    {/if}
                {/if}
                <ToolButton
                    label={t('actions.del')}
                    title={t('actions.delete_subtask')}
                    onclick={() => act(line.key, 'delete')}
                />
            </span>
        </div>
    {/each}
</div>

<style>
    .subtasks {
        margin-top: 8px;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .hdr,
    .form,
    .line,
    .acts {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    .label {
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    .count,
    .box {
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }

    .do {
        font-size: var(--fs-md);
        min-width: 0;
    }

    .line.done .do {
        text-decoration: line-through;
        color: var(--muted-txt, var(--muted));
    }
</style>
