// Layer 2, server. The files of a `url` source: each address the entry lists, saved under its
// `name` when the entry gives one and under the last part of the address otherwise, with its size
// from a GET of its first byte and the sha256 or md5 the entry gives for it, when it gives one. A
// refusal names the address's host; an address that is not https is refused as `url`.

import type { RecoverSource } from '../../../../../data/model/index.ts';
import {
    isRefusal,
    sizeAt,
    type Checksum,
    type ListAnswer,
    type ListDeps,
    type Listed
} from '../files.ts';

type Source = Extract<RecoverSource, { kind: 'url' }>;

/** The host and the last part of an https address, or null for any other address. */
function partsOf(url: string): { host: string; last: string } | null {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:' || /\s/.test(url)) return null;
        return {
            host: parsed.host,
            last: decodeURIComponent(parsed.pathname.split('/').pop() ?? '')
        };
    } catch {
        return null;
    }
}

/** The sha256 or the md5 a row gives, in lower case, or null when it gives neither in hex. */
function checksumOf(one: Source['urls'][number]): Checksum | null {
    if (one.sha256 !== undefined && /^[0-9a-fA-F]{64}$/.test(one.sha256)) {
        return { kind: 'sha256', value: one.sha256.toLowerCase() };
    }
    if (one.md5 !== undefined && /^[0-9a-fA-F]{32}$/.test(one.md5)) {
        return { kind: 'md5', value: one.md5.toLowerCase() };
    }
    return null;
}

/** The files of the source, or the refusal naming the host it failed on. */
export async function listUrls(source: Source, deps: ListDeps): Promise<ListAnswer> {
    const listed: Listed[] = [];
    for (const one of source.urls) {
        const parts = partsOf(one.url);
        if (parts === null) return { refused: 'answer', source: 'url' };
        const probe = await sizeAt(deps, parts.host, one.url);
        if (isRefusal(probe)) return probe;
        listed.push({
            name: one.name ?? parts.last,
            size: probe.size,
            checksum: checksumOf(one),
            url: one.url
        });
    }
    return listed;
}
