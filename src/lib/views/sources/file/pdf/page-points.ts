// Layer 3, view partial of the file view. Points on the pages of the PDF viewer, both ways: the
// place in PDF points that a click on a page hit, which SyncTeX's inverse search asks the source
// for, and the rectangle a forward search found, scrolled a little above the middle of the box and
// marked with a rectangle that fades (`.oc-pdf-indicator` in viewer.css). PDF.js draws each page in
// a `.canvasWrapper` inside the page's element, at the scale of the page's viewport.

import type { PDFViewer } from 'pdfjs-dist/web/pdf_viewer.mjs';

/** What is read of one page's view: its element and the scale it is drawn at. */
type PageView = { div: HTMLElement; viewport: { scale: number } };

/** A rectangle on a page, in PDF points from the page's top left. */
export type Mark = { page: number; left: number; top: number; w: number; h: number };

/** The view of a page (from 0) of a PDF.js viewer, whose typings leave it untyped, or null. */
export function pageViewOf(viewer: PDFViewer | null, index: number): PageView | null {
    if (viewer === null) return null;
    return (viewer.getPageView(index) as PageView | null | undefined) ?? null;
}

/** The place a click hit, in PDF points, or null off a page. */
export function pointOn(
    viewer: PDFViewer | null,
    event: MouseEvent
): { page: number; x: number; y: number } | null {
    const target = event.target;
    const page = target instanceof Element ? target.closest<HTMLElement>('.page') : null;
    const number = Number(page?.dataset.pageNumber);
    const view = pageViewOf(viewer, number - 1);
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

/** Scroll the container to a rectangle of a page's view and draw the fading mark over it. */
export function markPlace(container: HTMLElement, view: PageView, place: Mark): void {
    const wrap = view.div.querySelector<HTMLElement>('.canvasWrapper');
    if (wrap === null) return;
    const scale = view.viewport.scale;
    const around = container.getBoundingClientRect();
    const top = wrap.getBoundingClientRect().top - around.top + container.scrollTop;
    container.scrollTop = top + place.top * scale - container.clientHeight * 0.4;
    const mark = document.createElement('div');
    mark.className = 'oc-pdf-indicator';
    mark.style.left = `${place.left * scale}px`;
    mark.style.top = `${place.top * scale}px`;
    mark.style.width = `${Math.max(place.w * scale, 6)}px`;
    mark.style.height = `${Math.max(place.h * scale, 6)}px`;
    mark.addEventListener('animationend', () => mark.remove());
    wrap.append(mark);
}
