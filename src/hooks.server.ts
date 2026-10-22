import { textCatalog, type loadConfig } from '$lib/data/sources/config';
import { desktopMarked } from '$lib/data/helpers/editor/start-theme';
import { APP_THEME_CLASS } from '$lib/data/helpers/files/apps/choices';
import { byKey } from '$lib/data/helpers/guards';
import { escapeAttribute } from '$lib/data/prose/markdown/markdown';
import { sameOrigin } from '$lib/server/core/auth';
import { requestStart } from '$lib/server/machine/apps/routes/theme';
import { serverContext } from '$lib/server/root/context';
import themesCss from '$lib/themes/themes.css?raw';
import tokensCss from '$lib/themes/tokens.css?raw';
import { APP_THEME_STYLE_ID, themeSheet, type ResolvedTheme } from '$lib/themes/vscode-map';
import { derivedTokens, THEME_SHEETS, withThemeBlock } from '$lib/ui/theme/theme';
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

/** The placeholders of app.html this replaces, `%oculus.<name>%`. */
const PLACEHOLDER = /%oculus\.([a-z-]+)%/g;

/**
 * A page's start theme as it is sent: the root element's style attribute value, the body's class
 * attribute value and the style element.
 */
type PageTheme = { rootStyle: string; bodyClass: string; style: string };

/**
 * The start theme a page is sent with (`requestStart`): the body class string, escaped for the
 * attribute; for an app's theme the style element the page's first draw replaces, holding the
 * block the page's own conversion makes of the same file; and the tokens `applyTheme` derives for
 * that class over those sheets (`derivedTokens`), as the root element's style, where the page's
 * draw sets them, so a frame that paints the mounted page before its draw has run, as one does
 * while the workbench loads the file of an app's theme the first load carries none of, has the
 * start theme's derived tokens. The page draws the CRT overlay only on the workbench, `/` and a
 * float window. A block whose text holds `<` is not sent and the page draws it after: no value of
 * a theme file reaches the block, which holds hex colours and the values of tokens.css and
 * themes.css, so this covers the text of those two sheets, the one source a `<` that closed the
 * element could come from. Should the start not be computed, the page is sent with no theme.
 */
function pageTheme(event: RequestEvent): PageTheme {
    try {
        const start = requestStart(
            event.locals.server.apps.held(),
            event.locals.config().config,
            desktopMarked(event.request.headers.get('user-agent')),
            event.route.id === PAGE
        );
        const file = start.file;
        const sheets = { tokens: tokensCss, themes: themesCss };
        const sheet =
            file === null
                ? null
                : themeSheet(file.theme as ResolvedTheme, file.uiTheme, sheets, APP_THEME_CLASS);
        const sent = sheet !== null && !sheet.css.includes('<');
        const themes = sent ? withThemeBlock(sheet.css) : THEME_SHEETS;
        const tokens = Object.entries(derivedTokens(start.classes, tokensCss, themes));
        return {
            rootStyle: escapeAttribute(
                tokens.map(([name, value]) => `${name}: ${value}`).join('; ')
            ),
            bodyClass: escapeAttribute(start.classes),
            style: sent ? `<style id="${APP_THEME_STYLE_ID}">${sheet.css}</style>` : ''
        };
    } catch {
        return { rootStyle: '', bodyClass: '', style: '' };
    }
}

/**
 * Whether a request is refused before any route sees it: one to a route under /api/, outside the
 * two callbacks, that fails the one auth rule, a request with neither header to a path of
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

// The route renders in the browser, so the served HTML is a shell. It carries what has to be in it
// before the app starts, each in a placeholder of app.html this replaces per request in one pass,
// so a value is written as it is and never read as another placeholder or a replacement pattern:
// the document title `%oculus.title%`, from the catalog like every other string, and the theme the
// page starts on, so its first paint is that theme's ground in a browser tab and in a window of the
// desktop app alike. The theme is the body class string `%oculus.body-class%`, the derived tokens
// on the root element `%oculus.root-style%` and, for an app's colour theme, the style element
// `%oculus.theme-style%` (`pageTheme`). A placeholder of another name is left as it is. A request
// of the desktop app's window, whose user agent carries the host's mark, starts on `app_theme`, as
// its page does; a browser whose user agent carries the mark as a word is sent the same start, and
// its page, which has no bridge to the host, starts as a browser's does, so where the two starts
// differ it is drawn again, one change of colour. The page data comes from a request of its own,
// so a config changed between the two is drawn when the page's script draws, one change of colour.
//
// The configuration is read only by a request that asks for it, through `locals.config`, which the
// page's title, its theme and its load function read through: the first call of a request reads it
// and the rest of the request keeps that read, so one request sees one configuration, and a request
// to an API route that never asks reads nothing, since the theme is computed when the page is sent.
// The read itself is the server context's `configCache` (lib/server/root/process/config-cache.ts),
// which parses the configuration again only when a file of the engine's config folder or the hub's
// `.oculus/config.yml` was added, removed or written, because a parse holds the one event loop the
// socket's upgrade waits on and a page that boots makes several requests at once.
//
// The page's answer carries `Content-Security-Policy: frame-src 'self'`, which holds the frame of
// an app, whose files are served from /apps/ outside the guard, to the addresses of this origin.
//
// Every request under /api/ passes the one auth rule (`sameOrigin` in
// lib/server/core/auth.ts) here, before any route sees it, and one that fails it is answered 403
// with `{ error: 'forbidden' }`; UNGUARDED names the two paths passed unchecked and HEADERLESS the
// five that admit a request with neither header, each with its reason.
export const handle: Handle = async ({ event, resolve }) => {
    const context = serverContext(event.platform);
    if (refused(event)) return json({ error: 'forbidden' }, { status: 403 });
    event.locals.server = context;
    event.locals.token = context.token;
    let read: ReturnType<typeof loadConfig> | undefined;
    event.locals.config = () => (read ??= context.configCache.read());

    // The lookup t() gives a component, in the one place that runs before the catalog reaches the
    // page. The key stays a literal so tests/checks/source/keys.test.ts checks it like every other.
    const t = (key: string): string => {
        const value = byKey(textCatalog(event.locals.config().config), key);
        if (value === undefined) {
            throw new Error(`text key not in the text catalog (config/text/): ${key}`);
        }
        return value;
    };

    let theme: PageTheme | undefined;
    const values = (): Record<string, string> => {
        theme ??= pageTheme(event);
        return {
            title: t('app.title'),
            'root-style': theme.rootStyle,
            'body-class': theme.bodyClass,
            'theme-style': theme.style
        };
    };
    const response = await resolve(event, {
        transformPageChunk: ({ html }) => {
            const filled = values();
            return html.replace(PLACEHOLDER, (whole, name: string) => filled[name] ?? whole);
        }
    });
    // A script inside a sandboxed app frame can navigate its own frame to any address with the
    // reader's data in the query, unless the page that holds the frame names where a frame may
    // load from. The page's own frames (the document and file views) load from this origin.
    if (event.route.id === PAGE) response.headers.set('content-security-policy', FRAME_SRC);
    return response;
};
