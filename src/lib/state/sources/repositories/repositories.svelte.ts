// Layer 2, client state. What the Source Control views do when a control is pressed: the git writes
// over one root, the commit message being written for each root, the shell a new worktree opens
// with, and the panes a diff, a conflicted file, a file and a commit open in.
//
// It is a store rather than handlers inside the components because what a press leaves behind is
// state a reader sees: which roots have a write in flight and which action it is, what the last one
// on each answered, and the message typed for each. The action in flight is the page's own: a page
// reloaded holds none, and a tab closed while one runs leaves it to every other place that shows
// the root until its answer. The Repositories view, the sessions Changes panel and the status bar
// all press through it, so a commit made from one is the commit the others show, and the message
// typed in one commit box is the message the other shows for the same repository. A write is
// refused only on the root it is over, so a commit in one repository leaves the controls of every
// other repository live.
//
// The confirm is the view's, since it is a dialog: every write the server takes only confirmed is
// sent confirmed from here, and a view calls it only from its own dialog's yes.
//
// The stores it works through are handed in, so a test drives the whole thing with its own writes,
// terminals, panes and roots, and no component is mounted.

import { BRANCH_NOT_MERGED } from '../../../data/model/index.ts';
import { diffState, type DiffSubject } from './diff/subject.ts';
import { repositoriesViewOf } from './repositories.ts';
import { plannedPath } from './worktrees.ts';
import { isFolderPath, withoutClosedCommits } from './change-tree.ts';
import { headTabState, tabOfFile, type ServedRoot, type TabFile } from './file-git.ts';
import type { PatchMode } from './diff/diff-patch.ts';
import type { SendOptions, WritesStore } from '../../shared/stores/shapes.ts';
import { t } from '../../shared/words/text.ts';
import { openShell, type WorktreeStarter } from '../../shared/stores/shell.ts';

/** The view id of the pane one diff opens in. */
export const DIFF_VIEW = 'repositories-diff';

/** The view id of the pane the three-way merge editor opens in. */
export const MERGE_VIEW = 'repositories-merge';

/** What the Commit button's list offers: a commit, an amend, and a commit then push or sync. */
export type CommitHow = 'commit' | 'amend' | 'push' | 'sync';

/** What a stash takes: the tracked changes, those and the untracked files, or what is staged. */
export type StashMode = 'tracked' | 'untracked' | 'staged';

/** A group of changes a section head acts on as a whole. */
export type ChangeGroup = 'changed' | 'untracked';

/** What a new worktree is started with: a shell, or the composer for Claude or Codex. */
export type WorktreeStart = 'shell' | 'claude' | 'codex';

/** What a Delete Branch came to: deleted, kept as git calls it not fully merged, or refused. */
export type BranchDeletion = 'deleted' | 'not-merged' | 'refused';

/** An action in flight that says what it does, and the words it says while it runs. */
export type RunningAction = { action: string; words: string };

/**
 * The words an action says while it runs, by the name the page sends it under: the ones a reader
 * waits on for long enough to ask what is happening. Every other action says Working.
 */
const RUNNING_WORDS: Record<string, () => string> = {
    commit: () => t('git.running_commit'),
    push: () => t('git.running_push'),
    pull: () => t('git.running_pull'),
    fetch: () => t('git.running_fetch'),
    sync: () => t('git.running_sync'),
    publish: () => t('git.running_publish'),
    switchBranch: () => t('git.running_checkout'),
    checkoutDetached: () => t('git.running_checkout'),
    merge: () => t('git.running_merge'),
    stash: () => t('git.running_stash'),
    stashApply: () => t('git.running_stash_apply'),
    stashPop: () => t('git.running_stash_pop'),
    stashDrop: () => t('git.running_stash_drop')
};

