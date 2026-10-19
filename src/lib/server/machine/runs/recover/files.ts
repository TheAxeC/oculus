// Layer 2, server. What every reader of a dataset's sources (`sources/`, one per kind) shares: the
// shape of a listed file and the reader of the listing kept on disk, the refusal that names the
// source, the request with its timeout, the size probe, the credential headers built in memory
// from the `downloads` rows, and the check of a name a source gives. The listing that runs the
// readers over an entry's sources is `listFiles` of routes.ts.
//
// A reader answers the files it lists or a refusal; an answer that does not parse is a refusal and
// never an empty list, so a set whose source changed its answer is never read as having no files.

import { readFileSync } from 'node:fs';
import { z } from 'zod';
import type { DownloadAccount, DownloadService } from '../../../../data/sources/config.ts';
import type { RecoverChecksum, RecoverFile, RecoverRefusal } from '../../../../data/model/index.ts';

/** The checksum a source publishes for a file. */
export type Checksum = RecoverChecksum;

/** One file of the dataset: its name below the dataset's folder and the source it came from. */
export type RemoteFile = RecoverFile;

/**
 * One file as its source's reader lists it, before the listing places it below the source's
 * `into` folder: its name, size (null when the source states none, as for a TCIA series, zipped as
 * it is sent), checksum, address, and the service whose `downloads` row its download needs.
 */
export type Listed = Pick<RecoverFile, 'name' | 'size' | 'checksum' | 'url' | 'service'>;

/** Why a source gives no list (data/model's RecoverRefusal). */
export type Refusal = RecoverRefusal;

/** What a reader answers. */
export type ListAnswer = Listed[] | Refusal;

/** The fetch a reader is handed, so a test answers it from a recorded answer. */
export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

/** What a reader is given: the fetch and the `downloads` rows of the primary hub's file. */
export type ListDeps = { fetch: Fetcher; downloads: DownloadAccount[] };

/** An address a file is fetched from: https, with no whitespace. */
export const httpsShape = z.string().regex(/^https:\/\/\S+$/);

