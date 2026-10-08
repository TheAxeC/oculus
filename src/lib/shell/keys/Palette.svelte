<script lang="ts">
    // Layer 3, shell. The Cmd-K overlay over the workbench, on the modal ground
    // ui/frame/Modal.svelte draws, its list bits-ui's Command. It builds a fresh pure index
    // whenever it opens, then either matches the query fuzzily or lists the colon commands, each
    // with its argument hint after its name and what it does at the end of the row;
    // choosing a result changes layout or appearance state and never mounts a view of its own.
    // Every row is one grid line: what it is in words, then the control that opens it filling the
    // rest, its matched letters marked.
    //
    // The selection, ArrowUp and ArrowDown, Home and End, Enter and the row a screen reader is told
    // is selected are the Command's; each query starts the selection on its first row. The rows sit
    // in the Command's viewport, the one part the Command reads the selected row's id from to name
    // it on the input as its active descendant, so the list and the viewport are one box. The focus
    // moves to the input when it opens and stays inside the palette; Escape and a press on the
    // ground beside it close it; a result that shows a tab takes the keyboard on that tab's head.
    //
    // It is also the quick input of the source tab on screen, as VS Code's is of the active editor:
    // a colon and a number goes to that line, a colon alone says which line the caret is on and how
    // many there are, and `:language` lists every language the highlighter paints, the words after
    // it narrowing the list, under VS Code's three entries above them (rows/LanguageRows.svelte:
    // Auto Detect, the file association, the language's settings). Both are asked of the tab
    // through the editor status store, and with no source tab on screen the palette says there is
    // none. While a source tab is on screen its editor's actions are listed with the other results:
    // Go to Next Change and Go to Previous Change with their keys beside them, and Open Change,
    // while the file has quick diff marks, and the Cmd+K chords the editor gave up so that Cmd+K
    // opens the palette from inside it, each with its old chord beside it. Choosing one asks the
    // tab to run it. A diff pane on screen lists its diff editor's actions the same way, and takes
    // no line or language query. A view that offers commands of its own (the Present view's slide
    // actions and Export to PDF) has them listed while its tab is on screen, and choosing one runs
    // it.
    //
    // It is also where the Files view's workspace commands run: `:workspace` lists the default
    // workspace and the saved ones, the one in force marked, and a pick switches in place;
    // `:workspace-save <name>` saves the folders in force under the name
    // (rows/WorkspaceRows.svelte); `:folder` opens the folder panel and shows the folder chosen. A
    // refusal of any of them is said in the palette, which stays open, and a success closes it.
    //
    // While a language server serves the source tab on screen, `:interpreter` and
    // `:compile-database` list the choices of the tab's root, the one in force marked
    // (rows/ChoiceRows.svelte; which commands open a list is in palette-modes.ts), and `#` with a
    // query lists its workspace's symbols (rows/SymbolRows.svelte; Cmd+T in the app).
    // `:eslint-config` lists the ESLint configuration of the tab's file
    // (rows/LintConfigRows.svelte).

    import { Command } from 'bits-ui';
    import Modal from '$lib/ui/frame/Modal.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import PaletteRow from '$lib/shell/keys/PaletteRow.svelte';
    import LanguageRows from '$lib/shell/keys/rows/LanguageRows.svelte';
    import ChoiceRows from '$lib/shell/keys/rows/ChoiceRows.svelte';
    import LintConfigRows from '$lib/shell/keys/rows/LintConfigRows.svelte';
    import { createLintConfigList } from '$lib/shell/keys/lint-config.svelte';
    import SymbolRows from '$lib/shell/keys/rows/SymbolRows.svelte';
    import WorkspaceRows from '$lib/shell/keys/rows/WorkspaceRows.svelte';
    import {
        choiceModeOf,
        choiceRows,
        listedRows,
        opensAsMode
    } from '$lib/shell/keys/palette-modes';
    import { configuredThemes, landOn, openPaletteItem } from '$lib/shell/keys/palette-open';
    import {
        buildIndex,
        commands,
        editorItems,
        pinItems,
        viewItems,
        folderCommand,
        kindWord,
        lineQuery,
        parseCommand,
        ranked,
        workspaceChoicesOf,
        type PaletteCommand,
        type PaletteItem
    } from '$lib/state/workbench/palette';
    import {
        languageActions,
        languageMatches,
        type LanguageAssociation,
        type LanguageMatch
    } from '$lib/state/workbench/navigation/status';
    import {
        editorOnScreen,
        sourceOnScreen
    } from '$lib/state/workbench/navigation/editor-status.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { registrationLabel } from '$lib/state/workbench/navigation/registry';
    import { untrack } from 'svelte';
    import { useState } from '$lib/state/client/use';

    const client = useState();

    const {
        editorStatus: { ask, statusOf },
        explorer,
        fs: { workspaces },
        layout: { activeInstance, openView },
        lint,
        lsp,
        paletteSource: { paletteSource, offered },
        ui: { setCrt, setTheme, crt },
        registry: { views }
    } = client;

    type Props = {
        open: boolean;
        onclose: () => void;
        onupdate: () => void;
        /** The text installed on this opening, empty for Cmd-K and colon for command mode. */
        prefill?: string;
    };

    let { open, onclose, onupdate, prefill = '' }: Props = $props();
    let query = $state(untrack(() => prefill));
    let box: HTMLDivElement | undefined = $state();

    /** The Command's selected row, by its value. */
    let chosen = $state('');

    /** What the last workspace command refused with, until the query changes. */
    let said = $state('');

    /** The list's id, which the input names as the list it controls. */
    const LIST = 'palette-list';

    const current = $derived(paletteSource());
    const knownViews = $derived(
        views().map((view) => ({ id: view.id, label: registrationLabel(view) }))
    );
    /** The source tab on screen and what it last said, or null when the tab on screen is none. */
    const source = $derived(sourceOnScreen(activeInstance(), statusOf));
    /** The tab on screen whose editor actions are listed: a source tab or a diff pane. */
    const acting = $derived(editorOnScreen(activeInstance(), statusOf));
    /** The active tab of the pane the reader last worked in, which Pin Editor toggles. */
    const tab = $derived(activeInstance());
    const pinnable = $derived(tab === null ? null : { id: tab.id, pinned: tab.pinned === true });
    const index = $derived(
        open
            ? [
                  ...buildIndex(current.snapshot, current.feeds, knownViews),
                  ...editorItems(acting),
                  ...pinItems(pinnable, t),
                  ...viewItems(tab?.id ?? null, offered)
              ]
            : []
    );
    const parsed = $derived(parseCommand(query));
    /** The source tab's caret, which a go-to-line needs: a tab drawing no editor has none. */
    const caret = $derived(source?.status.caret ?? null);

    /** The line a go-to-line query names, or null for another query. */
    const line = $derived(lineQuery(parsed));
    /** Whether the query is the language list. */
    const languageMode = $derived(parsed !== null && parsed.name === 'language');
    const languages = $derived<LanguageMatch[]>(
        languageMode && source !== null ? languageMatches(parsed?.argument ?? '') : []
    );
    /** The association the second language list picks for, or null while the first is drawn. */
    let associating = $state<LanguageAssociation | null>(null);
    /** The entries above the languages: with no query, and not in the second list. */
    const languageEntries = $derived(
        languageMode && source !== null && associating === null && parsed?.argument.trim() === ''
            ? languageActions(source.status.file, source.status.language)
            : []
    );
    /** The root and language a server serves the tab on screen by, when one does. */
    const served = $derived(source?.status.served ?? null);
    /** The interpreter or compile database list the query is, and its rows. */
    const choiceMode = $derived(choiceModeOf(parsed, served?.language ?? ''));
    const choiceView = $derived(served === null ? null : lsp.choices(served.root, served.language));
    const choiceList = $derived(
        choiceMode === null ? [] : choiceRows(choiceMode, choiceView, parsed?.argument ?? '')
    );
    /** Whether the query is the workspace's symbol list (a `#`), the workspace list or its save. */
    const symbolMode = $derived(parsed === null && query.startsWith('#'));
    const workspaceMode = $derived(parsed !== null && parsed.name === 'workspace');
    const saveMode = $derived(parsed !== null && parsed.name === 'workspace-save');
    const lintConfig = createLintConfigList({
        parsed: () => parsed,
        linters: () => source?.status.linters,
        config: lint.config
    });
    const saved = $derived(workspaces());
    const choices = $derived(
        workspaceMode ? workspaceChoicesOf(parsed?.argument ?? '', saved) : []
    );
    /** Whether the query is a mode whose rows are drawn by a partial of its own. */
    const listsRows = $derived(
        languageMode || workspaceMode || saveMode || choiceMode !== null || lintConfig.active
    );
    const commandList = $derived(
        parsed === null || line !== null || listsRows
            ? []
            : commands(
                  current.config,
                  source !== null,
                  served?.language ?? '',
                  explorer.panelOpen()
              ).filter((command) => command.name.startsWith(parsed.name))
    );
    const matches = $derived(
        parsed === null && !symbolMode ? ranked(index, query).slice(0, 30) : []
    );
    /** How many rows the list draws, and the value of each one a press can run, in its order. */
    const listed = $derived(
        listedRows({
            parsed,
            matches,
            line,
            hasCaret: caret !== null,
            languageMode,
            languageEntries,
            languages,
            workspaceMode,
            choices,
            saveMode,
            choiceMode,
            commandList,
            choiceList,
            lintList: lintConfig.active ? lintConfig.rows : null
        })
    );
    const count = $derived(listed.count);
    const values = $derived(listed.values);

    // Each opening starts from its prefill; what is typed after that is read untracked, so typing
    // does not start it again.
    $effect(() => {
        if (!open || box === undefined) return;
        const start = prefill;
        untrack(() => typed(start));
    });

    // The second list is left with the language mode, and its first row is the selected one.
    $effect(() => {
        const second = associating !== null;
        untrack(() => {
            if (!languageMode) associating = null;
            else if (second) chosen = values.at(0) ?? chosen;
        });
    });

    /** A new query, the selection on its first row. */
    function typed(next: string): void {
        query = next;
        said = '';
        const first = values.at(0);
        if (first !== undefined) chosen = first;
    }

    /**
     * Open a result and close the palette. A result that shows a tab, and the `:tab` and `:goto`
     * commands in `run`, take the keyboard on that tab's head once the page has drawn it, since the
     * tab chosen is where the reader went. The dialog's give-back runs first and hands the keyboard
     * to the control the reader was on, whose pane's focus handler runs; `landOn` then moves it to
     * the chosen tab's head, whose pane's focus handler makes that tab the page's active tab. An
     * editor action shows no tab; the editor takes the keyboard when it runs the action, and the
     * give-back then finds it held.
     */
    function choose(item: PaletteItem): void {
        onclose();
        const id = openPaletteItem(client, item);
        if (id !== '' && item.kind !== 'editor' && item.kind !== 'command') void landOn(id);
    }

    /** Send the source tab on screen to a line. */
    function goLine(wanted: number): void {
        if (source === null || caret === null) return;
        ask(source.instance, { kind: 'goto', line: wanted });
        onclose();
    }

    /** Open Folder: the folder panel, then the folder shown; a panel that did not open is said. */
    async function openFolder(): Promise<void> {
        const result = await folderCommand(explorer.openFolder);
        if (result.closed) onclose();
        else said = result.said;
    }

    function run(command: PaletteCommand): void {
        if (!command.available || parsed === null) return;
        const argument = parsed.argument;
        // The instance a command showed, when it showed a tab.
        let shown = '';
        // The commands that list choices are modes of their own: choosing one opens its list.
        if (opensAsMode(command.name)) {
            typed(`:${command.name} `);
            return;
        }
        if (command.name === 'folder') {
            void openFolder();
            return;
        }
        if (command.name === 'theme') {
            if (configuredThemes(current.config).includes(argument)) setTheme(argument);
        } else if (command.name === 'crt') {
            setCrt(!crt());
        } else if (command.name === 'tab') {
            if (knownViews.some((view) => view.id === argument)) shown = openView(argument);
        } else if (command.name === 'goto') {
            const project = current.snapshot?.entities.projects[argument];
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

{#if open}
    <Modal
        level="palette"
        {onclose}
        onopen={() => box?.querySelector<HTMLInputElement>('input')?.focus()}
    >
        {#snippet children(props)}
            <div {...props} class="palette" aria-label={t('app.search')} bind:this={box}>
                <Command.Root shouldFilter={false} loop vimBindings={false} bind:value={chosen}>
                    {#snippet child({ props: root })}
                        <div {...root} class="command">
                            <Command.Input>
                                {#snippet child({ props: input })}
                                    <Search
                                        value={query}
                                        placeholder={t('app.palette.cmdk_placeholder')}
                                        field={{ ...input, 'aria-controls': LIST }}
                                        oninput={typed}
                                    />
                                {/snippet}
                            </Command.Input>
                            <Command.List id={LIST}>
                                {#snippet child({ props: list })}
                                    <Command.Viewport>
                                        {#snippet child({ props: viewport })}
                                            <div {...viewport} {...list} class="list">
                                                {#if symbolMode}
                                                    <SymbolRows
                                                        instance={source?.instance ?? null}
                                                        query={query.slice(1)}
                                                        {onclose}
                                                    />
                                                {:else if parsed === null}
                                                    {#each matches as found (found.item.id)}
                                                        <PaletteRow
                                                            row={{
                                                                value: found.item.id,
                                                                kind: kindWord(found.item.kind, t),
                                                                label: found.item.label,
                                                                parts: found.title,
                                                                hint: found.item.hint,
                                                                pick: () => choose(found.item)
                                                            }}
                                                        />
                                                    {/each}
                                                {:else if line !== null}
                                                    {#if caret !== null}
                                                        <PaletteRow
                                                            row={{
                                                                value: 'line',
                                                                kind: t(
                                                                    'statusbar.palette_kind_line'
                                                                ),
                                                                label: t(
                                                                    'statusbar.palette_line',
                                                                    line
                                                                ),
                                                                pick: () => goLine(line)
                                                            }}
                                                        />
                                                    {:else}
                                                        <p class="empty">
                                                            {t('statusbar.palette_line_none')}
                                                        </p>
                                                    {/if}
                                                {:else if languageMode}
                                                    {#if source === null}
                                                        <p class="empty">
                                                            {t('statusbar.palette_language_none')}
                                                        </p>
                                                    {:else}
                                                        <LanguageRows
                                                            {source}
                                                            actions={languageEntries}
                                                            {languages}
                                                            {associating}
                                                            onassociate={(
                                                                next: LanguageAssociation
                                                            ) => (associating = next)}
                                                            {onclose}
                                                            onsaid={(words: string) =>
                                                                (said = words)}
                                                        />
                                                    {/if}
                                                {:else if workspaceMode || saveMode}
                                                    <WorkspaceRows
                                                        choices={workspaceMode ? choices : null}
                                                        name={parsed.argument}
                                                        {onclose}
                                                        onsaid={(words: string) => (said = words)}
                                                    />
                                                {:else if choiceMode !== null && served !== null}
                                                    <ChoiceRows
                                                        mode={choiceMode}
                                                        {served}
                                                        rows={choiceList}
                                                        loading={choiceView === null}
                                                        {onclose}
                                                        onsaid={(words: string) => (said = words)}
                                                    />
                                                {:else if lintConfig.active}
                                                    <LintConfigRows
                                                        list={lintConfig}
                                                        {onclose}
                                                        onsaid={(words: string) => (said = words)}
                                                    />
                                                {:else}
                                                    {#if parsed.name === '' && caret !== null && source !== null}
                                                        <p class="empty" data-line-hint>
                                                            {t(
                                                                'statusbar.palette_line_hint',
                                                                caret.line,
                                                                caret.column,
                                                                source.status.lines
                                                            )}
                                                        </p>
                                                    {/if}
                                                    {#each commandList as command (command.name)}
                                                        <PaletteRow
                                                            row={{
                                                                value: `command:${command.name}`,
                                                                kind: ':',
                                                                label: `${command.name}${command.hint === '' ? '' : ` ${command.hint}`}`,
                                                                hint: command.description,
                                                                disabled: !command.available,
                                                                note: command.available
                                                                    ? undefined
                                                                    : t('app.palette_unavailable'),
                                                                pick: () => run(command)
                                                            }}
                                                        />
                                                    {/each}
                                                {/if}
                                                {#if said !== ''}
                                                    <p class="empty" data-palette-said>{said}</p>
                                                {/if}
                                                {#if count === 0 && line === null && !languageMode && !workspaceMode && !symbolMode && choiceMode === null && !lintConfig.active}
                                                    <p class="empty">
                                                        {parsed === null
                                                            ? t('app.palette_empty')
                                                            : t('app.palette.cmd_unknown')}
                                                    </p>
                                                {/if}
                                            </div>
                                        {/snippet}
                                    </Command.Viewport>
                                {/snippet}
                            </Command.List>
                        </div>
                    {/snippet}
                </Command.Root>
            </div>
        {/snippet}
    </Modal>
{/if}

<style>
    .palette {
        position: relative;
        display: grid;
        grid-template-rows: minmax(0, 1fr);
        width: min(42rem, 100%);
        max-height: 70vh;
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        box-shadow: var(--shadow);
    }

    /* A palette floats over a pane, so at the pane's own opacity it would be read through two
       translucent layers and the picture. It keeps more of its colour than the pane does. */
    :global(body.wall) .palette {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .palette :global(input) {
        width: 100%;
        box-sizing: border-box;
    }

    /* The Command's own box: the input above, and under it the list, which scrolls. */
    .command {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 8px;
        min-height: 0;
    }

    .list {
        display: grid;
        gap: 4px;
        min-height: 0;
        overflow: auto;
    }

    .empty {
        margin: 0;
        padding: 8px;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }
</style>
