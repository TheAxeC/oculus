// Layer 3, view partial of the file view. The PDF viewer: PDF.js's `PDFViewer` over one box of the
// page, with the state its controls read.
//
// The box is the one the frame layer draws (shell/frames/FrameLayer.svelte, the kind `viewer`), so
// a pane added, a tab moved or a page switched never draws the box again and the document, the page
// shown, the zoom and the scroll stay as they were. The view that owns the tab mounts a viewer in
// the box once (`new PdfViewer`), hands it to the tab frames store, and reads it from there; the
// viewer holds no view and imports no store, so what it needs of the page comes in as hooks.
//
// `open(url, key, saved, own)` loads a document. The key names the file: a call with the key of the
// file shown reloads it in place and puts the viewer back at the place it was at (the page, the
// offset in the page, the zoom, the scroll and spread modes and the side panel), which is how a
// rebuilt PDF is drawn. When `own`, the place the page keeps for this tab, is one the viewer did
// not send and the box is hidden, another page wrote it (a window the tab was in), and the viewer
// goes there; a viewer in view keeps its place. A call while no document is held opens at `saved`,
// the place the page kept for the tab or the file, or at the first page at the zoom the reader
// chose when it has none. A load that a later call overtook, or that ends after `dispose`, draws
// nothing. A document that cannot be read leaves the viewer in a state that says why, with the old
// document still behind it until a new one loads.
//
// The viewer reports the place the reader is at through the `placed` hook, so the page can keep it.
// A change of page that is no scroll (a page entry, Next, a link), of zoom, of a mode or of the
// panel is reported on PDF.js's next `updateviewarea`, which carries the new offset; the offset
// while the reader scrolls, and a page change that comes of the scroll, is reported at most once in
// 500 ms, the last one always. Nothing is reported before the place a load restores is applied,
// while no document is ready, or while the box has no size. A report still waiting is sent by
// `flush` with the place PDF.js holds, which PDF.js keeps while no page is visible: when the box
// loses its size, when the viewer is disposed (its box is already detached then), when the window's
// page is hidden, and when the page is about to put the tab in a window or copy it there, move a
// float or hand the tab to another window. The viewer takes its place when the box loses its size
// and scrolls back to it when the box has a size again, since a hidden box loses its scroll offset.
// A box that changes size fits a fitted zoom to it again and goes back to the place last reported,
// and the scroll a new size forces (a maximised pane in which every page fits) is not reported
// until the reader moves.
//
// The libraries load on the first `open`, as a chunk of their own, so a page that never shows a PDF
// carries none of PDF.js. The worker is built by Vite from a URL import, and the character maps,
// standard fonts and decoders PDF.js reads at run time come from /api/pdfjs
// (server/content/latex/pdfjs-assets.ts). The scripting manager is not given, so a PDF's own
// scripts do not run.
//
// Internal links and outline entries go through PDF.js's link service. The window's history is
// the router's, so PDF.js's own history component, which pushes entries onto it, is not used: the
// viewer keeps a stack of the places a link left, and `back` returns to the last one.
//
// A click with Cmd or Ctrl held, or a double click when the reverse search is set to it, is a
// reverse SyncTeX search: the viewer finds the page and the point in PDF points and hands them to
// the `jump` hook. `reveal` is the forward direction: it scrolls to a place of a page and draws a
// rectangle over it that fades.

import './viewer.css';
import 'pdfjs-dist/web/pdf_viewer.css';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PDFViewer, PDFLinkService } from 'pdfjs-dist/web/pdf_viewer.mjs';
import { mount, unmount, type ComponentProps } from 'svelte';
import type { TipIds } from '$lib/ui/menu/tip-ids';
import PdfControl from './PdfControl.svelte';
import { SidePanel } from './side-panel';
import { markPlace, pageViewOf, pointOn, type Mark } from './page-points';
import {
    readPdfPlace,
    type PdfPlace,
    type ScrollName,
    type SidePanelKind,
    type SpreadName
} from '$lib/state/sources/explorer/pdf-place';

