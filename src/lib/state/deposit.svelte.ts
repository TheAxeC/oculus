// Layer 2, client state. What the deposit panel knows about one project's mirror.
//
// The mirror lives outside the hub tree, under ~/.oculus/deposits, so nothing about it is in the
// snapshot: it is fetched from GET /api/deposit the first time a panel asks for a project, and read
// again after every write the panel makes. The wire shapes below are declared here rather than
// imported, since the boundary table of DESIGN.md lets `state/` import `data/model` and nothing of
// `server/`; server/deposit.ts holds the same three shapes on its own side.
//
// The fetch is scheduled on a microtask rather than run inside the call, so reading this from a
// $derived never writes state while a derived is running, and it is only ever made in the browser:
// a server-rendered page holds nothing and asks for nothing.

/** One thing the deposit's scan found. The words are the panel's; this says what and where. */
export type Finding = { kind: string; path: string; mb: number };

/** One path `git status --porcelain=v1` reported, with git's own two letters. */
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

export function createDeposit(): DepositStore {
    const held: Record<string, Held | undefined> = $state({});

    /** The projects with a request in flight, so a second render does not send a second request. */
    const inflight = new Set<string>();

    /** The mirror of one project. The first call for a project asks the server. */
    function mirror(id: string): Held {
        if (id === '') return NOTHING;
        const one = held[id];
        if (one === undefined) request(id);
        return one ?? PENDING;
    }

    /**
     * Put a state in by hand. The panel does not call it; tests/views/deposit.test.ts does, because
     * there is no fetch in a server-rendered test and a panel with nothing held renders its first line
     * and stops.
     */
    function hold(id: string, state: MirrorState | null, error = ''): void {
        held[id] = { state, error, loading: false };
    }

    /** Ask again for one project, which is what the panel does after every write it makes. */
    function reload(id: string): void {
        if (id === '') return;
        request(id);
    }

    /** Schedule one fetch, off the caller's stack so no state is written inside a derived. */
    function request(id: string): void {
        if (inflight.has(id)) return;
        inflight.add(id);
        queueMicrotask(() => {
            void load(id);
        });
    }

    async function load(id: string): Promise<void> {
        try {
            // There is no fetch while the page is rendered on the server, and nothing to show there
            // either: the panel stays pending and the browser asks for it on the first client render.
            if (typeof window === 'undefined' || typeof fetch !== 'function') return;
            const response = await fetch(`/api/deposit?id=${encodeURIComponent(id)}`);
            const body = (await response.json()) as { state?: MirrorState; error?: string };
            if (!response.ok) {
                held[id] = {
                    state: null,
                    error: body.error ?? String(response.status),
                    loading: false
                };
                return;
            }
            held[id] = { state: body.state ?? null, error: '', loading: false };
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            held[id] = { state: null, error: reason, loading: false };
        } finally {
            inflight.delete(id);
        }
    }

    return { mirror, hold, reload };
}
