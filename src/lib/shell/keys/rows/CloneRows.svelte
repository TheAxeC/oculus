<script lang="ts">
    // Layer 3, partial of shell/keys/Palette.svelte. The rows of `:clone`: first the row that says
    // an address can be typed, or clones the address typed, then the repositories of the reader's
    // GitHub account that the words after the command narrow. A press on a repository closes the
    // palette and clones it into a folder the system's folder panel asks for; the clone store says
    // the outcome and asks what to do with the folder. An account that could not be listed says why
    // under the rows.

    import PaletteRow from '$lib/shell/keys/PaletteRow.svelte';
    import type { CloneList } from '$lib/shell/keys/rows/clone-list.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        clone: { cloneRepo }
    } = useState();

    type Props = {
        list: CloneList;
        onclose: () => void;
    };

    let { list, onclose }: Props = $props();
</script>

{#each list.rows as row (row.value)}
    <PaletteRow
        row={{
            value: row.value,
            kind: row.kind,
            label: row.label,
            hint: row.hint,
            pick: () => {
                if (row.repo === null) return;
                onclose();
                void cloneRepo(row.repo);
            }
        }}
    />
{/each}
{#if list.error !== ''}
    <p class="empty" data-palette-choices-empty>{t('app.palette.clone_error', list.error)}</p>
{:else if list.rows.length === 0}
    <p class="empty" data-palette-choices-empty>
        {list.loading ? t('app.palette.clone_loading') : t('app.palette.clone_none')}
    </p>
{/if}

<style>
    .empty {
        margin: 0;
        padding: 8px;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }
</style>
