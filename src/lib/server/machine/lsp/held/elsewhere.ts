// Layer 2, server. Which files the pages hold open in tabs. An edit a language server asks for
// reaches files by `lsp-edit` only when no page holds them in a tab (the tab's text is the page's
// and not the disk's), so every page tells the relay on the channel `lsp:workspace` the whole set
// of files its tabs show, whatever their language or whether a server serves it, and asks which
// of the files an edit names another page holds. A file is compared by the real path its root's
// served directory and its path make, NFC-normalised.

import { join } from 'node:path';
import type { LspPlace, LspToPage } from '../../../../data/model/index.ts';
import { normal, type ServedRoot } from '../uris.ts';
import type { Inbound } from '../wire.ts';
import type { Page } from './held.ts';

/** The path a file of a served root is at, or null for a root key that is not served. */
function pathOf(roots: readonly ServedRoot[], file: LspPlace): string | null {
    const root = roots.find((one) => one.key === file.root);
    if (root === undefined) return null;
    return normal(join(root.real, ...file.path.split('/').filter((part) => part !== '')));
}

/** Take the files a page now holds open in tabs. */
function holdTabs(page: Page, roots: readonly ServedRoot[], files: LspPlace[]): void {
    page.tabs = new Set(files.flatMap((file) => pathOf(roots, file) ?? []));
}

/** Whether a page other than `asking` holds the file at a real path open in a tab. */
export function isHeldElsewhere(pages: Iterable<Page>, asking: Page, real: string): boolean {
    const wanted = normal(real);
    for (const other of pages) {
        if (other !== asking && other.tabs.has(wanted)) return true;
    }
    return false;
}

/** Those of the files that a page other than `asking` holds open in a tab. */
function heldElsewhere(
    pages: Iterable<Page>,
    asking: Page,
    roots: readonly ServedRoot[],
    files: LspPlace[]
): LspPlace[] {
    const all = [...pages];
    return files.filter((file) => {
        const path = pathOf(roots, file);
        return path !== null && isHeldElsewhere(all, asking, path);
    });
}

/**
 * A message of the channel `lsp:workspace`, which no document is on: the files the page holds
 * open in tabs, and the question which of some files another page holds open, answered through
 * `send`.
 */
export function workspaceMessage(
    pages: Iterable<Page>,
    page: Page,
    roots: readonly ServedRoot[],
    payload: Inbound,
    send: (payload: LspToPage) => void
): void {
    if (payload.kind !== 'oculus') return;
    const message = payload.message;
    if (message.oculus === 'held') holdTabs(page, roots, message.files);
    else if (message.oculus === 'held_ask') {
        const files = heldElsewhere(pages, page, roots, message.files);
        send({ oculus: 'held_answer', id: message.id, files });
    }
}
