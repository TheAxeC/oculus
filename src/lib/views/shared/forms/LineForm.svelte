<script lang="ts">
    // Layer 3, view partial under views/shared/. The one-line form of a card's line blocks: what to
    // do, a date, Save and Cancel. views/shared/forms/Subtasks.svelte draws it to add and to edit a
    // subtask with its deadline, and views/shared/forms/Followups.svelte to add and to edit a
    // follow-up note with the date before which it stays off the Focus board.
    //
    // It holds what is typed, starting from the line it edits, and hands both to `onsave`; the
    // block that draws it writes them and closes it. Save is disabled while the text is empty,
    // since a line is its text, and while the file cannot be written, with `blocked`, the words
    // saying why, as its title.

    import DateInput from '$lib/ui/forms/DateInput.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { untrack } from 'svelte';

    type Props = {
        /** The text of the line edited, and none for a new line. */
        text?: string;
        /** The date of the line edited, and none for a new line or one with no date. */
        date?: string;
        /** The words of the date field, already translated. */
        dateLabel: string;
        /** Why Save is disabled, already translated; '' when it is not. */
        blocked?: string;
        onsave: (text: string, date: string) => void;
        oncancel: () => void;
    };

    let { text = '', date = '', dateLabel, blocked = '', onsave, oncancel }: Props = $props();

    let typed = $state(untrack(() => text));
    let day = $state(untrack(() => date));
</script>

<div class="form">
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
        onclick={() => onsave(typed.trim(), day)}
    />
    <ToolButton label={t('project.action.subtask_cancel')} onclick={oncancel} />
</div>

<style>
    .form {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }
</style>
