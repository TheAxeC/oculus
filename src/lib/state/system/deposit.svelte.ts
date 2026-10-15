// Layer 2, client state. What the deposit panel knows about one project's mirror.
//
// The mirror lives outside the hub tree, under ~/.oculus/deposits, so nothing about it is in the
// snapshot: it is fetched from GET /api/deposit the first time a panel asks for a project, and read
// again after every write the panel makes. The wire shapes below are declared here rather than
// imported, since the boundary table of DESIGN.md lets `state/` import `data/model` and nothing of
// `server/`; server/git/deposit/deposit.ts holds the same shapes on its own side.
//
// The answer is held in the client state's query client, and the fetch is scheduled on a microtask
// by state/client/queries/queries.svelte.ts rather than run inside the call, so reading this from a
// $derived never writes state while a derived is running. It is only ever made in the browser: a
// server-rendered page holds nothing and asks for nothing.

import { z } from 'zod';
import { readJson } from '../../data/shapes/shapes.ts';
import { failedAnswer } from '../shared/answers/answers.ts';
import type { Queries } from '../shared/stores/shapes.ts';
import { inBrowser } from '../shared/stores/in-browser.ts';

/** One thing the deposit's scan found. The words are the panel's; this says what and where. */
export type Finding = { kind: string; path: string; mb: number };

/** One path `git status --porcelain=v1 -z` reported, with git's own two letters. */
export type Change = { path: string; letters: string };

/** What a plan answers: what would ship, what moved, and what the scan objected to. */
export type Plan = {
    repo: string;
    mirror: string;
    branch: string;
    remote: string;
    files: string[];
    changes: Change[];
    findings: Finding[];
};

/** The current branch against `origin/main`, and the files the mirror's commits differ in. */
export type MainComparison = { known: boolean; ahead: number; behind: number; differ: string[] };

/** The mirror's state, as GET /api/deposit answers it. */
export type MirrorState = {
    id: string;
    repo: string;
    mirror: string;
    exists: boolean;
    branch: string;
    remote: string;
    /** Commits the current branch is ahead of its upstream. */
    ahead: number;
    main: MainComparison;
    plan: Plan | null;
};

const findingShape = z.object({
    kind: z.string(),
    path: z.string(),
    mb: z.number()
}) satisfies z.ZodType<Finding>;

const changeShape = z.object({ path: z.string(), letters: z.string() }) satisfies z.ZodType<Change>;

const planShape = z.object({
    repo: z.string(),
    mirror: z.string(),
    branch: z.string(),
    remote: z.string(),
    files: z.array(z.string()),
    changes: z.array(changeShape),
    findings: z.array(findingShape)
}) satisfies z.ZodType<Plan>;

const mainShape = z.object({
    known: z.boolean(),
    ahead: z.number(),
    behind: z.number(),
    differ: z.array(z.string())
}) satisfies z.ZodType<MainComparison>;

/** A state whose every field is of its type; one that is not whole reads as no state. */
const mirrorStateShape = z.object({
    id: z.string(),
    repo: z.string(),
    mirror: z.string(),
    exists: z.boolean(),
    branch: z.string(),
    remote: z.string(),
    ahead: z.number(),
    main: mainShape,
    plan: planShape.nullable()
}) satisfies z.ZodType<MirrorState>;

/** What GET /api/deposit answers: the state. */
const bodyShape = z.object({
    state: mirrorStateShape.nullable().catch(null)
});

/** What the panel reads for one project. */
export type Held = {
    state: MirrorState | null;
    /** What the request failed with, or the empty string. */
    error: string;
    /** True while the first answer for the project is still to come. */
    loading: boolean;
};

/** What a project reads as before its answer arrives. */
const PENDING: Held = { state: null, error: '', loading: true };

/** What no project at all reads as: an empty id asks nothing and waits for nothing. */
const NOTHING: Held = { state: null, error: '', loading: false };

/** The two texts of one file, or the sentence that says why they were not given. */
export type FileTexts =
    { ok: true; original: string; modified: string } | { ok: false; error: string };

const textsShape = z.object({ original: z.string(), modified: z.string() });

/** The deposit mirror of each project, held for one client. */
export type DepositStore = {
    /**
     * The two texts of a file of the sync plan (`plan`) or of the files the mirror's commits and
     * `origin/main` differ in (`main`), for the diff editor.
     */
    texts: (id: string, against: 'plan' | 'main', path: string) => Promise<FileTexts>;
    mirror: (id: string) => Held;
    hold: (id: string, state: MirrorState | null, error?: string) => void;
    reload: (id: string) => void;
};

/** What a request that failed leaves held: no state, and the sentence saying why. */
function failed(error: string): Held {
    return { state: null, error, loading: false };
}

export function createDeposit(queries: Queries): DepositStore {
    /** Ask for one project's mirror, answering what came back as the panel's held shape. */
    async function ask(id: string): Promise<Held> {
        try {
            const response = await fetch(`/api/deposit?id=${encodeURIComponent(id)}`);
            const raw = await readJson(response);
            if (raw === undefined || !response.ok) return failed(failedAnswer(response, raw));
            const body = bodyShape.safeParse(raw).data;
            return { state: body?.state ?? null, error: '', loading: false };
        } catch (error) {
            return failed(error instanceof Error ? error.message : String(error));
        }
    }

    async function texts(id: string, against: string, path: string): Promise<FileTexts> {
        const query = new URLSearchParams({ id, against, path });
        try {
            const response = await fetch(`/api/deposit?${query.toString()}`);
            const raw = await readJson(response);
            if (raw === undefined || !response.ok) {
                return { ok: false, error: failedAnswer(response, raw) };
            }
            const body = textsShape.safeParse(raw);
            return body.success
                ? { ok: true, ...body.data }
                : { ok: false, error: failedAnswer(response, raw) };
        } catch (error) {
            return { ok: false, error: error instanceof Error ? error.message : String(error) };
        }
    }

    /** The mirror of one project. The first call for a project asks the server. */
    function mirror(id: string): Held {
        if (id === '') return NOTHING;
        return (
            queries.read(['deposit', id], () => ask(id), { enabled: inBrowser() }).data ?? PENDING
        );
    }

    /**
     * Put a state in by hand. The panel does not call it.
     */
    function hold(id: string, state: MirrorState | null, error = ''): void {
        const held: Held = { state, error, loading: false };
        queries.hold(['deposit', id], held);
    }

    /** Ask again for one project, which is what the panel does after every write it makes. */
    function reload(id: string): void {
        if (id === '' || !inBrowser()) return;
        queries.refetch(['deposit', id], () => ask(id), 'drop');
    }

    return { mirror, hold, reload, texts };
}
