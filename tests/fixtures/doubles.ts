// Layer 4, test helper. The inert callbacks a case hands to a component, a fixture or a double when
// it asserts nothing about the call, the write request a page sends, and the entries of a
// hand-built folder listing. They exist once here so a case says "nothing happens on this
// callback" in one word rather than writing an empty function at every prop, every route test
// posts the same page request, and every listing is built from the same two entries.

import type { FsEntry } from '../../src/lib/state/sources/fs.ts';

/** A callback whose call the case does not read. */
export const noop = (): void => undefined;

/** The same where the caller awaits what the callback returns. */
export const noopAsync = (): Promise<void> => Promise.resolve();

/** A POST as the page sends one: JSON, from the page's own origin, carrying the write token. */
export function pagePost(url: string, body: unknown, token: string): Request {
    return new Request(url, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'sec-fetch-site': 'same-origin',
            'x-oculus-token': token
        },
        body: JSON.stringify(body)
    });
}

/** A file of one byte as a folder listing holds it. */
export function file(name: string): FsEntry {
    return { name, kind: 'file', size: 1, mtime: 1 };
}

/** A folder as a folder listing holds it. */
export function dir(name: string): FsEntry {
    return { name, kind: 'dir', size: 0, mtime: 1 };
}
