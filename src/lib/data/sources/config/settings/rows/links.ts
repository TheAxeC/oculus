// Layer 1, data. A page link built from a `links` row of the primary hub's `.oculus/config.yml`:
// the row's address with `{id}` filled by an identifier and its other holes by the fields the
// caller hands, each value encoded for its part (holes.ts). The server's readers and the page
// build every address of a DOI, a paper's page or a lint code's help this way, so a link whose row
// is missing is not drawn, and nothing falls back to an address written in code.
//
// A link is drawn only when the address it makes is `https:`; a row whose address is anything
// else is a finding of the config (check.ts), and the link is not drawn.

import type { LinkRow } from './grammar.ts';
import { fillAddress, holesOf, type Lookup } from './holes.ts';

/**
 * The address the `links` row `key` makes for `id`, the other holes filled by `holes`, or
 * undefined when no row has the key, a hole has no value, or the address is not `https:`.
 */
export function linkAddress(
    links: readonly LinkRow[],
    key: string,
    id: string,
    holes: Lookup = () => undefined
): string | undefined {
    const row = links.find((one) => one.key === key);
    if (row === undefined || id === '') return undefined;
    const address = fillAddress(row.address, (name) => (name === 'id' ? id : holes(name)));
    if (address === undefined) return undefined;
    try {
        return new URL(address).protocol === 'https:' ? address : undefined;
    } catch {
        return undefined;
    }
}

/**
 * The address of a `links` row whose holes other than `{id}` are query values the caller may
 * leave empty: a parameter all of whose holes are empty is left out of the address. Google
 * Scholar's year bounds are such parameters. Undefined as `linkAddress` is.
 */
export function linkWithOptional(
    links: readonly LinkRow[],
    key: string,
    id: string,
    holes: Record<string, string | undefined>
): string | undefined {
    const row = links.find((one) => one.key === key);
    if (row === undefined) return undefined;
    const query = row.address.indexOf('?');
    if (query < 0) return linkAddress(links, key, id, (name) => holes[name]);
    const kept = row.address
        .slice(query + 1)
        .split('&')
        .filter((pair) => {
            const names = holesOf(pair).map((hole) => hole.name);
            return names.length === 0 || names.some((name) => name === 'id' || holes[name]);
        });
    const address = `${row.address.slice(0, query)}${kept.length === 0 ? '' : '?'}${kept.join('&')}`;
    return linkAddress([{ key, address }], key, id, (name) => holes[name]);
}
