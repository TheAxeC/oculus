// Layer 3, shared view partial. The web page a feed row's address names, apart from a view so the
// lead card and the radar card ask it once. Both draw a link to a posting or a paper and neither
// draws one for a value that names no web page.

import { hrefOf } from '$lib/state/collection';

/**
 * The web page an address names, or nothing for a value that names no web page. A value written
 * without its scheme is one, since `hrefOf` puts `https://` in front of a host; a hub path and any
 * other scheme are not, which is what these cards drew before.
 */
export function posting(value: string): string | undefined {
    const held = value.trim();
    if (held === '') return undefined;
    const href = hrefOf(held);
    return href.startsWith('http') ? href : undefined;
}
