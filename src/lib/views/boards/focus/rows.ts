// Layer 3, view helper of views/boards/focus/Focus.svelte. One ticker line turned into one row: the
// words that date it, the buttons it carries, what opening it means, and what pressing a button
// writes.
//
// The command center and the tasks section draw the same rows over different lists, so the shape of
// a row lives here once rather than in each partial. It holds no markup and no list: a caller keeps
// its own index of the lines it drew, because a button has to reach the line it sits on.
//
// A row's buttons are drawn only under the pointer or the keyboard
// (ui/display/ticker/Ticker.svelte's `reveal`), except the one the row exists for, which the
// builder names by the row's id: a subtask's or a follow-up's done, and a task entry's `done`
// status, since ticking a task off is what its row is for. Another entry's statuses are all left
// under the pointer: the palette's `closes_deadline` says a status drops off the deadline radar,
// which is not the same as the status a reader closes it with.
//
// A line whose buttons write an entry or a subtask of a collection file has them disabled, with the
// words naming the file as their title, while a source tab holds unsaved text of that file. The
// `agent` button writes nothing and stays enabled.
//
// A follow-up line's Remove deletes its note at once, as a subtask's Del does. A task entry's
// Remove writes nothing here: the tasks section asks the card's Delete question first
// (views/shared/forms/entry/DeleteAsk.svelte) for the entry `removeAsked` names.

import type { TickerAction, TickerRow } from '$lib/ui/display/ticker/ticker-rows';
import {
    daysTone,
    type Ticker,
    type TickerItem,
    type TickerTarget
} from '$lib/state/boards/ticker';
import type { Id, Venue } from '$lib/state/boards/focus';
import { pageView } from '$lib/state/forms/page-entry';
import type { TaskRef, TerminalsStore } from '$lib/state/sessions/terminals.svelte';
import { t } from '$lib/state/shared/words/text';
import type { WriteAnswer, WritesStore } from '$lib/state/client/writes.svelte';
import type { ClientState } from '$lib/state/client/context';
import { viewSourceFile, type ViewSource } from '$lib/state/sessions/view-source';
import { bareId, fileUnder, rootOf } from '$lib/state/shared/page/hubs';
import { blockedBy } from '$lib/views/shared/forms/entry-file';

/** What the command center and the tasks section are each given by the board that draws them. */
export type SectionProps = {
    /** The board's one ticker, walked once by the view that holds both sections. */
    week: Ticker | null;
    /** The moment every countdown on the board is measured from. */
    now: number;
    /** Whether the section is open, and the control on its heading that folds it. */
    open: boolean;
    ontoggle: () => void;
    /** Open one project as its own tab; the board owns what a tab is called. */
    onproject: (id: string) => void;
    /** What a write answered, for the one outcome line the board holds. */
    onsaid: (said: string) => void;
};

/** How a status button's id starts, the status following it. */
const STATUS = 'status:';

/** The id of the button that starts an agent on a task line. */
const AGENT = 'agent';

/**
 * The id of the Remove button: a follow-up line's takes its note out, and a task entry's asks
 * first, under the tasks section, before the entry is deleted.
 */
const REMOVE = 'remove';

/** The entry a task line names, by its collection key and its id, as a card's Delete names it. */
export type TaskEntry = { collection: string; id: string };

/**
 * The entry whose question a press asks: the task entry of the line when the press is its Remove,
 * and null for any other press or line, which `act` handles.
 */
export function removeAsked(line: TickerItem | undefined, action: string): TaskEntry | null {
    const target = line?.target;
    if (action !== REMOVE || target === undefined || !isTaskEntry(target)) return null;
    return target.collection === undefined
        ? null
        : { collection: target.collection, id: target.id };
}

/** Whether a target is an entry of the collection flagged `tasks`, and no line of one. */
function isTaskEntry(target: TickerTarget): boolean {
    return target.kind === 'entry' && target.task === true && target.subtask === undefined;
}

/** The lines one partial drew, by the row id each was given. */
export type RowIndex = Record<string, TickerItem | undefined>;

