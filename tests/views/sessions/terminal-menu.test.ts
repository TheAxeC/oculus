// Layer 3, view test. The Terminal view's right-click menus, built by
// views/sessions/terminal/terminal-list.ts: the grid's, a list row's with Unsplit and Join
// Terminals, the same menu on the bar's name of a sole terminal, the one function that routes a
// pick of it for the list and the bar, the route a paste from the menu takes, which holds a paste
// of several lines for the question a browser paste is asked, and Kill Terminal, which arms first
// as the row's Kill does.
//
// The words are a stand-in `t` that answers each key as `@key`.
//
// What this does NOT cover: the menus opened by a right-click or by Shift+F10, the browser's own
// menu staying shut on the bar, the rename field opening, the clipboard read and written, and the
// terminal moved and split by a join, which need a DOM and are seen at the look.

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    BELL_MS,
    attachedOf,
    bellMark,
    MENU_RERUN,
    MENU_RESTART,
    emptyListMenu,
    gridMenu,
    joinedOf,
    kindsMenu,
    ownedElsewhere,
    pasteRoute,
    pressKill,
    profileOf,
    routePick,
    taskStateOf,
    terminalRowMenu,
    type PickHandlers
} from '../../../src/lib/views/sessions/terminal/terminal-list.ts';
import type { Terminal } from '../../../src/lib/data/model/index.ts';
import { readTab } from '../../../src/lib/state/sessions/terminal/terminal-tabs.ts';
import { COLOR_NAMES } from '../../../src/lib/state/sessions/terminal/terminal-marks.ts';

const words = (key: string, ...args: (string | number)[]): string =>
    args.length === 0 ? `@${key}` : `@${key}(${args.join(',')})`;

const A = 'aaaaaa-shell';
const B = 'bbbbbb-shell';
const C = 'cccccc-shell';

describe('the grid menu', () => {
    // Revert: drop Select All from gridMenu in terminal-list.ts.
    it('audits that offers Paste, Select All, Clear, Split, the style items and Kill with no selection', () => {
        expect(gridMenu(false, false, words).map((item) => item.label)).toEqual([
            '@sessions.menu_paste',
            '@sessions.menu_select_all',
            '@sessions.menu_clear',
            '@sessions.menu_split',
            '@sessions.menu_rename',
            '@sessions.menu_icon',
            '@sessions.menu_color',
            '@sessions.menu_kill'
        ]);
    });

    // Revert: offer Copy in gridMenu whatever `selected` says.
    it('audits that offers Copy and Copy as HTML first with a selection', () => {
        expect(gridMenu(true, false, words).map((item) => item.label)).toEqual([
            '@sessions.menu_copy',
            '@sessions.menu_copy_html',
            '@sessions.menu_paste',
            '@sessions.menu_select_all',
            '@sessions.menu_clear',
            '@sessions.menu_split',
            '@sessions.menu_rename',
            '@sessions.menu_icon',
            '@sessions.menu_color',
            '@sessions.menu_kill'
        ]);
    });
});

/** The calls a kill makes, in order, over fakes of the tab's arm and the store's stop. */
function killer(refusal = '') {
    const calls: string[] = [];
    let armed = '';
    const deps = {
        arm: (one: string) => {
            armed = one;
            calls.push(`arm:${one}`);
        },
        stop: (one: string) => {
            calls.push(`stop:${one}`);
            return Promise.resolve({ ok: refusal === '', error: refusal });
        },
        fail: (error: string) => {
            if (error !== '') calls.push(`fail:${error}`);
        }
    };
    return { calls, press: (one: string) => pressKill(armed, one, deps) };
}

describe('Kill Terminal from a menu', () => {
    // Revert: make pressKill call deps.stop on every press, the first included.
    it('audits that arms on the first pick and stops only on the second', async () => {
        const { calls, press } = killer();
        await press(A);
        expect(calls).toEqual([`arm:${A}`]);
        await press(A);
        expect(calls).toEqual([`arm:${A}`, 'arm:', `stop:${A}`]);
    });

    // Revert: make pressKill stop whenever anything is armed, whichever terminal it is.
    it('audits that a pick on another terminal moves the arm to it and stops nothing', async () => {
        const { calls, press } = killer();
        await press(A);
        await press(B);
        expect(calls).toEqual([`arm:${A}`, `arm:${B}`]);
    });

    // Revert: drop the deps.fail call after a refused stop in pressKill.
    it('audits that hands a refused stop to fail', async () => {
        const { calls, press } = killer('no such session');
        await press(A);
        await press(A);
        expect(calls).toEqual([`arm:${A}`, 'arm:', `stop:${A}`, 'fail:no such session']);
    });

    // Revert: label Kill Terminal as sessions.menu_kill whatever `armed` says in killItem.
    it('audits that words Kill Terminal as the armed control while the terminal is armed', () => {
        expect(gridMenu(false, true, words).map((item) => item.label)).toEqual([
            '@sessions.menu_paste',
            '@sessions.menu_select_all',
            '@sessions.menu_clear',
            '@sessions.menu_split',
            '@sessions.menu_rename',
            '@sessions.menu_icon',
            '@sessions.menu_color',
            '@sessions.terminal_kill_armed'
        ]);
        const row = terminalRowMenu(readTab({ id: 't', terminals: [C] }), C, [], true, words);
        expect(row.map((item) => item.label).slice(0, 2)).toEqual([
            '@sessions.menu_split',
            '@sessions.terminal_kill_armed'
        ]);
    });
});

