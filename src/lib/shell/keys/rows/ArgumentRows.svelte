<script lang="ts">
    // Layer 3, partial of shell/keys/Palette.svelte. The rows of `:theme`, `:file-icons`, `:tab`
    // and `:goto`, as the `:language` list draws its own: every choice a row, the one in force
    // marked (lists/argument-list.svelte.ts). A press runs the command with the row's choice: it
    // writes the theme or the file icon theme through the Settings write path into the open
    // workspace file's `settings:`, opens the view in a tab, or opens the project, whose tab takes
    // the keyboard on its head once drawn.
    //
    // In `:theme` and `:file-icons` the choice under the selection is drawn as the selection moves,
    // through the UI store's preview, which nothing saves; leaving the list (Escape, closing the
    // palette, another query) draws the one in force again, and a press keeps the one chosen. A
    // file icon theme stays previewed until its write has answered, so the icons do not go back to
    // the old theme while the write is out, and a refused write draws the one in force again.
    //
    // The rows of `:theme` are drawn under a heading per group, the `group` of each theme row of
    // the config and the title of the app that offers an app's theme, in the order the Settings
    // view's choice draws them (`choiceGroups`), the rows with no group first. The list's rows come
    // in that order already (palette-modes.ts `argumentRows`), so the arrow keys move through them
    // as drawn; a group the typed words filter out whole has no row and draws no heading.

    import { Command } from 'bits-ui';
    import { onDestroy } from 'svelte';
    import PaletteRow from '$lib/shell/keys/PaletteRow.svelte';
    import { choiceGroups } from '$lib/ui/forms/choice/choices';
    import { landOn } from '$lib/shell/keys/palette-open';
    import type { ArgumentList } from '$lib/shell/keys/lists/argument-list.svelte';
    import type { ArgumentRow } from '$lib/shell/keys/palette-modes';
    import { NO_PREVIEW } from '$lib/state/workbench/ui.svelte';
    import { useState } from '$lib/state/client/use';
    import { recordState } from '$lib/state/workbench/layout';

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

    /** The rows split for drawing: the ones with no group, then each group under its heading. */
    const drawn = $derived(choiceGroups(list.rows));

    /** The row as PaletteRow draws it, a press picking its choice. */
    function shown(row: ArgumentRow) {
        return {
            value: row.value,
            kind: row.kind,
            label: row.label,
            hint: row.hint,
            active: row.active,
            pick: () => pick(row)
        };
    }

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
                    : openView('project', recordState(row.argument, row.hint), into);
            onclose();
            if (shown !== '') void landOn(shown);
        }
    }
</script>

{#each drawn.loose as row (row.value)}
    <PaletteRow row={shown(row)} />
{/each}
{#each drawn.groups as group (group.name)}
    <Command.Group value={`group:${group.name}`}>
        <Command.GroupHeading>
            {#snippet child({ props })}
                <div {...props} class="heading">{group.name}</div>
            {/snippet}
        </Command.GroupHeading>
        <Command.GroupItems>
            {#each group.choices as row (row.value)}
                <PaletteRow row={shown(row)} />
            {/each}
        </Command.GroupItems>
    </Command.Group>
{/each}

<style>
    /* A group's heading is a line of its words at the hint's size and colour over a rule across the
       list, as VS Code's Color Theme list draws its separators; it is no row, so the arrow keys
       pass over it and a press on it runs nothing. */
    .heading {
        margin-top: 4px;
        padding: 2px 6px 0;
        border-top: 1px solid var(--line);
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
        line-height: calc(var(--tree-row) * var(--text-scale, 1));
        text-align: right;
    }
</style>
