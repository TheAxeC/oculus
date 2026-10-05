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

import { createRegistry, type RegistryStore } from '../workbench/navigation/registry.ts';
import { createAgents, type AgentsStore } from '../sessions/agents.svelte.ts';
import { createChanges, type ChangesStore } from '../sessions/changes.svelte.ts';
import { createAudit, type AuditStore } from '../system/audit.svelte.ts';
import { createAccounts, type AccountsStore } from '../life/accounts.svelte.ts';
import { createCalendar, type CalendarStore } from '../life/calendar.svelte.ts';
import { createClock, type ClockStore } from './clock.svelte.ts';
import { createDeposit, type DepositStore } from '../system/deposit.svelte.ts';
import { createDocs, type DocsStore } from '../system/docs.svelte.ts';
import { createDrag, type DragStore } from '../workbench/drag.svelte.ts';
import {
    createEditorStatus,
    sourceOnScreen,
    type EditorStatusStore
} from '../workbench/navigation/editor-status.svelte.ts';
import {
    createHeadings,
    type HeadingsStore
} from '../sources/explorer/sections/headings.svelte.ts';
import { createEntities, type EntitiesStore } from './entities.svelte.ts';
import { createFeeds, type FeedsStore } from '../feeds/feeds.svelte.ts';
import { createFiles, type FilesStore } from '../sources/files.svelte.ts';
import {
    addedKey,
    createFormDrafts,
    formKey,
    formsKey,
    snapshotEntries,
    type FormDraftsStore
} from '../forms/form-drafts.svelte.ts';
import { cardTreePrefix } from '../sources/explorer/view/card-tree.ts';
import { BOOKMARK_COLLECTION, createFs, type FsStore } from '../sources/fs.svelte.ts';
import {
    FILES_VIEW,
    bookmarkLeft,
    filesLineTyped,
    filesViewOf,
    patchedFilesView,
    type FilesForms
} from '../sources/fs.ts';
import { createHpc, type HpcStore } from '../system/machine/hpc.svelte.ts';
import { createProcesses, type ProcessesStore } from '../system/machine/processes.svelte.ts';
import { createInbox, type InboxStore } from '../feeds/inbox.svelte.ts';
import { tabsOf } from '../workbench/layout/instance.ts';
import { paneAt } from '../workbench/layout/index.ts';
import { createLatex, type LatexStore } from '../sessions/latex.svelte.ts';
import { createLayout, type LayoutStore } from '../workbench/layout.svelte.ts';
import { createLines, type LinesStore } from '../system/lines.svelte.ts';
import { createManifestDraft, type ManifestDraftStore } from '../forms/manifest-draft.ts';
import { createMemories, type MemoriesStore } from '../life/memories.svelte.ts';
import { createNotices, type NoticesStore } from '../workbench/navigation/notices.svelte.ts';
import { createNoticeSources } from '../workbench/navigation/notice-sources.ts';
import {
    createPaletteSource,
    type PaletteSourceStore
} from '../workbench/palette-source.svelte.ts';
import { createPresent, type PresentStore } from '../life/present.svelte.ts';
import { SETTINGS_VIEW, configRail, railTyped } from '../workbench/navigation/rail.ts';
import { settingsTyped } from '../system/config/typed.ts';
import { createRailBadges, type RailBadgesStore } from '../workbench/rail-badges.svelte.ts';
import {
    createRepositories,
    DIFF_VIEW,
    type RepositoriesStore
} from '../sources/repositories/repositories.svelte.ts';
import { heldDiff } from '../sources/repositories/repositories.ts';
import { createSelection, type SelectionStore } from '../workbench/selection.svelte.ts';
import { createExplorer, type ExplorerStore } from '../sources/explorer/ops.svelte.ts';
import { createSearch, type SearchStore } from '../sources/search/search.svelte.ts';
import { createSelectors, type SelectorsStore } from './selectors.svelte.ts';
import { createSocket, type SocketStore } from './socket.svelte.ts';
import { createSource, type SourceStore } from '../sessions/source.svelte.ts';
import {
    createTerminals,
    terminalLabel,
    type TerminalsStore
} from '../sessions/terminals.svelte.ts';
import { createCommands, type CommandsStore } from '../sessions/terminal/commands.svelte.ts';
import { TERMINAL_VIEW } from '../sessions/terminal/terminal-tabs.ts';
import { createTranscripts, type TranscriptsStore } from '../sessions/transcript.svelte.ts';
import { createUi, type UiStore } from '../workbench/ui.svelte.ts';
import {
    createUsageRefresh,
    type UsageRefreshStore
} from '../system/machine/usage-refresh.svelte.ts';
import { createQueries } from './queries.svelte.ts';
import type { Queries } from '../shared/stores/shapes.ts';
import { createWrites, type WritesStore } from './writes.svelte.ts';
import { createGraphviz, type GraphvizLoader } from '../boards/structure/layout.ts';
import { createLatexReader, type LatexReader } from '../sources/explorer/sections/outline.ts';

