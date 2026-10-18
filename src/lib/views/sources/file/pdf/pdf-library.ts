// Layer 3, view partial of the file view. The PDF.js objects the PDF viewer (viewer.svelte.ts)
// draws with, made on its first `open`: the libraries are imported then, as a chunk of their own,
// so a page that never shows a PDF carries none of PDF.js. The worker is built by Vite from a URL
// import. The event bus, the link service, the find controller and the `PDFViewer` over the
// viewer's container are made once, and the events the viewer follows on the bus are handed to its
// hooks until its signal aborts.

import type { PDFViewer, PDFLinkService } from 'pdfjs-dist/web/pdf_viewer.mjs';

/** What a search found: the match shown, how many there are, and how the search stands. */
export type Found = {
    current: number;
    total: number;
    state: 'idle' | 'found' | 'wrapped' | 'notfound' | 'pending';
};

/** What the viewer is told of PDF.js's events. */
export type LibraryEvents = {
    /** The pages of a new document are laid out. */
    initialised: () => void;
    /** The page shown changed, to this page (from 1). */
    paged: (page: number) => void;
    /** The zoom changed: the scale, and the preset it was chosen by when there was one. */
    scaled: (scale: number, preset: string | undefined) => void;
    /** PDF.js updated its view, with the location it holds now. */
    located: () => void;
    /** The scroll or the spread mode changed. */
    moded: () => void;
    /** How many matches a search has, as PDF.js counted them so far. */
    counted: (count: Found) => void;
    /** Where a search stands, with its count. */
    searched: (found: Found) => void;
};

/** The PDF.js objects a viewer holds. */
export type PdfLibrary = {
    viewer: PDFViewer;
    links: PDFLinkService;
    bus: { dispatch: (name: string, data: object) => void };
};

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

/**
 * Load PDF.js and make the viewer's objects over `container` and the element inside it that holds
 * the pages (`pages`), its events handed to `on` until `signal` aborts.
 */
export async function loadPdfLibrary(
    container: HTMLDivElement,
    pages: HTMLDivElement,
    on: LibraryEvents,
    signal: AbortSignal
): Promise<PdfLibrary> {
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
        container,
        viewer: pages,
        eventBus,
        linkService: links,
        findController: finder,
        textLayerMode: 1,
        annotationMode: pdfjs.AnnotationMode.ENABLE,
        annotationEditorMode: pdfjs.AnnotationEditorType.DISABLE
    });
    links.setViewer(viewer);
    eventBus.on('pagesinit', () => on.initialised(), { signal });
    eventBus.on('pagechanging', (event: { pageNumber: number }) => on.paged(event.pageNumber), {
        signal
    });
    eventBus.on(
        'scalechanging',
        (event: { scale: number; presetValue?: string }) =>
            on.scaled(event.scale, event.presetValue),
        { signal }
    );
    eventBus.on('updateviewarea', () => on.located(), { signal });
    eventBus.on('scrollmodechanged', () => on.moded(), { signal });
    eventBus.on('spreadmodechanged', () => on.moded(), { signal });
    eventBus.on(
        'updatefindmatchescount',
        (event: { matchesCount: Found }) => on.counted(event.matchesCount),
        { signal }
    );
    eventBus.on(
        'updatefindcontrolstate',
        (event: { state: number; matchesCount: Found }) =>
            on.searched({ ...event.matchesCount, state: stateOf(event.state, lib.FindState) }),
        { signal }
    );
    return { viewer, links, bus: eventBus };
}
