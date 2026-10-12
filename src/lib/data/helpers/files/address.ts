// Layer 1, data. The address /api/file answers a file at: `/api/file/<root>/<path>`, each segment
// escaped on its own so a space or a hash in a name survives and the separators stay separators.
// Every reader of a served file's bytes builds the address here, the page's reads and downloads,
// the editor's picture addresses and the figure a Present slide draws, so the escaping is one rule.
// The name of the socket channel that says when a served file changes on disk is built and read
// here too, since the page names it and the server reads the name back. It imports nothing from
// node, so the page and the server both reach it.

/**
 * The name oculus's own `config/` folder is read under by the Settings view. A folder of a
 * workspace is named by letters, digits, `.`, `_` and `-`, so no workspace folder can carry this
 * name, and it is answered at `/api/oculus-config` alone, a read-only route over that folder.
 */
export const OCULUS_CONFIG_ROOT = ':oculus';

/** The address of the read-only route over oculus's own `config/` folder. */
const OCULUS_CONFIG_PATH = '/api/oculus-config';

/** A path as address segments, each escaped on its own; empty and `.` segments are dropped. */
function segmentsOf(path: string): string {
    return path
        .split('/')
        .filter((part) => part !== '' && part !== '.')
        .map((part) => encodeURIComponent(part))
        .join('/');
}

/**
 * The address one file's bytes are read at. A version above zero rides on the query, which makes a
 * rewritten file a new browser address. A file of oculus's own `config/` folder is read at the
 * read-only route over that folder.
 */
export function fileBytesUrl(root: string, path: string, version = 0): string {
    const at =
        root === OCULUS_CONFIG_ROOT
            ? `${OCULUS_CONFIG_PATH}/${segmentsOf(path)}`
            : `/api/file/${encodeURIComponent(root)}/${segmentsOf(path)}`;
    return version > 0 ? `${at}?v=${version}` : at;
}

/** What the name of a channel that follows one open file starts with. */
export const SOURCE_PREFIX = 'source:';

/** The channel that publishes the hash of one file whenever it changes: `source:<root>/<path>`. */
export function sourceChannel(root: string, path: string): string {
    return `${SOURCE_PREFIX}${root}/${path}`;
}

/**
 * The root key and the path a channel name carries, or null for a name that is not a source channel
 * or has an empty root key or an empty path.
 */
export function parseSourceChannel(channel: string): { root: string; path: string } | null {
    if (!channel.startsWith(SOURCE_PREFIX)) return null;
    const rest = channel.slice(SOURCE_PREFIX.length);
    const at = rest.indexOf('/');
    if (at <= 0 || at === rest.length - 1) return null;
    return { root: rest.slice(0, at), path: rest.slice(at + 1) };
}