/** What a tab needs of the client to hide its reads while it is hidden. */
export type TabScopeStore = {
    /**
     * A copy of `state` in which each store that reads through the query client runs every
     * function member in the scope of `shown`, so a tab asks nothing through it while `shown`
     * answers false. Every other store of the copy is the original instance.
     */
    wrap: (state: ClientState, shown: () => boolean) => ClientState;
};

/** Every store one client holds, one instance of each. */
export type ClientState = {
    graphviz: GraphvizLoader;
    /** The LaTeX reader the Files Outline reads with, which loads the parser on its first call. */
    latexReader: LatexReader;
    entities: EntitiesStore;
    writes: WritesStore;
    socket: SocketStore;
    ui: UiStore;
    layout: LayoutStore;
    drag: DragStore;
    clock: ClockStore;
    changes: ChangesStore;
    selection: SelectionStore;
    terminals: TerminalsStore;
    /** The project commands of the repositories, and the questions a run asks. */
    commands: CommandsStore;
    /** The composer's choices, the Customizations section's rows, and a session's export. */
    agents: AgentsStore;
    files: FilesStore;
    fs: FsStore;
    docs: DocsStore;
    latex: LatexStore;
    deposit: DepositStore;
    transcripts: TranscriptsStore;
    source: SourceStore;
    formDrafts: FormDraftsStore;
    manifestDraft: ManifestDraftStore;
    feeds: FeedsStore;
    hpc: HpcStore;
    processes: ProcessesStore;
    calendar: CalendarStore;
    inbox: InboxStore;
    /** The Calendar's and the Inbox's accounts, and the account setup page. */
    accounts: AccountsStore;
    audit: AuditStore;
    memories: MemoriesStore;
    /** The Status view's line counts of oculus's own files. */
    lines: LinesStore;
    present: PresentStore;
    repositories: RepositoriesStore;
    search: SearchStore;
    /** The Files view's file operations, clipboard and compare selection. */
    explorer: ExplorerStore;
    usageRefresh: UsageRefreshStore;
    selectors: SelectorsStore;
    railBadges: RailBadgesStore;
    paletteSource: PaletteSourceStore;
    /** What each source tab says of its text, for the status bar, and what the bar asks of it. */
    editorStatus: EditorStatusStore;
    /** The headings a rendered tab shows, for the Outline, and the Outline's presses on them. */
    headings: HeadingsStore;
    /** The notifications the status bar's bell counts and its centre lists. */
    notices: NoticesStore;
    registry: RegistryStore;
    /** The copy of these stores a tab provides for its subtree. */
    tabScope: TabScopeStore;
};

/**
 * A store with each function member run in the scope of `shown` and every other member as it was.
 * The store is read when the copy is made, so a member that is replaced later is not followed.
 */
function scopedStore(
    queries: Queries,
    store: Record<string, unknown>,
    shown: () => boolean
): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(store).map(([member, value]) => [
            member,
            typeof value === 'function'
                ? (...args: unknown[]): unknown =>
                      queries.scoped(shown, () => {
                          const answer: unknown = Reflect.apply(value, store, args);
                          return answer;
                      })
                : value
        ])
    );
}

/**
 * One client's stores, built in dependency order: a store is made after everything it reads, and is
 * handed those instances here. Nothing else wires one store to another.
 */
