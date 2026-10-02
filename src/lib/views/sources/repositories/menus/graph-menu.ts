// Layer 3, view partial. The menus of a commit of the Repositories view's graph, as VS Code's
// Source Control Graph builds them: the commit's own, which its right-click and its "more" control
// both open, and the one a branch or tag name on the commit opens.
//
// A commit offers Open Changes (its files, as a press opens them), Copy Commit ID and Copy Commit
// Message, then a Checkout submenu of the local branches named on it, Checkout (Detached), Create
// Branch..., Create Tag... and a Delete Tag submenu of its tags, then Cherry Pick, then the compare
// items: Compare with Remote when the checked-out branch has an upstream, Compare with Merge Base
// when git names a base for it, and Compare with... for any ref. A branch checked out already is
// left out of Checkout, as the Branches section offers no switch on it. A name on a commit has its
// own menu: a local branch not checked out offers Checkout and Delete Branch, a remote branch
// Checkout (Detached), a tag Delete Tag. Every write goes through the question the matching
// section asks, and none is offered while a write is in flight on the repository; the compare
// items are reads and stay.
//
// The items are pure functions of the commit, so which items a commit offers is asserted without a
// DOM, and the words come in as `t` so every label is a catalog key. A branch or tag name is the
// repository's own and is passed through as it is.

import { grouped, type MenuItem } from '$lib/ui/menu/menu-items';
import type { BranchDeletion } from '$lib/state/sources/repositories/repositories.svelte';

type Words = (key: string, ...args: (string | number)[]) => string;

export const GRAPH_OPEN = 'open-changes';
export const GRAPH_COPY_ID = 'copy-id';
export const GRAPH_COPY_MESSAGE = 'copy-message';
export const GRAPH_DETACH = 'detach';
export const GRAPH_CREATE_BRANCH = 'create-branch';
export const GRAPH_CREATE_TAG = 'create-tag';
export const GRAPH_CHERRY_PICK = 'cherry-pick';
export const GRAPH_COMPARE_REMOTE = 'compare-remote';
export const GRAPH_COMPARE_BASE = 'compare-base';
export const GRAPH_COMPARE_WITH = 'compare-with';
const CHECKOUT_LIST = 'checkout';
const TAG_LIST = 'delete-tag';
const CHECKOUT = 'checkout:';
const DELETE_TAG = 'tag:';
const DETACH_REF = 'detach-ref:';
const DELETE_BRANCH = 'delete-branch:';

/** The branches of the repository a commit's names are read against. */
export type BranchFacts = {
    /** The local branches git lists. */
    local: readonly string[];
    /** The branch checked out, or the empty string on a detached HEAD. */
    current: string;
    /** The remotes git lists, whose names begin a remote branch's. */
    remotes: readonly string[];
};

/** The refs the compare items name: the upstream of the checked-out branch and its merge base. */
export type CompareFacts = { upstream: string; base: string };

/** What a name on a commit offers: a checkout, a detached checkout, a tag's removal, or nothing. */
export type RefKind = 'branch' | 'remote' | 'tag' | 'none';

/**
 * What a branch name on a commit offers: a local branch not checked out is checked out or deleted,
 * a name beginning with a remote's is checked out detached.
 */
export function refKind(name: string, branches: BranchFacts): RefKind {
    if (branches.local.includes(name)) return name === branches.current ? 'none' : 'branch';
    return branches.remotes.some((remote) => name.startsWith(`${remote}/`)) ? 'remote' : 'none';
}

function checkoutItem(name: string): MenuItem {
    return { id: `${CHECKOUT}${name}`, label: name };
}

function tagItem(name: string): MenuItem {
    return { id: `${DELETE_TAG}${name}`, label: name };
}

/** A commit's items, its Checkout and Delete Tag submenus only where they hold a name. */
export function commitMenu(
    commit: { refs: readonly string[]; tags: readonly string[] },
    branches: BranchFacts,
    busy: boolean,
    t: Words,
    compare: CompareFacts
): MenuItem[] {
    const checkouts = busy
        ? []
        : commit.refs.filter((name) => refKind(name, branches) === 'branch').map(checkoutItem);
    const tags = busy ? [] : commit.tags.map(tagItem);
    const item = (id: string, label: string): MenuItem => ({ id, label });
    return grouped([
        [{ id: GRAPH_OPEN, label: t('repositories.menu_open_changes') }],
        [
            { id: GRAPH_COPY_ID, label: t('repositories.copy_id') },
            { id: GRAPH_COPY_MESSAGE, label: t('repositories.copy_message') }
        ],
        busy
            ? []
            : [
                  ...(checkouts.length > 0
                      ? [
                            {
                                id: CHECKOUT_LIST,
                                label: t('repositories.menu_checkout'),
                                items: checkouts
                            }
                        ]
                      : []),
                  item(GRAPH_DETACH, t('repositories.menu_checkout_detached')),
                  item(GRAPH_CREATE_BRANCH, t('repositories.menu_create_branch')),
                  item(GRAPH_CREATE_TAG, t('repositories.menu_create_tag')),
                  ...(tags.length > 0
                      ? [{ id: TAG_LIST, label: t('repositories.tag_delete'), items: tags }]
                      : [])
              ],
        busy ? [] : [item(GRAPH_CHERRY_PICK, t('repositories.menu_cherry_pick'))],
        [
            ...(compare.upstream === ''
                ? []
                : [item(GRAPH_COMPARE_REMOTE, t('repositories.menu_compare_remote'))]),
            ...(compare.base === ''
                ? []
                : [item(GRAPH_COMPARE_BASE, t('repositories.menu_compare_base'))]),
            item(GRAPH_COMPARE_WITH, t('repositories.menu_compare_with'))
        ]
    ]);
}

