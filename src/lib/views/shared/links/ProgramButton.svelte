<script lang="ts">
    // Layer 3, shared view support. The control that hands one file to its application on this
    // machine through api/open, addressed by root and path. The file view and the source tab draw
    // it in their bars, and the project card's file list and a collection card's link draw it as
    // the row itself, labelled with the file's name and the words in the tooltip.
    //
    // It is shared because the press is the same in all four: one POST, a refusal said in words,
    // and an answer a later press of the same control has superseded dropped, so a slow refusal
    // never lands over a later open. A caller with a message line of its own passes `onsaid` and
    // the words go there; any other shows them beside the control. The caller decides whether to
    // draw it, from `opensInProgram` over the configuration the page holds.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        root: string;
        path: string;
        /** The control's words, the file's name on a card; the catalog's words when left out. */
        label?: string;
        /** Where a refused or failed open is said, for a caller with a message line of its own. */
        onsaid?: (said: string) => void;
    };

    let { root, path, label, onsaid }: Props = $props();

    const {
        writes: { openFile }
    } = useState();

    /** What the last press was refused or failed with, shown beside the control. */
    let failed = $state('');

    /** The presses so far, so an answer a later press superseded is dropped. */
    let presses = 0;

    async function press(): Promise<void> {
        if (root === '' || path === '') return;
        presses += 1;
        const mine = presses;
        failed = '';
        const answer = await openFile(root, path);
        if (mine !== presses || answer.ok) return;
        const said = t('file.open_failed', answer.error ?? '');
        if (onsaid === undefined) failed = said;
        else onsaid(said);
    }
</script>

<ToolButton
    label={label ?? t('file.open_program')}
    glyph={t('file.open_program_glyph')}
    title={label === undefined ? undefined : t('file.open_program')}
    onclick={() => void press()}
/>

{#if failed !== ''}
    <span class="failed" aria-live="polite">{failed}</span>
{/if}

<style>
    .failed {
        color: var(--c-red-txt);
        font-size: var(--fs-sm);
    }
</style>
