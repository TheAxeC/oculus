<script lang="ts">
    // Layer 3, partial of shell/keys/Palette.svelte. The rows of the colon commands, as
    // shell/keys/palette-modes.ts `commandRows` matches them: each with its argument hint after its
    // name and what it does at the end of the row, the letters the typed words matched marked, an
    // unavailable one drawn and not run; and the views, by their label, a press opening the view in
    // a tab. Above them, a bare colon opened as Go to Line (the status bar's caret item) says which
    // line the caret of the source tab on screen is on and how many the file has. A press runs the
    // command: the commands that list choices type their name and a space, which opens their list,
    // as does a command that takes an argument when the row was matched rather than typed by its
    // name; the others change the theme, the file icon theme, the CRT overlay, the tabs or the
    // folder shown, add folders to the workspace, reopen the tabs closed last, walk the navigation
    // history back or forward (shell/titlebar/history-walk.ts), or hide or show the floats docked
    // at an edge, and close the palette. A tab a command showed takes the keyboard on its head once
    // the page has drawn it, since the tab chosen is where the reader went. Open Folder and Add
    // Folder to Workspace close the palette as the folder panel opens, and what is left to say of
    // them (a panel that did not open, a folder refused or a root already) is a notice; pressed
    // while the panel is open, they say so in the palette, which stays open. A refusal of Close
    // Workspace or of Add Task is said in the palette, which stays open, as is an argument of
    // `:tab`, `:goto`, `:theme` or `:file-icons` that is empty or names nothing. Add Task writes
    // the task and posts a notice with an Open action; Shift+Enter, or a press with Shift held,
    // opens the task's page as well. The commands that run at once, and the words of an
    // unavailable one, are shell/window/colon-effects.ts's, which the app menu's answer runs too.

    import { opensTaskPage } from '$lib/data/helpers/keys/oculus/palette-table';
    import PaletteRow from '$lib/shell/keys/PaletteRow.svelte';
    import { landOn } from '$lib/shell/keys/palette-open';
    import { addTask } from '$lib/state/forms/new-entry';
    import { pageView } from '$lib/state/forms/page-entry';
    import { fileIconThemeNamed, themeNamed } from '$lib/state/shared/words/appearance';
    import { commandRowValue, type CommandRow } from '$lib/shell/keys/palette-modes';
    import {
        argumentRefusal,
        type CommandOutcome,
        type PaletteCommand,
        type ParsedCommand
    } from '$lib/state/workbench/palette';
    import {
        colonEffects,
        dockEdgeOf,
        noteOf,
        opensAsMode,
        pressRefusal
    } from '$lib/shell/window/colon-effects';
    import { registrationLabel } from '$lib/state/workbench/navigation/registry';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { useWalk } from '$lib/shell/titlebar/history-walk';

    const client = useState();
    const {
        fs: { primary },
        layout: { openView, reopenClosed },
        notices,
        selectors: { collectionsOfKey },
        writes: { newEntry },
        paletteSource: { paletteSource },
        ui: { setFileIcons, setTheme },
        registry: { views },
        appShell: { offers },
        float
    } = client;
    const effects = colonEffects(client);
    /**
     * The page or float the palette opens views on: this window's float, else the reader's page.
     */
    const into = float ?? undefined;
    const history = useWalk();

    type Props = {
        parsed: ParsedCommand;
        list: CommandRow[];
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

    /**
     * A command that opens the folder panel: the palette closes as the panel opens, since the panel
     * takes the keyboard, and what is left to say once it answers is a notice.
     */
    function panelled(outcome: Promise<CommandOutcome>): void {
        onclose();
        void outcome.then((result) => {
            if (!result.closed) notices.post(result.said, { tone: 'warning' });
        });
    }

    /** Close the palette when a command went through; otherwise keep it open saying why. */
    async function settled(outcome: Promise<CommandOutcome>): Promise<void> {
        const result = await outcome;
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
                    run: () => void openView(page.view, page.state, into)
                }
            ]
        });
        if (open) void landOn(openView(page.view, page.state, into));
        onclose();
    }

    /** Open a view in a tab, which takes the keyboard on its head once drawn. */
    function openTab(id: string): void {
        const shown = openView(id, undefined, into);
        onclose();
        if (shown !== '') void landOn(shown);
    }

    /**
     * Run a command. `named` says the reader typed its whole name, whose words after it are its
     * argument; a command matched by its words is run with none.
     */
    function run(command: PaletteCommand, named: boolean): void {
        if (!command.available) {
            const refused = pressRefusal(command);
            if (refused !== null) onsaid(refused);
            return;
        }
        const argument = named ? parsed.argument : '';
        // The instance a command showed, when it showed a tab.
        let shown = '';
        if (opensAsMode(command.name) || (!named && command.hint !== '')) {
            ontype(`:${command.name} `);
            return;
        }
        if (command.name === 'task-add') {
            void addTaskTitled(argument, shifted);
            return;
        }
        if (command.name === 'folder') {
            panelled(effects.folder());
            return;
        }
        if (command.name === 'folder-add') {
            panelled(effects.folderAdd());
            return;
        }
        if (command.name === 'workspace-close') {
            void settled(effects.workspaceClose());
            return;
        }
        const project = current.snapshot?.entities.projects[argument];
        const refused = argumentRefusal(command, argument, {
            view: (id) => knownViews.some((view) => view.id === id),
            project: () => project !== undefined,
            theme: (name) => themeNamed(name, offers()) !== null,
            fileIcons: (name) => fileIconThemeNamed(name, offers()) !== null
        });
        if (refused !== '') {
            onsaid(refused);
            return;
        }
        if (command.name === 'theme') {
            setTheme(themeNamed(argument, offers()) ?? argument);
        } else if (command.name === 'crt') {
            effects.crt();
        } else if (command.name === 'file-icons') {
            void setFileIcons(fileIconThemeNamed(argument, offers()) ?? argument);
        } else if (command.name === 'tab') {
            openTab(argument);
            return;
        } else if (command.name === 'goto' && project !== undefined) {
            const state = { id: project.id, label: project.short ?? project.title };
            shown = openView('project', state, into);
        } else if (command.name === 'update') {
            onupdate();
        } else if (command.name === 'reopen-closed-tab') {
            void reopenClosed();
        } else if (command.name === 'go-back') {
            void history.back();
        } else if (command.name === 'go-forward') {
            void history.forward();
        } else {
            const edge = dockEdgeOf(command.name);
            if (edge !== null) effects.dock(edge);
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
{#snippet commandRow(row: CommandRow & { kind: 'command' })}
    {@const command = row.command}
    {@const hint = command.hint === '' ? '' : ` ${command.hint}`}
    <PaletteRow
        row={{
            value: commandRowValue(row),
            kind: ':',
            label: `${command.name}${hint}`,
            parts: [...row.name, ...(hint === '' ? [] : [{ text: hint, hit: false }])],
            hintParts: row.words,
            disabled: !command.available,
            note: command.available ? undefined : noteOf(command),
            pick: () => run(command, row.named)
        }}
    />
{/snippet}

{#each list as row (commandRowValue(row))}
    {#if row.kind === 'view'}
        <PaletteRow
            row={{
                value: commandRowValue(row),
                kind: ':',
                label: row.view.label,
                parts: row.label,
                hint: t('app.palette.kind_view'),
                pick: () => openTab(row.view.id)
            }}
        />
    {:else}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render commandRow(row)}
    {/if}
{/each}

<style>
    .empty {
        margin: 0;
        padding: 8px;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }
</style>
