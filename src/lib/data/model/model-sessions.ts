// Layer 1, data. Session, terminal, git and HPC records carried by runtime channels.
// This concern module keeps the live operational wire types separate from portfolio snapshots.

import type { Id } from './model-entities.ts';

export type SessionTool = 'claude' | 'codex';

/** One file the session touched, with the tool that last touched it and when. */
export type SessionFile = {
    path: string;
    /** The name of the tool that last touched the path, `Edit` or `FileChange`. */
    tool: string;
    count: number;
    last: string | null;
};

/** One subagent the session dispatched. */
export type SessionAgent = {
    /** The tool-use id on a Claude transcript, the agent's path on a Codex rollout. */
    id: string;
    description: string;
    subagentType: string;
    model: string | null;
    started: string | null;
    ended: string | null;
    /**
     * `running`, `done`, `stopped` (a background subagent killed before it finished) or `error`.
     */
    status: string;
    /** Length of the result the agent came back with, in characters. */
    resultChars: number;
};

/**
 * One thing that happened, for the timeline: `prompt`, `tool`, `edit`, `turn`, `bust`,
 * `compaction`.
 */
export type SessionEvent = {
    ts: string | null;
    kind: string;
    text: string;
};

/**
 * The call one `tool` turn is about. `id` is the transcript's own `tool_use_id`, which is what
 * pairs the call with its result; the result may be read in a later tail read, so the id travels
 * with the turn rather than being resolved away on the server. `ok` is null while the call is still
 * out.
 */
export type TurnTool = {
    id: string;
    name: string;
    summary: string;
    ok: boolean | null;
};

/**
 * One turn of a session's conversation, as the transcript view draws it. `html` is the rendered
 * Markdown of an assistant turn and the empty string on every other role; `text` is capped and
 * `cut` says the cap applied. A `tool` turn carries `tool` and nothing in `text`.
 */
export type Turn = {
    at: string | null;
    role: 'user' | 'assistant' | 'tool';
    text: string;
    html: string;
    cut: boolean;
    tool: TurnTool | null;
};

/** Lifetime token sums over the whole transcript. Never the context occupancy. */
export type SessionTokens = {
    input: number;
    output: number;
    cacheRead: number;
    cacheCreation: number;
    thinking: number;
};

/**
 * The prompt cache's window: its TTL, when it was last written and read, and how often it broke.
 */
export type SessionCache = {
    ttl: string | null;
    lastCreation: string | null;
    lastRead: string | null;
    busts: number;
};

/**
 * One event a `Notification` or `Stop` hook posted for a session. `kind` is Claude Code's
 * `notification_type` (`permission_prompt`, `idle_prompt`, ...) and is absent on a Stop event; `at`
 * is when the server received it, not a timestamp Claude Code sent.
 */
export type HookEvent = {
    session: string;
    event: 'notification' | 'stop';
    kind?: string;
    message?: string;
    title?: string;
    cwd?: string;
    at: string;
};

/**
 * One session, folded from one transcript. The live fields (`live`, `liveStatus`, `pid`,
 * `registryName`, `hidden`, and `state` when the registry has an opinion) come from the registry
 * or the process probe, not from the file; a bare read leaves them at the not-live defaults.
 */
export type SessionRecord = {
    id: Id;
    /** Absolute path of the transcript or rollout. */
    path: string;
    /**
     * The store folder the file sits in: the project slug for Claude, the date folder for Codex.
     */
    slug: string;
    tool: SessionTool;
    cwd: string | null;
    branch: string | null;
    title: string;
    lastPrompt: string;
    model: string | null;
    effort: string | null;
    permissionMode: string | null;
    version: string | null;
    entrypoint: string | null;
    started: string | null;
    lastActivity: string | null;
    /** `working`, `idle`, `ended`, `unknown`, or whatever else the registry reports. */
    state: string;
    live: boolean;
    liveStatus: string | null;
    pid: number | null;
    registryName: string | null;
    hidden: boolean;
    prompts: number;
    messages: number;
    tokens: SessionTokens;
    /** What the model carried on the last turn, which is what a context meter measures. */
    contextTokens: number;
    /**
     * The cache read of that same last turn. The share of the window that came out of the cache is
     * this over contextTokens; the lifetime sum in `tokens.cacheRead` is a different measurement
     * and divides into a percentage in the tens of thousands.
     */
    lastCacheRead: number;
    /** The model's context window when the transcript states it; Codex does, Claude does not. */
    contextWindow: number | null;
    cache: SessionCache;
    /** Tool name to the number of times it was called. */
    tools: Record<string, number>;
    files: SessionFile[];
    agents: SessionAgent[];
    timeline: SessionEvent[];
    /** True when the file was too large for a first read and nothing was folded. */
    truncated: boolean;
    /**
     * The latest Notification or Stop hook the session posted, or null before one arrives or after
     * server/sessions/stores/hooks.ts's HookStore has let it expire. A bare fold (finish() in
     * record.ts) always leaves this null; server/sessions/index.ts's sessions() is what merges the
     * store in.
     */
    hook: HookEvent | null;
};

