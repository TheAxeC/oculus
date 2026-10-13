// Layer 2, client state. Every store one page holds, built once at the root and handed down.
//
// Each store module exports a factory over its own collections, and this is the one place the
// instances are made and wired to each other: a store that reads another is given it rather than
// importing it. The root provides the object through Svelte's context (state/client/use.ts) and
// every view, shell component and route reads it from there, which is what makes two clients, and
// two test cases, share nothing. Each tab provides a copy of it for its own subtree, made by the
// `tabScope` member, in which the stores that read through the query client ask nothing while the
// tab is hidden.
//
// The three catalogs are not here. state/shared/words/text.ts, state/shared/words/tones.ts and
// state/shared/words/appearance.ts hold what the server last sent in module variables, are never
// written after a push installs them, and are read by t(), toneOf() and themes() from every layer
// including `ui/`, where there is no client object to read them from;
// state/shared/words/generation.svelte.ts and state/shared/words/glyphmode.svelte.ts are the two
// runes that make those reads reactive and belong with them for the same reason.
//
// This is the state layer's composition root: it imports every other state folder and no state
// module imports it, which is why state/client heads the state layer's folder order. It names
// nothing of `ui/` or `views/`: the view registry is a state module (state/workbench/navigation/
// registry.ts), and the primitives' tooltip counter is made by the page root beside this object.

