<script lang="ts">
    // Layer 3, view partial under views/shared/. The subtasks block of one card: the open count,
    // one row per line with what it says, the names of the people it names and when it is due, the
    // buttons that move it, and the form that adds another (views/shared/forms/dated/
    // DatedForm.svelte, headed "New subtask"). A line's edit button turns the line into the line
    // form (LineForm.svelte), holding its text, its deadline and its people, and its save writes
    // each of them that changed.
    //
    // A card with no lines draws no list: adding its first line is the Subtask row of the card's
    // menu, which opens the add form here. So whether the add form is open is the card's, handed
    // in, since the card's menu and this block's own add control both open it. A project card on a
    // board and a card of a record whose lines it does not list hand `formOnly`, and the block then
    // draws that form alone, with no head and no line; on the project page it draws the whole list
    // with its form. The form closes on a save the server took; an answer that lands after the form
    // closed is dropped by the form.
    //
    // The record card (views/shared/card/record/RecordCard.svelte) draws it, with the `{ id }` of
    // one manifest or the `{ id, collection }` of one entry of one collection. The host is the only
    // difference, so it is the prop, and `SubtaskTarget` is the write path's own type for it.
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
    import type { SubtaskTarget, WriteAnswer } from '$lib/state/client/writes.svelte';
    import type { LinePeopleFields, SubtaskTextAction } from '$lib/state/shared/stores/shapes';
    import { answerWords } from '../answer-words';
    import ListHead from './ListHead.svelte';
    import { saveLine } from './line-save';
    import { openSubtaskCount, type Subtask } from '$lib/state/boards/collection';
    import { lineNames } from '$lib/state/boards/person';
    import { addressOfId } from '$lib/state/shared/page/hubs';
    import { useState } from '$lib/state/client/use';

    const {
        entities: { portfolio },
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
        /**
         * Draw the add form alone, with no head and no line of the list: a card on a board, whose
         * Add Subtask opens the form under the card's other lines.
         */
        formOnly?: boolean;
    };

    let {
        target,
        subtasks,
        onsaid,
        adding,
        onadding,
        blocked = '',
        formOnly = false
    }: Props = $props();

    /** The lines the block draws: none when it draws the add form alone. */
    const lines = $derived(formOnly ? [] : subtasks);

    /** The hub of the record the lines hang under, whose people a line's keys name first. */
    const root = $derived(addressOfId(target.id).hub);

    /** The names of the people a line names, as the one text drawn after it. */
    const namesOf = $derived(lineNames(portfolio()));
    function names(line: Subtask): string {
        return namesOf(root, line).join(t('project.card.line_people_join'));
    }

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

    function said(answer: WriteAnswer): void {
        onsaid(answerWords(answer));
    }

    /** One button: the action it names, on the line it sits in. */
    async function act(key: string, action: SubtaskTextAction, value?: string): Promise<void> {
        said(await writeSubtask(target, key, action, value));
    }

    /**
     * The edit form's save (line-save.ts `saveLine`): the text, the deadline and the people, each
     * written when it changed, and the form closed when every write was taken.
     */
    async function save(
        line: Subtask,
        text: string,
        due: string,
        people: LinePeopleFields
    ): Promise<void> {
        const held = { text: line.do, date: line.deadline ?? '', people: line };
        const edited = { target, key: line.key, date: 'deadline' as const };
        if (await saveLine(writeSubtask, edited, held, { text, date: due, people }, said)) {
            editing = null;
        }
    }

    /** The add form's save: one line, with the deadline when the form was given one, and people. */
    function add(text: string, due: string, people: LinePeopleFields): Promise<WriteAnswer> {
        return addSubtask(target, {
            do: text,
            ...(due === '' ? {} : { deadline: due }),
            ...people
        });
    }

    /** What the add form's save answered: said, and the form closed when the server took it. */
    function added(answer: WriteAnswer): void {
        said(answer);
        if (answer.ok) onadding(false);
    }
</script>

{#if lines.length > 0 || adding}
    <div class="subtasks">
        <ListHead
            shown={lines.length > 0}
            label={t('project.action.subtasks')}
            count={t('project.action.n_open', open)}
            addLabel={t('project.action.add_subtask')}
            addTip={t('project.action.add_subtask_tip')}
            kind="subtask"
            {target}
            {blocked}
            {adding}
            {onadding}
            onadd={add}
            onanswer={added}
        />

        {#each lines as line (line.key)}
            {#if editing === line.key}
                <LineForm
                    text={line.do}
                    date={line.deadline}
                    dateLabel={t('project.action.subtask_deadline')}
                    people={line}
                    {root}
                    {blocked}
                    onsave={(text: string, due: string, people: LinePeopleFields) =>
                        save(line, text, due, people)}
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
                    {#if names(line) !== ''}
                        <span class="people">{names(line)}</span>
                    {/if}
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

    .line,
    .acts {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    /* A line is one row of the tree's height; a line that wraps grows by whole lines. */
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

    .box {
        color: var(--muted-txt, var(--muted));
    }

    .do {
        font-size: var(--fs-md);
        min-width: 0;
    }

    .people {
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .line.done .do {
        text-decoration: line-through;
        color: var(--muted-txt, var(--muted));
    }
</style>