/** One entry of Claude Code's session registry, for a session whose process is running. */
export type LiveEntry = {
    /** Null for Codex, which keeps no registry and whose liveness comes from a process probe. */
    pid: number | null;
    status: string;
    name: string;
    kind: string;
    entrypoint: string;
    cwd: string;
    startedAt: number;
};

/** One area a session also scored on, below the one it was filed under. */
export type SecondaryArea = {
    key: string;
    short: string;
};

/** A session as grouping files it: the record, plus where it landed and how it got there. */
export type GroupedSession = SessionRecord & {
    /** Absolute path of the workspace, empty for a record with no cwd. */
    workspace: string;
    /** Absolute path of the area, or `<workspace>/(general)` when nothing scored. */
    area: string;
    secondaryAreas: SecondaryArea[];
    /** `attached` when oculus drives the session, `observed` when it only reads its transcript. */
    kind: string;
    /** True when an override pinned the area rather than the score choosing it. */
    pinned: boolean;
};

/** One area inside a workspace: the project the sessions in it are working on. */
export type Area = {
    /** Absolute path of the area. */
    key: string;
    /** The area's path relative to its workspace, which is what a label shows. */
    short: string;
    /** The project's title when the area is a known project folder, the short label otherwise. */
    full: string;
    known: boolean;
    lastActivity: string | null;
    sessions: GroupedSession[];
};

/** One workspace: the checkout the sessions in it are sitting in. */
export type Workspace = {
    /** Absolute path of the workspace, empty for the unknown workspace. */
    key: string;
    name: string;
    lastActivity: string | null;
    areas: Area[];
};

/** The payload of the `sessions` channel: every record, the tree they group into, the terminals. */
export type SessionsPayload = {
    records: SessionRecord[];
    workspaces: Workspace[];
    /**
     * Every tmux session oculus started, so a terminal appears on the page as soon as it exists.
     * Absent while the server has not yet read tmux's list, which a page reads as saying nothing
     * about any terminal rather than as every terminal having ended.
     */
    terminals?: Terminal[];
};

// ------------------------------------------------------------------ terminals
// The tmux side of DESIGN.md's "PTY": one record per tmux session oculus started, and the three
// messages the `pty:<id>` channel carries. JSON-safe like everything above, so the bytes of a pane
// travel as base64 rather than as a string that a lone surrogate could break.

/** What a terminal pane runs: DESIGN.md's two agents and a shell. */
export type TerminalKind = 'claude' | 'codex' | 'shell';

/**
 * Which agent session a terminal continues. A terminal started fresh carries none; one started by
 * the resume action carries the tool it was resumed with and that session's own id, which is what
 * `claude --resume <id>` and `codex resume <id>` were given.
 */
export type TerminalResume = {
    tool: 'claude' | 'codex';
    id: string;
};

/** One tmux session oculus started, as `tmux list-sessions` reports it. */
export type Terminal = {
    /** The session name without the `oculus-` prefix; the `pty:<id>` channel is named from it. */
    id: string;
    /** What to call it on the page. The id when the starter named nothing. */
    name: string;
    kind: TerminalKind;
    /** The pane's current directory. */
    cwd: string;
    /** The pane's current command, which is what tmux reports is running right now. */
    command: string;
    /** The pane's process id, for a page that wants to show it. Zero when tmux reported none. */
    pid: number;
    /** When the session was created, as an ISO instant. */
    created: string;
    /** Whether any client (oculus or a terminal window) is attached to the tmux session. */
    attached: boolean;
    /** The session this terminal continues, or null when it continues nothing. */
    resumes: TerminalResume | null;
    /**
     * True for a tmux session that carries the `oculus-` prefix but whose name oculus did not mint.
     * It is listed, since it is there and the prefix claims it, and the stop and resize actions
     * refuse it: the commands they build are keyed on an id of oculus's own shape.
     */
    foreign?: boolean;
};