/** An index of the lines a partial draws, and the row builder that fills it. */
export type Rows = {
    index: RowIndex;
    row: (line: TickerItem, tail: string) => TickerRow;
    /** The id of the button a drawn row keeps visible, and nothing for a row that keeps none. */
    kept: (row: TickerRow) => string | undefined;
};

/**
 * The button one row exists for: its done, or a task entry's `done` status. Any other row (a
 * project's snoozes, a lead, an event) keeps none.
 */
export function keptAction(actions: TickerAction[] | undefined): string | undefined {
    if (actions === undefined) return undefined;
    return actions.find((action) => action.id === 'done' || action.id === `${STATUS}done`)?.id;
}

/**
 * The collection whose file a line's buttons write, by its key in the record's own hub, and
 * nothing for a line whose target is a project's manifest.
 */
function collectionOf(target: TickerTarget): string | undefined {
    return target.collection;
}

/**
 * The file a line of the collection `key` is written in: the primary hub's file the configuration
 * names, or the file of the hub that holds the entry `id` when that is another hub.
 */
function collectionFile(
    client: Pick<ClientState, 'selectors' | 'fs'>,
    key: string,
    id: string
): ViewSource | null {
    const parts = client.selectors.collectionsOfKey(key);
    const held = parts.find((one) => one.entries.some((entry) => entry.id === id));
    const primary = client.fs.primary();
    if (held === undefined || rootOf(held) === primary) {
        return viewSourceFile('collection', client.selectors.configMap(), primary, key);
    }
    return fileUnder(held.file, client.fs.roots(), primary);
}

/**
 * The words saying why a line's buttons cannot write, or '' when they can: the collection file the
 * line names has unsaved text in a source tab.
 */
export function fileBlock(
    client: Pick<ClientState, 'selectors' | 'source' | 'fs'>
): (line: TickerItem) => string {
    return (line) => {
        const collection = line.target === undefined ? undefined : collectionOf(line.target);
        if (collection === undefined || line.target === undefined) return '';
        const file = collectionFile(client, collection, line.target.id);
        const unsaved = file !== null && client.source.unsavedFile(file.root, file.path);
        return blockedBy(file, unsaved, undefined);
    };
}

/** The buttons as they are, or, under `blocked`, every one that writes disabled with its words. */
function lockedActions(
    actions: TickerAction[] | undefined,
    blocked: string
): TickerAction[] | undefined {
    if (actions === undefined || blocked === '') return actions;
    return actions.map((action) =>
        action.id === AGENT ? action : { ...action, disabled: true, title: blocked }
    );
}

/** The `agent` button of a task line: it opens the composer seeded with the task. */
function agentAction(): TickerAction {
    return {
        id: AGENT,
        label: t('project.action.agent'),
        title: t('project.action.agent_tip')
    };
}

/**
 * The reference of the task a line is: an entry of the collection flagged `tasks`, or a subtask of
 * a project, a funding scheme or an entry with the key and the `do` text the line shows. Any other
 * line is no task.
 */
function taskRef(line: TickerItem): TaskRef | null {
    const target = line.target;
    if (target === undefined) return null;
    if (target.subtask === undefined) {
        const entry = target.kind === 'entry' && target.task === true;
        return entry && target.collection !== undefined
            ? { id: target.id, collection: target.collection }
            : null;
    }
    if (line.subtaskDo === undefined) return null;
    const subtask = { key: target.subtask, do: line.subtaskDo };
    if (target.kind === 'manifest') return { id: target.id, subtask };
    if ((target.kind === 'funding' || target.kind === 'entry') && target.collection !== undefined) {
        return { id: target.id, collection: target.collection, subtask };
    }
    return null;
}

