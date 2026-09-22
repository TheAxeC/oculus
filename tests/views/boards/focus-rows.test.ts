// Layer 3, view helper tests. The button a Focus ticker row keeps drawn while its other buttons
// wait for the pointer: a subtask's and a follow-up's done, a task entry's `done` status, and none
// on any other row (an event, an application, a project, a lead). The builder answers it by the
// row's own id, the id still finds its line, and a target keeps that id when earlier rows leave.
//
// What this does NOT cover: the buttons shown under the pointer or the keyboard, which need a page
// and are tests/browser/boards/cards.spec.ts.

import { describe, expect, it } from 'vitest';
import { keptAction, rowMaker } from '../../../src/lib/views/boards/focus/rows.ts';
import type { TickerItem } from '../../../src/lib/state/boards/ticker.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/words/text.ts';

const CONFIG = loadConfig(engineDir()).config;
setCatalog(textCatalog(CONFIG));

function line(over: Partial<TickerItem>): TickerItem {
    return { kind: 'paper', glyph: 'paper', label: 'Alpha', days: null, snoozed: false, ...over };
}

/** An entry line of a collection whose statuses are the given ones, in that order. */
function entry(status: string, statuses: string[]): TickerItem {
    return line({
        kind: 'task',
        entry: 'tasks',
        status,
        target: { kind: 'entry', id: 'One task', collection: 'tasks', statuses }
    });
}

describe('the button a row keeps drawn', () => {
    it("is a subtask's and a follow-up's done, and the builder answers it by the row", () => {
        const { index, row, kept } = rowMaker('t');
        const subtask = line({
            id: 'alpha',
            target: { kind: 'manifest', id: 'alpha', subtask: '0' }
        });
        const followup = line({ kind: 'followup', target: { kind: 'followup', id: 'alpha' } });
        const one = row(subtask, '');
        const two = row(followup, '');
        expect(kept(one)).toBe('done');
        expect(kept(two)).toBe('done');
        expect(one.id).not.toBe(two.id);
        expect(index[one.id]).toBe(subtask);
        expect(two.plain).toBe(true);
    });

    it('audits that a target row keeps its id when an earlier row leaves the list', () => {
        const first = line({ target: { kind: 'manifest', id: 'first' } });
        const second = line({ target: { kind: 'manifest', id: 'second' } });
        const before = rowMaker('r');
        const firstId = before.row(first, '').id;
        const secondId = before.row(second, '').id;
        const after = rowMaker('r');

        // revert: src/lib/views/boards/focus/rows.ts:162 => const identity = String(at++);
        // Number rows by their current place and the second line inherits the removed first line's
        // id instead of keeping its own.
        expect(after.row(second, '').id).toBe(secondId);
        expect(secondId).not.toBe(firstId);
    });

    // Revert: keep an entry's first status the palette marks terminal, as the kept button.
    it("is a task entry's done, and none on an event or an application whatever their statuses", () => {
        const { row, kept } = rowMaker('r');
        expect(kept(row(entry('todo', ['todo', 'doing', 'done', 'dropped']), ''))).toBe(
            'status:done'
        );
        expect(
            kept(row(entry('planned', ['planned', 'completed', 'cancelled']), ''))
        ).toBeUndefined();
        expect(
            kept(row(entry('active', ['not applied', 'active', 'rejected']), ''))
        ).toBeUndefined();
    });

    it('is none on a snoozed project, a project deadline, a lead or an entry with no closing status', () => {
        const { row, kept } = rowMaker('r');
        const deadline = line({ id: 'alpha', days: 3, target: { kind: 'manifest', id: 'alpha' } });
        const lead = line({ kind: 'position', target: { kind: 'lead', id: 'job' } });
        const open = entry('todo', ['todo', 'doing']);
        for (const one of [deadline, lead, open]) expect(kept(row(one, ''))).toBeUndefined();
        const asleep = line({
            id: 'alpha',
            snoozed: true,
            target: { kind: 'manifest', id: 'alpha' }
        });
        expect(kept(row(asleep, ''))).toBeUndefined();
    });

    it('answers from the actions alone', () => {
        expect(keptAction([{ id: 'status:done', label: 'done' }])).toBe('status:done');
        expect(keptAction([{ id: 'status:completed', label: 'completed' }])).toBeUndefined();
        expect(keptAction(undefined)).toBeUndefined();
    });
});