export type RepositoriesStore = {
    /** Whether a write is in flight on this root. */
    busy: (root: string) => boolean;
    /**
     * The action in flight on the first of these roots whose action says words of its own, with
     * those words; null when none of them runs one. A view hands the roots of its repository, so
     * an action started through another root of the same repository is seen.
     */
    running: (roots: readonly string[]) => RunningAction | null;
    /**
     * What a control over this root says while a write runs on it: the words of the action in
     * flight, or Working for an action that says none.
     */
    busyWords: (root: string) => string;
    /** What the last write on this root answered, or the empty string. */
    outcome: (root: string) => string;
    /** Clear what the last write on this root answered. */
    clearOutcome: (root: string) => void;
    /** End the write in flight on this root; nothing is posted when none is. */
    cancel: (root: string) => Promise<void>;
    /** The commit message being written for this root. */
    message: (root: string) => string;
    setMessage: (root: string, text: string) => void;
    /** Whether a message is being suggested for this root. */
    suggesting: (root: string) => boolean;
    /** Fill this root's message from its staged diff. */
    suggest: (root: string) => Promise<void>;
    /** Commit what is staged with the message, then push or sync for those two; clears it. */
    commit: (root: string, how: CommitHow, message: string) => Promise<boolean>;
    stage: (root: string, path: string) => Promise<void>;
    unstage: (root: string, path: string) => Promise<void>;
    discard: (root: string, path: string) => Promise<void>;
    /** Stage, unstage or throw away several paths in one write, a folder's worth at a time. */
    stagePaths: (root: string, paths: readonly string[]) => Promise<void>;
    unstagePaths: (root: string, paths: readonly string[]) => Promise<void>;
    /** Throw away the changes to several tracked paths; the view asks first. */
    discardPaths: (root: string, paths: readonly string[]) => Promise<void>;
    stageAll: (root: string, group: ChangeGroup) => Promise<void>;
    unstageAll: (root: string) => Promise<void>;
    discardAll: (root: string) => Promise<void>;
    /** Send untracked paths to the Trash; the view asks first. A folder path ends in `/`. */
    trashUntracked: (root: string, paths: readonly string[]) => Promise<void>;
    /** Append paths to the repository's .gitignore, then open that file in a source tab. */
    ignore: (root: string, paths: readonly string[]) => Promise<void>;
    /** Check a commit or a remote branch out detached, answering whether git did. */
    checkoutDetached: (root: string, ref: string) => Promise<boolean>;
    /** Apply one commit to the checked-out branch; the view asks first. */
    cherryPick: (root: string, hash: string) => Promise<void>;
    /**
     * Delete a branch with `branch -d`; the view asks first. The answer is `not-merged` when git
     * keeps the branch because it is not merged into its upstream, or into HEAD when it has none,
     * which the view answers with its second question, and `refused` for any other refusal, which
     * the store has said already.
     */
    deleteBranch: (root: string, name: string) => Promise<BranchDeletion>;
    /** Delete a branch with `branch -D`, after the second question has been answered yes. */
    deleteBranchAnyway: (root: string, name: string) => Promise<void>;
    /** Apply a patch the diff pane cut, answering whether git took it. */
    applyPatch: (root: string, patch: string, mode: PatchMode) => Promise<boolean>;
    /** Make a branch and check it out; `start` is the commit it is made from, else the head. */
    createBranch: (root: string, name: string, start?: string) => Promise<void>;
    /** Check a branch out, answering whether git did. */
    switchBranch: (root: string, name: string) => Promise<boolean>;
    /** Push the checked-out branch to its upstream, answering whether git did. */
    push: (root: string) => Promise<boolean>;
    pull: (root: string) => Promise<boolean>;
    fetch: (root: string) => Promise<boolean>;
    /** Pull, then push, answering whether both went. */
    sync: (root: string) => Promise<boolean>;
    /** Push the branch to a remote and make it the upstream, answering whether git did. */
    publish: (root: string, remote: string) => Promise<boolean>;
    abortMerge: (root: string) => Promise<void>;
    continueRebase: (root: string) => Promise<void>;
    /** Write a conflicted path's merge result and stage it, answering whether it went. */
    resolve: (root: string, path: string, content: string) => Promise<boolean>;
    /** Take a conflicted path as the worktree holds it, or its deletion where it holds none. */
    markResolved: (root: string, path: string) => Promise<void>;
    /** Take the deletion a side made of a conflicted path, answering whether git did. */
    acceptDeletion: (root: string, path: string) => Promise<boolean>;
    stash: (root: string, mode: StashMode, message: string) => Promise<void>;
    stashAct: (root: string, act: 'apply' | 'pop' | 'drop', ref: string) => Promise<void>;
    createTag: (root: string, name: string, message: string, start?: string) => Promise<void>;
    deleteTag: (root: string, name: string) => Promise<void>;
    pushTags: (root: string) => Promise<void>;
    /**
     * Make the worktree and open a shell in it, or the composer there for Claude or Codex; the
     * path is the view's own rule.
     */
    createWorktree: (root: string, name: string, start: WorktreeStart) => Promise<void>;
    /**
     * Make the worktree of `name` on the root, the write New worktree sends, and answer whether it
     * went with the sentence a refusal gave; the view's notice says the outcome as for any write.
     */
    makeWorktree: (root: string, name: string) => Promise<{ ok: boolean; error: string }>;
    removeWorktree: (root: string, path: string) => Promise<void>;
    merge: (root: string, branch: string) => Promise<void>;
    /** Open a shell in a worktree that is already there. */
    shellIn: (root: string, cwd: string, label: string) => Promise<void>;
    /** Open the composer for Claude or Codex in an existing worktree. */
    agentIn: (root: string, cwd: string, agent: 'claude' | 'codex') => Promise<void>;
    /**
     * Open one diff in a pane of its own beside the one being read. `asker` is the instance of the
     * tool view that asked for it, which the diff opens beside and never over.
     */
    openDiff: (subject: DiffSubject, label: string, asker?: string) => void;
    /**
     * Open what a change row stands for: the merge editor for a conflict, the file itself for an
     * untracked path, which has no diff, and the diff for the rest, as the tab of the session
     * given when the row is a session's.
     */
    openChange: (root: string, group: string, path: string, session?: string) => void;
    /**
     * Open what a change row stands for to the side of the pane the reader is in, which is where
     * the diff and the merge editor already open: an untracked row's file opens beside too.
     */
    openChangeBeside: (root: string, group: string, path: string) => void;
    /**
     * Open a tracked file as HEAD holds it, in a read-only source tab, for a staged row and for a
     * changed one. An untracked row has no such version.
     */
    openHead: (root: string, group: string, path: string) => void;
    /** Open the files between a ref and a commit in a diff pane of its own. */
    openCompare: (root: string, from: string, to: string) => void;
    /** Open a linked worktree's file against the main worktree's in a diff pane. */
    compareWorkspace: (root: string, path: string) => void;
    /**
     * Open a file in a source tab, at a line when one is given. `root` is a repository's folder or
     * a served root's key, as a diff pane read through the file routes names it (a Replace
     * Preview, a comparison of two files, a file against a copy in its local history).
     */
    openFile: (root: string, path: string, line?: number) => boolean;
    /**
     * The served root and path a file is at, `root` read as openFile reads it; null when no served
     * root holds the file.
     */
    placeOf: (root: string, path: string) => TabFile | null;
    /**
     * Show a file in the Files view, answering whether a served root holds it: `root` is read as
     * openFile reads it.
     */
    revealFile: (root: string, path: string) => boolean;
    /** Open the three-way merge editor over one conflicted path. */
    openMerge: (root: string, path: string) => void;
    /** Show one commit's files in the Repositories view's graph. */
    openCommit: (root: string, hash: string) => void;
};

