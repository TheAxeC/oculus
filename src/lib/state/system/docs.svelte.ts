// Layer 2, client state. The documents the views draw: a project's, one of the hub's own, one of
// oculus's own folder, and the manual, each held under a key of its own.
//
// DESIGN.md's wire model keeps documents out of the snapshot, so a document is fetched rather than
// selected: document(id, name) asks api/docs the first time a pair is wanted and holds the answer,
// and every later call for that pair reads what is held. hubDocument(path), engineDocument(path)
// and manual() are the same rule over the other shapes the endpoint answers, and enginePlace() is
// the engine folder's place in a hub as the manual's answer gives it. Each answer is held in the
// client state's query client through state/client/queries.svelte.ts, which schedules the fetch on
// a microtask, so reading this from a $derived never writes state while a derived is running.
//
// A write is what makes a document stale. The git watcher publishes a `files` message naming the
// watched root and the folders written in it each time a window of writes ends, and every answer of
// api/docs names the absolute file it read, so a document is marked for a re-read only when the
// message's root holds its file and the message names the file's folder (or names no folders, which
// says the whole root). A message with the empty root (the bookmarks or workspace file changed)
// names no root and marks nothing. A message whose version is not the one after the last one heard
// means messages were merged or missed on the way, and their roots are unknown, so it marks every
// held document. A document whose answer named no file (a request the endpoint refused before
// opening anything) is marked by every message that names a root, since nothing tells which root
// could change it.
//
// A marked document is asked for again on the next call for it, which is the tab still being drawn
// and shown (a tab the pane hides asks once when it is shown), and what is held keeps being
// returned while that answer is in flight: the loading state is what a document reads as before
// its first answer and never after. A mark that comes while the request is in flight asks again as
// soon as it lands. The request carries the entity tag of the held answer, a 304 keeps the held
// object as it is, and an answer equal to the held one keeps the held object too, so an unchanged
// document rebuilds no markup and reloads no figure.

import { z } from 'zod';
import type { DocPart, Message, RenderedHeading } from '../../data/model/index.ts';
import { mapShape, readJson, rowsShape } from '../../data/shapes/shapes.ts';
import { failedAnswer } from '../shared/answers/answers.ts';
import { filesNamed } from '../shared/answers/files-named.ts';
import type { EntitiesStore, Fetcher, Fetching, Queries } from '../shared/stores/shapes.ts';

export type { DocPart, RenderedHeading };

/** One document as the view reads it: the rendered HTML, its frontmatter, or what went wrong. */
export type DocState = {
    html: string;
    /** The headings of the render in order, which an outline of the document shows. */
    headings: RenderedHeading[];
    frontmatter: Record<string, unknown> | null;
    /** What the request failed with, or the empty string. */
    error: string;
    /** True while the first answer for the pair is still to come. */
    loading: boolean;
    /**
     * The runs of prose and diagrams as the server cut them, in order, for a document of oculus's
     * own that holds a diagram; empty for every other document.
     */
    parts: DocPart[];
    /**
     * The document's path: relative to the engine folder when `engine` is true, else relative to
     * the hub, or the empty string outside it.
     */
    path: string;
    /** The manual's path in the same space as `path`, or the empty string outside the hub. */
    manual: string;
    /** True for the manual and a document of oculus's own folder, read in that folder's space. */
    engine: boolean;
    /** The hub the document's `path` is relative to, or the empty string for an engine document. */
    hub: string;
    /**
     * The hub that holds the engine folder, or the empty string when no hub of the workspace does.
     */
    engineHub: string;
    /** The engine folder's path relative to `engineHub`, or the empty string when it is in none. */
    engineAt: string;
};

/** What a pair reads as before its answer arrives. */
const PENDING: DocState = {
    html: '',
    headings: [],
    frontmatter: null,
    error: '',
    loading: true,
    parts: [],
    path: '',
    manual: '',
    engine: false,
    hub: '',
    engineHub: '',
    engineAt: ''
};

/** What no pair at all reads as: an empty id or name asks nothing and waits for nothing. */
const NOTHING: DocState = {
    html: '',
    headings: [],
    frontmatter: null,
    error: '',
    loading: false,
    parts: [],
    path: '',
    manual: '',
    engine: false,
    hub: '',
    engineHub: '',
    engineAt: ''
};

/** One rendered document per project and name, held for one client. */
export type DocsStore = {
    document: (id: string, name: string) => DocState;
    /**
     * One Markdown document of a hub, by its path relative to the hub, the primary's unless `hub`
     * names another hub of the workspace.
     */
    hubDocument: (path: string, hub?: string) => DocState;
    /**
     * One Markdown document of oculus's own folder, by its path relative to that folder, which the
     * server reads wherever the folder sits.
     */
    engineDocument: (path: string) => DocState;
    /** Oculus's own manual, which the server reads from the engine directory. */
    manual: () => DocState;
    /**
     * The engine folder's place in a hub as the manual's answer gives it: the hub and the folder's
     * path in it, both empty while that answer is on its way, when it failed, and when no hub of
     * the workspace holds the folder.
     */
    enginePlace: () => EnginePlace;
    /**
     * The same place once the manual's answer is in, asking for it when nothing is held, so a
     * press made before the answer arrives still finds a tab of oculus's own folder.
     */
    enginePlaceSettled: () => Promise<EnginePlace>;
};

