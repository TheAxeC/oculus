// Layer 2, client state. Every store one page holds, built once at the root and handed down.
//
// Each store module exports a factory over its own collections, and this is the one place the
// instances are made and wired to each other: a store that reads another is given it rather than
// importing it. The root provides the object through Svelte's context (state/client/use.ts) and
// every view, shell component and route reads it from there, which is what makes two clients, and
// two test cases, share nothing.
//
// The three catalogs are not here. state/words/text.ts, state/words/tones.ts and
// state/words/appearance.ts hold what the server last sent in module variables, are never written
// after a push installs them, and are read by t(), toneOf() and themes() from every layer including
// `ui/`, where there is no client object to read them from; state/client/generation.svelte.ts and
// state/words/glyphmode.svelte.ts are the two runes that make those reads reactive and belong with
// them for the same reason.

import { createRegistry, type RegistryStore } from '../../views/registry.ts';
import { createTipIds, type TipIds } from '../../ui/menu/tip-ids.ts';
import { createChanges, type ChangesStore } from '../sessions/changes.svelte.ts';
import { createAudit, type AuditStore } from '../system/audit.svelte.ts';
import { createCalendar, type CalendarStore } from '../life/calendar.svelte.ts';
import { createClock, type ClockStore } from './clock.svelte.ts';
import { createDeposit, type DepositStore } from '../system/deposit.svelte.ts';
import { createDocs, type DocsStore } from '../system/docs.svelte.ts';
import { createDrag, type DragStore } from '../workbench/drag.svelte.ts';
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
import { BOOKMARK_COLLECTION, createFs, type FsStore } from '../sources/fs.svelte.ts';
import {
    FILES_VIEW,
    bookmarkLeft,
    filesLineTyped,
    filesViewOf,
    patchedFilesView,
    type FilesForms
} from '../sources/fs.ts';
import { createHpc, type HpcStore } from '../system/hpc.svelte.ts';
import { createInbox, type InboxStore } from '../feeds/inbox.svelte.ts';
import { tabsOf } from './instance.ts';
import { createLatex, type LatexStore } from '../sessions/latex.svelte.ts';
import { createLayout, type LayoutStore } from '../workbench/layout.svelte.ts';
import { createManifestDraft, type ManifestDraftStore } from '../forms/manifest-draft.ts';
import { createMemories, type MemoriesStore } from '../life/memories.svelte.ts';
import {
    createPaletteSource,
    type PaletteSourceStore
} from '../workbench/palette-source.svelte.ts';
import { createPresent, type PresentStore } from '../life/present.svelte.ts';
import { configRail, railTyped } from '../workbench/navigation/rail.ts';
import { createRailBadges, type RailBadgesStore } from '../workbench/rail-badges.svelte.ts';
import { createRepositories, type RepositoriesStore } from '../sources/repositories.svelte.ts';
import { createSelection, type SelectionStore } from '../workbench/selection.svelte.ts';
import { createSearch, type SearchStore } from '../sources/search.svelte.ts';
import { createSelectors, type SelectorsStore } from './selectors.svelte.ts';
import { createSocket, type SocketStore } from './socket.svelte.ts';
import { createSource, type SourceStore } from '../sessions/source.svelte.ts';
import { createTerminals, type TerminalsStore } from '../sessions/terminals.svelte.ts';
import { createTranscripts, type TranscriptsStore } from '../sessions/transcript.svelte.ts';
import { createUi, type UiStore } from '../workbench/ui.svelte.ts';
import { createUsageRefresh, type UsageRefreshStore } from '../system/usage-refresh.svelte.ts';
import { createWrites, type WritesStore } from './writes.svelte.ts';

/** Every store one client holds, one instance of each. */
export type ClientState = {
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
    calendar: CalendarStore;
    inbox: InboxStore;
    audit: AuditStore;
    memories: MemoriesStore;
    present: PresentStore;
    repositories: RepositoriesStore;
    search: SearchStore;
    usageRefresh: UsageRefreshStore;
    selectors: SelectorsStore;
    railBadges: RailBadgesStore;
    paletteSource: PaletteSourceStore;
    registry: RegistryStore;
    /** The tooltip ids of the page, which `ui/` reads through its own context. */
    tipIds: TipIds;
};

/**
 * One client's stores, built in dependency order: a store is made after everything it reads, and is
 * handed those instances here. Nothing else wires one store to another.
 */
export function createClientState(): ClientState {
    const entities = createEntities();
    const writes = createWrites(() => entities.config()?.config ?? null);
    const socket = createSocket(entities, writes);
    const ui = createUi();
    const formDrafts = createFormDrafts(ui, snapshotEntries(entities.portfolio));
    // A tab's close, a pane's close and a page's close forget the state of every instance they take
    // away, and the layout is the one store that knows an instance closed. The entry forms of an
    // instance keep their drafts in an entry of their own beside that state, so the layout is
    // handed a forget that takes all three, with the entries its add forms made and the mark saying
    // a save from one of its forms is out.
    const layout = createLayout({
        ...ui,
        clearInstanceState: (id: string) => {
            ui.clearInstanceState(id);
            ui.clearInstanceState(formsKey(id));
            ui.clearInstanceState(addedKey(id));
            formDrafts.forgetForms(id);
        }
    });
    const drag = createDrag(layout);
    const clock = createClock();
    const changes = createChanges();
    const selection = createSelection();
    const terminals = createTerminals(entities, socket, writes);
    const files = createFiles(entities);
    // The file browser's bookmark forms are the fs store's to close: it is what learns that a
    // bookmark has left the file, and a form over one that is gone has nothing to draw and nothing
    // to save into. Which file browsers there are, what each one has open and how one is moved are
    // the layout's, the ui store's and the form drafts' and are handed to it here. The entities
    // store is handed to it for the `files` channel, which is what says the bookmarks file changed
    // on disk.
    const fs = createFs(
        writes,
        {
            browsers: () =>
                layout
                    .pages()
                    .flatMap((page) => tabsOf(page.workbench.root))
                    .filter((tab) => tab.view === FILES_VIEW)
                    .map((tab) => ({ id: tab.id, forms: filesViewOf(ui.instanceState(tab.id)) })),
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
        },
        entities
    );
    const docs = createDocs(entities);
    const latex = createLatex(entities, terminals, fs);
    const deposit = createDeposit();
    const transcripts = createTranscripts();
    const source = createSource(writes, ui);
    // The pane asks the instance id whether a tab holds unsaved text before it closes it, and asks
    // the ui store rather than the source store, which the shell may not read.
    ui.registerUnsaved(source.sourceDirty);
    ui.registerUnsaved(formDrafts.formsDirty);
    const feeds = createFeeds(entities);
    const hpc = createHpc(entities, writes);
    const calendar = createCalendar(entities, writes, clock);
    const inbox = createInbox(entities, writes);
    const audit = createAudit(entities);
    const memories = createMemories();
    const present = createPresent(entities);
    const repositories = createRepositories(writes, terminals, layout);
    const search = createSearch(entities, writes, ui);
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
    const railBadges = createRailBadges(entities, feeds, hpc, calendar, inbox, audit, selectors);
    const paletteSource = createPaletteSource(entities, feeds);
    const registry = createRegistry(layout);
    const tipIds = createTipIds();
    return {
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
        calendar,
        inbox,
        audit,
        memories,
        present,
        repositories,
        search,
        usageRefresh,
        selectors,
        railBadges,
        paletteSource,
        registry,
        tipIds
    };
}
