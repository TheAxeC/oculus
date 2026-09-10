import { engineDir, loadTextCatalog } from '$lib/data/sources/config';
import type { PageServerLoad } from './$types';

// The catalog is read per request and shipped as page data. O6 replaces the read with an
// in-memory copy the watcher pushes.
export const load: PageServerLoad = () => {
  return { text: loadTextCatalog(engineDir()) };
};
