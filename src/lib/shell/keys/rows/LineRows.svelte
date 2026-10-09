<script lang="ts">
    // Layer 3, partial of shell/keys/Palette.svelte. The row of a go-to-line query (a colon and a
    // number): one row that sends the source tab on screen to that line, as VS Code's quick input
    // does, and the sentence that says there is no tab with a caret to send when none is on screen.

    import PaletteRow from '$lib/shell/keys/PaletteRow.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        editorStatus: { ask }
    } = useState();

    type Props = {
        line: number;
        /** The source tab on screen when it draws a caret, else null. */
        instance: string | null;
        onclose: () => void;
    };

    let { line, instance, onclose }: Props = $props();

    /** Send the source tab on screen to the line and close the palette. */
    function go(): void {
        if (instance === null) return;
        ask(instance, { kind: 'goto', line });
        onclose();
    }
</script>

{#if instance !== null}
    <PaletteRow
        row={{
            value: 'line',
            kind: t('statusbar.palette_kind_line'),
            label: t('statusbar.palette_line', line),
            pick: go
        }}
    />
{:else}
    <p class="empty">{t('statusbar.palette_line_none')}</p>
{/if}

<style>
    .empty {
        margin: 0;
        padding: 8px;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }
</style>
