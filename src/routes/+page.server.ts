import { engineDir, loadConfig, textCatalog } from '$lib/data/sources/config';
import type { PageServerLoad } from './$types';

// The catalog is read per request and shipped as page data. O6 replaces the read with an
// in-memory copy the watcher pushes. A finding from the same read is reported in hooks.server.ts,
// which runs for every request, so it is said once and not once per load function.
export const load: PageServerLoad = () => {
    return { text: textCatalog(loadConfig(engineDir()).config) };
};
