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
import { createClock, type ClockStore } from './clock.svelte.ts';
import { createDeposit, type DepositStore } from './deposit.svelte.ts';
import { createDocs, type DocsStore } from './docs.svelte.ts';
import { createDrag, type DragStore } from './drag.svelte.ts';
import { createEntities, type EntitiesStore } from './entities.svelte.ts';
import { createFeeds, type FeedsStore } from './feeds.svelte.ts';
import { createFiles, type FilesStore } from './files.svelte.ts';
import { createFs, type FsStore } from './fs.svelte.ts';
import { createHpc, type HpcStore } from './hpc.svelte.ts';
import { createLayout, type LayoutStore } from './layout.svelte.ts';
import { createPaletteSource, type PaletteSourceStore } from './palette-source.svelte.ts';
import { createRailBadges, type RailBadgesStore } from './rail-badges.svelte.ts';
import { createSelection, type SelectionStore } from './selection.svelte.ts';
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
    selection: SelectionStore;
    terminals: TerminalsStore;
    files: FilesStore;
    fs: FsStore;
    docs: DocsStore;
    deposit: DepositStore;
    transcripts: TranscriptsStore;
    source: SourceStore;
    feeds: FeedsStore;
    hpc: HpcStore;
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
    const layout = createLayout(ui);
    const drag = createDrag(layout);
    const clock = createClock();
    const selection = createSelection();
    const terminals = createTerminals(entities, socket, writes);
    const files = createFiles(entities);
    const fs = createFs(writes);
    const docs = createDocs(entities);
    const deposit = createDeposit();
    const transcripts = createTranscripts();
    const source = createSource(writes, ui);
    const feeds = createFeeds(entities);
    const hpc = createHpc(entities, writes);
    const usageRefresh = createUsageRefresh(entities, writes);
    const selectors = createSelectors(entities, layout, selection);
    const railBadges = createRailBadges(entities, feeds, hpc, selectors);
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
        selection,
        terminals,
        files,
        fs,
        docs,
        deposit,
        transcripts,
        source,
        feeds,
        hpc,
        usageRefresh,
        selectors,
        railBadges,
        paletteSource,
        registry,
        tipIds
    };
}