/**
 * What the store needs of the layout store: a view opened, one opened beside the one being read,
 * and a path shown in the Files view. The layout store in state/workbench satisfies it.
 */
export type ViewOpener = {
    openView: (view: string, state?: unknown) => string;
    openBeside: (view: string, state?: unknown, page?: string, asker?: string) => string;
    showInFiles: (path: string, root: string) => string;
};

/**
 * What the store needs to open a file and point a view: the roots the file routes serve, a view
 * instance's own remembered state, and the source store's next ask, which marks an open at a line
 * as asked so the tab goes to the line again when it is already there (a pause on the line the
 * caret left).
 */
export type OpenAccess = {
    served: () => ServedRoot[];
    asked: () => number;
    instanceState: (id: string) => unknown;
    setInstanceState: (id: string, state: unknown) => void;
};

/** A path's own name, what a tab opened on it is called. */
function nameOf(path: string): string {
    return path.split('/').filter(Boolean).at(-1) ?? path;
}

export function createRepositories(
    writes: WritesStore,
    terminals: WorktreeStarter,
    layout: ViewOpener,
    access: OpenAccess
): RepositoriesStore {
    const state: {
        /** The name of the action in flight on each root that has one. */
        acting: Record<string, string>;
        outcomes: Record<string, string>;
        messages: Record<string, string>;
        suggesting: string[];
    } = $state({ acting: {}, outcomes: {}, messages: {}, suggesting: [] });

    function busy(root: string): boolean {
        return Object.hasOwn(state.acting, root);
    }

    function running(roots: readonly string[]): RunningAction | null {
        for (const root of roots) {
            const action = busy(root) ? state.acting[root] : undefined;
            const words = action === undefined ? undefined : RUNNING_WORDS[action];
            if (action !== undefined && words !== undefined) return { action, words: words() };
        }
        return null;
    }

    function outcome(root: string): string {
        return state.outcomes[root] ?? '';
    }

    function say(root: string, sentence: string): void {
        state.outcomes = { ...state.outcomes, [root]: sentence };
    }

    function setMessage(root: string, text: string): void {
        state.messages = { ...state.messages, [root]: text };
    }

    /**
     * One write on one root, answered with what git said. A second write on the same root while one
     * is in flight is refused; a write on another root is not, since the two touch different
     * repositories.
     */
    async function send(
        root: string,
        action: string,
        fields: Record<string, unknown> = {},
        confirmed = false,
        options: SendOptions = {}
    ): Promise<{ ok: boolean; output: string; error: string; code?: string }> {
        if (root === '' || busy(root)) return { ok: false, output: '', error: '' };
        state.acting = { ...state.acting, [root]: action };
        say(root, '');
        try {
            const answer = await writes.writeGit(
                action,
                root,
                confirmed ? { ...fields, confirm: true } : fields,
                options
            );
            // A refusal the caller answers with a question is not said: the question is the answer.
            const asked =
                answer.code !== undefined && options.asked?.includes(answer.code) === true;
            say(root, answer.ok ? t('git.done') : asked ? '' : (answer.error ?? ''));
            return {
                ok: answer.ok,
                output: answer.output ?? '',
                error: answer.ok ? '' : (answer.error ?? ''),
                code: answer.code
            };
        } finally {
            state.acting = Object.fromEntries(
                Object.entries(state.acting).filter(([one]) => one !== root)
            );
        }
    }

    async function makeWorktree(
        root: string,
        name: string
    ): Promise<{ ok: boolean; error: string }> {
        const answer = await send(root, 'createWorktree', { name }, true);
        return { ok: answer.ok, error: answer.error };
    }

    async function act(
        root: string,
        action: string,
        fields: Record<string, unknown> = {},
        confirmed = false
    ): Promise<boolean> {
        return (await send(root, action, fields, confirmed)).ok;
    }

    /**
     * Start a shell where the reader is looking, shown in the Terminal tab of the page on screen,
     * or a new one, which the label names until the shell's own name arrives. A terminal that will
     * not start is said after the write's own sentence rather than over it: the worktree is there
     * either way, and the reader needs both facts.
     */
    async function shellIn(root: string, cwd: string, label: string): Promise<void> {
        const refused = await openShell(terminals, cwd, label);
        if (refused === null) return;
        const held = outcome(root);
        say(root, held === '' ? refused : `${held} ${refused}`);
    }

    /**
     * Open the composer for Claude or Codex where the reader is looking. A composer that will not
     * open is said after the write's own sentence, as `shellIn` says a shell that will not start.
     */
    async function agentIn(root: string, cwd: string, agent: 'claude' | 'codex'): Promise<void> {
        const refused = await terminals.composeAt({ cwd, agent });
        if (refused === '') return;
        const held = outcome(root);
        say(root, held === '' ? refused : `${held} ${refused}`);
    }

    function openDiff(subject: DiffSubject, label: string, asker?: string): void {
        layout.openBeside(DIFF_VIEW, diffState(subject, label), undefined, asker);
    }

    function openMerge(root: string, path: string): void {
        layout.openBeside(MERGE_VIEW, { id: `merge:${root}:${path}`, root, path, label: path });
    }

    /**
     * The tab a file opens in: a served root's key names the tab's root itself, and a repository's
     * folder opens under the served root holding the file most closely, or nowhere when none does.
     */
    function tabOf(root: string, path: string): TabFile | null {
        const served = access.served();
        if (served.some((one) => one.key === root)) return { root, path };
        return tabOfFile(served, { root, path });
    }

    function openFile(root: string, path: string, line?: number, beside = false): boolean {
        // A folder (a nested repository, which git lists as its folder) has no source tab; the
        // Files view shows it.
        if (isFolderPath(path)) return revealFile(root, path);
        const tab = tabOf(root, path);
        if (tab === null) {
            say(root, t('repositories.open_unserved', path));
            return false;
        }
        const state = { root: tab.root, path: tab.path, label: nameOf(path) };
        const shown =
            line === undefined || line <= 0 ? state : { ...state, line, asked: access.asked() };
        if (beside) layout.openBeside('source', shown);
        else layout.openView('source', shown);
        return true;
    }

    function openChange(root: string, group: string, path: string, session?: string): void {
        if (group === 'merge') openMerge(root, path);
        else if (group === 'untracked') openFile(root, path);
        else {
            const subject = { root, path, staged: group === 'staged', worktree: false };
            openDiff(session === undefined ? subject : { ...subject, session }, path);
        }
    }

    function revealFile(root: string, path: string): boolean {
        const tab = tabOf(root, path);
        if (tab === null) {
            say(root, t('repositories.reveal_unserved', path));
            return false;
        }
        layout.showInFiles(tab.path, tab.root);
        return true;
    }

    async function commit(root: string, how: CommitHow, message: string): Promise<boolean> {
        const fields = { message, ...(how === 'amend' ? { amend: true } : {}) };
        if (!(await act(root, 'commit', fields, true))) return false;
        setMessage(root, '');
        if (how === 'push') return act(root, 'push', {}, true);
        if (how === 'sync') return act(root, 'sync', {}, true);
        return true;
    }

    /**
     * Cancel is not a write on the root, so the busy check of `send` does not apply to it: it is
     * posted exactly while a git write is in flight, and the write it ends answers for itself. A
     * message being suggested runs `claude`, not git, and has nothing here to end.
     */
    async function cancel(root: string): Promise<void> {
        if (root === '' || !busy(root) || state.suggesting.includes(root)) return;
        await writes.writeGit('cancel', root);
    }

    async function suggest(root: string): Promise<void> {
        if (busy(root) || state.suggesting.includes(root)) return;
        state.suggesting = [...state.suggesting, root];
        try {
            const answer = await send(root, 'suggest');
            if (answer.ok && answer.output !== '') setMessage(root, answer.output);
        } finally {
            state.suggesting = state.suggesting.filter((one) => one !== root);
        }
    }

    async function stagePaths(root: string, paths: readonly string[]): Promise<void> {
        await act(root, 'stage', { paths: [...paths] });
    }

    async function unstagePaths(root: string, paths: readonly string[]): Promise<void> {
        await act(root, 'unstage', { paths: [...paths] });
    }

    async function discardPaths(root: string, paths: readonly string[]): Promise<void> {
        await act(root, 'discard', { paths: [...paths] }, true);
    }

    return {
        busy,
        running,
        busyWords: (root) => running([root])?.words ?? t('git.busy'),
        outcome,
        clearOutcome: (root) => say(root, ''),
        cancel,
        message: (root) => state.messages[root] ?? '',
        setMessage,
        suggesting: (root) => state.suggesting.includes(root),
        suggest,
        commit,
        stage: (root, path) => stagePaths(root, [path]),
        unstage: (root, path) => unstagePaths(root, [path]),
        discard: (root, path) => discardPaths(root, [path]),
        stagePaths,
        unstagePaths,
        discardPaths,
        async stageAll(root, group) {
            await act(root, 'stageAll', { group });
        },
        async unstageAll(root) {
            await act(root, 'unstageAll');
        },
        async discardAll(root) {
            await act(root, 'discardAll', {}, true);
        },
        applyPatch(root, patch, mode) {
            if (mode === 'stage') return act(root, 'stagePatch', { patch });
            if (mode === 'unstage') return act(root, 'unstagePatch', { patch });
            return act(root, 'revertPatch', { patch }, true);
        },
        async trashUntracked(root, paths) {
            await act(root, 'trashUntracked', { paths: [...paths] }, true);
        },
        async ignore(root, paths) {
            if (await act(root, 'ignore', { paths: [...paths] })) openFile(root, '.gitignore');
        },
        checkoutDetached: (root, ref) => act(root, 'checkoutDetached', { ref }, true),
        async cherryPick(root, hash) {
            await act(root, 'cherryPick', { ref: hash }, true);
        },
        async deleteBranch(root, name) {
            const done = await send(root, 'deleteBranch', { name }, true, {
                asked: [BRANCH_NOT_MERGED]
            });
            if (done.ok) return 'deleted';
            return done.code === BRANCH_NOT_MERGED ? 'not-merged' : 'refused';
        },
        async deleteBranchAnyway(root, name) {
            await act(root, 'deleteBranchAnyway', { name }, true);
        },
        async createBranch(root, name, start) {
            await act(root, 'createBranch', start === undefined ? { name } : { name, start }, true);
        },
        switchBranch: (root, name) => act(root, 'switchBranch', { name }, true),
        push: (root) => act(root, 'push', {}, true),
        pull: (root) => act(root, 'pull', {}, true),
        fetch: (root) => act(root, 'fetch'),
        sync: (root) => act(root, 'sync', {}, true),
        publish: (root, remote) => act(root, 'publish', { remote }, true),
        async abortMerge(root) {
            await act(root, 'abortMerge', {}, true);
        },
        async continueRebase(root) {
            await act(root, 'continueRebase', {}, true);
        },
        resolve: (root, path, content) => act(root, 'resolve', { path, content }),
        async markResolved(root, path) {
            await act(root, 'markResolved', { path });
        },
        acceptDeletion: (root, path) => act(root, 'acceptDeletion', { path }, true),
        async stash(root, mode, message) {
            await act(root, 'stash', { mode, message });
        },
        async stashAct(root, verb, ref) {
            if (verb === 'apply') await act(root, 'stashApply', { ref });
            else if (verb === 'pop') await act(root, 'stashPop', { ref });
            else await act(root, 'stashDrop', { ref }, true);
        },
        async createTag(root, name, message, start) {
            await act(
                root,
                'createTag',
                start === undefined ? { name, message } : { name, message, start }
            );
        },
        async deleteTag(root, name) {
            await act(root, 'deleteTag', { name }, true);
        },
        async pushTags(root) {
            await act(root, 'pushTags', {}, true);
        },
        async createWorktree(root, name, start) {
            const path = plannedPath(root, name);
            if (!(await makeWorktree(root, name)).ok) return;
            if (start === 'shell') await shellIn(root, path, name);
            else await agentIn(root, path, start);
        },
        makeWorktree,
        async removeWorktree(root, path) {
            await act(root, 'removeWorktree', { path }, true);
        },
        async merge(root, branch) {
            await act(root, 'merge', { branch }, true);
        },
        shellIn,
        agentIn,
        openDiff,
        openChangeBeside(root, group, path) {
            if (group === 'untracked') openFile(root, path, undefined, true);
            else openChange(root, group, path);
        },
        openChange,
        openHead(root, group, path) {
            if (group !== 'staged' && group !== 'changed') return;
            layout.openView('source', headTabState(root, path, 'head'));
        },
        openCompare(root, from, to) {
            const subject = {
                root,
                path: '',
                staged: false,
                worktree: false,
                compare: { from, to }
            };
            openDiff(subject, t('repositories.compare_label', from, to.slice(0, 7)));
        },
        compareWorkspace(root, path) {
            const subject = {
                root,
                path,
                staged: false,
                worktree: false,
                workspace: true as const
            };
            openDiff(subject, t('repositories.workspace_label', nameOf(path)));
        },
        openFile,
        placeOf: tabOf,
        revealFile,
        openMerge,
        openCommit(root, hash) {
            const id = layout.openView('repositories');
            const held = repositoriesViewOf(access.instanceState(id));
            access.setInstanceState(id, {
                ...held,
                root,
                commit: hash,
                collapsed: withoutClosedCommits(
                    held.collapsed.filter((one) => one !== 'graph'),
                    root,
                    hash
                )
            });
        }
    };
}
