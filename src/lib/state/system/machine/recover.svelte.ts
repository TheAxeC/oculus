// Layer 2, client state. What the Recover view and Live HPC's Login node section know of Recover.
// The plan, access, run and log GET /api/recover answers for one hub, key and target are held in
// the client state's query client under that triple, so two views of one dataset share one answer
// and a hidden tab asks nothing (state/client/queries/tab-scope.ts). The view asks when it opens,
// after every action it sends and on its refresh control, and at no other time.
//
// Between those the runs come from the `recover` channel the server pushes: each run's state,
// bytes, rate and last log lines, and each cluster's login node sessions, which that cluster's
// Login node section draws. A target is this Mac (`mac`) or the key of a cluster of
// `slurm.resource`. A pushed run reading is newer than the answer when its version is above the
// channel's version the answer was given at. An action is a POST with the write token
// (state/shared/stores/token-post.ts), answered with the run started or the reason it was refused,
// which the view words from its catalog.

import { z } from 'zod';
import type {
    RecoverLive,
    RecoverLiveRun,
    RecoverSession,
    RecoverState
} from '../../../data/model/index.ts';
import { readJson } from '../../../data/shapes/shapes.ts';
import { failedAnswer } from '../../shared/answers/answers.ts';
import { inBrowser } from '../../shared/stores/in-browser.ts';
import type { Queries } from '../../shared/stores/shapes.ts';
import { postWithToken, type TokenSource } from '../../shared/stores/token-post.ts';

/** The target a dataset is shown on: `mac` for this Mac, else the key of a cluster. */
export type RecoverTarget = string;

export { MAC_TARGET } from '../../../data/model/index.ts';

/** What a Recover action does. */
export type RecoverAction = 'fetch' | 'verify' | 'unpack' | 'stop';

const checksumShape = z.object({ kind: z.enum(['sha256', 'md5', 'sha1']), value: z.string() });

const rowShape = z.object({
    name: z.string(),
    size: z.number().nullable(),
    checksum: checksumShape.nullable(),
    url: z.string(),
    source: z.number(),
    service: z.enum(['physionet', 'kaggle', 'synapse']).optional(),
    unpack: z.object({ strip: z.number(), folder: z.string().optional() }).optional(),
    throttle: z.string().optional(),
    state: z.enum(['verified', 'present', 'partial', 'different', 'missing']),
    have: z.number()
});

const runShape = z
    .object({
        action: z.enum(['fetch', 'verify', 'unpack']),
        done: z.number().optional(),
        total: z.number().optional(),
        job: z.string().optional()
    })
    .nullable();

const stateShape = z.object({
    target: z.string(),
    folder: z.string(),
    access: z.array(
        z.object({
            service: z.enum(['physionet', 'kaggle', 'synapse']),
            state: z.enum(['ok', 'missing', 'unreachable']),
            row: z.boolean(),
            status: z.number().optional()
        })
    ),
    granted: z.boolean(),
    plan: z
        .object({
            rows: z.array(rowShape),
            totals: z.object({
                files: z.number(),
                bytes: z.number(),
                missing: z.number(),
                unsized: z.number(),
                free: z.number().nullable()
            })
        })
        .nullable(),
    refusal: z
        .object({
            refused: z.enum(['access', 'status', 'answer', 'name', 'missing', 'network']),
            source: z.string(),
            status: z.number().optional(),
            name: z.string().optional()
        })
        .nullable(),
    run: runShape,
    log: z.array(z.string()),
    live: z.number()
}) satisfies z.ZodType<RecoverState>;

/**
 * A refusal of the route: its reason, and for a cluster with no host or a target that is no
 * cluster of `slurm.resource` the sentence that says why.
 */
const refusalShape = z.object({ refused: z.string(), hint: z.string().optional() });

const liveRunShape = z.object({
    hub: z.string(),
    key: z.string(),
    target: z.string(),
    state: z.enum(['running', 'ended']),
    run: runShape,
    bytes: z.number(),
    size: z.number().nullable(),
    rate: z.number().nullable(),
    growing: z.array(z.object({ name: z.string(), have: z.number(), rate: z.number() })),
    log: z.array(z.string()),
    version: z.number()
}) satisfies z.ZodType<RecoverLiveRun>;

const sessionShape = z.object({
    hub: z.string(),
    key: z.string(),
    done: z.number(),
    total: z.number().nullable(),
    rate: z.number().nullable()
}) satisfies z.ZodType<RecoverSession>;

/** What the view reads for one dataset on one target. */
type Held = {
    state: RecoverState | null;
    /** The route's reason for answering no state (`host`, `place`, `kind`), or the empty text. */
    refused: string;
    /** The sentence the route gives with `host`. */
    hint: string;
    /** What the request failed with, or the empty text. */
    error: string;
    loading: boolean;
};

