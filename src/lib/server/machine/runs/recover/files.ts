// Layer 2, server. What Recover's listing and access check share: the shape of a listed file, the
// reader of the listing kept on disk, the refusal that names the source, the check of a name a
// source gives (`safeName`, passed on from the registry read,
// data/snapshot/normalise-parts/retrieval.ts, whose `folder` follows the same rule), and the
// sender every request to a source's row goes out with. The rows are the `recover.sources` of the
// dataset's hub, read by the one reader (server/core/reader/); the listing that runs it over an
// entry's sources is `listFiles` of routes.ts.
//
// A row answers the files it lists or a refusal; an answer that does not parse is a refusal and
// never an empty list, so a set whose source changed its answer is never read as having no files.
// A kept listing whose unpack folder breaks the registry's rule reads as no listing, so the
// sources are listed again from the registry.

import { readFileSync } from 'node:fs';
import { z } from 'zod';
import type { DownloadAccount } from '../../../../data/sources/config.ts';
import type { RecoverFile, RecoverRefusal } from '../../../../data/model/index.ts';
import type { ReaderRow } from '../../../../data/sources/config/settings/rows/grammar.ts';
import { archiveFolderShape } from '../../../../data/snapshot/normalise-parts/retrieval.ts';
import type { Fetcher as ReaderFetcher, Sender } from '../../../core/reader/call.ts';

export { safeName } from '../../../../data/snapshot/normalise-parts/retrieval.ts';

/** One file of the dataset: its name below the dataset's folder and the source it came from. */
export type RemoteFile = RecoverFile;

/** Why a source gives no list (data/model's RecoverRefusal). */
export type Refusal = RecoverRefusal;

/** The fetch a listing is handed, so a test answers it from a recorded answer. */
export type Fetcher = ReaderFetcher;

/**
 * What a listing is given: the fetch, the `downloads` rows of the primary hub's file, the rows of
 * `recover.sources` of the dataset's hub, and the User-Agent its requests carry.
 */
export type ListDeps = {
    fetch: Fetcher;
    downloads: DownloadAccount[];
    rows: readonly ReaderRow[];
    agent: string;
};

/** How long one request of a listing is given, and one Zenodo call other than an upload. */
export const REQUEST_MS = 30000;

/** The most bytes of one answer of a listing that are read. */
const ANSWER_MAX = 64 * 1024 * 1024;

/** The sender of a listing's requests. */
export function senderOf(deps: ListDeps): Sender {
    return { fetcher: deps.fetch, agent: deps.agent, timeoutMs: REQUEST_MS, maxBytes: ANSWER_MAX };
}

/** The row of `recover.sources` a source's kind names, or undefined when none does. */
export function rowOf(rows: readonly ReaderRow[], kind: string): ReaderRow | undefined {
    return rows.find((row) => row.key === kind);
}

/** An address a file is fetched from: https, with no whitespace. */
const httpsShape = z.string().regex(/^https:\/\/\S+$/);

/** A word a file name may be built from: a `downloads` row's key, a header's name. */
const wordShape = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/);

/** A file as the listing kept on disk (`<key>.list.json`) holds it. */
const keptFileShape = z.object({
    name: z.string().min(1),
    size: z.number().int().min(0).nullable(),
    checksum: z
        .object({ kind: z.enum(['sha256', 'md5', 'sha1']), value: z.string().regex(/^[0-9a-f]+$/) })
        .nullable(),
    url: httpsShape,
    source: z.number().int().min(0),
    service: wordShape.optional(),
    credential: z
        .union([
            z.object({ basic: z.literal(true) }),
            z.object({ header: wordShape, prefix: z.string().optional() })
        ])
        .optional(),
    unpack: z
        .object({ strip: z.number().int().min(0), folder: archiveFolderShape.optional() })
        .optional(),
    throttle: z.string().optional()
});

const keptShape = z.object({ recipe: z.string(), files: z.array(keptFileShape) });

/** The listing kept on disk: the recipe it was read for and its files. */
export type Kept = { recipe: string; files: RemoteFile[] };

/** The listing kept in `file`, or null when it is absent or does not read as one. */
export function readKept(file: string): Kept | null {
    try {
        const read = keptShape.safeParse(JSON.parse(readFileSync(file, 'utf8')));
        return read.success ? read.data : null;
    } catch {
        return null;
    }
}

/** Whether an answer is a refusal. */
export function isRefusal(value: unknown): value is Refusal {
    return typeof value === 'object' && value !== null && 'refused' in value;
}

/** A name with the source's `into` folder in front of it. */
export function placed(name: string, into: string | undefined): string {
    return into === undefined ? name : `${into.replace(/\/+$/, '')}/${name}`;
}
