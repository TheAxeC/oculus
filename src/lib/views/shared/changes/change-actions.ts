// Layer 3, shared view partial. The actions a Changes panel offers on a repository's paths, which
// ChangeGroups.svelte draws the controls for and every panel around it supplies the handlers of.

/** What a group head's action does to its group. */
type GroupAction = 'stage-changed' | 'stage-untracked' | 'unstage' | 'discard';

/** The handlers of the controls on a row and on a group head. */
export type ChangeActions = {
    onstage: (path: string) => void;
    onunstage: (path: string) => void;
    ondiscard: (path: string) => void;
    /** Mark a conflicted path resolved, staging it as it stands or its deletion. */
    onresolve: (path: string) => void;
    /** A group head's action: stage the changed or untracked, unstage all, discard all. */
    ongroup: (act: GroupAction) => void;
    /** Open what a row stands for, by the group it is in. */
    onopen: (path: string, kind: string) => void;
};
