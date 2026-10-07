// Layer 3, view partial of the file view. The side panel of the PDF viewer: the document's outline
// as nested lists of links, or its pages as thumbnails drawn the first time each comes into view.
// It is plain DOM in the box the viewer's layer holds (shell/frames/FrameLayer.svelte), so it
// outlives the view that draws the controls.
//
// An outline entry opens through the viewer's link service, which resolves the destination the
// entry names, or an address; a thumbnail goes to its page. Each entry and each thumbnail is a
// PdfControl.svelte mounted with Svelte's `mount`, so it is the page's own button primitive. A
// thumbnail is drawn by one render at a time, in the order the reader scrolls to them, so a
// document of hundreds of pages asks the worker for the few that show.

import { mount, unmount, type ComponentProps } from 'svelte';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { t } from '$lib/state/shared/words/text';
import type { TipIds } from '$lib/ui/menu/tip-ids';
import PdfControl from './PdfControl.svelte';

/** What the panel shows: nothing, the outline, or the thumbnails. */
export type SidePanelKind = '' | 'outline' | 'thumbnails';

/** What the panel asks of the viewer. */
export type SidePanelHooks = {
    /** Go to the destination an outline entry names. */
    goTo: (dest: string | unknown[]) => void;
    /** Go to a page. */
    goPage: (page: number) => void;
    /** Open an address an outline entry names. */
    open: (url: string, newWindow: boolean) => void;
    /** The page's tooltip counter, which the mounted controls draw their tooltips with. */
    tips: TipIds;
};

/** The width of a thumbnail in CSS pixels. */
const THUMB_WIDTH = 140;

/** The marker of a control that has not reported its own yet. */
const noMark = (): void => undefined;

/** One outline entry of the document, as `getOutline` answers it. */
type OutlineEntry = Awaited<ReturnType<PDFDocumentProxy['getOutline']>>[number];

export class SidePanel {
    readonly #el: HTMLElement;
    readonly #hooks: SidePanelHooks;
    #kind: SidePanelKind = '';
    #doc: PDFDocumentProxy | null = null;
    #page = 1;
    #drawn = 0;
    #seen: IntersectionObserver | null = null;
    #queue: Promise<void> = Promise.resolve();
    #mounted: Record<string, unknown>[] = [];
    #marks = new Map<number, (on: boolean) => void>();

    constructor(el: HTMLElement, hooks: SidePanelHooks) {
        this.#el = el;
        this.#hooks = hooks;
        el.hidden = true;
    }

    /** Show the outline, the thumbnails or nothing. */
    show(kind: SidePanelKind): void {
        this.#kind = kind;
        this.#el.hidden = kind === '';
        void this.#fill();
    }

    /** Take a new document, or none, and draw the panel again. */
    setDocument(doc: PDFDocumentProxy | null): void {
        this.#doc = doc;
        void this.#fill();
    }