describe('a paste from the menu', () => {
    // Revert: make pasteRoute return { send: text } for every text.
    it('audits that holds a paste of several lines for the question and sends one line as it is', () => {
        expect(pasteRoute('a\nb\n')).toEqual({ ask: 2 });
        expect(pasteRoute('a')).toEqual({ send: 'a' });
    });
});

describe('a list row menu', () => {
    const split = readTab({ id: 't', terminals: [A, B], shown: A, row: [A, B], composing: false });
    const alone = readTab({ id: 't', terminals: [A, B], shown: A, row: [A], composing: false });
    const others = [
        { terminal: 't2-id', title: 't2' },
        { terminal: 't3-id', title: 't3' }
    ];

    // Revert: make inShownRow in terminal-list.ts return true.
    it('audits that offers Unsplit on the right half of a row of two and not on a terminal shown alone', () => {
        const labels = terminalRowMenu(split, B, [], false, words).map((item) => item.label);
        expect(labels).toContain('@sessions.menu_unsplit');
        const lone = terminalRowMenu(alone, A, [], false, words).map((item) => item.label);
        // A row the tab shows alone is in no split, so there is nothing to undo.
        expect(lone).not.toContain('@sessions.menu_unsplit');
    });

    // Revert: label each join item by its terminal id instead of its title.
    it('audits that offers Join Terminals holding the terminals another tab owns, by name', () => {
        const items = terminalRowMenu(alone, A, others, false, words);
        const join = items.find((item) => item.label === '@sessions.menu_join');
        expect(join?.items?.map((item) => item.label)).toEqual(['t2', 't3']);
        const none = terminalRowMenu(alone, A, [], false, words).map((item) => item.label);
        // With no other tab owning a terminal there is nothing to move in, so no submenu is drawn.
        expect(none).not.toContain('@sessions.menu_join');
    });

    // Revert: drop the `tab.row.length > 1` test from inShownRow.
    it('audits that offers Unsplit on both halves of a row, and not on a row of one beside the composer', () => {
        const left = terminalRowMenu(split, A, [], false, words).map((item) => item.label);
        expect(left).toContain('@sessions.menu_unsplit');
        const composing = readTab({
            id: 't',
            terminals: [A, B],
            shown: A,
            row: [A],
            composing: true
        });
        const lone = terminalRowMenu(composing, A, [], false, words).map((item) => item.label);
        // The composer beside a row of one leaves nothing to take the terminal out of.
        expect(lone).not.toContain('@sessions.menu_unsplit');
    });

    // Revert: make joinedOf slice one character fewer off the id.
    it('audits that names each terminal to join by the id the pick hands back', () => {
        const join = terminalRowMenu(alone, A, others, false, words).find(
            (item) => item.label === '@sessions.menu_join'
        );
        expect(join?.items?.map((item) => joinedOf(item.id))).toEqual(['t2-id', 't3-id']);
        expect(joinedOf('split')).toBeNull();
    });

    // Revert: drop rowActions from terminalRowMenu.
    it('audits that offers Split and Kill on every row', () => {
        const labels = terminalRowMenu(
            readTab({ id: 't', terminals: [C] }),
            C,
            [],
            false,
            words
        ).map((item) => item.label);
        expect(labels.slice(0, 2)).toEqual(['@sessions.menu_split', '@sessions.menu_kill']);
    });
});

