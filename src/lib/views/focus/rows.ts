// Layer 3, view helper of views/Focus.svelte. One ticker line turned into one row: the words that
// date it, the buttons it carries, what opening it means, and what pressing a button writes.
//
// The command center and the tasks section draw the same rows over different lists, so the shape of
// a row lives here once rather than in each partial. It holds no markup and no list: a caller keeps
// its own numbered index of the lines it drew, because two lines of one group can name the same
// project and a button has to reach the one it sits on.

import type { TickerAction, TickerRow } from '$lib/ui/ticker-rows';
import { daysTone, type TickerItem, type TickerTarget } from '$lib/state/ticker';
import type { LayoutStore } from '$lib/state/layout.svelte';
import { t } from '$lib/state/text';
import type { WriteAnswer, WritesStore } from '$lib/state/writes.svelte';

/** The lines one partial drew, by the row id each was given. */
export type RowIndex = Record<string, TickerItem | undefined>;

/** A numbered index of the lines a partial draws, and the row builder that fills it. */
export type Rows = {
    index: RowIndex;
    row: (line: TickerItem, tail: string) => TickerRow;
};

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
 * collection, minus the one it is in; a follow-up is cleared. A lead opens the Leads view but
 * carries no write, and neither does a conference call, since the venue registry's schema has no
 * status field to write.
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
        return [done, ...snoozeActions(), remove];
    }
    if (line.snoozed) return [unsnooze()];
    if (target.kind === 'followup') {
        return [
            {
                id: 'done',
                label: t('project.action.done'),
                title: t('project.action.mark_done')
            }
        ];
    }
    if (target.kind === 'lead' || target.kind === 'venue') return undefined;
    const statuses: TickerAction[] = [];
    for (const status of target.statuses ?? []) {
        if (status.toLowerCase() === (line.status ?? '').toLowerCase()) continue;
        statuses.push({
            id: `status:${status}`,
            label: status,
            title: t('project.action.set_status', status)
        });
    }
    return [...statuses, ...snoozeActions()];
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

/**
 * A fresh index and the builder that fills it. The rows are numbered rather than named by what they
 * point at; the prefix keeps two partials of one board from numbering a row the same.
 */
export function rowMaker(prefix: string): Rows {
    const index: RowIndex = {};
    let at = 0;
    return {
        index,
        row(line: TickerItem, tail: string): TickerRow {
            const id = `${prefix}${at++}`;
            index[id] = line;
            const name = line.venue === undefined ? line.label : `${line.label} ${line.venue}`;
            return {
                id,
                glyph: line.glyph,
                label: name,
                tail,
                tone: daysTone(line.days),
                actions: actionsFor(line),
                plain: !opens(line)
            };
        }
    };
}

/** A ticker line opens what it names: a project's tab, or the collection file's own tab. */
export function openLine(
    layout: LayoutStore,
    line: TickerItem,
    onproject: (id: string) => void
): void {
    if (line.id !== undefined) onproject(line.id);
    else if (line.entry !== undefined) layout.openView(line.entry);
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
    if (action === 'done') return { followup: '' };
    if (action.startsWith('status:')) return { status: action.slice('status:'.length) };
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
        const host =
            target.collection === undefined
                ? { id: target.id }
                : { id: target.id, collection: target.collection };
        if (action === 'done') return writes.writeSubtask(host, target.subtask, 'done');
        if (action === 'del') return writes.writeSubtask(host, target.subtask, 'delete');
        if (action === 'unsnooze') return writes.writeSubtask(host, target.subtask, 'snooze', '');
        return writes.writeSubtask(host, target.subtask, 'snooze', snoozeValue(action, now));
    }
    const fields = fieldsFor(action, now);
    if (target.kind === 'manifest') return writes.writeManifest(target.id, fields);
    if (target.kind === 'followup') {
        if (target.collection === undefined) return writes.writeManifest(target.id, fields);
        return writes.writeEntry(target.collection, target.id, fields);
    }
    if (target.kind === 'funding') return writes.writeEntry('funding', target.id, fields);
    if (target.kind === 'entry' && target.collection !== undefined) {
        return writes.writeEntry(target.collection, target.id, fields);
    }
    return null;
}

/**
 * Press one button on one line, and the sentence the board says about it. A write refused whole
 * answers ok with nothing changed and the refusals filled, which is reported as not saved rather
 * than as saved over an untouched file. A line with no target says nothing at all.
 */
export async function act(
    writes: WritesStore,
    line: TickerItem | undefined,
    action: string,
    now: number
): Promise<string | null> {
    const target = line?.target;
    if (target === undefined) return null;
    const answer = await write(writes, target, action, now);
    if (answer === null) return null;
    const refused = answer.refused.map((one) => one.reason).join(', ');
    if (!answer.ok) return t('editor.failed', answer.error ?? '');
    if (answer.changed.length === 0 && refused !== '') return t('editor.failed', refused);
    return t('editor.saved', answer.changed.join(', '));
}
