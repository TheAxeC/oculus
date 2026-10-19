// Layer 2, server. The files of a Hugging Face dataset source: the repository's tree, read a page
// at a time by the `Link` header's `rel="next"` address, each file with its size and, for a file
// kept in large-file storage, the sha256 of its content (`lfs.oid`). The entry's `patterns` pick
// the files: `*` and `?` match inside one folder level, `**/` any number of folders; a pattern no
// file matches is the refusal `missing` naming it.

import { z } from 'zod';
import type { RecoverSource } from '../../../../../data/model/index.ts';
import { getJson, isRefusal, type ListAnswer, type ListDeps, type Listed } from '../files.ts';

type Source = Extract<RecoverSource, { kind: 'huggingface' }>;

const SOURCE = 'huggingface';

/** A repository named `<owner>/<name>`. */
const REPO = /^[A-Za-z0-9][A-Za-z0-9._-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** A page of the tree: folders and files, a file with its size and its large-file record. */
const pageShape = z.array(
    z.object({
        type: z.string(),
        path: z.string().min(1),
        size: z.number().int().min(0),
        lfs: z.object({ oid: z.string() }).optional()
    })
);

/** The address `rel="next"` of a `Link` header, or null. */
function nextLink(header: string | null): string | null {
    if (header === null) return null;
    for (const part of header.split(',')) {
        const found = /<([^>]+)>\s*;\s*rel="?next"?/.exec(part);
        if (found !== null) return found[1];
    }
    return null;
}

/** A pattern as a test of a whole path. */
function globTest(pattern: string): RegExp {
    let out = '';
    for (let at = 0; at < pattern.length; at += 1) {
        const char = pattern[at];
        if (pattern.startsWith('**/', at)) {
            out += '(?:[^/]+/)*';
            at += 2;
        } else if (char === '*') out += '[^/]*';
        else if (char === '?') out += '[^/]';
        else out += char.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
    return new RegExp(`^${out}$`);
}

/** The files of the source, or the refusal naming Hugging Face. */
export async function listHuggingface(source: Source, deps: ListDeps): Promise<ListAnswer> {
    if (!REPO.test(source.repo)) return { refused: 'answer', source: SOURCE };
    const tests = (source.patterns ?? []).map(globTest);
    const listed: Listed[] = [];
    let url: string | null =
        `https://huggingface.co/api/datasets/${source.repo}/tree/main?recursive=true&limit=100`;
    while (url !== null) {
        const read = await getJson(deps, SOURCE, url);
        if (isRefusal(read)) return read;
        const page = pageShape.safeParse(read.body);
        if (!page.success) return { refused: 'answer', source: SOURCE };
        for (const one of page.data) {
            if (one.type !== 'file') continue;
            if (tests.length > 0 && !tests.some((test) => test.test(one.path))) continue;
            const sha256 = one.lfs?.oid;
            listed.push({
                name: one.path,
                size: one.size,
                checksum:
                    sha256 !== undefined && /^[0-9a-f]{64}$/.test(sha256)
                        ? { kind: 'sha256', value: sha256 }
                        : null,
                url: `https://huggingface.co/datasets/${source.repo}/resolve/main/${one.path
                    .split('/')
                    .map(encodeURIComponent)
                    .join('/')}`
            });
        }
        url = nextLink(read.answer.headers.get('link'));
        if (url !== null && !url.startsWith('https://huggingface.co/')) {
            return { refused: 'answer', source: SOURCE };
        }
    }
    const unmatched = (source.patterns ?? []).find(
        (_pattern, at) => !listed.some((one) => tests[at].test(one.name))
    );
    return unmatched === undefined
        ? listed
        : { refused: 'missing', source: SOURCE, name: unmatched };
}
