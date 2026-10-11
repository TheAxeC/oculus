// Layer 2, server. The /api/app-document route: the bytes of the file a custom editor of an app was
// opened on, read and replaced. GET reads them with the hash a save is later compared with; POST
// replaces them and carries the write token.
//
// An app reaches a file here only as `open({ file })` lets it (reach/open.ts): the app must be
// approved, enabled and declare a custom editor, and the file passes the same checks, so a closed
// path, a folder `closed_paths` names, a private folder and, for a root app, a root other than its
// own answer `closed`, and a file outside every shown root answers `missing`. The save then has the
// source save's checks (files/source-bytes.ts). Every answer is 200 with `{ ok: true, ... }` or
// `{ ok: false, word }`, the word being the refusal the frame is rejected with. The bytes travel as
// base64 text, and a file above the apps' size limit is `too_large`.

import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { appActive } from '../../../../data/helpers/files/apps/apps.ts';
import { tokenedBody } from '../../../core/auth.ts';
import { readBytes, saveBytes } from '../../../files/source-bytes.ts';
import { checkOpen } from '../reach/open.ts';
import { appById, type HeldApp } from '../read/held.ts';
import { NO_STORE, refuse, type AppsRouteOptions } from './routes.ts';

const saveShape = z.object({
    app: z.string().min(1),
    root: z.string().min(1),
    path: z.string().min(1),
    base: z.string().regex(/^[0-9a-f]{64}$/),
    content: z.string()
});

const refusal = (word: string): Response => json({ ok: false, word }, { headers: NO_STORE });

/** The app of a request when it may reach a file as a custom editor, else the refusal. */
function editorOf(
    options: AppsRouteOptions,
    ask: { app: string; root: string; path: string }
): HeldApp | Response {
    const app = appById(options.apps.held(), ask.app);
    if (app === undefined) return refusal('missing');
    if (!appActive(app.row)) return refusal('closed');
    if (app.row.contributes.customEditors.length === 0) return refusal('not_declared');
    const answer = checkOpen(
        { app, root: ask.root, path: ask.path },
        {
            roots: options.roots(),
            configDir: options.configDir,
            closedPaths: options.closedPaths(),
            privateReal: options.privateReal(),
            fs: options.fs
        }
    );
    return answer === 'ok' ? app : refusal(answer);
}

/** GET /api/app-document?app=&root=&path=: the file's bytes in base64 and their hash. */
export function handleDocumentGet(request: Request, options: AppsRouteOptions): Response {
    const url = new URL(request.url);
    const given = (name: string): string => {
        const all = url.searchParams.getAll(name);
        return all.length === 1 ? all[0] : '';
    };
    const ask = { app: given('app'), root: given('root'), path: given('path') };
    if (ask.app === '' || ask.root === '' || ask.path === '') {
        return refuse('app, root and path must each be given once', 400);
    }
    const found = editorOf(options, ask);
    if (found instanceof Response) return found;
    const read = readBytes(options.roots(), ask.root, ask.path, options.limits().bytes);
    if (!read.ok) return refusal(read.word);
    return json(
        { ok: true, content: read.bytes.toString('base64'), hash: read.hash },
        { headers: NO_STORE }
    );
}

/** POST /api/app-document: replace the file's bytes; the answer carries the hash now on disk. */
export async function handleDocumentPost(
    request: Request,
    token: string,
    options: AppsRouteOptions
): Promise<Response> {
    const read = await tokenedBody(request, token, { headers: NO_STORE, text: options.text });
    if (read instanceof Response) return read;
    const body = saveShape.safeParse(read.body);
    if (!body.success) return refuse('app, root, path, base and content are required', 400);
    const found = editorOf(options, body.data);
    if (found instanceof Response) return found;
    const bytes = Buffer.from(body.data.content, 'base64');
    if (bytes.length > options.limits().bytes) return refusal('too_large');
    const saved = saveBytes(
        options.roots(),
        { root: body.data.root, path: body.data.path, bytes, base: body.data.base },
        options.history()
    );
    if (!saved.ok) return refusal(saved.word);
    return json({ ok: true, hash: saved.hash, kept: saved.unkept === null }, { headers: NO_STORE });
}
