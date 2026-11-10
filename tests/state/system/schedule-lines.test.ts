// Layer 2, client state tests. The lines the update tray's Schedules section draws first
// (state/system/machine/schedules/schedule.svelte.ts `unread`, drawn by
// shell/rail/ScheduleList.svelte): while the `schedule` payload carries tmux's words as `waiting`,
// a line says that no schedule runs because tmux lists no terminal, with those words; with none,
// no such line is drawn. The rows (`rows`) leave out an entry a delete took from the server's
// answer until the first read numbered at the read that answer named or later, or below what was
// seen at the answer: an entry saved again under its name by another hand after that read is shown,
// and a delete answered with that read already seen holds nothing. The update tasks the page
// offers (`offered`) leave out a row whose view the page does not hold, which `unviewed` gives as
// a finding naming the row's place and the view, and before the page has said which views it
// holds (`viewsAre`) nothing is offered and nothing is found.
//
// It does not cover the line's place in the tray, which the look does.

import { describe, expect, it } from 'vitest';
import { createEntities } from '../../../src/lib/state/client/entities.svelte.ts';
import { createSchedule } from '../../../src/lib/state/system/machine/schedules/schedule.svelte.ts';
import type { EntitiesStore, WritesStore } from '../../../src/lib/state/shared/stores/shapes.ts';
import type { HubTask, SchedulePayload } from '../../../src/lib/data/model/index.ts';
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
        waiting,
        read: 0
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

/** The read of the schedules file numbered `read`, holding entries of the names given, in order. */
function readOf(names: string[], read: number): SchedulePayload {
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
        waiting: null,
        read
    };
}

describe('a schedule a delete took', () => {
    const BOTH = ['one', 'two'];

    /**
     * A step: the delete of the entry `one` at position 0 sent, the server's success answering it
     * with the read given (undefined for an answer that names none), its refusal answering it, the
     * socket reconnecting, a read of the schedules file arriving with its number and the names
     * given, or the rows read.
     */
    type Step =
        | 'delete'
        | 'refused'
        | 'reconnect'
        | 'rows'
        | { answer: number | undefined }
        | { read: number; names: string[] };
    /** The steps, the file read as number 1 at the start, and the rows' names at each read. */
    type Row = { name: string; steps: Step[]; rows: string[][] };

    const ROWS: Row[] = [
        {
            name: 'it is left out from the answer, through a read below its number, until a read at it',
            steps: [
                'delete',
                { answer: 3 },
                'rows',
                { read: 2, names: BOTH },
                'rows',
                { read: 3, names: ['two'] },
                'rows'
            ],
            rows: [['two'], ['two'], ['two']]
        },
        {
            name: 'a read at its number whose rows are the same ends it',
            steps: ['delete', { answer: 2 }, { read: 2, names: BOTH }, 'rows'],
            rows: [BOTH]
        },
        {
            name: 'saved again by another hand after the read at its number, it shows with no read between',
            steps: [
                'delete',
                { answer: 2 },
                { read: 2, names: ['two'] },
                { read: 3, names: BOTH },
                'rows'
            ],
            rows: [BOTH]
        },
        {
            name: 'a delete answered with the read at its number already seen holds nothing',
            steps: [
                'delete',
                { read: 2, names: ['two'] },
                { answer: 2 },
                'rows',
                { read: 3, names: BOTH },
                'rows'
            ],
            rows: [['two'], BOTH]
        },
        {
            name: 'an answer that names no read holds nothing',
            steps: ['delete', { answer: undefined }, 'rows'],
            rows: [BOTH]
        },
        {
            name: 'a delete the server refused keeps its row and holds nothing',
            steps: ['delete', 'refused', 'rows'],
            rows: [BOTH]
        },
        {
            name: 'a read below what was seen at the answer, a restarted server, ends it',
            steps: [
                { read: 3, names: BOTH },
                'delete',
                { answer: 5 },
                'reconnect',
                { read: 1, names: BOTH },
                'rows'
            ],
            rows: [BOTH]
        },
        {
            name: 'a read between what was seen and its number holds it until its number',
            steps: [
                { read: 3, names: BOTH },
                'delete',
                { answer: 5 },
                'reconnect',
                { read: 4, names: BOTH },
                'rows',
                { read: 5, names: BOTH },
                'rows'
            ],
            rows: [['two'], BOTH]
        }
    ];

    /** A channel holding the file read as number 1, and how to hand it the next read. */
    function channelOf(): {
        entities: EntitiesStore;
        arrive: (names: string[], read: number) => void;
    } {
        const entities = createEntities();
        let version = 1;
        const arrive = (names: string[], read: number): void => {
            entities.receive({ channel: 'schedule', version, payload: readOf(names, read) });
            version += 1;
        };
        arrive(BOTH, 1);
        return { entities, arrive };
    }

    it.each(ROWS)('$name', async ({ steps, rows }) => {
        const { entities, arrive } = channelOf();
        let answer = (_posted: unknown): void => undefined;
        const posted = new Promise((resolve) => {
            answer = resolve;
        });
        const store = createSchedule(entities, {
            terminalById: () => null,
            writes: { postCommand: () => posted } as unknown as WritesStore
        });
        let deleting: Promise<unknown> = Promise.resolve();
        const seen: string[][] = [];
        for (const step of steps) {
            if (step === 'delete') deleting = store.remove({ at: 0, name: 'one' });
            else if (step === 'reconnect') entities.reconnected();
            else if (step === 'rows') seen.push(store.rows().map((row) => row.name));
            else if (step === 'refused') {
                answer({
                    ok: false,
                    status: 409,
                    body: { error: 'entry-changed', names: [] },
                    failed: ''
                });
                await deleting;
            } else if ('answer' in step) {
                const body = step.answer === undefined ? {} : { read: step.answer };
                answer({ ok: true, status: 200, body, failed: '' });
                await deleting;
            } else arrive(step.names, step.read);
        }
        expect(seen).toEqual(rows);
    });

    it('ends two removals each at its own read', async () => {
        const { entities, arrive } = channelOf();
        const answers = [2, 3].map((read) => ({
            ok: true,
            status: 200,
            body: { read },
            failed: ''
        }));
        const store = createSchedule(entities, {
            terminalById: () => null,
            writes: {
                postCommand: () => Promise.resolve(answers.shift())
            } as unknown as WritesStore
        });
        await store.remove({ at: 0, name: 'one' });
        await store.remove({ at: 1, name: 'two' });
        const seen = [store.rows().map((row) => row.name)];
        for (const read of [2, 3]) {
            arrive(BOTH, read);
            seen.push(store.rows().map((row) => row.name));
        }
        expect(seen).toEqual([[], ['one'], BOTH]);
    });
});

