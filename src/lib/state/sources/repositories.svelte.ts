// Layer 2, client state. What the Repositories view and the status bar's branch and sync items do
// when a control is pressed: the git writes over one root, the shell a new worktree opens with, and
// the pane a diff opens in.
//
// It is a store rather than handlers inside the component because what a press leaves behind is
// state a reader sees: which roots have a write in flight and what the last one on each answered.
// A write is refused only on the root it is over, so a commit in one repository leaves the controls
// of every other repository live.
//
// The stores it works through are handed in, so a test drives the whole thing with its own writes
// and terminals and no component is mounted.

import { diffState, plannedPath, type DiffSubject } from './repositories.ts';
import type { LayoutStore } from '../workbench/layout.svelte.ts';
import type { TerminalsStore } from '../sessions/terminals.svelte.ts';
import type { WritesStore } from '../client/writes.svelte.ts';
import { t } from '../words/text.ts';

/** The view id of the pane one diff opens in. */
export const DIFF_VIEW = 'repositories-diff';

export type RepositoriesStore = {
    /** Whether a write is in flight on this root. */
    busy: (root: string) => boolean;
    /** What the last write on this root answered, or the empty string. */
    outcome: (root: string) => string;
    stage: (root: string, path: string) => Promise<void>;
    unstage: (root: string, path: string) => Promise<void>;
    discard: (root: string, path: string) => Promise<void>;
    createBranch: (root: string, name: string) => Promise<void>;
    /** Check a branch out, answering whether git did. */
    switchBranch: (root: string, name: string) => Promise<boolean>;
    /** Push the checked-out branch to its upstream, answering whether git did. */
    push: (root: string) => Promise<boolean>;
    /** Make the worktree and open a shell in it; the path is the view's own rule. */
    createWorktree: (root: string, name: string) => Promise<void>;
    removeWorktree: (root: string, path: string) => Promise<void>;
    merge: (root: string, branch: string) => Promise<void>;
    /** Open a shell in a worktree that is already there. */
    shellIn: (root: string, cwd: string, label: string) => Promise<void>;
    /** Open one diff in a pane of its own beside the one being read. */
    openDiff: (subject: DiffSubject, label: string) => void;
};

export function createRepositories(
    writes: WritesStore,
    terminals: TerminalsStore,
    layout: LayoutStore
): RepositoriesStore {
    const state: { busy: string[]; outcomes: Record<string, string> } = $state({
        busy: [],
        outcomes: {}
    });

    function busy(root: string): boolean {
        return state.busy.includes(root);
    }

    function outcome(root: string): string {
        return state.outcomes[root] ?? '';
    }

    function say(root: string, sentence: string): void {
        state.outcomes = { ...state.outcomes, [root]: sentence };
    }

    /**
     * One write on one root. A second write on the same root while one is in flight is refused; a
     * write on another root is not, since the two touch different repositories.
     */
    async function act(
        root: string,
        action: string,
        fields: Record<string, unknown> = {},
        confirmed = false
    ): Promise<boolean> {
        if (root === '' || busy(root)) return false;
        state.busy = [...state.busy, root];
        say(root, '');
        try {
            const answer = await writes.writeGit(
                action,
                root,
                confirmed ? { ...fields, confirm: true } : fields
            );
            say(root, answer.ok ? t('git.done') : (answer.error ?? ''));
            return answer.ok;
        } finally {
            state.busy = state.busy.filter((one) => one !== root);
        }
    }

    /**
     * Start a shell where the reader is looking. A terminal that will not start is said after the
     * write's own sentence rather than over it: the worktree is there either way, and the reader
     * needs both facts.
     */
    async function shellIn(root: string, cwd: string, label: string): Promise<void> {
        const answer = await terminals.startTerminal('shell', cwd);
        if (!answer.ok) {
            const held = outcome(root);
            say(root, held === '' ? answer.error : `${held} ${answer.error}`);
            return;
        }
        layout.openView('terminal', { session: answer.id, label });
    }

    return {
        busy,
        outcome,
        async stage(root: string, path: string): Promise<void> {
            await act(root, 'stage', { paths: [path] });
        },
        async unstage(root: string, path: string): Promise<void> {
            await act(root, 'unstage', { paths: [path] });
        },
        async discard(root: string, path: string): Promise<void> {
            await act(root, 'discard', { paths: [path] }, true);
        },
        async createBranch(root: string, name: string): Promise<void> {
            await act(root, 'createBranch', { name }, true);
        },
        switchBranch(root: string, name: string): Promise<boolean> {
            return act(root, 'switchBranch', { name }, true);
        },
        push(root: string): Promise<boolean> {
            return act(root, 'push', {}, true);
        },
        async createWorktree(root: string, name: string): Promise<void> {
            const path = plannedPath(root, name);
            if (await act(root, 'createWorktree', { name }, true)) await shellIn(root, path, name);
        },
        async removeWorktree(root: string, path: string): Promise<void> {
            await act(root, 'removeWorktree', { path }, true);
        },
        async merge(root: string, branch: string): Promise<void> {
            await act(root, 'merge', { branch }, true);
        },
        shellIn,
        openDiff(subject: DiffSubject, label: string): void {
            layout.openBeside(DIFF_VIEW, diffState(subject, label));
        }
    };
}