/** What the viewer asks of the view that mounted it. */
export type ViewerHooks = {
    /** A reverse search: the page (from 1) and the point in PDF points from the page's top left. */
    jump: (page: number, x: number, y: number) => void;
    /** Which click makes a reverse search: Cmd or Ctrl and a click, or a double click. */
    reverse: () => 'ctrl_click' | 'double_click';
    /** The words the viewer draws itself. */
    words: {
        loading: string;
        missing: string;
        invalid: string;
        failed: string;
        retry: string;
        build: string;
    };
    /** Build the file's root, when it has one; the note over a missing PDF offers it. */
    build?: () => void;
    /** A key the page may take for itself before the viewer reads it; true when it did. */
    key?: (event: KeyboardEvent) => boolean;
    /** The place the reader is at changed: the page keeps it. */
    placed?: (place: PdfPlace) => void;
    /** The page's tooltip counter, which the mounted controls draw their tooltips with. */
    tips: TipIds;
};

/** Where the viewer is in reading a document. */
export type ViewerStatus = 'loading' | 'ready' | 'missing' | 'invalid' | 'failed';

/** What a search found: the match shown, how many there are, and how the search stands. */
export type Found = {
    current: number;
    total: number;
    state: 'idle' | 'found' | 'wrapped' | 'notfound' | 'pending';
};

/** A place in the document a link or a back returns to. */
type Position = Pick<PdfPlace, 'page' | 'left' | 'top' | 'scaleValue'>;

/** The longest a scroll's offset waits before it is reported. */
const REPORT_EVERY_MS = 500;

/** A page change this soon after a scroll event comes of the scroll and is held to the throttle. */
const SCROLLING_MS = 200;

/** The place a PDF.js request for a run-time file goes to. */
const ASSETS = '/api/pdfjs';

/** The values PDF.js's scroll and spread modes take, by name. */
const SCROLL: Record<ScrollName, number> = { vertical: 0, horizontal: 1, wrapped: 2, page: 3 };
const SPREAD: Record<SpreadName, number> = { none: 0, odd: 1, even: 2 };

/** The words a failed read of a PDF.js document names itself by. */
const MISSING = 'MissingPDFException';
const INVALID = 'InvalidPDFException';

export class PdfViewer {
    status = $state<ViewerStatus>('loading');
    /** What PDF.js said when the document could not be read. */
    problem = $state('');
    page = $state(1);
    pages = $state(0);
    /** The zoom as a factor, 1 being 100 percent. */
    scale = $state(1);
    /** The zoom as the reader chose it: `auto`, `page-width`, `page-fit` or a number. */
    scaleValue = $state('auto');
    sidebar = $state<SidePanelKind>('');
    scroll = $state<ScrollName>('vertical');
    spread = $state<SpreadName>('none');
    invert = $state(false);
    query = $state('');
    found = $state<Found>({ current: 0, total: 0, state: 'idle' });
    /** Moves each time the reader asks for the search (Cmd+F in the viewer). */
    asked = $state(0);
    /**
     * Whether PDF.js has laid out the pages of the file shown and the place kept for it is put
     * back, so a page asked now is not undone by that layout.
     */
    laidOut = $state(false);
    /** Whether a link left a place that `back` returns to. */
    canBack = $state(false);

    hooks: ViewerHooks;