describe('the update tasks the page offers', () => {
    const FILE = '/h/.oculus/config.yml';
    const ROW: HubTask = {
        task: 'scout',
        hub: 'h',
        label: 'Scout',
        note: 'openings',
        view: 'leads',
        lastRun: null,
        file: FILE,
        at: 'update_tasks[0]'
    };

    /** The store over a payload offering the one row `row`, with the page's views said or not. */
    function storeOver(row: HubTask, views: readonly string[] | null) {
        const payload: SchedulePayload = { ...readOf([], 1), tasks: [row] };
        const entities = {
            schedule: () => payload,
            afterReceive: () => undefined
        } as unknown as EntitiesStore;
        const store = createSchedule(entities, {
            terminalById: () => null,
            writes: {} as WritesStore
        });
        if (views !== null) store.viewsAre((view) => views.includes(view));
        return { offered: store.offered().map((one) => one.task), unviewed: store.unviewed() };
    }

    it('offers a row whose view the page holds, with no finding (G13)', () => {
        expect(storeOver(ROW, ['leads', 'radar'])).toStrictEqual({
            offered: ['scout'],
            unviewed: []
        });
    });

    it('leaves out a row whose view the page does not hold, with a finding of its place and view (G13)', () => {
        const { offered, unviewed } = storeOver({ ...ROW, view: 'nowhere' }, ['leads']);
        expect(offered).toStrictEqual([]);
        expect(unviewed).toHaveLength(1);
        expect(unviewed[0]?.file).toBe(FILE);
        expect(unviewed[0]?.key).toBe('update_tasks[0].view');
        expect(unviewed[0]?.message).toContain('update_tasks[0].view');
        expect(unviewed[0]?.message).toContain('nowhere');
    });

    it('offers nothing and finds nothing before the page says which views it holds (G13)', () => {
        expect(storeOver(ROW, null)).toStrictEqual({ offered: [], unviewed: [] });
    });
});