import { matchersFor } from '../sessions/terminal/pty/matchers.ts';
import {
    actingDebuggers,
    breakpointLanguages
} from '../../data/helpers/files/apps/tools/debuggers.ts';
import { languageOf } from '../../data/helpers/files/languages.ts';
import type { ClientState, TabScopeStore } from './shapes/client-state.ts';
import { createRegistry } from '../workbench/navigation/registry.ts';
import { createAgents } from '../sessions/agents.svelte.ts';
import { createChanges } from '../sessions/changes.svelte.ts';
import { createApps } from '../system/apps/apps.svelte.ts';
import { endingOf } from '../sessions/terminal/terminal-lists.ts';
import { createAppTools } from '../system/apps/tools/tools.svelte.ts';
import { themeNamed } from '../shared/words/appearance.ts';
import { createAppShell } from '../system/apps/shell/shell.svelte.ts';
import { runPageCommand } from '../system/apps/shell/page-commands.ts';
import { appCommands } from '../system/apps/commands.ts';
import { createAudit } from '../system/audit.svelte.ts';
import { createAccounts } from '../life/accounts.svelte.ts';
import { createCalendar } from '../life/calendar.svelte.ts';
import { createClock } from './clock.svelte.ts';
import { createDeposit } from '../system/deposit.svelte.ts';
import { createDocs } from '../system/docs.svelte.ts';
import { createDrag } from '../workbench/drag.svelte.ts';
import {
    createEditorStatus,
    sourceOnScreen
} from '../workbench/navigation/editor-status.svelte.ts';
import { createHeadings } from '../sources/explorer/sections/headings.svelte.ts';
import { createEntities } from './entities.svelte.ts';
import { createFeeds } from '../feeds/feeds.svelte.ts';
import { createFiles } from '../sources/files.svelte.ts';
import { cardTreePrefix } from '../sources/explorer/view/card-tree.ts';
import { createFolderPages } from '../workbench/layout/open/float/folder-opener.ts';
import { createFs } from '../sources/fs.svelte.ts';
import { fileNamed } from '../../data/helpers/hub-names.ts';
import { filesLineTyped } from '../sources/fs.ts';
import { createHpc } from '../system/machine/hpc/hpc.svelte.ts';
import { createProcesses } from '../system/machine/processes/processes.svelte.ts';
import { createSchedule } from '../system/machine/schedules/schedule.svelte.ts';
import { createInbox } from '../feeds/inbox.svelte.ts';
import {
    instanceMap,
    instanceText,
    isInstanceOf,
    stateId,
    tabsOf
} from '../workbench/layout/instance.ts';
import { fileOfTab } from '../workbench/navigation/pages.ts';
import { paneAt } from '../workbench/layout/index.ts';
import { pageOpen } from '../workbench/layout/saved/storage.ts';
import { createLatexActions } from '../sessions/latex/actions.ts';
import { createLatex, type LatexStore } from '../sessions/latex/latex.svelte.ts';
import type { Desktop } from '../shared/stores/desktop.ts';
import { createWindows } from '../workbench/layout/open/float/browser.ts';
import { createLayout } from '../workbench/layout.svelte.ts';
import { appsSettings } from '../../data/sources/config/settings.ts';
import { createLines } from '../system/lines.svelte.ts';
import { createFormDraft } from '../forms/form-draft.ts';
import { createPages, pageDraftTarget } from '../forms/page-entry.ts';
import { projectDraftTarget } from '../forms/schema.ts';
import { createMemories } from '../life/pictures/memories.svelte.ts';
import { createWallpapers } from '../life/pictures/wallpapers.svelte.ts';
import { createNotices } from '../workbench/navigation/notices.svelte.ts';
import { createNoticeSources } from '../workbench/navigation/notice-sources.ts';
import { createPaletteSource } from '../workbench/palette-source.svelte.ts';
import { createPresent } from '../life/present.svelte.ts';
import { SETTINGS_VIEW, configRail, railTyped } from '../workbench/navigation/rail.ts';
import { settingsTyped } from '../system/config/typed.ts';
import { createRailBadges } from '../workbench/rail-badges.svelte.ts';
import { createRepositories, DIFF_VIEW } from '../sources/repositories/repositories.svelte.ts';
import { heldDiff } from '../sources/repositories/diff/subject.ts';
import { createSelection } from '../workbench/selection.svelte.ts';
import { createExplorer, type MovedItems } from '../sources/explorer/ops.svelte.ts';
import { createSearch } from '../sources/search/search.svelte.ts';
import { createLint } from '../system/machine/lint/lint.svelte.ts';
import { createClangd } from '../system/machine/lsp/clangd.svelte.ts';
import { createDocuments } from '../system/machine/lsp/documents.svelte.ts';
import {
    languageProblems,
    commandProblems,
    latexProblems,
    lintProblems
} from '../system/problem-sources.ts';
import { createProblems, problemTarget } from '../system/problems.svelte.ts';
import { openPlace, type PlaceOpener } from '../sessions/source/place.ts';
import { readRoots, readText } from '../sources/fs-transport.ts';
import { watchServedRoots } from '../shared/stores/served-roots.svelte.ts';
import { createLspEdits } from '../system/machine/lsp/edits.ts';
import { REFACTOR_VIEW, createRefactor } from '../system/machine/refactor/preview.svelte.ts';
import { isPrivateFile } from '../system/config/config-files.ts';
import { WRITE_MAX_BYTES } from '../../data/file-ops.ts';
import { createWorkspaceSymbols } from '../system/machine/lsp/workspace-symbols.ts';
import { createLinkRewrite } from '../system/machine/refactor/link-rewrite.ts';
import { createLsp } from '../system/machine/lsp/lsp.svelte.ts';
import { createReferences } from '../system/machine/lsp/references.svelte.ts';
import { saveRulesOf } from '../workbench/navigation/editor-text.ts';
import { createSelectors } from './selectors.svelte.ts';
import { createClone } from '../sources/clone/clone.svelte.ts';
import { createCloneAfter } from '../sources/clone/clone-after.svelte.ts';
import { createSocket } from './socket.svelte.ts';
import { createAutosave } from '../sessions/source/autosave.svelte.ts';
import { loadSource, type SourceDraft } from '../sessions/source/draft.ts';
import { createSource, type SaveRules } from '../sessions/source/source.svelte.ts';
import { manifestOfProject } from '../sessions/source/write-files.ts';
import { createTerminals, terminalLabel } from '../sessions/terminals.svelte.ts';
import { createCommands } from '../sessions/terminal/commands.svelte.ts';
import { TERMINAL_VIEW } from '../sessions/terminal/terminal-tabs.ts';
import { createTranscripts } from '../sessions/transcript.svelte.ts';
import { createUi } from '../workbench/ui.svelte.ts';
import { createDebug } from '../system/machine/debug/debug.svelte.ts';
import { createUsageRefresh } from '../system/machine/usage/usage-refresh.svelte.ts';
import { createQueries, scopedStore } from './queries.svelte.ts';
import { createWrites } from './writes.svelte.ts';
import { createGraphviz } from '../boards/structure/layout.ts';
import { createLatexReader } from '../sources/explorer/sections/outline.ts';

