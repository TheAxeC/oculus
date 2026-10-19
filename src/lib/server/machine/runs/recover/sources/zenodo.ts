// Layer 2, server. The files of a Zenodo source: the record API's `files`, each with its key, its
// size, its md5 (`md5:<hex>`) and the address of its content.

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

type Source = Extract<RecoverSource, { kind: 'zenodo' }>;

const SOURCE = 'zenodo';

/** The part of a record's answer the listing reads. */
const recordShape = z.object({
    files: z.array(
        z.object({
            key: z.string().min(1),
            size: z.number().int().min(0),
            checksum: z.string().regex(/^md5:[0-9a-f]{32}$/),
            links: z.object({ self: httpsShape })
        })
    )
});

/** The files of the record, or the refusal naming Zenodo. */
export async function listZenodo(source: Source, deps: ListDeps): Promise<ListAnswer> {
    const url = `https://zenodo.org/api/records/${encodeURIComponent(source.record)}`;
    const read = await getJson(deps, SOURCE, url);
    if (isRefusal(read)) return read;
    const record = recordShape.safeParse(read.body);
    if (!record.success) return { refused: 'answer', source: SOURCE };
    const listed: Listed[] = record.data.files.map((one) => ({
        name: one.key,
        size: one.size,
        checksum: { kind: 'md5', value: one.checksum.slice('md5:'.length) },
        url: one.links.self
    }));
    return picked(listed, source.files, SOURCE);
}
