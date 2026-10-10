// Layer 2, server. One Markdown document, read from disk and rendered to HTML: a project's, the
// hub's own, or oculus's manual.
//
// routes/api/(docs)/docs/+server.ts is the endpoint and holds nothing but its GET, since a route
// module may export only its verbs; everything the request does is here. DESIGN.md's wire model
// keeps documents out of the snapshot ("documents on demand"), so this is the one way a README
// reaches the page.
//
// A request names one of three things. `project` with `name` is one of that project's own
// documents, its id `<root key>:<id>` for a project of a hub other than the first; `hub` is a path
// relative to the research hub, which is what the `docs:` list of config/layout.yml lists in the
// view catalogue, and `root` beside it names the hub it is relative to; `manual` is the engine's
// own HELP.md and takes no path. Everything else is a 404 naming what was wrong.
//
// The path read is the reader's, never the request's: the id names a project the server already
// holds in its portfolio, the name is one of the Markdown literals below, and the join of the two
// is checked against the hub again before the file is opened. A request naming anything else is
// answered 404 and nothing is opened.
//
// The folder comes from the snapshot the request carries, so one document costs one file read. A
// process that has published no portfolio yet has no snapshot to ask, and the folder is then the
// project's own folder under the hub's scan directories, found by the id it is named after.
//
// Every file answered carries an entity tag of this server process, the file's size and its
// modification time, and a request that sends the tag it holds back in If-None-Match is answered
// 304 while the file is unchanged and the process is the one that rendered it. The page asks
// again after every write that may concern a document, which on a busy hub is every few seconds,
// so the stat is what keeps a re-read of an unchanged file from rendering it again.
//
// A document of oculus's own (HELP.md, DESIGN.md, the Apps guide under docs/: a file whose real
// path lies inside the engine's real folder) draws a diagram of `docs/diagrams/` as a part of its
// own beside its runs of prose, so the page can draw it in the page's text colour; the answer
// carries those parts only when the document holds a diagram. A document's answer names its own
// path and the manual's, relative to the hub, which the page resolves a relative link to another
// document from.
//
// The HTML is rendered here and filtered on the page: ui/html.ts's sanitise runs over every body
// this route answers with, before views/shared/prose/Markdown.svelte draws it. One filter, at the
// one place the markup becomes a document, so this route stays the reader of a file and nothing
// else.
//
// Whether a path lies in a folder and where a path really is are read from server/core/paths.ts
// (`inside`, `realPath`).

import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { decodeHTML } from 'entities';
import type { MarkedExtension, Token, Tokens } from 'marked';
import { fileBytesUrl } from '../../data/helpers/files/address.ts';
import { renderDocumentParts } from '../../data/prose/markdown.ts';
import { configDir } from '../../data/sources/config.ts';
import { PROJECT_DOCS, isFinding, readDoc } from '../../data/sources/docs.ts';
import { hubId, isSideTier, splitHubId } from '../../data/helpers/hub-names.ts';
import { HUB_ROOT } from '../files/files.ts';
import type { HubTarget } from '../files/roots.ts';
import type {
    Finding,
    DocPart,
    PortfolioConfig,
    Project,
    RenderedHeading
} from '../../data/model/index.ts';
import { inside, realPath } from '../core/paths.ts';

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
    /** The hubs other than the first, whose projects are named `<root key>:<id>`. */
    hubs?: HubTarget[];
};

/**
 * The target for the hub served under `root`: the target itself for the first hub, and for another
 * hub its folder, its scan rules and a project lookup that takes the id inside that hub.
 */
function within(into: DocTarget, root: string): DocTarget | null {
    if (root === HUB_ROOT) return into;
    const one = (into.hubs ?? []).find((held) => held.key === root);
    if (one === undefined) return null;
    return {
        ...into,
        hub: one.hub,
        config: one.config,
        project: (id) => into.project?.(hubId(root, id)) ?? null
    };
}

/**
 * The names this route serves: the Markdown of PROJECT_DOCS. The other entries of that list are a
 * PDF and a LaTeX source, and neither is something `marked` can render, so both are refused here
 * rather than answered with rubbish. readDoc splits the front matter off, so what this answers
 * with is the body alone.
 */
export const MARKDOWN_DOCS = PROJECT_DOCS.map((doc) => doc.name).filter((name) =>
    name.endsWith('.md')
);

