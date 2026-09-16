import { loadConfig, textCatalog } from '$lib/data/sources/config';
import { byKey } from '$lib/data/guards';
import { reportFindings, serverContext } from '$lib/server/context';
import type { Handle } from '@sveltejs/kit';

// The route renders in the browser, so the served HTML is a shell. The document title is the one
// string that has to be in it before the app starts, and it comes from the catalog like every other
// string: app.html carries the placeholder, this replaces it per request.
//
export const handle: Handle = ({ event, resolve }) => {
    const context = serverContext(event.platform);
    event.locals.server = context;
    event.locals.token = context.token;
    const { config, findings } = loadConfig(context.engine);
    reportFindings(findings);

    const catalog = textCatalog(config);
    // The lookup t() gives a component, in the one place that runs before the catalog reaches the
    // page. The key stays a literal so tests/keys.test.ts checks it like every other.
    const t = (key: string): string => {
        const value = byKey(catalog, key);
        if (value === undefined) {
            throw new Error(`text key not in the text catalog (config/text/): ${key}`);
        }
        return value;
    };

    return resolve(event, {
        transformPageChunk: ({ html }) => html.replace('%oculus.title%', t('app.title'))
    });
};