/** The payload of a `pty:<id>` message: a chunk of pane output, or the scrollback, as base64. */
export type PtyPayload = {
    bytes: string;
};

/** Keystrokes from the page, as base64 of the UTF-8 bytes xterm.js produced. */
export type TerminalInput = {
    type: 'input';
    channel: string;
    bytes: string;
};

/** The page's terminal was resized, so the tmux window follows it. */
export type TerminalResize = {
    type: 'resize';
    channel: string;
    cols: number;
    rows: number;
};

// ------------------------------------------------------------------ git
// The read-only git state of a workspace, as server/core/git.ts produces it and the `git` channel
// carries it. JSON-safe like everything above.

/** One path git reported, with the line counts when the worktree diff has them. */
export type GitEntry = {
    path: string;
    /** git's own letter: `M`, `A`, `D`, `R`, `C`, or `?` for an untracked path. */
    status: string;
    /** Null where git reported a binary file, and 0 where no count applies. */
    added: number | null;
    deleted: number | null;
};

/** One commit of a branch's newest history, as the log list draws it. */
export type GitCommit = {
    hash: string;
    /** The abbreviated hash, which is what the row shows. */
    short: string;
    subject: string;
    /** The author date, ISO 8601 with its offset, as git wrote it. */
    when: string;
};

/** One branch of a repository, its upstream and whether it is the checked-out one. */
export type GitBranch = { name: string; upstream: string; current: boolean };

/** One worktree of a repository. `main` is the checkout the others hang off. */
export type GitWorktree = {
    path: string;
    /** The branch checked out there, empty for a worktree with a detached HEAD. */
    branch: string;
    head: string;
    main: boolean;
};

/** One stash of a repository, newest first, as `stash list` names it. */
export type GitStash = {
    /** git's own name for it, `stash@{<n>}`, which every stash write is addressed by. */
    ref: string;
    hash: string;
    /** The line git wrote for it: the message given, or `WIP on <branch>: ...`. */
    message: string;
    /** When it was made, ISO 8601 with its offset. */
    when: string;
};

/** One tag of a repository and the commit it points at, whether it is annotated or not. */
export type GitTag = { name: string; commit: string; annotated: boolean; subject: string };

/**
 * What a repository is in the middle of: a merge that stopped on conflicts (MERGE_HEAD is there), a
 * rebase that did (a rebase folder is there), or nothing.
 */
export type GitSequence = 'merging' | 'rebasing' | '';

/**
 * One commit of the graph: its parents, which the lanes are drawn from, the branch and tag names
 * `%D` puts on it, and whether it is the checked-out branch's head.
 */
export type GitGraphCommit = GitCommit & {
    parents: string[];
    author: string;
    /** Branch and remote-branch names on this commit, `HEAD` itself left out. */
    refs: string[];
    tags: string[];
    head: boolean;
    /** The whole message, subject and body, which Copy Message copies. */
    message: string;
};

/** One page of the graph and, on the first page, the commits either side of the upstream. */
export type GitGraphPage = {
    commits: GitGraphCommit[];
    /** Whether the log goes on past this page. */
    more: boolean;
    /** What the upstream holds that HEAD does not, newest first; empty with no upstream. */
    incoming: GitGraphCommit[];
    /** What HEAD holds that the upstream does not, newest first; empty with no upstream. */
    outgoing: GitGraphCommit[];
};

/** One path a commit changed, git's letter first, and the old path of a rename or copy. */
export type GitCommitFile = { status: string; path: string; from: string };

/** One line of a blame, by the line it is in the file, counting from one. */
export type GitBlameLine = {
    line: number;
    hash: string;
    short: string;
    author: string;
    /** The author time, ISO 8601 in UTC. */
    when: string;
    subject: string;
    /** A line the worktree holds that no commit does yet. */
    uncommitted: boolean;
};

/** One change quick diff marks in the gutter, against the index, by the worktree's lines. */
export type GitLineMark = {
    kind: 'added' | 'modified' | 'deleted';
    /** The first line of the mark, counting from one; for a deletion, the line it sits before. */
    line: number;
    /** How many lines it spans; zero for a deletion. */
    count: number;
};

