// Layer 3, shared view helper. A relative link to a Markdown file, read from the document it is
// drawn in. Help and the doc view draw oculus's manual, the Apps guide and the hub's documents,
// which link to one another by relative address (`docs/apps.md`, `docs/HELP.md#the-keys`), the
// address a Markdown reader opening the file in place follows; the page resolves it against the
// linking document's own folder, in the space that document is read in, and opens the file in a
// tab instead of leaving the page.
//
// A document is read in one of two spaces (the answer's `engine`): a hub, whose paths are relative
// to that hub's folder, or the engine folder, whose paths are relative to oculus's own folder. The
// manual and the engine's guides are read in the engine's space, so their links reach one another
// on a hub that does not hold them, and `openingOf` says where a link opens in either space: the
// Help view, a document of the engine, or a document of the hub.

import { normalisePath } from '$lib/state/sources/explorer/view/place';
import {
    engineHubPath,
    engineRelative,
    engineServes
} from '$lib/state/workbench/navigation/catalogue';
import type { DocState } from '$lib/state/system/docs.svelte';

/** A relative link to a Markdown file: where it points, and the heading it names, if any. */
export type DocLink = {
    /**
     * The target's path relative to the space of the linking document, beginning with `../` when
     * it climbs out of that space, or the empty string when the linking document has no path.
     */
    path: string;
    /** The heading's id as the link wrote it, without the `#`, or the empty string. */
    fragment: string;
};

/** Where a link between documents opens: the Help view, or a document tab of one of two kinds. */
export type DocOpening =
    | { kind: 'help' }
    | { kind: 'engine'; path: string }
    | { kind: 'hub'; path: string; hub: string };

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
 * `from`, a path relative to the space the document is read in; null for any other address (a
 * fragment alone, an outward link, a file of another kind), which the page leaves to the browser.
 * The target is `from`'s folder joined with the address and normalised by `normalisePath`, so a
 * target that climbs above the space begins with `../`. Every target of a document with no path
 * (the empty `from`) has the empty path, since the page cannot name its folder.
 */
export function docLinkOf(href: string, from: string): DocLink | null {
    if (href === '' || href.startsWith('#') || OWN_ADDRESS.test(href)) return null;
    const hash = href.indexOf('#');
    const address = hash < 0 ? href : href.slice(0, hash);
    const fragment = hash < 0 ? '' : href.slice(hash + 1);
    if (!address.endsWith('.md')) return null;
    if (from === '') return { path: '', fragment };
    const folder = from.split('/').slice(0, -1).join('/');
    return { path: normalisePath(`${folder}/${decoded(address)}`), fragment };
}

/** Whether a normalised path climbs out of the folder it was normalised against. */
function climbsOut(path: string): boolean {
    return path === '..' || path.startsWith('../');
}

/** Where a path of the hub opens: the Help view for the manual, else the engine or the hub. */
function inHub(path: string, manual: string, engineAt: string, hub: string): DocOpening {
    if (path === manual) return { kind: 'help' };
    const inner = engineRelative(path, engineAt);
    return inner === null ? { kind: 'hub', path, hub } : { kind: 'engine', path: inner };
}

/**
 * Where a link opens, read from the document that holds it. In the engine's space the manual opens
 * the Help view and any other file of the engine folder opens as a document of the engine; a link
 * that climbs out of the folder, or names a place the engine read never serves, is read in the hub
 * at `engineAt` in the hub `engineHub` that holds the engine folder, and opens nothing when no hub
 * does. In a hub's space the manual opens the Help view first, a path inside the engine folder
 * opens as the engine's document, so one document is one tab whichever document linked to it, and
 * any other path opens as a document of the same hub. Null for a link with no path and for one that
 * leaves the hub.
 */
export function openingOf(
    link: DocLink,
    doc: Pick<DocState, 'engine' | 'engineAt' | 'engineHub' | 'hub' | 'manual'>
): DocOpening | null {
    const { engineAt } = doc;
    if (link.path === '') return null;
    if (!doc.engine) {
        return climbsOut(link.path) ? null : inHub(link.path, doc.manual, engineAt, doc.hub);
    }
    if (link.path === doc.manual) return { kind: 'help' };
    if (!climbsOut(link.path) && engineServes(link.path)) {
        return { kind: 'engine', path: link.path };
    }
    if (engineAt === '' || doc.engineHub === '') return null;
    const up = normalisePath(engineHubPath(link.path, engineAt));
    return climbsOut(up)
        ? null
        : inHub(up, engineHubPath(doc.manual, engineAt), engineAt, doc.engineHub);
}

/**
 * A tab's saved state without the heading a link named. The view that scrolled to the heading
 * writes this back, so the heading is scrolled to once and is not left in the saved layout.
 */
export function withoutFragment(state: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(state).filter(([key]) => key !== 'fragment'));
}