/** A file as the listing kept on disk (`<key>.list.json`) holds it. */
const keptFileShape = z.object({
    name: z.string().min(1),
    size: z.number().int().min(0).nullable(),
    checksum: z
        .object({ kind: z.enum(['sha256', 'md5', 'sha1']), value: z.string().regex(/^[0-9a-f]+$/) })
        .nullable(),
    url: httpsShape,
    source: z.number().int().min(0),
    service: z.enum(['physionet', 'kaggle', 'synapse']).optional(),
    unpack: z.object({ strip: z.number().int().min(0) }).optional(),
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

/** How long one request of a listing is given. */
const REQUEST_MS = 30000;

/** Whether an answer is a refusal. */
export function isRefusal(value: unknown): value is Refusal {
    return typeof value === 'object' && value !== null && 'refused' in value;
}

/**
 * The `Authorization` header of a service's `downloads` row, built in memory: Basic with the user
 * and the secret for PhysioNet and Kaggle, Bearer with the token for Synapse. None without a row.
 */
export function authHeader(
    service: DownloadService,
    downloads: DownloadAccount[]
): { authorization?: string } {
    const row = downloads.find((one) => one.service === service);
    if (row === undefined) return {};
    if (service === 'synapse') return { authorization: `Bearer ${row.secret}` };
    const pair = Buffer.from(`${row.user ?? ''}:${row.secret}`).toString('base64');
    return { authorization: `Basic ${pair}` };
}

/** One answer read whole: its status, the address it came from after redirects, headers, body. */
export type Answer = { status: number; url: string; headers: Headers; text: string };

/**
 * A GET, or with a body a POST of that JSON, whose answer is read whole, or the refusal `network`
 * naming the source.
 */
export async function getText(
    deps: ListDeps,
    source: string,
    url: string,
    headers: Record<string, string> = {},
    body?: unknown
): Promise<Answer | Refusal> {
    try {
        const response = await deps.fetch(url, {
            ...(body === undefined
                ? { headers }
                : {
                      method: 'POST',
                      headers: { ...headers, 'content-type': 'application/json' },
                      body: JSON.stringify(body)
                  }),
            redirect: 'follow',
            signal: AbortSignal.timeout(REQUEST_MS)
        });
        return {
            status: response.status,
            url: response.url === '' ? url : response.url,
            headers: response.headers,
            text: await response.text()
        };
    } catch {
        return { refused: 'network', source };
    }
}

/** The answer when it is a success, else the refusal its status gives. */
export function succeeded(answer: Answer | Refusal, source: string): Answer | Refusal {
    if (isRefusal(answer)) return answer;
    if (answer.status === 401 || answer.status === 403) {
        return { refused: 'access', source, status: answer.status };
    }
    if (answer.status < 200 || answer.status > 299) {
        return { refused: 'status', source, status: answer.status };
    }
    return answer;
}

/** A body read as JSON, or undefined when it is none. */
function jsonOf(text: string): unknown {
    try {
        return JSON.parse(text) as unknown;
    } catch {
        return undefined;
    }
}

/**
 * A GET, or with a body a POST, read as JSON: the parsed answer, or the refusal of its status or of
 * an answer that is none.
 */
export async function getJson(
    deps: ListDeps,
    source: string,
    url: string,
    headers: Record<string, string> = {},
    sent?: unknown
): Promise<{ body: unknown; answer: Answer } | Refusal> {
    const answer = succeeded(await getText(deps, source, url, headers, sent), source);
    if (isRefusal(answer)) return answer;
    const body = jsonOf(answer.text);
    return body === undefined ? { refused: 'answer', source } : { body, answer };
}

/**
 * The size of the file at an address and the address it ends at, by a GET of its first byte: the
 * total of `Content-Range` on a 206, `Content-Length` on a 200 that ignored the range. The body is
 * not read. Null size when the answer states neither.
 */
export async function sizeAt(
    deps: ListDeps,
    source: string,
    url: string,
    headers: Record<string, string> = {}
): Promise<{ size: number | null; url: string } | Refusal> {
    let response: Response;
    try {
        response = await deps.fetch(url, {
            headers: { ...headers, range: 'bytes=0-0' },
            redirect: 'follow',
            signal: AbortSignal.timeout(REQUEST_MS)
        });
    } catch {
        return { refused: 'network', source };
    }
    await response.body?.cancel().catch(() => undefined);
    const ended = response.url === '' ? url : response.url;
    if (response.status === 401 || response.status === 403) {
        return { refused: 'access', source, status: response.status };
    }
    if (response.status === 206) {
        const total = /\/(\d+)\s*$/.exec(response.headers.get('content-range') ?? '');
        return { size: total === null ? null : Number(total[1]), url: ended };
    }
    if (response.status >= 200 && response.status <= 299) {
        const length = response.headers.get('content-length');
        return {
            size: length !== null && /^\d+$/.test(length) ? Number(length) : null,
            url: ended
        };
    }
    return { refused: 'status', source, status: response.status };
}

/** How many size probes of one listing run at once. */
const PROBES_AT_ONCE = 8;

/**
 * The files with the size of each read by `sizeAt`, eight probes at a time, in the files' order;
 * the first refusal ends the listing.
 */
export async function sized(
    deps: ListDeps,
    source: string,
    files: Listed[],
    headers: Record<string, string> = {}
): Promise<Listed[] | Refusal> {
    const out: Listed[] = new Array<Listed>(files.length);
    let next = 0;
    /** The first refusal, held in an object the workers share. */
    const ended: { refusal: Refusal | null } = { refusal: null };
    const worker = async (): Promise<void> => {
        while (ended.refusal === null && next < files.length) {
            const at = next;
            next += 1;
            const probe = await sizeAt(deps, source, files[at].url, headers);
            if (isRefusal(probe)) ended.refusal = probe;
            else out[at] = { ...files[at], size: probe.size };
        }
    };
    await Promise.all(Array.from({ length: Math.min(PROBES_AT_ONCE, files.length) }, worker));
    return ended.refusal ?? out;
}

/** A control character, a backslash or an empty, `.` or `..` part makes a name unusable. */
// eslint-disable-next-line no-control-regex
const BAD_NAME = /[\u0000-\u001f\u007f\\]/;

/**
 * Whether a name a source or an entry gives is a relative path that stays inside its folder: no
 * leading `/`, no `.` or `..` part, no empty part, no backslash and no control character.
 */
export function safeName(name: string): boolean {
    if (name === '' || name.startsWith('/') || BAD_NAME.test(name)) return false;
    return name.split('/').every((part) => part !== '' && part !== '.' && part !== '..');
}

/** A name with the source's `into` folder in front of it. */
export function placed(name: string, into: string | undefined): string {
    return into === undefined ? name : `${into.replace(/\/+$/, '')}/${name}`;
}

/**
 * The listed files an entry names, in the entry's order, or every file when it names none; a name
 * the answer does not hold is the refusal `missing` naming it.
 */
export function picked(
    listed: Listed[],
    wanted: string[] | undefined,
    source: string
): Listed[] | Refusal {
    if (wanted === undefined || wanted.length === 0) return listed;
    const byName = new Map(listed.map((one) => [one.name, one]));
    const chosen: Listed[] = [];
    for (const name of wanted) {
        const found = byName.get(name);
        if (found === undefined) return { refused: 'missing', source, name };
        chosen.push(found);
    }
    return chosen;
}
