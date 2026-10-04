// Layer 4, test helper. Synthetic session records and the tree they group into, for the tests of
// the six session views and of the selectors they read. Nothing here touches ~/.claude, ~/.codex
// or ~/.oculus: what the server would have folded out of a transcript is written out by hand, so a
// test states exactly the case it is about and the store is handed a payload the same shape the
// socket delivers.

import type {
    Area,
    GitPayload,
    GitState,
    GroupedSession,
    SessionsPayload,
    Terminal,
    Workspace
} from '../../src/lib/data/model/index.ts';
import type { ClientState } from './client.ts';

/** One session, everything at its quiet default and the case's own fields written over it. */
export function record(id: string, over: Partial<GroupedSession> = {}): GroupedSession {
    return {
        id,
        path: `/store/${id}.jsonl`,
        slug: 'store',
        tool: 'claude',
        cwd: '/ws',
        branch: 'main',
        title: id,
        lastPrompt: '',
        model: 'claude-opus-5',
        effort: null,
        permissionMode: null,
        version: null,
        entrypoint: null,
        started: null,
        lastActivity: null,
        state: 'ended',
        live: false,
        liveStatus: null,
        pid: null,
        registryName: null,
        hidden: false,
        prompts: 0,
        messages: 0,
        tokens: { input: 0, output: 0, cacheRead: 0, cacheCreation: 0, thinking: 0 },
        contextTokens: 0,
        lastCacheRead: 0,
        contextWindow: null,
        cache: { ttl: null, lastCreation: null, lastRead: null, busts: 0 },
        tools: {},
        files: [],
        agents: [],
        timeline: [],
        truncated: false,
        hook: null,
        workspace: '/ws',
        area: '/ws',
        secondaryAreas: [],
        kind: 'attached',
        pinned: false,
        ...over
    };
}

/** One terminal, as the `sessions` payload carries it. `resumes` is null unless a case says so. */
export function terminal(id: string, over: Partial<Terminal> = {}): Terminal {
    return {
        id,
        name: id,
        title: '',
        icon: '',
        color: '',
        kind: 'shell',
        cwd: '/ws',
        command: 'zsh',
        pid: 0,
        created: '2026-09-11T08:00:00.000Z',
        attached: false,
        resumes: null,
        task: false,
        exit: null,
        job: null,
        ...over
    };
}

/** Hand the client a `sessions` payload that holds the terminals named, at the version given. */
export function receiveTerminals(
    client: ClientState,
    version: number,
    ids: string[],
    name = 'latex build alpha/main.tex'
): void {
    const held: SessionsPayload = {
        records: [],
        workspaces: [],
        terminals: ids.map((id) => terminal(id, { name }))
    };
    client.entities.receive({ channel: 'sessions', version, payload: held });
}

/** One area of a workspace, holding the sessions the grouping filed under it. */
export function area(key: string, sessions: GroupedSession[], over: Partial<Area> = {}): Area {
    return {
        key,
        short: key.split('/').pop() ?? key,
        full: key,
        known: true,
        lastActivity: null,
        sessions,
        ...over
    };
}

/** One workspace, holding its areas. */
export function workspace(key: string, areas: Area[], over: Partial<Workspace> = {}): Workspace {
    return { key, name: key.split('/').pop() ?? key, lastActivity: null, areas, ...over };
}

/** The `sessions` payload: the tree, and the records flattened out of it in the tree's order. */
export function payload(workspaces: Workspace[]): SessionsPayload {
    const records = workspaces.flatMap((one) => one.areas.flatMap((each) => each.sessions));
    return { records, workspaces, terminals: [] };
}

/**
 * One workspace's git state, clean unless the case says otherwise. The counts git held before the
 * 200-entry cut are those of the lists given, unless the case names its own `held`.
 */
export function git(over: Partial<GitState> = {}): GitState {
    const state: GitState = {
        branch: 'main',
        ahead: 0,
        behind: 0,
        detached: false,
        staged: [],
        unstaged: [],
        untracked: [],
        conflicted: [],
        held: { staged: 0, changes: 0, untracked: 0, merge: 0 },
        sequence: '',
        mergeMessage: '',
        remotes: [],
        stashes: [],
        tags: [],
        log: [],
        branches: [],
        worktrees: [],
        ignoresWorktrees: true,
        upstream: false,
        present: true,
        repository: true,
        error: null,
        ...over
    };
    if (over.held !== undefined) return state;
    return {
        ...state,
        held: {
            staged: state.staged.length,
            changes: state.unstaged.length,
            untracked: state.untracked.length,
            merge: state.conflicted.length
        }
    };
}

/**
 * The hub's git state the session view tests read: one staged, two changed, one untracked file.
 * The changed manuscript is the file the fixture's other live session holds open, as git sees it:
 * relative to the workspace root, which is what the "also open" mark has to match across.
 */
export const HUB_GIT: GitState = git({
    branch: 'main',
    ahead: 1,
    staged: [{ path: 'a/one.ts', status: 'M', added: 4, deleted: 2 }],
    unstaged: [
        { path: 'a/two.png', status: 'M', added: null, deleted: null },
        {
            path: 'projects/manuscripts/alpha/manuscript/main.tex',
            status: 'M',
            added: 1,
            deleted: 0
        }
    ],
    untracked: [{ path: 'a/three.ts', status: '?', added: 0, deleted: 0 }]
});

/** The session view tests' git channel: the hub's repository, and `/other`, a folder, no repo. */
export function sessionsGit(hub: string): GitPayload {
    return {
        [hub]: HUB_GIT,
        '/other': git({ branch: '', repository: false, error: 'not a git repository' })
    };
}
