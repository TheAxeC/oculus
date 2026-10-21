// Layer 2, server. The three terminal-route steps a hub task adds to the composer's start: the seed
// the page shows for a task, the approval of a seed, and the check a start that carries a task
// passes ahead of any run. routes.ts holds the actions; the rules are here.
//
// A start with a task is checked in this order, each step answering one word of TERMINAL_REFUSALS:
// the agent is Claude or Codex (`task-needs-agent`), the task is in the hub (`task-unknown`), the
// seed built now is the seed the page showed (`task-changed`), and the seed with the reader's own
// words fits the longest prompt (`task-too-long`). The permission question (`needs-confirm`) is
// asked by compose() on the argv, after these. A start whose seed, folder and agent were never
// approved on this machine answers the approval instead of starting; the approval text is the
// agent, the real path of the folder and the seed, so the reader's own words stay outside it and a
// changed seed or a moved folder asks again.

import { resolve } from 'node:path';
import type { HubSettings } from '../../../../data/index.ts';
import type { ComposeStart, TaskRef } from '../../../../data/model/index.ts';
import { PROMPT_MAX } from '../../../../data/helpers/run/schedules.ts';
import { splitHubId } from '../../../../data/helpers/hub-names.ts';
import { textCatalog } from '../../../../data/sources/config.ts';
import { primaryConfig, hubTargets } from '../../../files/roots.ts';
import type { OpenWorkspace } from '../../../files/workspace/open.ts';
import { realPath } from '../../../core/paths.ts';
import { approveTexts, isApproved } from '../../approvals/approvals.ts';
import { TerminalRefused } from '../../pty/refusal.ts';
import { taskSeed } from './task-seed.ts';

/**
 * What the task steps read of the request's server: the open workspace (its primary hub, and the
 * other hubs whose tasks are named `<hub name>:<id>`), the merged config and the settings of each
 * other hub as the server keeps them parsed.
 */
export type SeedSource = {
    open: OpenWorkspace;
    merged: Record<string, unknown>;
    settings: HubSettings;
};

/** The seed, folder and terminal name of a task, as the page is shown them. */
export type SeedFacts = { seed: string; cwd: string; name: string };

/** The facts a reference names, or the refusal word thrown as a TerminalRefused. */
export function seedFacts(ref: TaskRef, source: SeedSource): SeedFacts {
    const hubs = hubTargets(source.open, source.settings);
    const named = splitHubId(
        ref.collection ?? ref.id,
        hubs.map((one) => one.key),
        source.open.primary
    );
    const owner = hubs.find((one) => one.key === named.root);
    const home = owner?.hub ?? source.open.primaryDir;
    // A bare id belongs to the primary, so a workspace with no primary has no such task.
    if (home === null) throw new TerminalRefused('no-primary');
    const config = owner?.config ?? primaryConfig(source.merged, source.open, source.settings);
    const bare: TaskRef = owner === undefined ? ref : withoutHub(ref, owner.key);
    const answer = taskSeed(bare, home, config, textCatalog(source.merged));
    if (!answer.ok) throw new TerminalRefused(answer.word);
    return { seed: answer.seed, cwd: answer.cwd, name: answer.name };
}

/** The reference with the hub's prefix off the ids of its collection and its task. */
function withoutHub(ref: TaskRef, key: string): TaskRef {
    const bare = (id: string): string => splitHubId(id, [key], null).id;
    return {
        ...ref,
        id: bare(ref.id),
        ...(ref.collection === undefined ? {} : { collection: bare(ref.collection) })
    };
}

/** The text a seed is approved by: the agent, the folder's real path and the seed. */
function seedApprovalText(agent: string, cwd: string, seed: string): string {
    return JSON.stringify({ agent, cwd: realPath(cwd) ?? resolve(cwd), seed }, null, 1);
}

/** The facts of a seed the page sent back, or `task-changed` when the hub says otherwise now. */
function currentSeed(ref: TaskRef, shown: string, source: SeedSource): SeedFacts {
    const facts = seedFacts(ref, source);
    if (facts.seed !== shown) throw new TerminalRefused('task-changed');
    return facts;
}

/** The prompt and terminal name of a start that carries a task, with the seed they came from. */
export type TaskPrompt = { prompt: string; name: string; seed: string };

/** The approval a start asks for ahead of its run: the seed, the folder's real path, the agent. */
export type SeedApproval = { seed: string; cwd: string; agent: string };

/**
 * The prompt and name of a start that carries a task, after the first three checks of the file
 * head: the seed alone, or the seed, a blank line and the reader's own words.
 */
export function taskPrompt(request: ComposeStart, ref: TaskRef, source: SeedSource): TaskPrompt {
    if (request.agent === 'shell') throw new TerminalRefused('task-needs-agent');
    const facts = currentSeed(ref, request.seed, source);
    const prompt = request.prompt.trim() === '' ? facts.seed : `${facts.seed}\n\n${request.prompt}`;
    if (prompt.length > PROMPT_MAX) throw new TerminalRefused('task-too-long');
    return { prompt, name: facts.name, seed: facts.seed };
}

/** The approval a start asks for, or null when its seed, folder and agent are approved. */
export function seedApproval(
    request: ComposeStart,
    seed: string,
    approvals: string
): SeedApproval | null {
    const cwd = realPath(request.cwd) ?? resolve(request.cwd);
    if (isApproved(approvals, seedApprovalText(request.agent, cwd, seed))) return null;
    return { seed, cwd, agent: request.agent };
}

/** Approve a seed: the refusal word thrown when the file is left as it was, with its path. */
export function approveSeed(
    ref: TaskRef,
    message: { seed: string; cwd: string; agent: string },
    source: SeedSource,
    approvals: string
): void {
    if (message.agent !== 'claude' && message.agent !== 'codex') {
        throw new TerminalRefused('task-needs-agent');
    }
    const facts = currentSeed(ref, message.seed, source);
    const done = approveTexts(approvals, [
        seedApprovalText(message.agent, message.cwd, facts.seed)
    ]);
    if (!done.ok) throw new TerminalRefused('approvals-unwritable', [approvals]);
}
