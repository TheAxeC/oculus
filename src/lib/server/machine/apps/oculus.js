// The app's half of the bridge between an app and oculus. It is served as text at /apps/-/oculus.js
// to the frame an app is drawn in, and nothing that runs on the page imports it. An app loads it
// with `import { connect } from '/apps/-/oculus.js'`; it loads penpal from the file beside it and
// connects to the page that holds the frame.
//
// The page's messenger accepts the frame because the frame is the window it holds. This side must
// name the page's origin, since penpal's default is the frame's own origin, which is `null` for a
// sandboxed document; the page's origin is the origin this file was loaded from.
//
// The page exposes `read`, `getTheme`, `getState`, `setState`, `getStore`, `setStore`, `write`,
// `open` and `key`; the app exposes `onChannel`, `onTheme` and `onStore`. A refusal rejects with
// one fixed word as a plain string.
//
// A press on a link that leads outside the app's own address does not navigate the frame: it is
// sent to the page as `open({ url })`, which refuses an address that is not `http:` or `https:` and
// asks the reader before it opens one in a browser tab.

/**
 * @typedef {object} Theme
 * @property {string} name The theme's class on the page's body.
 * @property {Record<string, string>} tokens Every custom property tokens.css declares.
 * @property {boolean} wall Whether the body carries the `wall` class.
 */

/**
 * @typedef {object} Handlers
 * @property {(channel: string, version: number, payload: unknown) => unknown} [onChannel]
 * @property {(theme: Theme) => unknown} [onTheme]
 * @property {(value: unknown) => unknown} [onStore]
 */

/**
 * @typedef {object} KeyInit
 * @property {string} key
 * @property {string} code
 * @property {boolean} altKey
 * @property {boolean} ctrlKey
 * @property {boolean} metaKey
 * @property {boolean} shiftKey
 */

/**
 * @typedef {object} Oculus
 * @property {(channel: string) => Promise<{ version: number; payload: unknown } | null>} read
 * @property {() => Promise<Theme>} getTheme
 * @property {() => Promise<unknown>} getState
 * @property {(value: unknown) => Promise<void>} setState
 * @property {() => Promise<unknown>} getStore
 * @property {(value: unknown) => Promise<void>} setStore
 * @property {(kind: string, body: unknown) => Promise<void>} write
 * @property {(target: unknown) => Promise<void>} open
 * @property {(init: KeyInit) => Promise<void>} key
 */

/**
 * Write a theme's tokens on the document's root element and toggle its `wall` class. The first
 * paint also puts `color-scheme: light dark` on the root through a style sheet placed before every
 * other, so an app with no scheme of its own follows the scheme the frame hands it and an app that
 * declares one keeps its own.
 */
function paint(/** @type {Theme} */ theme) {
    const root = document.documentElement;
    if (document.getElementById('oculus-scheme') === null) {
        const sheet = document.createElement('style');
        sheet.id = 'oculus-scheme';
        sheet.textContent = ':root { color-scheme: light dark; }';
        document.head.prepend(sheet);
    }
    for (const [name, value] of Object.entries(theme.tokens)) {
        root.style.setProperty(name, value);
    }
    root.classList.toggle('wall', theme.wall);
}

/** Whether a key press is one the page's chords may want: a modifier chord, or Escape. */
function forwarded(/** @type {KeyboardEvent} */ event) {
    return event.ctrlKey || event.metaKey || event.altKey || event.key === 'Escape';
}

/**
 * The address of this app as the page serves it, up to and including its key:
 * `/apps/<name>/<key>/`, or `/apps/@<root>/<name>/<key>/` for a root app, whose root key is
 * percent-encoded and so holds no `/`.
 */
function ownAddress() {
    const here = new URL(location.href);
    const parts = here.pathname.split('/');
    const keyAt = parts[2].startsWith('@') ? 4 : 3;
    return `${here.origin}${parts.slice(0, keyAt + 1).join('/')}/`;
}

/**
 * The address of the link a press landed on when it leads outside this app's own address, or null
 * for any other press. A `javascript:` link is the app's own script and navigates nothing.
 */
function outsideLink(/** @type {MouseEvent} */ event) {
    if (event.defaultPrevented || event.button !== 0) return null;
    const target = /** @type {{ closest?: (selector: string) => Element | null } | null} */ (
        event.target
    );
    const link = typeof target?.closest === 'function' ? target.closest('a[href]') : null;
    if (link === null) return null;
    const address = new URL(link.getAttribute('href') ?? '', location.href);
    if (address.protocol === 'javascript:') return null;
    return address.href.startsWith(ownAddress()) ? null : address.href;
}

/**
 * Connect to the page that holds this frame. Resolves with the page's methods once the handshake
 * completes; the theme is painted before it resolves, a key press holding Control, Meta or Alt, or
 * Escape, is forwarded to the page from then on, and so is a press on a link outside the app.
 * @param {Handlers} [handlers]
 * @returns {Promise<Oculus>}
 */
export async function connect(handlers = {}) {
    const { WindowMessenger, connect: link } = await import(
        new URL('penpal.js', import.meta.url).href
    );
    const messenger = new WindowMessenger({
        remoteWindow: window.parent,
        allowedOrigins: [new URL(import.meta.url).origin]
    });
    const methods = {
        onChannel: (
            /** @type {string} */ channel,
            /** @type {number} */ version,
            /** @type {unknown} */ payload
        ) => handlers.onChannel?.(channel, version, payload),
        onTheme: (/** @type {Theme} */ theme) => {
            paint(theme);
            return handlers.onTheme?.(theme);
        },
        onStore: (/** @type {unknown} */ value) => handlers.onStore?.(value)
    };
    /** @type {Oculus} */
    const page = await link({ messenger, methods }).promise;
    paint(await page.getTheme());
    window.addEventListener('keydown', (event) => {
        if (!forwarded(event)) return;
        const { key, code, altKey, ctrlKey, metaKey, shiftKey } = event;
        page.key({ key, code, altKey, ctrlKey, metaKey, shiftKey }).catch(() => undefined);
    });
    window.addEventListener('click', (event) => {
        const address = outsideLink(event);
        if (address === null) return;
        event.preventDefault();
        page.open({ url: address }).catch(() => undefined);
    });
    return page;
}
