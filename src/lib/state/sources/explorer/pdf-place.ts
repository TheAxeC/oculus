// Layer 2, client state, pure. The place a PDF is read at, and the two records it is kept in.
//
// A place is the page, the offset in it, the zoom, how the pages are laid out and paired, and the
// side panel shown. The viewer (views/sources/file/pdf/viewer.svelte.ts) reports one as the reader
// moves; the file view keeps it in two ui records. The tab's own record holds the place under the
// key `pdf` and goes with the tab. The record under the fixed id `PDF_PLACES_ID`, which no tab's
// id equals, holds the last places of the last 50 files read, newest first, so a tab opened for a
// file starts where the file was last read.
//
// Both records come out of `localStorage`, so every read here checks its value: a place that is
// not an object or holds a number that is no number reads as null, a zoom or a mode that is not
// one of the viewer's reads as the viewer's default, and a bad entry of the list is dropped.
// Nothing here reads a store or a file; the ui store is the file view's to call.

import { z } from 'zod';
import { readAs, rowsShape } from '../../../data/shapes/shapes.ts';

/** The id of the ui record that holds the per-file list. */
export const PDF_PLACES_ID = 'pdf-place';

/** How many files the per-file list remembers. */
const PDF_PLACES_LIMIT = 50;

/** How the pages are laid out one against another. */
export type ScrollName = 'vertical' | 'horizontal' | 'wrapped' | 'page';

/** How the pages are paired into spreads. */
export type SpreadName = 'none' | 'odd' | 'even';

/** What the side panel shows: nothing, the outline, or the thumbnails. */
export type SidePanelKind = '' | 'outline' | 'thumbnails';

/** A place a reader of a PDF was at. */
export type PdfPlace = {
    /** The page, from 1. */
    page: number;
    /** The offset in the page in PDF units, as PDF.js's destinations give them. */
    left: number;
    top: number;
    /** The zoom as the reader chose it: a preset's name or a factor written out, such as `1.5`. */
    scaleValue: string;
    scroll: ScrollName;
    spread: SpreadName;
    sidebar: SidePanelKind;
};

/** One file's last place, by the served root and the path under it. */
type FilePlace = { root: string; path: string; place: PdfPlace };

/** The zoom names PDF.js takes besides a factor. */
const PRESETS = ['auto', 'page-width', 'page-fit', 'page-actual'];

/** The bounds of a zoom factor, PDF.js's own (pdf_viewer.mjs, MIN_SCALE and MAX_SCALE). */
const SCALE_MIN = 0.1;
const SCALE_MAX = 25;

/** A factor written as plain decimal digits: what the viewer writes, and what PDF.js parses. */
const FACTOR = /^\d+(\.\d+)?$/;

/** Whether a text is a preset's name or a factor inside PDF.js's bounds. */
function zoomOf(value: string): boolean {
    if (PRESETS.includes(value)) return true;
    if (!FACTOR.test(value)) return false;
    const factor = Number(value);
    return factor >= SCALE_MIN && factor <= SCALE_MAX;
}

/** A zoom that is not one the viewer can take reads as `auto`. */
const zoomShape = z.string().refine(zoomOf).catch('auto');

const placeShape = z.object({
    page: z.number().int().positive(),
    left: z.number(),
    top: z.number(),
    scaleValue: zoomShape,
    scroll: z.enum(['vertical', 'horizontal', 'wrapped', 'page']).catch('vertical'),
    spread: z.enum(['none', 'odd', 'even']).catch('none'),
    sidebar: z.enum(['', 'outline', 'thumbnails']).catch('')
});

const filePlaceShape = z.object({
    root: z.string().min(1),
    path: z.string().min(1),
    place: placeShape
});

/** The place a value holds, or null when it is no object or a number of it is no number. */
export function readPdfPlace(value: unknown): PdfPlace | null {
    return readAs(placeShape, value);
}

/**
 * The per-file list out of a value: no list reads as the empty one, a bad entry is dropped, the
 * first entry of a root and path stands, and at most 50 are kept.
 */
export function readPdfPlaces(value: unknown): FilePlace[] {
    const entries = readAs(rowsShape(filePlaceShape), value) ?? [];
    const seen = new Set<string>();
    const kept: FilePlace[] = [];
    for (const entry of entries) {
        const id = `${entry.root}\n${entry.path}`;
        if (seen.has(id)) continue;
        seen.add(id);
        kept.push(entry);
    }
    return kept.slice(0, PDF_PLACES_LIMIT);
}

/** The list with this file's place first and no other entry of its root and path. */
export function withPdfPlace(
    list: readonly FilePlace[],
    root: string,
    path: string,
    place: PdfPlace
): FilePlace[] {
    const others = list.filter((entry) => entry.root !== root || entry.path !== path);
    return [{ root, path, place }, ...others].slice(0, PDF_PLACES_LIMIT);
}

/** The place a tab's ui record, read as a map (`instanceMap`), holds under `pdf`, or null. */
export function readTabPlace(record: Readonly<Record<string, unknown>>): PdfPlace | null {
    return readPdfPlace(record.pdf);
}

/** A tab's ui record, read as a map, with its place set and the rest as it was. */
export function withTabPlace(
    record: Readonly<Record<string, unknown>>,
    place: PdfPlace
): Record<string, unknown> {
    return { ...record, pdf: place };
}
