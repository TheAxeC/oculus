import {
    asciiCatalog,
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '$lib/data/sources/config';
import type { PageServerLoad } from './$types';

// The catalog, the glyph vocabulary with its ASCII stand-ins, and the tone vocabulary are read per
// request and shipped as page data. O6 replaces the read with an in-memory copy the watcher pushes.
// A finding from the same read is reported in hooks.server.ts, which runs for every request, so it
// is said once and not once per load function.
export const load: PageServerLoad = () => {
    const { config } = loadConfig(engineDir());
    return {
        text: textCatalog(config),
        glyphs: glyphCatalog(config),
        ascii: asciiCatalog(config),
        vocab: vocabCatalog(config)
    };
};
