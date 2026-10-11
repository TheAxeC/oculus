// Layer 2, server. Where an app's files are served from, and the policy they are served under.
//
// An app's address is `/apps/<name>/<key>/<path>` for a machine app and
// `/apps/@<root key>/<name>/<key>/<path>` for a root app, the root key percent-encoded. `<key>` is
// the first 32 hex characters of an HMAC-SHA256 keyed by a second secret minted at server start and
// never sent to a page, over `<view id>:<hash>`: it names the root as well as the app, changes with
// the app's files, and is in a row only while the app is approved. Another page in the browser can
// request the address, since the route is not under /api/, so the key is what keeps it from reading
// an app's files. The shared files `penpal.js` and `oculus.js` are served from `/apps/-/`, a
// segment no name or `@` form can equal.
//
// Every app file carries one Content-Security-Policy. Its `sandbox` directive makes the document
// opaque wherever it is opened (in the frame, by a direct visit, or in a popup), its sources are
// named by address and never `'self'`, and its `connect-src` holds the app's own files and the
// origins its manifest declares and nothing else. The sandbox flags it grants are listed once here.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { typeOf } from '../../../files/files.ts';
import { appAddress } from '../../../../data/helpers/files/apps/apps.ts';

/** The segment the shared files are served under. */
export const SHARED = '-';

/** The shared files, by the name they are requested as. */
export const SHARED_FILES = ['penpal.js', 'oculus.js'] as const;

/** The sandbox flags an app's document and its frame are given. */
const SANDBOX = ['allow-scripts', 'allow-downloads'];

/** The extensions an app file is served with a type for, and no other. */
const TYPED = [
    '.html',
    '.js',
    '.mjs',
    '.css',
    '.json',
    '.svg',
    '.png',
    '.jpg',
    '.gif',
    '.webp',
    '.woff',
    '.woff2',
    '.ttf',
    '.otf',
    '.txt',
    '.wasm'
];

/** Bytes for anything the table does not name. */
const FALLBACK = 'application/octet-stream';

/** The key of an app at one content hash. */
export function addressKey(secret: string, id: string, hash: string): string {
    return createHmac('sha256', secret).update(`${id}:${hash}`).digest('hex').slice(0, 32);
}

/** Whether two keys are the same text, compared in constant time. */
export function sameKey(held: string, given: string): boolean {
    if (held === '' || held.length !== given.length) return false;
    return timingSafeEqual(Buffer.from(held), Buffer.from(given));
}

export { appAddress };

/** The type an app file is served as, by its extension, from the fixed table. */
export function appType(path: string): string {
    const dot = path.lastIndexOf('.');
    const extension = dot < 0 ? '' : path.slice(dot).toLowerCase();
    return TYPED.includes(extension) ? typeOf(path) : FALLBACK;
}

/** What the policy of an app file is built from. */
export type PolicyInput = {
    /**
     * The host and port of the request's URL, from its Host header, with no scheme: the built Node
     * handler names every request `https` unless `ORIGIN` says otherwise, so a source written with
     * a scheme would not match the page's own, and a source with none matches the scheme the
     * document was loaded over.
     */
    host: string;
    /** The host followed by the app's address up to and including its key. */
    base: string;
    /** The host followed by the shared files' folder. */
    shared: string;
    /** The manifest's `connects` origins. */
    connects: readonly string[];
};

/** The Content-Security-Policy every app file is sent with. */
export function appPolicy(input: PolicyInput): string {
    const { host, base, shared, connects } = input;
    return [
        `sandbox ${SANDBOX.join(' ')}`,
        "default-src 'none'",
        `script-src ${base} ${shared} 'wasm-unsafe-eval'`,
        `style-src ${base} 'unsafe-inline'`,
        `img-src ${base} data:`,
        `font-src ${base}`,
        `media-src ${base}`,
        `connect-src ${[base, ...connects].join(' ')}`,
        "base-uri 'none'",
        "form-action 'none'",
        `frame-ancestors ${host}`
    ].join('; ');
}

/** The headers every app file and every shared file is sent with. */
export function fileHeaders(type: string, length: number): Record<string, string> {
    return {
        'content-type': type,
        'content-length': String(length),
        'x-content-type-options': 'nosniff',
        'cache-control': 'no-cache',
        'access-control-allow-origin': '*'
    };
}
