// Layer 2, server. What the Markdown server writes into an answer that the page is not given: a
// completion item or a hover quotes the file it leads to in the absolute path of this machine, in
// its documentation text. The path inside the root stays, written relative to it, and a text that
// holds a `file://` address afterwards (a file outside the root) is emptied.

import type { ServedRoot } from '../../uris.ts';

/** The methods whose answers quote the files they lead to. */
const QUOTING = ['textDocument/completion', 'completionItem/resolve', 'textDocument/hover'];

/** A text without the root's path in either of its spellings, or empty if it names another file. */
function relativeText(text: string, root: ServedRoot): string {
    const folder = root.real.endsWith('/') ? root.real : `${root.real}/`;
    const bare = text.split(`file://${folder}`).join('').split(folder).join('');
    return bare.includes('file://') ? '' : bare;
}

/** A value with the machine's paths taken out of every text in it. */
function scrubbed(value: unknown, root: ServedRoot): unknown {
    if (typeof value === 'string') return relativeText(value, root);
    if (Array.isArray(value)) return value.map((one) => scrubbed(one, root));
    if (typeof value !== 'object' || value === null) return value;
    return Object.fromEntries(
        Object.entries(value).map(([key, inner]) => [key, scrubbed(inner, root)])
    );
}

/** The answer to a request of the page, without the paths of this machine in its texts. */
export function markdownResults(method: string, result: unknown, root: ServedRoot): unknown {
    return QUOTING.includes(method) ? scrubbed(result, root) : result;
}
