// Layer 4, server test. The Recover source readers (G111): one table, a row per kind read from a
// recorded answer into the files it lists, each with its name, size and checksum, and a refusal row
// per kind whose answer does not parse, which is refused with the source named and never read as an
// empty list. Every row goes through the GET of routes.ts (`handleRecoverState`) for a dataset of
// the row's one source, the one entry the requests call, and reads the plan's rows or its refusal.
//
// The answers of zenodo, figshare's collection, DANDI's first page, Hugging Face's first two pages,
// Stanford, GEO, TCIA and PhysioNet's open and credentialed `SHA256SUMS.txt` were recorded from the
// services (answers/). The answers that need an account or a page the recording did not reach were
// written from each service's published API reference:
// - PhysioNet's `SHA256SUMS.txt` read with a login has the format of an open one
//   (https://physionet.org/about/publish/, "Files"); answers/physionet/mimiciv-sums.
// - figshare's public article (https://docs.figshare.com/#public_article);
//   answers/figshare/article.
// - DANDI's asset list and an asset's metadata (https://api.dandiarchive.org/swagger/, `GET
//   /dandisets/{id}/versions/{version}/assets/` and `.../assets/{asset_id}/`); answers/dandi.
// - Hugging Face's tree, its last page with no `Link` header
//   (https://huggingface.co/docs/hub/api#get-apidatasetsrepoidtreerevisionpath);
//   answers/huggingface/tree-p3.
// - Kaggle's dataset file list (https://github.com/Kaggle/kaggle-api, `datasets_list_files`);
//   answers/kaggle/list.
// - Synapse's entity, children, file handles and user profile (https://rest-docs.synapse.org/rest/,
//   `GET /entity/{id}`, `POST /entity/children`, `GET /entity/{id}/filehandles`, `GET
//   /userProfile`); answers/synapse.

import { describe, expect } from 'vitest';
import type {
    RecoverFile,
    RecoverSource,
    RecoverState
} from '../../../../../src/lib/data/model/index.ts';
import type { DownloadAccount } from '../../../../../src/lib/data/sources/config.ts';
import { accessOf } from '../../../../../src/lib/server/machine/runs/recover/access.ts';
import { localDeps } from '../../../../../src/lib/server/machine/runs/recover/local.ts';
import { handleRecoverState } from '../../../../../src/lib/server/machine/runs/recover/routes.ts';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';
import { datasetOf, recoverRequest, targetOf } from './harness.ts';
import {
    answering,
    bodyOf,
    jsonOf,
    ranged,
    recorded,
    reply,
    type Asked,
    type Routes
} from './recorded.ts';

const PHYSIONET = 'https://physionet.org/files/';
const ZENODO = 'https://zenodo.org/api/records/';
const FIGSHARE = 'https://api.figshare.com/v2/';
const DANDI = 'https://api.dandiarchive.org/api/dandisets/000055/versions/draft/assets/';
const HF = 'https://huggingface.co/api/datasets/mathpluscode/ACDC/tree/main';
const GEO = 'https://ftp.ncbi.nlm.nih.gov/geo/series/GSE180nnn/GSE180759/suppl/';
const TCIA = 'https://services.cancerimagingarchive.net/nbia-api/services/v1/';
const KAGGLE = 'https://www.kaggle.com/api/v1/datasets/';
const SYNAPSE = 'https://repo-prod.prod.sagebase.org/repo/v1/';

/** The address a recorded Hugging Face page's `Link` header names as the next page. */
function linkOf(name: string): string {
    return /<([^>]+)>/.exec(recorded(name).headers.get('link') ?? '')?.[1] ?? '';
}

const PHYSIONET_ROW: DownloadAccount = { service: 'physionet', user: 'reader', secret: 'pw' };
const KAGGLE_ROW: DownloadAccount = { service: 'kaggle', user: 'reader', secret: 'key' };
const SYNAPSE_ROW: DownloadAccount = { service: 'synapse', secret: 'token' };

/** A figshare article's answer holding one file of the given name. */
function article(id: number, name: string): Response {
    const body = jsonOf('figshare/article') as { files: Record<string, unknown>[] };
    return reply(
        200,
        JSON.stringify({ ...body, id, files: body.files.map((one) => ({ ...one, name })) })
    );
}

/** The collection's article ids, in the order the recorded page lists them. */
const ARTICLES = (jsonOf('figshare/collection') as { id: number }[]).map((one) => one.id);