/** An ISO date a snooze button pushes an item out to. */
function snoozeDate(now: number, days: number): string {
    return new Date(now + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** The three snooze buttons, the same on every line that can be snoozed. */
function snoozeActions(): TickerAction[] {
    return [
        {
            id: 'snooze:7',
            label: t('project.action.snooze_1w'),
            title: t('project.action.snooze_tip', t('project.action.snooze_1w'))
        },
        {
            id: 'snooze:30',
            label: t('project.action.snooze_1mo'),
            title: t('project.action.snooze_tip', t('project.action.snooze_1mo'))
        },
        {
            id: 'snooze:hide',
            label: t('project.action.snooze_hide'),
            title: t('project.action.snooze_tip', t('project.action.snooze_hide'))
        }
    ];
}

function unsnooze(): TickerAction {
    return {
        id: 'unsnooze',
        label: t('project.action.unsnooze'),
        title: t('project.action.unsnooze')
    };
}

/**
 * The buttons one line carries, from its target alone. A subtask is ticked, snoozed and deleted; a
 * project, an entry or a scheme is snoozed; an entry also gets the lifecycle statuses of its own
 * collection, minus the one it is in, and a task entry Remove after its other buttons; a
 * follow-up's Done marks its note done and its Remove takes the note out. A lead opens the Leads
 * view but carries no write, and neither does a conference call, which opens its venue's page,
 * since the venue registry's schema has no status field to write.
 */
export function actionsFor(line: TickerItem): TickerAction[] | undefined {
    const target = line.target;
    if (target === undefined) return undefined;
    const remove = {
        id: 'del',
        label: t('project.action.del'),
        title: t('project.action.delete_subtask')
    };
    if (target.subtask !== undefined) {
        if (line.snoozed) return [unsnooze(), remove];
        const done = {
            id: 'done',
            label: t('project.action.done'),
            title: t('project.action.mark_done')
        };
        return [done, ...agentActions(line), ...snoozeActions(), remove];
    }
    if (line.snoozed) return [unsnooze()];
    if (target.kind === 'followup') {
        return [
            {
                id: 'done',
                label: t('project.action.done'),
                title: t('project.action.followup_done_tip')
            },
            {
                id: REMOVE,
                label: t('focus.tasks.remove'),
                title: t('focus.tasks.remove_followup_tip')
            }
        ];
    }
    if (target.kind === 'lead' || target.kind === 'venue') return undefined;
    const statuses: TickerAction[] = [];
    for (const status of target.statuses ?? []) {
        if (status.toLowerCase() === (line.status ?? '').toLowerCase()) continue;
        statuses.push({
            id: `${STATUS}${status}`,
            label: status,
            title: t('project.action.set_status', status)
        });
    }
    const removal: TickerAction[] = isTaskEntry(target)
        ? [{ id: REMOVE, label: t('focus.tasks.remove'), title: t('focus.tasks.remove_task_tip') }]
        : [];
    return [...statuses, ...agentActions(line), ...snoozeActions(), ...removal];
}

/** The `agent` button, on a line that is a task. */
function agentActions(line: TickerItem): TickerAction[] {
    return taskRef(line) === null ? [] : [agentAction()];
}

/** Whether a line names something the board can open, which decides if its name is a button. */
function opens(line: TickerItem): boolean {
    return line.id !== undefined || line.entry !== undefined || line.target?.kind === 'lead';
}

/** How far off a line's own date is, and nothing for a line that carries none. */
export function dateTail(line: TickerItem): string {
    if (line.days === null) return '';
    return line.days < 0
        ? t('focus.command.days_ago', -line.days)
        : t('focus.command.in_days', line.days);
}

/** The stable part of a row id for a line whose buttons write a target. */
function targetId(target: TickerTarget): string {
    return [target.kind, target.collection ?? '', target.id, target.subtask ?? target.note ?? '']
        .map((part) => encodeURIComponent(part))
        .join(':');
}

/**
 * A fresh index and the builder that fills it. A row whose buttons write a target is named by that
 * target, so removing an earlier row cannot transfer a tap-open state to the line that follows it.
 * A targetless row has no hidden button and keeps the ordinal that only its immediate render uses.
 * The prefix keeps the two partials of one board from naming a row the same. `blocked` names, per
 * line, the words that disable its buttons, as `fileBlock` answers them.
 */
export function rowMaker(prefix: string, blocked: (line: TickerItem) => string = () => ''): Rows {
    const index: RowIndex = {};
    const keeps: Record<string, string | undefined> = {};
    let at = 0;
    return {
        index,
        kept: (row) => keeps[row.id],
        row(line: TickerItem, tail: string): TickerRow {
            const actions = lockedActions(actionsFor(line), blocked(line));
            // An ordinal would let a line that moves up inherit the id of a row a tap just removed.
            const identity = line.target === undefined ? String(at++) : targetId(line.target);
            const id = `${prefix}${identity}`;
            index[id] = line;
            keeps[id] = keptAction(actions);
            const name = line.venue === undefined ? line.label : `${line.label} ${line.venue}`;
            return {
                id,
                glyph: line.glyph,
                label: name,
                ...(line.names === undefined ? {} : { detail: line.names }),
                tail,
                tone: daysTone(line.days),
                ...(line.root === undefined ? {} : { mark: line.root }),
                actions,
                plain: !opens(line)
            };
        }
    };
}

/** A view to open and the state it is opened with: the page of one entry. */
export type EntryPage = { view: string; state: Record<string, string> };

/** The collections of every hub under one key, which an entry's page is resolved among. */
type CollectionsOf = ClientState['selectors']['collectionsOfKey'];

/** What the page of an entry a line names is read from: the collections, the venue registry. */
export type PageLookup = {
    collections: CollectionsOf;
    /** The key the hub `hub` gives the venues registry, the empty text when it names none. */
    venuesKey: (hub: string) => string;
    venues: Record<Id, Venue>;
};

/** The lookup of a client: its collections by key, its venue registry and its venues. */
export function pageLookup(client: Pick<ClientState, 'selectors' | 'entities'>): PageLookup {
    return {
        collections: client.selectors.collectionsOfKey,
        venuesKey: (hub) => client.selectors.registryKey('venues', hub),
        venues: client.entities.portfolio()?.entities.venues ?? {}
    };
}

/**
 * The page of the entry `id` of the collection of the key `key` in the hub `root`, as a card's
 * title opens it (views/boards/collection/Collection.svelte `openPage`): the person page for an
 * entry of the `people` registry, the entry page otherwise, named by the entry's title or by its
 * id when it has none. Null when that hub holds no collection of the key or the collection no such
 * entry, the entry being found by its key in its hub.
 */
export function entryPage(
    key: string,
    root: string,
    id: string,
    collections: CollectionsOf
): EntryPage | null {
    const home = collections(key).find((one) => rootOf(one) === root);
    const wanted = bareId({ id, root });
    const entry = home?.entries.find((one) => bareId(one) === wanted);
    if (home === undefined || entry === undefined) return null;
    return pageView(key, entry.id, entry.title === '' ? entry.id : entry.title, home.registry);
}

/**
 * The page of the venue of the registry id `id`: its entry of the venues registry of its own hub,
 * named by the venue's name. Null when no venue has the id or its hub names no venues registry.
 */
export function venuePage(id: string, lookup: PageLookup): EntryPage | null {
    const venue = Object.hasOwn(lookup.venues, id) ? lookup.venues[id] : undefined;
    if (venue === undefined) return null;
    const key = lookup.venuesKey(rootOf(venue));
    return key === '' ? null : pageView(key, venue.id, venue.name === '' ? venue.id : venue.name);
}

/**
 * The page of the collection entry a line names, and null for a line that names none: a line of a
 * project (`id`), a lead, or a target with no collection. A funding scheme's line, an entry's line
 * and the follow-up and subtask lines of either name their record by its id and the key of its
 * collection in the line's hub; a conference call names its venue.
 */
function linePage(line: TickerItem, lookup: PageLookup): EntryPage | null {
    const target = line.target;
    if (line.id !== undefined || target === undefined) return null;
    if (target.kind === 'venue') return venuePage(target.id, lookup);
    if (target.kind === 'lead' || target.collection === undefined) return null;
    return entryPage(target.collection, line.root ?? '', target.id, lookup.collections);
}

/**
 * A ticker line opens what it names: a project's tab; the page of the collection entry it names,
 * as a card's title opens it (`linePage`: a funding scheme's, a dated entry's, the record of a
 * follow-up or a subtask, a conference call's venue); and, for a line whose entry's page cannot be
 * resolved, the view of its collection.
 */
export function openLine(
    client: Pick<ClientState, 'layout' | 'selectors' | 'entities'>,
    line: TickerItem,
    onproject: (id: string) => void
): void {
    if (line.id !== undefined) {
        onproject(line.id);
        return;
    }
    const page = linePage(line, pageLookup(client));
    if (page !== null) client.layout.openView(page.view, page.state);
    else if (line.entry !== undefined) client.layout.openView(line.entry);
}

/** What one snooze button writes: an ISO date a week or a month out, or the hidden flag. */
function snoozeValue(action: string, now: number): string {
    if (action === 'snooze:7') return snoozeDate(now, 7);
    if (action === 'snooze:30') return snoozeDate(now, 30);
    return 'true';
}

/** The fields one button sets on the project, entry or scheme its line names. */
function fieldsFor(action: string, now: number): Record<string, unknown> {
    if (action === 'unsnooze') return { snooze: '' };
    if (action.startsWith(STATUS)) return { status: action.slice(STATUS.length) };
    return { snooze: snoozeValue(action, now) };
}

/** One button, written through the write path and nothing else. */
async function write(
    writes: WritesStore,
    target: TickerTarget,
    action: string,
    now: number
): Promise<WriteAnswer | null> {
    if (target.subtask !== undefined) {
        const collection = collectionOf(target);
        const host = collection === undefined ? { id: target.id } : { id: target.id, collection };
        if (action === 'done') return writes.writeSubtask(host, target.subtask, 'done');
        if (action === 'del') return writes.writeSubtask(host, target.subtask, 'delete');
        if (action === 'unsnooze') return writes.writeSubtask(host, target.subtask, 'snooze', '');
        return writes.writeSubtask(host, target.subtask, 'snooze', snoozeValue(action, now));
    }
    if (target.kind === 'followup') {
        if (target.note === undefined || (action !== 'done' && action !== REMOVE)) return null;
        const collection = target.collection;
        const host = collection === undefined ? { id: target.id } : { id: target.id, collection };
        return writes.writeFollowup(host, target.note, action === 'done' ? 'done' : 'delete');
    }
    // A task entry's Remove asks its question first (`removeAsked`); a press of it writes nothing.
    if (action === REMOVE) return null;
    const fields = fieldsFor(action, now);
    if (target.kind === 'manifest') return writes.writeManifest(target.id, fields);
    if ((target.kind === 'funding' || target.kind === 'entry') && target.collection !== undefined) {
        return writes.writeEntry(target.collection, target.id, fields);
    }
    return null;
}

/**
 * Press one button on one line, and the sentence the board says about it. The `agent` button
 * writes nothing: it opens the composer on the task through the terminals store and answers the
 * sentence of a refusal, or nothing. A write refused whole answers ok with nothing changed and the
 * refusals filled, which is reported as not saved rather than as saved over an untouched file. A
 * line with no target says nothing at all.
 */
export async function act(
    client: { writes: WritesStore; terminals: Pick<TerminalsStore, 'composeAt'> },
    line: TickerItem | undefined,
    action: string,
    now: number
): Promise<string | null> {
    const target = line?.target;
    if (line === undefined || target === undefined) return null;
    if (action === AGENT) {
        const task = taskRef(line);
        const refused = task === null ? '' : await client.terminals.composeAt({ task });
        return refused === '' ? null : refused;
    }
    const answer = await write(client.writes, target, action, now);
    if (answer === null) return null;
    const refused = answer.refused.map((one) => one.reason).join(', ');
    if (!answer.ok) return t('editor.failed', answer.error ?? '');
    if (answer.changed.length === 0 && refused !== '') return t('editor.failed', refused);
    return t('editor.saved', answer.changed.join(', '));
}
