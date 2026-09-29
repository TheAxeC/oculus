// Layer 3, view test. The Terminal view's right-click menus, built by
// views/sessions/terminal/terminal-list.ts: the grid's, a list row's with Unsplit and Join
// Terminals, the route a paste from the menu takes, which holds a paste of several lines for the
// question a browser paste is asked, and Kill Terminal, which arms first as the row's Kill does.
//
// The words are a stand-in `t` that answers each key as `@key`.
//
// What this does NOT cover: the menus opened by a right-click or by Shift+F10, the clipboard read
// and written, and the terminal moved and split by a join, which need a DOM and are seen at the
// look.

import { describe, expect, it } from 'vitest';
import {
    emptyListMenu,
    gridMenu,
    joinedOf,
    pasteRoute,
    pressKill,
    profileOf,
    terminalRowMenu
} from '../../../src/lib/views/sessions/terminal/terminal-list.ts';
import { readTab } from '../../../src/lib/state/sessions/terminal/terminal-tabs.ts';

const words = (key: string, ...args: (string | number)[]): string =>
    args.length === 0 ? `@${key}` : `@${key}(${args.join(',')})`;

const A = 'aaaaaa-shell';
const B = 'bbbbbb-shell';
const C = 'cccccc-shell';

describe('the grid menu', () => {
    // Revert: drop Select All from gridMenu in terminal-list.ts.
    it('audits that offers Paste, Select All, Split and Kill with no selection', () => {
        expect(gridMenu(false, false, words).map((item) => item.label)).toEqual([
            '@sessions.menu_paste',
            '@sessions.menu_select_all',
            '@sessions.menu_split',
            '@sessions.menu_kill'
        ]);
    });

    // Revert: offer Copy in gridMenu whatever `selected` says.
    it('audits that offers Copy first with a selection', () => {
        expect(gridMenu(true, false, words).map((item) => item.label)).toEqual([
            '@sessions.menu_copy',
            '@sessions.menu_paste',
            '@sessions.menu_select_all',
            '@sessions.menu_split',
            '@sessions.menu_kill'
        ]);
    });
});

describe('Kill Terminal from a menu', () => {
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
            '@sessions.menu_split',
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
    const split = readTab({ id: 't', terminals: [A, B], shown: A, beside: B, composing: false });
    const alone = readTab({ id: 't', terminals: [A, B], shown: A, beside: null, composing: false });
    const others = [
        { terminal: 't2-id', title: 't2' },
        { terminal: 't3-id', title: 't3' }
    ];

    // Revert: make inShownSplit in terminal-list.ts return true.
    it('audits that offers Unsplit on the right half of the shown split and not on a row shown alone', () => {
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

    // Revert: drop the `!tab.composing` test from inShownSplit.
    it('audits that offers Unsplit on the left half too, and not on the left half beside the composer', () => {
        const left = terminalRowMenu(split, A, [], false, words).map((item) => item.label);
        expect(left).toContain('@sessions.menu_unsplit');
        const composing = readTab({
            id: 't',
            terminals: [A, B],
            shown: A,
            beside: B,
            composing: true
        });
        const hidden = terminalRowMenu(composing, B, [], false, words).map((item) => item.label);
        // The composer covers the right half, so that terminal is not drawn in the split at all.
        expect(hidden).not.toContain('@sessions.menu_unsplit');
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
        const items = emptyListMenu(words);
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
