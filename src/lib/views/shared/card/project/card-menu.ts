// Layer 3, view helper. The project card's actions in the two shapes the card draws them: the
// icons of the strip it shows under the pointer, and the runs of the menu its "..." opener and a
// right-click on the card open, which list every action. It is apart from ProjectCard.svelte so
// the order of the runs is read in one place, and both menus list the same rows.
//
// The strip holds Ask, Open Workbench and Open project page, in that order, each where the card
// offers it. The menu holds a run headed Open (Project Page, Folder, Show in Files, Workbench,
// Presentation), a run headed Add (Subtask, Follow-up), then a run with no heading (Ask, Edit
// Manifest, Pin to Top or Unpin, Copy Context, Deposit, Clone or the Cloned-in entry). A row the
// card does not offer is left out of its run, and a run left with no row is left out.

import type { MenuGroup } from '$lib/ui/menu/menu-items';
import { t } from '$lib/state/shared/words/text';
import type { CardAction } from '../card';

/**
 * One action of the project card: the control of the strip it may be (CardAction, whose `label`
 * and `title` are its words there) and the words of its row in the menu (`row`), which are its
 * `label` where it gives none.
 */
export type ProjectAction = CardAction & { row?: string };

/** The actions the strip draws as icons, in its order. */
const ICONS = ['ask', 'workbench', 'page'];

/** The menu's runs: an id, the words of the heading (empty for none) and the actions in order. */
const RUNS: { id: string; heading: () => string; actions: string[] }[] = [
    {
        id: 'open',
        heading: () => t('project.menu.open'),
        actions: ['page', 'folder', 'files', 'workbench', 'present']
    },
    { id: 'add', heading: () => t('project.menu.add'), actions: ['subtask', 'followup'] },
    {
        id: 'rest',
        heading: () => '',
        actions: ['ask', 'edit', 'pin', 'copy', 'deposit', 'clone', 'cloned']
    }
];

/** The card's actions the strip draws, in its order, each that the card offers. */
export function stripActions(actions: readonly ProjectAction[]): CardAction[] {
    return ICONS.flatMap((id) => actions.filter((one) => one.id === id));
}

/** The runs of the card's menu, each with the rows of the actions the card offers. */
export function menuRuns(actions: readonly ProjectAction[]): MenuGroup[] {
    return RUNS.flatMap((run) => {
        const items = run.actions.flatMap((id) =>
            actions
                .filter((one) => one.id === id)
                .map((one) => ({
                    id: one.id,
                    label: one.row ?? one.label,
                    title: one.title ?? one.label,
                    glyph: one.glyph,
                    turning: one.turning,
                    disabled: one.disabled
                }))
        );
        return items.length === 0 ? [] : [{ id: run.id, heading: run.heading(), items }];
    });
}

/** Run the action a row of the menu names, unless it is disabled. */
export function pickAction(actions: readonly ProjectAction[], id: string): void {
    const action = actions.find((one) => one.id === id);
    if (action !== undefined && action.disabled !== true) void action.onclick();
}
