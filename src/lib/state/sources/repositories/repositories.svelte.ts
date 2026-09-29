// Layer 2, client state. What the Source Control views do when a control is pressed: the git writes
// over one root, the commit message being written for each root, the shell a new worktree opens
// with, and the panes a diff, a conflicted file, a file and a commit open in.
//
// It is a store rather than handlers inside the components because what a press leaves behind is
// state a reader sees: which roots have a write in flight, what the last one on each answered, and
// the message typed for each. The Repositories view, the sessions Changes panel and the status bar
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

import { diffState, plannedPath, repositoriesViewOf, type DiffSubject } from './repositories.ts';
import { tabOfFile, type ServedRoot } from './file-git.ts';
import type { PatchMode } from './diff-patch.ts';
import type { WritesStore } from '../../shared/stores/shapes.ts';
import { t } from '../../shared/words/text.ts';
import { openShell, type ShellStarter } from '../../shared/stores/shell.ts';

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

export type RepositoriesStore = {
    /** Whether a write is in flight on this root. */
    busy: (root: string) => boolean;
    /** What the last write on this root answered, or the empty string. */
    outcome: (root: string) => string;
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
    stageAll: (root: string, group: ChangeGroup) => Promise<void>;
    unstageAll: (root: string) => Promise<void>;
    discardAll: (root: string) => Promise<void>;
    /** Apply a patch the diff pane cut, answering whether git took it. */
    applyPatch: (root: string, patch: string, mode: PatchMode) => Promise<boolean>;
    createBranch: (root: string, name: string) => Promise<void>;
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
    createTag: (root: string, name: string, message: string) => Promise<void>;
    deleteTag: (root: string, name: string) => Promise<void>;
    pushTags: (root: string) => Promise<void>;
    /** Make the worktree and open a shell in it; the path is the view's own rule. */
    createWorktree: (root: string, name: string) => Promise<void>;
    removeWorktree: (root: string, path: string) => Promise<void>;
    merge: (root: string, branch: string) => Promise<void>;
    /** Open a shell in a worktree that is already there. */
    shellIn: (root: string, cwd: string, label: string) => Promise<void>;
    /** Open one diff in a pane of its own beside the one being read. */
    openDiff: (subject: DiffSubject, label: string) => void;
    /**
     * Open what a change row stands for: the merge editor for a conflict, the file itself for an
     * untracked path, which has no diff, and the diff for the rest.
     */
    openChange: (root: string, group: string, path: string) => void;
    /** Open a repository's file in a source tab, at a line when one is given. */
    openFile: (root: string, path: string, line?: number) => boolean;
    /**
     * Show a repository's file in the Files view, under the served root holding it most closely,
     * answering whether one does.
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
    openBeside: (view: string, state?: unknown) => string;
    showInFiles: (path: string, root?: string) => string;
};

/**
 * What the store needs to open a file and point a view: the roots the file routes serve, and a
 * view instance's own remembered state. The fs store and the ui store satisfy it.
 */
export type OpenAccess = {
    served: () => ServedRoot[];
    instanceState: (id: string) => unknown;
    setInstanceState: (id: string, state: unknown) => void;
};

/** A path's own name, what a tab opened on it is called. */
function nameOf(path: string): string {
    return path.split('/').filter(Boolean).at(-1) ?? path;
}

export function createRepositories(
    writes: WritesStore,
    terminals: ShellStarter,
    layout: ViewOpener,
    access: OpenAccess
): RepositoriesStore {
    const state: {
        busy: string[];
        outcomes: Record<string, string>;
        messages: Record<string, string>;
        suggesting: string[];
    } = $state({ busy: [], outcomes: {}, messages: {}, suggesting: [] });

    function busy(root: string): boolean {
        return state.busy.includes(root);
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
        confirmed = false
    ): Promise<{ ok: boolean; output: string }> {
        if (root === '' || busy(root)) return { ok: false, output: '' };
        state.busy = [...state.busy, root];
        say(root, '');
        try {
            const answer = await writes.writeGit(
                action,
                root,
                confirmed ? { ...fields, confirm: true } : fields
            );
            say(root, answer.ok ? t('git.done') : (answer.error ?? ''));
            return { ok: answer.ok, output: answer.output ?? '' };
        } finally {
            state.busy = state.busy.filter((one) => one !== root);
        }
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

    function openDiff(subject: DiffSubject, label: string): void {
        layout.openBeside(DIFF_VIEW, diffState(subject, label));
    }

    function openMerge(root: string, path: string): void {
        layout.openBeside(MERGE_VIEW, { id: `merge:${root}:${path}`, root, path, label: path });
    }

    function openFile(root: string, path: string, line?: number): boolean {
        const tab = tabOfFile(access.served(), { root, path });
        if (tab === null) {
            say(root, t('repositories.open_unserved', path));
            return false;
        }
        const state = { root: tab.root, path: tab.path, label: nameOf(path) };
        layout.openView('source', line === undefined || line <= 0 ? state : { ...state, line });
        return true;
    }

    function revealFile(root: string, path: string): boolean {
        const tab = tabOfFile(access.served(), { root, path });
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

    return {
        busy,
        outcome,
        message: (root) => state.messages[root] ?? '',
        setMessage,
        suggesting: (root) => state.suggesting.includes(root),
        suggest,
        commit,
        async stage(root, path) {
            await act(root, 'stage', { paths: [path] });
        },
        async unstage(root, path) {
            await act(root, 'unstage', { paths: [path] });
        },
        async discard(root, path) {
            await act(root, 'discard', { paths: [path] }, true);
        },
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
        async createBranch(root, name) {
            await act(root, 'createBranch', { name }, true);
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
        async createTag(root, name, message) {
            await act(root, 'createTag', { name, message });
        },
        async deleteTag(root, name) {
            await act(root, 'deleteTag', { name }, true);
        },
        async pushTags(root) {
            await act(root, 'pushTags', {}, true);
        },
        async createWorktree(root, name) {
            const path = plannedPath(root, name);
            if (await act(root, 'createWorktree', { name }, true)) await shellIn(root, path, name);
        },
        async removeWorktree(root, path) {
            await act(root, 'removeWorktree', { path }, true);
        },
        async merge(root, branch) {
            await act(root, 'merge', { branch }, true);
        },
        shellIn,
        openDiff,
        openChange(root, group, path) {
            if (group === 'merge') openMerge(root, path);
            else if (group === 'untracked') openFile(root, path);
            else openDiff({ root, path, staged: group === 'staged', worktree: false }, path);
        },
        openFile,
        revealFile,
        openMerge,
        openCommit(root, hash) {
            const id = layout.openView('repositories');
            const held = repositoriesViewOf(access.instanceState(id));
            access.setInstanceState(id, {
                ...held,
                root,
                commit: hash,
                collapsed: held.collapsed.filter((one) => one !== 'graph')
            });
        }
    };
}