/** Synapse's answer to a children request, by the folder asked for and the page token. */
function children(asked: Asked): Response {
    const sent = asked.body as { parentId: string; nextPageToken?: string };
    if (sent.parentId === 'syn51514132') {
        return recorded(
            sent.nextPageToken === '50a0' ? 'synapse/children-p2' : 'synapse/children-p1'
        );
    }
    return reply(200, JSON.stringify({ page: [] }));
}

/** Synapse's file handles of an entity: the recorded zip's, or for labels.csv that name. */
function handles(asked: Asked): Response {
    if (!asked.url.includes('syn51514140')) return recorded('synapse/filehandles');
    const body = jsonOf('synapse/filehandles') as { list: Record<string, unknown>[] };
    return reply(
        200,
        JSON.stringify({ list: [{ ...body.list[0], fileName: 'labels.csv', contentSize: 2048 }] })
    );
}

type Row = {
    name: string;
    source: RecoverSource;
    downloads?: DownloadAccount[];
    routes: Routes;
    /** The files the listing gives first, in order, as far as the row states them. */
    files?: Partial<RecoverFile>[];
    /** How many files the listing gives. */
    count?: number;
    refused?: Record<string, unknown>;
    /** A header every request carried. */
    header?: [string, string];
};

const ROWS: Row[] = [
    {
        name: 'physionet, an open set: SHA256SUMS.txt and a size probe per file',
        source: {
            kind: 'physionet',
            project: 'mitdb',
            version: '1.0.0',
            files: ['100.atr', '100.dat']
        },
        routes: {
            [`${PHYSIONET}mitdb/1.0.0/SHA256SUMS.txt`]: recorded('physionet/mitdb'),
            [`${PHYSIONET}mitdb/1.0.0/100.atr`]: ranged(4558),
            [`${PHYSIONET}mitdb/1.0.0/100.dat`]: ranged(1950000)
        },
        files: [
            {
                name: '100.atr',
                size: 4558,
                checksum: {
                    kind: 'sha256',
                    value: '8d8a5349fb16638ebbf649f1779d12e96d91b736b2aafe59db43719ae583d471'
                },
                url: `${PHYSIONET}mitdb/1.0.0/100.atr`,
                source: 0
            },
            {
                name: '100.dat',
                size: 1950000,
                checksum: {
                    kind: 'sha256',
                    value: 'b2ea3c250e56e48f4b7b90697832b8ecd1afa1e0bb31f2dcfea4ed6e1075a639'
                }
            }
        ],
        count: 2
    },
    {
        name: 'physionet, a credentialed set read with the downloads row, which every request carries',
        source: { kind: 'physionet', project: 'mimiciv', version: '3.1', throttle: '5M' },
        downloads: [PHYSIONET_ROW],
        routes: {
            [`${PHYSIONET}mimiciv/3.1/SHA256SUMS.txt`]: recorded('physionet/mimiciv-sums'),
            [`${PHYSIONET}mimiciv/3.1/*`]: ranged(1000)
        },
        files: [
            { name: 'CHANGELOG.txt', size: 1000, service: 'physionet', throttle: '5M' },
            {
                name: 'hosp/admissions.csv.gz',
                url: `${PHYSIONET}mimiciv/3.1/hosp/admissions.csv.gz`
            }
        ],
        count: 3,
        header: ['authorization', `Basic ${Buffer.from('reader:pw').toString('base64')}`]
    },
    {
        name: 'physionet, the zip of a project, named by the address get-zip ends at',
        source: { kind: 'physionet', project: 'mitdb', version: '1.0.0', archive: true },
        routes: {
            'https://physionet.org/content/mitdb/get-zip/1.0.0/': () =>
                ranged(
                    73500000,
                    'https://physionet.org/static/published-projects/mitdb/mit-bih-arrhythmia-database-1.0.0.zip'
                )
        },
        files: [{ name: 'mit-bih-arrhythmia-database-1.0.0.zip', size: 73500000, checksum: null }],
        count: 1
    },
    {
        name: 'physionet refused: a credentialed set answers 403 with no row',
        source: { kind: 'physionet', project: 'mimiciv', version: '3.1' },
        routes: {
            [`${PHYSIONET}mimiciv/3.1/SHA256SUMS.txt`]: recorded('physionet/mimiciv-nologin')
        },
        refused: { refused: 'access', source: 'physionet', status: 403 }
    },
    {
        name: 'physionet refused: a SHA256SUMS.txt that holds no sums',
        source: { kind: 'physionet', project: 'mitdb', version: '1.0.0' },
        routes: {
            [`${PHYSIONET}mitdb/1.0.0/SHA256SUMS.txt`]: reply(200, '<html>moved</html>')
        },
        refused: { refused: 'answer', source: 'physionet' }
    },
    {
        name: "zenodo: the record API with each file's size and md5",
        source: { kind: 'zenodo', record: '1199011' },
        routes: { [`${ZENODO}1199011`]: recorded('zenodo/aad-dtu') },
        files: [
            {
                name: 'AUDIO.zip',
                size: 385086237,
                checksum: { kind: 'md5', value: '18532a2882ccd87c448c9481b4b2c47d' },
                url: `${ZENODO}1199011/files/AUDIO.zip/content`
            },
            { name: 'preproc_data.m', size: 6252 }
        ]
    },
    {
        name: 'zenodo: the files the entry names, in its order',
        source: {
            kind: 'zenodo',
            record: '6624726',
            files: ['picai_public_images_fold0.zip', 'LICENSE'],
            into: 'images',
            unpack: true
        },
        routes: { [`${ZENODO}6624726`]: recorded('zenodo/picai') },
        files: [
            { name: 'images/picai_public_images_fold0.zip', unpack: { strip: 0 } },
            { name: 'images/LICENSE' }
        ],
        count: 2
    },
    {
        name: 'zenodo refused: a file the entry names that the record does not hold',
        source: { kind: 'zenodo', record: '6624726', files: ['fold9.zip'] },
        routes: { [`${ZENODO}6624726`]: recorded('zenodo/picai') },
        refused: { refused: 'missing', source: 'zenodo', name: 'fold9.zip' }
    },
    {
        name: 'zenodo refused: a record answer with no files list',
        source: { kind: 'zenodo', record: '1199011' },
        routes: { [`${ZENODO}1199011`]: reply(200, '{"id": 1199011}') },
        refused: { refused: 'answer', source: 'zenodo' }
    },
    {
        name: "figshare: a collection's articles, a file a former article gave put under its id",
        source: { kind: 'figshare', collection: '988376' },
        routes: {
            [`${FIGSHARE}collections/988376/articles?page=1&page_size=100`]:
                recorded('figshare/collection'),
            [`${FIGSHARE}articles/*`]: (asked) => {
                const id = Number(asked.url.split('/').pop());
                const at = ARTICLES.indexOf(id);
                return article(id, at === 1 ? 'P1.zip' : `P${at + 1}.zip`);
            }
        },
        files: [
            {
                name: 'P1.zip',
                size: 1311767318,
                checksum: { kind: 'md5', value: '3a0f4b8f2b9e8f6c1d7e5a4c2b0d9e8f' },
                url: 'https://ndownloader.figshare.com/files/1631683'
            },
            { name: `${ARTICLES[1]}/P1.zip` },
            { name: 'P3.zip' }
        ],
        count: 12
    },
    {
        name: 'figshare: one article',
        source: { kind: 'figshare', article: '1119669' },
        routes: { [`${FIGSHARE}articles/1119669`]: recorded('figshare/article') },
        files: [{ name: 'P8.zip', size: 1311767318 }],
        count: 1
    },
    {
        name: 'figshare refused: a collection page that is no list of articles',
        source: { kind: 'figshare', collection: '988376' },
        routes: {
            [`${FIGSHARE}collections/988376/articles?page=1&page_size=100`]: reply(
                200,
                '{"message": "x"}'
            )
        },
        refused: { refused: 'answer', source: 'figshare' }
    },
    {
        name: 'dandi: the assets of every page, the picked ones with the sha256 of their metadata',
        source: {
            kind: 'dandi',
            dandiset: '000055',
            version: 'draft',
            assets: [
                'sub-01/sub-01_ses-7_behavior+ecephys.nwb',
                'sub-04/sub-04_ses-4_behavior+ecephys.nwb'
            ]
        },
        routes: {
            [`${DANDI}?page_size=100`]: recorded('dandi/assets-p1'),
            [`${DANDI}?page=2&page_size=20`]: recorded('dandi/assets-p2'),
            [`${DANDI}*`]: recorded('dandi/asset-metadata')
        },
        files: [
            {
                name: 'sub-01_ses-7_behavior+ecephys.nwb',
                size: 10273614013,
                checksum: {
                    kind: 'sha256',
                    value: '4e1b9d7c3a5f8e2b0d6c4a9f1e7b3d5c8a2f0e6b4d9c1a7f3e5b8d2c0a6f4e9b'
                },
                url: 'https://api.dandiarchive.org/api/assets/ccdc3ae1-e98d-4a17-93d8-5b7386689fe0/download/'
            },
            { name: 'sub-04_ses-4_behavior+ecephys.nwb', size: 11823659204 }
        ],
        count: 2
    },
    {
        name: 'dandi refused: a zarr asset, which is no file',
        source: { kind: 'dandi', dandiset: '000055', version: 'draft' },
        routes: {
            [`${DANDI}?page_size=100`]: () => {
                const page = jsonOf('dandi/assets-p1') as { results: Record<string, unknown>[] };
                page.results[0] = { ...page.results[0], zarr: 'f1e2d3c4' };
                return reply(200, JSON.stringify({ ...page, next: null }));
            }
        },
        refused: { refused: 'answer', source: 'dandi' }
    },
    {
        name: 'huggingface: every page by its Link header, the files the patterns match, lfs sha256',
        source: {
            kind: 'huggingface',
            repo: 'mathpluscode/ACDC',
            patterns: ['**/patient101_sax_ed.nii.gz', 'train/*/patient100_sax_ed.nii.gz']
        },
        routes: {
            [`${HF}?recursive=true&limit=100`]: recorded('huggingface/tree-p1'),
            [linkOf('huggingface/tree-p1')]: recorded('huggingface/tree-p2'),
            [linkOf('huggingface/tree-p2')]: () => recorded('huggingface/tree-p3')
        },
        files: [
            {
                name: 'test/patient101/patient101_sax_ed.nii.gz',
                size: 297467,
                checksum: {
                    kind: 'sha256',
                    value: 'caa500d2927b4e6991c9c9497f6304066f91e1987f07d8efba0d3f6c7c825b59'
                },
                url: 'https://huggingface.co/datasets/mathpluscode/ACDC/resolve/main/test/patient101/patient101_sax_ed.nii.gz'
            },
            { name: 'train/patient100/patient100_sax_ed.nii.gz', size: 512044 }
        ],
        count: 2
    },
    {
        name: 'huggingface refused: a pattern no file matches',
        source: { kind: 'huggingface', repo: 'mathpluscode/ACDC', patterns: ['*.parquet'] },
        routes: {
            [`${HF}?recursive=true&limit=100`]: reply(200, bodyOf('huggingface/tree-p3'))
        },
        refused: { refused: 'missing', source: 'huggingface', name: '*.parquet' }
    },
    {
        name: 'huggingface refused: a tree page that is no list',
        source: { kind: 'huggingface', repo: 'mathpluscode/ACDC' },
        routes: { [`${HF}?recursive=true&limit=100`]: reply(200, '{"error": "x"}') },
        refused: { refused: 'answer', source: 'huggingface' }
    },
    {
        name: 'stanford: the purl record, a file with its sha1',
        source: { kind: 'stanford', druid: 'zk881ps0522', files: ['ctmr.zip'] },
        routes: { 'https://purl.stanford.edu/zk881ps0522.json': recorded('stanford/purl') },
        files: [
            {
                name: 'ctmr.zip',
                size: 101834135,
                checksum: { kind: 'sha1', value: '0806c1414ad95248d8f879ed1324cd1192b9823d' },
                url: 'https://stacks.stanford.edu/file/druid:zk881ps0522/ctmr.zip'
            }
        ],
        count: 1
    },
    {
        name: 'stanford refused: a record with no structural part',
        source: { kind: 'stanford', druid: 'zk881ps0522' },
        routes: { 'https://purl.stanford.edu/zk881ps0522.json': reply(200, '{"label": "x"}') },
        refused: { refused: 'answer', source: 'stanford' }
    },
    {
        name: 'geo: the supplementary index, each picked file sized by a probe, no checksum',
        source: {
            kind: 'geo',
            accession: 'GSE180759',
            files: ['GSE180759_expression_matrix.csv.gz', 'GSE180759_annotation.txt.gz']
        },
        routes: {
            [GEO]: recorded('geo/listing'),
            [`${GEO}GSE180759_annotation.txt.gz`]: ranged(461420),
            [`${GEO}GSE180759_expression_matrix.csv.gz`]: ranged(118379522)
        },
        files: [
            {
                name: 'GSE180759_expression_matrix.csv.gz',
                size: 118379522,
                checksum: null,
                url: `${GEO}GSE180759_expression_matrix.csv.gz`
            },
            { name: 'GSE180759_annotation.txt.gz', size: 461420 }
        ],
        count: 2
    },
    {
        name: 'geo refused: a page that is no folder index',
        source: { kind: 'geo', accession: 'GSE180759', files: ['GSE180759_annotation.txt.gz'] },
        routes: { [GEO]: reply(200, '<html><title>Error</title></html>') },
        refused: { refused: 'answer', source: 'geo' }
    },
    {
        name: 'tcia: each series one zip of no stated size',
        source: { kind: 'tcia', collection: 'CBIS-DDSM' },
        routes: { [`${TCIA}getSeries?Collection=CBIS-DDSM&format=json`]: recorded('tcia/series') },
        files: [
            {
                name: '1.3.6.1.4.1.9590.100.1.2.342386194811267636608694132590482924515.zip',
                size: null,
                checksum: null,
                url: `${TCIA}getImage?SeriesInstanceUID=1.3.6.1.4.1.9590.100.1.2.342386194811267636608694132590482924515`
            }
        ],
        count: 1
    },
    {
        name: 'tcia refused: a series answer that is no list',
        source: { kind: 'tcia', collection: 'CBIS-DDSM' },
        routes: { [`${TCIA}getSeries?Collection=CBIS-DDSM&format=json`]: reply(200, '{}') },
        refused: { refused: 'answer', source: 'tcia' }
    },
    {
        name: 'kaggle: the file list checked, then the one zip Kaggle sends, with the row',
        source: { kind: 'kaggle', dataset: 'awsaf49/brats20-dataset-training-validation' },
        downloads: [KAGGLE_ROW],
        routes: {
            [`${KAGGLE}list/awsaf49/brats20-dataset-training-validation`]: recorded('kaggle/list'),
            [`${KAGGLE}download/awsaf49/brats20-dataset-training-validation`]: ranged(4466930789)
        },
        files: [
            {
                name: 'brats20-dataset-training-validation.zip',
                size: 4466930789,
                checksum: null,
                url: `${KAGGLE}download/awsaf49/brats20-dataset-training-validation`,
                service: 'kaggle'
            }
        ],
        count: 1,
        header: ['authorization', `Basic ${Buffer.from('reader:key').toString('base64')}`]
    },
    {
        name: 'kaggle refused: no row, before any request',
        source: { kind: 'kaggle', dataset: 'awsaf49/brats20-dataset-training-validation' },
        routes: {},
        refused: { refused: 'access', source: 'kaggle' }
    },
    {
        name: 'kaggle refused: a file list that lists no file',
        source: { kind: 'kaggle', dataset: 'awsaf49/brats20-dataset-training-validation' },
        downloads: [KAGGLE_ROW],
        routes: {
            [`${KAGGLE}list/awsaf49/brats20-dataset-training-validation`]: reply(
                200,
                '{"datasetFiles": []}'
            )
        },
        refused: { refused: 'answer', source: 'kaggle' }
    },
    {
        name: 'synapse: a file entity and a folder read a page at a time, with the token',
        source: { kind: 'synapse', ids: ['syn51514110', 'syn51514132'] },
        downloads: [SYNAPSE_ROW],
        routes: {
            [`${SYNAPSE}entity/syn51514110`]: recorded('synapse/entity-file'),
            [`${SYNAPSE}entity/syn51514132`]: recorded('synapse/entity-folder'),
            [`${SYNAPSE}entity/children`]: children,
            [`${SYNAPSE}entity/*`]: handles
        },
        files: [
            {
                name: 'BraTS2023_GLI_Training.zip',
                size: 17485236101,
                checksum: { kind: 'md5', value: '7c9e1a3b5d7f9a1c3e5b7d9f1a3c5e7b' },
                url: `${SYNAPSE}entity/syn51514110/file`,
                service: 'synapse'
            },
            { name: 'labels.csv', size: 2048, url: `${SYNAPSE}entity/syn51514140/file` }
        ],
        count: 2,
        header: ['authorization', 'Bearer token']
    },
    {
        name: 'synapse refused: no row, before any request',
        source: { kind: 'synapse', ids: ['syn51514110'] },
        routes: {},
        refused: { refused: 'access', source: 'synapse' }
    },
    {
        name: 'synapse refused: an entity answer that is none',
        source: { kind: 'synapse', ids: ['syn51514110'] },
        downloads: [SYNAPSE_ROW],
        routes: { [`${SYNAPSE}entity/syn51514110`]: reply(200, 'not json') },
        refused: { refused: 'answer', source: 'synapse' }
    },
    {
        name: 'url: each address sized by a probe, named by its last part or the entry, its sha256',
        source: {
            kind: 'url',
            urls: [
                {
                    url: 'https://example.org/sets/labels.csv',
                    sha256: 'AB12CD34EF56AB12CD34EF56AB12CD34EF56AB12CD34EF56AB12CD34EF56AB12'
                },
                { url: 'https://example.org/get?id=7', name: 'cells.h5ad' }
            ]
        },
        routes: {
            'https://example.org/sets/labels.csv': ranged(300),
            'https://example.org/get?id=7': ranged(9000)
        },
        files: [
            {
                name: 'labels.csv',
                size: 300,
                checksum: {
                    kind: 'sha256',
                    value: 'ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12cd34ef56ab12'
                }
            },
            { name: 'cells.h5ad', size: 9000, checksum: null }
        ],
        count: 2
    },
    {
        name: 'url: a row with an md5 in place of a sha256 lists the file with its md5',
        source: {
            kind: 'url',
            urls: [
                {
                    url: 'https://darus.example/api/access/datafile/133017',
                    name: '2D_diff-react_NA_NA.h5',
                    md5: 'B8D0B86064193195DDC30C33BE5DC949'
                }
            ]
        },
        routes: { 'https://darus.example/api/access/datafile/133017': ranged(4000) },
        files: [
            {
                name: '2D_diff-react_NA_NA.h5',
                size: 4000,
                checksum: { kind: 'md5', value: 'b8d0b86064193195ddc30c33be5dc949' }
            }
        ],
        count: 1
    },
    {
        name: 'url refused: a probe that answers 404 names the host',
        source: { kind: 'url', urls: [{ url: 'https://example.org/gone.csv' }] },
        routes: {},
        refused: { refused: 'status', source: 'example.org', status: 404 }
    },
    {
        name: 'url refused: an address that is not https',
        source: { kind: 'url', urls: [{ url: 'http://example.org/a.csv' }] },
        routes: {},
        refused: { refused: 'answer', source: 'url' }
    }
];

