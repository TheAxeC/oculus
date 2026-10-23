<script lang="ts">
    // Layer 3, shared view partial. The mark on a card, a row or a page that names a hub: a chip
    // with the name of the workspace folder the hub is served under. Every record carries its
    // hub's name in `root`, and a record's chip is drawn when its hub is another than the one in
    // view, the workspace's primary, so in a workspace with no primary every record shows its hub.
    // An account row of a `local.yml` passes its hub as `hub`, which is drawn whichever hub it is.
    // In a line that gives way the chip keeps its words while the title beside it is cut, up to
    // half the line, so a narrow pane never cuts the hub's name first.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import Tooltip from '$lib/ui/menu/Tooltip.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        /** The record the mark is for, drawn when its hub is not the one in view. */
        record?: { root?: string };
        /** A hub named for itself, drawn whichever hub it is. */
        hub?: string;
    };

    let { record, hub }: Props = $props();

    const {
        fs: { primary }
    } = useState();

    const root = $derived.by(() => {
        if (hub !== undefined) return hub;
        const own = record?.root ?? '';
        return own === (primary() ?? '') ? '' : own;
    });
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