describe('the list empty area menu', () => {
    // Revert: list the profile items of emptyListMenu as Claude, Codex, Shell.
    it('audits that offers New Terminal and a profile submenu of the kinds the composer starts', () => {
        const items = emptyListMenu(words, []);
        expect(items.map((item) => item.label)).toEqual([
            '@sessions.menu_new',
            '@sessions.menu_new_profile'
        ]);
        const kinds = items[1].items ?? [];
        expect(kinds.map((item) => item.label)).toEqual([
            '@sessions.kind_shell',
            '@sessions.kind_claude',
            '@sessions.kind_codex'
        ]);
        expect(kinds.map((item) => profileOf(item.id))).toEqual(['shell', 'claude', 'codex']);
        expect(profileOf('new')).toBeNull();
    });
});

describe('Attach to Session', () => {
    const unowned = [
        { terminal: A, title: 'build' },
        { terminal: B, title: 'zsh' }
    ];
    const labelsOf = (items: { label: string }[]): string[] => items.map((item) => item.label);

    it('audits that the kinds dropdown and the list empty area menu each hold a submenu of the unowned terminals, in the order handed', () => {
        for (const items of [kindsMenu(words, unowned), emptyListMenu(words, unowned)]) {
            const attach = items.filter((item) => item.label === '@sessions.menu_attach');
            expect(attach).toHaveLength(1);
            expect(labelsOf(attach[0].items ?? [])).toEqual(['build', 'zsh']);
            expect((attach[0].items ?? []).map((item) => attachedOf(item.id))).toEqual([A, B]);
        }
    });

    it('audits that the item is drawn only while a terminal can be attached, and the menus are as before without it', () => {
        expect(labelsOf(kindsMenu(words, []))).toEqual([
            '@sessions.kind_shell',
            '@sessions.kind_claude',
            '@sessions.kind_codex',
            '@sessions.menu_with_prompt'
        ]);
        expect(labelsOf(emptyListMenu(words, []))).toEqual([
            '@sessions.menu_new',
            '@sessions.menu_new_profile'
        ]);
    });

    it('audits that the submenu sits after the kinds and the prompt in the dropdown, and after New Terminal in the empty area menu', () => {
        expect(labelsOf(kindsMenu(words, unowned)).slice(-2)).toEqual([
            '@sessions.menu_with_prompt',
            '@sessions.menu_attach'
        ]);
        expect(labelsOf(emptyListMenu(words, unowned))).toEqual([
            '@sessions.menu_new',
            '@sessions.menu_new_profile',
            '@sessions.menu_attach'
        ]);
    });

    it('audits that two terminals of one label are two entries with different pick ids', () => {
        const same = [
            { terminal: A, title: 'build' },
            { terminal: B, title: 'build' }
        ];
        const entries = emptyListMenu(words, same).find(
            (item) => item.label === '@sessions.menu_attach'
        )?.items;
        expect(labelsOf(entries ?? [])).toEqual(['build', 'build']);
        expect(new Set((entries ?? []).map((item) => item.id)).size).toBe(2);
    });

    it('audits that an Attach pick is not read as a Join or a Profile pick, and theirs are not read as an Attach pick', () => {
        const pick = emptyListMenu(words, unowned)
            .find((item) => item.label === '@sessions.menu_attach')
            ?.items?.at(0)?.id;
        expect(pick).toBeDefined();
        expect(joinedOf(pick ?? '')).toBeNull();
        expect(profileOf(pick ?? '')).toBeNull();
        const join = terminalRowMenu(
            readTab({ id: 't', terminals: [A], shown: A }),
            A,
            [{ terminal: C, title: 'other' }],
            false,
            words
        ).find((item) => item.label === '@sessions.menu_join')?.items?.[0].id;
        expect(attachedOf(join ?? '')).toBeNull();
        const profile = emptyListMenu(words, []).find(
            (item) => item.label === '@sessions.menu_new_profile'
        )?.items?.[0].id;
        expect(attachedOf(profile ?? '')).toBeNull();
    });

    it('audits that the list item, an empty pick and another item name no terminal', () => {
        const list = emptyListMenu(words, unowned).find(
            (item) => item.label === '@sessions.menu_attach'
        )?.id;
        expect(attachedOf(list ?? '')).toBeNull();
        expect(attachedOf('attach:')).toBeNull();
        expect(attachedOf('new')).toBeNull();
        expect(attachedOf('')).toBeNull();
    });
});

