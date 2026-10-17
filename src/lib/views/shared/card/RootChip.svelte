<script lang="ts">
    // Layer 3, shared view partial. The mark on a card, a row or a page of a record that names a
    // hub: a chip with the name of the workspace folder the record's hub is served under. A record
    // of the primary hub carries no `root`, so it draws nothing; an account row of a `local.yml`
    // names its hub whichever it is. In a line that gives way the chip keeps its words while the
    // title beside it is cut, up to half the line, so a narrow pane never cuts the hub's name
    // first.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import Tooltip from '$lib/ui/menu/Tooltip.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The record the mark is for. */
        record: { root?: string };
    };

    let { record }: Props = $props();

    const root = $derived(record.root ?? '');
</script>

{#if root !== ''}
    <span class="root-chip">
        <Tooltip text={t('hubs.root_tip', root)}>
            <Chip label={root} />
        </Tooltip>
    </span>
{/if}

<style>
    .root-chip {
        display: inline-flex;
        flex: 0 0 auto;
        min-width: 0;
        max-width: 50%;
    }
</style>
