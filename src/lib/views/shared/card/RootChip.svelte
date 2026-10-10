<script lang="ts">
    // Layer 3, shared view partial. The mark on a card, a row or a page of a record that is not of
    // the first hub: a chip with the key of the root the record's hub is served under. A record of
    // the first hub, and every record of a portfolio of one hub, draws nothing.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import Tooltip from '$lib/ui/menu/Tooltip.svelte';
    import { HUB_ROOT, rootOf } from '$lib/state/shared/page/hubs';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The record the mark is for. */
        record: { root?: string };
    };

    let { record }: Props = $props();

    const root = $derived(rootOf(record));
</script>

{#if root !== HUB_ROOT}
    <Tooltip text={t('hubs.root_tip', root)}>
        <Chip label={root} />
    </Tooltip>
{/if}