    /** Mark the page the viewer shows. */
    current(page: number): void {
        this.#page = page;
        for (const [number, mark] of this.#marks) mark(number === page);
        if (this.#kind !== 'thumbnails') return;
        this.#el
            .querySelector<HTMLElement>(`.oc-pdf-thumb[data-page="${page}"]`)
            ?.scrollIntoView({ block: 'nearest' });
    }

    dispose(): void {
        this.#seen?.disconnect();
        this.#doc = null;
        this.#clear();
    }

    /** Take the controls out of the panel, which unmounts every one it mounted. */
    #clear(): void {
        for (const one of this.#mounted) void unmount(one);
        this.#mounted = [];
        this.#marks.clear();
        this.#el.replaceChildren();
    }

    /** Mount one control in a new element of `parent`, and answer the element. */
    #control(
        parent: HTMLElement,
        tag: 'li' | 'div',
        className: string,
        props: Record<string, unknown>
    ): { host: HTMLElement; mark: (on: boolean) => void } {
        const host = document.createElement(tag);
        if (className !== '') host.className = className;
        parent.append(host);
        let mark: (on: boolean) => void = noMark;
        const one = mount(PdfControl, {
            target: host,
            props: {
                tips: this.#hooks.tips,
                ready: (marker: (on: boolean) => void) => {
                    mark = marker;
                },
                ...props
            } as ComponentProps<typeof PdfControl>
        });
        this.#mounted.push(one);
        return { host, mark: (on) => mark(on) };
    }

    async #fill(): Promise<void> {
        this.#drawn += 1;
        const mine = this.#drawn;
        this.#seen?.disconnect();
        this.#seen = null;
        this.#clear();
        const doc = this.#doc;
        if (doc === null || this.#kind === '') return;
        if (this.#kind === 'thumbnails') {
            this.#thumbnails(doc);
            return;
        }
        let outline: OutlineEntry[] | null;
        try {
            outline = await doc.getOutline();
        } catch {
            outline = null;
        }
        if (mine !== this.#drawn) return;
        if (outline === null || outline.length === 0) {
            const note = document.createElement('p');
            note.textContent = t('file.pdf_outline_empty');
            this.#el.append(note);
            return;
        }
        const list = document.createElement('ul');
        list.className = 'oc-pdf-outline';
        this.#entries(list, outline);
        this.#el.append(list);
    }

    #entries(list: HTMLUListElement, entries: OutlineEntry[]): void {
        for (const entry of entries) {
            const { host: item } = this.#control(list, 'li', '', {
                kind: 'entry',
                label: entry.title,
                bold: entry.bold,
                italic: entry.italic,
                onclick: () => {
                    if (entry.dest !== null) this.#hooks.goTo(entry.dest);
                    else if (entry.url !== null) {
                        this.#hooks.open(entry.url, entry.newWindow === true);
                    }
                }
            });
            if (entry.items.length > 0) {
                const inner = document.createElement('ul');
                this.#entries(inner, entry.items as OutlineEntry[]);
                item.append(inner);
            }
        }
    }

    #thumbnails(doc: PDFDocumentProxy): void {
        const list = document.createElement('div');
        list.className = 'oc-pdf-thumbs';
        const seen = new IntersectionObserver(
            (entries) => {
                for (const found of entries) {
                    if (!found.isIntersecting || !(found.target instanceof HTMLElement)) continue;
                    seen.unobserve(found.target);
                    this.#render(doc, found.target);
                }
            },
            { root: this.#el, rootMargin: '200px' }
        );
        this.#seen = seen;
        for (let page = 1; page <= doc.numPages; page += 1) {
            const { host, mark } = this.#control(list, 'div', 'oc-pdf-thumb', {
                kind: 'thumb',
                label: String(page),
                width: THUMB_WIDTH,
                height: Math.round(THUMB_WIDTH * 1.414),
                onclick: () => this.#hooks.goPage(page)
            });
            host.dataset.page = String(page);
            this.#marks.set(page, mark);
            seen.observe(host);
        }
        this.#el.append(list);
        this.current(this.#page);
    }

    /** Draw one thumbnail after the ones asked for before it. */
    #render(doc: PDFDocumentProxy, thumb: HTMLElement): void {
        const canvas = thumb.querySelector('canvas');
        const number = Number(thumb.dataset.page);
        if (canvas === null) return;
        this.#queue = this.#queue.then(async () => {
            if (this.#doc !== doc || !thumb.isConnected) return;
            try {
                const page = await doc.getPage(number);
                const base = page.getViewport({ scale: 1 });
                const viewport = page.getViewport({ scale: THUMB_WIDTH / base.width });
                canvas.width = Math.floor(viewport.width);
                canvas.height = Math.floor(viewport.height);
                await page.render({ canvas, viewport }).promise;
            } catch {
                // A thumbnail that did not draw stays blank; the page itself is read by the viewer.
            }
        });
    }
}
