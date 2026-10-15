// Layer 2, client state, pure. The navigation history Back and Forward walk, as VS Code's Go Back
// and Go Forward walk theirs (`EditorNavigationStack` of VS Code's
// src/vs/workbench/services/history/browser/historyService.ts): a list of steps and the step the
// reader is at. A step is a tab made active, across pages, panes and floats, and in a source tab a
// line: a jump to a place (Go to Definition, a search result, a problem opened) is a step of its
// own, and a caret move is one only when it moves more than `CARET_LINES` lines from the step's
// line; a smaller move carries the step's line along.
//
// A new step after a walk back drops the steps ahead of it, and the list keeps the last
// `HISTORY_MAX`. Each step keeps its tab as a reopen would bring it back (`ClosedTab`), so a walk
// to a tab that was closed since opens it again.

import type { ClosedTab } from '../layout/tabs/closed.ts';

/** How many steps the history keeps, VS Code's number. */
const HISTORY_MAX = 50;

/** How far a caret moves, in lines, before the move is a step of its own, VS Code's number. */
const CARET_LINES = 10;

/**
 * One step: the tab, its line in a source tab (null for a tab with no caret, or one that has not
 * said where its caret is yet), and the tab as a reopen would bring it back.
 */
export type Step = { tab: string; line: number | null; kept: ClosedTab | null };

/** The steps, oldest first, and the index of the one the reader is at; -1 when there is none. */
export type History = { steps: Step[]; at: number };

export const EMPTY_HISTORY: History = { steps: [], at: -1 };

/** The step the reader is at, or null in an empty history. */
function current(history: History): Step | null {
    return history.steps.at(history.at) ?? null;
}

/**
 * The history with a step put after the one the reader is at, the steps ahead of it dropped and
 * the oldest past `HISTORY_MAX` let go. A step of the tab and line the reader is at is no new
 * step: it replaces that one, which keeps the tab's newest form.
 */
export function visited(history: History, step: Step): History {
    const here = current(history);
    if (here !== null && here.tab === step.tab && here.line === step.line) {
        return replaced(history, step);
    }
    const steps = [...history.steps.slice(0, history.at + 1), step].slice(-HISTORY_MAX);
    return { steps, at: steps.length - 1 };
}

/** The history with the step the reader is at replaced. */
function replaced(history: History, step: Step): History {
    const steps = history.steps.map((one, index) => (index === history.at ? step : one));
    return { steps, at: history.at };
}

/**
 * The history after the caret of the tab the reader is at moved to `line`: a step of its own when
 * it moved more than `CARET_LINES` lines from the step's line, and the step's line carried along
 * otherwise. A step whose line is not known yet takes the line. A caret of another tab changes
 * nothing.
 */
export function caretMoved(history: History, tab: string, line: number): History {
    const here = current(history);
    if (here?.tab !== tab || here.line === line) return history;
    if (here.line !== null && Math.abs(line - here.line) > CARET_LINES) {
        return visited(history, { ...here, line });
    }
    return replaced(history, { ...here, line });
}

/** Whether Back has a step to go to. */
export function canBack(history: History): boolean {
    return history.at > 0;
}

/** Whether Forward has a step to go to. */
export function canForward(history: History): boolean {
    return history.at >= 0 && history.at < history.steps.length - 1;
}

/** The history with the reader at the step `at`. */
export function movedTo(history: History, at: number): History {
    return at < 0 || at >= history.steps.length ? history : { steps: history.steps, at };
}

/** The history with every step of the tab `from` naming the tab `to`, which a reopen made. */
export function renamed(history: History, from: string, to: string): History {
    if (from === to) return history;
    const steps = history.steps.map((one) => (one.tab === from ? { ...one, tab: to } : one));
    return { steps, at: history.at };
}

/** The history with the steps of the tabs `kept` names given that newer form of their tab. */
export function refreshed(history: History, kept: (tab: string) => ClosedTab | null): History {
    const steps = history.steps.map((one) => {
        const now = kept(one.tab);
        return now === null ? one : { ...one, kept: now };
    });
    return { steps, at: history.at };
}
