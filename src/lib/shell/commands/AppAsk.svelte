<script lang="ts">
    // Layer 3, shell. The modal message an app's host or frame asks to show: the message with the
    // buttons the app offered, the first as the confirm and the rest beside it, and Cancel, which
    // answers nothing. A message with no buttons has OK. The dialog opens with the keyboard on
    // Cancel, as every question raised by something other than the reader does. Messages that are
    // not modal are notifications, which the requests store posts itself.

    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        appShell: { requests }
    } = useState();

    /** The message in front: the oldest one waiting, as the next one waits behind it. */
    const held = $derived(requests.modals().at(0));
</script>

{#if held !== undefined}
    {#key held.id}
        <Confirm
            message={held.message}
            confirm={held.items[0] ?? t('apps.message_ok')}
            others={held.items.slice(1)}
            cancel={t('ui.confirm_cancel')}
            focus="cancel"
            onconfirm={() => held.answer(held.items[0])}
            onother={(index: number) => held.answer(held.items[index + 1])}
            oncancel={() => held.answer(undefined)}
        />
    {/key}
{/if}
