// Layer 2, client state. The shape of the client object: every store one page holds, and the copy
// of them a tab provides for its subtree. state/client/context.ts builds the object, in dependency
// order, and re-exports these types, so a module that names the client's type reads it from there.

import type { RegistryStore } from '../../workbench/navigation/registry.ts';
import type { AgentsStore } from '../../sessions/agents.svelte.ts';
import type { ChangesStore } from '../../sessions/changes.svelte.ts';
import type { AppsStore } from '../../system/apps/apps.svelte.ts';
import type { AppShellStore } from '../../system/apps/shell/shell.svelte.ts';
import type { AuditStore } from '../../system/audit.svelte.ts';
import type { AccountsStore } from '../../life/accounts.svelte.ts';
import type { CalendarStore } from '../../life/calendar.svelte.ts';
import type { ClockStore } from '../clock.svelte.ts';
import type { DepositStore } from '../../system/deposit.svelte.ts';
import type { DocsStore } from '../../system/docs.svelte.ts';
import type { DragStore } from '../../workbench/drag.svelte.ts';
import type { EditorStatusStore } from '../../workbench/navigation/editor-status.svelte.ts';
import type { HeadingsStore } from '../../sources/explorer/sections/headings.svelte.ts';
import type { EntitiesStore } from '../entities.svelte.ts';
import type { FeedsStore } from '../../feeds/feeds.svelte.ts';
import type { FilesStore } from '../../sources/files.svelte.ts';
import type { FolderPages } from '../../workbench/layout/open/float/folder-opener.ts';
import type { FsStore } from '../../sources/fs.svelte.ts';
import type { HpcStore } from '../../system/machine/hpc/hpc.svelte.ts';
import type { ProcessesStore } from '../../system/machine/processes/processes.svelte.ts';
import type { ScheduleStore } from '../../system/machine/schedules/schedule.svelte.ts';
import type { InboxStore } from '../../feeds/inbox.svelte.ts';
import type { LatexActions } from '../../sessions/latex/actions.ts';
import type { LatexStore } from '../../sessions/latex/latex.svelte.ts';
import type { Desktop } from '../../shared/stores/desktop.ts';
import type { Windows } from '../../workbench/layout/open/float/browser.ts';
import type { LayoutStore } from '../../workbench/layout.svelte.ts';
import type { LinesStore } from '../../system/lines.svelte.ts';
import type { ManifestDraftStore } from '../../forms/manifest-draft.ts';
import type { MemoriesStore } from '../../life/memories.svelte.ts';
import type { NoticesStore } from '../../workbench/navigation/notices.svelte.ts';
import type { PaletteSourceStore } from '../../workbench/palette-source.svelte.ts';
import type { PresentStore } from '../../life/present.svelte.ts';
import type { RailBadgesStore } from '../../workbench/rail-badges.svelte.ts';
import type { RepositoriesStore } from '../../sources/repositories/repositories.svelte.ts';
import type { SelectionStore } from '../../workbench/selection.svelte.ts';
import type { ExplorerStore } from '../../sources/explorer/ops.svelte.ts';
import type { SearchStore } from '../../sources/search/search.svelte.ts';
import type { LintStore } from '../../system/machine/lint/lint.svelte.ts';
import type { ClangdStore } from '../../system/machine/lsp/clangd.svelte.ts';
import type { DocumentsStore } from '../../system/machine/lsp/documents.svelte.ts';
import type { ProblemsStore } from '../../system/problems.svelte.ts';
import type { LspEdits } from '../../system/machine/lsp/edits.ts';
import type { RefactorStore } from '../../system/machine/refactor/preview.svelte.ts';
import type { WorkspaceSymbolsStore } from '../../system/machine/lsp/workspace-symbols.ts';
import type { LspStore } from '../../system/machine/lsp/lsp.svelte.ts';
import type { ReferencesStore } from '../../system/machine/lsp/references.svelte.ts';
import type { SelectorsStore } from '../selectors.svelte.ts';
import type { SocketStore } from '../socket.svelte.ts';
import type { AutosaveStore } from '../../sessions/source/autosave.svelte.ts';
import type { SourceStore } from '../../sessions/source/source.svelte.ts';
import type { TerminalsStore } from '../../sessions/terminals.svelte.ts';
import type { CommandsStore } from '../../sessions/terminal/commands.svelte.ts';
import type { TranscriptsStore } from '../../sessions/transcript.svelte.ts';
import type { UiStore } from '../../workbench/ui.svelte.ts';
import type { DebugStore } from '../../system/machine/debug/debug.svelte.ts';
import type { UsageRefreshStore } from '../../system/machine/usage/usage-refresh.svelte.ts';
import type { WritesStore } from '../writes.svelte.ts';
import type { GraphvizLoader } from '../../boards/structure/layout.ts';
import type { LatexReader } from '../../sources/explorer/sections/outline.ts';

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
    /** What the app gave this page: its bridge and the float it draws; undefined in a browser. */
    desktop: Desktop | undefined;
    /** The float this page draws alone in a window of its own, in the app or a browser tab. */
    float: string | null;
    /** The id of this page when it is a main page, which the windows it opens carry as `owner`. */
    pageId: string;
    /** The id of the main page that opened the window this page draws a float in, else null. */
    owner: string | null;
    /** Put a tab in a window of its own. */
    windows: Windows;
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
    /** The debugger: its session, console, breakpoints and launch configurations. */
    debug: DebugStore;
    /** The composer's choices, the Customizations section's rows, and a session's export. */
    agents: AgentsStore;
    files: FilesStore;
    fs: FsStore;
    docs: DocsStore;
    latex: LatexStore;
    /** What a reader does with a LaTeX file or its PDF: build, view the PDF, SyncTeX. */
    latexActions: LatexActions;
    deposit: DepositStore;
    transcripts: TranscriptsStore;
    source: SourceStore;
    /** Saving a source tab by `editor.autosave`: the editor's blur reaches it here. */
    autosave: AutosaveStore;
    manifestDraft: ManifestDraftStore;
    feeds: FeedsStore;
    hpc: HpcStore;
    processes: ProcessesStore;
    schedule: ScheduleStore;
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
    /** The workbench: a page that belongs to one folder, opened and made again here. */
    folders: FolderPages;
    usageRefresh: UsageRefreshStore;
    selectors: SelectorsStore;
    railBadges: RailBadgesStore;
    paletteSource: PaletteSourceStore;
    /** What each source tab says of its text, for the status bar, and what the bar asks of it. */
    editorStatus: EditorStatusStore;
    /** The headings a rendered tab shows, for the Outline, and the Outline's presses on them. */
    headings: HeadingsStore;
    /** The language servers: their channels, states, choices and logs. */
    lsp: LspStore;
    /** The edits the language servers ask for, and the files this page's tabs hold open. */
    lspEdits: LspEdits;
    /** The Refactor Preview: an edit a server asked for, shown before it is made. */
    refactor: RefactorStore;
    /** The symbol queries a source tab's server answers, for the palette's `#` list. */
    workspaceSymbols: WorkspaceSymbolsStore;
    /** The diagnostics of the files and the document symbols of the source tabs. */
    documents: DocumentsStore;
    /** The problems of every source folded: the Problems view, the status bar and the F8 walk. */
    problems: ProblemsStore;
    lint: LintStore;
    /** The References view's results, history and walk. */
    references: ReferencesStore;
    /** What clangd answered a tab for the Files view's AST and Memory Usage sections. */
    clangd: ClangdStore;
    /** The notifications the status bar's bell counts and its centre lists. */
    notices: NoticesStore;
    registry: RegistryStore;
    /** The apps found while oculus runs, and the frames drawn for them. */
    apps: AppsStore;
    /**
     * What the apps added to the shell: commands, keys, menus, views and the hosts' registrations.
     */
    appShell: AppShellStore;
    /** The copy of these stores a tab provides for its subtree. */
    tabScope: TabScopeStore;
};
