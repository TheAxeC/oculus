<script lang="ts">
    // Layer 3, shell. What a project command puts over the page: the one question it waits on, the
    // lines of the chain a press would run, one for each command in run order, when the reader has
    // not approved that chain, with Approve and Run, or the process a Restart would stop, with
    // Restart; and the form that saves a command. A button on a card, a menu item and a default
    // key all ask through the commands store, so the question is drawn here once whichever of them
    // started the run. A yes or a no is handed back to the store, which approves and runs,
    // restarts, or drops the question. The form is opened and closed through the store too, so it
    // stands on the modal ground and not inside the view that opened it.

    import Confirm from '$lib/ui/controls/confirm/Confirm.svelte';
    import CommandForm from './CommandForm.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        commands: { answer, asking, closeForm, forming }
    } = useState();

    const held = $derived(asking());
    const open = $derived(forming());

    /** A line of the chain, worded as the line and, when it is not the repository's, its folder. */
    function worded(line: { folder: string; run: string }): string {
        return line.folder === '.' ? line.run : t('commands.approve_in', line.run, line.folder);
    }
</script>

{#if held?.kind === 'approve'}
    <Confirm
        message={t('commands.approve_ask', held.name)}
        detail={held.lines.map(worded).join('\n')}
        confirm={t('commands.approve_yes')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => void answer(true)}
        oncancel={() => void answer(false)}
    />
{:else if held?.kind === 'restart'}
    <Confirm
        message={t('commands.restart_ask', held.process)}
        confirm={t('commands.restart')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={() => void answer(true)}
        oncancel={() => void answer(false)}
    />
{/if}

{#if open !== null}
    <CommandForm repo={open.repo} edit={open.edit} onclose={closeForm} />
{/if}
