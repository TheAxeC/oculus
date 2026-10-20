<script lang="ts">
    // Layer 3, view partial. The disclosure line above a part of a Settings row that may be folded
    // (state/system/config/view/fold.ts): the editor of the row's entries, or its Fields list. The
    // line (ui/tree/row/FoldLine.svelte) holds a chevron, the title and the number of entries or
    // fields; a press, or Enter or Space on it, folds or unfolds the part, and the line names the
    // part it shows in `aria-controls` and says whether it is shown in `aria-expanded`. A folded
    // part draws nothing of its body; the row's Modified bar, gear, message lines and default line
    // are the row's own (settings/Item.svelte) and stay drawn.
    //
    // The fold is kept in the tab's instance state under the row and part. A query found inside the
    // part unfolds it while the query stands (`searched`), and a press then keeps the fold the
    // reader asked for, which shows once the query is cleared.

    import type { Snippet } from 'svelte';
    import FoldLine from '$lib/ui/tree/row/FoldLine.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { isFolded, withFold, type FoldPart } from '$lib/state/system/config/view/fold';
    import { useState } from '$lib/state/client/use';

    const {
        ui: { instanceState, setInstanceState }
    } = useState();

    type Props = {
        /** The Settings tab's instance id, whose state keeps the fold. */
        id: string;
        /** The row's id. */
        row: string;
        part: FoldPart;
        title: string;
        /** How many entries or fields the part holds. */
        count: number;
        /** Whether the query stands and is found inside the part. */
        searched: boolean;
        children: Snippet;
    };

    let { id, row, part, title, count, searched, children }: Props = $props();

    const folded = $derived(isFolded(instanceState(id), row, part, count, searched));

    /** The id of the part's body, which the line names. */
    const body = $derived(`fold-${id}-${part}-${row}`);

    const counted = $derived(
        part === 'fields'
            ? count === 1
                ? t('settings.fold_field')
                : t('settings.fold_fields', count)
            : count === 1
              ? t('settings.fold_entry')
              : t('settings.fold_entries', count)
    );

    function press(): void {
        setInstanceState(id, withFold(instanceState(id), row, part, !folded));
    }
</script>

<div class="fold" data-fold={part} data-folded={folded ? '' : undefined}>
    <FoldLine {title} count={counted} expanded={!folded} controls={body} onclick={press} />
    <div id={body} class="body">
        {#if !folded}
            {@render children()}
        {/if}
    </div>
</div>

<style>
    .fold {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }

    /* A folded body holds nothing and takes no room under the line. */
    .fold[data-folded] .body {
        display: none;
    }
</style>
