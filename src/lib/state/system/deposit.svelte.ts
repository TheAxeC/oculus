// Layer 2, client state. What the deposit panel knows about one project's mirror.
//
// The mirror lives outside the hub tree, under ~/.oculus/deposits, so nothing about it is in the
// snapshot: it is fetched from GET /api/deposit the first time a panel asks for a project, and read
// again after every write the panel makes. The wire shapes below are declared here rather than
// imported, since the boundary table of DESIGN.md lets `state/` import `data/model` and nothing of
// `server/`; server/git/deposit.ts holds the same three shapes on its own side.
//
// The answer is held in the client state's query client, and the fetch is scheduled on a microtask
// by state/client/queries.svelte.ts rather than run inside the call, so reading this from a
// $derived never writes state while a derived is running. It is only ever made in the browser: a
// server-rendered page holds nothing and asks for nothing.

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

/** The mirror's state, as GET /api/deposit answers it. */
export type MirrorState = {
    id: string;
    repo: string;
    mirror: string;
    exists: boolean;
    branch: string;
    remote: string;
    ahead: number;
    plan: Plan | null;
};

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

/** The deposit mirror of each project, held for one client. */
export type DepositStore = {
    mirror: (id: string) => Held;
    hold: (id: string, state: MirrorState | null, error?: string) => void;
    reload: (id: string) => void;
};

export function createDeposit(queries: Queries): DepositStore {
    /** Ask for one project's mirror, answering what came back as the panel's held shape. */
    async function ask(id: string): Promise<Held> {
        try {
            const response = await fetch(`/api/deposit?id=${encodeURIComponent(id)}`);
            const body = (await response.json()) as { state?: MirrorState; error?: string };
            if (!response.ok) {
                return {
                    state: null,
                    error: body.error ?? String(response.status),
                    loading: false
                };
            }
            return { state: body.state ?? null, error: '', loading: false };
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            return { state: null, error: reason, loading: false };
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
     * Put a state in by hand. The panel does not call it; tests/views/boards/deposit.test.ts does,
     * because there is no fetch in a server-rendered test and a panel with nothing held renders its
     * first line and stops.
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

    return { mirror, hold, reload };
}
