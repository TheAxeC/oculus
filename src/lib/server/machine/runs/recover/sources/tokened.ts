// Layer 2, server. The files of the two sources whose every request carries a `downloads` row:
// Kaggle and Synapse. With no row of the service the source is refused as `access` before any
// request, since neither answers a request without one.
//
// Kaggle (https://www.kaggle.com/docs/api, the API's specification in
// https://github.com/Kaggle/kaggle-api): the dataset's file list (`/api/v1/datasets/list/<owner>/
// <slug>`) is read to check that the set answers and holds files; Kaggle sends a dataset as one
// zip (`/api/v1/datasets/download/<owner>/<slug>`), which is the one file Recover fetches, named
// `<slug>.zip`, with its size from a GET of its first byte and no checksum.
//
// Synapse (https://rest-docs.synapse.org/rest/): each id's entity is read; a file entity is one
// file with the size and md5 of its file handle (`/entity/<id>/filehandles`), and a folder or
// project is read through its children (`POST /entity/children`, a page at a time by
// `nextPageToken`), each file named by its folders below the id. A file is fetched from
// `/entity/<id>/file`, which redirects to the store that holds it.

import { z } from 'zod';
import type { RecoverSource } from '../../../../../data/model/index.ts';
import {
    authHeader,
    getJson,
    isRefusal,
    sizeAt,
    type ListAnswer,
    type ListDeps,
    type Listed,
    type Refusal
} from '../files.ts';

type KaggleSource = Extract<RecoverSource, { kind: 'kaggle' }>;
type SynapseSource = Extract<RecoverSource, { kind: 'synapse' }>;

const KAGGLE_API = 'https://www.kaggle.com/api/v1';

/** A Kaggle dataset, `<owner>/<slug>`. */
const KAGGLE_DATASET = /^([A-Za-z0-9][A-Za-z0-9_-]*)\/([A-Za-z0-9][A-Za-z0-9_.-]*)$/;

const kaggleListShape = z.object({
    datasetFiles: z.array(z.object({ name: z.string(), totalBytes: z.number().optional() }))
});

/** The address Kaggle's dataset list is read from, which access.ts reads as the login request. */
export function kaggleListUrl(dataset: string): string | null {
    const found = KAGGLE_DATASET.exec(dataset);
    return found === null ? null : `${KAGGLE_API}/datasets/list/${found[1]}/${found[2]}`;
}

/** The dataset's zip, or the refusal naming Kaggle. */
export async function listKaggle(source: KaggleSource, deps: ListDeps): Promise<ListAnswer> {
    const headers = authHeader('kaggle', deps.downloads);
    if (headers.authorization === undefined) return { refused: 'access', source: 'kaggle' };
    const found = KAGGLE_DATASET.exec(source.dataset);
    const list = kaggleListUrl(source.dataset);
    if (found === null || list === null) return { refused: 'answer', source: 'kaggle' };
    const read = await getJson(deps, 'kaggle', list, headers);
    if (isRefusal(read)) return read;
    const files = kaggleListShape.safeParse(read.body);
    if (!files.success || files.data.datasetFiles.length === 0) {
        return { refused: 'answer', source: 'kaggle' };
    }
    const url = `${KAGGLE_API}/datasets/download/${found[1]}/${found[2]}`;
    const probe = await sizeAt(deps, 'kaggle', url, headers);
    if (isRefusal(probe)) return probe;
    return [{ name: `${found[2]}.zip`, size: probe.size, checksum: null, url, service: 'kaggle' }];
}

export const SYNAPSE_API = 'https://repo-prod.prod.sagebase.org/repo/v1';

/** A Synapse id. */
const SYNAPSE_ID = /^syn\d+$/;

const entityShape = z.object({ id: z.string().regex(SYNAPSE_ID), concreteType: z.string() });

const handlesShape = z.object({
    list: z.array(
        z.object({
            fileName: z.string().min(1),
            contentSize: z.number().int().min(0),
            contentMd5: z.string().optional(),
            concreteType: z.string()
        })
    )
});

