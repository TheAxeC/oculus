import { vscodeRuleIds } from '$lib/data/places/code-rules';
import { glyphCatalog, textCatalog, vocabCatalog } from '$lib/data/sources/config';
import { firstAppThemes } from '$lib/server/machine/apps/routes/theme';
import type { PageServerLoad } from './$types';

// What the print page of a deck draws from: the catalog's words, the glyph vocabulary, the icon
// drawings, the tone and theme vocabulary the server read, the classes a VS Code code theme may
// name and the colour themes of apps the theme options name, as the main page's load ships them,
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
        codeThemeClasses: vscodeRuleIds(),
        appThemes: firstAppThemes(locals.server.apps.held(), config),
        token: locals.token
    };
};
