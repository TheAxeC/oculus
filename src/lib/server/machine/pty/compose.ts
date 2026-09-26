// Layer 2, server. What the composer's start runs: the agent's argument vector built from
// config/catalogs/agents.yml and the picks, the account's folder as the agent's environment, and
// the prompt as the vector's last word. GET /api/agents answers the same catalog to the page with
// the accounts local.yml names, so the pickers offer what a start accepts and nothing else.
//
// The vector goes to tmux as separate words and tmux runs it directly, so the prompt is one
// argument and no shell ever reads it: `$(...)`, quotes and semicolons reach the agent as the
// characters they are. `--` stands before the prompt, so a prompt beginning with a dash is the
// prompt and not an option, and a Codex `-i` list before it cannot swallow it.
//
// An account is a row of `accounts:` in local.yml, chosen by its label. Its folder reaches the
// agent as CLAUDE_CONFIG_DIR or CODEX_HOME through tmux's `-e`. The tool's own default folder
// (~/.claude, ~/.codex) is not passed as the variable: Claude Code reads its login from
// ~/.claude.json when the variable is unset and from `<dir>/.claude.json` when it is set, so the
// default account is started with the variable taken away by `env -u` instead, which is also what
// keeps a variable the tmux server inherited from choosing a different account.
//
// A shell takes no picks and no argv: it is the reader's own shell, and its prompt is the first
// command, typed into it as keys once it has started.

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import {
    cacheModels,
    choiceArgs,
    parseAgents,
    withCacheModels
} from '../../../data/sources/config/agents.ts';
import { configDir, loadLocalOrDefaults, type LocalConfig } from '../../../data/sources/config.ts';
import type {
    AgentAccount,
    AgentChoices,
    AgentId,
    AgentsAnswer,
    ComposeStart
} from '../../../data/model/index.ts';
import { sameOrigin } from '../../core/auth.ts';

/** The catalog's path under the engine's config folder. */
export const AGENTS_FILE = join('catalogs', 'agents.yml');

/** The environment variable each agent reads its account folder from. */
export const ACCOUNT_ENV: Record<AgentId, string> = {
    claude: 'CLAUDE_CONFIG_DIR',
    codex: 'CODEX_HOME'
};

/** The folder each agent uses when the variable is unset. */
export function defaultAccountDir(agent: AgentId): string {
    return join(homedir(), agent === 'claude' ? '.claude' : '.codex');
}

/** The largest prompt a start carries, which is far past anything typed into a box. */
export const PROMPT_MAX = 100_000;

/** The most images one Codex start attaches. */
export const IMAGES_MAX = 16;

/** The agents' accounts local.yml names, the two tools' own folders when it names none. */
export function agentAccounts(local: LocalConfig): AgentAccount[] {
    return local.accounts.map((one) => ({ tool: one.tool, label: one.label, dir: one.dir }));
}

/** The catalog, read from the engine's config folder; a missing file offers nothing. */
export function readAgentsFile(engine: string): ReturnType<typeof parseAgents> {
    let text: string;
    try {
        text = readFileSync(join(configDir(engine), AGENTS_FILE), 'utf8');
    } catch {
        return { agents: [], findings: [] };
    }
    return parseAgents(text);
}

/** The JSON a file holds, or null for a file that is missing or is not JSON. */
function readJsonFile(path: string): unknown {
    try {
        return JSON.parse(readFileSync(path, 'utf8')) as unknown;
    } catch {
        return null;
    }
}

/**
 * One agent's choices for one account: the catalog's, with the account's cached models in place of
 * a picker that names a cache file. The cache is Codex's own file and is only read.
 */
export function accountChoices(choices: AgentChoices, account: AgentAccount | null): AgentChoices {
    if (account === null) return choices;
    const cached = choices.lists.find((list) => list.cache !== undefined)?.cache;
    if (cached === undefined) return choices;
    return withCacheModels(choices, cacheModels(readJsonFile(join(account.dir, cached))));
}

/** The account a start names: the label among that agent's accounts, or the first of them. */
export function accountFor(
    agent: AgentId,
    label: string,
    accounts: AgentAccount[]
): AgentAccount | null {
    const own = accounts.filter((one) => one.tool === agent);
    if (label === '') return own[0] ?? null;
    const found = own.find((one) => one.label === label);
    if (found === undefined) throw new Error(`account is not a ${agent} account: ${label}`);
    return found;
}

/** Whether a path is the same folder as another, both resolved. */
function sameDir(a: string, b: string): boolean {
    return resolve(a) === resolve(b);
}

/** Whether a path lies inside a folder. */
function inside(path: string, dir: string): boolean {
    const rest = relative(resolve(dir), resolve(path));
    return rest !== '' && !rest.startsWith('..') && !isAbsolute(rest) && !rest.startsWith(sep);
}

