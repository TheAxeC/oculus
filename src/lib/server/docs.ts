// Layer 2, server. One project document, read from disk and rendered to HTML.
//
// routes/api/docs/+server.ts is the endpoint and holds nothing but its GET, since a route module may
// export only its verbs; everything the request does is here. DESIGN.md's wire model keeps documents
// out of the snapshot ("documents on demand"), so this is the one way a README reaches the page.
//
// The path read is the reader's, never the request's: the id names a project the server already
// holds in its portfolio, the name is one of the Markdown literals below, and the join of the two is
// checked against the hub again before the file is opened. A request naming anything else is
// answered 404 and nothing is opened.
//
// The folder comes from the snapshot the request carries, so one document costs one file read. A
// process that has published no portfolio yet has no snapshot to ask, and the folder is then the
// project's own folder under the hub's scan directories, found by the id it is named after.
//
// The HTML is rendered here and filtered on the page: ui/html.ts's sanitise runs over every body
// this route answers with, before views/Project.svelte draws it. One filter, at the one place the
// markup becomes a document, so this route stays the reader of a file and nothing else.

import { existsSync, readdirSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { marked } from 'marked';
import { PROJECT_DOCS, isFinding, readDoc } from '../data/sources/docs.ts';
import { sameOrigin } from './auth.ts';
import type { PortfolioConfig, Project } from '../data/model.ts';

/**
 * What a document read needs to know: which hub it is in, what its scan rules are, and how to reach
 * one project of the portfolio the server holds. The route passes the reader of its own locals; a
 * target without one falls back to the scan rules alone.
 */
export type DocTarget = {
    hub: string;
    config: PortfolioConfig;
    project?: (id: string) => Project | null;
};

/**
 * The names this route serves: the Markdown of PROJECT_DOCS. The other entries of that list are a
 * PDF and a LaTeX source, and neither is something `marked` can render, so both are refused here
 * rather than answered with rubbish.
 */
export const MARKDOWN_DOCS = PROJECT_DOCS.map((doc) => doc.name).filter((name) =>
    name.endsWith('.md')
);

/** What the endpoint answers with: the rendered document, and the frontmatter block it had. */
export type DocAnswer = { html: string; frontmatter: Record<string, unknown> | null };

/** A document is asked for again whenever the tab is shown, so nothing here is ever cached. */
const CACHE = 'no-store';

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json', 'cache-control': CACHE }
    });
}

/** Whether a path is the folder itself or sits inside it. */
function inside(path: string, folder: string): boolean {
    const full = resolve(path);
    const root = resolve(folder);
    return full === root || full.startsWith(root + sep);
}

/** Folders a project never sits under: a project's own deposit and its attic. */
const NEVER_DESCEND = ['code', 'attic'];

/** Whether a folder name may be joined to a scan directory: one segment, and not a walk upwards. */
function isFolderName(id: string): boolean {
    return id !== '' && !id.includes('/') && !id.includes(sep) && id !== '.' && id !== '..';
}

/**
 * The folder named `id` under one scan directory, at any depth, nearest first. A directory without
 * a project.yml in it is not a project, so the walk goes on past it.
 */
function under(hub: string, dir: string, id: string): string | null {
    const queue = [dir];
    while (queue.length > 0) {
        const at = queue.shift() as string;
        const here = join(at, id);
        if (existsSync(join(hub, here, 'project.yml'))) return here;
        let held;
        try {
            held = readdirSync(join(hub, at), { withFileTypes: true });
        } catch {
            continue;
        }
        for (const one of held) {
            if (!one.isDirectory()) continue;
            if (one.name.startsWith('.') || NEVER_DESCEND.includes(one.name)) continue;
            queue.push(join(at, one.name));
        }
    }
    return null;
}

/**
 * The project's folder relative to the hub: the one the snapshot holds, or the folder the id names
 * under the scan rules when the server has published no portfolio yet. A flat rule holds its
 * projects directly; a nested one is walked, since its categories are folders of their own.
 */
function folderOf(into: DocTarget, id: string): string | null {
    const held = into.project?.(id) ?? null;
    if (held !== null && held.folder !== '') return held.folder;
    if (!isFolderName(id)) return null;
    for (const rule of into.config.scan) {
        const found =
            rule.nested === true
                ? under(into.hub, rule.dir, id)
                : existsSync(join(into.hub, rule.dir, id, 'project.yml'))
                  ? join(rule.dir, id)
                  : null;
        if (found !== null) return found;
    }
    return null;
}

/**
 * One document of one project, rendered. Every refusal is a 404 naming what was wrong: a name this
 * route does not serve, an id the reader does not know, a path that would leave the hub, and a file
 * that is not there or whose frontmatter does not parse.
 */
export function renderDoc(into: DocTarget, id: string, name: string): Response {
    if (!MARKDOWN_DOCS.includes(name)) {
        return json(404, { error: `not a document this route serves: ${name}` });
    }
    const folder = folderOf(into, id);
    if (folder === null) return json(404, { error: `no project with the id ${id}` });

    const path = join(into.hub, folder, name);
    if (!inside(path, into.hub)) return json(404, { error: 'the document is not inside the hub' });

    const read = readDoc(path);
    if (isFinding(read)) return json(404, { error: read.message });

    const answer: DocAnswer = {
        html: marked.parse(read.text, { async: false }),
        frontmatter: read.frontmatter
    };
    return json(200, answer);
}

/** The whole endpoint: refuse a request from another origin, or answer the document it names. */
export function handleDocs(request: Request, into: DocTarget): Response {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    const url = new URL(request.url);
    return renderDoc(
        into,
        url.searchParams.get('project') ?? '',
        url.searchParams.get('name') ?? ''
    );
}
