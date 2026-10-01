// Layer 2, server. The /api/deposit endpoint. A route module may export only its verbs, so
// everything the request does is here and src/routes/api/(git)/deposit/+server.ts is the few lines
// that join them, the pattern lib/server/git/git-routes.ts already holds.
//
// A GET answers the mirror's state, reaching this module only past the origin guard in
// src/hooks.server.ts's `handle`, as the POST does too. A POST writes, and carries two things: the
// write token and, for the five actions that can lose work (commit, push, snapshot, createBranch,
// switchBranch), a `confirm: true` the page sets only from the confirm dialog. DESIGN.md's decision
// on git writes and the deposit is that shape: every write behind the token and a confirm.
//
// The ids a deposit may name are the hub's own project manifests and the projects the last
// published `portfolio` payload holds; anything else is a 404, before any command is run.
//
// Every operation is an option with a real default, so tests/routes/git/deposit.test.ts drives the
// whole endpoint without running git or `gh` at all.

import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { tokenedBody } from '../core/auth.ts';
import { unconfirmed } from './git-routes.ts';
import { byKey, isMap } from '../../data/helpers/guards.ts';
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
] as const;

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

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/** A text field the page sends as a string; anything else reads as the empty text. */
const textFieldShape = z.string().catch('');

/** The body of POST /api/deposit: the action among ACTIONS and the fields an action reads. */
const depositBodyShape = z.looseObject({
    action: z.enum(ACTIONS),
    id: textFieldShape,
    message: textFieldShape,
    name: textFieldShape
});

type DepositBody = z.output<typeof depositBodyShape>;

/** The refusal of a body that is no deposit action, answered before anything else is read. */
function notAnAction(): Response {
    return json({ error: 'the body is not a deposit action' }, { status: 400, headers: NO_STORE });
}

/** The real operations, one per action. */
const OPERATIONS: Record<
    string,
    (id: string, fields: DepositBody, with_: ServerDepositOptions) => Promise<DepositAnswer>
> = {
    adopt: (id, _fields, with_) => adopt(id, with_),
    plan: (id, _fields, with_) => sync(id, with_),
    commit: (id, fields, with_) => commit(id, fields.message, with_),
    push: (id, _fields, with_) => push(id, with_),
    snapshot: (id, fields, with_) => snapshot(id, fields.message, with_),
    branches: (id, _fields, with_) => branches(id, with_),
    createBranch: (id, fields, with_) => createBranch(id, fields.name, with_),
    switchBranch: (id, fields, with_) => switchBranch(id, fields.name, with_)
};

function operate(with_: ServerDepositOptions, parsed: DepositBody): DepositRun {
    return (action, id) => {
        const operation = byKey(OPERATIONS, action);
        if (operation === undefined) {
            return Promise.resolve({
                ok: false,
                output: '',
                error: `no deposit action named ${action}`
            });
        }
        return operation(id, parsed, with_);
    };
}

/**
 * The hub's own project ids, and the ones the last published portfolio payload named. The hub is
 * the one the engine directory says, so a project the payload does not carry, and every project
 * before the first publish, is still a project this endpoint answers for.
 */
export function knownIds(
    published: string[] = [],
    engine?: string,
    config?: Record<string, unknown>
): string[] {
    const ids = new Set<string>(published);
    try {
        for (const id of projectIds({ engine, config })) ids.add(id);
    } catch {
        // A caller that names no engine, or one whose configuration does not read, still answers
        // for the ids it supplied.
    }
    return [...ids];
}

/**
 * GET /api/deposit?id=: the mirror's state, for the panel's first render. A read, so it carries no
 * token; it is refused to an id the portfolio does not hold.
 */
export async function handleDepositState(
    request: Request,
    options: DepositOptions = {}
): Promise<Response> {
    const id = new URL(request.url).searchParams.get('id') ?? '';
    if (!(options.idsFor ?? knownIds)().includes(id)) {
        return json(
            { error: 'the portfolio holds no project with that id' },
            { status: 404, headers: NO_STORE }
        );
    }
    const answer = await (options.stateFor ?? ((held) => state(held, options.deposit)))(id);
    if (answer === null)
        return json(
            { error: 'the portfolio holds no project with that id' },
            { status: 404, headers: NO_STORE }
        );
    return json({ ok: true, state: answer }, { headers: NO_STORE });
}

/**
 * POST /api/deposit: one action on one project. The order is the order of the refusals: the token,
 * the body, the action, the project, the confirm, and only then git.
 */
export async function handleDeposit(
    request: Request,
    token: string,
    options: DepositOptions = {}
): Promise<Response> {
    const read = await tokenedBody(request, token, { headers: NO_STORE });
    if (read instanceof Response) return read;
    const body = read.body;
    if (!isMap(body)) return notAnAction();
    const parsed = depositBodyShape.safeParse(body);
    if (!parsed.success) return notAnAction();
    const { action, id } = parsed.data;
    if (!(options.idsFor ?? knownIds)().includes(id)) {
        return json(
            { error: 'the portfolio holds no project with that id' },
            { status: 404, headers: NO_STORE }
        );
    }
    const refused = unconfirmed(CONFIRMED, action, body);
    if (refused !== null) return refused;

    const outcome = await (options.run ?? operate(options.deposit ?? {}, parsed.data))(
        action,
        id,
        body
    );
    if (!outcome.ok) {
        return json(
            { error: outcome.error, plan: outcome.plan ?? null },
            { status: 400, headers: NO_STORE }
        );
    }
    return json(
        {
            ok: true,
            output: outcome.output,
            plan: outcome.plan ?? null,
            branches: outcome.branches ?? []
        },
        { headers: NO_STORE }
    );
}
