// Layer 1, data. Whether a `link` or `url` value is a web address or a path inside the hub, and the
// one check a web address an app or a linter names must pass before the page opens it.
//
// The hub path rule is imported by both layers: the collection card runs it to decide whether a
// click opens a web page or a file of the hub, and the Audit runs it to decide which links to look
// for on disk. A second copy of the rule on either side would let the two disagree, so a link the
// card opens as a web page would be reported missing from the disk, or one it serves from the hub
// never checked. `webAddress` is the one check of an address the page opens: an app's `open`
// (state/system/apps/methods.ts), and a linter's documentation link, which the lint readers keep
// only when it passes (server/machine/runs/lint/readers.ts) and the editor, the markers and the
// Problems view check again before they open it. The file is pure, two regular expressions and
// two functions, so the server can import it as the client does.

/**
 * A value that already names where it goes: a scheme, or an absolute path of the page's own. With
 * HOSTED below it this is the whole rule: an address is a value carrying a scheme, a leading slash,
 * a `www.` first segment, or any other host with a path behind it. A lone dotted segment stays a
 * path inside the hub, since `github.com` and `README.md` are one shape and separating them would
 * take the hub root's own listing, which lands after the card is drawn and would take a control
 * away again.
 */
export const ADDRESSED = /^([a-z][a-z0-9+.-]*:|\/)/i;

/**
 * A web address written without a scheme, told by its first segment being a host: a `www.` prefix,
 * or a dotted first segment ending in a letters-only suffix of two or more with an optional port
 * and a path behind it. A hub path's first segment holds a dot without being either (`README.md`,
 * `notes.v2/plan.md`), so it stays a path.
 */
export const HOSTED = /^(www\.[^/]+|[^/:]+\.[a-z]{2,}(:[0-9]+)?\/.*)$/i;

/**
 * Whether a `link` or `url` value is a path inside the hub, which the card serves through api/file
 * and the Audit looks for on disk.
 */
export function isHubPath(value: string): boolean {
    return value !== '' && !ADDRESSED.test(value) && !HOSTED.test(value);
}

/** The most characters an address a program or an app asks the page to open may have. */
const ADDRESS_MAX = 2048;

/**
 * The address as the browser reads it, or null when the value is not an `http:` or `https:` address
 * of at most `ADDRESS_MAX` characters with no user name or password in it. An app's `open` and a
 * linter's documentation link are opened only when it answers one.
 */
export function webAddress(value: unknown): string | null {
    if (typeof value !== 'string' || value.length > ADDRESS_MAX) return null;
    let parsed: URL;
    try {
        parsed = new URL(value);
    } catch {
        return null;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (parsed.username !== '' || parsed.password !== '') return null;
    return parsed.href;
}
