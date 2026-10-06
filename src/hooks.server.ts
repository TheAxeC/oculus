import { loadConfig, textCatalog } from '$lib/data/sources/config';
import { byKey } from '$lib/data/helpers/guards';
import { sameOrigin } from '$lib/server/core/auth';
import { reportFindings, serverContext } from '$lib/server/root/context';
import { json, type Handle, type RequestEvent } from '@sveltejs/kit';

/** The routes the origin guard judges: every API route, and not the page. */
const GUARDED = '/api/';

/** The id of the route that serves the page. */
const PAGE = '/';

/** The policy the page is sent with: a frame in it loads only from this origin. */
const FRAME_SRC = "frame-src 'self'";

/**
 * The API paths the origin guard passes unchecked: the two OAuth callbacks. A provider's redirect
 * reaches them from the provider's site with no oculus token, so `Sec-Fetch-Site` is `cross-site`;
 * what guards each is the `state` this process minted, which the callback takes once and checks.
 */
const UNGUARDED = ['/api/calendar/callback', '/api/mail/callback'];

/**
 * The API paths that admit a request carrying neither `Origin` nor `Sec-Fetch-Site`, which every
 * other path refuses. The hook is posted by Claude Code's `curl`, which sends neither, the three
 * picture routes are fetched by the command line as well as drawn by the page, and the health
 * route is asked by the desktop host's Node `fetch`, which sends neither either. A request to one
 * of them that carries either header is judged by the one rule like any other.
 */
const HEADERLESS = [
    '/api/hook',
    '/api/memories',
    '/api/wallpaper',
    '/api/diagrams/[name]',
    '/api/health'
];

/**
 * The path of the route Kit matched, its `(group)` folders left out, and null for a request that
 * matched none. The route and not the address is judged: Kit decodes the address before it matches
 * it, so `/%61pi/fs` reaches the route `/api/fs` while its address does not start with /api/.
 */
function routePath(event: RequestEvent): string | null {
    const id = event.route.id;
    return id === null ? null : id.replace(/\/\([^/]*\)/g, '') || '/';
}

/**
 * Whether a request is refused before any route sees it: one to a route under /api/, outside the
 * two callbacks, that fails DESIGN.md's one "Auth" rule, a request with neither header to a path of
 * HEADERLESS excepted. Guarding here, where every request passes, is what keeps a route added under
 * /api/ from being answered to another page.
 */
function refused(event: RequestEvent): boolean {
    const path = routePath(event);
    if (path === null || !path.startsWith(GUARDED) || UNGUARDED.includes(path)) return false;
    const headers = event.request.headers;
    const neither = !headers.has('origin') && !headers.has('sec-fetch-site');
    if (neither && HEADERLESS.includes(path)) return false;
    return !sameOrigin(headers, headers.get('host') ?? '');
}

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
//
// The page's answer carries `Content-Security-Policy: frame-src 'self'`, which holds the frame of
// an app, whose files are served from /apps/ outside the guard, to the addresses of this origin.
//
// Every request under /api/ passes DESIGN.md's one "Auth" rule (`sameOrigin` in
// lib/server/core/auth.ts) here, before any route sees it, and one that fails it is answered 403
// with `{ error: 'forbidden' }`; UNGUARDED names the two paths passed unchecked and HEADERLESS the
// five that admit a request with neither header, each with its reason.
export const handle: Handle = async ({ event, resolve }) => {
    const context = serverContext(event.platform);
    if (refused(event)) return json({ error: 'forbidden' }, { status: 403 });
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

    const response = await resolve(event, {
        transformPageChunk: ({ html }) => html.replace('%oculus.title%', t('app.title'))
    });
    // A script inside a sandboxed app frame can navigate its own frame to any address with the
    // reader's data in the query, unless the page that holds the frame names where a frame may
    // load from. The page's own frames (the document and file views) load from this origin.
    if (event.route.id === PAGE) response.headers.set('content-security-policy', FRAME_SRC);
    return response;
};
