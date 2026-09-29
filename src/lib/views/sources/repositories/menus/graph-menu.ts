// Layer 3, view partial. The menus of a commit of the Repositories view's graph, as VS Code's
// Source Control Graph builds them: the commit's own, which its right-click and its "more" control
// both open, and the one a branch or tag name on the commit opens.
//
// A commit offers Open Changes (its files, as a press opens them), Copy Commit ID and Copy Commit
// Message, then a Checkout submenu of the local branches named on it and a Delete Tag submenu of
// its tags. A branch checked out already is left out of Checkout, as the Branches section offers
// no switch on it, and a remote branch has no Checkout here, since a switch takes a local branch.
// A checkout and a tag's removal go through the questions the Branches and Tags sections ask, and
// neither is offered while a write is in flight on the repository.
//
// The items are pure functions of the commit, so which items a commit offers is asserted without a
// DOM, and the words come in as `t` so every label is a catalog key. A branch or tag name is the
// repository's own and is passed through as it is.

import { grouped, type MenuItem } from '$lib/ui/menu/menu-items';

type Words = (key: string, ...args: (string | number)[]) => string;

export const GRAPH_OPEN = 'open-changes';
export const GRAPH_COPY_ID = 'copy-id';
export const GRAPH_COPY_MESSAGE = 'copy-message';
const CHECKOUT_LIST = 'checkout';
const TAG_LIST = 'delete-tag';
const CHECKOUT = 'checkout:';
const DELETE_TAG = 'tag:';

/** The branches of the repository a commit's names are read against. */
export type BranchFacts = {
    /** The local branches git lists. */
    local: readonly string[];
    /** The branch checked out, or the empty string on a detached HEAD. */
    current: string;
};

/** What a name on a commit offers: a checkout, a tag's removal, or nothing. */
export type RefKind = 'branch' | 'tag' | 'none';

/** What a branch name on a commit offers: a local branch not checked out is checked out. */
export function refKind(name: string, branches: BranchFacts): RefKind {
    return branches.local.includes(name) && name !== branches.current ? 'branch' : 'none';
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
    t: Words
): MenuItem[] {
    const checkouts = busy
        ? []
        : commit.refs.filter((name) => refKind(name, branches) === 'branch').map(checkoutItem);
    const tags = busy ? [] : commit.tags.map(tagItem);
    return grouped([
        [{ id: GRAPH_OPEN, label: t('repositories.menu_open_changes') }],
        [
            { id: GRAPH_COPY_ID, label: t('repositories.copy_id') },
            { id: GRAPH_COPY_MESSAGE, label: t('repositories.copy_message') }
        ],
        [
            ...(checkouts.length > 0
                ? [{ id: CHECKOUT_LIST, label: t('repositories.menu_checkout'), items: checkouts }]
                : []),
            ...(tags.length > 0
                ? [{ id: TAG_LIST, label: t('repositories.tag_delete'), items: tags }]
                : [])
        ]
    ]);
}

/** The menu of one name on a commit: Checkout on a local branch, Delete Tag on a tag. */
export function refMenu(name: string, kind: RefKind, busy: boolean, t: Words): MenuItem[] {
    if (busy || kind === 'none') return [];
    if (kind === 'tag')
        return [{ id: `${DELETE_TAG}${name}`, label: t('repositories.tag_delete') }];
    return [{ id: `${CHECKOUT}${name}`, label: t('repositories.menu_checkout') }];
}

/** What a pick from a commit's or a name's menu asks for. */
export type GraphPick =
    | { kind: 'open' }
    | { kind: 'copy-id' }
    | { kind: 'copy-message' }
    | { kind: 'checkout'; name: string }
    | { kind: 'delete-tag'; name: string };

/** The pick an item id stands for, or null for an id no graph menu gives. */
export function graphPick(id: string): GraphPick | null {
    if (id === GRAPH_OPEN) return { kind: 'open' };
    if (id === GRAPH_COPY_ID) return { kind: 'copy-id' };
    if (id === GRAPH_COPY_MESSAGE) return { kind: 'copy-message' };
    if (id.startsWith(CHECKOUT) && id.length > CHECKOUT.length) {
        return { kind: 'checkout', name: id.slice(CHECKOUT.length) };
    }
    if (id.startsWith(DELETE_TAG) && id.length > DELETE_TAG.length) {
        return { kind: 'delete-tag', name: id.slice(DELETE_TAG.length) };
    }
    return null;
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
