import { glyphCatalog, textCatalog, vocabCatalog } from '$lib/data/sources/config';
import type { PageServerLoad } from './$types';

// What the print page of a deck draws from: the catalog's words, the glyph vocabulary, the icon
// drawings and the tone and theme vocabulary the server read, as the main page's load ships them,
// and the write token, which is how the page reads the deck from the deck route as the Present view
// does. The page holds no client state, socket or collections, so it is handed no seed.
export const load: PageServerLoad = ({ locals }) => {
    const { config } = locals.config();
    return {
        text: textCatalog(config),
        glyphs: glyphCatalog(config),
        icons: locals.server.icons.set,
        vocab: vocabCatalog(config),
        hubs: locals.server.configCache.vocab(),
        token: locals.token
    };
};
