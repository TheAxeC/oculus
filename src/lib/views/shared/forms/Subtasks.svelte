<script lang="ts">
    // Layer 3, view partial under views/shared/. The subtasks block of one card: the open count,
    // one row per line with what it says and when it is due, the buttons that move it, and the
    // one-line form that adds another.
    //
    // A card with no lines draws no block at all: adding its first line is one of the card's own
    // actions, which opens the add form here with no heading over it. So whether the add form is
    // open is the card's, handed in, since the card's action and this block's own add control both
    // open it.
    //
    // Two views draw it: views/shared/card/ProjectCard.svelte, which hands it the `{ id }` of one
    // manifest, and views/boards/collection/EntryCard.svelte, which hands it the `{ id, collection
    // }` of one entry of one collection. The host is the only difference between the two, so it is
    // the prop, and `SubtaskTarget` is the write path's own type for it.
    //
    // Every button is one call of the write path (state/client/writes.svelte.ts) and nothing else:
    // the line the reader sees change is the watcher's next push of the portfolio, about a fifth of
    // a second later, which is why nothing here edits what it was handed.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import DateInput from '$lib/ui/forms/DateInput.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { SubtaskAction, SubtaskTarget } from '$lib/state/client/writes.svelte';
    import { openSubtaskCount, type Subtask } from '$lib/state/boards/collection';
    import { useState } from '$lib/state/client/use';

    const {
        writes: { addSubtask, writeSubtask }
    } = useState();

    type Props = {
        /** What the lines hang under: one project by its id, or one entry of one collection. */
        target: SubtaskTarget;
        subtasks: Subtask[];
        /** What a write answered, for the one outcome line the card holds. */
        onsaid: (said: string) => void;
        /** True while the add form is open. */
        adding: boolean;
        /** Open or close the add form. */
        onadding: (next: boolean) => void;
    };

    let { target, subtasks, onsaid, adding, onadding }: Props = $props();

    let text = $state('');
    let due = $state('');

    const open = $derived(openSubtaskCount(subtasks));

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
            onadding(false);
            text = '';
            due = '';
        }
    }
</script>

{#if subtasks.length > 0 || adding}
    <div class="subtasks">
        {#if subtasks.length > 0}
            <div class="hdr">
                <span class="label">{t('project.action.subtasks')}</span>
                <span class="count">{t('project.action.n_open', open)}</span>
                <ToolButton
                    small
                    label={t('project.action.add_subtask')}
                    title={t('project.action.add_subtask_tip')}
                    active={adding}
                    onclick={() => onadding(!adding)}
                />
            </div>
        {/if}

        {#if adding}
            <div class="form">
                <TextInput
                    value={text}
                    label={t('project.action.subtask_do')}
                    placeholder={t('project.action.subtask_do')}
                    oninput={(next: string) => (text = next)}
                />
                <DateInput
                    value={due}
                    label={t('project.action.subtask_deadline')}
                    oninput={(n: string) => (due = n)}
                />
                <ToolButton label={t('project.action.subtask_save')} onclick={add} />
                <ToolButton
                    label={t('project.action.subtask_cancel')}
                    onclick={() => onadding(false)}
                />
            </div>
        {/if}

        {#each subtasks as line (line.key)}
            <div class="line" class:done={line.done}>
                <span class="box">
                    <Glyph
                        name={line.done
                            ? t('project.action.box_on_glyph')
                            : t('project.action.box_off_glyph')}
                    />
                </span>
                <span class="do">{line.do}</span>
                {#if line.deadline}
                    <Tag label={line.deadline} glyph={t('project.card.deadline_glyph')} />
                {/if}
                <span class="acts">
                    {#if line.done}
                        <ToolButton
                            small
                            label={t('project.action.reopen')}
                            onclick={() => act(line.key, 'reopen')}
                        />
                    {:else}
                        <ToolButton
                            small
                            label={t('project.action.done')}
                            title={t('project.action.mark_done')}
                            onclick={() => act(line.key, 'done')}
                        />
                        {#if line.snooze}
                            <ToolButton
                                small
                                label={t('project.action.unsnooze')}
                                onclick={() => act(line.key, 'snooze', '')}
                            />
                        {:else}
                            <ToolButton
                                small
                                label={t('project.action.snooze_1w')}
                                title={t(
                                    'project.action.snooze_tip',
                                    t('project.action.snooze_1w')
                                )}
                                onclick={() => act(line.key, 'snooze', snoozeDate(7))}
                            />
                            <ToolButton
                                small
                                label={t('project.action.snooze_1mo')}
                                title={t(
                                    'project.action.snooze_tip',
                                    t('project.action.snooze_1mo')
                                )}
                                onclick={() => act(line.key, 'snooze', snoozeDate(30))}
                            />
                            <ToolButton
                                small
                                label={t('project.action.snooze_hide')}
                                title={t(
                                    'project.action.snooze_tip',
                                    t('project.action.snooze_hide')
                                )}
                                onclick={() => act(line.key, 'snooze', 'true')}
                            />
                        {/if}
                    {/if}
                    <ToolButton
                        small
                        label={t('project.action.del')}
                        title={t('project.action.delete_subtask')}
                        onclick={() => act(line.key, 'delete')}
                    />
                </span>
            </div>
        {/each}
    </div>
{/if}

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

    /* A header and a line are one row of the tree's height; a line that wraps grows by whole
       lines. */
    .hdr,
    .line {
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    /* The buttons of a line are drawn while the line is hovered or holds the focus, and always on
       a screen that does not hover. They stay in the tab order while they are transparent. */
    .line {
        --row-reveal: 0;
    }

    .line:hover,
    .line:focus-within {
        --row-reveal: 1;
    }

    @media (hover: none) {
        .line {
            --row-reveal: 1;
        }
    }

    .acts {
        opacity: var(--row-reveal);
        transition: opacity 120ms ease-out;
    }

    .label {
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    .count {
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .box {
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
