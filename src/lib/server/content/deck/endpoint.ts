// Layer 2, server. The deck endpoint's work: GET /api/deck takes the key of a served root and a
// folder under it, and answers the deck read there (deck/read.ts). POST /api/deck answers the same
// deck read over drafts: the body names the root and the folder and lists the text an editor holds
// unsaved for files, and the deck is read as if those files held that text. The POST is a read:
// it writes nothing.
//
// Like the search, both carry the page's token: they read Markdown files and a `present.yml` of
// any served root, and, through a group's `find:`, the folders of the whole hub below it. A root
// nothing serves and a path that leaves its root are refused as `outside`. A draft larger than
// `MAX_DRAFT_BYTES` refuses the request.

import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { readAs } from '../../../data/shapes/shapes.ts';
import { MAX_DRAFT_BYTES } from '../../../data/file-ops.ts';
import { hasToken } from '../../core/auth.ts';
import { readDeck, type DeckSource } from './read.ts';

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/** The most drafts one request may carry. */
const MAX_DRAFTS = 64;

/** The body of a POST: the deck, and the drafts it is read over. */
const postShape = z.object({
    root: z.string().min(1),
    path: z.string(),
    drafts: z
        .array(z.object({ root: z.string().min(1), path: z.string().min(1), text: z.string() }))
        .max(MAX_DRAFTS)
});

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

/**
 * POST /api/deck: the same refusals, a body that is not the shape above, then the deck over drafts.
 */
export async function handleDeckDrafts(
    request: Request,
    token: string,
    source: DeckSource
): Promise<Response> {
    if (!hasToken(request, token)) {
        return json({ error: 'token' }, { status: 403, headers: NO_STORE });
    }
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return json({ error: 'invalid' }, { status: 400, headers: NO_STORE });
    }
    const asked = readAs(postShape, body);
    if (asked === null) return json({ error: 'invalid' }, { status: 400, headers: NO_STORE });
    if (asked.drafts.some((one) => Buffer.byteLength(one.text) > MAX_DRAFT_BYTES)) {
        return json({ error: 'large' }, { status: 413, headers: NO_STORE });
    }
    const deck = readDeck(source, asked.root, asked.path, asked.drafts);
    if (deck === 'outside') {
        return json({ error: 'outside' }, { status: 403, headers: NO_STORE });
    }
    return json(deck, { headers: NO_STORE });
}