export type { ClientState, TabScopeStore };

/**
 * One client's stores, built in dependency order: a store is made after everything it reads, and is
 * handed those instances here. Nothing else wires one store to another.
 */
export function createClientState(
    desktop?: Desktop,
    float: string | null = desktop?.float ?? null,
    pageId = 'main',
    owner: string | null = desktop?.owner ?? null
): ClientState {
    // Every store that fetches an answer holds it in this one query client.
    const queries = createQueries();
    // The stores handed the query client, by their name in the client object, which is what a tab's
    // copy replaces. A store handed `queries` is recorded where it is made.
    const queried = new Map<string, Record<string, unknown>>();
    function withQueries<N extends keyof ClientState>(
        name: N,
        store: ClientState[N] & Record<string, unknown>
    ): ClientState[N] {
        queried.set(name, store);
        return store;
    }
    const entities = createEntities();
    // The write path refuses a write over a file a source tab holds unsaved text of (or that the
    // unread roots leave unknown), and names a file a write carries only an id of out of the
    // snapshot and the change log; the source store and the change log are made after it, so both
    // are read when a write is made.
    const writes = createWrites(
        () => entities.config()?.config ?? null,
        (file) => source.unsavedFile(file.root, file.path),
        {
            primary: () => fs.primary(),
            engine: () => fs.workspaces().engine,
            projectManifest: (id) =>
                manifestOfProject(entities.portfolio()?.entities.projects[id], fs.primary()),
            collectionFile: (id) => {
                const held = entities.portfolio()?.entities.collections[id];
                if (held?.root === undefined) return null;
                return fileNamed(held.file, fs.roots(), fs.primary());
            },
            feeds: () => entities.feeds(),
            changeFile: (at) => {
                const file = changes.rows().find((row) => row.at === at)?.file;
                return file === undefined ? null : fileNamed(file, fs.roots(), fs.primary());
            },
            unsavedUnknown: (file) => source.unsavedUnknown(file.root, file.path)
        }
    );
    const socket = createSocket(entities, writes);
    const ui = createUi(writes.writeConfigKey, desktop !== undefined, () => appShell.offers());
    // A tab's close, a pane's close and a page's close forget the state of every instance they take
    // away, and the layout is the one store that knows an instance closed. The project cards an
    // instance draws keep their file trees in records under its id, so the layout is handed a
    // forget that takes those too, and the Search store lets go of a closed tab's requests.
    const layout = createLayout(
        {
            ...ui,
            clearInstanceState: (id: string) => {
                ui.clearInstanceState(id);
                ui.clearInstanceStates(cardTreePrefix(id));
                search.forgetSearch(id);
            }
        },
        desktop === undefined ? undefined : { turn: desktop.bridge.saveLayout }
    );
    const drag = createDrag(layout, desktop);
    const clock = createClock();
    const changes = withQueries('changes', createChanges(queries));
    const selection = createSelection();
    // A terminal belongs to exactly one Terminal tab, on whichever page or float it is, and a
    // hidden page mounts no view, so the terminals store is handed the Terminal tabs of every page
    // and float and the layout's ways to change them, and keeps the ownership itself: a terminal
    // shown, moved or ended changes the tabs of any page. A tab it opens is opened on the page it
    // names; its state carries an identity of its own, so the layout opens it rather than
    // activating another Terminal tab. The page of a popped-out window closes no tab for an ended
    // terminal: the main window's page does, once for every tab.
    const terminals = createTerminals(entities, socket, writes, {
        upkeep: float === null,
        tabs: () =>
            layout.hosts().flatMap((host) =>
                tabsOf(host.workbench.root)
                    .filter((tab) => tab.view === TERMINAL_VIEW)
                    .map((tab) => ({
                        id: tab.id,
                        page: host.id,
                        view: tab.view,
                        state: tab.state
                    }))
            ),
        restate: (id, _page, state) => layout.restateInstance(id, state),
        activate: (id, page) => layout.activateInstance(id, page),
        switchPage: (page) => layout.switchPage(page),
        currentPage: () => layout.currentPage().id,
        activeTab: (page) => {
            const active = layout.activeInstance(page);
            return active?.view === TERMINAL_VIEW ? active.id : null;
        },
        open: (page, state, document) => layout.openView(TERMINAL_VIEW, state, page, { document }),
        close: (id, page) => layout.closeInstance(id, page),
        instanceState: (id) => ui.instanceState(id),
        setInstanceState: (id, state) => ui.setInstanceState(id, state),
        selected: selection.selected,
        select: selection.select,
        hubRoot: () => selectors.hubRoot(),
        defaultFolder: async () => {
            const read = await fs.workspacesNow();
            const own = read.folders.find((one) => one.key === read.primary);
            return own?.dir ?? read.home;
        },
        paneTab: (page, path) => {
            const pane = paneAt(layout.workbench(page).root, path);
            if (pane === null) return null;
            const active = pane.tabs.find((tab) => tab.id === pane.active);
            return active?.view === TERMINAL_VIEW ? active.id : null;
        },
        openIn: (page, path, state) => layout.openInPane(TERMINAL_VIEW, state, page, path)
    });
    // A closed Terminal tab, pane or page, and a page reset that removes a tab, end the running
    // terminals the tab lists; the layout and the close questions ask the ui store, which asks the
    // terminals store through this registration.
    ui.registerTerminalOwner({
        running: terminals.runningOf,
        busy: terminals.busyOf,
        end: terminals.endTerminals
    });
    const agents = withQueries('agents', createAgents(queries));
    const files = withQueries(
        'files',
        createFiles(entities, queries, (id) => selectors.hubDirOf(id))
    );
    const fs = withQueries('fs', createFs(writes, entities, queries, layout.workspaceCarried));
    /**
     * The roots a root key is resolved against on the page: the current workspace's roots only,
     * which are the ones the server's file route serves (`roots` of the open workspace,
     * server/files/workspace/open.ts). A key can name another folder in another workspace
     * (state/system/apps/instance.ts), so the roots of the other workspaces are never searched.
     */
    const servedRoots = (): { key: string; dir: string }[] => fs.roots();
    const docs = withQueries('docs', createDocs(entities, queries));
    const notices = createNotices(ui);
    /**
     * Show the Problems view with its list limited to one root: the view is opened or activated and
     * the root becomes the scope in its filter, which the reader dismisses from the view.
     */
    function showProblems(root: string): void {
        const id = layout.openView('problems');
        if (id === '') return;
        ui.setInstanceState(id, { ...instanceMap(ui.instanceState(id)), scope: root });
    }
    const latex: LatexStore = withQueries(
        'latex',
        createLatex(entities, terminals, fs, queries, writes, {
            notices,
            saveAll: async () => {
                for (const host of layout.hosts()) {
                    for (const tab of tabsOf(host.workbench.root)) {
                        const file = tab.view === 'source' ? fileOfTab(tab) : null;
                        if (file === null || !ui.unsaved(tab.id)) continue;
                        await source.saveSourceDraft(tab.id, file.root, file.path);
                    }
                }
            },
            openLog: (terminal) => {
                selection.select(terminal);
                terminals.showTerminal(terminal);
            },
            showProblems: (target) => {
                showProblems('root' in target ? target.root : latex.state(target).root);
            },
            again: async (terminal, restart) => {
                const answer = await (restart
                    ? commands.restart(terminal, true)
                    : commands.rerun(terminal));
                if ('ok' in answer && answer.ok) return { ok: true, id: answer.id, error: '' };
                return { ok: false, id: '', error: 'error' in answer ? answer.error : '' };
            }
        })
    );
    const latexActions = createLatexActions({
        latex,
        layout,
        notices,
        float,
        pageId,
        owner,
        socket,
        jumpOf: (message) => entities.payloadOf(message, 'jump'),
        ownerOpen: pageOpen,
        focus: () => (desktop === undefined ? window.focus() : desktop.bridge.focusMain())
    });
    const deposit = withQueries('deposit', createDeposit(queries));
    const transcripts = withQueries('transcripts', createTranscripts(queries));
    // The linters run on the files of the source tabs this page has mounted, and again when one of
    // them is saved.
    const lint = createLint({ writes, served: servedRoots });
    // A saved file may be a LaTeX file whose main builds on save, which the latex store decides,
    // and a file a linter takes is linted again.
    const saveRules = (id: string, draft: SourceDraft, root: string, path: string): SaveRules =>
        saveRulesOf(
            {
                options: selectors.editorOptions(),
                languages: selectors.languages(),
                paintLimit: selectors.paintLimit(),
                fileText: fs.fileText,
                repoSettings: selectors.repoSettings
            },
            draft,
            root,
            path
        );
    const source = createSource(
        writes,
        ui,
        (root, path) => {
            fs.markText(root, path);
            void latex.onSaved(root, path);
            lint.saved(root, path);
        },
        {
            socket,
            rules: saveRules,
            kept: (id) => {
                const caret = editorStatus.statusOf(id)?.caret;
                return caret === null || caret === undefined ? [] : [caret];
            },
            roots: () => fs.roots(),
            served: () => readRoots(fs.workspaces())?.map((one) => one.key) ?? null,
            rootsFailed: () => fs.workspaces().error !== ''
        }
    );
    const autosave = createAutosave({
        source,
        options: () => {
            const options = selectors.editorOptions();
            return options === null
                ? null
                : { autosave: options.autosave, autosaveDelay: options.autosaveDelay };
        },
        rules: saveRules,
        timers: {
            setTimeout: (run, ms) => setTimeout(run, ms),
            clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>)
        }
    });
    if (typeof window !== 'undefined') autosave.followPage(window);
    // The pane asks the instance id whether a tab holds unsaved text before it closes it, and asks
    // the ui store rather than the source store, which the shell may not read.
    ui.registerUnsaved(source.sourceDirty);
    ui.registerGone(source.fileGone);
    ui.registerSaveBeforeClose(autosave.saveBeforeClose);
    const feeds = createFeeds(entities);
    const hpc = createHpc(entities, writes);
    const processes = createProcesses(entities, {
        terminalById: terminals.terminalById,
        label: terminalLabel,
        endTerminals: terminals.endTerminals
    });
    const schedule = createSchedule(entities, { terminalById: terminals.terminalById, writes });
    const calendar = createCalendar(entities, writes, clock);
    const inbox = createInbox(entities, writes);
    const accounts = createAccounts(entities, writes, (view) => void layout.openView(view));
    const audit = createAudit(entities);
    const memories = withQueries('memories', createMemories(queries));
    const wallpapers = withQueries('wallpapers', createWallpapers(queries));
    const lines = withQueries('lines', createLines(queries));
    const present = withQueries(
        'present',
        createPresent(entities, queries, writes.writeToken, fs.roots, fs.primary)
    );
    // The Source Control views open a repository's file in a source tab by the root the file routes
    // serve it under, and point the Repositories view at a commit through its remembered state.
    const repositories = createRepositories(writes, terminals, layout, {
        served: servedRoots,
        instanceState: ui.instanceState,
        setInstanceState: ui.setInstanceState
    });
    // The offer to rewrite Markdown links over moved items needs the language server and refactor
    // stores, which are made after the explorer; it is told what moved from the time it is made.
    let movedItems: MovedItems = () => undefined;
    const explorer = createExplorer(
        writes,
        fs,
        {
            tabs: () => layout.hosts().flatMap((host) => tabsOf(host.workbench.root)),
            restateInstance: layout.restateInstance,
            openView: (view: string) => layout.openView(view),
            showFolderInFiles: layout.showFolderInFiles
        },
        ui,
        source,
        (moves) => movedItems(moves)
    );
    const search = createSearch(entities, writes, ui, explorer, {
        open: repositories.openDiff,
        shown: () =>
            layout
                .hosts()
                .flatMap((host) => tabsOf(host.workbench.root))
                .some((tab) => tab.view === DIFF_VIEW && heldDiff(tab.state).replace !== undefined)
    });
    const folders = createFolderPages({
        config: () => entities.config()?.config,
        roots: () => fs.roots(),
        project: (id) => entities.portfolio()?.entities.projects[id],
        layout
    });
    const usageRefresh = createUsageRefresh(entities, writes);
    const selectors = createSelectors(
        entities,
        layout,
        selection,
        docs.enginePlace,
        docs.enginePlaceSettled,
        fs.workspaces
    );
    const clone = createClone(writes, notices, {
        home: () => fs.workspaces().home,
        after: createCloneAfter(fs, notices)
    });
    const pages = createPages({ snapshot: entities.portfolio, feeds: entities.feeds });
    const formDraft = createFormDraft(ui, {
        project: projectDraftTarget(selectors.projectOf),
        page: pageDraftTarget(pages)
    });
    ui.registerUnsaved(formDraft.draftDirty);
    // A file browser's root or workspace line is text no save has taken, asked by the instance's
    // view.
    ui.registerUnsaved((id) => filesLineTyped(layout.instanceView(id), ui.instanceState(id)));
    // A Settings tab's rail list differing from the one config/layout.yml holds is text no save has
    // taken, asked against the config the page holds now.
    ui.registerUnsaved((id) =>
        railTyped(
            layout.instanceView(id),
            ui.instanceState(id),
            configRail(entities.config()?.config)
        )
    );
    // A Settings tab holding text typed into a field, or an editor draft of a list or a family,
    // that is not yet written holds work no write has taken, which the tab's state keeps beside the
    // rail list.
    ui.registerUnsaved(
        (id) => layout.instanceView(id) === SETTINGS_VIEW && settingsTyped(ui.instanceState(id))
    );
    const paletteSource = createPaletteSource(entities, feeds, {
        writeConfigValue: writes.writeConfigValue,
        layout,
        ui,
        readFileKind: fs.readFileKind,
        opens: {
            holds: (root, path) => apps.holds(root, path),
            editorFor: (root, path) => appShell.opens.editorFor(root, path)
        }
    });
    const editorStatus = createEditorStatus();
    const headings = createHeadings();
    const lsp = createLsp(socket);
    const lspEdits = createLspEdits({
        tabs: () => layout.hosts().flatMap((host) => tabsOf(host.workbench.root)),
        draft: source.sourceDraft,
        edit: source.editSourceDraft,
        read: async (root, path) => {
            const answer = await loadSource(root, path, WRITE_MAX_BYTES);
            if (!answer.ok) return null;
            if (answer.truncated) return 'too_large';
            if (answer.notText) return 'not_text';
            return { text: answer.content, hash: answer.base };
        },
        askHeld: lsp.askHeld,
        publishTabs: lsp.publishTabs,
        write: explorer.lspEdit,
        roots: () => fs.roots(),
        withheld: (place) => isPrivateFile(place, fs.roots(), fs.workspaces().home)
    });
    const refactor = createRefactor({
        lspEdits,
        show: () => void layout.openView(REFACTOR_VIEW)
    });
    movedItems = createLinkRewrite({
        askLinks: lsp.askLinks,
        submit: refactor.submit,
        say: (message) => void notices.post(message, { tone: 'warning' })
    });
    const documents = createDocuments();
    const workspaceSymbols = createWorkspaceSymbols(async (root, path) => {
        const file = await readText(root, path);
        return file.error === '' ? file.text : null;
    });
    const references = createReferences(ui);
    const clangd = createClangd();
    const commands = withQueries(
        'commands',
        createCommands({
            entities,
            writes,
            queries,
            notices,
            terminals,
            onScreen: () => sourceOnScreen(layout.activeInstance(), editorStatus.statusOf),
            focusedSource: () => editorStatus.focused(),
            matchers: (job) =>
                matchersFor(job.matchers ?? [], job.app?.app, entities.apps()?.rows ?? []),
            gitRoots: selectors.gitRoots,
            served: servedRoots,
            openFile: (repo, path, line) => repositories.openFile(repo, path, line),
            askLatex: latex.holdAgain
        })
    );
    // A root that leaves the served roots takes its command diagnostics, its LaTeX states and its
    // lint rows with it. The change is read from the fs store's workspaces, the one state the
    // served roots are made of, and only between two reads of them (`readRoots` is null while they
    // load or failed).
    watchServedRoots(
        () => readRoots(fs.workspaces()),
        (roots) => {
            commands.forgetOutside(roots);
            latex.forgetOutside(roots);
            lint.forgetOutside(roots);
        }
    );
    // The problems the page knows of: the language servers' diagnostics, the errors project
    // commands printed, the LaTeX builds' errors and warnings and the linters' findings. F8 steps
    // from the source tab on screen, or else the one focused last, and leaving a tab tells it its
    // editor lost the keyboard.
    const placeOpener: PlaceOpener = {
        layout: {
            openView: layout.openView,
            keepPreview: layout.keepPreview,
            holds: (tab) =>
                layout
                    .hosts()
                    .some((host) =>
                        tabsOf(host.workbench.root).some((one) =>
                            isInstanceOf(one, 'source', stateId(tab))
                        )
                    )
        },
        source
    };
    const problems = createProblems({
        here: () => {
            const on =
                sourceOnScreen(layout.activeInstance(), editorStatus.statusOf) ??
                editorStatus.focused();
            const caret = on?.status.caret;
            if (on === null || caret === null || caret === undefined) return null;
            const state = layout.instanceLayoutState(on.instance);
            const library = instanceText(state, 'library');
            return {
                instance: on.instance,
                root: instanceText(state, 'root'),
                path: library === '' ? instanceText(state, 'path') : library,
                line: caret.line,
                column: caret.column
            };
        },
        open: (row, { kept, focus, leaving }) => {
            const target = problemTarget(row);
            if (target === null) return;
            if (leaving !== null) autosave.blurred(leaving);
            openPlace(placeOpener, focus ? target : { ...target, focus: false }, kept);
        },
        show: showProblems
    });
    problems.register(languageProblems(documents));
    problems.register(commandProblems(commands, servedRoots));
    problems.register(latexProblems(latex));
    problems.register(lintProblems(lint));
    const railBadges = createRailBadges(
        entities,
        feeds,
        hpc,
        calendar,
        inbox,
        audit,
        problems,
        selectors
    );
    const debug = withQueries(
        'debug',
        createDebug({
            entities,
            writes,
            queries,
            notices,
            commands,
            terminalById: terminals.terminalById,
            showTerminal: (id) => terminals.showTerminal(id),
            stopTerminal: terminals.stopTerminal,
            onScreen: () => sourceOnScreen(layout.activeInstance(), editorStatus.statusOf),
            focusedSource: () => editorStatus.focused(),
            gitRoots: selectors.gitRoots,
            served: servedRoots,
            openFile: (repo, path, line) => repositories.openFile(repo, path, line),
            debugTabs: () => {
                const taken = breakpointLanguages(entities.apps()?.rows ?? []);
                const languages = selectors.languages();
                return layout
                    .hosts()
                    .flatMap((host) => tabsOf(host.workbench.root))
                    .flatMap((tab) => {
                        const file = tab.view === 'source' ? fileOfTab(tab) : null;
                        if (file === null || !taken.includes(languageOf(file.path, languages))) {
                            return [];
                        }
                        return [{ id: tab.id, ...file, dirty: ui.unsaved(tab.id) }];
                    });
            },
            breakpointLanguages: () => breakpointLanguages(entities.apps()?.rows ?? []),
            languageOf: (path) => languageOf(path, selectors.languages()),
            debuggers: () => actingDebuggers(entities.apps()?.rows ?? []),
            draft: source.sourceDraft,
            saveDraft: source.saveSourceDraft,
            openView: (view) => void layout.openView(view),
            focusEditor: (file, line) => {
                const tab = layout.activeInstance();
                if (tab?.view !== 'source' || editorStatus.statusOf(tab.id)?.file !== file) {
                    return false;
                }
                const at = { line: line - 1, character: 0 };
                return editorStatus.ask(tab.id, {
                    kind: 'select',
                    range: { start: at, end: at },
                    focus: true
                });
            },
            focusWindow: () => (desktop === undefined ? window.focus() : desktop.bridge.focusMain())
        })
    );
    // The notifications the channels and the writes post: a session that starts waiting, a job
    // that ends, an update task whose results land, each heard once per message the entities store
    // keeps, and a write that does not land, heard from the writes store.
    const sources = createNoticeSources(notices, {
        openSession: (id, title) => {
            layout.openView('session-detail', { session: id, label: title });
        },
        openView: (view) => {
            layout.openView(view);
        }
    });
    entities.afterReceive(sources.heard);
    writes.onUnwritten(sources.unwritten);
    const registry = createRegistry(layout);
    // A view registered with no catalogue group is one opened for something (a project, a
    // document, a file), and the layout lands it apart from a page's tool views. The registry is
    // built over the layout, so the layout is told the rule once both exist.
    layout.registerOpened((view) => registry.viewFor(view)?.group === '');
    // A view whose registration says `unique` is held once: the layout shows the instance a page or
    // float holds instead of opening a second, and the rule reaches it the same way.
    layout.registerUnique((view) => registry.viewFor(view)?.unique === true);
    // A view whose registration says `dock` opens the first time on an edge or in the Files pane.
    layout.registerPlaced((view) => registry.viewFor(view)?.dock ?? null);
    const appTools = createAppTools({
        payload: entities.appTools,
        rows: () => entities.apps()?.rows ?? [],
        languageMap: selectors.languages,
        post: writes.postCommand,
        say: (message) => void notices.post(message, { tone: 'error' }),
        frame: (run) => {
            if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => run());
            else setTimeout(run, 16);
        },
        activeTerminal: () => {
            const shown = terminals.terminalById(selection.selectedTerminal());
            return shown?.app === undefined ? null : { app: shown.app, id: shown.id };
        }
    });
    const apps = createApps({
        entities,
        writes,
        socket,
        commands: appCommands({ commands, served: servedRoots, primary: fs.primary }),
        ui,
        registry,
        layout,
        notices,
        settings: () => appsSettings(entities.config()?.config ?? {}),
        served: servedRoots,
        projectOf: selectors.projectOf,
        pageId,
        ending: (id) => endingOf(id, terminals.terminals(), entities.debug()),
        unsavedFile: (root, path) => source.unsavedFile(root, path),
        saveAll: autosave.saveEvery,
        showTerminal: (terminal, preserveFocus) =>
            terminals.showTerminal(terminal, '', preserveFocus),
        hideTerminal: terminals.hideTerminal,
        pageCommand: (id, args) =>
            Promise.resolve(
                runPageCommand(
                    {
                        themeNamed: (text) => themeNamed(text, appShell.offers()),
                        setTheme: ui.setTheme,
                        crt: ui.crt,
                        setCrt: ui.setCrt,
                        hasView: (view) => registry.views().some((one) => one.id === view),
                        openView: (view) => void layout.openView(view),
                        projectLabel: (id) => {
                            const project = selectors.projectOf(id);
                            return project === null ? null : (project.short ?? project.title);
                        },
                        openProject: (id, label) => void layout.openView('project', { id, label })
                    },
                    id,
                    args
                )
            )
    });
    const appShell = createAppShell({
        entities,
        post: writes.postCommand,
        notices,
        pageId,
        requests: apps.requests,
        frameItems: apps.frameItems,
        scmItems: appTools.scm.statusItems,
        picture: (app, path) => {
            const row = apps.rowOf(app);
            return row === undefined ? '' : apps.srcOf(row, path);
        },
        runInTab: apps.runInTab,
        holds: apps.holds,
        fileOfTab
    });
    const tabScope: TabScopeStore = {
        wrap: (state, shown) =>
            Object.assign(
                {},
                state,
                Object.fromEntries(
                    [...queried].map(([name, store]) => [name, scopedStore(queries, store, shown)])
                )
            )
    };
    const windows = createWindows(
        layout,
        desktop !== undefined,
        (address) => void window.open(address, '_blank'),
        pageId
    );
    return {
        desktop,
        float,
        pageId,
        owner,
        windows,
        graphviz: createGraphviz(),
        latexReader: createLatexReader(),
        entities,
        writes,
        socket,
        ui,
        layout,
        drag,
        clock,
        changes,
        selection,
        terminals,
        commands,
        debug,
        agents,
        files,
        fs,
        docs,
        latex,
        latexActions,
        deposit,
        transcripts,
        source,
        autosave,
        formDraft,
        pages,
        feeds,
        hpc,
        processes,
        schedule,
        calendar,
        inbox,
        accounts,
        audit,
        memories,
        wallpapers,
        lines,
        present,
        repositories,
        search,
        explorer,
        folders,
        usageRefresh,
        selectors,
        clone,
        railBadges,
        paletteSource,
        editorStatus,
        headings,
        lsp,
        lspEdits,
        refactor,
        workspaceSymbols,
        documents,
        problems,
        lint,
        references,
        clangd,
        notices,
        registry,
        apps,
        appShell,
        appTools,
        tabScope
    };
}
