// Layer 2, client state. The words of the status bar: what the page makes for the items whose
// stores the shell's row of the boundary table does not name (the machine, the socket, the usage
// refreshers, the HPC poll, the live sessions, the findings and the repository of the tab on
// screen), and the words the bar draws for the source tab's items, the caret, the indentation and
// the language, from what the source tab publishes.
//
// The unsaved tabs are counted by the shell itself from the layout and ui stores it does read.

import type {
    GitPayload,
    HostInfo,
    HpcPayload,
    SessionsPayload,
    UsagePayload
} from '../../../data/model/index.ts';
import type { FsRoot } from '../../sources/fs.ts';
import { PLAIN, registered } from '../../words/languages.ts';
import { t } from '../../words/text.ts';
import type { Caret, Indent } from './editor-text.ts';

/** The socket's three states, as state/client/socket.svelte.ts names them. */
export type SocketState = 'connecting' | 'open' | 'closed';

/**
 * The repository holding the file of the tab on screen, as the branch and sync items draw it: the
 * root the `git` channel keys it by, the name the item's tooltip calls it, the branch checked out
 * (the empty string on a detached head, where `head` is the commit), whether the branch tracks an
 * upstream and the upstream's name where the branch listing gave it, how far the two are apart,
 * and the branches the picker offers.
 */
export type RepoStatus = {
    root: string;
    name: string;
    branch: string;
    head: string;
    tracked: boolean;
    upstream: string;
    ahead: number;
    behind: number;
    branches: string[];
};

/**
 * What the branch and sync items ask of the page, which alone may write: check a branch out, push
 * the branch, and show the repository in the Repositories view. A write git refuses shows the
 * repository too, whose line says why.
 */
export type StatusGit = {
    switchBranch: (root: string, name: string) => Promise<void>;
    push: (root: string) => Promise<void>;
    show: (root: string) => void;
};

/** What a bar no page has handed a writer asks for: nothing is shown and nothing is written. */
export const NO_GIT: StatusGit = {
    switchBranch: () => Promise.resolve(),
    push: () => Promise.resolve(),
    show: () => undefined
};

/** The HPC poll's state in the bar's own few words, and in the queue's whole sentence. */
export type HpcWords = { short: string; long: string };

/** What the page hands the status bar. */
export type StatusWords = {
    /** The machine the server runs on, or null before the first config push. */
    host: HostInfo | null;
    socket: string;
    usage: string;
    hpc: HpcWords;
    live: number;
    /** How many findings the Findings view lists: the snapshot's and the config channel's. */
    findings: number;
    repo: RepoStatus | null;
};

/** The bar's words before the page has handed it any. */
export const NO_STATUS: StatusWords = {
    host: null,
    socket: '',
    usage: '',
    hpc: { short: '', long: '' },
    live: 0,
    findings: 0,
    repo: null
};

/** A file one tab holds, by the root key the file routes serve it under and its path there. */
export type TabFile = { root: string; path: string };

/** The socket's state in the bar's own short words. */
export function socketWords(state: SocketState): string {
    if (state === 'connecting') return t('statusbar.server_connecting');
    if (state === 'open') return t('statusbar.server_open');
    return t('statusbar.server_closed');
}

/**
 * The usage refreshers taken together: down when one is down, refreshing while one runs, ok when
 * every one ran, and none when no account has one.
 */
export function usageWords(usage: UsagePayload | null): string {
    const states = (usage?.accounts ?? []).flatMap((account) =>
        account.refresher === undefined ? [] : [account.refresher.state]
    );
    if (states.length === 0) return t('statusbar.usage_none');
    if (states.includes('down')) return t('statusbar.usage_down');
    if (states.includes('refreshing')) return t('statusbar.usage_refreshing');
    return t('statusbar.usage_ok');
}

/**
 * The Live HPC poll: the state in the words its own head uses, and once it is live the running and
 * pending counts for the bar and the whole queue for the tooltip.
 */
export function hpcWords(data: HpcPayload | null): HpcWords {
    if (data === null || data.status === 'starting') {
        return { short: t('statusbar.hpc_polling'), long: t('hpc.polling') };
    }
    if (data.status === 'unreachable') {
        return { short: t('hpc.unreachable'), long: t('hpc.unreachable_msg') };
    }
    if (data.status === 'error') return { short: t('hpc.error'), long: t('hpc.error') };
    return {
        short: t('statusbar.hpc_live', data.running, data.pending),
        long: t('hpc.queue_summary', data.running, data.pending, data.total)
    };
}

/** How many sessions the sessions channel holds live. */
export function liveCount(sessions: SessionsPayload | null): number {
    return (sessions?.records ?? []).filter((record) => record.live).length;
}

/** The file a tab's state names, or null for a tab that names none. */
export function tabFile(state: unknown): TabFile | null {
    if (typeof state !== 'object' || state === null || Array.isArray(state)) return null;
    const held = state as Record<string, unknown>;
    const root = held.root;
    const path = held.path;
    if (typeof root !== 'string' || root === '' || typeof path !== 'string') return null;
    return { root, path };
}

