<script lang="ts">
    // Layer 3, shell. The palette overlay over the workbench, on the modal ground
    // ui/frame/Modal.svelte draws, its list bits-ui's Command. Cmd-K opens it to search the
    // projects, entries and tabs, a colon or Cmd+Shift+P or F1 to list the colon commands (rows/
    // CommandRows.svelte), and Cmd+P to find a file by name across the served roots (rows/
    // FileRows.svelte). It builds a fresh pure index whenever it opens in the search mode, then
    // either matches the query fuzzily or lists the colon commands; choosing a result changes
    // layout or appearance state and never mounts a view of its own, except a file, which opens in
    // the view that can show it.
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
    // it. The tasks that apps offer for the repository holding the file on screen are listed too,
    // each run as a press of it in the Repositories view runs.
    //
    // It is also where the Files view's workspace commands run: `:workspace` lists the default
    // workspace and the saved ones, the one in force marked, and a pick switches in place;
    // `:workspace-save <name>` saves the folders in force under the name and
    // `:workspace-new <name>` makes a workspace with no folder (rows/WorkspaceRows.svelte);
    // `:workspace-close` leaves the open workspace file; `:folder` opens the folder panel and shows
    // the folder chosen. A refusal of any of them is said in the palette, which stays open, and a
    // success closes it.
    //
    // While a language server serves the source tab on screen, `:interpreter` and
    // `:compile-database` list the choices of the tab's root, the one in force marked
    // (rows/approve/ChoiceRows.svelte; which commands open a list is in palette-modes.ts), and `#`
    // with a query lists its workspace's symbols (rows/SymbolRows.svelte; Cmd+T in the app).
    // `:eslint-config` lists the ESLint configuration of the tab's file
    // (rows/approve/LintConfigRows.svelte), and `:clone` the repositories of the reader's GitHub
    // account, each cloned into a folder the reader picks (rows/CloneRows.svelte).
    //
    // The file mode asks the search route for the names of every file under the served roots when
    // it opens (file-names.svelte.ts) and a worker matches them (file-match.worker.ts); the rows
    // are those of the newest query the worker has answered. With nothing typed it lists the files
    // open in tabs; a colon or a hash typed in it leaves it for the commands or the symbols. A
    // request to open the palette while it is open installs the text and the mode of the request,
    // and the query is bound to the window, which reads the mode the palette is in.

    import { Command } from 'bits-ui';
    import Modal from '$lib/ui/frame/Modal.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import SearchRows from '$lib/shell/keys/rows/SearchRows.svelte';
    import CommandRows from '$lib/shell/keys/rows/CommandRows.svelte';
    import FileRows from '$lib/shell/keys/rows/FileRows.svelte';
    import LineRows from '$lib/shell/keys/rows/LineRows.svelte';
    import LanguageRows from '$lib/shell/keys/rows/LanguageRows.svelte';
    import ChoiceRows from '$lib/shell/keys/rows/approve/ChoiceRows.svelte';
    import LintConfigRows from '$lib/shell/keys/rows/approve/LintConfigRows.svelte';
    import CloneRows from '$lib/shell/keys/rows/CloneRows.svelte';
    import { createCloneList } from '$lib/shell/keys/rows/clone-list.svelte';
    import { createLanguageList } from '$lib/shell/keys/lists/language-list.svelte';
    import { createLintConfigList } from '$lib/shell/keys/lists/lint-config.svelte';
    import SymbolRows from '$lib/shell/keys/rows/SymbolRows.svelte';
    import WorkspaceRows from '$lib/shell/keys/rows/WorkspaceRows.svelte';
    import { createFileNames } from '$lib/shell/keys/lists/file-names.svelte';
    import {
        choiceModeOf,
        choiceRows,
        listedRows,
        type PaletteStart
    } from '$lib/shell/keys/palette-modes';
    import { landOn, openPaletteItem } from '$lib/shell/keys/palette-open';
    import { PREFIX_ROWS } from '$lib/data/helpers/keys/oculus/palette-table';
    import {
        appItems,
        buildIndex,
        commands,
        editorItems,
        fileValue,
        lineQuery,
        modeOf,
        openFileEntries,
        parseCommand,
        pinItems,
        plainFile,
        ranked,
        shownTrees,
        taskItems,
        taskRepoOf,
        viewItems,
        workspaceChoicesOf,
        type PaletteItem
    } from '$lib/state/workbench/palette';
    import type { LanguageAssociation } from '$lib/state/workbench/navigation/status';
    import {
        editorOnScreen,
        sourceOnScreen
    } from '$lib/state/workbench/navigation/editor-status.svelte';
    import { registrationLabel } from '$lib/state/workbench/navigation/registry';
    import { t } from '$lib/state/shared/words/text';
    import { untrack } from 'svelte';
    import { useState } from '$lib/state/client/use';

    const client = useState();

    const {
        editorStatus: { statusOf },
        appShell,
        clone,
        appTools,
        commands: projectCommands,
        explorer,
        fs: { workspaces },
        layout: { activeInstance, currentPage, floats, hosts },
        lint,
        lsp,
        paletteSource: { paletteSource, offered },
        registry: { views },
        search,
        selectors
    } = client;

    type Props = {
        open: boolean;
        onclose: () => void;
        onupdate: () => void;
        /**
         * What this opening installs: empty for Cmd-K, a colon for the command mode, and the file
         * mode for Cmd+P. Each request is a new object, so one made while the palette is open
         * installs again.
         */
        start?: PaletteStart;
        /** The text in the field, which the window reads to know the mode the palette is in. */
        query?: string;
    };

    let {
        open,
        onclose,
        onupdate,
        start = { text: '', files: false },
        query = $bindable('')
    }: Props = $props();
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
    const names = createFileNames(search, () => (fileMode ? query : ''));
    /** The mode the query puts the palette in; with no prefix, the mode it was opened in. */
    const mode = $derived(modeOf(query, start.files));
    const fileMode = $derived(mode === 'files');
    /** The source tab on screen and what it last said, or null when the tab on screen is none. */
    const source = $derived(sourceOnScreen(activeInstance(), statusOf));
    /** The tab on screen whose editor actions are listed: a source tab or a diff pane. */
    const acting = $derived(editorOnScreen(activeInstance(), statusOf));
    /** The active tab of the pane the reader last worked in, which Pin Editor toggles. */
    const tab = $derived(activeInstance());
    const pinnable = $derived(tab === null ? null : { id: tab.id, pinned: tab.pinned === true });
    /** The repository holding the file on screen, whose tasks Cmd-K lists. */
    const taskRepo = $derived(taskRepoOf(selectors.gitRoots(), source?.status.file ?? ''));
    $effect(() => (open && taskRepo !== null ? projectCommands.watch(taskRepo) : undefined));
    const index = $derived(
        open && mode === 'search'
            ? [
                  ...buildIndex(current.snapshot, current.feeds, knownViews),
                  ...editorItems(acting),
                  ...pinItems(pinnable, t),
                  ...viewItems(tab?.id ?? null, offered),
                  ...appItems(
                      appShell.commandRows(appShell.place(tab, source?.status ?? null, false))
                  ),
                  ...taskItems(taskRepo, projectCommands.commands(taskRepo ?? ''))
              ]
            : []
    );
    const parsed = $derived(parseCommand(query));
    /** The source tab's caret, which a go-to-line needs: a tab drawing no editor has none. */
    const caret = $derived(source?.status.caret ?? null);

    /** The line a go-to-line query names, or null for another query. */
    const line = $derived(lineQuery(query));
    const languageList = createLanguageList({
        parsed: () => parsed,
        source: () => source,
        apps: () => appTools.languages.names()
    });
    const languageMode = $derived(languageList.active);
    /** The root and language a server serves the tab on screen by, when one does. */
    const served = $derived(source?.status.served ?? null);
    /** The interpreter or compile database list the query is, and its rows. */
    const choiceMode = $derived(choiceModeOf(parsed, served?.language ?? ''));
    const choiceView = $derived(served === null ? null : lsp.choices(served.root, served.language));
    const choiceList = $derived(
        choiceMode === null ? [] : choiceRows(choiceMode, choiceView, parsed?.argument ?? '')
    );
    /** Whether the query is the workspace's symbol list (a `#`), the workspace list or its save. */
    const symbolMode = $derived(mode === 'symbols');
    const workspaceMode = $derived(parsed !== null && parsed.name === 'workspace');
    const saveMode = $derived(
        parsed !== null && (parsed.name === 'workspace-save' || parsed.name === 'workspace-new')
    );
    const lintConfig = createLintConfigList({
        parsed: () => parsed,
        linters: () => source?.status.linters,
        config: lint.config
    });
    const cloneList = createCloneList({ parsed: () => parsed, repos: clone.githubRepos });
    const saved = $derived(workspaces());
    const choices = $derived(
        workspaceMode ? workspaceChoicesOf(parsed?.argument ?? '', saved) : []
    );
    /** Whether the query is a mode whose rows are drawn by a partial of its own. */
    const listsRows = $derived(
        languageMode ||
            workspaceMode ||
            saveMode ||
            choiceMode !== null ||
            lintConfig.active ||
            cloneList.active
    );
    const commandList = $derived(
        parsed === null || line !== null || listsRows
            ? []
            : commands(
                  current.config,
                  appShell.offers(),
                  source !== null,
                  served?.language ?? '',
                  explorer.panelOpen()
              ).filter((command) => command.name.startsWith(parsed.name))
    );
    const matches = $derived(
        parsed === null && mode === 'search' ? ranked(index, query).slice(0, 30) : []
    );
    /** The files open in tabs of the trees on screen, the active tab of the pane in use first. */
    const openFiles = $derived(
        open && fileMode
            ? openFileEntries(
                  shownTrees(hosts(), {
                      page: currentPage().id,
                      floats: floats().map((one) => one.id),
                      float: client.float
                  }),
                  tab?.id ?? null
              ).map(plainFile)
            : []
    );
    /** The rows of the file mode: the open files with nothing typed, else the matches. */
    const fileFound = $derived.by(() => {
        if (!fileMode) return [];
        return query.trim() === '' ? openFiles : names.rows();
    });
    /** How many rows the list draws, and the value of each one a press can run, in its order. */
    const listed = $derived(
        listedRows({
            parsed,
            matches,
            files: fileMode ? fileFound.map((one) => fileValue(one.entry)) : null,
            line,
            hasCaret: caret !== null,
            languageMode,
            languageEntries: languageList.entries,
            languages: languageList.languages,
            workspaceMode,
            choices,
            saveMode,
            choiceMode,
            commandList,
            choiceList,
            modeList: lintConfig.active ? lintConfig.rows : cloneList.active ? cloneList.rows : null
        })
    );
    const count = $derived(listed.count);
    const values = $derived(listed.values);

    // Each request starts from its text; what is typed after that is read untracked, so typing does
    // not start it again.
    $effect(() => {
        if (!open || box === undefined) return;
        const asked = start;
        untrack(() => typed(asked.text));
    });

    // The file mode asks for the names when the palette opens in it and ends the request when the
    // palette closes, so a palette opened again asks again.
    const wantsNames = $derived(open && start.files);
    $effect(() => {
        if (!wantsNames) return;
        return untrack(() => names.ask());
    });

    // The second list is left with the language mode, and its first row is the selected one.
    $effect(() => {
        const second = languageList.associating !== null;
        untrack(() => {
            if (!languageMode) languageList.leave();
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
                                        placeholder={fileMode
                                            ? t('app.palette.files_placeholder')
                                            : t('app.palette.cmdk_placeholder')}
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
                                                        query={query.slice(
                                                            PREFIX_ROWS.symbols.prefix.length
                                                        )}
                                                        {onclose}
                                                    />
                                                {:else if fileMode}
                                                    <FileRows
                                                        found={fileFound}
                                                        listingOpen={query.trim() === ''}
                                                        {names}
                                                        {onclose}
                                                    />
                                                {:else if parsed === null}
                                                    <SearchRows {matches} onpick={choose} />
                                                {:else if line !== null}
                                                    <LineRows
                                                        {line}
                                                        instance={caret === null
                                                            ? null
                                                            : (source?.instance ?? null)}
                                                        {onclose}
                                                    />
                                                {:else if languageMode}
                                                    {#if source === null}
                                                        <p class="empty">
                                                            {t('statusbar.palette_language_none')}
                                                        </p>
                                                    {:else}
                                                        <LanguageRows
                                                            {source}
                                                            actions={languageList.entries}
                                                            languages={languageList.languages}
                                                            associating={languageList.associating}
                                                            onassociate={(
                                                                next: LanguageAssociation
                                                            ) => languageList.associate(next)}
                                                            {onclose}
                                                            onsaid={(words: string) =>
                                                                (said = words)}
                                                        />
                                                    {/if}
                                                {:else if workspaceMode || saveMode}
                                                    <WorkspaceRows
                                                        choices={workspaceMode ? choices : null}
                                                        name={parsed.argument}
                                                        command={parsed.name}
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
                                                {:else if cloneList.active}
                                                    <CloneRows list={cloneList} {onclose} />
                                                {:else}
                                                    <CommandRows
                                                        {parsed}
                                                        list={commandList}
                                                        caret={caret !== null && source !== null
                                                            ? {
                                                                  ...caret,
                                                                  lines: source.status.lines
                                                              }
                                                            : null}
                                                        {onclose}
                                                        {onupdate}
                                                        ontype={typed}
                                                        onsaid={(words: string) => (said = words)}
                                                    />
                                                {/if}
                                                {#if said !== ''}
                                                    <p class="empty" data-palette-said>{said}</p>
                                                {/if}
                                                {#if count === 0 && line === null && !listsRows && !symbolMode && !fileMode}
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