/**
 * What the endpoint answers with: the rendered document, the headings of that render in order
 * (their level, their words and the id the HTML carries), the frontmatter block it had, and the
 * absolute path of the file read. The page holds the path to tell which `files` events concern the
 * document: an event names the watched root a write landed under, and only a root that holds this
 * file can have changed it. `path` is the file's path relative to the hub and `manual` the
 * manual's, each null when the file lies outside the hub; a relative link in the document is
 * resolved from `path`, and one that resolves to `manual` opens the Help view. A document of
 * oculus's own that holds a diagram also carries its runs of prose and diagrams as `parts`, cut
 * from the same parse as its HTML; no other answer does.
 */
export type DocAnswer = {
    html: string;
    headings: RenderedHeading[];
    frontmatter: Record<string, unknown> | null;
    file: string;
    path: string | null;
    manual: string | null;
    parts?: DocPart[];
};

/** What one render gives the answer: the HTML, its headings, and the runs where it has diagrams. */
type Drawn = { html: string; headings: RenderedHeading[]; parts?: DocPart[] };

/**
 * Where a document of oculus's own sits: the real folder holding it and the engine's real folder,
 * which is what an image address is resolved against to tell a diagram of `docs/diagrams/` from
 * any other picture.
 */
type OwnScope = { folder: string; engine: string };

/**
 * A document is asked for again whenever a write may have changed it, and the page itself asks
 * with the tag it holds, so the browser keeps nothing: the tag below is what spares the render.
 */
const CACHE = 'no-store';

/** The query parameter that asks for the manual instead of a project's or the hub's document. */
export const MANUAL_PARAM = 'manual';

/** What every answer of this route carries besides its type. */
const NO_STORE = { 'cache-control': CACHE };

/**
 * What this server process's tags start with, made once as the module loads and never changed. A
 * rendered document is a function of the file and of the renderer the process runs, so a page
 * still holding a tag from an earlier process (an earlier build's render) is answered with this
 * process's render rather than a 304 over the old one.
 */
export const PROCESS_TAG = randomUUID();

/**
 * The entity tag of one file: the process's own stamp, the file's size and its modification time,
 * one stat and no read. The empty string for a path that is not a file, which is then never
 * answered 304. A tag changes whenever the size or the time does, which is every write that can
 * change the rendered text; a write that keeps both (the same bytes rewritten within the clock's
 * resolution) keeps what the page holds, which is the same document.
 */
