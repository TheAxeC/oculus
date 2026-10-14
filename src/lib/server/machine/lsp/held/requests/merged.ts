// Layer 2, server. One answer of a request from an entry's own result and its server's
// (`ServerEntry.adds`): the relay asks the entry when the request arrives and joins what the server
// answers to it here, once, for every entry that adds. A completion is one list of the entry's
// items and then the server's, incomplete when the server's was; a list of locations is the
// entry's and then the server's, a single location of the server's read as a list of one. For any
// other method the server's answer stands, and the entry's when the server has none. A server that
// answers with an error, or is not running, leaves the entry's result to stand alone.

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** An answer as a list: a list as it is, nothing as none, a single item as a list of one. */
function asList(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    return value === null || value === undefined ? [] : [value];
}

/** The methods whose answers are lists of locations. */
const LOCATIONS = [
    'textDocument/definition',
    'textDocument/declaration',
    'textDocument/references',
    'textDocument/implementation',
    'textDocument/typeDefinition'
];

/** The answer of a request from the entry's own result and the server's, the entry's first. */
export function merged(method: string, own: unknown, server: unknown): unknown {
    if (own === undefined) return server;
    if (method === 'textDocument/completion') {
        const list = isRecord(server) && Array.isArray(server.items) ? server : null;
        const items = list === null ? asList(server) : (list.items as unknown[]);
        return { isIncomplete: list?.isIncomplete === true, items: [...asList(own), ...items] };
    }
    if (LOCATIONS.includes(method)) return [...asList(own), ...asList(server)];
    return server ?? own;
}