/**
 * How one account reaches an agent's process: the `-e` pair of a folder that is not the tool's
 * default, or the `env -u` words in front of the command that take the variable away for the
 * default folder or for no account at all.
 */
export function accountEnv(
    agent: AgentId,
    account: AgentAccount | null
): { prefix: string[]; env: Record<string, string> } {
    const variable = ACCOUNT_ENV[agent];
    if (account === null || sameDir(account.dir, defaultAccountDir(agent))) {
        return { prefix: ['env', '-u', variable], env: {} };
    }
    return { prefix: [], env: { [variable]: resolve(account.dir) } };
}

/** The account whose folder holds a session's transcript, or null when none of them does. */
export function accountOfPath(
    agent: AgentId,
    path: string,
    accounts: AgentAccount[]
): AgentAccount | null {
    return accounts.find((one) => one.tool === agent && inside(path, one.dir)) ?? null;
}

/** What a composed start runs: the argv, the `-e` environment, and the first command of a shell. */
export type Composed = { argv: string[] | null; env: Record<string, string>; keys: string };

/**
 * The start the composer asked for, checked word by word. The binary of Claude is local.yml's
 * `claude_bin`; Codex is found on PATH. An image must be an absolute file inside the workspace the
 * session starts in, since the composer attaches from that workspace's tree and nowhere else.
 */
export function compose(
    request: ComposeStart,
    choices: AgentChoices[],
    accounts: AgentAccount[],
    claudeBin: string
): Composed {
    const prompt = typeof request.prompt === 'string' ? request.prompt : '';
    if (prompt.length > PROMPT_MAX) throw new Error(`prompt must be at most ${PROMPT_MAX} chars`);
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u0008\u000b-\u001f\u007f]/.test(prompt)) {
        throw new Error('prompt must not hold control characters');
    }
    if (request.agent === 'shell') return { argv: null, env: {}, keys: prompt };
    const agent = request.agent;
    const own = choices.find((one) => one.agent === agent);
    if (own === undefined) throw new Error(`agents.yml offers no ${agent}`);
    const account = accountFor(agent, request.account, accounts);
    const flags = choiceArgs(accountChoices(own, account), request.picks);
    const { prefix, env } = accountEnv(agent, account);
    const argv: string[] = [...prefix, agent === 'claude' ? claudeBin : 'codex', ...flags];
    const images = Array.isArray(request.images) ? request.images : [];
    if (images.length > 0 && agent !== 'codex') throw new Error('images are attached for codex');
    if (images.length > IMAGES_MAX) throw new Error(`at most ${IMAGES_MAX} images`);
    for (const image of images) {
        if (typeof image !== 'string' || !isAbsolute(image) || !inside(image, request.cwd)) {
            throw new Error(`image must be a file inside the workspace: ${image}`);
        }
        argv.push('-i', image);
    }
    if (prompt.trim() !== '') argv.push('--', prompt);
    return { argv, env, keys: '' };
}

/** The request body's start, with every field of the wrong type read as missing. */
export function composeRequest(message: Record<string, unknown>): ComposeStart {
    const agent = message.agent;
    const picks: Record<string, string> = {};
    const raw = message.picks;
    if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
        for (const [key, value] of Object.entries(raw)) {
            if (typeof value === 'string') picks[key] = value;
        }
    }
    return {
        agent: agent === 'claude' || agent === 'codex' ? agent : 'shell',
        cwd: typeof message.cwd === 'string' ? message.cwd : '',
        account: typeof message.account === 'string' ? message.account : '',
        picks,
        prompt: typeof message.prompt === 'string' ? message.prompt : '',
        images: Array.isArray(message.images)
            ? message.images.filter((one): one is string => typeof one === 'string')
            : []
    };
}

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
}

/**
 * GET /api/agents: the composer's choices, per account for a picker that reads the account's
 * cache, with the accounts and whatever the catalog was refused. A read, so same-origin only.
 * `account` names the Codex account whose cache the model picker is read from.
 */
export function handleAgents(
    request: Request,
    engine: string,
    local: LocalConfig = loadLocalOrDefaults(engine)
): Response {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    const read = readAgentsFile(engine);
    const accounts = agentAccounts(local);
    const asked = new URL(request.url).searchParams.get('account') ?? '';
    const agents = read.agents.map((one) => {
        const own = accounts.filter((held) => held.tool === one.agent);
        return accountChoices(one, own.find((held) => held.label === asked) ?? own.at(0) ?? null);
    });
    const answer: AgentsAnswer = { agents, accounts, findings: read.findings };
    return json(200, answer);
}