/**
 * The three versions a conflicted path has in the index: the base, ours and theirs, and which side
 * deleted the path, when one did: `ours` for a conflict git lists as DU, `theirs` for UD, `both`
 * for DD, and the empty string when both sides hold the path. A deleted side is the empty text.
 */
export type GitMergeSides = {
    base: string;
    ours: string;
    theirs: string;
    deleted: GitMergeDeleted;
};

/**
 * One file of a diff as the diff pane reads it: its two paths (the same but for a rename), git's
 * head lines for it (from `diff --git` to the line before its first hunk, or its `Binary files`
 * line), which a patch cut from it repeats, whether git called it binary, whether both versions'
 * bytes are UTF-8, and the two whole texts. A side that does not hold the file, and a binary file,
 * has the empty string. A side that is not UTF-8 is decoded with U+FFFD for each byte it cannot
 * read, so its text is for reading only: no patch may be cut from it.
 */
export type DiffSides = {
    oldPath: string;
    newPath: string;
    head: string[];
    binary: boolean;
    encoded: boolean;
    original: string;
    modified: string;
};

/**
 * What git says of converting one file's text: `check-attr`'s values for `filter`, `text`, `eol`,
 * `working-tree-encoding` and `ident` (`unspecified`, `unset`, `set` or a value), and
 * `core.autocrlf`, the empty string when it is not set. The diff pane withholds its partial
 * patches from a file git converts.
 */
export type DiffAttributes = {
    filter: string;
    text: string;
    eol: string;
    workingTreeEncoding: string;
    ident: string;
    autocrlf: string;
};

/** Which side of a conflict deleted the path, or the empty string when neither did. */
export type GitMergeDeleted = '' | 'ours' | 'theirs' | 'both';

/**
 * One workspace's git state. Every field is filled, `error` saying why when the rest is empty, and
 * `repository` saying whether the root is a repository whatever else failed.
 */
export type GitState = {
    /** The branch name, `HEAD` when nothing is checked out, empty when git said nothing. */
    branch: string;
    ahead: number;
    behind: number;
    /**
     * Whether the branch has a tracking branch, and null when that is not known. The rule a reader
     * applies is `upstream === null && error === null`: that pair, and only that pair, is a state
     * git has not answered for yet, and a control that would say "no upstream" says it is still
     * being looked up instead. Null with `error` set is a state git answered with a failure (a
     * directory that is not a repository, which `repository` tells apart, or a repository whose
     * read failed), and that is never pending. The upstream's own name comes from the branch
     * listing of /api/git, which arrives after this.
     */
    upstream?: boolean | null;
    detached: boolean;
    staged: GitEntry[];
    unstaged: GitEntry[];
    untracked: GitEntry[];
    /**
     * The paths git lists as unmerged, each with the two letters of its pair (`UU`, `AA`, `DD`,
     * `AU`, `UA`, `DU`, `UD`) as its status. A path here is in neither list above.
     */
    conflicted: GitEntry[];
    /** What the repository is in the middle of, which Abort and Commit act on. */
    sequence: GitSequence;
    /** The message git prepared for the merge in progress, comment lines left out. */
    mergeMessage: string;
    /** The repository's remotes by name, which Publish Branch offers. */
    remotes: string[];
    stashes: GitStash[];
    tags: GitTag[];
    /** The newest commits of the checked-out branch, newest first. */
    log: GitCommit[];
    branches: GitBranch[];
    /** Every worktree of the repository, the checkout itself first. */
    worktrees: GitWorktree[];
    /** Whether the repository's .gitignore keeps the worktrees folder out of its history. */
    ignoresWorktrees: boolean;
    /**
     * Whether anything is at the root's path. False only for a path with no such name at it, gone
     * or never made, which is what tells a workspace folder that has gone from a folder that is no
     * repository: `repository` alone cannot, since both carry it false. It is read at the path
     * again when git answers that a root is no repository, so a folder that went away while the
     * read ran is not reported as one that was never a repository.
     *
     * True for everything else. A regular file at the path, a symbolic link whose target is gone
     * and a folder under a parent nothing may enter are all there, so each keeps it true and
     * carries git's own reason in `error` ("Not a directory", "No such file or directory" for the
     * link's target, "Permission denied"), which is what a reader needs to act on.
     */
    present: boolean;
    /**
     * Whether the root is taken for a repository. False in exactly three cases: the root is not a
     * directory (or does not exist), git ran `rev-parse --git-dir` to its end and answered that the
     * root is no repository, or the read threw before git answered. True otherwise, which includes
     * a repository with no commit yet, a repository whose later reads failed, and a root whose
     * check timed out or whose git would not start, each of the last two with `error` set.
     */
    repository: boolean;
    /**
     * Why a read failed, or null. Set on a repository as well, so it does not mean "no repository".
     */
    error: string | null;
};

