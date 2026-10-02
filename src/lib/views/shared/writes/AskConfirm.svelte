<script lang="ts">
    // Layer 3, shared view partial. The one confirm a view asks before a write that loses work or
    // reaches past the page: ui/controls/Confirm.svelte with the page's own words for its yes and
    // its cancel, drawn while the view holds a question. A yes closes it first and then runs what
    // the question was about, so a write that asks again opens a fresh one.

    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { Ask } from './ask';

    type Props = {
        /** The question held, or null while none is. */
        asking: Ask | null;
        /** Let the question go, which a yes and a cancel both do. */
        onclose: () => void;
    };

    let { asking, onclose }: Props = $props();

    function answered(): void {
        const held = asking;
        onclose();
        held?.act();
    }
</script>

{#if asking !== null}
    <Confirm
        message={asking.message}
        detail={asking.detail}
        confirm={t('ui.confirm_ok')}
        cancel={t('ui.confirm_cancel')}
        onconfirm={answered}
        oncancel={onclose}
    />
{/if}