/** The last folder of a path, which is what the tooltip calls a repository. */
function folderName(dir: string): string {
    return dir.split('/').filter(Boolean).at(-1) ?? dir;
}

/**
 * The repository holding a tab's file: the innermost root of the `git` channel that is a
 * repository and holds the file's path, the file's root key resolved through the served roots. A
 * tab holding no file is read as the hub itself, the root served under `hub`. A file in no
 * repository, a root key no served root carries and a channel not yet delivered answer null.
 */
export function repoStatus(
    file: TabFile | null,
    roots: readonly FsRoot[],
    git: GitPayload | null,
    hubKey: string
): RepoStatus | null {
    if (git === null) return null;
    const key = file?.root ?? hubKey;
    const dir = roots.find((root) => root.key === key)?.dir;
    if (dir === undefined) return null;
    const path = (file?.path ?? '').split('/').filter(Boolean).join('/');
    const target = path === '' ? dir : `${dir.replace(/\/+$/, '')}/${path}`;
    const holding = Object.keys(git)
        .filter((root) => git[root].repository && git[root].error === null)
        .filter((root) => target === root || target.startsWith(`${root.replace(/\/+$/, '')}/`))
        .sort((left, right) => right.length - left.length);
    const root = holding.at(0);
    if (root === undefined) return null;
    const state = git[root];
    const current = state.branches.find((branch) => branch.current);
    const detached = state.detached || state.branch === 'HEAD';
    return {
        root,
        name: folderName(root),
        branch: detached ? '' : state.branch,
        head: detached ? (state.log.at(0)?.short ?? '') : '',
        tracked: state.upstream === true,
        upstream: state.upstream === true ? (current?.upstream ?? '') : '',
        ahead: state.ahead,
        behind: state.behind,
        branches: state.branches.map((branch) => branch.name)
    };
}

/**
 * How many findings the Findings view lists, which is what the findings item counts, as VS Code's
 * Problems count is the Problems view's: everything the build found wrong in the hub's YAML, the
 * snapshot's, and in config/, the config channel's.
 */
export function findingsCount(
    snapshot: { findings?: readonly unknown[] } | null,
    config: { findings?: readonly unknown[] } | null
): number {
    return allFindings(snapshot, config).length;
}

/**
 * Every finding the page knows of: the portfolio's, then the configuration's. The Findings view
 * lists them and the status bar counts them, so both read one list.
 */
export function allFindings<T>(
    snapshot: { findings?: readonly T[] } | null,
    config: { findings?: readonly T[] } | null
): T[] {
    return [...(snapshot?.findings ?? []), ...(config?.findings ?? [])];
}

/** The words the page hands the status bar at once. */
export function statusWords(
    state: SocketState,
    usage: UsagePayload | null,
    hpc: HpcPayload | null,
    sessions: SessionsPayload | null,
    held: { host: HostInfo | null; findings: number; repo: RepoStatus | null }
): StatusWords {
    return {
        host: held.host,
        socket: socketWords(state),
        usage: usageWords(usage),
        hpc: hpcWords(hpc),
        live: liveCount(sessions),
        findings: held.findings,
        repo: held.repo
    };
}

/** The caret item's words: the line and the column, and how much is selected when anything is. */
export function caretWords(caret: Caret): string {
    const at = t('statusbar.caret', caret.line, caret.column);
    return caret.selected === 0 ? at : t('statusbar.caret_selected', at, caret.selected);
}

/** The indentation item's words, VS Code's two: the width of a space step, or of a tab. */
export function indentWords(indent: Indent): string {
    return indent.tabs
        ? t('statusbar.indent_tabs', indent.size)
        : t('statusbar.indent_spaces', indent.size);
}

/** A language's name as the reader reads it, by the highlighter's name for it. */
export function languageName(name: string): string {
    const known = registered().includes(name) ? name : PLAIN;
    return t(`statusbar.language_${known}`);
}

/** One language the language list offers: the highlighter's name and the reader's. */
export type LanguageChoice = { name: string; label: string };

/**
 * Every language the highlighter paints, Plain Text first and the rest by the reader's name, and
 * with a query only those whose name holds it.
 */
export function languageChoices(query: string): LanguageChoice[] {
    const wanted = query.trim().toLowerCase();
    const all = registered()
        .map((name) => ({ name, label: languageName(name) }))
        .sort((left, right) =>
            left.name === PLAIN
                ? -1
                : right.name === PLAIN
                  ? 1
                  : left.label.localeCompare(right.label)
        );
    return wanted === ''
        ? all
        : all.filter(
              (choice) =>
                  choice.label.toLowerCase().includes(wanted) || choice.name.includes(wanted)
          );
}

/** The kinds of entity the portfolio keeps as a map by id, which the Status view counts. */
export type CountedKind =
    'projects' | 'venues' | 'datasets' | 'pillars' | 'domains' | 'funding' | 'collections';

/** How many entities of one kind the portfolio holds, and none before it arrives. */
export function entityCount(
    snapshot: { entities: Record<CountedKind, Record<string, unknown>> } | null,
    kind: CountedKind
): number {
    return snapshot === null ? 0 : Object.keys(snapshot.entities[kind]).length;
}
