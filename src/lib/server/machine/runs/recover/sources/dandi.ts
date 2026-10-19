// Layer 2, server. The files of a DANDI source: the version's assets, read a page at a time by the
// answer's `next` address, the entry's `assets` (asset paths) picked when it names any, and each
// picked asset's sha256 from its own metadata (`digest["dandi:sha2-256"]`). A file is named by the
// last part of its asset path, since the readers of a DANDI set read its files flat in the folder.

import { z } from 'zod';
import type { RecoverSource } from '../../../../../data/model/index.ts';
import {
    getJson,
    httpsShape,
    isRefusal,
    picked,
    type ListAnswer,
    type ListDeps,
    type Listed
} from '../files.ts';

type Source = Extract<RecoverSource, { kind: 'dandi' }>;

const SOURCE = 'dandi';

const API = 'https://api.dandiarchive.org/api';

/** A page of a version's assets. */
const pageShape = z.object({
    next: httpsShape.nullable(),
    results: z.array(
        z.object({
            asset_id: z.string().regex(/^[0-9a-f-]+$/),
            path: z.string().min(1),
            size: z.number().int().min(0),
            zarr: z.string().nullable().optional()
        })
    )
});

/** The part of an asset's metadata the listing reads. */
const metadataShape = z.object({
    digest: z.record(z.string(), z.string()).optional()
});

/** The files of the source, or the refusal naming DANDI. */
export async function listDandi(source: Source, deps: ListDeps): Promise<ListAnswer> {
    const version = `${API}/dandisets/${encodeURIComponent(source.dandiset)}/versions/${encodeURIComponent(source.version)}`;
    const assets: { id: string; path: string; size: number }[] = [];
    for (let url: string | null = `${version}/assets/?page_size=100`; url !== null;) {
        const read = await getJson(deps, SOURCE, url);
        if (isRefusal(read)) return read;
        const page = pageShape.safeParse(read.body);
        if (!page.success) return { refused: 'answer', source: SOURCE };
        for (const one of page.data.results) {
            if (one.zarr !== null && one.zarr !== undefined) {
                return { refused: 'answer', source: SOURCE };
            }
            assets.push({ id: one.asset_id, path: one.path, size: one.size });
        }
        url = page.data.next;
    }
    const byPath: Listed[] = assets.map((one) => ({
        name: one.path,
        size: one.size,
        checksum: null,
        url: `${API}/assets/${one.id}/download/`
    }));
    const chosen = picked(byPath, source.assets, SOURCE);
    if (isRefusal(chosen)) return chosen;
    const listed: Listed[] = [];
    for (const one of chosen) {
        const id = assets.find((asset) => asset.path === one.name)?.id ?? '';
        const read = await getJson(deps, SOURCE, `${version}/assets/${id}/`);
        if (isRefusal(read)) return read;
        const metadata = metadataShape.safeParse(read.body);
        if (!metadata.success) return { refused: 'answer', source: SOURCE };
        const sha256 = metadata.data.digest?.['dandi:sha2-256'];
        listed.push({
            ...one,
            name: one.name.split('/').pop() ?? one.name,
            checksum:
                sha256 !== undefined && /^[0-9a-f]{64}$/.test(sha256)
                    ? { kind: 'sha256', value: sha256 }
                    : null
        });
    }
    return listed;
}