/**
 * The route's GET of a dataset with the row's one source on this Mac, over a home of the case's
 * own: its plan's rows, or the refusal of the listing, and the requests of the listing. The access
 * login requests the GET makes first are counted by asking the same routes for the access alone,
 * and left out.
 */
async function listedBy(row: Row): Promise<{ answer: unknown; asked: Asked[] }> {
    const downloads = row.downloads ?? [];
    const before = answering(row.routes);
    await accessOf([row.source], { fetch: before.fetch, downloads });
    const { fetch, asked } = answering(row.routes);
    const local = localDeps(scratchDir('oculus-recover-sources-'), new Map());
    const target = {
        ...targetOf(datasetOf([row.source]), fetch, local),
        downloads: () => downloads
    };
    const query = new URLSearchParams({ target: 'mac', hub: 'research-hub', key: 'mitdb' });
    const body = (await (
        await handleRecoverState(recoverRequest(query), target)
    ).json()) as RecoverState;
    return { answer: body.refusal ?? body.plan?.rows, asked: asked.slice(before.asked.length) };
}

describe('the Recover source readers', () => {
    it.each(ROWS)('$name', async (row) => {
        const { answer, asked } = await listedBy(row);
        if (row.refused !== undefined) {
            expect(answer).toEqual(row.refused);
            return;
        }
        expect(Array.isArray(answer)).toBe(true);
        const files = answer as RecoverFile[];
        if (row.count !== undefined) expect(files).toHaveLength(row.count);
        expect(files.slice(0, row.files?.length ?? 0)).toMatchObject(row.files ?? []);
        if (row.header !== undefined) {
            const [key, value] = row.header;
            expect(asked.map((one) => one.headers[key])).toEqual(asked.map(() => value));
        } else {
            expect(asked.every((one) => one.headers.authorization === undefined)).toBe(true);
        }
    });
});
