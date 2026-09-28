<script lang="ts">
    // Layer 3, primitive. The question a close asks before it takes a tab, a pane or a page away:
    // the one confirm dialog with the close's own message and the catalog's yes and no. A pane's
    // tabs, the Pages view's rows and a reset asking about each tab holding unsaved text ask it the
    // same way, so each draws this rather than its own Confirm; a reset's question carries a detail
    // line naming the tab and its page, since that tab may not be on screen. Nothing is drawn while
    // the message is null, which is while there is nothing to ask.

    import Confirm from './Confirm.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** What the close is about to take away, already translated, or null to ask nothing. */
        message: string | null;
        /** A line under the message, already translated; none when omitted. */
        detail?: string;
        onconfirm: () => void;
        oncancel: () => void;
    };

    let { message, detail = '', onconfirm, oncancel }: Props = $props();
</script>

{#if message !== null}
    <Confirm
        {message}
        {detail}
        confirm={t('ui.confirm_ok')}
        cancel={t('ui.confirm_cancel')}
        {onconfirm}
        {oncancel}
    />
{/if}
