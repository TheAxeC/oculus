// Layer 3, shared view partial. The right-click menu of rendered text: the Markdown a view draws
// (Markdown.svelte) and the document the Document view frames, as VS Code gives its Markdown
// preview one. Copy while text is selected; Copy Image over an image; and Open Image over an image
// the hub serves from api/file, which opens that file in the file view. Rendered text offers no Cut
// and no Paste, since neither can change it, and with no selection and no image nothing opens, as
// VS Code opens nothing over plain workbench text.
//
// What the menu is built from is read as the right-click arrives: the selected text, and the image
// under the pointer. The Document view's frame is a document of its own, so what is read there is
// read by the shape of the frame's elements rather than by this page's element classes.
//
// The items are a pure function of what was read, so which items a place offers is asserted
// without a DOM, and the words come in as `t` so every label is a catalog key.

import { grouped, type MenuItem } from '$lib/ui/menu/menu-items';
import { nameOf } from '$lib/state/sources/fs';

type Words = (key: string, ...args: (string | number)[]) => string;

export const PROSE_COPY = 'copy';
export const PROSE_COPY_IMAGE = 'copy-image';
export const PROSE_OPEN_IMAGE = 'open-image';

/** The address api/file answers under, for a root and a path. */
const FILE_API = '/api/file/';

/**
 * What the menu is built from: a selection, the address of the image under the pointer, the page.
 */
export type ProseFacts = { selection: boolean; image: string | null; origin: string };

/**
 * The root and the path an image address names when the hub serves it from api/file on this page's
 * own origin, each segment decoded; null for any other address.
 */
export function hubFileOf(src: string, origin: string): { root: string; path: string } | null {
    let url: URL;
    try {
        url = new URL(src, origin);
    } catch {
        return null;
    }
    if (url.origin !== origin || !url.pathname.startsWith(FILE_API)) return null;
    const segments = url.pathname.slice(FILE_API.length).split('/');
    const [root, ...rest] = segments;
    const parts = rest.filter((one) => one !== '');
    if (root === '' || parts.length === 0) return null;
    try {
        return {
            root: decodeURIComponent(root),
            path: parts.map((one) => decodeURIComponent(one)).join('/')
        };
    } catch {
        return null;
    }
}

/** The items: Copy with a selection, then Copy Image and, on a served image, Open Image. */
export function proseMenu(facts: ProseFacts, t: Words): MenuItem[] {
    const image = facts.image;
    return grouped([
        facts.selection ? [{ id: PROSE_COPY, label: t('ui.prose_copy') }] : [],
        image === null
            ? []
            : [
                  { id: PROSE_COPY_IMAGE, label: t('ui.prose_copy_image') },
                  ...(hubFileOf(image, facts.origin) === null
                      ? []
                      : [{ id: PROSE_OPEN_IMAGE, label: t('ui.prose_open_image') }])
              ]
    ]);
}

/** The part of an element this reads, which an element of the frame's document has as well. */
type Found = { closest: (selector: string) => unknown };

/**
 * What a right-click in rendered text reads: the selected text, and the address of the image under
 * the pointer, or null. The image is found by its tag, so an element of the Document view's frame
 * is read the same as one of this page.
 */
export function proseAt(
    target: EventTarget | null,
    selection: Selection | null
): { text: string; image: string | null } {
    const text = selection === null || selection.isCollapsed ? '' : selection.toString();
    const holder = target as Partial<Found> | null;
    const found = typeof holder?.closest === 'function' ? holder.closest('img') : null;
    const img = found as { currentSrc?: string; src?: string } | null;
    const current = img?.currentSrc ?? '';
    const image = current === '' ? (img?.src ?? '') : current;
    return { text, image: image === '' ? null : image };
}

/** A picture's bytes as PNG, the one image type the clipboard takes, drawn through a canvas. */
async function asPng(blob: Blob): Promise<Blob> {
    if (blob.type === 'image/png') return blob;
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
    bitmap.close();
    return new Promise((resolve, reject) => {
        canvas.toBlob((png) => {
            if (png === null) reject(new Error('no PNG'));
            else resolve(png);
        }, 'image/png');
    });
}

/**
 * Copy an image to the clipboard: its pixels, as PNG, when the page may read them. An image on
 * another site that does not let this page read its bytes is copied as the markup and the address
 * a browser's own Copy Image carries beside the pixels, so a paste into a document still brings the
 * picture.
 */
export async function copyImage(src: string): Promise<void> {
    try {
        const answer = await fetch(src);
        if (!answer.ok) throw new Error(String(answer.status));
        const png = await asPng(await answer.blob());
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
        return;
    } catch {
        // The bytes cannot be read here: the markup and the address are copied instead.
    }
    const escaped = src.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
    const html = new Blob([`<img src="${escaped}">`], { type: 'text/html' });
    const plain = new Blob([src], { type: 'text/plain' });
    await navigator.clipboard
        .write([new ClipboardItem({ 'text/html': html, 'text/plain': plain })])
        .catch(() => undefined);
}

/** What a pick needs: the view store's open, which Open Image opens the file view with. */
export type ProseDeps = { openView: (view: string, state: unknown) => unknown };

/** Run a pick over what the right-click read. */
export function prosePicked(
    pick: string,
    read: { text: string; image: string | null },
    deps: ProseDeps
): void {
    const image = read.image;
    if (pick === PROSE_COPY) void navigator.clipboard.writeText(read.text).catch(() => undefined);
    else if (pick === PROSE_COPY_IMAGE && image !== null) void copyImage(image);
    else if (pick === PROSE_OPEN_IMAGE && image !== null) {
        const file = hubFileOf(image, window.location.origin);
        if (file !== null) deps.openView('file', { ...file, label: nameOf(file.path) });
    }
}
