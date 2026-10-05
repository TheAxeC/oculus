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
export type AgentChoice = {
    id: string;
    label: string;
    pass: string | null;
    /**
     * True when a start with this value is asked about first, because it skips what the agent
     * would ask the reader.
     */
    confirm?: boolean;
};

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
 * A task of the hub that seeds an agent: a manifest's subtask (`id` the project, `subtask` the
 * line), an entry of a collection (`id` and `collection`), or an entry's subtask (all three).
 * `subtask` carries the line's key and its `do` text, so a list whose items shifted since the page
 * drew it names no task.
 */
export type TaskRef = {
    id: string;
    collection?: string;
    subtask?: { key: string; do: string };
};

/**
 * What the composer sends to start a session. `picks` names a value id per list key; a list it
 * leaves out takes the list's default. `prompt` is the first message, or for a shell the first
 * command, and `images` are the files a Codex start attaches with `-i`. `task` is the hub task the
 * start is seeded with, `seed` the text the page showed for it, and `confirm` true only once the
 * reader answered the question a permission mode that skips what the agent asks raises.
 */
export type ComposeStart = {
    agent: AgentId | 'shell';
    cwd: string;
    account: string;
    picks: Record<string, string>;
    prompt: string;
    images: string[];
    task?: TaskRef;
    seed: string;
    confirm: boolean;
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

// Which values of a start ask the reader first are the ones that carry `confirm: true` in
// config/catalogs/agents.yml. The server refuses a start that skips the question, and the composer
// asks it, so both read the one rule below.

/**
 * The values a start would pass that carry `confirm`, as `choiceArgs` resolves them: each list's
 * pick, or its default where the picks name none. A pick naming a value the list does not hold is
 * left to `choiceArgs`, which refuses it.
 */
export function confirmValues(
    choices: AgentChoices,
    picks: Record<string, string>
): { list: AgentChoiceList; value: AgentChoice }[] {
    const found: { list: AgentChoiceList; value: AgentChoice }[] = [];
    for (const list of choices.lists) {
        const id = Object.hasOwn(picks, list.key) ? picks[list.key] : list.default;
        const value = list.values.find((one) => one.id === id);
        if (value?.confirm === true) found.push({ list, value });
    }
    return found;
}
