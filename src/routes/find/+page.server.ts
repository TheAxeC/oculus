import { glyphCatalog, textCatalog, vocabCatalog } from '$lib/data/sources/config';
import type { PageServerLoad } from './$types';

// What the desktop app's find bar draws from: the catalog's words, the glyph vocabulary, the icon
// drawings and the tone and theme vocabulary the server read, as the main page's load ships them,
// and nothing else. The bar is a page of its own in a view over a window's page, with no client
// state, no socket and no write token, so it is handed no seed and no collections.
export const load: PageServerLoad = ({ locals }) => {
    const { config } = locals.config();
    return {
        text: textCatalog(config),
        glyphs: glyphCatalog(config),
        icons: locals.server.icons.set,
        vocab: vocabCatalog(config),
        hubs: locals.server.configCache.vocab()
    };
};
