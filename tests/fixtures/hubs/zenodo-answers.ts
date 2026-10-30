// Layer 4, test helper. A fake Zenodo for the deposit's `fetch` option, so no request of a test
// leaves the process: it keeps the records it made in memory, answers each call of the deposit in
// the shape InvenioRDM's "Drafts and records" documentation gives (a draft, its files, the publish,
// a new version, the latest version, a share link, a draft deleted), and answers a record read in
// the shape of the recorded answer tests/server/machine/runs/recover/answers/zenodo/picai.body
// (`id`, `recid`, `conceptrecid`, `doi`, `conceptdoi`, `metadata`, `links`). The draft of a record
// that is published answers 404, and a concept's id answers a redirect to its latest version. Every
// call is kept with its method, path, headers and body, an upload with its bytes, and a call to an
// address outside the site's `/api/` is kept apart as stray and refused.
//
// A case makes one call answer a status of its own instead of acting (`status`) or after acting
// (`after`), holds one call until the request's signal aborts it or `release` lets it go (`hold`),
// and seeds a published record of a concept (`seed`).

import { strFromU8, unzipSync } from 'fflate';

/** The site of the fake, and the address a fixture hub lays as `deposit.zenodo.address`. */
export const ZENODO_SITE = 'https://zenodo.example';
export const ZENODO_ADDRESS = `${ZENODO_SITE}/api`;

/** The authors a seeded record names when it is no review copy. */
const SEEDED_AUTHORS = ['Rivera, Ana'];

/** One call the fake received. */
export type ZenodoCall = {
    method: string;
    /** The path of the address, `/api/records/101/draft/files`. */
    path: string;
    /** The headers, by their lower-case names. */
    headers: Record<string, string>;
    /** The body parsed as JSON, or null for none or for bytes. */
    body: unknown;
    /** The bytes of an upload. */
    bytes?: Uint8Array;
};

/** How a call a case names fails: the status it answers, or `none` for no answer at all. */
type Failure = number | 'none';

/** What a case sets on the fake. */
export type ZenodoSetup = {
    /** The status one call answers instead of acting, `none` for no answer, by method and path. */
    status?: (method: string, path: string) => Failure | undefined;
    /** The status one call answers after it acted, `none` for no answer, by method and path. */
    after?: (method: string, path: string) => Failure | undefined;
    /** Whether a call waits until its request is aborted or `release` is called. */
    hold?: (method: string, path: string) => boolean;
    /**
     * A published record of a concept, and the concept's id, made before the first call, naming
     * `creators` (`Rivera, Ana` when absent) with files restricted when `restricted`, else open.
     */
    seed?: { concept: string; record: string; creators?: string[]; restricted?: boolean };
    /** Called when a held call starts waiting. */
    held?: () => void;
};

export type FakeZenodo = {
    fetch: typeof fetch;
    calls: ZenodoCall[];
    /** The addresses called outside the site's `/api/`. */
    stray: string[];
    /** Each uploaded zip by its file key: its entries by path, each read as UTF-8 text. */
    uploads: () => Record<string, Record<string, string>>;
    /** Lets every held call go on to its answer. */
    release: () => void;
};

/** One record the fake holds: its concept, whether it is published, and what it names. */
type Held = { concept: string; published: boolean; creators: string[]; restricted: boolean };

/** The parts of a draft's body the fake keeps. */
type Sent = {
    access?: { files?: string };
    metadata?: { creators?: { person_or_org: { name?: string; family_name?: string } }[] };
};

/** A JSON answer. */
function answer(status: number, body: unknown): Response {
    return new Response(status === 204 ? null : JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' }
    });
}

/** The answer of a call that fails: its status, or no answer at all. */
function failing(how: Failure): Response {
    if (how === 'none') throw new Error('no answer');
    return answer(how, { status: how, message: 'refused' });
}

/** The headers of a request as a map by lower-case name. */
function headersOf(init: RequestInit | undefined): Record<string, string> {
    const out: Record<string, string> = {};
    new Headers(init?.headers).forEach((value, name) => {
        out[name] = value;
    });
    return out;
}

