// Layer 1, data. The wire types of a new agent session and of what an agent reads before it starts:
// the composer's choices out of config/catalogs/agents.yml, the start a composer sends, and the
// customizations of one workspace and account. They are their own module because the composer and
// the Customizations section change for reasons of their own, apart from the session records.

import type { GroupedSession, SessionAgent } from './model-sessions.ts';

/** The two agents the composer starts with flags; a shell takes none. */
export type AgentId = 'claude' | 'codex';

/**
 * One value of one picker: the words it shows and what it passes after the list's flag. `pass` is
 * null for the CLI's own default, which passes neither the flag nor a value.
 */
export type AgentChoice = { id: string; label: string; pass: string | null };

/** One picker of one agent: its words, the flag every value passes, its values and its default. */
export type AgentChoiceList = {
    key: string;
    label: string;
    flag: string;
    default: string;
    values: AgentChoice[];
    /**
     * A file of the account's folder whose models stand in for `values` when it lists any, which is
     * how Codex's own models_cache.json names the models its account may use.
     */
    cache?: string;
};

/** One agent's pickers, in the order the catalog lists them. */
export type AgentChoices = { agent: AgentId; label: string; lists: AgentChoiceList[] };

/** Why one line of the catalog was refused, which the composer words from its own catalog. */
export type AgentChoicesWhy =
    | 'parse'
    | 'shape'
    | 'unknown_key'
    | 'unknown_agent'
    | 'no_default'
    | 'default_missing'
    | 'flag'
    | 'value'
    | 'repeated';

/** One refusal of the catalog: the line it is on, why, and the key or value it names. */
export type AgentChoicesFinding = { line: number; why: AgentChoicesWhy; what: string };

/** One configured account of one agent, as the composer's account picker offers it. */
export type AgentAccount = { tool: AgentId; label: string; dir: string };

/** What GET /api/agents answers: the choices, the accounts, and what the catalog was refused. */
export type AgentsAnswer = {
    agents: AgentChoices[];
    accounts: AgentAccount[];
    findings: AgentChoicesFinding[];
};

/**
 * What the composer sends to start a session. `picks` names a value id per list key; a list it
 * leaves out takes the list's default. `prompt` is the first message, or for a shell the first
 * command, and `images` are the files a Codex start attaches with `-i`.
 */
export type ComposeStart = {
    agent: AgentId | 'shell';
    cwd: string;
    account: string;
    picks: Record<string, string>;
    prompt: string;
    images: string[];
};

/** The seven kinds of thing an agent reads before its first turn, as the section lists them. */
export type CustomizationKind =
    'instructions' | 'skills' | 'agents' | 'hooks' | 'mcp' | 'plugins' | 'tools';

/** One thing one kind holds: its name and the file it is in. */
export type CustomizationItem = { name: string; path: string };

/** A file that was there and could not be read as its kind is read. */
export type CustomizationFinding = { path: string; reason: string };

/**
 * One kind's row: its items and their count, null where no file names a count (the tools of an
 * MCP server are known only once it runs), and the files looked in to say so.
 */
export type CustomizationRow = {
    kind: CustomizationKind;
    count: number | null;
    items: CustomizationItem[];
    looked: string[];
    findings: CustomizationFinding[];
};

/** What GET /api/customizations answers for one agent, account and workspace. */
export type CustomizationsAnswer = {
    agent: AgentId;
    account: string;
    workspace: string;
    rows: CustomizationRow[];
};

/**
 * A grouped session with the one mark the list adds beside the record: `top` is true when the
 * reader pinned the session to the top of its group, from the overrides file. It rides on the
 * session the tree carries and is read through `isTop`, which answers false for a session without
 * it.
 */
export type ListedSession = GroupedSession & { top?: boolean };

/**
 * A subagent with the tokens its tool result reports it spent, where the transcript says so;
 * Claude Code writes `totalTokens` on the result of an Agent call.
 */
export type SizedAgent = SessionAgent & { tokens?: number };
