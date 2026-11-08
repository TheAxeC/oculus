// Layer 2, client state tests. The lines the update tray's Schedules section draws first
// (state/system/machine/schedules/schedule.svelte.ts `unread`, drawn by
// shell/rail/ScheduleList.svelte): while the `schedule` payload carries tmux's words as `waiting`,
// a line says that no schedule runs because tmux lists no terminal, with those words; with none,
// no such line is drawn. The rows (`rows`) leave out an entry a delete took from the server's
// answer until a read of the file that no longer holds it arrives, and no longer: an entry saved
// again under its name by another hand after that read is shown, and a delete answered after that
// read holds nothing.
//
// It does not cover the line's place in the tray, which the look does.

import { describe, expect, it } from 'vitest';
import { createEntities } from '../../../src/lib/state/client/entities.svelte.ts';
import { createSchedule } from '../../../src/lib/state/system/machine/schedules/schedule.svelte.ts';
import type { EntitiesStore, WritesStore } from '../../../src/lib/state/shared/stores/shapes.ts';
import type { SchedulePayload } from '../../../src/lib/data/model/index.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import { TEXT } from '../../server/text.ts';

setCatalog(TEXT);

const TOO_LONG = 'error connecting to /a/long/tmux/folder/default (File name too long)';

/** The tray's first lines over a payload with no schedule and the given `waiting`. */
function linesOver(waiting: string | null): string[] {
    const payload: SchedulePayload = {
        schedules: [],
        commands: [],
        folders: [],
        tasks: null,
        primary: null,
        unread: [],
        waiting
    };
    const entities = {
        schedule: () => payload,
        afterReceive: () => undefined
    } as unknown as EntitiesStore;
    return createSchedule(entities, {
        terminalById: () => null,
        writes: {} as WritesStore
    }).unread();
}

describe('the Schedules section of the tray', () => {
    it("says that no schedule runs while tmux lists no terminal, with tmux's words", () => {
        const lines = linesOver(TOO_LONG);
        expect(lines).toHaveLength(1);
        expect(lines[0]).toContain('tmux lists no terminal');
        expect(lines[0]).toContain(TOO_LONG);
    });

    it('says nothing of the terminals while the list reads', () => {
        expect(linesOver(null)).toEqual([]);
    });
});

/** A read of the schedules file holding entries of the names given, in that order. */
function readOf(names: string[]): SchedulePayload {
    return {
        schedules: names.map((name, at) => ({
            at,
            name,
            entry: null,
            problem: null,
            unchosen: [],
            next: null,
            runs: []
        })),
        commands: [],
        folders: [],
        tasks: null,
        primary: null,
        unread: [],
        waiting: null
    };
}

describe('a schedule a delete took', () => {
    /**
     * A step: the delete of the entry `one` at position 0 sent, the server's success answering
     * it, a read of the schedules file arriving with the names given, or the rows read.
     */
    type Step = 'delete' | 'answer' | 'read' | string[];
    /** The steps, and the names of the rows at each read. */
    type Row = { name: string; steps: Step[]; read: string[][] };

    const ROWS: Row[] = [
        {
            name: 'it is left out from the answer, through a read that still holds it, until a read without it',
            steps: ['delete', 'answer', 'read', ['one', 'two'], 'read', ['two'], 'read'],
            read: [['two'], ['two'], ['two']]
        },
        {
            name: 'saved again by another hand after the read without it, it shows with no read between',
            steps: ['delete', 'answer', ['two'], ['one', 'two'], 'read'],
            read: [['one', 'two']]
        },
        {
            name: 'a delete answered after the read without it holds nothing',
            steps: ['delete', ['two'], 'answer', 'read', ['one', 'two'], 'read'],
            read: [['two'], ['one', 'two']]
        }
    ];

    it.each(ROWS)('$name', async ({ steps, read }) => {
        const entities = createEntities();
        let version = 1;
        const arrive = (names: string[]): void => {
            entities.receive({ channel: 'schedule', version, payload: readOf(names) });
            version += 1;
        };
        arrive(['one', 'two']);
        let answer = (): void => undefined;
        const posted = new Promise((resolve) => {
            answer = () => resolve({ ok: true, status: 200, body: {} });
        });
        const store = createSchedule(entities, {
            terminalById: () => null,
            writes: { postCommand: () => posted } as unknown as WritesStore
        });
        let deleting: Promise<unknown> = Promise.resolve();
        const seen: string[][] = [];
        for (const step of steps) {
            if (step === 'delete') deleting = store.remove({ at: 0, name: 'one' });
            else if (step === 'answer') {
                answer();
                await deleting;
            } else if (step === 'read') seen.push(store.rows().map((row) => row.name));
            else arrive(step);
        }
        expect(seen).toEqual(read);
    });
});
