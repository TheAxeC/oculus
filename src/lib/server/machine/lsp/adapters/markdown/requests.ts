// Layer 2, server. The requests the Markdown server makes of its client, answered in the oculus
// process: it runs with no read access beyond its own packages, so it asks for the parse of a text,
// the bytes of a file, the kind of a path, the entries of a folder, the Markdown files of the
// workspace, and watchers for the paths its links lead to. Every path is judged first by places.ts:
// only a file in the server's root that is not withheld is read, listed or watched, and a file over
// the text limit is refused. A watcher is followed by the held server (held/requests/followed.ts)
// and each change under it is asked of the server as `markdown/fs/watcher/onChange`.
//
// A server that takes the notice of a created file only for a file it already holds, and builds its
// table of the workspace's links once, at the first request that spans the workspace, would miss a
// file created or moved after that. `introduceMarkdown` words the request that makes it read such
// a file through `markdown/fs/readFile`, after which the notice is taken.

import { readFile, stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import MarkdownIt from 'markdown-it';
import { TEXT_LIMIT } from '../../../../../data/file-ops.ts';
import { FRONT_MATTER } from '../../../../../data/prose/markdown/note-links.ts';
import type { Introduction } from '../asks.ts';
import type { ServerAsk } from '../../servers.ts';
import { listing, markdownFiles, reachable, statOf } from './places.ts';

/**
 * The tokens of a text, as the server reads them; raw HTML is parsed as VS Code's preview does, and
 * a YAML front matter block at the top (`FRONT_MATTER`, a note's `tags:` among it) is one hidden
 * `front_matter` token, as VS Code's Markdown engine reads it, so its last line is no heading.
 */
const parser = new MarkdownIt({ html: true });
parser.block.ruler.before('table', 'front_matter', (state, start, _end, silent) => {
    if (start !== 0 || state.blkIndent !== 0) return false;
    const found = FRONT_MATTER.exec(state.src);
    if (found === null) return false;
    if (silent) return true;
    const lines = found[0].replace(/\r?\n$/, '').split(/\r?\n/).length;
    const token = state.push('front_matter', '', 0);
    token.hidden = true;
    token.block = true;
    token.markup = '---';
    token.content = found[0];
    token.map = [0, lines];
    state.line = lines;
    return true;
});

/** A non-empty text of a request's parameter, or undefined. */
function textOf(value: unknown): string | undefined {
    return typeof value === 'string' && value !== '' ? value : undefined;
}

/** The parameters of a request, as a record. */
function paramsOf(params: unknown): Record<string, unknown> {
    return typeof params === 'object' && params !== null ? (params as Record<string, unknown>) : {};
}

/** The bytes of a served file, refused when it is over the text limit before they are read. */
async function bytesOf(uri: unknown, ask: ServerAsk): Promise<Buffer> {
    const real = reachable(uri, ask);
    if (real === null) throw new Error('the file is not one the server may read');
    if ((await stat(real)).size > TEXT_LIMIT) throw new Error('the file is too large to read');
    const bytes = await readFile(real);
    if (bytes.length > TEXT_LIMIT) throw new Error('the file is too large to read');
    return bytes;
}

/** The handlers of the Markdown server's requests, for files with these extensions. */
export function markdownRequests(
    extensions: () => string[]
): Readonly<Record<string, (params: unknown, ask: ServerAsk) => unknown>> {
    return {
        'markdown/parse': async (params, ask) => {
            const { uri, text } = paramsOf(params);
            const source = typeof text === 'string' ? text : (await bytesOf(uri, ask)).toString();
            return parser.parse(source, {});
        },
        'markdown/fs/readFile': async (params, ask) => {
            ask.reading?.(paramsOf(params).uri);
            return [...(await bytesOf(paramsOf(params).uri, ask))];
        },
        'markdown/fs/stat': async (params, ask) => {
            const info = await statOf(paramsOf(params).uri, ask);
            return info === null ? null : { isDirectory: info.isDirectory };
        },
        'markdown/fs/readDirectory': (params, ask) => listing(paramsOf(params).uri, ask),
        'markdown/findMarkdownFilesInWorkspace': async (_params, ask) =>
            (await markdownFiles(ask, extensions())).map((real) => pathToFileURL(real).href),
        'markdown/fs/watcher/create': (params, ask) => {
            const { id, uri, watchParentDirs } = paramsOf(params);
            const real = reachable(uri, ask);
            const key = textOf(id) ?? (typeof id === 'number' ? String(id) : undefined);
            if (real === null || key === undefined) return null;
            ask.follow(key, real, watchParentDirs === true, (changed, kind) => ({
                method: 'markdown/fs/watcher/onChange',
                params: { id, uri: pathToFileURL(changed).href, kind }
            }));
            return null;
        },
        'markdown/fs/watcher/delete': (params, ask) => {
            const { id } = paramsOf(params);
            const key = textOf(id) ?? (typeof id === 'number' ? String(id) : undefined);
            if (key !== undefined) ask.unfollow(key);
            return null;
        }
    };
}

/** The type of a created file in `workspace/didChangeWatchedFiles`. */
const CREATED = 1;

/** The fragment the question is asked with: it names nothing, so the answer is of no use. */
const PROBE = '#oculus-read';

/**
 * The questions that make the server read each created file of the changes whose ending is a
 * Markdown extension; other changes and other files need none.
 */
export function introduceMarkdown(
    changes: readonly { uri: string; type: number }[],
    extensions: readonly string[]
): Introduction[] {
    const asks: Introduction[] = [];
    for (const change of changes) {
        if (change.type !== CREATED || !change.uri.startsWith('file://')) continue;
        const ending = extname(fileURLToPath(change.uri)).slice(1).toLowerCase();
        if (!extensions.some((one) => one.toLowerCase() === ending)) continue;
        asks.push({
            method: 'markdown/resolveLinkTarget',
            params: { linkText: PROBE, uri: change.uri }
        });
    }
    return asks;
}
