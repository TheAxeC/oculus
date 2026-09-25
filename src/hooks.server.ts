import { loadConfig, textCatalog } from '$lib/data/sources/config';
import { byKey } from '$lib/data/helpers/guards';
import { reportFindings, serverContext } from '$lib/server/root/context';
import type { Handle } from '@sveltejs/kit';

// The route renders in the browser, so the served HTML is a shell. The document title is the one
// string that has to be in it before the app starts, and it comes from the catalog like every other
// string: app.html carries the placeholder, this replaces it per request.
//
// The configuration is read at most once a request, and only by a request that asks for it: the
// page's title and its load function share the one read through `locals.config`, and a request to
// an API route that never asks reads nothing. Reading and parsing every config file is the most
// expensive thing a request does, and a page that boots makes several requests at once; each read
// holds the one event loop the socket's upgrade waits on, so a read per request made the socket
// open late on a loaded machine. A finding of the read is said on the read, so once a request.
export const handle: Handle = ({ event, resolve }) => {
    const context = serverContext(event.platform);
    event.locals.server = context;
    event.locals.token = context.token;
    let read: ReturnType<typeof loadConfig> | undefined;
    event.locals.config = () => {
        if (read !== undefined) return read;
        read = loadConfig(context.engine);
        reportFindings(read.findings);
        return read;
    };

    // The lookup t() gives a component, in the one place that runs before the catalog reaches the
    // page. The key stays a literal so tests/checks/source/keys.test.ts checks it like every other.
    const t = (key: string): string => {
        const value = byKey(textCatalog(event.locals.config().config), key);
        if (value === undefined) {
            throw new Error(`text key not in the text catalog (config/text/): ${key}`);
        }
        return value;
    };

    return resolve(event, {
        transformPageChunk: ({ html }) => html.replace('%oculus.title%', t('app.title'))
    });
};