describe("the bar's menu of a sole terminal", () => {
    const sole = readTab({ id: 't', terminals: [A], shown: A, row: [A], composing: false });
    const others = [{ terminal: 't2-id', title: 't2' }];
    const labelsOf = (items: { label: string }[]): string[] => items.map((item) => item.label);

    it('audits that the bar menu offers the items of a list row, with Join Terminals while another tab owns a terminal, and no Unsplit', () => {
        expect(labelsOf(terminalRowMenu(sole, A, others, false, words))).toEqual([
            '@sessions.menu_split',
            '@sessions.menu_kill',
            '@sessions.menu_rename',
            '@sessions.menu_icon',
            '@sessions.menu_color',
            '@sessions.menu_clear',
            '@sessions.menu_join'
        ]);
        expect(labelsOf(terminalRowMenu(sole, A, [], false, words))).toEqual([
            '@sessions.menu_split',
            '@sessions.menu_kill',
            '@sessions.menu_rename',
            '@sessions.menu_icon',
            '@sessions.menu_color',
            '@sessions.menu_clear'
        ]);
    });
});

describe('the menus of a task terminal', () => {
    const sole = readTab({ id: 't', terminals: [A], shown: A, row: [A], composing: false });
    const labelsOf = (items: ReturnType<typeof gridMenu>): string[] =>
        items.map((item) => item.label);

    it('audits that the task state is null for a shell, running with no exit and ended with one', () => {
        expect(taskStateOf(null)).toBeNull();
        expect(taskStateOf({ task: false, exit: null })).toBeNull();
        expect(taskStateOf({ task: false, exit: 0 })).toBeNull();
        expect(taskStateOf({ task: true, exit: null })).toBe('running');
        expect(taskStateOf({ task: true, exit: 0 })).toBe('ended');
        expect(taskStateOf({ task: true, exit: 2 })).toBe('ended');
    });

    it('audits that a running task offers Restart and an ended one Rerun then Restart in the grid menu', () => {
        const base = labelsOf(gridMenu(false, false, words));
        expect(labelsOf(gridMenu(false, false, words, null))).toEqual(base);
        expect(labelsOf(gridMenu(false, false, words, 'running'))).toEqual([
            ...base.slice(0, 3),
            '@commands.restart',
            ...base.slice(3)
        ]);
        expect(labelsOf(gridMenu(false, false, words, 'ended'))).toEqual([
            ...base.slice(0, 3),
            '@commands.rerun',
            '@commands.restart',
            ...base.slice(3)
        ]);
    });

    it('audits that a running task offers Restart and an ended one Rerun then Restart in the row menu', () => {
        const base = labelsOf(terminalRowMenu(sole, A, [], false, words));
        expect(labelsOf(terminalRowMenu(sole, A, [], false, words, null))).toEqual(base);
        expect(labelsOf(terminalRowMenu(sole, A, [], false, words, 'running'))).toEqual([
            '@commands.restart',
            ...base
        ]);
        expect(labelsOf(terminalRowMenu(sole, A, [], false, words, 'ended'))).toEqual([
            '@commands.rerun',
            '@commands.restart',
            ...base
        ]);
    });

    it('audits that the Rerun and Restart picks reach their own handler with the terminal', () => {
        const calls: string[] = [];
        const given: PickHandlers = {
            split: () => undefined,
            kill: () => undefined,
            unsplit: () => undefined,
            rename: () => undefined,
            icon: () => undefined,
            clear: () => undefined,
            color: () => undefined,
            join: () => undefined,
            rerun: (one) => calls.push(`rerun:${one}`),
            restart: (one) => calls.push(`restart:${one}`)
        };
        routePick(MENU_RERUN, B, given);
        routePick(MENU_RESTART, C, given);
        expect(calls).toEqual([`rerun:${B}`, `restart:${C}`]);
    });
});

