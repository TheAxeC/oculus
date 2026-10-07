// Layer 2, server. What the relay does with a page's library tokens when it turns addresses: the
// address a server's file outside every served root has for the page, and the real file a library
// address of the page's stands for when the page speaks to the server that named it. A token is
// made here only for a file named in an answer to a request of the page (`asked` is that request),
// and only when rules.ts allows the path; every other message a server sends gives an address only
// for a file the page already holds a token for.

import { pathToFileURL } from 'node:url';
import { heldKey, type Held, type Page, type Pending } from '../held/held.ts';
import { resolvePageUri, type ServedRoot } from '../uris.ts';
import { languageOf } from '../wire.ts';
import { isLibraryAddress } from './address.ts';
import { NO_LIBRARY, mintable, type LibraryRules } from './rules.ts';
import { addressOfToken } from './tokens.ts';

/** What the library addresses read of the relay. */
export type LibraryContext = {
    roots(): readonly ServedRoot[];
    /** The rules a file is judged by; read only when a file is to be given an address. */
    rules?: () => LibraryRules;
};

/** The root key the page named a document of its under, from the address it used. */
function rootOfAddress(context: LibraryContext, page: Page, address: string): string | null {
    if (isLibraryAddress(address)) return page.library.get(address)?.root ?? null;
    return resolvePageUri(address, context.roots())?.pageRoot ?? null;
}

/**
 * The library address a file outside every served root has for a page, by the file's real path, in
 * the messages of one server; null when the page may not be given one. `asked` is the request an
 * answer is for: only an answer may make a token.
 */
export function libraryAddresses(
    context: LibraryContext,
    page: Page,
    held: Held,
    asked?: Pending
): (real: string) => string | null {
    const server = heldKey(held.entry, held.root);
    return (real) => {
        if (asked === undefined) {
            const known = page.library.named(real, server);
            return known === undefined ? null : addressOfToken(known);
        }
        const root = rootOfAddress(context, page, asked.address);
        const language = languageOf(asked.channel);
        if (root === null || language === null) return null;
        const known = page.library.find(real, root, language, server);
        if (known !== undefined) return addressOfToken(known);
        const naming = { server: held.entry.id, prefixes: held.setup?.interpreterPrefixes ?? [] };
        if (!mintable(real, context.rules?.() ?? NO_LIBRARY, naming)) return null;
        return addressOfToken(page.library.mint(real, root, language, server));
    };
}

/** The `file://` address of a library address of the page's, for the server that named it. */
export function libraryFile(page: Page, held: Held, address: string): string | null {
    const token = page.library.get(address);
    if (token === undefined) return null;
    if (token.server !== heldKey(held.entry, held.root)) return null;
    return pathToFileURL(token.real).href;
}
