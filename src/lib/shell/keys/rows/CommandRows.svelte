<script lang="ts">
    // Layer 3, partial of shell/keys/Palette.svelte. The rows of the colon commands: each with its
    // argument hint after its name and what it does at the end of the row, an unavailable one drawn
    // and not run. Above them, a bare colon says which line the caret of the source tab on screen
    // is on and how many the file has. A press runs the command: the commands that list choices
    // type their name and a space, which opens their list; the others change the theme, the file
    // icon theme, the CRT overlay, the tabs or the folder shown, and close the palette. A tab a
    // command showed takes the keyboard on its head once the page has drawn it, since the tab
    // chosen is where the reader went. A refusal of Open Folder is said in the palette, which stays
    // open.

    import PaletteRow from '$lib/shell/keys/PaletteRow.svelte';
    import { landOn } from '$lib/shell/keys/palette-open';
    import { fileIconThemeNamed, themeNamed } from '$lib/state/shared/words/appearance';
    import { opensAsMode } from '$lib/shell/keys/palette-modes';
    import {
        folderCommand,
        type PaletteCommand,
        type ParsedCommand
    } from '$lib/state/workbench/palette';
    import { registrationLabel } from '$lib/state/workbench/navigation/registry';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        explorer,
        layout: { openView },
        paletteSource: { paletteSource },
        ui: { setCrt, setFileIcons, setTheme, crt },
        registry: { views },
        appShell: { offers }
    } = useState();

    type Props = {
        parsed: ParsedCommand;
        list: PaletteCommand[];
        /** The caret of the source tab on screen and the lines of its file, or null with none. */
        caret: { line: number; column: number; lines: number } | null;
        onclose: () => void;
        onupdate: () => void;
        /** Replace the query, as choosing a command that opens a list does. */
        ontype: (text: string) => void;
        onsaid: (words: string) => void;
    };

    let { parsed, list, caret, onclose, onupdate, ontype, onsaid }: Props = $props();

    const current = $derived(paletteSource());
    const knownViews = $derived(
        views().map((view) => ({ id: view.id, label: registrationLabel(view) }))
    );

    /** Open Folder: the folder panel, then the folder shown; a panel that did not open is said. */
    async function openFolder(): Promise<void> {
        const result = await folderCommand(explorer.openFolder);
        if (result.closed) onclose();
        else onsaid(result.said);
    }

    function run(command: PaletteCommand): void {
        if (!command.available) return;
        const argument = parsed.argument;
        // The instance a command showed, when it showed a tab.
        let shown = '';
        if (opensAsMode(command.name)) {
            ontype(`:${command.name} `);
            return;
        }
        if (command.name === 'folder') {
            void openFolder();
            return;
        }
        if (command.name === 'theme') {
            const name = themeNamed(argument, offers());
            if (name !== null) setTheme(name);
        } else if (command.name === 'crt') {
            setCrt(!crt());
        } else if (command.name === 'file-icons') {
            const name = fileIconThemeNamed(argument, offers());
            if (name !== null) void setFileIcons(name);
        } else if (command.name === 'tab') {
            if (knownViews.some((view) => view.id === argument)) shown = openView(argument);
        } else if (command.name === 'goto') {
            const held = current.snapshot?.entities;
            const project = held?.projects[argument];
            if (project !== undefined) {
                shown = openView('project', {
                    id: project.id,
                    label: project.short ?? project.title
                });
            }
        } else if (command.name === 'update') {
            onupdate();
        }
        onclose();
        if (shown !== '') void landOn(shown);
    }
</script>

{#if parsed.name === '' && caret !== null}
    <p class="empty" data-line-hint>
        {t('statusbar.palette_line_hint', caret.line, caret.column, caret.lines)}
    </p>
{/if}
{#each list as command (command.name)}
    <PaletteRow
        row={{
            value: `command:${command.name}`,
            kind: ':',
            label: `${command.name}${command.hint === '' ? '' : ` ${command.hint}`}`,
            hint: command.description,
            disabled: !command.available,
            note: command.available ? undefined : t('app.palette_unavailable'),
            pick: () => run(command)
        }}
    />
{/each}

<style>
    .empty {
        margin: 0;
        padding: 8px;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }
</style>