describe('the pick routing a row and the bar share', () => {
    /** Every handler a pick can reach, each recording its call. */
    function handlers(): { calls: string[]; handlers: PickHandlers } {
        const calls: string[] = [];
        const record =
            (name: string) =>
            (...args: string[]): void => {
                calls.push(`${name}:${args.join(',')}`);
            };
        return {
            calls,
            handlers: {
                split: record('split'),
                kill: record('kill'),
                unsplit: record('unsplit'),
                rename: record('rename'),
                icon: record('icon'),
                clear: record('clear'),
                color: record('color'),
                join: record('join'),
                rerun: record('rerun'),
                restart: record('restart')
            }
        };
    }

    const split = readTab({ id: 't', terminals: [A, B], shown: A, row: [A, B], composing: false });
    const others = [{ terminal: 't2-id', title: 't2' }];

    /** The pick of every item a row's menu offers, the colours and joins inside their lists. */
    function picks(items: ReturnType<typeof terminalRowMenu>): string[] {
        return items.flatMap((item) => (item.items === undefined ? [item.id] : picks(item.items)));
    }

    it('audits that each pick of the row menu goes to its own handler with the terminal it was opened on', () => {
        const { calls, handlers: given } = handlers();
        for (const pick of picks(terminalRowMenu(split, B, others, false, words))) {
            routePick(pick, B, given);
        }
        expect(calls).toEqual([
            `split:${B}`,
            `kill:${B}`,
            `rename:${B}`,
            `icon:${B}`,
            ...['', ...COLOR_NAMES].map((name) => `color:${B},${name}`),
            `clear:${B}`,
            `unsplit:${B}`,
            `join:${B},t2-id`
        ]);
    });

    it('audits that a Rename picked on the bar opens the rename field of the shown terminal', () => {
        const { calls, handlers: given } = handlers();
        const sole = readTab({ id: 't', terminals: [A], shown: A, row: [A], composing: false });
        const rename = terminalRowMenu(sole, A, [], false, words).find(
            (item) => item.label === '@sessions.menu_rename'
        );
        routePick(rename?.id ?? '', A, given);
        expect(calls).toEqual([`rename:${A}`]);
    });

    it('audits that Kill arms on the first pick from the bar and kills on the second', async () => {
        const { calls: stops, press } = killer();
        const { handlers: given } = handlers();
        const kill = terminalRowMenu(
            readTab({ id: 't', terminals: [A], shown: A, row: [A], composing: false }),
            A,
            [],
            false,
            words
        ).find((item) => item.label === '@sessions.menu_kill');
        const pending: Promise<void>[] = [];
        const bar: PickHandlers = { ...given, kill: (one) => void pending.push(press(one)) };
        routePick(kill?.id ?? '', A, bar);
        await Promise.all(pending);
        expect(stops).toEqual([`arm:${A}`]);
        routePick(kill?.id ?? '', A, bar);
        await Promise.all(pending);
        expect(stops).toEqual([`arm:${A}`, 'arm:', `stop:${A}`]);
    });

    it('audits that the Join pick is handed the terminal the bar shows and the one to move', () => {
        const { calls, handlers: given } = handlers();
        const join = terminalRowMenu(
            readTab({ id: 't', terminals: [A], shown: A, row: [A], composing: false }),
            A,
            others,
            false,
            words
        ).find((item) => item.label === '@sessions.menu_join');
        routePick(join?.items?.[0].id ?? '', A, given);
        expect(calls).toEqual([`join:${A},t2-id`]);
    });

    it('audits that an id no item carries, and the headings of the colour and join lists, do nothing', () => {
        const { calls, handlers: given } = handlers();
        for (const pick of ['', 'nothing', 'join', 'join:', 'color', 'color:purple']) {
            routePick(pick, A, given);
        }
        expect(calls).toEqual([]);
    });
});

describe('the terminals Join Terminals offers', () => {
    const named = (id: string, foreign = false) =>
        ({ id, name: `name of ${id}`, foreign }) as unknown as Terminal;
    const known: Record<string, Terminal> = {
        [A]: named(A),
        [B]: named(B),
        [C]: named(C, true)
    };
    const byId = (id: string): Terminal | null => known[id] ?? null;

    it('audits that it lists the terminals of the other Terminal tabs by name, without a foreign one', () => {
        const tabs = [
            { id: 'self', view: 'terminal', state: { terminals: [A] } },
            { id: 'other', view: 'terminal', state: { terminals: [B, C, 'gone'] } },
            { id: 'files', view: 'files', state: { terminals: [A] } }
        ];
        expect(ownedElsewhere(tabs, 'self', byId)).toEqual([
            { terminal: B, title: `name of ${B}` }
        ]);
        expect(ownedElsewhere(tabs, 'other', byId)).toEqual([
            { terminal: A, title: `name of ${A}` }
        ]);
        expect(ownedElsewhere([], 'self', byId)).toEqual([]);
    });
});

describe("a terminal's bell mark", () => {
    afterEach(() => vi.useRealTimers());

    it('audits that it marks the terminal for BELL_MS, replaces an earlier ring, and stops with the tab', () => {
        vi.useFakeTimers();
        const marks: (string | null)[] = [];
        const bell = bellMark((one) => marks.push(one));
        bell.ring(A);
        vi.advanceTimersByTime(BELL_MS - 1);
        expect(marks).toEqual([A]);
        bell.ring(B);
        vi.advanceTimersByTime(BELL_MS - 1);
        expect(marks).toEqual([A, B]);
        vi.advanceTimersByTime(1);
        expect(marks).toEqual([A, B, null]);
        bell.ring(A);
        bell.stop();
        vi.advanceTimersByTime(BELL_MS * 2);
        expect(marks).toEqual([A, B, null, A]);
    });
});
