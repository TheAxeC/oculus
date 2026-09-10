import { engineDir, loadTextCatalog } from '$lib/data/sources/config';
import type { Handle } from '@sveltejs/kit';

// The route renders in the browser, so the served HTML is a shell. The document title is the
// one string that has to be in it before the app starts, and it comes from the catalog like
// every other string: app.html carries the placeholder, this replaces it per request.
export const handle: Handle = ({ event, resolve }) => {
  const title = loadTextCatalog(engineDir())['app.title'];
  if (title === undefined) throw new Error('text key not in config/text.yml: app.title');
  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%oculus.title%', title)
  });
};
