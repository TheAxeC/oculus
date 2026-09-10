// Layer 2, server. One project document, read from disk and rendered to HTML.
//
// routes/api/docs/+server.ts is the endpoint and holds nothing but its GET, since a route module may
// export only its verbs; everything the request does is here. DESIGN.md's wire model keeps documents
// out of the snapshot ("documents on demand"), so this is the one way a README reaches the page.
//
// The path read is the reader's, never the request's: the id names a manifest readManifests already
// found under the hub's own scan directories, the name is one of the four literals below, and the
// join of the two is checked against the hub again before the file is opened. A request naming
// anything else is answered 404 and nothing is opened.
//
// The HTML is NOT sanitised. The hub's Markdown is the owner's own files, read from the owner's own
// disk and shown to the owner alone; a sanitiser here would only be a second parser to keep honest.
// A hub holding a document somebody else wrote would need one.

import { join, resolve, sep } from 'node:path';
import { marked } from 'marked';
import { PROJECT_DOCS, isFinding, readDoc } from '../data/sources/docs.ts';
import { readManifests } from '../data/sources/manifests.ts';
import { sameOrigin } from './auth.ts';
import type { PortfolioConfig } from '../data/model.ts';

/** What a document read needs to know: which hub it is in, and what its scan rules are. */
export type DocTarget = { hub: string; config: PortfolioConfig };

/**
 * The names this route serves: the Markdown of PROJECT_DOCS, which is the four names the wire model
 * calls for. The other two entries of that list are a PDF and a LaTeX source, and neither is
 * something `marked` can render, so both are refused here rather than answered with rubbish.
 */
export const MARKDOWN_DOCS = PROJECT_DOCS.filter((name) => name.endsWith('.md'));

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

/**
 * One document of one project, rendered. Every refusal is a 404 naming what was wrong: a name this
 * route does not serve, an id the reader does not know, a path that would leave the hub, and a file
 * that is not there or whose frontmatter does not parse.
 */
export function renderDoc(into: DocTarget, id: string, name: string): Response {
    if (!MARKDOWN_DOCS.includes(name)) {
        return json(404, { error: `not a document this route serves: ${name}` });
    }
    const { manifests } = readManifests(into.hub, into.config.scan);
    const manifest = manifests.find((one) => one.id === id);
    if (manifest === undefined) return json(404, { error: `no project with the id ${id}` });

    const path = join(into.hub, manifest.folder, name);
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
