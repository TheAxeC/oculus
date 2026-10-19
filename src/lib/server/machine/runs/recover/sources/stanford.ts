// Layer 2, server. The files of a Stanford Digital Repository source: the purl record's
// `structural.contains`, each resource holding its files with their size and digests, read with
// the sha1 where the record gives one and the md5 otherwise, and fetched from the stacks address
// of the druid.

import { z } from 'zod';
import type { RecoverSource } from '../../../../../data/model/index.ts';
import {
    getJson,
    isRefusal,
    picked,
    type Checksum,
    type ListAnswer,
    type ListDeps,
    type Listed
} from '../files.ts';

type Source = Extract<RecoverSource, { kind: 'stanford' }>;

const SOURCE = 'stanford';

/** A druid: two letters, three digits, two letters, four digits. */
const DRUID = /^[a-z]{2}\d{3}[a-z]{2}\d{4}$/;

const fileShape = z.object({
    filename: z.string().min(1),
    size: z.number().int().min(0),
    hasMessageDigests: z.array(z.object({ type: z.string(), digest: z.string() })).optional()
});

const recordShape = z.object({
    structural: z.object({
        contains: z.array(z.object({ structural: z.object({ contains: z.array(fileShape) }) }))
    })
});

/** The sha1 of a file's digests, else its md5, else none. */
function digestOf(digests: { type: string; digest: string }[] | undefined): Checksum | null {
    const sha1 = digests?.find((one) => one.type === 'sha1' && /^[0-9a-f]{40}$/.test(one.digest));
    if (sha1 !== undefined) return { kind: 'sha1', value: sha1.digest };
    const md5 = digests?.find((one) => one.type === 'md5' && /^[0-9a-f]{32}$/.test(one.digest));
    return md5 === undefined ? null : { kind: 'md5', value: md5.digest };
}

/** The files of the source, or the refusal naming the Stanford Digital Repository. */
export async function listStanford(source: Source, deps: ListDeps): Promise<ListAnswer> {
    if (!DRUID.test(source.druid)) return { refused: 'answer', source: SOURCE };
    const read = await getJson(deps, SOURCE, `https://purl.stanford.edu/${source.druid}.json`);
    if (isRefusal(read)) return read;
    const record = recordShape.safeParse(read.body);
    if (!record.success) return { refused: 'answer', source: SOURCE };
    const listed: Listed[] = record.data.structural.contains.flatMap((resource) =>
        resource.structural.contains.map((one) => ({
            name: one.filename,
            size: one.size,
            checksum: digestOf(one.hasMessageDigests),
            url: `https://stacks.stanford.edu/file/druid:${source.druid}/${one.filename
                .split('/')
                .map(encodeURIComponent)
                .join('/')}`
        }))
    );
    return picked(listed, source.files, SOURCE);
}
