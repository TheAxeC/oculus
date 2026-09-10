import { engineDir, loadConfig, textCatalog } from '$lib/data/sources/config';
import { mintToken } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

// The write token of DESIGN.md's "Auth", minted once when this module loads and handed to every
// request. It lives here because Kit's server graph is where both its producer (the page load that
// ships it) and its consumer (the write route that checks it) run; src/server.ts and the socket are
// a separate module graph and need no token of their own. A restarted dev server mints a new one,
// which the page notices as a 403 and answers by reloading its data.
const token = mintToken();

// The route renders in the browser, so the served HTML is a shell. The document title is the one
// string that has to be in it before the app starts, and it comes from the catalog like every other
// string: app.html carries the placeholder, this replaces it per request.
//
// The config is read per request, so editing a config file and reloading the browser shows the edit.
// O6's watcher takes that over and carries a finding on the socket; until then a finding goes to
// stderr, once per request, rather than being swallowed.
export const handle: Handle = ({ event, resolve }) => {
    event.locals.token = token;
    const { config, findings } = loadConfig(engineDir());
    for (const finding of findings) {
        console.error(`config: ${finding.file} [${finding.key}] ${finding.message}`);
    }

    const catalog = textCatalog(config);
    // The lookup t() gives a component, in the one place that runs before the catalog reaches the
    // page. The key stays a literal so tests/keys.test.ts checks it like every other.
    const t = (key: string): string => {
        const value = catalog[key];
        if (value === undefined) throw new Error(`text key not in config/text.yml: ${key}`);
        return value;
    };

    return resolve(event, {
        transformPageChunk: ({ html }) => html.replace('%oculus.title%', t('app.title'))
    });
};
