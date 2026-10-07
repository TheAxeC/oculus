// Layer 3, view partial of the file view. The PDF viewer: PDF.js's `PDFViewer` over one box of the
// page, with the state its controls read.
//
// The box is the one the frame layer draws (shell/frames/FrameLayer.svelte, the kind `viewer`), so
// a pane added, a tab moved or a page switched never draws the box again and the document, the page
// shown, the zoom and the scroll stay as they were. The view that owns the tab mounts a viewer in
// the box once (`new PdfViewer`), hands it to the tab frames store, and reads it from there; the
// viewer holds no view and imports no store, so what it needs of the page comes in as hooks.
//
// `open(url, key)` loads a document. The key names the file: a call with the key of the file shown
// reloads it in place and puts the viewer back at the page, the offset in the page and the zoom it
// was at, which is how a rebuilt PDF is drawn; a call with another key starts at the first page at
// the zoom the reader chose. A load that a later call overtook, or that ends after `dispose`, draws
// nothing. A document that cannot be read leaves the viewer in a state that says why, with the old
// document still behind it until a new one loads.
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
import { SidePanel, type SidePanelKind } from './side-panel';

/** What the viewer reads of one page's view: its element and the scale it is drawn at. */
type PageView = { div: HTMLElement; viewport: { scale: number } };

/** The view of a page (from 0) of a PDF.js viewer, whose typings leave it untyped, or null. */
function pageViewOf(viewer: PDFViewer | null, index: number): PageView | null {
    if (viewer === null) return null;
    return (viewer.getPageView(index) as PageView | null | undefined) ?? null;
}

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
    /** The page's tooltip counter, which the mounted controls draw their tooltips with. */
    tips: TipIds;
};

/** Where the viewer is in reading a document. */
export type ViewerStatus = 'loading' | 'ready' | 'missing' | 'invalid' | 'failed';

/** How the pages are laid out one against another. */
export type ScrollName = 'vertical' | 'horizontal' | 'wrapped' | 'page';

/** How the pages are paired into spreads. */
export type SpreadName = 'none' | 'odd' | 'even';

/** What a search found: the match shown, how many there are, and how the search stands. */
export type Found = {
    current: number;
    total: number;
    state: 'idle' | 'found' | 'wrapped' | 'notfound' | 'pending';
};