    readonly #root: HTMLDivElement;
    /**
     * The viewer's own box inside the root. The frame layer owns the root's inline `display`, so
     * the side panel and the pages are laid out in this box instead.
     */
    readonly #box: HTMLDivElement;
    readonly #container: HTMLDivElement;
    readonly #viewerEl: HTMLDivElement;
    readonly #main: HTMLDivElement;
    readonly #note: HTMLDivElement;
    readonly #message: HTMLParagraphElement;
    readonly #retry: HTMLElement;
    readonly #builds: HTMLElement;
    readonly #controls: Record<string, unknown>[] = [];
    readonly #side: SidePanel;
    readonly #stop = new AbortController();
    #viewer: PDFViewer | null = null;
    #links: PDFLinkService | null = null;
    #bus: { dispatch: (name: string, data: object) => void } | null = null;
    #setup: Promise<void> | null = null;
    #doc: PDFDocumentProxy | null = null;
    #key = '';
    #url = '';
    #generation = 0;
    #restore: PdfPlace | null = null;
    readonly #sizes: ResizeObserver;
    /** Whether the box had a size at the last look. */
    #sized = false;
    /** The place put back after a load, which holds reports back until it is applied. */
    #applied = false;
    /** The place to scroll back to when the box has a size again, while it has none. */
    #away: PdfPlace | null = null;
    /**
     * The place the reader chose before the box changed size, which a scroll the new size forces
     * does not replace: the viewer goes back to it at each new size until the reader moves.
     */
    #held: PdfPlace | null = null;
    /** Whether the viewer refits its zoom or scrolls back to a place itself: no reader's change. */
    #own = false;
    #disposed = false;
    #pending = false;
    #timer: ReturnType<typeof setTimeout> | null = null;
    /** Whether a change that is no scroll waits for PDF.js's next `updateviewarea`. */
    #awaiting = false;
    #sentAt = 0;
    #scrolledAt = 0;
    /** The place last reported, which a reload of a document that cannot be read goes back to. */
    #sent: PdfPlace | null = null;
    /** The place the page last handed `open`, for the same reload when nothing was reported. */
    #saved: PdfPlace | null = null;
    #reveal: Mark | null = null;
    #trail: Position[] = [];

