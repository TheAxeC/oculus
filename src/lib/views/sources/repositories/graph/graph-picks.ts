// Layer 3, view partial. What the picks of a commit's menu that write do once chosen: the question
// of Checkout (Detached), Cherry Pick and Delete Branch, and the prompt of Create Branch and Create
// Tag, which asks for the name, and for a tag its message, the new ref starting at the commit. The
// stores and the words come in, so which question a pick asks and which write a yes sends are
// asserted without a DOM.

import type { PromptRequest } from '$lib/ui/forms/prompt';
import type { RepositoriesStore } from '$lib/state/sources/repositories/repositories.svelte';
import { askBranchDelete, type GraphPick } from '../menus/graph-menu';

type Words = (key: string, ...args: (string | number)[]) => string;

/** The writes a pick sends. */
export type PickWrites = Pick<
    RepositoriesStore,
    | 'checkoutDetached'
    | 'cherryPick'
    | 'deleteBranch'
    | 'deleteBranchAnyway'
    | 'createTag'
    | 'createBranch'
>;

/** What a pick is answered with: the repository, the question, the writes and the words. */
export type PickDeps = {
    root: string;
    /** The branch checked out, or `HEAD` on a detached HEAD, which Cherry Pick names. */
    onto: string;
    ask: (message: string, detail: string, act: () => void, confirm?: string) => void;
    repositories: PickWrites;
    t: Words;
};

/** Ask the question of a pick that moves the checkout or the branch, then send the write. */
export function askPick(pick: GraphPick, hash: string, deps: PickDeps): void {
    const { root, ask, repositories, t } = deps;
    if (pick.kind === 'detach') {
        ask(
            t('repositories.detach_confirm', hash.slice(0, 7)),
            t('repositories.detach_detail'),
            () => {
                void repositories.checkoutDetached(root, hash);
            }
        );
    } else if (pick.kind === 'detach-ref') {
        ask(t('repositories.detach_confirm', pick.name), t('repositories.detach_detail'), () => {
            void repositories.checkoutDetached(root, pick.name);
        });
    } else if (pick.kind === 'cherry-pick') {
        ask(
            t('repositories.cherry_pick_confirm', hash.slice(0, 7), deps.onto),
            t('repositories.cherry_pick_detail'),
            () => {
                void repositories.cherryPick(root, hash);
            }
        );
    } else if (pick.kind === 'delete-branch') {
        askBranchDelete(
            pick.name,
            {
                ask,
                deleteBranch: (name: string) => repositories.deleteBranch(root, name),
                deleteAnyway: (name: string) => void repositories.deleteBranchAnyway(root, name)
            },
            t
        );
    }
}

/**
 * The prompt of Create Branch or Create Tag from a commit: the name, and a tag's message. The new
 * branch or tag starts at the commit picked. `closed` runs when the prompt is answered, before the
 * write is sent.
 */
export function namePrompt(
    pick: GraphPick,
    hash: string,
    deps: Pick<PickDeps, 'root' | 't'> & { repositories: PickWrites },
    closed: () => void
): PromptRequest {
    const { root, repositories, t } = deps;
    const tag = pick.kind === 'create-tag';
    const fields = [
        { label: tag ? t('repositories.tag_name') : t('repositories.branch_name'), value: '' },
        ...(tag ? [{ label: t('repositories.tag_message'), value: '' }] : [])
    ];
    return {
        message: tag ? t('repositories.menu_create_tag') : t('repositories.menu_create_branch'),
        fields,
        verb: tag ? t('repositories.tag_do') : t('repositories.branch_do'),
        act: (values) => {
            closed();
            const name = (values[0] ?? '').trim();
            if (name === '') return;
            if (tag) void repositories.createTag(root, name, values[1] ?? '', hash);
            else void repositories.createBranch(root, name, hash);
        }
    };
}
