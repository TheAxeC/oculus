<script lang="ts">
    // Layer 3, partial of shell/keys/Palette.svelte. The rows of the colon commands: each with its
    // argument hint after its name and what it does at the end of the row, an unavailable one drawn
    // and not run. Above them, a bare colon says which line the caret of the source tab on screen
    // is on and how many the file has. A press runs the command: the commands that list choices
    // type their name and a space, which opens their list; the others change the theme, the file
    // icon theme, the CRT overlay, the tabs or the folder shown, reopen the tabs closed last, walk
    // the navigation history back or forward (shell/titlebar/history-walk.ts), or hide or show the
    // floats docked at an edge, and close the palette. A tab a command showed takes the keyboard on
    // its head once the page has drawn it, since the tab chosen is where the reader went. A refusal
    // of Open Folder, of Close Workspace or of Add Task is said in the palette, which stays open.
    // Add Task writes the task and posts a notice with an Open action; Shift+Enter, or a press with
    // Shift held, opens the task's page as well.

    import { opensTaskPage } from '$lib/data/helpers/keys/oculus/palette-table';
    import PaletteRow from '$lib/shell/keys/PaletteRow.svelte';
    import { landOn } from '$lib/shell/keys/palette-open';
    import { addTask } from '$lib/state/forms/new-entry';
    import { pageView } from '$lib/state/forms/page-entry';
    import { fileIconThemeNamed, themeNamed } from '$lib/state/shared/words/appearance';
    import { opensAsMode } from '$lib/shell/keys/palette-modes';
    import {
        folderCommand,
        workspaceCommand,
        type PaletteCommand,
        type ParsedCommand
    } from '$lib/state/workbench/palette';
    import { registrationLabel } from '$lib/state/workbench/navigation/registry';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { useWalk } from '$lib/shell/titlebar/history-walk';

    const {
        explorer,
        fs: { closeWorkspace, primary },
        layout: { openView, reopenClosed, toggleDock },
        notices,
        selectors: { collectionsOfKey },
        writes: { newEntry },
        paletteSource: { paletteSource },
        ui: { setCrt, setFileIcons, setTheme, crt },
        registry: { views },
        appShell: { offers }
    } = useState();
    const history = useWalk();

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

    /** Whether Shift is held, which the press of Add Task is read against. */
    let shifted = false;

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

    /** Close Workspace: the open workspace file is left; a refusal is said in the palette. */
    async function closeWork(): Promise<void> {
        const result = await workspaceCommand(() => closeWorkspace(), '');
        if (result.closed) onclose();
        else onsaid(result.said);
    }

    /** Add Task: the task written, a notice that opens it, and its page when Shift is held. */
    async function addTaskTitled(title: string, open: boolean): Promise<void> {
        const added = await addTask(title, collectionsOfKey('tasks'), primary(), newEntry);
        if (added.said !== '') {
            onsaid(added.said);
            return;
        }
        const page = pageView('tasks', added.id, added.label);
        notices.post(t('app.palette.task_added', added.label), {
            actions: [
                {
                    label: t('app.palette.task_open'),
                    run: () => void openView(page.view, page.state)
                }
            ]
        });
        if (open) void landOn(openView(page.view, page.state));
        onclose();
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
        if (command.name === 'task-add') {
            void addTaskTitled(argument, shifted);
            return;
        }
        if (command.name === 'folder') {
            void openFolder();
            return;
        }
        if (command.name === 'workspace-close') {
            void closeWork();
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
        } else if (command.name === 'reopen-closed-tab') {
            void reopenClosed();
        } else if (command.name === 'go-back') {
            void history.back();
        } else if (command.name === 'go-forward') {
            void history.forward();
        } else if (command.name === 'toggle-left-dock') {
            toggleDock('left');
        } else if (command.name === 'toggle-bottom-dock') {
            toggleDock('bottom');
        } else if (command.name === 'toggle-right-dock') {
            toggleDock('right');
        }
        onclose();
        if (shown !== '') void landOn(shown);
    }
</script>

<svelte:window
    onkeydowncapture={(event: KeyboardEvent) => (shifted = opensTaskPage(event))}
    onkeyupcapture={(event: KeyboardEvent) => (shifted = opensTaskPage(event))}
/>

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