/** Where the engine folder sits: the hub holding it and its path relative to that hub. */
export type EnginePlace = { hub: string; at: string };

/** The endpoint every document is read at. */
const DOCS = '/api/docs';

/** What every document's query key opens with. */
const KIND = 'docs';

/** What the documents that are not a project's are held under; a project id holds no bar. */
const HUB = 'hub';
const ENGINE = 'engine';
const MANUAL = 'manual';

/** The address the manual is read at. */
const MANUAL_URL = `${DOCS}?${MANUAL}=1`;

/**
 * One run of a document as the answer carries it: a string of HTML, or a diagram with a name and
 * its words. Any other run is left out by `bodyShape`.
 */
const docPartShape = z.union([
    z.object({ kind: z.literal('html'), html: z.string() }),
    z.object({ kind: z.literal('diagram'), name: z.string(), alt: z.string() })
]) satisfies z.ZodType<DocPart>;

/** One heading of the render as the answer carries it. */
const headingShape = z.object({
    level: z.number().int().min(1).max(6),
    text: z.string(),
    id: z.string()
}) satisfies z.ZodType<RenderedHeading>;

/**
 * What api/docs answers in JSON, every field read as absent when it is of the wrong type, since an
 * error answer carries fewer. The runs that fail their shape are dropped, and an answer without
 * runs reads as none. A path the server names as outside the hub reads as the empty string, and an
 * answer without the engine's fields reads as no engine document in no place.
 */
const bodyShape = z.object({
    html: z.string().catch(''),
    headings: rowsShape(headingShape).catch([]),
    frontmatter: mapShape.nullable().catch(null),
    file: z.string().catch(''),
    parts: rowsShape(docPartShape).catch([]),
    path: z.string().catch(''),
    manual: z.string().catch(''),
    engine: z.boolean().catch(false),
    hub: z.string().catch(''),
    engineHub: z.string().catch(''),
    engineAt: z.string().catch('')
});

/** What an answer that is no map of fields reads as. */
const NO_BODY = bodyShape.parse({});

/** HTTP's answer to a request whose entity tag is still the file's. */
const NOT_MODIFIED = 304;

/** Whether two answers draw the same document. */
function same(one: DocState, other: DocState): boolean {
    return (
        one.html === other.html &&
        JSON.stringify(one.headings) === JSON.stringify(other.headings) &&
        one.error === other.error &&
        one.loading === other.loading &&
        JSON.stringify(one.frontmatter) === JSON.stringify(other.frontmatter) &&
        JSON.stringify(one.parts) === JSON.stringify(other.parts) &&
        one.path === other.path &&
        one.manual === other.manual &&
        one.engine === other.engine &&
        one.hub === other.hub &&
        one.engineHub === other.engineHub &&
        one.engineAt === other.engineAt
    );
}

/** What is held under a key: the document, the file the answer named, and its entity tag. */
type Held = { doc: DocState; file: string; tag: string };

