<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The three questions a file operation
    // asks, in VS Code's words: whether to delete (moving to the Trash, with the unsaved-changes
    // detail when a tab holds text that is not saved), whether to delete for good once the Trash
    // failed, and whether to replace a name that is taken (an upload adds that the replaced file is
    // gone). It holds nothing of its own: the view that asked draws it while it has a question
    // and stops when the answer has come back.

    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { AskedQuestion } from './tree/row-ops';

    type Props = {
        question: AskedQuestion;
        /** Whether the question was confirmed. */
        onanswer: (confirmed: boolean) => void;
    };

    let { question, onanswer }: Props = $props();

    const message = $derived(
        question.kind === 'delete'
            ? question.folder
                ? t('files.delete_question_folder', question.name)
                : t('files.delete_question', question.name)
            : question.kind === 'permanent'
              ? t('files.permanent_question')
              : t('files.replace_question', question.name)
    );
    const detail = $derived(
        question.kind === 'delete'
            ? question.unsaved
                ? `${t('files.delete_detail')} ${t('files.delete_detail_unsaved')}`
                : t('files.delete_detail')
            : question.kind === 'permanent'
              ? t('files.permanent_detail')
              : question.upload === true
                ? t('files.replace_detail_upload')
                : ''
    );
    const confirm = $derived(
        question.kind === 'delete'
            ? t('files.delete_button')
            : question.kind === 'permanent'
              ? t('files.permanent_button')
              : t('files.replace_button')
    );
</script>

<Confirm
    {message}
    {detail}
    {confirm}
    cancel={t('ui.confirm_cancel')}
    onconfirm={() => onanswer(true)}
    oncancel={() => onanswer(false)}
/>
