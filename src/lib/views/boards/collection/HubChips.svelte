<script lang="ts">
    // Layer 3, view partial of views/boards/collection/Collection.svelte. The Hub chips of a
    // collection's bar, after the Role chips: one chip per hub of the workspace, with its name and
    // the number of the collection's entries of that hub, pressed while the hub's entries are
    // shown. Every chip is pressed at the start, and a press hides or shows that hub's entries, a
    // record's hub being its `root`. The view draws it only while the workspace has more than one
    // hub.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import { rootOf } from '$lib/state/shared/page/hubs';
    import { toggled } from '$lib/state/shared/lists/lists';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The hubs of the workspace, the primary first. */
        hubs: readonly string[];
        /** Every entry of the collection, which the chips count by hub. */
        entries: readonly { root?: string }[];
        /** The hubs whose entries are hidden. */
        off: readonly string[];
        /** Keep the hubs whose entries are hidden after a press. */
        onchange: (off: string[]) => void;
    };

    let { hubs, entries, off, onchange }: Props = $props();

    /** Each hub with the number of the collection's entries of it. */
    const counted = $derived(
        hubs.map((name) => ({
            name,
            count: entries.filter((entry) => rootOf(entry) === name).length
        }))
    );

    /** Hide one hub's entries, or show them again. */
    function toggle(hub: string): void {
        onchange(toggled(off, hub));
    }
</script>

<span class="label">{t('collection.hub_facet')}</span>
{#each counted as hub (hub.name)}
    <Chip
        label={`${hub.name} ${hub.count}`}
        title={t('collection.hub_tip', hub.name)}
        pressed={!off.includes(hub.name)}
        onclick={() => toggle(hub.name)}
    />
{/each}

<style>
    /* The run's name, as the bar's other runs draw theirs (Collection.svelte `.label`). */
    .label {
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }
</style>
