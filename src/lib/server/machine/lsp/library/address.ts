// Layer 2, server. The address a library file has on the page: `oculus-lib:///<token>/<file name>`.
// A library file is one a language server named that lies outside every served root (a standard
// library module, a system header). The token is minted by the relay for one page (tokens.ts) and
// names nothing of the machine; the file name is there so a tab can be titled by it. The name is
// percent-encoded twice, as a root key is in a page address (../uris.ts), since the editor's URI
// type decodes an address's path once before the page reads the name back. The relay looks a
// library file up by its token alone and never reads the name.

/** The scheme the page names a library file by. */
const LIBRARY_SCHEME = 'oculus-lib:';

/** What a token is made of: a UUID. */
const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Whether a value is a string in the form of a library address, whatever token it holds. */
export function isLibraryAddress(value: unknown): value is string {
    return typeof value === 'string' && value.startsWith(`${LIBRARY_SCHEME}///`);
}

/** The address of a token and the name of the file it stands for. */
export function libraryAddress(token: string, name: string): string {
    return `${LIBRARY_SCHEME}///${token}/${encodeURIComponent(encodeURIComponent(name))}`;
}

/** The token a library address carries, or null for an address that is not of the form above. */
export function tokenOf(address: unknown): string | null {
    if (!isLibraryAddress(address)) return null;
    const parts = address.slice(`${LIBRARY_SCHEME}///`.length).split('/');
    return parts.length === 2 && TOKEN.test(parts[0]) && parts[1] !== '' ? parts[0] : null;
}
