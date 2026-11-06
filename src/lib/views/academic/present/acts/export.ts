// Layer 3, view helper. Export to PDF, the Present pane's only export. In the desktop app the host
// prints the deck's print route (routes/present/print) in a hidden window opened at the frame of
// the deck as saved, which is what the route draws, and answers the PDF's bytes, which are written
// beside the deck as `<name>.pdf` through the Files view's upload, so the write is recorded in the
// change log and undone from it as an upload is. A file of that name that already exists is asked
// about first, as the Files view asks. In a browser tab there is no host: the print route opens in
// a new tab, which opens the browser's print dialog when it is ready.
//
// The print route's address names the deck and nothing else, so the PDF learns the pane's filter
// and its Project facts toggle over the deck's channel: from the press until the print page has
// asked for them and been answered, or for `EXPORT_HOLD_MS`, the pane holds the deck's export under
// a Web Lock named for it (`exportName`) and answers the page's `keep-asked` with its kept list and
// its toggle as they were at the press, and the moment of the press. This holds on both paths,
// the browser tab's too, where the export returns once the tab is open. A press of Export on the
// same deck while the lock is held, from any pane of any window, says an export is in progress
// and prints nothing. In a browser tab the print tab opens inside the press, before the lock is
// asked for, so a press while the lock is held opens a tab and closes it again.
//
// `<name>` is the deck folder's name, the project's name for a project's `present/` folder, and
// the root's folder name for a deck at the top of a root (the deck's own `name`).

import {
    MAX_UPLOAD_MB,
    exportName,
    parseMessage,
    pdfFits,
    presentName,
    printAddress,
    type Deck,
    type DeckFrame,
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
    /** The kept list of the pane's filter, null for none, which the print page is answered. */
    keep: readonly string[] | null;
    /** The pane's Project facts toggle at the press, which the print page is answered too. */
    facts: boolean;
    /** The frame of the deck as saved, the one the print route draws, which the host prints at. */
    frame: DeckFrame;
    /** The desktop bridge, or undefined in a browser. */
    bridge: DesktopBridge | undefined;
    upload: ExplorerStore['upload'];
    /** Open the print route's address in a new browser tab, giving the tab's window when opened. */
    openTab: (address: string) => Window | null;
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

/**
 * The longest an export holds the deck's export for its print page to ask for the kept list and
 * the toggle.
 */
const EXPORT_HOLD_MS = 10_000;

/**
 * The answer of a print page's ask: done once it is given or the hold is over, or stopped. Nothing
 * is answered before `grant`, so only the export that holds the deck's lock answers a print page.
 */
type KeepReply = { answered: Promise<void>; grant: () => void; stop: () => void };

/**
 * Answer the print page's ask for the kept list and the Project facts toggle over the deck's
 * channel, once, with `at` the moment of the press, after `grant`; an ask heard before it is
 * answered at `grant`. Done once it is answered, after `EXPORT_HOLD_MS`, or when stopped.
 */
function answerPrint(
    ref: DeckRef,
    keep: readonly string[] | null,
    facts: boolean,
    at: number
): KeepReply {
    const channel = new BroadcastChannel(presentName(ref));
    let asked = false;
    let granted = false;
    let over = false;
    let stop = (): void => undefined;
    let reply = (): void => undefined;
    const answered = new Promise<void>((done) => {
        const finish = (): void => {
            if (over) return;
            over = true;
            clearTimeout(timer);
            channel.close();
            done();
        };
        stop = finish;
        reply = () => {
            if (over || !asked || !granted) return;
            channel.postMessage({ kind: 'keep', keep, facts, at });
            finish();
        };
        const timer = setTimeout(finish, EXPORT_HOLD_MS);
        channel.onmessage = (event: MessageEvent<unknown>) => {
            const message = parseMessage(event.data);
            if (message?.kind !== 'keep-asked' || message.from !== 'print') return;
            asked = true;
            reply();
        };
    });
    const grant = (): void => {
        granted = true;
        reply();
    };
    return { answered, grant, stop };
}

/**
 * Take the deck's export when no export holds it, and hold it until the print page is answered:
 * true once it is taken, false while another export of the deck holds it. `answer` is called once
 * the lock is granted and gives the answer of the print page the lock waits for.
 */
function holdExport(ref: DeckRef, answer: () => Promise<void>): Promise<boolean> {
    return new Promise((taken) => {
        const held = (lock: Lock | null): Promise<void> | undefined => {
            if (lock === null) {
                taken(false);
                return undefined;
            }
            const answered = answer();
            taken(true);
            return answered;
        };
        navigator.locks
            .request(exportName(ref), { ifAvailable: true }, held)
            .catch(() => taken(false));
    });
}

/**
 * The browser tab's export. The print tab opens inside the press, before anything is awaited, so no
 * browser's rule for windows opened by a page blocks it, with the channel that answers its ask
 * already listening; the export lock is taken after, and the tab is closed again when another
 * export of the deck holds it. The tab is opened with its handle kept and its `opener` cut; a tab
 * the browser blocks takes no lock and says so. The channel answers the print page only once the
 * lock is granted, so a press the lock refuses never answers another export's print page.
 */
async function exportTab(deps: ExportDeps, address: string): Promise<void> {
    const print = answerPrint(deps.ref, deps.keep, deps.facts, Date.now());
    const tab = deps.openTab(address);
    if (tab === null) {
        print.stop();
        deps.say(t('present.export_blocked'));
        return;
    }
    tab.opener = null;
    const granted = (): Promise<void> => {
        print.grant();
        return print.answered;
    };
    if (!(await holdExport(deps.ref, granted))) {
        print.stop();
        tab.close();
        deps.say(t('present.export_running'));
        return;
    }
    deps.say(t('present.export_opened'));
}

/** Export the deck to a PDF beside it. */
export async function exportPdf(deps: ExportDeps): Promise<void> {
    // The host prints an address of the server the window shows, so it is named whole.
    const address = new URL(printAddress(deps.ref), window.location.origin).href;
    if (deps.bridge === undefined) {
        await exportTab(deps, address);
        return;
    }
    const at = Date.now();
    // The channel listens before the page is opened, so the page's ask is never missed.
    const granted = (): Promise<void> => {
        const print = answerPrint(deps.ref, deps.keep, deps.facts, at);
        print.grant();
        return print.answered;
    };
    if (!(await holdExport(deps.ref, granted))) {
        deps.say(t('present.export_running'));
        return;
    }
    deps.say(t('present.export_busy'));
    const answer = await deps.bridge.printPdf(address, deps.frame).catch(() => null);
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