/** A place in the document a reload or a back returns to. */
type Position = {
    page: number;
    left: number;
    top: number;
    scaleValue: string;
};

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
    /** Whether a link left a place that `back` returns to. */
    canBack = $state(false);

    hooks: ViewerHooks;

    readonly #root: HTMLDivElement;
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
    #restore: Position | null = null;
    #reveal: { page: number; left: number; top: number; w: number; h: number } | null = null;
    #trail: Position[] = [];

    constructor(root: HTMLDivElement, hooks: ViewerHooks) {
        this.hooks = hooks;
        this.#root = root;
        root.classList.add('oc-pdf');
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
        root.append(side, this.#main);
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
    }

    /**
     * Load a document. The key names the file; the same key as the file shown keeps the page, the
     * offset in the page and the zoom, any other starts at the top.
     */
    open(url: string, key: string): void {
        const keep = key === this.#key && this.#doc !== null ? this.#position() : null;
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
        if (this.#url !== '') this.open(this.#url, this.#key);
    }

    /** The document and the box go: nothing the viewer started draws again. */
    dispose(): void {
        this.#generation += 1;
        this.#stop.abort();
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
        this.#viewer.currentPageNumber = Math.min(Math.max(1, Math.round(page)), this.pages);
    }

    next(): void {
        this.#viewer?.nextPage();
    }

    previous(): void {
        this.#viewer?.previousPage();
    }

    /** Lay the pages out one under another, side by side, wrapped or one at a time. */
    setScroll(mode: ScrollName): void {
        this.scroll = mode;
        if (this.#viewer !== null) this.#viewer.scrollMode = SCROLL[mode];
    }

    /** Pair the pages into spreads, or none. */
    setSpread(mode: SpreadName): void {
        this.spread = mode;
        if (this.#viewer !== null) this.#viewer.spreadMode = SPREAD[mode];
    }

    toggleInvert(): void {
        this.invert = !this.invert;
        this.#root.classList.toggle('invert', this.invert);
    }

    showSide(kind: SidePanelKind): void {
        this.sidebar = this.sidebar === kind ? '' : kind;
        this.#side.show(this.sidebar);
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
        this.canBack = this.#trail.length > 0;
        if (place !== undefined) this.#scrollTo(place);
    }

    /**
     * Scroll to a place a forward search found, put it a little above the middle of the box, and
     * draw a rectangle over it that fades. A place asked for before the pages are laid out is drawn
     * when they are.
     */
    reveal(place: { page: number; left: number; top: number; w: number; h: number }): void {
        this.#reveal = place;
        void this.#settle();
    }

    /** The place a Cmd or Ctrl click, or a double click, hit, in PDF points; null off a page. */
    pointOf(event: MouseEvent): { page: number; x: number; y: number } | null {
        const target = event.target;
        const page = target instanceof Element ? target.closest<HTMLElement>('.page') : null;
        const number = Number(page?.dataset.pageNumber);
        const view = pageViewOf(this.#viewer, number - 1);
        if (page === null || view === null) return null;
        const wrap = page.querySelector('.canvasWrapper') ?? page;
        const box = wrap.getBoundingClientRect();
        const scale = view.viewport.scale;
        if (!(scale > 0)) return null;
        return {
            page: number,
            x: (event.clientX - box.left) / scale,
            y: (event.clientY - box.top) / scale
        };
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
            {
                signal
            }
        );
        eventBus.on(
            'scalechanging',
            (event: { scale: number; presetValue?: string }) => {
                this.scale = event.scale;
                this.scaleValue = event.presetValue ?? String(event.scale);
            },
            { signal }
        );
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

    async #load(url: string, mine: number, keep: Position | null): Promise<void> {
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
        viewer.scrollMode = SCROLL[this.scroll];
        viewer.spreadMode = SPREAD[this.spread];
        const keep = this.#restore;
        this.#restore = null;
        viewer.currentScaleValue = keep?.scaleValue ?? this.scaleValue;
        if (keep !== null) this.#scrollTo(keep);
        this.pages = viewer.pagesCount;
        this.page = viewer.currentPageNumber;
        this.#side.current(this.page);
        void this.#settle();
    }

    #paged(page: number): void {
        this.page = page;
        this.#side.current(page);
    }

    /** Where the viewer is: the page, the offset in it in PDF units and the zoom. */
    #position(): Position | null {
        const viewer = this.#viewer;
        if (viewer === null) return null;
        const at = viewer._location as { left?: number; top?: number } | null | undefined;
        return {
            page: viewer.currentPageNumber,
            left: at?.left ?? 0,
            top: at?.top ?? 0,
            scaleValue: viewer.currentScaleValue
        };
    }

    #scrollTo(place: Position): void {
        this.#viewer?.scrollPageIntoView({
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
        const wrap = view.div.querySelector<HTMLElement>('.canvasWrapper');
        if (wrap === null) return;
        const scale = view.viewport.scale;
        const around = this.#container.getBoundingClientRect();
        const top = wrap.getBoundingClientRect().top - around.top + this.#container.scrollTop;
        this.#container.scrollTop = top + place.top * scale - this.#container.clientHeight * 0.4;
        const mark = document.createElement('div');
        mark.className = 'oc-pdf-indicator';
        mark.style.left = `${place.left * scale}px`;
        mark.style.top = `${place.top * scale}px`;
        mark.style.width = `${Math.max(place.w * scale, 6)}px`;
        mark.style.height = `${Math.max(place.h * scale, 6)}px`;
        mark.addEventListener('animationend', () => mark.remove());
        wrap.append(mark);
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
