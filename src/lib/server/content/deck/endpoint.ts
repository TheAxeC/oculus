// Layer 2, server. The deck endpoint's work: GET /api/deck takes the key of a served root and a
// folder under it, and answers the deck read there (deck/read.ts). POST /api/deck answers the same
// deck read over drafts: the body names the root and the folder and lists the text an editor holds
// unsaved for files, and the deck is read as if those files held that text. The POST is a read:
// it writes nothing.
//
// Both take an optional `keep`, the keys of the projects the Present view's filter keeps: on the
// GET a parameter holding a JSON array, on the POST a field of the body. With it every group of
// project decks draws only the members whose project's key it holds; absent, the deck is whole. A
// `keep` that is not an array of non-empty strings, or holds more than `MAX_KEEP` of them, is
// refused with the word every refused query of the route answers, never read as no filter.
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

/** The most project keys one `keep` may hold. */
const MAX_KEEP = 1024;

/** The keys of the projects a filter keeps. */
const keepShape = z.array(z.string().min(1)).max(MAX_KEEP);

/** The body of a POST: the deck, the drafts it is read over and the filter's keys. */
const postShape = z.object({
    root: z.string().min(1),
    path: z.string(),
    drafts: z
        .array(z.object({ root: z.string().min(1), path: z.string().min(1), text: z.string() }))
        .max(MAX_DRAFTS),
    keep: keepShape.optional()
});

/** The answer of a request the route refuses for its query or its body. */
function invalid(): Response {
    return json({ error: 'invalid' }, { status: 400, headers: NO_STORE });
}

/**
 * The keys a GET's `keep` parameter holds: undefined when there is none, null when it is no JSON
 * array of non-empty strings within the bound.
 */
function keepOf(param: string | null): string[] | undefined | null {
    if (param === null) return undefined;
    let value: unknown;
    try {
        value = JSON.parse(param);
    } catch {
        return null;
    }
    return readAs(keepShape, value);
}

/** GET /api/deck: the refusals in order (the token, the query, the root), then the deck. */
export function handleDeck(request: Request, token: string, source: DeckSource): Response {
    if (!hasToken(request, token)) {
        return json({ error: 'token' }, { status: 403, headers: NO_STORE });
    }
    const params = new URL(request.url).searchParams;
    const root = params.get('root');
    const path = params.get('path');
    const keep = keepOf(params.get('keep'));
    if (root === null || root === '' || path === null || keep === null) return invalid();
    const deck = readDeck(source, root, path, [], keep);
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
        return invalid();
    }
    const asked = readAs(postShape, body);
    if (asked === null) return invalid();
    if (asked.drafts.some((one) => Buffer.byteLength(one.text) > MAX_DRAFT_BYTES)) {
        return json({ error: 'large' }, { status: 413, headers: NO_STORE });
    }
    const deck = readDeck(source, asked.root, asked.path, asked.drafts, asked.keep);
    if (deck === 'outside') {
        return json({ error: 'outside' }, { status: 403, headers: NO_STORE });
    }
    return json(deck, { headers: NO_STORE });
}
