// Layer 2, server. The requests the YAML server makes of its client, answered from the schemas of
// the latest snapshot build. For a document it asks `custom/schema/request` which schema governs
// it; the answer is the address `oculus-schema:/<name>.json` of the schema the build's rules name
// for the file's path inside its root, or nothing. It then asks `custom/schema/content` for the
// text of that address. `vscode/content` is how it fetches a schema over the network once it has
// been told its client takes content requests; it is refused, so no address is fetched.

import { fileURLToPath } from 'node:url';
import { schemaAddress, schemaFor, schemaTextAt } from '../../../../../data/snapshot/schema/set.ts';
import type { ServerAsk } from '../../servers.ts';

/** The first text of a request's parameters, which the server sends as a one-item array. */
function firstText(params: unknown): string | undefined {
    const first: unknown = Array.isArray(params) ? params[0] : params;
    return typeof first === 'string' ? first : undefined;
}

/** The path of a `file:` address inside a root, with forward slashes, or undefined outside it. */
function insideRoot(address: string, root: string): string | undefined {
    let real: string;
    try {
        real = fileURLToPath(address);
    } catch {
        return undefined;
    }
    const base = root.endsWith('/') ? root : `${root}/`;
    return real.startsWith(base) ? real.slice(base.length) : undefined;
}

export const yamlRequests = {
    'custom/schema/request': (params: unknown, ask: ServerAsk): string | null => {
        const address = firstText(params);
        const path = address === undefined ? undefined : insideRoot(address, ask.root.real);
        if (path === undefined) return null;
        const name = schemaFor(ask.schemas, ask.root.key, path);
        return name === undefined ? null : schemaAddress(name);
    },
    'custom/schema/content': (params: unknown, ask: ServerAsk): string => {
        const address = firstText(params);
        const text = address === undefined ? undefined : schemaTextAt(ask.schemas, address);
        if (text === undefined) throw new Error('no schema is held at this address');
        return text;
    },
    'vscode/content': (): never => {
        throw new Error('no content is fetched from an address');
    }
};
