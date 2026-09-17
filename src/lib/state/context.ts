// Layer 2, client state. Every store one page holds, built once at the root and handed down.
//
// Each store module exports a factory over its own collections, and this is the one place the
// instances are made and wired to each other: a store that reads another is given it rather than
// importing it. The root provides the object through Svelte's context (state/use.ts) and every
// view, shell component and route reads it from there, which is what makes two clients, and two
// test cases, share nothing.
//
// The three catalogs are not here. state/text.ts, state/tones.ts and state/appearance.ts hold what
// the server last sent in module variables, are never written after a push installs them, and are
// read by t(), toneOf() and themes() from every layer including `ui/`, where there is no client
// object to read them from; state/generation.svelte.ts and state/glyphmode.svelte.ts are the two
// runes that make those reads reactive and belong with them for the same reason.

import { createRegistry, type RegistryStore } from '../views/registry.ts';
import { createTipIds, type TipIds } from '../ui/tip-ids.ts';
import { createChanges, type ChangesStore } from './changes.svelte.ts';
import { createAudit, type AuditStore } from './audit.svelte.ts';
import { createCalendar, type CalendarStore } from './calendar.svelte.ts';
import { createClock, type ClockStore } from './clock.svelte.ts';
import { createDeposit, type DepositStore } from './deposit.svelte.ts';
import { createDocs, type DocsStore } from './docs.svelte.ts';
import { createDrag, type DragStore } from './drag.svelte.ts';
import { createEntities, type EntitiesStore } from './entities.svelte.ts';
import { createFeeds, type FeedsStore } from './feeds.svelte.ts';
import { createFiles, type FilesStore } from './files.svelte.ts';
import {
    createFormDrafts,
    formsKey,
    snapshotEntries,
    type FormDraftsStore
} from './form-drafts.svelte.ts';
import { createFs, type FsStore } from './fs.svelte.ts';
import { createHpc, type HpcStore } from './hpc.svelte.ts';
import { createInbox, type InboxStore } from './inbox.svelte.ts';
import { createLatex, type LatexStore } from './latex.svelte.ts';
import { createLayout, type LayoutStore } from './layout.svelte.ts';
import { createManifestDraft, type ManifestDraftStore } from './manifest-draft.ts';
import { createMemories, type MemoriesStore } from './memories.svelte.ts';
import { createPaletteSource, type PaletteSourceStore } from './palette-source.svelte.ts';
import { createPresent, type PresentStore } from './present.svelte.ts';
import { createRailBadges, type RailBadgesStore } from './rail-badges.svelte.ts';
import { createRepositories, type RepositoriesStore } from './repositories.svelte.ts';
import { createSelection, type SelectionStore } from './selection.svelte.ts';
import { createSearch, type SearchStore } from './search.svelte.ts';
import { createSelectors, type SelectorsStore } from './selectors.svelte.ts';
import { createSocket, type SocketStore } from './socket.svelte.ts';
import { createSource, type SourceStore } from './source.svelte.ts';
import { createTerminals, type TerminalsStore } from './terminals.svelte.ts';
import { createTranscripts, type TranscriptsStore } from './transcript.svelte.ts';
import { createUi, type UiStore } from './ui.svelte.ts';
import { createUsageRefresh, type UsageRefreshStore } from './usage-refresh.svelte.ts';
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
    const writes = createWrites();
    const socket = createSocket(entities, writes);
    const ui = createUi();
    const formDrafts = createFormDrafts(ui, snapshotEntries(entities.portfolio));
    // A tab's close forgets its instance's state, and the layout is the one store that knows a tab
    // closed. The entry forms of an instance keep their drafts in an entry of their own beside that
    // state, so the layout is handed a forget that takes both.
    const layout = createLayout({
        ...ui,
        clearInstanceState: (id: string) => {
            ui.clearInstanceState(id);
            ui.clearInstanceState(formsKey(id));
        }
    });
    const drag = createDrag(layout);
    const clock = createClock();
    const changes = createChanges();
    const selection = createSelection();
    const terminals = createTerminals(entities, socket, writes);
    const files = createFiles(entities);
    const fs = createFs(writes);
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
