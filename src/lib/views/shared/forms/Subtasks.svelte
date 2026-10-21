<script lang="ts">
    // Layer 3, view partial under views/shared/. The subtasks block of one card: the open count,
    // one row per line with what it says and when it is due, the buttons that move it, and the
    // one-line form that adds another (views/shared/forms/LineForm.svelte). A line's edit button
    // turns the line into the same form, holding its text and deadline, and its save writes each of
    // the two that changed.
    //
    // A card with no lines draws no block at all: adding its first line is one of the card's own
    // actions, which opens the add form here with no heading over it. So whether the add form is
    // open is the card's, handed in, since the card's action and this block's own add control both
    // open it.
    //
    // Two views draw it: views/shared/card/project/ProjectCard.svelte, which hands it the `{ id }`
    // of one manifest, and views/shared/forms/entry/card/EntryCard.svelte, which hands it the
    // `{ id, collection }` of one entry of one collection. The host is the only difference between
    // the two, so it is the prop, and `SubtaskTarget` is the write path's own type for it.
    //
    // Every button is one call of the write path (state/client/writes.svelte.ts) and nothing else:
    // the line the reader sees change is the watcher's next push of the portfolio, about a fifth of
    // a second later, which is why nothing here edits what it was handed.
    //
    // A card whose file has unsaved text in a source tab hands `blocked`, the words saying so:
    // every button that writes the file is drawn disabled with them as its title.
    //
    // A web address written in a line is a link (ui/display/text/LinkedText.svelte).

    import Tag from '$lib/ui/controls/Tag.svelte';
    import LinkedText from '$lib/ui/display/text/LinkedText.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import LineForm from './LineForm.svelte';
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
        /** Why the buttons that write are disabled, already translated; '' when they are not. */
        blocked?: string;
    };

    let { target, subtasks, onsaid, adding, onadding, blocked = '' }: Props = $props();

    /** A button's own words, or the words saying why it is disabled. */
    function why(own?: string): string | undefined {
        return blocked === '' ? own : blocked;
    }

    /** The key of the line being edited; null while no line is. */
    let editing = $state<string | null>(null);

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

    /**
     * The edit form's save: the text, then the deadline, each written only when it changed, and the
     * form closed when every write it made was taken. An emptied deadline clears it.
     */
    async function save(line: Subtask, text: string, due: string): Promise<void> {
        const writes: [SubtaskAction, string][] = [];
        if (text !== line.do) writes.push(['do', text]);
        if (due !== (line.deadline ?? '')) writes.push(['deadline', due]);
        for (const [action, value] of writes) {
            const answer = await writeSubtask(target, line.key, action, value);
            said(answer);
            if (!answer.ok) return;
        }
        editing = null;
    }

    /** The add form's save: one line, with the deadline when the form was given one. */
    async function add(text: string, due: string): Promise<void> {
        const fields = due === '' ? { do: text } : { do: text, deadline: due };
        const answer = await addSubtask(target, fields);
        said(answer);
        if (answer.ok) onadding(false);
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
                    title={why(t('project.action.add_subtask_tip'))}
                    disabled={blocked !== ''}
                    active={adding}
                    onclick={() => onadding(!adding)}
                />
            </div>
        {/if}

        {#if adding}
            <LineForm
                dateLabel={t('project.action.subtask_deadline')}
                {blocked}
                onsave={add}
                oncancel={() => onadding(false)}
            />
        {/if}

        {#each subtasks as line (line.key)}
            {#if editing === line.key}
                <LineForm
                    text={line.do}
                    date={line.deadline}
                    dateLabel={t('project.action.subtask_deadline')}
                    {blocked}
                    onsave={(text, due) => save(line, text, due)}
                    oncancel={() => (editing = null)}
                />
            {:else}
                <div class="line" class:done={line.done}>
                    <span class="box">
                        <Glyph
                            name={line.done
                                ? t('project.action.box_on_glyph')
                                : t('project.action.box_off_glyph')}
                        />
                    </span>
                    <span class="do"><LinkedText text={line.do} /></span>
                    {#if line.deadline}
                        <Tag label={line.deadline} glyph={t('project.card.deadline_glyph')} />
                    {/if}
                    <span class="acts">
                        {#if line.done}
                            <ToolButton
                                small
                                label={t('project.action.reopen')}
                                title={why()}
                                disabled={blocked !== ''}
                                onclick={() => act(line.key, 'reopen')}
                            />
                        {:else}
                            <ToolButton
                                small
                                label={t('project.action.done')}
                                title={why(t('project.action.mark_done'))}
                                disabled={blocked !== ''}
                                onclick={() => act(line.key, 'done')}
                            />
                            {#if line.snooze}
                                <ToolButton
                                    small
                                    label={t('project.action.unsnooze')}
                                    title={why()}
                                    disabled={blocked !== ''}
                                    onclick={() => act(line.key, 'snooze', '')}
                                />
                            {:else}
                                <ToolButton
                                    small
                                    label={t('project.action.snooze_1w')}
                                    title={why(
                                        t(
                                            'project.action.snooze_tip',
                                            t('project.action.snooze_1w')
                                        )
                                    )}
                                    disabled={blocked !== ''}
                                    onclick={() => act(line.key, 'snooze', snoozeDate(7))}
                                />
                                <ToolButton
                                    small
                                    label={t('project.action.snooze_1mo')}
                                    title={why(
                                        t(
                                            'project.action.snooze_tip',
                                            t('project.action.snooze_1mo')
                                        )
                                    )}
                                    disabled={blocked !== ''}
                                    onclick={() => act(line.key, 'snooze', snoozeDate(30))}
                                />
                                <ToolButton
                                    small
                                    label={t('project.action.snooze_hide')}
                                    title={why(
                                        t(
                                            'project.action.snooze_tip',
                                            t('project.action.snooze_hide')
                                        )
                                    )}
                                    disabled={blocked !== ''}
                                    onclick={() => act(line.key, 'snooze', 'true')}
                                />
                            {/if}
                        {/if}
                        <ToolButton
                            small
                            label={t('project.action.edit')}
                            title={why(t('project.action.edit_subtask'))}
                            disabled={blocked !== ''}
                            onclick={() => (editing = line.key)}
                        />
                        <ToolButton
                            small
                            label={t('project.action.del')}
                            title={why(t('project.action.delete_subtask'))}
                            disabled={blocked !== ''}
                            onclick={() => act(line.key, 'delete')}
                        />
                    </span>
                </div>
            {/if}
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