const PENDING: Held = { state: null, refused: '', hint: '', error: '', loading: true };

/**
 * What an action answers: the run started, or the reason it was not, with the sentence the route
 * gives for a cluster it cannot reach (`hint`, else empty).
 */
type ActionAnswer = { ok: true } | { ok: false; refused: string; hint: string; error: string };

/** The Recover answers and pushes of one client. */
export type RecoverStore = {
    dataset: (hub: string, key: string, target: RecoverTarget) => Held;
    reload: (hub: string, key: string, target: RecoverTarget, fresh?: boolean) => void;
    act: (
        hub: string,
        key: string,
        target: RecoverTarget,
        action: RecoverAction,
        file?: string
    ) => Promise<ActionAnswer>;
    /**
     * The newest pushed reading of a dataset's run on a target when it is newer than the answer
     * given at the channel's version `after`, else null.
     */
    pushed: (
        hub: string,
        key: string,
        target: RecoverTarget,
        after: number
    ) => RecoverLiveRun | null;
    /** The login node's sessions of the cluster `resource` at its last reading, or null before. */
    sessions: (resource: string) => RecoverSession[] | null;
};

/** The address of the GET of one dataset. */
function address(params: Record<string, string>): string {
    return `/api/recover?${new URLSearchParams(params).toString()}`;
}

/** The items of a list that read as the shape; one that does not is left out. */
function itemsOf<T>(items: unknown[], shape: z.ZodType<T>): T[] {
    return items.flatMap((one) => {
        const read = shape.safeParse(one);
        return read.success ? [read.data] : [];
    });
}

export function createRecover(
    queries: Queries,
    writes: TokenSource,
    live: () => RecoverLive | null
): RecoverStore {
    async function ask(
        hub: string,
        key: string,
        target: RecoverTarget,
        fresh: boolean
    ): Promise<Held> {
        const failed = (error: string): Held => ({ ...PENDING, error, loading: false });
        try {
            const response = await fetch(
                address({ hub, key, target, ...(fresh ? { fresh: '1' } : {}) })
            );
            const raw = await readJson(response);
            const refusal = refusalShape.safeParse(raw);
            if (refusal.success) {
                return {
                    ...PENDING,
                    ...refusal.data,
                    hint: refusal.data.hint ?? '',
                    loading: false
                };
            }
            if (raw === undefined || !response.ok) return failed(failedAnswer(response, raw));
            const state = stateShape.safeParse(raw);
            return state.success
                ? { state: state.data, refused: '', hint: '', error: '', loading: false }
                : failed(failedAnswer(response, raw));
        } catch (error) {
            return failed(error instanceof Error ? error.message : String(error));
        }
    }

    function dataset(hub: string, key: string, target: RecoverTarget): Held {
        if (hub === '' || key === '') return { ...PENDING, loading: false };
        return (
            queries.read(['recover', hub, key, target], () => ask(hub, key, target, false), {
                enabled: inBrowser()
            }).data ?? PENDING
        );
    }

    function reload(hub: string, key: string, target: RecoverTarget, fresh = false): void {
        if (hub === '' || key === '' || !inBrowser()) return;
        queries.refetch(['recover', hub, key, target], () => ask(hub, key, target, fresh), 'drop');
    }

    async function act(
        hub: string,
        key: string,
        target: RecoverTarget,
        action: RecoverAction,
        file?: string
    ): Promise<ActionAnswer> {
        try {
            const response = await postWithToken(
                '/api/recover',
                { action, hub, key, target, ...(file === undefined ? {} : { file }) },
                writes
            );
            const raw = await readJson(response);
            reload(hub, key, target);
            const refusal = refusalShape.safeParse(raw);
            if (refusal.success) {
                const { refused, hint = '' } = refusal.data;
                return { ok: false, refused, hint, error: '' };
            }
            if (!response.ok) {
                return { ok: false, refused: '', hint: '', error: failedAnswer(response, raw) };
            }
            return { ok: true };
        } catch (error) {
            return {
                ok: false,
                refused: '',
                hint: '',
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    function pushed(
        hub: string,
        key: string,
        target: RecoverTarget,
        after: number
    ): RecoverLiveRun | null {
        const runs = itemsOf(live()?.runs ?? [], liveRunShape);
        const found = runs.find(
            (one) => one.hub === hub && one.key === key && one.target === target
        );
        return found !== undefined && found.version > after ? found : null;
    }

    function sessions(resource: string): RecoverSession[] | null {
        const held = live()?.sessions;
        const listed =
            held !== undefined && Object.hasOwn(held, resource) ? held[resource] : undefined;
        return listed === undefined ? null : itemsOf(listed, sessionShape);
    }

    return { dataset, reload, act, pushed, sessions };
}
