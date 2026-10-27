<script lang="ts">
    // Layer 3, view partial under views/shared/. The form that adds a dated line to a record or
    // changes its deadline: a rule above it, a heading, and each control under its own visible
    // label (ui/forms/Field.svelte). A follow-up asks "What" and "Not before", a subtask "What" and
    // "Deadline", each then Lead, Supervisors and Collaborators (PeoplePicks.svelte, the people of
    // the hub `root` first), and a deadline only "Deadline", in a date box for a field of `type:
    // date` and a project's `deadline:`, and in a text box for a field of another type. The
    // deadline form is headed "New deadline" for a record with none and "Change deadline" for one
    // that has one, and its box starts with the record's deadline, so an emptied box clears it.
    //
    // views/shared/forms/dated/ListHead.svelte draws it to add a line to either list, the record
    // card (views/shared/card/record/RecordCard.svelte) to change a deadline, and
    // views/shared/forms/dated/RecordPick.svelte under its two dropdowns. It holds what is typed
    // and hands it to `save`; the part that draws it writes it and is told the answer through
    // `onanswer`. An answer that arrives after the form was taken off the page or after `record`
    // changed is dropped, so a save that lands late changes nothing on screen. Save is disabled
    // while a line's text is empty, while a deadline holds what the record has, while a save is
    // under way, and while the file cannot be written, with `blocked`, the words saying why, as its
    // title.

    import { onDestroy, untrack } from 'svelte';
    import DateInput from '$lib/ui/forms/DateInput.svelte';
    import Field from '$lib/ui/forms/Field.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import PeoplePicks from './PeoplePicks.svelte';
    import type { WriteAnswer } from '$lib/state/client/writes.svelte';
    import type { LinePeopleFields } from '$lib/state/shared/stores/shapes';
    import { t } from '$lib/state/shared/words/text';
    import type { DatedKind } from '../../card/record/record-menu';

    type Props = {
        kind: DatedKind;
        /** The record the form writes to, by any key that changes when the record does. */
        record: string;
        /** The text a new line starts with: the subject of the thread it comes from, or none. */
        text?: string;
        /** The deadline the record has, which a deadline form starts with and is headed by. */
        held?: string;
        /** The deadline field's type: a date box for `date`, a text box for another. */
        type?: 'date' | 'text';
        /** Why Save is disabled, already translated; '' when it is not. */
        blocked?: string;
        /** The name of the hub of the record, whose people the picks offer first. */
        root?: string;
        /**
         * Write what the form holds: the line's text, and its date or the deadline, and the people
         * a new line names.
         */
        save: (text: string, date: string, people: LinePeopleFields) => Promise<WriteAnswer>;
        /** The answer of a save, while the form is drawn for the record it was made for. */
        onanswer: (answer: WriteAnswer) => void;
        oncancel: () => void;
    };

    let {
        kind,
        record,
        text = '',
        held = '',
        type = 'date',
        blocked = '',
        root = '',
        save,
        onanswer,
        oncancel
    }: Props = $props();

    let typed = $state(untrack(() => text));
    let day = $state(untrack(() => (kind === 'deadline' ? held : '')));
    let people = $state<LinePeopleFields>({});
    /** True while a save is under way, so a second press writes nothing more. */
    let saving = $state(false);

    /** Whether the form is on the page, which the answer of a save is told to. */
    let drawn = true;
    onDestroy(() => {
        drawn = false;
    });

    const heading = $derived.by(() => {
        if (kind === 'followup') return t('project.action.new_followup');
        if (kind === 'subtask') return t('project.action.new_subtask');
        return held === '' ? t('project.action.new_deadline') : t('project.action.change_deadline');
    });

    const dateLabel = $derived(
        kind === 'followup' ? t('project.action.not_before') : t('project.action.deadline')
    );

    const empty = $derived(kind === 'deadline' ? day.trim() === held.trim() : typed.trim() === '');

    async function press(): Promise<void> {
        if (saving) return;
        saving = true;
        const sent = record;
        try {
            const answer = await save(typed.trim(), day.trim(), kind === 'deadline' ? {} : people);
            if (drawn && sent === record) onanswer(answer);
        } finally {
            saving = false;
        }
    }
</script>

<div class="form">
    <span class="heading">{heading}</span>
    {#if kind !== 'deadline'}
        <Field label={t('project.action.what')}>
            <TextInput
                value={typed}
                label={t('project.action.what')}
                oninput={(next: string) => (typed = next)}
            />
        </Field>
    {/if}
    <Field label={dateLabel}>
        {#if kind === 'deadline' && type === 'text'}
            <TextInput value={day} label={dateLabel} oninput={(next: string) => (day = next)} />
        {:else}
            <DateInput value={day} label={dateLabel} oninput={(next: string) => (day = next)} />
        {/if}
    </Field>
    {#if kind !== 'deadline'}
        <PeoplePicks
            {root}
            values={people}
            onchange={(next: LinePeopleFields) => (people = next)}
        />
    {/if}
    <div class="buttons">
        <ToolButton
            label={t('project.action.subtask_save')}
            title={blocked === '' ? undefined : blocked}
            disabled={blocked !== '' || empty || saving}
            onclick={press}
        />
        <ToolButton label={t('project.action.subtask_cancel')} onclick={oncancel} />
    </div>
</div>

<style>
    /* The rule above the form sets it apart from the lines and the fields over it. */
    .form {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-top: 8px;
        padding-top: 6px;
        border-top: 1px solid var(--line);
    }

    .heading {
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    .buttons {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }
</style>