/** The payload of the `git` channel: one state per workspace root. */
export type GitPayload = Record<string, GitState>;

/**
 * The payload of the `files` channel: what on the disk the file browser reads has just changed. A
 * message naming a root says a write landed somewhere under that root, so every file listing taken
 * under it may be stale. The portfolio snapshot does not say this: it is rebuilt only for a file
 * the config names, and a file written inside a project folder moves no version of it.
 *
 * A message with `bookmarks` is the reader's own bookmarks file, which lies under no root and is
 * watched on its own; it names no root, and the page reads the bookmarks again for it.
 */
export type FilesPayload = { root: string; bookmarks?: boolean };

// ------------------------------------------------------------------ hpc
export type HpcStatus = 'starting' | 'ok' | 'unreachable' | 'error';
export type HpcJob = {
    id: string;
    name: string;
    partition: string;
    state: string;
    time: string;
    limit: string;
    nodes: string;
    cpus: string;
    gpus: string;
    mem: string;
    priority: string;
    start: string;
    reason: string;
};
export type HpcRecent = {
    id: string;
    name: string;
    state: string;
    exit: string;
    elapsed: string;
    end: string;
    memPct: number | null;
    memUsed: string;
    memReq: string;
    cpuPct: number | null;
};
export type HpcPartition = {
    partition: string;
    avail: string;
    nodes: number;
    state: string;
    gres: string;
};
export type HpcQuotaItem = { name: string; used: string; limit: string; pct: number };
export type HpcPayload = {
    status: HpcStatus;
    hint?: string;
    jobs: HpcJob[];
    running: number;
    pending: number;
    total: number;
    recent: HpcRecent[];
    sinfo: HpcPartition[];
    quota: HpcQuotaItem[];
    updated: string;
    /** When the cluster last answered, so a failed poll can say how old the rows under it are. */
    lastOk?: string;
    pollMin: number;
    /**
     * Minutes between attempts while the cluster is not answering; absent from a payload written
     * before it was carried.
     */
    retryMin?: number;
    host: string;
};

// ------------------------------------------------------------------ usage
export type UsageTool = 'claude' | 'codex';
export type UsageAccountConfig = { tool: UsageTool; dir: string; label: string };
export type UsageWindow = {
    name: 'five_hour' | 'seven_day' | 'weekly_model' | 'primary' | 'secondary';
    usedPercent: number;
    resetsAt: number;
    windowMinutes: number;
    model?: string;
    severity?: 'normal' | 'warning' | 'critical';
    active?: boolean;
    observedAt: string;
};
export type UsageLiveSession = {
    sessionId: string;
    model: string;
    contextPercent: number | null;
    costUsd: number | null;
    updatedAt: string;
    cwd: string;
};
export type UsageRefresher = {
    /** `refreshing` while a tick runs, `running` after a good one, `down` after a failed one. */
    state: 'running' | 'refreshing' | 'down';
    since: string;
    reason: string;
    lastRefresh: string;
    /**
     * Whether the last refresh moved the account file; Claude Code renews it only after five
     * minutes.
     */
    renewed: boolean;
};
export type UsageAccount = {
    tool: UsageTool;
    label: string;
    dir: string;
    email: string;
    organisation: string;
    tier: string;
    tierLabel: string;
    billing: string;
    fetchedAt?: string;
    windows: UsageWindow[];
    live: UsageLiveSession[];
    refresher?: UsageRefresher;
};
export type UsageDay = {
    tool: UsageTool;
    account: string;
    day: string;
    model: string;
    input: number;
    output: number;
    cacheRead: number;
    cacheCreation: number;
};
export type UsagePayload = { accounts: UsageAccount[]; days: UsageDay[]; builtAt: string };
