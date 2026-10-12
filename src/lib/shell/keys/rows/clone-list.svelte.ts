// Layer 3, shell, partial of Palette.svelte. The list of `:clone`: the repositories of the reader's
// GitHub account, asked of the clone store each time the query becomes that command, narrowed by
// the words typed after it, with a row for a typed address first. The account is asked once per
// opening of the command, so a repository made since shows on the next one.

import {
    cloneRows,
    type CloneRow,
    type GithubListing,
    type ParsedCommand
} from '$lib/state/workbench/palette';

/** What the list is made over. */
export type CloneListInput = {
    parsed: () => ParsedCommand | null;
    repos: () => Promise<GithubListing>;
};

/** The list of `:clone`. */
export type CloneList = {
    /** Whether the query is `:clone`. */
    readonly active: boolean;
    /** Its rows; only a typed address while the account is asked or when it could not be listed. */
    readonly rows: CloneRow[];
    /** Whether the account has not answered. */
    readonly loading: boolean;
    /** The sentence that says why the account could not be listed, empty when it could. */
    readonly error: string;
};

export function createCloneList(input: CloneListInput): CloneList {
    const active = $derived(input.parsed()?.name === 'clone');
    let held: GithubListing | null = $state(null);
    let turn = 0;

    $effect(() => {
        if (!active) {
            turn += 1;
            held = null;
            return;
        }
        const mine = ++turn;
        void input.repos().then((listed) => {
            if (mine === turn) held = listed;
        });
    });

    return {
        get active() {
            return active;
        },
        get rows() {
            return cloneRows(held?.ok === true ? held.repos : [], input.parsed()?.argument ?? '');
        },
        get loading() {
            return active && held === null;
        },
        get error() {
            return held?.ok === false ? held.error : '';
        }
    };
}
