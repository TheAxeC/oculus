// Layer 3, primitive. The addresses a message holds, which the client writes in its own form (the
// `inmemory:` address of a model) and the relay in the page's (uris.ts): the addresses a message
// names, a message for the server with each turned into the page's, and whether an address is a
// document of the page. The functions are pure; the transport owns the table of addresses.

import { libraryOf, placeOf } from '../uris';
import { ADDRESSES, isRecord } from './messages';

/**
 * A message for the server with every address turned from the client's form into the page's by
 * `addresses`, or null when an address names no registered model.
 */
export function toPage(
    addresses: ReadonlyMap<string, string>,
    value: unknown
): { value: unknown } | null {
    const missing: string[] = [];
    const page = (address: string): string => {
        const found = addresses.get(address);
        if (found === undefined) {
            missing.push(address);
            return '';
        }
        return found;
    };
    const walk = (item: unknown): unknown => {
        if (Array.isArray(item)) return item.map(walk);
        if (!isRecord(item)) return item;
        const copy: Record<string, unknown> = {};
        for (const [key, inner] of Object.entries(item)) {
            if (ADDRESSES.includes(key) && typeof inner === 'string') copy[key] = page(inner);
            else if (key === 'changes' && isRecord(inner)) {
                const changes: Record<string, unknown> = {};
                for (const [address, edits] of Object.entries(inner)) {
                    changes[page(address)] = walk(edits);
                }
                copy[key] = changes;
            } else if (key === 'arguments' && Array.isArray(inner)) {
                copy[key] = inner.map((one) =>
                    typeof one === 'string' && addresses.has(one) ? page(one) : walk(one)
                );
            } else copy[key] = walk(inner);
        }
        return copy;
    };
    const walked = walk(value);
    return missing.length > 0 ? null : { value: walked };
}

/** A file's address when it is one of a served root or a library file, else null. */
export function pageOf(uri: unknown): string | null {
    if (typeof uri !== 'string') return null;
    return placeOf(uri) !== null || libraryOf(uri) !== null ? uri : null;
}

/** The addresses of documents a message names, in every field that holds one. */
export function addressesIn(value: unknown): Set<string> {
    const wanted = new Set<string>();
    const collect = (item: unknown): void => {
        if (Array.isArray(item)) {
            for (const one of item) collect(one);
            return;
        }
        if (!isRecord(item)) return;
        for (const [key, inner] of Object.entries(item)) {
            if (ADDRESSES.includes(key) && typeof inner === 'string') wanted.add(inner);
            else if (key === 'changes' && isRecord(inner)) {
                for (const address of Object.keys(inner)) wanted.add(address);
            } else collect(inner);
        }
    };
    collect(value);
    return wanted;
}
