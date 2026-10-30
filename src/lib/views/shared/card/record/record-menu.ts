// Layer 3, view helper. A record card's actions in the two shapes the card draws them: the icons
// of the strip it shows under the pointer, and the runs of the menu its "..." opener and a
// right-click on the card open, which list every action. It is apart from RecordCard.svelte so the
// order of the runs is read in one place, every kind's menu is built by it, and both menus list the
// same rows.
//
// The menu holds a run headed Open (Page, Folder, Show in Files, Workbench, Presentation, then the
// kind's own openers), a run headed Add (Follow-up, Subtask, Deadline), a run headed Status (one
// row whose submenu lists the statuses the card may write), then a run with no heading (Ask, Edit
// Manifest or Edit, which opens the record's editor beside the page, Edit in File, Pin to Top or
// Unpin, Copy Context, Deposit, Clone or the Cloned-in entry, the kind's own actions, then Archive
// and Delete last). An action is placed by its id, the part before a colon for an id that names a
// path (`files:<path>`, `workbench:<path>`), or by its `run` when its id is none of those. A row
// the card does not offer is left out of its run, and a run left with no row is left out. The
// strip holds the actions whose ids the kind names, in that order, at most three, a row of a
// submenu among them.

import type { MenuGroup, MenuItem } from '$lib/ui/menu/menu-items';
import type { Followup, Project, Subtask } from '$lib/state/boards/collection';
import type { SubtaskTarget, WriteAnswer } from '$lib/state/client/writes.svelte';
import { t } from '$lib/state/shared/words/text';
import type { CardAction } from '../card';

/** What a row of the Add run adds or changes: a follow-up, a subtask, or the deadline. */
export type DatedKind = 'followup' | 'subtask' | 'deadline';

/** What the Add run of a record card is made from, and the dated lines the card draws. */
export type RecordDated = {
    /** What a follow-up and a subtask hang under; none for a record no line hangs under. */
    target?: SubtaskTarget;
    /** The record's subtasks and notes the card lists; none draws only the add forms. */
    subtasks?: Subtask[];
    followups?: Followup[];
    /** The record's deadline, its field's type, and the write that sets or clears it. */
    deadline?: {
        held: string;
        type: 'date' | 'text';
        write: (value: string | null) => Promise<WriteAnswer>;
    };
    /**
     * The text a line picked onto another record starts with: the card's Follow-up and Subtask
     * open the kind and record dropdowns, and the line goes to the record picked there.
     */
    pick?: string;
    /** The projects the dropdowns of `pick` offer: the live ones. */
    projects?: Project[];
    /** Why the rows and the forms that write are disabled, '' when they are not. */
    blocked?: string;
};

/** The run of the menu an action of a kind's own is placed in. */
type RecordRun = 'open' | 'status' | 'rest';

/**
 * One action of a record card: the control of the strip it may be (CardAction, whose `label` and
 * `title` are its words there), the words of its row in the menu (`row`), which are its `label`
 * where it gives none, and the run an action of the kind's own is placed in (`run`), the run with
 * no heading where it names none.
 */
export type RecordAction = CardAction & { row?: string; run?: RecordRun };

/** The most icons the strip draws. */
const STRIP = 3;

/** The actions placed last in the run with no heading, after the kind's own. */
const LAST = ['archive', 'delete'];

/** The menu's runs: an id, the words of the heading (empty for none) and the actions in order. */
const RUNS: { id: string; heading: () => string; actions: string[]; own?: RecordRun }[] = [
    {
        id: 'open',
        heading: () => t('project.menu.open'),
        actions: ['page', 'folder', 'files', 'workbench', 'present'],
        own: 'open'
    },
    {
        id: 'add',
        heading: () => t('project.menu.add'),
        actions: ['followup', 'subtask', 'deadline']
    },
    { id: 'status', heading: () => t('project.menu.status'), actions: ['status'] },
    {
        id: 'rest',
        heading: () => '',
        actions: ['ask', 'editor', 'edit', 'pin', 'copy', 'deposit', 'clone', 'cloned'],
        own: 'rest'
    }
];