const childrenShape = z.object({
    page: z.array(
        z.object({ id: z.string().regex(SYNAPSE_ID), name: z.string().min(1), type: z.string() })
    ),
    nextPageToken: z.string().nullable().optional()
});

/** The type Synapse names a file entity by, in an entity's `concreteType` and a child's `type`. */
const FILE_ENTITY = 'org.sagebionetworks.repo.model.FileEntity';

/** The type of a folder entity. */
const FOLDER_ENTITY = 'org.sagebionetworks.repo.model.Folder';

/** How many folders deep a Synapse id is read. */
const MAX_DEPTH = 8;

/** One file entity, named below `folder`, or the refusal naming Synapse. */
async function synapseFile(
    id: string,
    folder: string,
    deps: ListDeps,
    headers: Record<string, string>
): Promise<Listed | Refusal> {
    const read = await getJson(deps, 'synapse', `${SYNAPSE_API}/entity/${id}/filehandles`, headers);
    if (isRefusal(read)) return read;
    const handles = handlesShape.safeParse(read.body);
    const handle = handles.success
        ? handles.data.list.find((one) => !one.concreteType.endsWith('PreviewFileHandle'))
        : undefined;
    if (handle === undefined) return { refused: 'answer', source: 'synapse' };
    return {
        name: folder + handle.fileName,
        size: handle.contentSize,
        checksum:
            handle.contentMd5 !== undefined && /^[0-9a-f]{32}$/.test(handle.contentMd5)
                ? { kind: 'md5', value: handle.contentMd5 }
                : null,
        url: `${SYNAPSE_API}/entity/${id}/file`,
        service: 'synapse'
    };
}

/** Every file below a folder or project, each named by its folders, or the refusal. */
async function synapseFolder(
    id: string,
    folder: string,
    depth: number,
    deps: ListDeps,
    headers: Record<string, string>
): Promise<Listed[] | Refusal> {
    if (depth > MAX_DEPTH) return { refused: 'answer', source: 'synapse' };
    const listed: Listed[] = [];
    let token: string | undefined;
    do {
        const read = await getJson(deps, 'synapse', `${SYNAPSE_API}/entity/children`, headers, {
            parentId: id,
            includeTypes: ['file', 'folder'],
            ...(token === undefined ? {} : { nextPageToken: token })
        });
        if (isRefusal(read)) return read;
        const page = childrenShape.safeParse(read.body);
        if (!page.success) return { refused: 'answer', source: 'synapse' };
        for (const child of page.data.page) {
            const found =
                child.type === FILE_ENTITY
                    ? await synapseFile(child.id, folder, deps, headers)
                    : child.type === FOLDER_ENTITY
                      ? await synapseFolder(
                            child.id,
                            `${folder}${child.name}/`,
                            depth + 1,
                            deps,
                            headers
                        )
                      : null;
            if (found === null) continue;
            if (isRefusal(found)) return found;
            listed.push(...(Array.isArray(found) ? found : [found]));
        }
        token = page.data.nextPageToken ?? undefined;
    } while (token !== undefined);
    return listed;
}

/** The files of the source's ids, or the refusal naming Synapse. */
export async function listSynapse(source: SynapseSource, deps: ListDeps): Promise<ListAnswer> {
    const headers = authHeader('synapse', deps.downloads);
    if (headers.authorization === undefined) return { refused: 'access', source: 'synapse' };
    const listed: Listed[] = [];
    for (const id of source.ids) {
        if (!SYNAPSE_ID.test(id)) return { refused: 'answer', source: 'synapse' };
        const read = await getJson(deps, 'synapse', `${SYNAPSE_API}/entity/${id}`, headers);
        if (isRefusal(read)) return read;
        const entity = entityShape.safeParse(read.body);
        if (!entity.success) return { refused: 'answer', source: 'synapse' };
        const found =
            entity.data.concreteType === FILE_ENTITY
                ? await synapseFile(id, '', deps, headers)
                : await synapseFolder(id, '', 0, deps, headers);
        if (isRefusal(found)) return found;
        listed.push(...(Array.isArray(found) ? found : [found]));
    }
    return listed;
}
