// Layer 2, server. The library files one page holds an address for. A token is minted when a
// language server names a file outside every served root in an answer to a request of that page
// (the relay does it through `Library.mint`), and it stays until the page's connection ends: the
// map is a field of the page (held/held.ts), never a module's, so another page holds none of it and
// a page that reconnects starts with none. A token records the real path, the root key the page
// named the requested document under, the language of the channel the request came on, and the
// server that named the file, so a file named by two servers, or on two channels, is two tokens,
// each tab served by the server that named it.
//
// Nothing here reads a file or decides whether one may be named: rules.ts says what may be minted
// and read.ts reads a file for a token.

import { randomUUID } from 'node:crypto';
import { basename } from 'node:path';
import { normal } from '../uris.ts';
import { libraryAddress, tokenOf } from './address.ts';

/** What a page was given for one library file. */
export type Token = {
    id: string;
    /** The file's real path, in the operating system's own spelling. */
    real: string;
    /** The root key the page used for the document whose request got the file named. */
    root: string;
    /** The language of the channel that request came on: `python`, `c` or `cpp`. */
    language: string;
    /** The `heldKey` of the server that named it. */
    server: string;
};

/** What a token is looked up by: everything but its id. */
function keyOf(real: string, root: string, language: string, server: string): string {
    return [server, root, language, normal(real)].join('\0');
}

/** The tokens of one page. */
export class Library {
    #tokens = new Map<string, Token>();
    #keys = new Map<string, string>();

    /** The token of a file for a root, language and server; one is made when there is none. */
    mint(real: string, root: string, language: string, server: string): Token {
        const key = keyOf(real, root, language, server);
        const known = this.#keys.get(key);
        const held = known === undefined ? undefined : this.#tokens.get(known);
        if (held !== undefined) return held;
        const token: Token = { id: randomUUID(), real, root, language, server };
        this.#tokens.set(token.id, token);
        this.#keys.set(key, token.id);
        return token;
    }

    /** The token a library address carries, when this page was given it. */
    get(address: unknown): Token | undefined {
        const id = tokenOf(address);
        return id === null ? undefined : this.#tokens.get(id);
    }

    /** The token of a file for a root, language and server, when this page was given one. */
    find(real: string, root: string, language: string, server: string): Token | undefined {
        const id = this.#keys.get(keyOf(real, root, language, server));
        return id === undefined ? undefined : this.#tokens.get(id);
    }

    /** A token a server has given this page for a file, whatever the root or language. */
    named(real: string, server: string): Token | undefined {
        const target = normal(real);
        for (const token of this.#tokens.values()) {
            if (token.server === server && normal(token.real) === target) return token;
        }
        return undefined;
    }
}

/** The library address of a token, which names the file by its own name. */
export function addressOfToken(token: Token): string {
    return libraryAddress(token.id, basename(token.real));
}
