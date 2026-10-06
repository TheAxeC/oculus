// Layer 3, shared view helper. A relative link to a Markdown file, read from the document it is
// drawn in. Help and the doc view draw oculus's manual, its guides and the hub's documents, which
// link to one another by relative address (`docs/configuration.md`, `../HELP.md#the-keys`), the
// address a Markdown reader opening the file in place follows; the page resolves it against the
// linking document's own folder, in the hub, and opens the file in a tab instead of leaving the
// page.

import { normalisePath } from '$lib/state/sources/explorer/view/place';

/** A relative link to a Markdown file: where it points, and the heading it names, if any. */
export type DocLink = {
    /** The target's path relative to the hub, or the empty string when it leaves the hub. */
    path: string;
    /** The heading's id as the link wrote it, without the `#`, or the empty string. */
    fragment: string;
};

/** An address the browser resolves on its own: a scheme, a protocol-relative or absolute path. */
const OWN_ADDRESS = /^(?:[a-z][a-z0-9+.-]*:|\/)/i;

/** A path percent-decoded, or as written when it is not valid percent-encoding. */
function decoded(text: string): string {
    try {
        return decodeURIComponent(text);
    } catch {
        return text;
    }
}

/**
 * The link an `href` is when it is a relative address of a `.md` file, read from the document at
 * `from`, a path relative to the hub; null for any other address (a fragment alone, an outward
 * link, a file of another kind), which the page leaves to the browser. The target is `from`'s
 * folder joined with the address and normalised by `normalisePath`; a target that climbs above the
 * hub has the empty path, and so does every target of a document with no path in the hub (the
 * empty `from`), whose folder the page cannot name.
 */
export function docLinkOf(href: string, from: string): DocLink | null {
    if (href === '' || href.startsWith('#') || OWN_ADDRESS.test(href)) return null;
    const hash = href.indexOf('#');
    const address = hash < 0 ? href : href.slice(0, hash);
    const fragment = hash < 0 ? '' : href.slice(hash + 1);
    if (!address.endsWith('.md')) return null;
    if (from === '') return { path: '', fragment };
    const folder = from.split('/').slice(0, -1).join('/');
    const path = normalisePath(`${folder}/${decoded(address)}`);
    return { path: path === '..' || path.startsWith('../') ? '' : path, fragment };
}

/**
 * A tab's saved state without the heading a link named. The view that scrolled to the heading
 * writes this back, so the heading is scrolled to once and is not left in the saved layout.
 */
export function withoutFragment(state: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(state).filter(([key]) => key !== 'fragment'));
}
