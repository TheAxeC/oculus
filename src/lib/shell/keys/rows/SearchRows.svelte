<script lang="ts">
    // Layer 3, partial of shell/keys/Palette.svelte. The rows of the search mode: each result with
    // what it is in words, its title with the matched letters marked, and its hint and trail. An
    // app's command whose `enablement` fails is drawn and cannot be chosen.

    import PaletteRow from '$lib/shell/keys/PaletteRow.svelte';
    import { kindWord, type PaletteItem, type PaletteMatch } from '$lib/state/workbench/palette';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        matches: PaletteMatch[];
        onpick: (item: PaletteItem) => void;
    };

    let { matches, onpick }: Props = $props();
</script>

{#each matches as found (found.item.id)}
    <PaletteRow
        row={{
            value: found.item.id,
            kind: kindWord(found.item.kind, t),
            label: found.item.label,
            parts: found.title,
            hint: found.item.hint,
            trail: found.item.trail,
            disabled: found.item.disabled,
            pick: () => onpick(found.item)
        }}
    />
{/each}