export function createDocs(entities: EntitiesStore, queries: Queries): DocsStore {
    /** The version of the last `files` message heard, or null before the first. */
    let heard: number | null = null;

    entities.afterReceive((message) => {
        if (message.channel === 'files') filesMoved(message);
    });

    /**
     * What one document is held under. A project id is a folder basename and a name is one of four
     * literals, so neither holds a bar. The hub's documents and the manual are held under a key
     * that opens with a bar, which no project's key does since an id is never empty, so a project
     * folder named `hub` or `manual` is a different key.
     */
    function keyOf(id: string, name: string): string {
        return `${id}|${name}`;
    }

    /** The key of a document that belongs to no project. */
    function ownKey(kind: string, name: string): string {
        return `|${kind}|${name}`;
    }

    /**
     * One document of one project. The first call for a pair asks the server; a call made after a
     * write under the root holding it asks again, from a tab that is shown or when it is shown,
     * and what is held keeps showing until the answer lands.
     */
    function document(id: string, name: string): DocState {
        if (id === '' || name === '') return NOTHING;
        return reading(
            keyOf(id, name),
            `${DOCS}?project=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`
        );
    }

    /**
     * One Markdown document of a hub, by the path its `docs:` entry in layout.yml names or, on an
     * entry's page, by the path of a Markdown file in the folder its `link` names. A missing `hub`
     * is the primary hub.
     */
    function hubDocument(path: string, hub = ''): DocState {
        if (path === '') return NOTHING;
        const named = hub === '' ? '' : `&hub=${encodeURIComponent(hub)}`;
        return reading(
            ownKey(HUB, `${hub}:${path}`),
            `${DOCS}?path=${encodeURIComponent(path)}${named}`
        );
    }

    /**
     * One Markdown document of oculus's own folder, by the path the guides link to each other by,
     * relative to that folder.
     */
    function engineDocument(path: string): DocState {
        if (path === '') return NOTHING;
        return reading(ownKey(ENGINE, path), `${DOCS}?${ENGINE}=${encodeURIComponent(path)}`);
    }

    /** The manual, which is one document and takes no path. */
    function manual(): DocState {
        return reading(ownKey(MANUAL, MANUAL), MANUAL_URL);
    }

    /** What is held for one address, asking for it when nothing is held or it was marked since. */
    function reading(key: string, url: string): DocState {
        // There is no fetch while the page is rendered on the server, and nothing to show there
        // either: the pair stays pending and the browser asks for it on the first client render.
        const { data } = queries.read([KIND, key], fetcherOf(url), {
            enabled: typeof fetch === 'function'
        });
        return data?.doc ?? PENDING;
    }

    /**
     * Whether one `files` message can concern the document held under a key: a gap in the versions
     * concerns every document, the empty root none, and a root the ones whose file it holds, when
     * the message names the file's folder or names no folders.
     */
    function concerns(
        held: Held | undefined,
        root: string,
        folders: string[] | undefined,
        gap: boolean
    ): boolean {
        if (gap) return true;
        if (root === '') return false;
        if (held === undefined || held.file === '') return true;
        return filesNamed(root, folders, held.file);
    }

    /** Mark every held or requested document a `files` message concerns. */
    function filesMoved(message: Message): void {
        if (heard === message.version) return;
        const gap = heard === null || message.version !== heard + 1;
        heard = message.version;
        const payload = entities.payloadOf(message, 'files');
        const root = payload?.root ?? '';
        for (const one of queries.entries<Held>([KIND])) {
            if (concerns(one.data, root, payload?.folders, gap)) queries.mark(one.key, 'again');
        }
    }

    /** The query function that asks one address, keeping what is held where the answer says so. */
    function fetcherOf(url: string): Fetcher<Held> {
        return async (held, fetching) => {
            try {
                const tag = held?.tag ?? '';
                const response = await fetch(
                    url,
                    tag === '' ? undefined : { headers: { 'if-none-match': tag } }
                );
                if (response.status === NOT_MODIFIED && held !== undefined) return held;
                const raw = await readJson(response);
                if (raw === undefined) {
                    // The server answered, but with a body that is not the endpoint's (a proxy's
                    // page, an empty 5xx). A refusal replaces what is held; an answer that claims
                    // success reads as a request that went wrong on the way.
                    if (!response.ok) return failure(held, failedAnswer(response, raw));
                    return unreached(held, fetching, failedAnswer(response, raw));
                }
                const body = bodyShape.safeParse(raw).data ?? NO_BODY;
                if (!response.ok) {
                    return failure(held, failedAnswer(response, raw), body.file);
                }
                return keep(held, {
                    doc: {
                        html: body.html,
                        headings: body.headings,
                        frontmatter: body.frontmatter,
                        parts: body.parts,
                        path: body.path,
                        manual: body.manual,
                        engine: body.engine,
                        hub: body.hub,
                        engineHub: body.engineHub,
                        engineAt: body.engineAt,
                        error: '',
                        loading: false
                    },
                    file: body.file,
                    tag: response.headers.get('etag') ?? ''
                });
            } catch (error) {
                return unreached(
                    held,
                    fetching,
                    error instanceof Error ? error.message : String(error)
                );
            }
        };
    }

    /**
     * What a request that went wrong on the way leaves: it says nothing about the file, so a drawn
     * document stays drawn and stays marked and the next call for it from a shown tab asks again;
     * a pair not drawn reads as the failure.
     */
    function unreached(held: Held | undefined, fetching: Fetching, reason: string): Held {
        if (held?.doc.error === '' && !held.doc.loading) {
            fetching.leaveStale();
            return held;
        }
        return failure(held, reason, held?.file ?? '');
    }

    /** An answer that says the request failed, replacing what is held. */
    function failure(held: Held | undefined, error: string, file = ''): Held {
        return keep(held, { doc: { ...PENDING, error, loading: false }, file, tag: '' });
    }

    /** Hold one answer, keeping the held document when the new one draws the same. */
    function keep(held: Held | undefined, next: Held): Held {
        if (held !== undefined && same(held.doc, next.doc)) return { ...next, doc: held.doc };
        return next;
    }

    /** The engine folder's place in a hub, from the manual's answer. */
    function enginePlace(): EnginePlace {
        return placeOf(manual());
    }

    /** The engine folder's place in a hub, waiting for the manual's answer while it is out. */
    async function enginePlaceSettled(): Promise<EnginePlace> {
        const held = await queries.fetch([KIND, ownKey(MANUAL, MANUAL)], fetcherOf(MANUAL_URL));
        return placeOf(held.doc);
    }

    /** The place a manual's answer gives, empty while pending or after failing. */
    function placeOf(guide: DocState): EnginePlace {
        return guide.loading || guide.error !== ''
            ? { hub: '', at: '' }
            : { hub: guide.engineHub, at: guide.engineAt };
    }

    return { document, hubDocument, engineDocument, manual, enginePlace, enginePlaceSettled };
}
