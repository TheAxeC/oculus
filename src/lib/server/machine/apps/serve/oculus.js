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
// `open` and `key`, and under flat names the calls this file nests as `oculus.fs`,
// `oculus.commands`, `oculus.secrets` and `oculus.host`; the app exposes `onChannel`, `onTheme`,
// `onStore` and `onHost`. A refusal rejects with one fixed word as a plain string.
//
// `oculus.fs.readFile`, `readDirectory` and `stat` ask the page for an address on the app's own
// address and fetch the bytes, the listing or the stat from it, so a file never passes through the
// page. A refusal of the server is the plain-text word it answers, and rejects with that word.
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
 * @property {(method: string, params: unknown) => unknown} [onHost]
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
 * @typedef {object} Place
 * @property {string} root The key of a root the file browser shows.
 * @property {string} path The path under the root.
 */

/**
 * @typedef {object} Stat
 * @property {number} type VS Code's FileType: 1 file, 2 folder, 64 added for a link.
 * @property {number} ctime
 * @property {number} mtime
 * @property {number} size
 */

/**
 * @typedef {object} Files
 * @property {(place: Place) => Promise<Uint8Array>} readFile
 * @property {(place: Place) => Promise<[string, number][]>} readDirectory
 * @property {(place: Place) => Promise<Stat>} stat
 */

/**
 * @typedef {object} Secrets
 * @property {(key: string) => Promise<string | undefined>} get
 * @property {(key: string, value: string) => Promise<void>} store
 * @property {(key: string) => Promise<void>} delete
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
 * @property {Files} fs
 * @property {{ run: (name: string) => Promise<void> }} commands
 * @property {Secrets} secrets
 * @property {{ request: (method: string, params?: unknown) => Promise<unknown> }} host
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
 * The page's methods an app calls by their own names. The page also builds `fsAddress`,
 * `commandsRun`, `secretsGet`, `secretsStore`, `secretsDelete` and `hostRequest`, which an app
 * reaches under `fs`, `commands`, `secrets` and `host` (`nested` below). This file imports nothing
 * from the page, so it holds the list itself; tests/server/machine/apps/oculus-frame.test.ts holds
 * it and the nested names equal to the keys of the object `createMethods` returns
 * (lib/state/system/apps/methods.ts).
 */
const METHODS = [
    'read',
    'getTheme',
    'getState',
    'setState',
    'getStore',
    'setStore',
    'write',
    'open',
    'key'
];

/**
 * One function for each method an app calls by its own name. Penpal's remote proxy has no own keys
 * to copy, so each function calls the proxy by its name.
 */
function flat(/** @type {any} */ page) {
    return /** @type {Omit<Oculus, 'fs' | 'commands' | 'secrets' | 'host'>} */ (
        Object.fromEntries(
            METHODS.map((name) => [name, (/** @type {unknown[]} */ ...args) => page[name](...args)])
        )
    );
}

/**
 * The page's methods as the nested object an app uses. Penpal carries them under flat names, so
 * `oculus.fs.readFile` is `fsAddress('read', ...)` and a fetch of the address it answers.
 */
function nested(/** @type {any} */ page) {
    /**
     * Fetch the address the page gave for a read of a root. A refusal of the server is its
     * plain-text word, which rejects as a plain string; a response that is no answer rejects
     * `failed:<status>`.
     */
    async function fetched(
        /** @type {string} */ op,
        /** @type {Place} */ place,
        /** @type {(response: Response) => Promise<any>} */ read
    ) {
        const address = await page.fsAddress(op, place?.root, place?.path);
        const response = await fetch(address);
        if (response.ok) return read(response);
        const word = (await response.text().catch(() => '')).trim();
        // A refusal is one word, as every other.
        throw word === '' ? `failed:${response.status}` : word;
    }
    return {
        ...flat(page),
        fs: {
            readFile: (/** @type {Place} */ place) =>
                fetched(
                    'read',
                    place,
                    async (response) => new Uint8Array(await response.arrayBuffer())
                ),
            readDirectory: (/** @type {Place} */ place) =>
                fetched('dir', place, (response) => response.json()),
            stat: (/** @type {Place} */ place) =>
                fetched('stat', place, (response) => response.json())
        },
        commands: { run: (/** @type {string} */ name) => page.commandsRun(name) },
        secrets: {
            get: (/** @type {string} */ key) => page.secretsGet(key),
            store: (/** @type {string} */ key, /** @type {string} */ value) =>
                page.secretsStore(key, value),
            delete: (/** @type {string} */ key) => page.secretsDelete(key)
        },
        host: {
            request: (/** @type {string} */ method, /** @type {unknown} */ params) =>
                page.hostRequest(method, params)
        }
    };
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
        onStore: (/** @type {unknown} */ value) => handlers.onStore?.(value),
        onHost: (/** @type {string} */ method, /** @type {unknown} */ params) =>
            handlers.onHost?.(method, params)
    };
    const page = nested(await link({ messenger, methods }).promise);
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
