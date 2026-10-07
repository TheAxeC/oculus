// Layer 3, view helper. Export to PDF, the Present pane's only export. In the desktop app the host
// prints the deck's print route (routes/present/print) in a hidden window and answers the PDF's
// bytes, which are written beside the deck as `<name>.pdf` through the Files view's upload, so the
// write is recorded in the change log and undone from it as an upload is. A file of that name that
// already exists is asked about first, as the Files view asks. In a browser tab there is no host:
// the print route opens in a new tab, which opens the browser's print dialog when it is ready.
//
// `<name>` is the deck folder's name, the project's name for a project's `present/` folder, and
// the root's folder name for a deck at the top of a root (the deck's own `name`).

import {
    MAX_UPLOAD_MB,
    pdfFits,
    printAddress,
    type Deck,
    type DeckRef
} from '$lib/state/life/present';
import { refusalSentence } from '$lib/state/shared/answers/answers';
import { t } from '$lib/state/shared/words/text';
import type { ExplorerStore, Outcome } from '$lib/state/sources/explorer/ops.svelte';
import { READY_WAIT_MS, type DesktopBridge } from '$lib/state/shared/stores/desktop';
import type { Ask } from '$lib/views/shared/writes/ask';

/** What the export needs from the pane and the page. */
export type ExportDeps = {
    ref: DeckRef;
    deck: Deck;
    /** The desktop bridge, or undefined in a browser. */
    bridge: DesktopBridge | undefined;
    upload: ExplorerStore['upload'];
    /** Open the print route's address in a new browser tab. */
    openTab: (address: string) => void;
    say: (line: string) => void;
    ask: (question: Ask) => void;
};

/** The PDF's file name: the deck's name, or the root's key for a deck whose name is empty. */
function pdfName(deck: Deck, ref: DeckRef): string {
    return `${deck.name === '' ? ref.root : deck.name}.pdf`;
}

/** The base64 text of bytes, in chunks the string builder takes. */
function base64(bytes: Uint8Array): string {
    const chunk = 0x8000;
    let text = '';
    for (let at = 0; at < bytes.length; at += chunk) {
        text += String.fromCharCode(...bytes.subarray(at, at + chunk));
    }
    return btoa(text);
}

/** What a refused write says. */
function outcomeLine(outcome: Outcome): string {
    if (outcome.ok) return '';
    return outcome.error === 'network'
        ? t('present.failed_network')
        : refusalSentence(outcome.error);
}

/** Write the PDF beside the deck, asking before it replaces a file of the same name. */
async function put(deps: ExportDeps, name: string, data: string, replace: boolean): Promise<void> {
    const outcome = await deps.upload(
        { root: deps.ref.root, path: deps.ref.path },
        name,
        data,
        () => Promise.resolve(replace)
    );
    if (outcome.ok) {
        deps.say(t('present.export_done', name));
    } else if (outcome.error === 'exists') {
        deps.ask({
            message: t('files.replace_question', name),
            detail: t('files.replace_detail_upload'),
            confirm: t('files.replace_button'),
            act: () => void put(deps, name, data, true)
        });
    } else deps.say(outcomeLine(outcome));
}

/** Export the deck to a PDF beside it. */
export async function exportPdf(deps: ExportDeps): Promise<void> {
    // The host prints an address of the server the window shows, so it is named whole.
    const address = new URL(printAddress(deps.ref), window.location.origin).href;
    if (deps.bridge === undefined) {
        deps.openTab(address);
        deps.say(t('present.export_opened'));
        return;
    }
    deps.say(t('present.export_busy'));
    const answer = await deps.bridge.printPdf(address).catch(() => null);
    if (!answer?.ok) {
        deps.say(
            answer?.error === 'timeout'
                ? t('desktop.print.timeout', String(READY_WAIT_MS / 1000))
                : t('desktop.print.failed')
        );
        return;
    }
    if (!pdfFits(answer.bytes.length)) {
        deps.say(t('present.export_too_large', String(MAX_UPLOAD_MB)));
        return;
    }
    await put(deps, pdfName(deps.deck, deps.ref), base64(answer.bytes), false);
}
