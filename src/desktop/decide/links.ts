// Layer 2, server (the desktop host). Where an address goes: the one decision every way a window
// meets an address is read through (`window.open`, a `target="_blank"` link, a navigation of a
// window). It is a pure function of the address and the server's origin and imports nothing from
// electron, so tests/server/desktop/window-guard.test.ts reads it without an app.
//
// An app window shows only its own server's page. That page at `/` opens in an app window: a main
// window, or the window of a popped-out float when the address carries `?float=<id>` and at most
// `owner=<id>` beside it. The audience route, `/present/show` with the params `root` and `path` and
// nothing else, opens the audience window of a presentation. Any other http, https or mailto
// address, the server's own file addresses included, goes to the default browser. Every other
// scheme is refused, since handing a `file:` or `javascript:` address to the operating system would
// run it.

import { AUDIENCE_PATH } from './sender.ts';

/** Where an address goes. */
export type Where =
    | { kind: 'main' }
    | { kind: 'float'; id: string }
    | { kind: 'audience'; root: string; path: string }
    | { kind: 'browser' }
    | { kind: 'refused' };

/** The address read, or null for text that is no address. */
function parsed(address: string): URL | null {
    try {
        return new URL(address);
    } catch {
        return null;
    }
}

/**
 * The float id an address of the server's page names: its search is `?float=<id>`, with an
 * `owner=<id>` beside it at most. Null for an empty search, which names the main window, and for a
 * search that carries anything else.
 */
function floatOf(url: URL): { id: string | null } | null {
    if (url.search === '') return { id: null };
    const params = [...url.searchParams.keys()];
    if (params.length === 0 || params.length > 2) return null;
    if (params.some((name) => name !== 'float' && name !== 'owner')) return null;
    if (new Set(params).size !== params.length || !params.includes('float')) return null;
    const id = url.searchParams.get('float');
    return id === null || id === '' ? null : { id };
}

/** The page of the server at `url`, and the float it names, or null for any other address. */
function serverPage(url: URL, origin: string): { id: string | null } | null {
    if (url.origin !== origin || url.pathname !== '/' || url.hash !== '') return null;
    return floatOf(url);
}

/**
 * The deck an address of the audience route names: the server's origin, the path, no hash, a
 * filled `root` and a `path`, and no other param. Null for any other address.
 */
function audienceDeck(url: URL, origin: string): { root: string; path: string } | null {
    if (url.origin !== origin || url.pathname !== AUDIENCE_PATH || url.hash !== '') return null;
    if ([...url.searchParams.keys()].sort().join(',') !== 'path,root') return null;
    const root = url.searchParams.get('root') ?? '';
    return root === '' ? null : { root, path: url.searchParams.get('path') ?? '' };
}

/** Where `address` goes, given the origin of the window's server. */
export function linkDecision(address: string, origin: string): Where {
    const url = parsed(address);
    if (url === null) return { kind: 'refused' };
    const page = serverPage(url, origin);
    if (page !== null) return page.id === null ? { kind: 'main' } : { kind: 'float', id: page.id };
    const audience = audienceDeck(url, origin);
    if (audience !== null) return { kind: 'audience', ...audience };
    if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:') {
        return { kind: 'browser' };
    }
    return { kind: 'refused' };
}

/**
 * The port an address moves a window to: the server's page on the loopback at another port than
 * the window's origin. A server that moved its port tells its pages, which go to the new address;
 * this is what the host recognises that navigation by. Null for any other address.
 */
export function movedPort(address: string, origin: string): number | null {
    const url = parsed(address);
    const here = parsed(origin);
    if (url === null || here === null) return null;
    if (url.protocol !== 'http:' || url.hostname !== here.hostname) return null;
    if (url.port === '' || url.port === here.port) return null;
    if (url.pathname !== '/' || url.hash !== '' || floatOf(url) === null) return null;
    return Number(url.port);
}
