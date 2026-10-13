// Layer 3, view partial of Source.svelte. The apps' entries of the `editor/context` menu as editor
// actions: an entry of the group `navigation` joins the editor's own `navigation` group at the top
// of the right-click menu, as VS Code places it, and every other entry is listed under a group of
// its own that sorts after the editor's. Each runs its command with the file as `{ root, path }`.
// The groups keep the order the menu gives them (state/system/apps/shell/contributions.ts
// `menuOffers`). A source control of an app that gives quick diff originals adds an action per
// control that covers the file, which opens the file's changes against the control's original
// beside the marks of git.

import { t } from '$lib/state/shared/words/text';
import type { AppScmState } from '$lib/state/system/apps/tools/scm.svelte';
import type { DiffSubject } from '$lib/state/sources/repositories/diff/subject';
import type { MenuOffer } from '$lib/state/system/apps/shell/contributions';
import type { EditorOwnAction } from '$lib/ui/controls/editor/types';

/** The group ids of the entries, which sort after every group the editor names itself. */
const GROUP = 'zz_app_';

/** The group the editor's menu draws first, VS Code's and Monaco's name for it. */
const NAVIGATION = 'navigation';

/** The editor actions that open the changes of a file in the quick diff of each source control. */
export function quickDiffActions(
    controls: readonly AppScmState[],
    file: { root: string; path: string },
    open: (subject: DiffSubject, label: string) => void
): EditorOwnAction[] {
    return controls
        .filter((control) => control.quickDiff && control.root === file.root)
        .map((control, at) => ({
            id: `app.${control.app}.${control.id}.quickdiff`,
            label: t('source.app_quick_diff', control.label),
            menu: NAVIGATION,
            order: 1000 + at,
            run: () =>
                open(
                    {
                        ...file,
                        staged: false,
                        worktree: false,
                        original: { app: control.app, id: control.id }
                    },
                    file.path
                )
        }));
}

/** The editor actions the entries stand for, with the command each runs for the file. */
export function appEditorActions(
    offers: readonly MenuOffer[],
    file: { root: string; path: string },
    run: (offer: MenuOffer, args: unknown[]) => void
): EditorOwnAction[] {
    const groups: string[] = [];
    return offers.map((offer, at) => {
        if (!groups.includes(offer.group)) groups.push(offer.group);
        return {
            id: `app.${offer.app}.${offer.command.command}.${at}`,
            label: offer.command.title,
            menu:
                offer.group === NAVIGATION
                    ? NAVIGATION
                    : `${GROUP}${String(groups.indexOf(offer.group)).padStart(3, '0')}`,
            order: at,
            run: () => run(offer, [{ root: file.root, path: file.path }])
        };
    });
}
