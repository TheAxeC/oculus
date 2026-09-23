<script lang="ts">
    // Layer 3, primitive. The question a close asks before it takes a tab, a pane or a page away:
    // the one confirm dialog with the close's own message and the catalog's yes and no. A pane's
    // tabs and the Pages view's rows ask it the same way, so both draw this rather than their own
    // Confirm. Nothing is drawn while the message is null, which is while there is nothing to ask.

    import Confirm from './Confirm.svelte';
    import { t } from '$lib/state/words/text';

    type Props = {
        /** What the close is about to take away, already translated, or null to ask nothing. */
        message: string | null;
        onconfirm: () => void;
        oncancel: () => void;
    };

    let { message, onconfirm, oncancel }: Props = $props();
</script>

{#if message !== null}
    <Confirm
        {message}
        confirm={t('ui.confirm_ok')}
        cancel={t('ui.confirm_cancel')}
        {onconfirm}
        {oncancel}
    />
{/if}
