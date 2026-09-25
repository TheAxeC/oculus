// What the boards' views read from state rather than work out inline: the tasks section's three
// groups, the awaiting strip's total and the portfolio's projects (state/boards/ticker.ts and
// state/boards/focus.ts), and a collection file's own order, its offered statuses and the live
// projects no funding entry covers (state/boards/collection.ts), each a plain function over a
// hand-built input.
//
// Also whether the command center has anything to draw (state/boards/ticker.ts's hasCommandRows).
//
// What this does NOT cover: the views that draw them, which tests/views/boards/focus.test.ts and
// tests/views/boards/collection/collection.test.ts mount.

import { describe, expect, it } from 'vitest';
import {
    hasCommandRows,
    hasTasks,
    taskGroups,
    type TickerItem
} from '../../../src/lib/state/boards/ticker.ts';
import { portfolioProjects, waitingTotal } from '../../../src/lib/state/boards/focus.ts';
import {
    fileOrder,
    offeredStatuses,
    unfundedBy,
    type StatusFacet
} from '../../../src/lib/state/boards/collection.ts';
import type { Entry, Project } from '../../../src/lib/data/model/index.ts';

describe('the tasks section, the awaiting strip and the portfolio projects', () => {
    const item = (kind: string, subtask?: string) =>
        ({
            kind,
            glyph: '',
            label: kind,
            days: null,
            ...(subtask === undefined ? {} : { target: { kind: 'manifest', id: 'p', subtask } })
        }) as unknown as TickerItem;

    // revert: src/lib/state/boards/ticker.ts:588 => if (false) groups.subtasks.push(line);
    it('groups a subtask by its own key, a follow-up by its kind, and the rest as tasks', () => {
        const groups = taskGroups([item('task'), item('followup'), item('task', 'k1')]);
        expect(groups.subtasks.map((one) => one.label)).toEqual(['task']);
        expect(groups.followups.map((one) => one.label)).toEqual(['followup']);
        expect(groups.tasks).toHaveLength(1);
        expect(hasTasks(groups)).toBe(true);
        expect(hasTasks(taskGroups([]))).toBe(false);
    });

    // revert: src/lib/state/boards/ticker.ts:615 => return rows > 0;
    it('says the command center has something to draw for any row, and for the projects behind', () => {
        const none = {
            overdue: [],
            categories: [],
            subtaskDated: [],
            followups: [],
            snoozed: [],
            attention: [],
            refresh: []
        };
        const behind = { behind: { count: 2 } } as unknown as Parameters<typeof hasCommandRows>[1];
        expect(hasCommandRows(none, null)).toBe(false);
        expect(hasCommandRows(none, { behind: null })).toBe(false);
        expect(hasCommandRows(none, behind)).toBe(true);
        expect(hasCommandRows({ ...none, refresh: ['r'] }, null)).toBe(true);
        expect(hasCommandRows({ ...none, overdue: ['o'] }, { behind: null })).toBe(true);
    });

    // revert: src/lib/state/boards/focus.ts:352 => 0 +
    it('counts what the awaiting strip waits on, blocked cards included', () => {
        const strip = {
            people: [{ label: 'a', count: 1 }],
            venues: [],
            blocked: 2,
            grants: ['g'],
            applications: [],
            hosts: ['h']
        } as unknown as Parameters<typeof waitingTotal>[0];
        expect(waitingTotal(strip)).toBe(5);
        expect(waitingTotal(null)).toBe(0);
    });

    // revert: src/lib/state/boards/focus.ts:343 => return [];
    it('lists the portfolio projects, and none before it arrives', () => {
        const snapshot = {
            entities: { projects: { a: { id: 'a' }, b: { id: 'b' } } }
        } as unknown as Parameters<typeof portfolioProjects>[0];
        expect(portfolioProjects(snapshot).map((one) => one.id)).toEqual(['a', 'b']);
        expect(portfolioProjects(null)).toEqual([]);
    });
});

describe("a collection file's order and the statuses it offers", () => {
    const entry = (id: string, fields: Record<string, unknown> = {}) =>
        ({ id, title: '', fields }) as unknown as Entry;

    // revert: src/lib/state/boards/collection.ts:419 => return entries.map((entry) => entry.id);
    it("names every entry by its identity field's value, in the file's order", () => {
        const schema = [{ field: 'key', type: 'text' }];
        const entries = [entry('b', { key: 'K2' }), entry('a', { key: 'K1' })];
        expect(fileOrder(entries, schema)).toEqual(['K2', 'K1']);
    });

    // revert: src/lib/state/boards/collection.ts:472 => return facets.map((facet) => facet.value);
    it('offers the statuses the entries use only to a file with no schema', () => {
        const facets: StatusFacet[] = [
            { value: 'draft', count: 2 },
            { value: 'done', count: 1 }
        ];
        expect(offeredStatuses(undefined, facets)).toEqual(['draft', 'done']);
        expect(offeredStatuses([], facets)).toEqual([]);
    });

    // revert: src/lib/state/boards/collection.ts:723 => []
    it('counts a live project no entry of the funding file covers', () => {
        const project = (id: string, fundingIds: string[]) =>
            ({ id, type: 'active', fundingIds }) as unknown as Project;
        const projects = [project('a', ['FAIR']), project('b', [])];
        const unfunded = unfundedBy(projects, [entry('FAIR')]);
        expect(unfunded.map((one) => one.id)).toEqual(['b']);
    });
});