/** A Zenodo that answers the deposit's calls; see the head of this file. */
export function fakeZenodo(setup: ZenodoSetup = {}): FakeZenodo {
    const calls: ZenodoCall[] = [];
    const stray: string[] = [];
    const records = new Map<string, Held>();
    const bytes = new Map<string, Uint8Array>();
    const waiting: (() => void)[] = [];
    let next = 101;
    let links = 0;
    if (setup.seed !== undefined) {
        records.set(setup.seed.record, {
            concept: setup.seed.concept,
            published: true,
            creators: setup.seed.creators ?? SEEDED_AUTHORS,
            restricted: setup.seed.restricted === true
        });
        next = Math.max(next, Number(setup.seed.record) + 1, Number(setup.seed.concept) + 1);
    }

    /** A record read, in the recorded answer's shape. */
    function record(id: string): unknown {
        const held = records.get(id);
        const concept = held?.concept ?? id;
        return {
            id: Number(id),
            recid: id,
            conceptrecid: concept,
            doi: `10.5281/zenodo.${id}`,
            conceptdoi: `10.5281/zenodo.${concept}`,
            metadata: {
                creators: (held?.creators ?? []).map((name) => ({ name, affiliation: null })),
                access_right: held?.restricted === true ? 'restricted' : 'open'
            },
            links: {
                self_html: `${ZENODO_SITE}/records/${id}`,
                parent_doi: `${ZENODO_SITE}/doi/10.5281/zenodo.${concept}`,
                latest: `${ZENODO_SITE}/api/records/${id}/versions/latest`,
                versions: `${ZENODO_SITE}/api/records/${id}/versions`,
                access_links: `${ZENODO_SITE}/api/records/${id}/access/links`
            }
        };
    }

    /** A draft, in the shape "Drafts and records" gives it. */
    function draft(id: string): unknown {
        const concept = records.get(id)?.concept ?? id;
        return {
            id,
            parent: { id: concept, access: { owned_by: { user: '1' } } },
            links: { self: `${ZENODO_SITE}/api/records/${id}/draft` },
            is_published: false
        };
    }

    /** What a draft's body names, kept on the record. */
    function keep(id: string, body: unknown): void {
        const held = records.get(id);
        if (held === undefined) return;
        const sent = body as Sent;
        held.creators = (sent.metadata?.creators ?? []).map(
            ({ person_or_org: one }) => one.name ?? one.family_name ?? ''
        );
        held.restricted = sent.access?.files === 'restricted';
    }

    /** A new draft of a concept. */
    function made(concept: string | null): string {
        const id = String(next);
        next += 1;
        const own = concept ?? String(next);
        if (concept === null) next += 1;
        records.set(id, { concept: own, published: false, creators: [], restricted: false });
        return id;
    }

    /** The newest published record of a concept, or null. */
    function latest(concept: string): string | null {
        const ids = [...records.entries()]
            .filter(([, held]) => held.concept === concept && held.published)
            .map(([id]) => Number(id));
        return ids.length === 0 ? null : String(Math.max(...ids));
    }

    function route(method: string, path: string, call: ZenodoCall): Response {
        const parts = path.split('/').slice(3);
        const [id, part, ...rest] = parts;
        if (method === 'POST' && parts.length === 0) {
            const created = made(null);
            keep(created, call.body);
            return answer(201, draft(created));
        }
        if (method === 'GET' && parts.length === 1) {
            if (records.get(id)?.published === true) return answer(200, record(id));
            const newest = latest(id);
            if (newest === null) return answer(404, { status: 404 });
            const location = `${ZENODO_ADDRESS}/records/${newest}`;
            return new Response(null, { status: 301, headers: { location } });
        }
        if (method === 'GET' && part === 'versions' && rest[0] === 'latest') {
            const concept = records.get(id)?.concept ?? id;
            const newest = latest(concept);
            if (newest === null) return answer(404, { status: 404 });
            const location = `${ZENODO_ADDRESS}/records/${newest}`;
            return new Response(null, { status: 301, headers: { location } });
        }
        if (method === 'POST' && part === 'versions') {
            const concept = records.get(id)?.concept ?? id;
            return answer(201, draft(made(concept)));
        }
        if (method === 'GET' && part === 'draft' && rest.length === 0) {
            const open = records.get(id)?.published === false;
            return open ? answer(200, draft(id)) : answer(404, { status: 404 });
        }
        if (method === 'PUT' && part === 'draft' && rest.length === 0) {
            keep(id, call.body);
            return answer(200, draft(id));
        }
        if (method === 'DELETE' && part === 'draft') {
            records.delete(id);
            return answer(204, null);
        }
        if (part === 'draft' && rest[0] === 'files') {
            if (method === 'POST' && rest.length === 1) {
                const keys = Array.isArray(call.body) ? (call.body as { key: string }[]) : [];
                return answer(201, {
                    entries: keys.map((one) => ({ key: one.key, status: 'pending' }))
                });
            }
            const key = decodeURIComponent(rest[1] ?? '');
            if (method === 'PUT' && rest[2] === 'content') {
                bytes.set(key, call.bytes ?? new Uint8Array());
                return answer(200, { key, status: 'pending' });
            }
            if (method === 'POST' && rest[2] === 'commit') {
                return answer(200, { key, status: 'completed' });
            }
        }
        if (method === 'POST' && part === 'draft' && rest.join('/') === 'actions/publish') {
            const held = records.get(id);
            if (held !== undefined) held.published = true;
            return answer(202, { id, is_published: true, parent: { id: held?.concept ?? id } });
        }
        if (method === 'POST' && part === 'access' && rest[0] === 'links') {
            links += 1;
            const body = call.body as { permission?: string } | null;
            return answer(201, {
                id: `link-${String(links)}`,
                created_at: '2026-10-30T10:00:00+00:00',
                expires_at: null,
                permission: body?.permission ?? '',
                description: '',
                token: `share-${id}`
            });
        }
        return answer(404, { status: 404, message: `no such call: ${method} ${path}` });
    }

    const fetcher: typeof fetch = async (input, init) => {
        const address = input instanceof Request ? input.url : String(input);
        const method = (init?.method ?? 'GET').toUpperCase();
        if (!address.startsWith(`${ZENODO_ADDRESS}/`)) {
            stray.push(address);
            throw new Error(`a request outside the deposit address: ${address}`);
        }
        const path = new URL(address).pathname;
        const raw = init?.body;
        const call: ZenodoCall = { method, path, headers: headersOf(init), body: null };
        if (raw instanceof Uint8Array) call.bytes = raw;
        else if (typeof raw === 'string') call.body = JSON.parse(raw) as unknown;
        calls.push(call);
        const signal = init?.signal;
        if (setup.hold?.(method, path) === true) {
            await new Promise<void>((go, refuse) => {
                const stop = (): void => {
                    refuse(signal?.reason instanceof Error ? signal.reason : new Error('aborted'));
                };
                waiting.push(go);
                if (signal?.aborted === true) stop();
                else signal?.addEventListener('abort', stop, { once: true });
                setup.held?.();
            });
        }
        if (signal?.aborted === true) throw signal.reason;
        const own = setup.status?.(method, path);
        if (own !== undefined) return failing(own);
        const routed = route(method, path, call);
        const late = setup.after?.(method, path);
        return late === undefined ? routed : failing(late);
    };

    return {
        fetch: fetcher,
        calls,
        stray,
        uploads: () =>
            Object.fromEntries(
                [...bytes.entries()].map(([key, zip]) => [
                    key,
                    Object.fromEntries(
                        Object.entries(unzipSync(zip)).map(([name, held]) => [
                            name,
                            strFromU8(held)
                        ])
                    )
                ])
            ),
        release: () => {
            for (const go of waiting.splice(0)) go();
        }
    };
}
