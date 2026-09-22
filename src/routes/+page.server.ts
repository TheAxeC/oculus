import {
    asciiCatalog,
    collectionKeys,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '$lib/data/sources/config';
import type { PageServerLoad } from './$types';

// The catalog, the glyph vocabulary with its ASCII stand-ins, and the tone vocabulary are read per
// request and shipped as page data, which is what the first frame draws from; every later change
// reaches the page on the `config` channel server/watch/portfolio.ts publishes.
// A finding from the same read is reported in hooks.server.ts, which runs for every request, so it
// is said once and not once per load function.
//
// The icon drawings are the exception: they are files rather than config keys, so the server reads
// them once when its context is built and again on every config push, and this hands the page what
// is held rather than reading a hundred files per request.
//
// The collection keys ride with them for the same reason: the page registers the collection view
// once per key before it renders, and the registry is filled in the page's script body rather than
// from a fetch, so the rail draws every collection on the first frame.
//
// The write token rides with them, which is how DESIGN.md's "Auth" delivers it to the page: it is
// minted by ServerContext, put on the event by hooks.server.ts, and reaches the browser here and
// nowhere else. invalidateAll() runs this load again, which is how a page that met a 403 gets the
// token a restarted server minted.
export const load: PageServerLoad = ({ locals }) => {
    const { config } = loadConfig(locals.server.engine);
    return {
        text: textCatalog(config),
        glyphs: glyphCatalog(config),
        icons: locals.server.icons.set,
        ascii: asciiCatalog(config),
        vocab: vocabCatalog(config),
        collections: collectionKeys(config),
        token: locals.token
    };
};