/** The ids every run names, which an action of the kind's own is not. */
const NAMED = new Set([...RUNS.flatMap((run) => run.actions), ...LAST]);

/** The id an action is placed by: the part of its id before a colon. */
function placeOf(action: RecordAction): string {
    const at = action.id.indexOf(':');
    return at < 0 ? action.id : action.id.slice(0, at);
}

/** One action, and the actions of its submenu at every depth. */
function flat(actions: readonly CardAction[]): CardAction[] {
    return actions.flatMap((one) => [one, ...flat(one.items ?? [])]);
}

/** The row of the menu one action is, with the rows of its submenu. */
export function menuItem(action: RecordAction): MenuItem {
    return {
        id: action.id,
        label: action.row ?? action.label,
        title: action.title ?? action.label,
        glyph: action.glyph,
        turning: action.turning,
        active: action.active,
        checked: action.checked,
        disabled: action.disabled,
        items: action.items?.map(menuItem)
    };
}

/** The actions of one run, in its order: those it names, then the kind's own, then the last. */
function runActions(run: (typeof RUNS)[number], actions: readonly RecordAction[]): RecordAction[] {
    const named = run.actions.flatMap((id) => actions.filter((one) => placeOf(one) === id));
    if (run.own === undefined) return named;
    const own = actions.filter(
        (one) => !NAMED.has(placeOf(one)) && (one.run ?? 'rest') === run.own
    );
    const last =
        run.own === 'rest' ? LAST.flatMap((id) => actions.filter((one) => one.id === id)) : [];
    return [...named, ...own, ...last];
}

/**
 * The card's actions the strip draws: those `ids` names, in that order, at most three, each the
 * card offers, a row of a submenu among them.
 */
export function stripActions(actions: readonly CardAction[], ids: readonly string[]): CardAction[] {
    const every = flat(actions);
    return ids.flatMap((id) => every.filter((one) => one.id === id).slice(0, 1)).slice(0, STRIP);
}

/** The runs of the card's menu, each with the rows of the actions the card offers. */
export function menuRuns(actions: readonly RecordAction[]): MenuGroup[] {
    return RUNS.flatMap((run) => {
        const items = runActions(run, actions).map(menuItem);
        return items.length === 0 ? [] : [{ id: run.id, heading: run.heading(), items }];
    });
}

/**
 * Run the action a row of the menu names, a row of a submenu included, unless it is disabled or
 * stands for a submenu.
 */
export function pickAction(actions: readonly CardAction[], id: string): void {
    const action = flat(actions).find((one) => one.id === id);
    if (action === undefined || action.disabled === true || action.items !== undefined) return;
    void action.onclick();
}

/** Open Page, the record's page, which the strip of a record with a page draws. */
export function pageAction(onpage: () => void): RecordAction {
    return {
        id: 'page',
        label: t('project.card.open_record_page'),
        row: t('project.menu.record_page'),
        title: t('project.card.open_record_page_tip'),
        glyph: t('project.card.page_glyph'),
        onclick: onpage
    };
}

/**
 * Edit, which opens the record's editor beside the page, its own id since `edit` is Edit in File.
 * `blocked` holds the words saying why the record has no editor to open, which disable the row.
 */
export function editorAction(onedit: () => void, blocked = ''): RecordAction {
    return {
        id: 'editor',
        label: t('project.card.edit_record'),
        title: blocked === '' ? undefined : blocked,
        glyph: t('project.card.edit_glyph'),
        disabled: blocked !== '',
        onclick: onedit
    };
}

/**
 * The Status row: one action whose submenu lists `items`, the statuses the card may write, with
 * `title` its words where it is disabled. A card with no status to write has none.
 */
export function statusAction(items: CardAction[], title?: string): RecordAction[] {
    if (items.length === 0) return [];
    return [
        {
            id: 'status',
            label: t('project.menu.set_status'),
            title,
            glyph: t('project.menu.status_glyph'),
            items,
            onclick: () => undefined
        }
    ];
}
