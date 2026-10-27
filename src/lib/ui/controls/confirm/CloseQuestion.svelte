<script lang="ts">
    // Layer 3, primitive. The question a close asks before it takes a tab, a pane or a page away:
    // the one confirm dialog with the close's own message and the catalog's yes and no. A pane's
    // tabs, the Pages view's rows and a reset asking about each tab holding unsaved text ask it the
    // same way, so each draws this rather than its own Confirm; a reset's question carries a detail
    // line naming the tab and its page, since that tab may not be on screen. A question over
    // unsaved text (`onsave` given) asks whether to save it, with VS Code's three answers in its
    // order: Don't Save, which goes ahead and loses the text (`onconfirm`), Cancel, and Save, which
    // holds the keyboard. Nothing is drawn while the message is null, which is while there is
    // nothing to ask.

    import Confirm from './Confirm.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** What the close is about to take away, already translated, or null to ask nothing. */
        message: string | null;
        /** A line under the message, already translated; none when omitted. */
        detail?: string;
        /** Go ahead with the close; over unsaved text, its Don't Save. */
        onconfirm: () => void;
        oncancel: () => void;
        /** Save the unsaved text first, for a question over it; none asks a plain yes or no. */
        onsave?: () => void;
    };

    let { message, detail = '', onconfirm, oncancel, onsave }: Props = $props();
</script>

{#if message !== null && onsave !== undefined}
    <Confirm
        {message}
        {detail}
        confirm={t('ui.confirm_save')}
        cancel={t('ui.confirm_cancel')}
        discard={t('ui.confirm_dont_save')}
        onconfirm={onsave}
        ondiscard={onconfirm}
        {oncancel}
    />
{:else if message !== null}
    <Confirm
        {message}
        {detail}
        confirm={t('ui.confirm_ok')}
        cancel={t('ui.confirm_cancel')}
        {onconfirm}
        {oncancel}
    />
{/if}
