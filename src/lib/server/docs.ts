// Layer 2, server. One Markdown document, read from disk and rendered to HTML: a project's, the
// hub's own, or oculus's manual.
//
// routes/api/docs/+server.ts is the endpoint and holds nothing but its GET, since a route module may
// export only its verbs; everything the request does is here. DESIGN.md's wire model keeps documents
// out of the snapshot ("documents on demand"), so this is the one way a README reaches the page.
//
// A request names one of three things. `project` with `name` is one of that project's own documents;
// `hub` is a path relative to the research hub, which is what the `docs:` list of config/layout.yml
// offers in the rail; `manual` is the engine's own HELP.md and takes no path. Everything else is a
// 404 naming what was wrong.
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

import { existsSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { Marked } from 'marked';
import { configDir } from '../data/sources/config.ts';
import { PROJECT_DOCS, isFinding, readDoc } from '../data/sources/docs.ts';
import { PRESENT_DOC } from '../data/sources/present.ts';
import { sameOrigin } from './auth.ts';
import { HUB_ROOT } from './files.ts';
import type { Finding, PortfolioConfig, Project } from '../data/model.ts';

/**
 * What a document read needs to know: which hub it is in, what its scan rules are, and how to reach
 * one project of the portfolio the server holds. The route passes the reader of its own locals; a
 * target without one falls back to the scan rules alone.
 */
export type DocTarget = {
    hub: string;
    /** The engine directory, which is where the manual this route serves sits. */
    engine: string;
    config: PortfolioConfig;
    project?: (id: string) => Project | null;
};

/**
 * The names this route serves: the Markdown of PROJECT_DOCS, and the PRESENT.md beside them. The
 * other entries of that list are a PDF and a LaTeX source, and neither is something `marked` can
 * render, so both are refused here rather than answered with rubbish.
 *
 * PRESENT.md is not one of PROJECT_DOCS: the card's document row reports on the four a project is
 * measured by and PRESENT.md is not one of them, while the project tab draws its narrative like any
 * other document. readDoc splits the front matter off, so what this answers with is the body alone.
 */
export const MARKDOWN_DOCS = [
    ...PROJECT_DOCS.map((doc) => doc.name).filter((name) => name.endsWith('.md')),
    PRESENT_DOC
];

/** What the endpoint answers with: the rendered document, and the frontmatter block it had. */
export type DocAnswer = { html: string; frontmatter: Record<string, unknown> | null };

/** A document is asked for again whenever the tab is shown, so nothing here is ever cached. */
const CACHE = 'no-store';

/** The query parameter that asks for the manual instead of a project's or the hub's document. */
export const MANUAL_PARAM = 'manual';

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

/** The real path of a file or directory, or null when there is nothing there to resolve. */
function real(path: string): string | null {
    try {
        return realpathSync(path);
    } catch {
        return null;
    }
}

/**
 * Whether a path leaves the hub: as it is written, or once it and the hub are resolved, so a
 * symbolic link inside the hub pointing out of it is refused rather than followed. A path with
 * nothing at it resolves to nothing and is not an escape; the read after this reports it as the
 * document that is not there.
 */
function escapes(path: string, hub: string): boolean {
    if (!inside(path, hub)) return true;
    const full = real(path);
    if (full === null) return false;
    return !inside(full, real(hub) ?? hub);
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
    for (let at = queue.shift(); at !== undefined; at = queue.shift()) {
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

/** Whether an address is one the browser resolves itself: a scheme, a page anchor, or an absolute path. */
const ABSOLUTE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i;

/** The file route's address for one path under one root, each segment escaped on its own. */
function routeUrl(root: string, path: string): string {
    const parts = path
        .split(/[\\/]/)
        .filter((one) => one !== '' && one !== '.')
        .map((one) => encodeURIComponent(one));
    return `/api/file/${encodeURIComponent(root)}/${parts.join('/')}`;
}

/**
 * Whether a path joined against a folder climbs out of the root it was joined against. `join` has
 * already normalised what it could, so any `..` left in it is one the folder could not absorb.
 */
function climbs(path: string): boolean {
    return path.split(/[\\/]/).includes('..');
}

/** An attribute value as markup, so a title or an alt carrying a quote stays inside its attribute. */
function attribute(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * One document's Markdown as HTML, with a figure beside it drawn through the file route: a relative
 * image source is resolved against the document's own folder and addressed under `base.root`, which
 * is the one way a `<img src="figures/one.png">` in a hub document reaches the reader. An address the
 * browser resolves on its own (a scheme, an absolute path) is left as it was written, and a document
 * with no folder to resolve against (the engine's own manual) keeps every source it carries.
 *
 * The renderer is this call's own `Marked`, never `marked.use`, so nothing here changes how any other
 * reader of the package renders.
 */
export function renderMarkdown(
    text: string,
    base: { root: string; folder: string } | null
): string {
    if (base === null) return new Marked().parse(text, { async: false });
    const reader = new Marked({
        renderer: {
            image({
                href,
                title,
                text: alt
            }: {
                href: string;
                title: string | null;
                text: string;
            }) {
                // A source that leaves the document's own root is left as the author wrote it,
                // since the file route serves nothing outside a root; the browser then resolves it
                // against the page.
                const joined = join(base.folder, href);
                const src =
                    ABSOLUTE.test(href) || climbs(joined) ? href : routeUrl(base.root, joined);
                const name = title === null ? '' : ` title="${attribute(title)}"`;
                return `<img src="${attribute(src)}" alt="${attribute(alt)}"${name}>`;
            }
        }
    });
    return reader.parse(text, { async: false });
}

/** One read file as the endpoint's answer, or the 404 the read failed with, in the catalog's words. */
function answer(
    path: string,
    base: { root: string; folder: string } | null,
    catalog: Record<string, string>
): Response {
    const read = readDoc(path, catalog);
    if (isFinding(read)) return json(404, { error: read.message });
    const body: DocAnswer = {
        html: renderMarkdown(read.text, base),
        frontmatter: read.frontmatter
    };
    return json(200, body);
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
    if (escapes(path, into.hub)) return json(404, { error: 'the document is not inside the hub' });

    return answer(path, { root: HUB_ROOT, folder: dirname(join(folder, name)) }, into.config.text);
}

/**
 * One Markdown document of the hub, named by a path relative to it: the documents the `docs:` list of
 * config/layout.yml offers in the rail. Only a Markdown file is served, since nothing else renders,
 * and the joined path is checked against the hub again before the file is opened, so a path climbing
 * out of it is a 404 and nothing is opened. The hub's own files are already served to this page by
 * api/file under the `hub` root; this is the same ground, rendered as prose.
 */
export function renderHubDoc(into: DocTarget, path: string): Response {
    if (path === '' || !path.endsWith('.md')) {
        return json(404, { error: `not a document this route serves: ${path}` });
    }
    const full = join(into.hub, path);
    if (escapes(full, into.hub)) return json(404, { error: 'the document is not inside the hub' });
    return answer(full, { root: HUB_ROOT, folder: dirname(path) }, into.config.text);
}

/**
 * The file config/layout.yml sits in, which is what a document's finding names. The config directory
 * rather than the engine's own folder, so a run pointed at a copy names the file it read.
 */
export function layoutFile(engine: string): string {
    return join(configDir(engine), 'layout.yml');
}

/**
 * The ways the `docs:` list of config/layout.yml fails to draw, as findings: an entry that is not a
 * map of three strings, a group `nav_groups` does not name, a path that leaves the hub, a path with
 * no file at it, a directory, and a file that is not Markdown, which is all this route renders. It is the
 * same rule readRoots applies to a root whose directory is not on this machine: what the config
 * names and what is on the disk are checked where the disk is, and a finding is reported and never
 * repaired, so a document whose file has moved shows up in the Findings view rather than as a rail
 * button that opens an empty tab.
 */
export function docFindings(config: Record<string, unknown>, hub: string, file: string): Finding[] {
    const findings: Finding[] = [];
    // The groups are checked only against a config that names some, which every real one does.
    const groups = config.nav_groups;
    const known = typeof groups === 'object' && groups !== null ? Object.keys(groups) : null;
    const raw = config.docs;
    if (raw === undefined) return findings;
    if (!Array.isArray(raw)) {
        findings.push({ file, key: 'docs', message: 'docs is not a list' });
        return findings;
    }
    for (const entry of raw) {
        if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
            findings.push({
                file,
                key: 'docs',
                message: 'a document is not a map of label, path and group'
            });
            continue;
        }
        const held = entry as { label?: unknown; path?: unknown; group?: unknown };
        if (
            typeof held.label !== 'string' ||
            held.label === '' ||
            typeof held.group !== 'string' ||
            held.group === ''
        ) {
            findings.push({
                file,
                key: 'docs',
                message: 'a document names no label or no group'
            });
            continue;
        }
        if (typeof held.path !== 'string' || held.path === '') {
            findings.push({ file, key: held.label, message: 'the document names no path' });
            continue;
        }
        if (known !== null && !known.includes(held.group)) {
            findings.push({
                file,
                key: held.label,
                message: `nav_groups names no group ${held.group}; this document trails the groups`
            });
        }
        const full = join(hub, held.path);
        if (escapes(full, hub)) {
            findings.push({
                file,
                key: held.label,
                message: `the path ${held.path} is not inside the hub`
            });
            continue;
        }
        if (!existsSync(full)) {
            findings.push({
                file,
                key: held.label,
                message: `no file at ${full}; this document draws nothing`
            });
        } else if (statSync(full).isDirectory()) {
            findings.push({
                file,
                key: held.label,
                message: `${full} is a directory; this document draws nothing`
            });
        } else if (!held.path.endsWith('.md')) {
            findings.push({
                file,
                key: held.label,
                message: `${held.path} is not a Markdown file; this document draws nothing`
            });
        }
    }
    return findings;
}

/** The one file of the engine directory this route serves: oculus's own manual, beside DESIGN.md. */
export const MANUAL = 'HELP.md';

/**
 * The manual, read from the engine directory. It is the one path outside the hub this route opens,
 * and it is a constant rather than anything the request names: the `engine` root of api/file is the
 * config folder alone, so the manual has no other way to the page.
 */
export function renderManual(into: DocTarget): Response {
    return answer(join(into.engine, MANUAL), null, into.config.text);
}

/**
 * The whole endpoint: refuse a request from another origin, or answer the document it names. A
 * request carries one of three things: a project and one of that project's document names, a hub
 * path, or `manual`, which is the engine's own HELP.md and takes no path.
 */
export function handleDocs(request: Request, into: DocTarget): Response {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    const url = new URL(request.url);
    if (url.searchParams.has(MANUAL_PARAM)) return renderManual(into);
    const hub = url.searchParams.get(HUB_ROOT);
    if (hub !== null) return renderHubDoc(into, hub);
    return renderDoc(
        into,
        url.searchParams.get('project') ?? '',
        url.searchParams.get('name') ?? ''
    );
}
