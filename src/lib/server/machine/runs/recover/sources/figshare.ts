// Layer 2, server. The files of a figshare source: a collection's articles, read a page of a
// hundred at a time until a page holds fewer, then each article's files with their size, md5 and
// download address; an `article` source reads that one article. A file name a former article of
// the collection already gave is put under a folder named by its article's id, so no two files of
// the source share a name.

import { z } from 'zod';
import type { RecoverSource } from '../../../../../data/model/index.ts';
import {
    getJson,
    httpsShape,
    isRefusal,
    picked,
    type ListAnswer,
    type ListDeps,
    type Listed,
    type Refusal
} from '../files.ts';

type Source = Extract<RecoverSource, { kind: 'figshare' }>;

const SOURCE = 'figshare';

const API = 'https://api.figshare.com/v2';

/** The size of a page of a collection's articles. */
const PAGE = 100;

/** A page of a collection's articles: each article's id. */
const articlesShape = z.array(z.object({ id: z.number().int() }));

/** An article's files. */
const articleShape = z.object({
    files: z.array(
        z.object({
            name: z.string().min(1),
            size: z.number().int().min(0),
            computed_md5: z.string(),
            download_url: httpsShape
        })
    )
});

/** The ids of a collection's articles, or the refusal naming figshare. */
async function articleIds(collection: string, deps: ListDeps): Promise<number[] | Refusal> {
    const ids: number[] = [];
    for (let page = 1; ; page += 1) {
        const url = `${API}/collections/${encodeURIComponent(collection)}/articles?page=${page}&page_size=${PAGE}`;
        const read = await getJson(deps, SOURCE, url);
        if (isRefusal(read)) return read;
        const articles = articlesShape.safeParse(read.body);
        if (!articles.success) return { refused: 'answer', source: SOURCE };
        ids.push(...articles.data.map((one) => one.id));
        if (articles.data.length < PAGE) return ids;
    }
}

/** The files of the source, or the refusal naming figshare. */
export async function listFigshare(source: Source, deps: ListDeps): Promise<ListAnswer> {
    let ids: number[];
    if (source.article !== undefined) {
        if (!/^\d+$/.test(source.article)) return { refused: 'answer', source: SOURCE };
        ids = [Number(source.article)];
    } else if (source.collection !== undefined) {
        const found = await articleIds(source.collection, deps);
        if (isRefusal(found)) return found;
        ids = found;
    } else {
        return { refused: 'answer', source: SOURCE };
    }
    const listed: Listed[] = [];
    const taken = new Set<string>();
    for (const id of ids) {
        const read = await getJson(deps, SOURCE, `${API}/articles/${id}`);
        if (isRefusal(read)) return read;
        const article = articleShape.safeParse(read.body);
        if (!article.success) return { refused: 'answer', source: SOURCE };
        for (const one of article.data.files) {
            const name = taken.has(one.name) ? `${id}/${one.name}` : one.name;
            taken.add(name);
            listed.push({
                name,
                size: one.size,
                checksum: /^[0-9a-f]{32}$/.test(one.computed_md5)
                    ? { kind: 'md5', value: one.computed_md5 }
                    : null,
                url: one.download_url
            });
        }
    }
    return picked(listed, source.files, SOURCE);
}