export function createClientState(): ClientState {
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
    const writes = createWrites(() => entities.config()?.config ?? null);
    const socket = createSocket(entities, writes);
    const ui = createUi(writes.writeConfigKey);
    const formDrafts = createFormDrafts(ui, snapshotEntries(entities.portfolio));
    // A tab's close, a pane's close and a page's close forget the state of every instance they take
    // away, and the layout is the one store that knows an instance closed. The entry forms of an
    // instance keep their drafts in an entry of their own beside that state, and the project cards
    // it draws keep their file trees in records under its id, so the layout is handed a forget
    // that takes all of them, with the entries its add forms made and the mark saying
    // a save from one of its forms is out, and the Search store lets go of a closed tab's requests.
    const layout = createLayout({
        ...ui,
        clearInstanceState: (id: string) => {
            ui.clearInstanceState(id);
            ui.clearInstanceState(formsKey(id));
            ui.clearInstanceState(addedKey(id));
            ui.clearInstanceStates(cardTreePrefix(id));
            formDrafts.forgetForms(id);
            search.forgetSearch(id);
        }
    });
    const drag = createDrag(layout);
    const clock = createClock();
    const changes = withQueries('changes', createChanges(queries));
    const selection = createSelection();
    // A terminal belongs to exactly one Terminal tab, on whichever page or float it is, and a
    // hidden page mounts no view, so the terminals store is handed the Terminal tabs of every page
    // and float and the layout's ways to change them, and keeps the ownership itself: a terminal
    // shown, moved or ended changes the tabs of any page. A tab it opens is opened on the page it
    // names; its state carries an identity of its own, so the layout opens it rather than
    // activating another Terminal tab.
    const terminals = createTerminals(entities, socket, writes, {
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
        open: (page, state) => layout.openView(TERMINAL_VIEW, state, page),
        close: (id, page) => layout.closeInstance(id, page),
        instanceState: (id) => ui.instanceState(id),
        setInstanceState: (id, state) => ui.setInstanceState(id, state),
        selected: selection.selected,
        select: selection.select,
        hubRoot: () => selectors.hubRoot(),
        portfolioHeard: () => entities.portfolio() !== null,
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
    const files = withQueries('files', createFiles(entities, queries));
    // The file browser's bookmark forms are the fs store's to close: it is what learns that a
    // bookmark has left the file, and a form over one that is gone has nothing to draw and nothing
    // to save into. Which file browsers there are, what each one has open and how one is moved are
    // the layout's, the ui store's and the form drafts' and are handed to it here. The entities
    // store is handed to it for the `files` channel, which is what says the bookmarks file changed
    // on disk.
    const fsForms = {
        browsers: () =>
            layout
                .hosts()
                .flatMap((host) => tabsOf(host.workbench.root))
                .filter((tab) => tab.view === FILES_VIEW)
                .map((tab) => ({
                    id: tab.id,
                    forms: filesViewOf(ui.instanceState(tab.id))
                })),
        saving: (owner: string, editing: string) =>
            formDrafts.formsSaving(owner).includes(formKey(BOOKMARK_COLLECTION, editing)),
        shift: (owner: string, now: FilesForms, next: FilesForms) => {
            const left = bookmarkLeft(now, next);
            if (left !== null && left.editing === '') {
                formDrafts.toggleAdd(owner, BOOKMARK_COLLECTION, true);
            } else if (left !== null) {
                formDrafts.toggleEdit(owner, BOOKMARK_COLLECTION, left.editing, next.editing);
            }
            ui.setInstanceState(owner, patchedFilesView(ui.instanceState(owner), next));
        }
    };
    const fs = withQueries('fs', createFs(writes, fsForms, entities, queries));
    const docs = withQueries('docs', createDocs(entities, queries));
    const latex = withQueries('latex', createLatex(entities, terminals, fs, queries, writes));
    const deposit = withQueries('deposit', createDeposit(queries));
    const transcripts = withQueries('transcripts', createTranscripts(queries));
    // A saved file may be a LaTeX file whose main builds on save, which the latex store decides.
    const source = createSource(writes, ui, (root, path) => {
        fs.markText(root, path);
        void latex.onSaved(root, path);
    });
    // The pane asks the instance id whether a tab holds unsaved text before it closes it, and asks
    // the ui store rather than the source store, which the shell may not read.
    ui.registerUnsaved(source.sourceDirty);
    ui.registerUnsaved(formDrafts.formsDirty);
    const feeds = createFeeds(entities);
    const hpc = createHpc(entities, writes);
    const processes = createProcesses(entities, {
        terminalById: terminals.terminalById,
        label: terminalLabel,
        endTerminals: terminals.endTerminals
    });
    const calendar = createCalendar(entities, writes, clock);
    const inbox = createInbox(entities, writes);
    const accounts = createAccounts(entities, writes, (view) => void layout.openView(view));
    const audit = createAudit(entities);
    const memories = withQueries('memories', createMemories(queries));
    const lines = withQueries('lines', createLines(queries));
    const present = createPresent(entities);
    // The Source Control views open a repository's file in a source tab by the root the file routes
    // serve it under, and point the Repositories view at a commit through its remembered state.
    const repositories = createRepositories(writes, terminals, layout, {
        served: () => fs.workspaces().workspaces.flatMap((workspace) => workspace.roots),
        instanceState: ui.instanceState,
        setInstanceState: ui.setInstanceState
    });
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
        source
    );
    const search = createSearch(entities, writes, ui, explorer, {
        open: repositories.openDiff,
        shown: () =>
            layout
                .hosts()
                .flatMap((host) => tabsOf(host.workbench.root))
                .some((tab) => tab.view === DIFF_VIEW && heldDiff(tab.state).replace !== undefined)
    });
    const usageRefresh = createUsageRefresh(entities, writes);
    const selectors = createSelectors(entities, layout, selection);
    const manifestDraft = createManifestDraft(ui, selectors.projectOf);
    ui.registerUnsaved(manifestDraft.manifestDirty);
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
    const railBadges = createRailBadges(entities, feeds, hpc, calendar, inbox, audit, selectors);
    const paletteSource = createPaletteSource(entities, feeds, {
        writeConfigValue: writes.writeConfigValue,
        layout,
        ui
    });
    const editorStatus = createEditorStatus();
    const headings = createHeadings();
    const notices = createNotices(ui);
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
            gitRoots: selectors.gitRoots,
            served: () => fs.workspaces().workspaces.flatMap((workspace) => workspace.roots),
            openFile: (repo, path, line) => repositories.openFile(repo, path, line)
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
    return {
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
        agents,
        files,
        fs,
        docs,
        latex,
        deposit,
        transcripts,
        source,
        formDrafts,
        manifestDraft,
        feeds,
        hpc,
        processes,
        calendar,
        inbox,
        accounts,
        audit,
        memories,
        lines,
        present,
        repositories,
        search,
        explorer,
        usageRefresh,
        selectors,
        railBadges,
        paletteSource,
        editorStatus,
        headings,
        notices,
        registry,
        tabScope
    };
}
