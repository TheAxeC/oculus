<script lang="ts">
    // Layer 3, view partial under views/shared/. The follow-up block of one card: one row per note
    // of the host's `followup:` list with what it says and the date before which it stays off the
    // Focus board, the buttons that change it or take it out once done, and the one-line form that
    // adds another (views/shared/forms/dated/LineForm.svelte). A note's edit button turns the note
    // into the same form, holding its text and date, and its save writes each of the two that
    // changed.
    //
    // A card with no notes draws no block at all: adding its first note is one of the card's own
    // actions, which opens the add form here with no heading over it. So whether the add form is
    // open is the card's, handed in, since the card's action and this block's own add control both
    // open it. A project card on a board hands `formOnly`, and the block then draws that form
    // alone, with no head and no note; on the project page it draws the whole list with its form.
    //
    // Two views draw it, as they draw views/shared/forms/dated/Subtasks.svelte:
    // views/shared/card/project/ProjectCard.svelte with the `{ id }` of one manifest, and
    // views/shared/forms/entry/card/EntryCard.svelte with the `{ id, collection }` of one entry.
    //
    // Every button is one call of the write path (state/client/writes.svelte.ts) and nothing else:
    // the note the reader sees change is the watcher's next push of the portfolio, which is why
    // nothing here edits what it was handed.
    //
    // A card whose file has unsaved text in a source tab hands `blocked`, the words saying so:
    // every button that writes the file is drawn disabled with them as its title.
    //
    // A web address written in a note is a link (ui/display/text/LinkedText.svelte).

    import Tag from '$lib/ui/controls/Tag.svelte';
    import LinkedText from '$lib/ui/display/text/LinkedText.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import LineForm from './LineForm.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type {
        FollowupAction,
        SubtaskTarget,
        WriteAnswer
    } from '$lib/state/client/writes.svelte';
    import { answerWords } from '../answer-words';
    import ListHead from './ListHead.svelte';
    import type { Followup } from '$lib/state/boards/collection';
    import { useState } from '$lib/state/client/use';
    import { daysUntil } from '$lib/state/boards/board';

    const {
        writes: { addFollowup, writeFollowup }
    } = useState();

    type Props = {
        /** What the notes hang under: one project by its id, or one entry of one collection. */
        target: SubtaskTarget;
        notes: Followup[];
        /** What a write answered, for the one outcome line the card holds. */
        onsaid: (said: string) => void;
        /** True while the add form is open. */
        adding: boolean;
        /** Open or close the add form. */
        onadding: (next: boolean) => void;
        /** Why the buttons that write are disabled, already translated; '' when they are not. */
        blocked?: string;
        /**
         * Draw the add form alone, with no head and no note of the list: a card on a board, whose
         * Add Follow-up opens the form under the card's other lines.
         */
        formOnly?: boolean;
    };

    let {
        target,
        notes,
        onsaid,
        adding,
        onadding,
        blocked = '',
        formOnly = false
    }: Props = $props();

    /** The notes the block draws: none when it draws the add form alone. */
    const lines = $derived(formOnly ? [] : notes);

    /**
     * Whether a note is still off the Focus board: its date lies after the reader's today, the
     * test the board itself makes (state/boards/board/ticker-lines.ts `dueFollowups`).
     */
    function waiting(note: Followup): boolean {
        const days = note.after === undefined ? null : daysUntil(note.after, Date.now());
        return days !== null && days > 0;
    }

    /** A button's own words, or the words saying why it is disabled. */
    function why(own?: string): string | undefined {
        return blocked === '' ? own : blocked;
    }

    /** The key of the note being edited; null while no note is. */
    let editing = $state<string | null>(null);

    function said(answer: WriteAnswer): void {
        onsaid(answerWords(answer));
    }

    /**
     * The edit form's save: the text, then the date, each written only when it changed, and the
     * form closed when every write it made was taken. An emptied date clears it.
     */
    async function save(note: Followup, text: string, after: string): Promise<void> {
        const writes: [FollowupAction, string][] = [];
        if (text !== note.do) writes.push(['do', text]);
        if (after !== (note.after ?? '')) writes.push(['after', after]);
        for (const [action, value] of writes) {
            const answer = await writeFollowup(target, note.key, action, value);
            said(answer);
            if (!answer.ok) return;
        }
        editing = null;
    }

    /** The add form's save: one note, with its date when the form was given one. */
    async function add(text: string, after: string): Promise<void> {
        const fields = after === '' ? { do: text } : { do: text, after };
        const answer = await addFollowup(target, fields);
        said(answer);
        if (answer.ok) onadding(false);
    }
</script>

{#if lines.length > 0 || adding}
    <div class="followups">
        <ListHead
            shown={lines.length > 0}
            label={t('project.action.followups')}
            addLabel={t('project.action.add_followup')}
            addTip={t('project.action.add_followup_tip')}
            dateLabel={t('project.action.followup_after')}
            {blocked}
            {adding}
            {onadding}
            onadd={add}
        />

        {#each lines as note (note.key)}
            {#if editing === note.key}
                <LineForm
                    text={note.do}
                    date={note.after}
                    dateLabel={t('project.action.followup_after')}
                    {blocked}
                    onsave={(text: string, after: string) => save(note, text, after)}
                    oncancel={() => (editing = null)}
                />
            {:else}
                <div class="line">
                    <span class="mark">
                        <Glyph name={t('project.action.add_followup_glyph')} />
                    </span>
                    <span class="do"><LinkedText text={note.do} /></span>
                    {#if note.after !== undefined && waiting(note)}
                        <Tag label={t('project.card.not_until', note.after)} />
                    {/if}
                    <span class="acts">
                        <ToolButton
                            small
                            label={t('project.action.done')}
                            title={why(t('project.action.followup_done_tip'))}
                            disabled={blocked !== ''}
                            onclick={async () =>
                                said(await writeFollowup(target, note.key, 'done'))}
                        />
                        <ToolButton
                            small
                            label={t('project.action.edit')}
                            title={why(t('project.action.edit_followup'))}
                            disabled={blocked !== ''}
                            onclick={() => (editing = note.key)}
                        />
                    </span>
                </div>
            {/if}
        {/each}
    </div>
{/if}

<style>
    .followups {
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

    .mark {
        color: var(--muted-txt, var(--muted));
    }

    .do {
        font-size: var(--fs-md);
        min-width: 0;
    }
</style>