/**
 * The menu of one name on a commit: Checkout and Delete Branch on a local branch, Checkout
 * (Detached) on a remote branch, Delete Tag on a tag.
 */
export function refMenu(name: string, kind: RefKind, busy: boolean, t: Words): MenuItem[] {
    if (busy || kind === 'none') return [];
    if (kind === 'tag')
        return [{ id: `${DELETE_TAG}${name}`, label: t('repositories.tag_delete') }];
    if (kind === 'remote') {
        return [{ id: `${DETACH_REF}${name}`, label: t('repositories.menu_checkout_detached') }];
    }
    return [
        { id: `${CHECKOUT}${name}`, label: t('repositories.menu_checkout') },
        { id: `${DELETE_BRANCH}${name}`, label: t('repositories.menu_delete_branch') }
    ];
}

/** What a pick from a commit's or a name's menu asks for. */
export type GraphPick =
    | { kind: 'open' }
    | { kind: 'copy-id' }
    | { kind: 'copy-message' }
    | { kind: 'detach' }
    | { kind: 'create-branch' }
    | { kind: 'create-tag' }
    | { kind: 'cherry-pick' }
    | { kind: 'compare-remote' }
    | { kind: 'compare-base' }
    | { kind: 'compare-with' }
    | { kind: 'checkout'; name: string }
    | { kind: 'detach-ref'; name: string }
    | { kind: 'delete-branch'; name: string }
    | { kind: 'delete-tag'; name: string };

/** The pick of each item with no name in its id. */
const PLAIN: Record<string, GraphPick> = {
    [GRAPH_OPEN]: { kind: 'open' },
    [GRAPH_COPY_ID]: { kind: 'copy-id' },
    [GRAPH_COPY_MESSAGE]: { kind: 'copy-message' },
    [GRAPH_DETACH]: { kind: 'detach' },
    [GRAPH_CREATE_BRANCH]: { kind: 'create-branch' },
    [GRAPH_CREATE_TAG]: { kind: 'create-tag' },
    [GRAPH_CHERRY_PICK]: { kind: 'cherry-pick' },
    [GRAPH_COMPARE_REMOTE]: { kind: 'compare-remote' },
    [GRAPH_COMPARE_BASE]: { kind: 'compare-base' },
    [GRAPH_COMPARE_WITH]: { kind: 'compare-with' }
};

/** The pick an item id stands for, or null for an id no graph menu gives. */
export function graphPick(id: string): GraphPick | null {
    if (Object.hasOwn(PLAIN, id)) return PLAIN[id];
    const named = (prefix: string): string | null =>
        id.startsWith(prefix) && id.length > prefix.length ? id.slice(prefix.length) : null;
    const checkout = named(CHECKOUT);
    if (checkout !== null) return { kind: 'checkout', name: checkout };
    const detach = named(DETACH_REF);
    if (detach !== null) return { kind: 'detach-ref', name: detach };
    const branch = named(DELETE_BRANCH);
    if (branch !== null) return { kind: 'delete-branch', name: branch };
    const tag = named(DELETE_TAG);
    return tag === null ? null : { kind: 'delete-tag', name: tag };
}

/** Ask before deleting a tag, the question the Tags section's Delete asks. */
export function askTagDelete(
    name: string,
    deps: {
        ask: (message: string, detail: string, act: () => void) => void;
        deleteTag: (name: string) => void;
    },
    t: Words
): void {
    deps.ask(
        t('repositories.tag_delete_confirm', name),
        t('repositories.tag_delete_detail'),
        () => {
            deps.deleteTag(name);
        }
    );
}

/**
 * Ask before deleting a branch, VS Code's question, then delete it with `branch -d`. A branch git
 * calls not fully merged is kept by that, and VS Code's second question follows: its yes deletes
 * the branch with `branch -D`, its cancel leaves it. Any other refusal ends the delete, and the
 * store has said it.
 */
export function askBranchDelete(
    name: string,
    deps: {
        ask: (message: string, detail: string, act: () => void, confirm?: string) => void;
        deleteBranch: (name: string) => Promise<BranchDeletion>;
        deleteAnyway: (name: string) => void;
    },
    t: Words
): void {
    deps.ask(
        t('repositories.branch_delete_confirm', name),
        t('repositories.branch_delete_detail'),
        () => {
            void deps.deleteBranch(name).then((done) => {
                if (done !== 'not-merged') return;
                deps.ask(
                    t('repositories.branch_unmerged_confirm', name),
                    t('repositories.branch_unmerged_detail'),
                    () => {
                        deps.deleteAnyway(name);
                    },
                    t('repositories.branch_delete_button')
                );
            });
        },
        t('repositories.branch_delete_button')
    );
}