    constructor(root: HTMLDivElement, hooks: ViewerHooks) {
        this.hooks = hooks;
        this.#root = root;
        this.#box = document.createElement('div');
        this.#box.className = 'oc-pdf';
        const side = document.createElement('div');
        side.className = 'oc-pdf-side';
        this.#main = document.createElement('div');
        this.#main.className = 'oc-pdf-main';
        this.#container = document.createElement('div');
        this.#container.className = 'oc-pdf-container';
        this.#container.tabIndex = 0;
        this.#viewerEl = document.createElement('div');
        this.#viewerEl.className = 'pdfViewer';
        this.#container.append(this.#viewerEl);
        this.#note = document.createElement('div');
        this.#note.className = 'oc-pdf-note';
        this.#message = document.createElement('p');
        const actions = document.createElement('div');
        actions.className = 'oc-pdf-actions';
        this.#retry = this.#button(hooks.words.retry, () => this.reload());
        this.#builds = this.#button(hooks.words.build, () => this.hooks.build?.());
        actions.append(this.#retry, this.#builds);
        this.#note.append(this.#message, actions);
        this.#main.append(this.#container, this.#note);
        this.#box.append(side, this.#main);
        root.append(this.#box);
        this.#side = new SidePanel(side, {
            goTo: (dest) => void this.#goTo(dest),
            goPage: (page) => this.goToPage(page),
            open: (url, newWindow) => window.open(url, newWindow ? '_blank' : '_self', 'noopener'),
            tips: hooks.tips
        });
        this.#shown('loading');
        const signal = this.#stop.signal;
        // The root takes the keyboard the way a frame does (the pane asks it to), and hands it to
        // the scroll box, which scrolls with the arrow and page keys.
        root.addEventListener('focus', () => this.#container.focus({ preventScroll: true }), {
            signal
        });
        root.addEventListener('keydown', (event) => this.#key_(event), { signal });
        this.#container.addEventListener('click', (event) => this.#clicked(event, false), {
            signal
        });
        this.#container.addEventListener('dblclick', (event) => this.#clicked(event, true), {
            signal
        });
        this.#container.addEventListener('click', (event) => this.#linked(event), {
            signal,
            capture: true
        });
        this.#container.addEventListener(
            'scroll',
            () => {
                this.#scrolledAt = Date.now();
                this.#changed(false);
            },
            { signal, passive: true }
        );
        for (const kind of ['wheel', 'keydown', 'pointerdown', 'touchstart']) {
            this.#container.addEventListener(kind, () => (this.#held = null), {
                signal,
                passive: true
            });
        }
        window.addEventListener('pagehide', () => this.flush(), { signal });
        this.#sizes = new ResizeObserver(() => this.#resized());
        this.#sizes.observe(this.#box);
    }

    /**
     * Load a document. The key names the file; the same key as the file shown keeps the place it
     * is at, unless the box is hidden and `own`, the tab's own record, holds a place this viewer
     * did not send, which is the place another page left it at. A call while no document is held
     * opens at `saved`, or at the top without one.
     */
    open(
        url: string,
        key: string,
        saved: PdfPlace | null = null,
        own: PdfPlace | null = null
    ): void {
        const held = key === this.#key && this.#doc !== null;
        if (saved !== null) this.#saved = saved;
        let keep: PdfPlace | null;
        if (!held) {
            keep = saved;
            this.#sent = saved;
        } else if (
            own !== null &&
            this.#away !== null &&
            !this.#pending &&
            !sameAs(own, this.#sent)
        ) {
            // The box was hidden and the tab's record holds a place this viewer did not send:
            // another page wrote it while the tab was in a window of its own. The box shows that
            // place when it has a size again.
            keep = own;
            this.#sent = own;
            this.#away = own;
        } else {
            // A document still being laid out has no place of its own yet; the one it restores is.
            keep = this.#away ?? (this.#applied ? this.#place() : this.#restore);
        }
        if (key !== this.#key) this.#trail = [];
        this.canBack = this.#trail.length > 0;
        this.#key = key;
        this.#url = url;
        this.#generation += 1;
        const mine = this.#generation;
        if (this.#doc === null) this.#shown('loading');
        void this.#load(url, mine, keep);
    }

    /** Read the file again, which is what Retry does. */
    reload(): void {
        if (this.#url !== '') this.open(this.#url, this.#key, this.#sent ?? this.#saved);
    }

    /** The document and the box go: nothing the viewer started draws again. */
    dispose(): void {
        this.flush();
        this.#disposed = true;
        this.#generation += 1;
        this.#stop.abort();
        this.#sizes.disconnect();
        this.#side.dispose();
        for (const one of this.#controls) void unmount(one);
        this.#controls.length = 0;
        const doc = this.#doc;
        this.#doc = null;
        if (doc !== null) void doc.loadingTask.destroy();
        this.#root.replaceChildren();
    }

    zoomIn(): void {
        this.#viewer?.increaseScale();
    }

    zoomOut(): void {
        this.#viewer?.decreaseScale();
    }

    /** Set the zoom to `page-width`, `page-fit`, `auto` or a factor such as `1.5`. */
    zoomTo(value: string): void {
        if (this.#viewer !== null) this.#viewer.currentScaleValue = value;
        this.scaleValue = value;
    }

    goToPage(page: number): void {
        if (this.#viewer === null || !Number.isFinite(page)) return;
        this.#held = null;
        this.#viewer.currentPageNumber = Math.min(Math.max(1, Math.round(page)), this.pages);
    }

    next(): void {
        this.#held = null;
        this.#viewer?.nextPage();
    }

    previous(): void {
        this.#held = null;
        this.#viewer?.previousPage();
    }

    /** Lay the pages out one under another, side by side, wrapped or one at a time. */
    setScroll(mode: ScrollName): void {
        this.scroll = mode;
        if (this.#viewer !== null) this.#viewer.scrollMode = SCROLL[mode];
        this.#unseen();
    }

    /** Pair the pages into spreads, or none. */
    setSpread(mode: SpreadName): void {
        this.spread = mode;
        if (this.#viewer !== null) this.#viewer.spreadMode = SPREAD[mode];
        this.#unseen();
    }

    toggleInvert(): void {
        this.invert = !this.invert;
        this.#box.classList.toggle('invert', this.invert);
    }

    showSide(kind: SidePanelKind): void {
        const next = this.sidebar === kind ? '' : kind;
        if (this.#away !== null) {
            // The panel leaves the pages no width, so the place is held aside: it takes the panel.
            this.#setSide(next);
            this.#away = { ...this.#away, sidebar: next };
            if (this.#sendable()) this.#send(this.#away);
            return;
        }
        // Asked first, so the view update made by laying the pages out beside the panel sends it.
        this.#changed(true);
        this.#setSide(next);
        this.#unseen();
    }

    /** Show the panel of a kind, or none, and lay the pages out beside it. */
    #setSide(kind: SidePanelKind): void {
        this.sidebar = kind;
        this.#side.show(kind);
        this.#viewer?.update();
    }

    /** Search the text; an empty query clears the marks. */
    find(query: string, options: { again?: boolean; previous?: boolean } = {}): void {
        this.query = query;
        if (query === '') {
            this.#bus?.dispatch('findbarclose', { source: this });
            this.found = { current: 0, total: 0, state: 'idle' };
            return;
        }
        this.#bus?.dispatch('find', {
            source: this,
            type: options.again === true ? 'again' : '',
            query,
            caseSensitive: false,
            entireWord: false,
            highlightAll: true,
            findPrevious: options.previous === true,
            matchDiacritics: false
        });
    }

    /** Return to the place the last link left. */
    back(): void {
        const place = this.#trail.pop();
        this.#held = null;
        this.canBack = this.#trail.length > 0;
        if (place !== undefined) this.#scrollTo(place);
    }

    /**
     * Scroll to a place a forward search found, put it a little above the middle of the box, and
     * draw a rectangle over it that fades. A place asked for before the pages are laid out is drawn
     * when they are.
     */
    reveal(place: Mark): void {
        this.#reveal = place;
        void this.#settle();
    }

    /** The place a Cmd or Ctrl click, or a double click, hit, in PDF points; null off a page. */
    pointOf(event: MouseEvent): { page: number; x: number; y: number } | null {
        return pointOn(this.#viewer, event);
    }

    async #library(): Promise<void> {
        const pdfjs = await import('pdfjs-dist');
        const lib = await import('pdfjs-dist/web/pdf_viewer.mjs');
        const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const eventBus = new lib.EventBus();
        const links = new lib.PDFLinkService({
            eventBus,
            externalLinkTarget: lib.LinkTarget.BLANK,
            externalLinkRel: 'noopener noreferrer'
        });
        const finder = new lib.PDFFindController({ linkService: links, eventBus });
        const viewer = new lib.PDFViewer({
            container: this.#container,
            viewer: this.#viewerEl,
            eventBus,
            linkService: links,
            findController: finder,
            textLayerMode: 1,
            annotationMode: pdfjs.AnnotationMode.ENABLE,
            annotationEditorMode: pdfjs.AnnotationEditorType.DISABLE
        });
        links.setViewer(viewer);
        const signal = this.#stop.signal;
        eventBus.on('pagesinit', () => this.#initialised(), { signal });
        eventBus.on(
            'pagechanging',
            (event: { pageNumber: number }) => this.#paged(event.pageNumber),
            { signal }
        );
        eventBus.on(
            'scalechanging',
            (event: { scale: number; presetValue?: string }) => {
                this.scale = event.scale;
                this.scaleValue = event.presetValue ?? String(event.scale);
                if (!this.#own) this.#changed(true);
            },
            { signal }
        );
        eventBus.on('updateviewarea', () => this.#located(), { signal });
        eventBus.on('scrollmodechanged', () => this.#changed(true), { signal });
        eventBus.on('spreadmodechanged', () => this.#changed(true), { signal });
        eventBus.on(
            'updatefindmatchescount',
            (event: { matchesCount: Found }) => {
                this.found = { ...this.found, ...event.matchesCount };
            },
            { signal }
        );
        eventBus.on(
            'updatefindcontrolstate',
            (event: { state: number; matchesCount: Found }) => {
                this.found = { ...event.matchesCount, state: stateOf(event.state, lib.FindState) };
            },
            { signal }
        );
        this.#viewer = viewer;
        this.#links = links;
        this.#bus = eventBus;
    }

    async #load(url: string, mine: number, keep: PdfPlace | null): Promise<void> {
        try {
            this.#setup ??= this.#library();
            await this.#setup;
            if (mine !== this.#generation || this.#viewer === null) return;
            const pdfjs = await import('pdfjs-dist');
            const task = pdfjs.getDocument({
                url,
                cMapUrl: `${ASSETS}/cmaps/`,
                cMapPacked: true,
                standardFontDataUrl: `${ASSETS}/standard_fonts/`,
                wasmUrl: `${ASSETS}/wasm/`
            });
            const doc = await task.promise;
            if (mine !== this.#generation) {
                void doc.loadingTask.destroy();
                return;
            }
            const old = this.#doc;
            this.#doc = doc;
            this.#restore = keep;
            this.#applied = false;
            this.laidOut = false;
            this.#away = null;
            this.pages = doc.numPages;
            this.#viewer.setDocument(doc);
            this.#links?.setDocument(doc, null);
            this.#side.setDocument(doc);
            if (old !== null) void old.loadingTask.destroy();
            this.problem = '';
            this.#shown('ready');
        } catch (error) {
            if (mine !== this.#generation) return;
            const name = error instanceof Error ? error.name : '';
            this.problem = error instanceof Error ? error.message : String(error);
            const status = name === MISSING ? 'missing' : name === INVALID ? 'invalid' : 'failed';
            if (status === 'missing') this.flush();
            // A document already drawn stays on screen when its replacement cannot be read, which
            // is a build that was still writing the file; only a file that is gone replaces it.
            this.#shown(status);
            if (status === 'missing') this.#drop();
        }
    }

    /** One button of the note, the page's own button primitive mounted in an element of its own. */
    #button(label: string, run: () => void): HTMLElement {
        const host = document.createElement('div');
        host.className = 'oc-pdf-button';
        const props = { kind: 'button', label, tips: this.hooks.tips, onclick: run };
        this.#controls.push(
            mount(PdfControl, { target: host, props: props as ComponentProps<typeof PdfControl> })
        );
        return host;
    }

    /** Let go of the document drawn, which the file being gone leaves nothing to show for. */
    #drop(): void {
        const doc = this.#doc;
        this.#doc = null;
        this.#applied = false;
        this.laidOut = false;
        this.#away = null;
        this.pages = 0;
        this.#side.setDocument(null);
        if (doc !== null) void doc.loadingTask.destroy();
        this.#viewer?.setDocument(null);
        this.#links?.setDocument(null, null);
    }

    /**
     * The viewer's status, and the note over the pages that says what it is doing: it is shown
     * while the first document loads, and for a file that is gone or cannot be read when no
     * document is drawn.
     */
    #shown(status: ViewerStatus): void {
        this.status = status;
        const words = this.hooks.words;
        const sentences = {
            loading: words.loading,
            ready: '',
            missing: words.missing,
            invalid: words.invalid,
            failed: words.failed
        };
        const unread = status === 'missing' || status === 'invalid' || status === 'failed';
        const noted =
            status === 'loading' || (unread && (status === 'missing' || this.#doc === null));
        this.#message.textContent = sentences[status];
        this.#retry.hidden = !unread;
        this.#builds.hidden = status !== 'missing' || this.hooks.build === undefined;
        this.#note.hidden = !noted;
        this.#note.style.pointerEvents = unread ? 'auto' : 'none';
    }

    /** The pages are laid out: put back the place, the zoom and the layout, and draw a reveal. */
    #initialised(): void {
        const viewer = this.#viewer;
        if (viewer === null) return;
        const keep = this.#restore;
        this.#restore = null;
        if (keep !== null) {
            this.scroll = keep.scroll;
            this.spread = keep.spread;
        }
        viewer.scrollMode = SCROLL[this.scroll];
        viewer.spreadMode = SPREAD[this.spread];
        viewer.currentScaleValue = keep?.scaleValue ?? this.scaleValue;
        if (keep !== null && keep.sidebar !== this.sidebar) this.#setSide(keep.sidebar);
        // A forward search that is waiting is drawn at the end, and wins over the place saved.
        if (keep !== null && this.#reveal === null) this.#land(keep);
        this.pages = viewer.pagesCount;
        this.page = viewer.currentPageNumber;
        this.#side.current(this.page);
        this.#applied = true;
        this.laidOut = true;
        void this.#settle();
    }

    #paged(page: number): void {
        this.page = page;
        this.#side.current(page);
        this.#changed(!this.#own && Date.now() - this.#scrolledAt > SCROLLING_MS);
    }

    /**
     * Where the viewer is: the page, the offset in it in PDF units and the zoom. PDF.js holds no
     * offset before it has first updated its view, and the viewer then has no place.
     */
    #position(): Position | null {
        const viewer = this.#viewer;
        if (viewer === null) return null;
        const at = viewer._location as { left?: number; top?: number } | null | undefined;
        if (at === null || at === undefined) return null;
        return {
            page: viewer.currentPageNumber,
            left: at.left ?? 0,
            top: at.top ?? 0,
            scaleValue: viewer.currentScaleValue
        };
    }

    /** The place the reader is at, as the page keeps it, or null while there is none. */
    #place(): PdfPlace | null {
        const at = this.#position();
        if (at === null) return null;
        return readPdfPlace({
            ...at,
            scroll: this.scroll,
            spread: this.spread,
            sidebar: this.sidebar
        });
    }

    /** Scroll to a place, or hold it until the box has a size to scroll in. */
    #land(place: PdfPlace): void {
        if (this.#hasSize()) this.#scrollTo(place);
        else this.#away = place;
    }

    #hasSize(): boolean {
        return this.#box.clientWidth > 0 && this.#box.clientHeight > 0;
    }

    /**
     * The box lost its size, has one again or has a new one. A new size keeps the place last
     * reported: a wider box can push the scroll back, as a maximised pane does when every page fits
     * in it, and the scroll it forces is not reported until the reader moves.
     */
    #resized(): void {
        const sized = this.#hasSize();
        if (sized && this.#sized) {
            if (!this.#applied) return;
            if (this.#pending && !this.#awaiting) {
                if (this.#timer !== null) clearTimeout(this.#timer);
                this.#timer = null;
                this.#pending = false;
            }
            this.#fitAndGo((this.#held ??= this.#sent));
            return;
        }
        if (sized === this.#sized) return;
        this.#sized = sized;
        if (!sized) {
            if (this.#applied && this.#away === null) this.#away = this.#held ?? this.#place();
            this.flush();
            return;
        }
        const place = this.#away;
        this.#away = null;
        this.#fitAndGo(place);
    }

    /** Fit a fitted zoom (no factor) to the box, then go to `place`; neither is a reader's move. */
    #fitAndGo(place: Position | null): void {
        const viewer = this.#viewer;
        if (viewer === null) return;
        this.#own = true;
        try {
            const value = viewer.currentScaleValue;
            if (Number.isNaN(Number(value))) viewer.currentScaleValue = value;
            if (place !== null) this.#scrollTo(place);
        } finally {
            this.#own = false;
        }
    }

    /** Whether a place may be reported now. */
    #sendable(): boolean {
        return (
            !this.#disposed &&
            this.hooks.placed !== undefined &&
            this.status === 'ready' &&
            this.#applied
        );
    }

    /**
     * Ask for a report of the place. A change that is no scroll is sent on PDF.js's next
     * `updateviewarea`, which follows its new offset; a scroll's offset, and a page change that
     * comes of it, is sent when 500 ms have passed since the last report.
     */
    #changed(discrete: boolean): void {
        if (!this.#sendable() || this.#away !== null || !this.#hasSize()) return;
        if (discrete) this.#held = null;
        else if (this.#held !== null) return;
        this.#pending = true;
        if (discrete) {
            this.#awaiting = true;
            return;
        }
        if (this.#timer !== null) return;
        const wait = Math.max(0, REPORT_EVERY_MS - (Date.now() - this.#sentAt));
        this.#timer = setTimeout(() => {
            this.#timer = null;
            this.flush();
        }, wait);
    }

    /**
     * Send a change no view update followed, as when the pages have no width left beside the panel:
     * PDF.js then updates nothing, and the place it holds is the one to keep.
     */
    #unseen(): void {
        if (this.#awaiting) this.flush();
    }

    /** PDF.js has updated its place: send the change that waited for it. */
    #located(): void {
        if (this.#awaiting) this.flush();
    }

    /**
     * Send the report that is waiting, now, with the place PDF.js holds: the place held while the
     * box is hidden, else its current one. PDF.js keeps its offset while no page is visible, which
     * is the case once the box is detached or has no size, so no size is needed.
     */
    flush(): void {
        if (!this.#pending) return;
        this.#send(this.#away ?? this.#place());
    }

    /** Report a place unless it is the one reported last. */
    #send(place: PdfPlace | null): void {
        if (this.#timer !== null) clearTimeout(this.#timer);
        this.#timer = null;
        this.#pending = false;
        this.#awaiting = false;
        if (place === null || !this.#sendable() || sameAs(place, this.#sent)) return;
        this.#sent = place;
        this.#sentAt = Date.now();
        this.hooks.placed?.(place);
    }

    #scrollTo(place: Position): void {
        const viewer = this.#viewer;
        if (viewer === null || viewer.pagesCount === 0) return;
        if (place.page > viewer.pagesCount) {
            // A document rebuilt shorter than the place was taken in: the last page's top.
            viewer.currentPageNumber = viewer.pagesCount;
            return;
        }
        viewer.scrollPageIntoView({
            pageNumber: place.page,
            destArray: [null, { name: 'XYZ' }, place.left, place.top, null],
            allowNegativeOffset: true,
            ignoreDestinationZoom: true
        });
    }

    async #goTo(dest: string | unknown[]): Promise<void> {
        const place = this.#position();
        if (place !== null) this.#remember(place);
        await this.#links?.goToDestination(dest);
    }

    #remember(place: Position): void {
        this.#trail.push(place);
        this.canBack = true;
    }

    /** An internal link is about to move the view: remember where it left. */
    #linked(event: MouseEvent): void {
        const target = event.target;
        if (!(target instanceof Element) || target.closest('a.internalLink') === null) return;
        const place = this.#position();
        if (place !== null) this.#remember(place);
    }

    /** A click that is a reverse search under the reader's setting is handed to the view. */
    #clicked(event: MouseEvent, double: boolean): void {
        const mode = this.hooks.reverse();
        const asks = double
            ? mode === 'double_click'
            : mode === 'ctrl_click' && (event.metaKey || event.ctrlKey);
        if (!asks) return;
        const hit = this.pointOf(event);
        if (hit === null) return;
        event.preventDefault();
        this.hooks.jump(hit.page, hit.x, hit.y);
    }

    /** Cmd or Ctrl and F asks for the search, which the controls draw. */
    #key_(event: KeyboardEvent): void {
        if (this.hooks.key?.(event) === true) {
            event.preventDefault();
            return;
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f' && !event.altKey) {
            event.preventDefault();
            this.asked += 1;
        }
    }

    /** Draw a pending reveal once the pages are laid out. */
    async #settle(): Promise<void> {
        const viewer = this.#viewer;
        const place = this.#reveal;
        if (viewer === null || place === null || this.status !== 'ready') return;
        try {
            await viewer.pagesPromise;
        } catch {
            return;
        }
        if (this.#reveal !== place) return;
        this.#reveal = null;
        const view = pageViewOf(viewer, place.page - 1);
        if (view === null) return;
        viewer.currentPageNumber = place.page;
        markPlace(this.#container, view, place);
    }
}

/** The word of a PDF.js find state. */
function stateOf(
    state: number,
    find: { FOUND: number; NOT_FOUND: number; WRAPPED: number }
): Found['state'] {
    if (state === find.FOUND) return 'found';
    if (state === find.WRAPPED) return 'wrapped';
    if (state === find.NOT_FOUND) return 'notfound';
    return 'pending';
}

/** Whether two places are the same place; no place is the same as no other. */
function sameAs(one: PdfPlace | null, other: PdfPlace | null): boolean {
    return one !== null && other !== null && JSON.stringify(one) === JSON.stringify(other);
}
