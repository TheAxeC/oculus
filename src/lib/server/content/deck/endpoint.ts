// Layer 2, server. The deck endpoint's work: GET /api/deck takes the key of a served root and a
// folder under it, and answers the deck read there (deck/read.ts).
//
// Like the search, it carries the page's token: it reads Markdown files and a `present.yml` of any
// served root, and, through a group's `find:`, the folders of the whole hub below it. A root
// nothing serves and a path that leaves its root are refused as `outside`.

import { json } from '@sveltejs/kit';
import { hasToken } from '../../core/auth.ts';
import { readDeck, type DeckSource } from './read.ts';

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/** GET /api/deck: the refusals in order (the token, the query, the root), then the deck. */
export function handleDeck(request: Request, token: string, source: DeckSource): Response {
    if (!hasToken(request, token)) {
        return json({ error: 'token' }, { status: 403, headers: NO_STORE });
    }
    const params = new URL(request.url).searchParams;
    const root = params.get('root');
    const path = params.get('path');
    if (root === null || root === '' || path === null) {
        return json({ error: 'invalid' }, { status: 400, headers: NO_STORE });
    }
    const deck = readDeck(source, root, path);
    if (deck === 'outside') {
        return json({ error: 'outside' }, { status: 403, headers: NO_STORE });
    }
    return json(deck, { headers: NO_STORE });
}
