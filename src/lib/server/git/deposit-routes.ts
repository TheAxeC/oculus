// Layer 2, server. The /api/deposit endpoint. A route module may export only its verbs, so
// everything the request does is here and src/routes/api/(git)/deposit/+server.ts is the few lines
// that join them, the pattern lib/server/git/git-routes.ts already holds.
//
// A GET answers the mirror's state and is same-origin only, like every read. A POST writes, and
// carries three things: the write token, this application's own origin, and, for the five actions
// that can lose work (commit, push, snapshot, createBranch, switchBranch), a `confirm: true` the
// page sets only from the confirm dialog. DESIGN.md's decision on git writes and the
// deposit is that shape: every write behind the token and a confirm.
//
// The ids a deposit may name are the hub's own project manifests and the projects the last
// published `portfolio` payload holds; anything else is a 404, before any command is run.
//
// Every operation is an option with a real default, so tests/routes/git/deposit.test.ts drives the
// whole endpoint without running git or `gh` at all.

import { hasToken, sameOrigin } from '../core/auth.ts';
import { byKey } from '../../data/helpers/guards.ts';
import {
    adopt,
    branches,
    commit,
    createBranch,
    projectIds,
    push,
    snapshot,
    state,
    switchBranch,
    sync,
    type MirrorState,
    type Plan,
    type DepositOptions as ServerDepositOptions
} from './deposit.ts';
import type { Branch, Outcome } from './deposit-git.ts';

/** Every action POST /api/deposit knows. */
export const ACTIONS = [
    'adopt',
    'plan',
    'commit',
    'push',
    'snapshot',
    'branches',
    'createBranch',
    'switchBranch'
];

/** The actions that write outside this machine or over `code/`, and therefore need the confirm. */
export const CONFIRMED = ['commit', 'push', 'snapshot', 'createBranch', 'switchBranch'];

/**
 * What one action answers: the outcome, plus the plan or the branches on the two that read them.
 */
export type DepositAnswer = Outcome & { plan?: Plan | null; branches?: Branch[] };

/** One action, the project it is for, and whatever fields it takes. */
export type DepositRun = (
    action: string,
    id: string,
    fields: Record<string, unknown>
) => Promise<DepositAnswer>;

export type DepositOptions = {
    /** What an action does; the real server/git/deposit.ts operations when absent. */
    run?: DepositRun;
    /** Which project ids a request may name. */
    idsFor?: () => string[];
    /** What a GET answers; the real mirror state when absent. */
    stateFor?: (id: string) => Promise<MirrorState | null>;
    /**
     * What the real operations run with: the context's plan memory, the mirrors folder, the hub.
     */
    deposit?: ServerDepositOptions;
};

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
}

function text(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

/** The real operations, one per action. */
const OPERATIONS: Record<
    string,
    (
        id: string,
        fields: Record<string, unknown>,
        with_: ServerDepositOptions
    ) => Promise<DepositAnswer>
> = {
    adopt: (id, _fields, with_) => adopt(id, with_),
    plan: (id, _fields, with_) => sync(id, with_),
    commit: (id, fields, with_) => commit(id, text(fields.message), with_),
    push: (id, _fields, with_) => push(id, with_),
    snapshot: (id, fields, with_) => snapshot(id, text(fields.message), with_),
    branches: (id, _fields, with_) => branches(id, with_),
    createBranch: (id, fields, with_) => createBranch(id, text(fields.name), with_),
    switchBranch: (id, fields, with_) => switchBranch(id, text(fields.name), with_)
};

function operate(with_: ServerDepositOptions): DepositRun {
    return (action, id, fields) => {
        const operation = byKey(OPERATIONS, action);
        if (operation === undefined) {
            return Promise.resolve({
                ok: false,
                output: '',
                error: `no deposit action named ${action}`
            });
        }
        return operation(id, fields, with_);
    };
}

/**
 * The hub's own project ids, and the ones the last published portfolio payload named. The hub is
 * the one the engine directory says, so a project the payload does not carry, and every project
 * before the first publish, is still a project this endpoint answers for.
 */
export function knownIds(published: string[] = [], engine?: string): string[] {
    const ids = new Set<string>(published);
    try {
        for (const id of projectIds({ engine })) ids.add(id);
    } catch {
        // A caller that names no engine, or one whose configuration does not read, still answers
        // for the ids it supplied.
    }
    return [...ids];
}

/**
 * GET /api/deposit?id=: the mirror's state, for the panel's first render. A read, so it carries no
 * token, but it is still refused to another origin and to an id the portfolio does not hold.
 */
export async function handleDepositState(
    request: Request,
    options: DepositOptions = {}
): Promise<Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    const id = new URL(request.url).searchParams.get('id') ?? '';
    if (!(options.idsFor ?? knownIds)().includes(id)) {
        return json(404, { error: 'the portfolio holds no project with that id' });
    }
    const answer = await (options.stateFor ?? ((held) => state(held, options.deposit)))(id);
    if (answer === null) return json(404, { error: 'the portfolio holds no project with that id' });
    return json(200, { ok: true, state: answer });
}

/**
 * POST /api/deposit: one action on one project. The order is the order of the refusals: the origin,
 * the token, the body, the action, the project, the confirm, and only then git.
 */
export async function handleDeposit(
    request: Request,
    token: string,
    options: DepositOptions = {}
): Promise<Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    if (!hasToken(request, token)) {
        return json(403, { error: 'the write token is missing or stale' });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return json(400, { error: 'the body is not JSON' });
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return json(400, { error: 'the body is not a deposit action' });
    }
    const fields = body as Record<string, unknown>;
    const action = text(fields.action);
    if (!ACTIONS.includes(action)) {
        return json(400, { error: 'the body is not a deposit action' });
    }
    const id = text(fields.id);
    if (!(options.idsFor ?? knownIds)().includes(id)) {
        return json(404, { error: 'the portfolio holds no project with that id' });
    }
    if (CONFIRMED.includes(action) && fields.confirm !== true) {
        return json(400, { error: 'this action needs the page to confirm it' });
    }

    const outcome = await (options.run ?? operate(options.deposit ?? {}))(action, id, fields);
    if (!outcome.ok) {
        return json(400, { error: outcome.error, plan: outcome.plan ?? null });
    }
    return json(200, {
        ok: true,
        output: outcome.output,
        plan: outcome.plan ?? null,
        branches: outcome.branches ?? []
    });
}
