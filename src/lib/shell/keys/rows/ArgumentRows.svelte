<script lang="ts">
    // Layer 3, partial of shell/keys/Palette.svelte. The rows of `:theme`, `:file-icons`, `:tab`
    // and `:goto`, as the `:language` list draws its own: every choice a row, the one in force
    // marked (lists/argument-list.svelte.ts). A press runs the command with the row's choice: it
    // switches the theme, writes the file icon theme to config/appearance.yml, opens the view in a
    // tab, or opens the project, whose tab takes the keyboard on its head once drawn.
    //
    // In `:theme` and `:file-icons` the choice under the selection is drawn as the selection moves,
    // through the UI store's preview, which nothing saves; leaving the list (Escape, closing the
    // palette, another query) draws the one in force again, and a press keeps the one chosen. A
    // file icon theme stays previewed until its write has answered, so the icons do not go back to
    // the old theme while the write is out, and a refused write draws the one in force again.

    import { onDestroy } from 'svelte';
    import PaletteRow from '$lib/shell/keys/PaletteRow.svelte';
    import { landOn } from '$lib/shell/keys/palette-open';
    import type { ArgumentList } from '$lib/shell/keys/lists/argument-list.svelte';
    import type { ArgumentRow } from '$lib/shell/keys/palette-modes';
    import { NO_PREVIEW } from '$lib/state/workbench/ui.svelte';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        layout: { openView },
        ui: { setFileIcons, setPreview, setTheme },
        float
    } = client;
    /** Where the palette opens views: this window's float, else the reader's page. */
    const into = float ?? undefined;

    type Props = {
        list: ArgumentList;
        /** The value of the row the list's selection is on. */
        selected: string;
        onclose: () => void;
    };

    let { list, selected, onclose }: Props = $props();

    /** Whether a press kept a file icon theme whose write is out, which leaving does not undo. */
    let kept = false;

    const under = $derived(list.rows.find((row) => row.value === selected) ?? null);

    // The theme or the file icon theme under the selection is drawn while the list shows.
    $effect(() => {
        if (list.command === 'theme') {
            setPreview({ theme: under?.argument ?? null, fileIcons: null });
        } else if (list.command === 'file-icons') {
            setPreview({ theme: null, fileIcons: under?.argument ?? null });
        } else {
            setPreview(NO_PREVIEW);
        }
    });

    onDestroy(() => {
        if (!kept) setPreview(NO_PREVIEW);
    });

    /** Run the list's command with the row's choice and close the palette. */
    function pick(row: ArgumentRow): void {
        if (list.command === 'theme') {
            setTheme(row.argument);
            setPreview(NO_PREVIEW);
            onclose();
        } else if (list.command === 'file-icons') {
            kept = true;
            onclose();
            void setFileIcons(row.argument).finally(() => setPreview(NO_PREVIEW));
        } else {
            const shown =
                list.command === 'tab'
                    ? openView(row.argument, undefined, into)
                    : openView('project', { id: row.argument, label: row.hint }, into);
            onclose();
            if (shown !== '') void landOn(shown);
        }
    }
</script>

{#each list.rows as row (row.value)}
    <PaletteRow
        row={{
            value: row.value,
            kind: row.kind,
            label: row.label,
            hint: row.hint,
            active: row.active,
            pick: () => pick(row)
        }}
    />
{/each}
