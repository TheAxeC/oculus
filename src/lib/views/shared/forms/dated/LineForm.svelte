<script lang="ts">
    // Layer 3, view partial under views/shared/. The form that edits a line of a card's line
    // blocks in its row: what to do, a date, Save and Cancel on one row, and under it the line's
    // Lead, Supervisors and Collaborators (PeoplePicks.svelte). Subtasks.svelte beside it draws it
    // to edit a subtask with its deadline, and Followups.svelte to edit a follow-up note with the
    // date before which it stays off the Focus board; a new line is added through DatedForm.svelte.
    //
    // It holds what is typed and picked, starting from the line it edits, and hands all of it to
    // `onsave`; the block that draws it writes each field that changed and closes it. Save is
    // disabled while the text is empty, since a line is its text, and while the file cannot be
    // written, with `blocked`, the words saying why, as its title.

    import DateInput from '$lib/ui/forms/DateInput.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import PeoplePicks from './PeoplePicks.svelte';
    import type { LinePeopleFields } from '$lib/state/shared/stores/shapes';
    import { t } from '$lib/state/shared/words/text';
    import { untrack } from 'svelte';

    type Props = {
        /** The text of the line edited, and none for a new line. */
        text?: string;
        /** The date of the line edited, and none for a new line or one with no date. */
        date?: string;
        /** The words of the date field, already translated. */
        dateLabel: string;
        /** The people the line names, by field. */
        people?: LinePeopleFields;
        /** The name of the hub of the line's record, whose people the picks offer first. */
        root: string;
        /** Why Save is disabled, already translated; '' when it is not. */
        blocked?: string;
        onsave: (text: string, date: string, people: LinePeopleFields) => void;
        oncancel: () => void;
    };

    let {
        text = '',
        date = '',
        dateLabel,
        people = {},
        root,
        blocked = '',
        onsave,
        oncancel
    }: Props = $props();

    let typed = $state(untrack(() => text));
    let day = $state(untrack(() => date));
    let picked = $state<LinePeopleFields>(untrack(() => people));
</script>

<div class="form">
    <div class="row">
        <TextInput
            value={typed}
            label={t('project.action.subtask_do')}
            placeholder={t('project.action.subtask_do')}
            oninput={(next: string) => (typed = next)}
        />
        <DateInput value={day} label={dateLabel} oninput={(next: string) => (day = next)} />
        <ToolButton
            label={t('project.action.subtask_save')}
            title={blocked === '' ? undefined : blocked}
            disabled={blocked !== '' || typed.trim() === ''}
            onclick={() => onsave(typed.trim(), day, picked)}
        />
        <ToolButton label={t('project.action.subtask_cancel')} onclick={oncancel} />
    </div>
    <PeoplePicks {root} values={picked} onchange={(next: LinePeopleFields) => (picked = next)} />
</div>

<style>
    .form {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }
</style>
