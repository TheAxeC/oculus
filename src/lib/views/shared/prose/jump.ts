// Layer 3, shared view helper. A press on a link to a fragment (`#id`, a table of contents' entry
// among them) inside drawn Markdown is handled inside the view, never through the address. The
// prose partial (Markdown.svelte) and a slide's narrative (present/parts/Words.svelte) both hand
// their clicks to `jump`, so every drawn document answers such a link the same way.
//
// A view that follows links between documents (the Help and doc views) also hands `jump` a
// follower: a press on a relative link to a `.md` file is resolved from the linking document
// (doc-link.ts) and opened by the follower, and the page's address stays as it was. Any other
// link, a relative one to another kind of file included, is left to the browser.
//
// The heading a link names is looked up inside the box of the view the link is drawn in, the
// element carrying `data-instance`: a manual drawn as several runs of prose reaches a heading in
// another run, and two tabs holding the same ids each reach their own. A fragment is tried as
// written, percent-decoded, and with the heading-id prefix before either, so a link written by
// hand to `#method` reaches the heading `method`, whose id carries the prefix. What scrolls is the
// nearest box around the heading that scrolls, looked for no further out than the pane's own
// scrolling body around the view (`data-scroll`): the view's box in the doc and help views, the
// preview's frame in the source tab, and the pane's body in the project view, whose own box does
// not scroll. A heading with no such box around it is not scrolled to, and nothing of the shell
// outside the pane ever scrolls.
//
// A box drawn under a scale transform (a slide in its frame) measures its rectangles in screen
// pixels and scrolls in layout pixels, so the distance to the heading is divided by the box's
// scale.

import { HEADING_ID_PREFIX } from '$lib/ui/html';
import { docLinkOf, type DocLink } from './doc-link';

/** What opens a link between documents: the linking document's path and the opener. */
export type LinkFollower = {
    /** The linking document's path relative to the hub, the empty string when it has none. */
    from: string;
    /** Opens the document a link names; told the empty path when the link leaves the hub. */
    open: (link: DocLink) => void;
};

/**
 * A press on a fragment link: the page's address is left as it is and the heading the fragment
 * names, inside the link's own view, is scrolled to the top of the box that scrolls it. A fragment
 * naming nothing in the view does nothing else. With a follower, a press on a relative link to a
 * Markdown file is handed to it and the address is left as it is too. Any other press is left to
 * the browser.
 */
export function jump(event: MouseEvent, follower?: LinkFollower): void {
    const link = event.target instanceof Element ? event.target.closest('a') : null;
    const href = link?.getAttribute('href') ?? '';
    if (link === null) return;
    if (!href.startsWith('#')) {
        const target = follower === undefined ? null : docLinkOf(href, follower.from);
        if (target === null || follower === undefined) return;
        event.preventDefault();
        follower.open(target);
        return;
    }
    event.preventDefault();
    const box = link.closest('[data-instance]');
    if (box !== null) scrollToFragment(box, href.slice(1));
}

/**
 * Scroll the heading a fragment names, inside the view's box, to the top of the box that scrolls
 * it. A fragment naming nothing in the box, or a heading with no scrolling box around it, does
 * nothing. The press on a link and the Outline's press on a row both come here.
 */
export function scrollToFragment(box: Element, fragment: string): void {
    const heading = named(box, fragment);
    if (heading === null) return;
    const scroller = scrollerOf(heading, box);
    if (scroller === null) return;
    const distance = heading.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    scroller.scrollTop += distance / scaleOf(scroller);
}

/**
 * How much a box is scaled on screen: its drawn height over its layout height, and 1 when either
 * is 0 (a box not laid out yet).
 */
function scaleOf(box: HTMLElement): number {
    const drawn = box.getBoundingClientRect().height;
    return drawn === 0 || box.offsetHeight === 0 ? 1 : drawn / box.offsetHeight;
}

/**
 * The element of a view's box carrying the id a fragment names: the fragment as written, as its
 * percent-encoded form reads, and each with the heading-id prefix before it, the first that
 * matches winning. Ids are compared as strings, so no id has to be a valid selector.
 */
function named(box: Element, fragment: string): Element | null {
    const plain = [fragment, decoded(fragment)].filter((one) => one !== '');
    const wanted = [...plain, ...plain.map((one) => `${HEADING_ID_PREFIX}${one}`)];
    const ids = [...box.querySelectorAll('[id]')];
    for (const one of wanted) {
        const found = ids.find((element) => element.id === one);
        if (found !== undefined) return found;
    }
    return null;
}

function decoded(fragment: string): string {
    try {
        return decodeURIComponent(fragment);
    } catch {
        return '';
    }
}

/**
 * The nearest element around a heading that scrolls its content, looked for from the heading out
 * to the pane's scrolling body around the view's box and no further, or null for none.
 */
function scrollerOf(heading: Element, box: Element): HTMLElement | null {
    const limit = box.closest('[data-scroll]') ?? box;
    for (let at = heading.parentElement; at !== null; at = at.parentElement) {
        const overflow = getComputedStyle(at).overflowY;
        const scrolls = overflow === 'auto' || overflow === 'scroll';
        if (scrolls && at.scrollHeight > at.clientHeight) return at;
        if (at === limit) return null;
    }
    return null;
}
