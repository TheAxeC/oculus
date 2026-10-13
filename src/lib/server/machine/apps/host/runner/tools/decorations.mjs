// Layer 2, server. `oculus.window.registerFileDecorationProvider` of the host's object: the badge,
// tooltip and colour a provider gives a file of the Files view. A provider is registered with
// oculus once for the host (`oculus/decorations/register`); oculus asks for the decorations of the
// files a page draws (`oculus/decorations/provide`, a list of URIs answered by a list of the
// answers of every provider, in the order they were registered) and is told which files changed
// (`oculus/decorations/changed`, a list of URIs, or none for every file).
//
// A provider that throws or answers nothing gives no decoration for that file; the answer of the
// others stands. The URIs of one frame are sent as one message: a provider that fires a change per
// file does not make a message per file.

import { Disposable, NO_CANCEL } from '../values/events.mjs';
import { Uri } from '../values/uri.mjs';

/** The milliseconds changes are gathered for before they are sent: one animation frame. */
const FRAME_MS = 16;

/** The most URIs one change message holds; a larger set is told as a change of every file. */
const CHANGES_MAX = 5000;

/** A decoration as oculus is sent it, or null when the provider gave none. */
function plain(value) {
    if (value === null || value === undefined || typeof value !== 'object') return null;
    const color = value.color;
    return {
        badge: typeof value.badge === 'string' ? value.badge : '',
        tooltip: typeof value.tooltip === 'string' ? value.tooltip : '',
        color: typeof color?.id === 'string' ? color.id : '',
        propagate: value.propagate === true
    };
}

/**
 * The decorations part.
 * @param {{
 *   connection: import('vscode-jsonrpc').MessageConnection,
 *   report: (error: unknown) => void,
 * }} link
 */
export function createDecorations(link) {
    const { connection, report } = link;
    const providers = [];
    let registered = false;
    let queued = null;
    let timer = null;

    const flush = () => {
        timer = null;
        const uris = queued;
        queued = null;
        if (uris === null) return;
        const all = uris === true;
        void connection
            .sendNotification('oculus/decorations/changed', { uris: all ? [] : [...uris], all })
            .catch(report);
    };

    /** Gather a change for the next frame; `null` stands for every file. */
    const changed = (uris) => {
        if (uris === null || queued === true) queued = true;
        else {
            queued ??= new Set();
            for (const one of uris) queued.add(one);
            if (queued.size > CHANGES_MAX) queued = true;
        }
        if (timer !== null) return;
        timer = setTimeout(flush, FRAME_MS);
        timer.unref?.();
    };

    const urisOf = (value) => {
        if (value === undefined || value === null) return null;
        return (Array.isArray(value) ? value : [value]).map((one) => one.toString());
    };

    connection.onRequest('oculus/decorations/provide', async (params) => {
        const out = [];
        for (const uri of params.uris) {
            const parsed = Uri.parse(uri);
            const answers = [];
            for (const entry of [...providers]) {
                try {
                    const given = await entry.provider.provideFileDecoration(parsed, NO_CANCEL);
                    answers.push(plain(given));
                } catch (error) {
                    report(error);
                    answers.push(null);
                }
            }
            out.push(answers);
        }
        return out;
    });

    const api = {
        registerFileDecorationProvider(provider) {
            if (typeof provider?.provideFileDecoration !== 'function') {
                throw new TypeError('a file decoration provider has provideFileDecoration');
            }
            const entry = { provider };
            providers.push(entry);
            if (!registered) {
                registered = true;
                void connection.sendRequest('oculus/decorations/register', {}).catch(report);
            }
            const listening = provider.onDidChangeFileDecorations?.((value) =>
                changed(urisOf(value))
            );
            changed(null);
            return new Disposable(() => {
                listening?.dispose();
                providers.splice(providers.indexOf(entry), 1);
                if (providers.length === 0 && registered) {
                    registered = false;
                    void connection.sendRequest('oculus/decorations/unregister', {}).catch(report);
                }
                changed(null);
            });
        }
    };

    return {
        api,
        stop() {
            if (timer !== null) clearTimeout(timer);
            timer = null;
            queued = null;
        }
    };
}
