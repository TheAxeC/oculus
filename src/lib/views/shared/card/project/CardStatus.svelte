<script lang="ts">
    // Layer 3, shared view. The status marks of a project card: a research project's chips, each in
    // the hue of its status, and a side project's one status in the words and hue of
    // `side_project_status`, with the flames its priority draws. A side project's item carries its
    // status; a research project's carries none and is drawn from its chips.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import type { BoardItem } from '$lib/state/boards/board';
    import { flamesOf } from '$lib/state/boards/focus';
    import { t } from '$lib/state/shared/words/text';
    import { chipGlyphName, chipLabel, statusTone } from '$lib/state/shared/words/tones';
    import { useState } from '$lib/state/client/use';

    const {
        selectors: { configMap }
    } = useState();

    type Props = {
        /** The joined board item whose status is drawn. */
        item: BoardItem;
    };
    let { item }: Props = $props();

    const flames = $derived(
        item.sideStatus === undefined ? 0 : flamesOf(item.project, configMap())
    );
</script>

{#if item.sideStatus !== undefined}
    {#if flames > 0}
        <span class="flames" title={item.project.priority}>
            {#each { length: flames } as _, at (at)}
                <Glyph name={t('focus.fire_glyph')} />
            {/each}
        </span>
    {/if}
    <Chip label={item.sideStatus.label} glyph={item.sideStatus.glyph} tone={item.sideStatus.tone} />
{:else}
    {#each item.chips as chip (chip)}
        <Chip label={chipLabel(chip)} glyph={chipGlyphName(chip)} tone={statusTone(chip)} />
    {/each}
{/if}

<style>
    .flames {
        display: inline-flex;
        flex: 0 0 auto;
        line-height: 1;
    }
</style>
