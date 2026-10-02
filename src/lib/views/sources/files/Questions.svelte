<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The questions a file operation asks, in
    // VS Code's words (tree/menu/row-ops.ts's `askedWords`): whether to delete one row or several
    // (moving to the Trash, with the names listed and the unsaved-changes detail when a tab holds
    // text that is not saved), whether to move what a drag dropped, whether to undo a delete,
    // whether to delete for good once the Trash failed, and whether to replace a name that is
    // taken. The delete to the Trash carries the "Do not ask me again" box, whose state the answer
    // hands on. It holds nothing of its own: the view that asked draws it while it has a question
    // and stops when the answer has come back.

    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { askedWords, type AskedQuestion } from './tree/menu/row-ops';

    type Props = {
        question: AskedQuestion;
        /** Whether the question was confirmed, and whether its box was ticked. */
        onanswer: (confirmed: boolean, forget: boolean) => void;
    };

    let { question, onanswer }: Props = $props();

    const words = $derived(askedWords(question, t));
</script>

<Confirm
    message={words.message}
    detail={words.detail}
    confirm={words.confirm}
    cancel={t('ui.confirm_cancel')}
    option={words.forgettable ? t('files.forget_question') : ''}
    onconfirm={(checked: boolean) => onanswer(true, checked)}
    oncancel={() => onanswer(false, false)}
/>