export function fileTag(path: string): string {
    try {
        const stat = statSync(path);
        return stat.isFile() ? `"${PROCESS_TAG}-${String(stat.size)}-${String(stat.mtimeMs)}"` : '';
    } catch {
        return '';
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
    const full = realPath(path);
    if (full === null) return false;
    return !inside(full, realPath(hub) ?? hub);
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
        // A side project is no research project, so no project document is read from its folder.
        if (isSideTier(rule)) continue;
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
 * Whether an address is one the browser resolves itself: a scheme, a page anchor, or an absolute
 * path.
 */
const ABSOLUTE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i;

/** The file route's address for one path under one root, each segment escaped on its own. */
function routeUrl(root: string, path: string): string {
    return fileBytesUrl(root, path.replaceAll('\\', '/'));
}

/**
 * Whether a path joined against a folder climbs out of the root it was joined against. `join` has
 * already normalised what it could, so any `..` left in it is one the folder could not absorb.
 */
function climbs(path: string): boolean {
    return path.split(/[\\/]/).includes('..');
}

/**
 * One document's Markdown as HTML and its headings, with a figure beside it drawn through the file
 * route: a relative image source is resolved against the document's own folder and addressed under
 * `base.root`, which is the one way a `<img src="figures/one.png">` in a hub document reaches the
 * reader. An address the browser resolves on its own (a scheme, an absolute path) is left as it
 * was written, and a document with no folder to resolve against keeps every source it carries.
 *
 * A document of oculus's own (`own`) is also cut at its diagrams: see cutDiagrams.
 *
 * Every heading carries an id and a `[TOC]` paragraph is drawn as the document's table of
 * contents, by the document rule of data/prose/markdown.ts the page renders with too.
 */
export function renderMarkdown(
    text: string,
    base: { root: string; folder: string } | null,
    own: OwnScope | null = null
): Drawn {
    const cut = own === null ? null : cutDiagrams(own);
    const extensions: MarkedExtension[] = [];
    if (cut !== null) extensions.push(cut.extension);
    if (base !== null) extensions.push(figures(base));
    const drawn = renderDocumentParts(text, ...extensions);
    return cut === null ? drawn : cut.finish(drawn);
}

/**
 * The token pass that addresses a document's figures through the file route under `base.root`,
 * resolved against the document's own folder. It sets the address on each image token before the
 * render, and marked's own renderer draws the element and escapes what it writes.
 */
function figures(base: { root: string; folder: string }): MarkedExtension {
    return {
        walkTokens(token: Token) {
            if (token.type !== 'image') return;
            const image = token as Tokens.Image;
            // A source that leaves the document's own root is left as the author wrote it, since
            // the file route serves nothing outside a root; the browser then resolves it against
            // the page.
            const joined = join(base.folder, image.href);
            if (ABSOLUTE.test(image.href) || climbs(joined)) return;
            image.href = routeUrl(base.root, joined);
        }
    };
}

/** The name a diagram's file carries, as the diagram route reads it: letters, digits, hyphens. */
const DIAGRAM_FILE = /^([a-z0-9][a-z0-9-]*)\.svg$/;

/**
 * The diagram a paragraph shows when one image is all it holds and the image's address, resolved
 * from the document's own folder, is a file of the engine's `docs/diagrams/` folder: the name from
 * the file and the alternative text as the author wrote it, its entities decoded, since the token
 * keeps an `&amp;` as written. `docs/diagrams/x.svg` in a document of the engine's folder and
 * `diagrams/x.svg` in one of its `docs/` folder both name the diagram `x`. Null for any other
 * paragraph: an image of another address (a name that climbs out of the folder or has an upper-case
 * letter among them), or an image inside a sentence.
 */
function diagramOf(
    paragraph: Tokens.Paragraph,
    own: OwnScope
): { name: string; alt: string } | null {
    const held = paragraph.tokens.filter((one) => one.type !== 'text' || one.raw.trim() !== '');
    const only = held.length === 1 ? held[0] : null;
    if (only?.type !== 'image') return null;
    const image = only as Tokens.Image;
    if (ABSOLUTE.test(image.href)) return null;
    const target = resolve(own.folder, image.href);
    if (dirname(target) !== join(own.engine, 'docs', 'diagrams')) return null;
    const name = DIAGRAM_FILE.exec(basename(target))?.[1];
    return name === undefined ? null : { name, alt: decodeHTML(image.text) };
}

/**
 * The cut of a document of oculus's own at its diagrams: a marked extension that notes each
 * top-level paragraph holding one diagram image, and `finish`, which splits the render's HTML at
 * the marks into runs of prose and diagrams. The diagrams are noted from the tokens as they are
 * lexed, before the figures pass has addressed the image through the file route, so the address
 * that is read is the one the author wrote. A page draws each diagram from the diagram route
 * instead, in its text colour, which an `img` cannot do; the paragraph's own HTML stays in the
 * answer's `html` for a reader that draws the whole.
 *
 * The cut is made in the render, the way the table of contents is, so the heading ids and the
 * table of contents are those of the one parse the answer's HTML comes from. A paragraph inside a
 * list or a quote is never cut, since a run cut there would close markup it did not open. A
 * document with no diagram gets no parts.
 */
function cutDiagrams(own: OwnScope): {
    extension: MarkedExtension;
    finish: (drawn: { html: string; headings: RenderedHeading[] }) => Drawn;
} {
    const mark = `<!--diagram-${randomUUID()}-->`;
    const found = new Map<Token, { name: string; alt: string }>();
    const shown: { name: string; alt: string; html: string }[] = [];
    const extension: MarkedExtension = {
        hooks: {
            processAllTokens(tokens) {
                for (const one of tokens) {
                    if (one.type !== 'paragraph') continue;
                    const diagram = diagramOf(one as Tokens.Paragraph, own);
                    if (diagram !== null) found.set(one, diagram);
                }
                return tokens;
            }
        },
        renderer: {
            paragraph(paragraph: Tokens.Paragraph) {
                const diagram = found.get(paragraph);
                if (diagram === undefined) return false;
                const html = `<p>${this.parser.parseInline(paragraph.tokens)}</p>\n`;
                shown.push({ ...diagram, html });
                return mark;
            }
        }
    };
    function finish(drawn: { html: string; headings: RenderedHeading[] }): Drawn {
        if (shown.length === 0) return drawn;
        const parts: DocPart[] = [];
        let html = '';
        drawn.html.split(mark).forEach((piece, at) => {
            if (piece.trim() !== '') parts.push({ kind: 'html', html: piece });
            html += piece;
            const diagram = shown.at(at);
            if (diagram === undefined) return;
            parts.push({ kind: 'diagram', name: diagram.name, alt: diagram.alt });
            html += diagram.html;
        });
        return { html, headings: drawn.headings, parts };
    }
    return { extension, finish };
}

/**
 * The scope of a document of oculus's own: set when the file's real path lies inside the engine's
 * real folder, so a symbolic link to the checkout counts and an engine outside the hub is read as
 * it is. Null for any other document, and for a file or engine that cannot be resolved.
 */
function ownScope(engine: string, file: string): OwnScope | null {
    const root = realPath(engine);
    const real = realPath(file);
    if (root === null || real === null || !inside(real, root)) return null;
    return { folder: dirname(real), engine: root };
}

/** A file's path relative to the hub with `/` separators, or null for one outside the hub. */
function hubPath(hub: string, file: string): string | null {
    const base = realPath(hub) ?? resolve(hub);
    const real = realPath(file) ?? resolve(file);
    if (!inside(real, base)) return null;
    return relative(base, real).split(sep).join('/');
}

/**
 * One read file as the endpoint's answer, or the 404 the read failed with, in the catalog's words.
 * A request that already holds the file's current tag is answered 304 with no body, so a re-read
 * of an unchanged file costs one stat and no render. Both answers name the file, so the page can
 * tell a later write to it from a write elsewhere whether the file was there or not.
 */
function answer(
    into: DocTarget,
    path: string,
    held: string,
    draw: (text: string) => Drawn
): Response {
    const file = resolve(path);
    const tag = fileTag(file);
    if (tag !== '' && tag === held) {
        return new Response(null, { status: 304, headers: { etag: tag, 'cache-control': CACHE } });
    }
    const read = readDoc(file, into.config.text);
    if (isFinding(read))
        return json({ error: read.message, file }, { status: 404, headers: NO_STORE });
    const body: DocAnswer = {
        ...draw(read.text),
        frontmatter: read.frontmatter,
        file,
        path: hubPath(into.hub, file),
        manual: hubPath(into.hub, join(into.engine, MANUAL))
    };
    return json(body, { headers: tag === '' ? NO_STORE : { ...NO_STORE, etag: tag } });
}

/**
 * One document of one project, rendered. Every refusal is a 404 naming what was wrong: a name this
 * route does not serve, an id the reader does not know, a path that would leave the hub, and a file
 * that is not there or whose frontmatter does not parse.
 */
export function renderDoc(into: DocTarget, id: string, name: string, held = ''): Response {
    if (!MARKDOWN_DOCS.includes(name)) {
        return json(
            { error: `not a document this route serves: ${name}` },
            { status: 404, headers: NO_STORE }
        );
    }
    const named = splitHubId(
        id,
        (into.hubs ?? []).map((one) => one.key)
    );
    const owner = within(into, named.root);
    const folder = owner === null ? null : folderOf(owner, named.id);
    if (owner === null || folder === null)
        return json({ error: `no project with the id ${id}` }, { status: 404, headers: NO_STORE });

    const path = join(owner.hub, folder, name);
    if (escapes(path, owner.hub))
        return json(
            { error: 'the document is not inside the hub' },
            { status: 404, headers: NO_STORE }
        );

    const base = { root: named.root, folder: dirname(join(folder, name)) };
    return answer(owner, path, held, (text) => renderMarkdown(text, base));
}

/**
 * One Markdown document of the hub, named by a path relative to it: the documents the `docs:` list
 * of config/layout.yml lists in the view catalogue and the Markdown files of the folder an entry's
 * page shows (views/boards/entry/Entry.svelte). Only a Markdown file is served, since nothing
 * else renders, and the joined path is checked against the hub again before the file is opened, so
 * a path climbing out of it is a 404 and nothing is opened. The hub's own files are already served
 * to this page by api/file under the `hub` root; this is the same ground, rendered as prose.
 */
export function renderHubDoc(
    target: DocTarget,
    path: string,
    held = '',
    root = HUB_ROOT
): Response {
    const into = within(target, root);
    if (into === null) {
        return json({ error: `no hub served as ${root}` }, { status: 404, headers: NO_STORE });
    }
    if (path === '' || !path.endsWith('.md')) {
        return json(
            { error: `not a document this route serves: ${path}` },
            { status: 404, headers: NO_STORE }
        );
    }
    const full = join(into.hub, path);
    if (escapes(full, into.hub))
        return json(
            { error: 'the document is not inside the hub' },
            { status: 404, headers: NO_STORE }
        );
    const base = { root, folder: dirname(path) };
    const own = ownScope(into.engine, full);
    return answer(into, full, held, (text) => renderMarkdown(text, base, own));
}

/**
 * The file config/layout.yml sits in, which is what a document's finding names. The config
 * directory rather than the engine's own folder, so a run pointed at a copy names the file it read.
 */
export function layoutFile(engine: string): string {
    return join(configDir(engine), 'layout.yml');
}

/** A document of the `docs:` list: a label, a path and a group, each a text with a character. */
const docShape = z.object({
    label: z.string().min(1),
    path: z.string().min(1),
    group: z.string().min(1)
});

/** One entry of the `docs:` list: a map, whose three fields are checked one at a time. */
const docEntryShape = z.looseObject({
    label: z.unknown().optional(),
    path: z.unknown().optional(),
    group: z.unknown().optional()
});

/** The `docs:` value: a list, of entries nothing has checked yet. */
const docListShape = z.array(z.unknown());

/**
 * The `nav_groups:` value, whose keys name the groups: any object, a list included, since a list's
 * indexes are its keys.
 */
const groupsShape = z.custom<object>((held) => typeof held === 'object' && held !== null);

/**
 * The ways the `docs:` list of config/layout.yml fails to draw, as findings: an entry that is not a
 * map of three strings, a group `nav_groups` does not name, a path that leaves the hub, a path with
 * no file at it, a directory, and a file that is not Markdown, which is all this route renders. It
 * is the same rule readRoots applies to a root whose directory is not on this machine: what the
 * config names and what is on the disk are checked where the disk is, and a finding is reported and
 * never repaired, so a document whose file has moved shows up in the Findings view rather than as a
 * rail button that opens an empty tab.
 */
export function docFindings(config: Record<string, unknown>, hub: string, file: string): Finding[] {
    const findings: Finding[] = [];
    // The groups are checked only against a config that names some, which every real one does.
    const groups = groupsShape.safeParse(config.nav_groups);
    const known = groups.success ? Object.keys(groups.data) : null;
    if (config.docs === undefined) return findings;
    const list = docListShape.safeParse(config.docs);
    if (!list.success) {
        findings.push({ file, key: 'docs', message: 'docs is not a list' });
        return findings;
    }
    for (const item of list.data) {
        const entry = docEntryShape.safeParse(item);
        if (!entry.success) {
            findings.push({
                file,
                key: 'docs',
                message: 'a document is not a map of label, path and group'
            });
            continue;
        }
        const label = docShape.shape.label.safeParse(entry.data.label);
        const group = docShape.shape.group.safeParse(entry.data.group);
        if (!label.success || !group.success) {
            findings.push({
                file,
                key: 'docs',
                message: 'a document names no label or no group'
            });
            continue;
        }
        const path = docShape.shape.path.safeParse(entry.data.path);
        if (!path.success) {
            findings.push({ file, key: label.data, message: 'the document names no path' });
            continue;
        }
        if (known !== null && !known.includes(group.data)) {
            findings.push({
                file,
                key: label.data,
                message: `nav_groups names no group ${group.data}; this document trails the groups`
            });
        }
        const full = join(hub, path.data);
        if (escapes(full, hub)) {
            findings.push({
                file,
                key: label.data,
                message: `the path ${path.data} is not inside the hub`
            });
            continue;
        }
        if (!existsSync(full)) {
            findings.push({
                file,
                key: label.data,
                message: `no file at ${full}; this document draws nothing`
            });
        } else if (statSync(full).isDirectory()) {
            findings.push({
                file,
                key: label.data,
                message: `${full} is a directory; this document draws nothing`
            });
        } else if (!path.data.endsWith('.md')) {
            findings.push({
                file,
                key: label.data,
                message: `${path.data} is not a Markdown file; this document draws nothing`
            });
        }
    }
    return findings;
}

/**
 * The one file of the engine directory this route serves: oculus's own manual, beside DESIGN.md.
 */
export const MANUAL = 'HELP.md';

/**
 * The manual, read from the engine directory. It is the one path outside the hub this route opens,
 * and it is a constant rather than anything the request names: the `engine` root of api/file is the
 * config folder alone, so the manual has no other way to the page. It is drawn as prose alone.
 */
export function renderManual(into: DocTarget, held = ''): Response {
    return answer(into, join(into.engine, MANUAL), held, (text) => renderMarkdown(text, null));
}

/**
 * The whole endpoint: the document the request names. A request carries one of three things: a
 * project and one of that project's document names, a hub path, or `manual`, which is the engine's
 * own HELP.md and takes no path.
 */
export function handleDocs(request: Request, into: DocTarget): Response {
    const url = new URL(request.url);
    const held = request.headers.get('if-none-match') ?? '';
    if (url.searchParams.has(MANUAL_PARAM)) return renderManual(into, held);
    const hub = url.searchParams.get(HUB_ROOT);
    if (hub !== null)
        return renderHubDoc(into, hub, held, url.searchParams.get('root') ?? HUB_ROOT);
    return renderDoc(
        into,
        url.searchParams.get('project') ?? '',
        url.searchParams.get('name') ?? '',
        held
    );
}
