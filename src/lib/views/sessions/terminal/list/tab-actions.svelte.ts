// Layer 3, view support. What the right-click menus of one Terminal tab do: the picks of the
// grid's, the list's and the bar's menus and the fields and the dialog they open, in one place
// since every menu acts on the tab's terminals the same way (`routePick` sends a pick to
// `handlers`). The tab holds one, and a refusal of any of them is said on its bar.

import { SvelteMap } from 'svelte/reactivity';
import {
    joined,
    readTab,
    showingOne,
    unsplit,
    type TerminalTabState
} from '$lib/state/sessions/terminal/terminal-tabs';
import { useState } from '$lib/state/client/use';
import type { PickHandlers } from '../terminal-list';

/** The tab the actions belong to, which the view holds. */
type ActionScope = {
    /** The tab's instance id. */
    instance: () => string;
    /** The tab's state in force. */
    tab: () => TerminalTabState;
    /** Replace the tab's state. */
    restate: (next: TerminalTabState) => void;
    /** The page or float holding the tab. */
    page: () => string;
    /** Kill Terminal: the tab's armed Kill. */
    kill: (which: string) => void;
};

/**
 * The tab's menu actions and what they leave open. Called while the view's component initialises,
 * since it reads the client's stores.
 */
export function tabActions(scope: ActionScope) {
    const {
        commands: { pressRerun, pressRestart },
        layout: { instanceLayoutState },
        terminals: {
            clearHistory,
            moveTerminal,
            renameTerminal,
            restyleTerminal,
            say,
            splitTerminal,
            terminalById
        }
    } = useState();

    /** The terminal whose title is being edited. */
    let renaming = $state('');
    /** The terminal whose icon is being chosen. */
    let iconFor = $state('');
    /** The Clear of each mounted grid, by terminal, for a row's menu. */
    const clears = new SvelteMap<string, () => Promise<string>>();

    /**
     * Split one of this tab's terminals: one of its kind starts in its folder and takes the place
     * right of it, which the list row's Split, both menus and the bar's Split do. A refusal is said
     * on the bar.
     */
    function splitOn(terminal: string): void {
        void splitTerminal(scope.instance(), terminal);
    }

    /**
     * Open the rename field on a terminal's row, or on the bar's title while no list is drawn. A
     * by-hand terminal is not renamed: its tmux session is the reader's.
     */
    function rename(which: string): void {
        if (terminalById(which)?.byHand === undefined) renaming = which;
    }

    /** Save the rename field: an empty value clears the title; a refusal is said on the bar. */
    async function saveName(which: string, value: string): Promise<void> {
        renaming = '';
        const answer = await renameTerminal(which, value);
        say(scope.instance(), answer.ok ? '' : answer.error);
    }

    /** Set or clear a terminal's icon or colour; a refusal is said on the bar. */
    async function restyle(which: string, style: { icon?: string; color?: string }): Promise<void> {
        const answer = await restyleTerminal(which, style);
        say(scope.instance(), answer.ok ? '' : answer.error);
    }

    /** A row's Clear: the mounted grid empties itself and the history; else only the history. */
    async function clearOf(which: string): Promise<void> {
        const failure = await (clears.get(which)?.() ??
            clearHistory(which).then((answer) => (answer.ok ? '' : answer.error)));
        if (failure !== '') say(scope.instance(), failure);
    }

    /** Join Terminals: a terminal another tab owns moves in after `terminal`, shown beside it. */
    function joinInto(terminal: string, moving: string): void {
        const owner = scope.instance();
        moveTerminal(moving, owner, scope.page(), scope.tab().terminals.indexOf(terminal) + 1);
        const moved = readTab(instanceLayoutState(owner));
        scope.restate(joined(showingOne(moved, terminal), moving));
    }

    /** What a pick of a terminal's menu does, on a list row and on the bar's name alike. */
    const handlers: PickHandlers = {
        split: splitOn,
        kill: scope.kill,
        unsplit: (which: string) => scope.restate(unsplit(scope.tab(), which)),
        rename,
        icon: (which: string) => (iconFor = which),
        clear: (which: string) => void clearOf(which),
        color: (which: string, color: string) => void restyle(which, { color }),
        join: joinInto,
        rerun: (which: string) => void pressRerun(which),
        restart: (which: string) => void pressRestart(which)
    };

    return {
        handlers,
        /** The terminal whose title is being edited, or empty. */
        get renaming() {
            return renaming;
        },
        /** The terminal whose icon is being chosen, or empty. */
        get iconFor() {
            return iconFor;
        },
        /** The rename field was saved. */
        renamed: (which: string, value: string): void => void saveName(which, value),
        /** The rename field was left unsaved. */
        cancelRename: (): void => {
            renaming = '';
        },
        /** The icon dialog picked `name`, which an empty name clears. */
        pickIcon: (name: string): void => {
            const which = iconFor;
            iconFor = '';
            void restyle(which, { icon: name });
        },
        /** The icon dialog closed with no pick. */
        closeIcon: (): void => {
            iconFor = '';
        },
        /** A grid hands over its Clear while it is mounted and takes it back when it goes. */
        control: (which: string, held: { clear: () => Promise<string> } | null): void => {
            if (held === null) clears.delete(which);
            else clears.set(which, held.clear);
        }
    };
}
