// Layer 3, view helper. The rules a transcript's rows go by, apart from the component so each is
// plain data over the turns: which turns stand alone and which make one run of tool calls, which
// said turn draws a head, the words of a closed run, what a tool's name draws as, whether a run
// stands open, what a press on a link in an answer does, and the flat rows the window draws.
//
// A row is known by its place in the list as it stood at the first read: `first` subtracts the
// count of turns reads of older turns added at the top (`above`), so it is negative for an older
// row, and a read of either kind leaves the rows that were there under the same index, except the
// `first` of a run it extends at the top of the list.
//
// The window (turn-window.svelte.ts) draws flat rows, so no size escapes it: a said turn is one
// row, a closed run or a single call is one row, and an open run is its press as one row and one
// row per call. A flat row's key is a string that holds across reads: a turn's own index, which a
// read never changes, and for a press that index with a prefix, so it never equals a call's. Each
// row's box holds the space above it (`RowLead`), which comes from the row's place in the list, so
// the heights of the rows add up to the height of the list.
//
// A run's choice is held by the tab (tab-session.svelte.ts) under the run's first call: its id, or,
// for a call with an empty id, as every Codex call has, its stamp, name and summary (`callKey`,
// `runKey`). The key holds no list index, so it names the same call in every read of the
// transcript. A read from where the last one stopped grows the list at the foot and patches it in
// place, and a read from the start, which the body makes each time it is drawn anew, replaces the
// list, and a run wholly inside either finds its choice. A read from the start can cut a run, which
// then starts at a later call under another key and reads as never pressed until older turns grow
// it back to its first call. A choice made while the run was cut is held under one of the grown
// run's later calls, whichever call the cut stood at then, so it moves to the run's key from any of
// them at the next draw that holds the run (`carryChoices`).
//
// An answer's document is held by the turn's HTML, which a read never changes. The store keeps an
// unchanged turn's object across a read that appends, and a read that adds turns above gives a held
// turn a new object, so the object is no key: by its HTML, either read hands Markdown.svelte the
// same document for every answer it held, and its Copy controls stand. The hold is made once per
// component, so nothing is shared between tabs, and it is emptied with the view's target, so it
// goes with the turns it served.

import { OUTWARD_SCHEME } from '$lib/ui/html';
import { docOfHtml, type DocState } from '$lib/state/system/docs.svelte';
import type { Turn } from '$lib/state/sessions/transcript.svelte';

/** A turn someone said, and whether it draws its head. */
type SaidRow = { kind: 'said'; first: number; turn: Turn; head: boolean };

/** Tool calls next to each other in the list, from the index of the first. */
type RunRow = { kind: 'run'; first: number; calls: Turn[] };

/** One row of the list: a said turn, or a run of one or more tool calls. */
export type TurnRow = SaidRow | RunRow;

/** What a press chose for a run. A run with no entry was never pressed. */
export type RunChoice = 'opened' | 'closed';

/**
 * The space a row's box holds above its content: none at the head of the list and between the calls
 * of an open run, a row's gap, or the wider gap and the line that open an exchange.
 */
type RowLead = 'none' | 'gap' | 'exchange';

/** What every flat row carries: its key, the turn index it stands at, and the space above it. */
type FlatPlace = { key: string; at: number; lead: RowLead };

/** A said turn as one row of the window. */
type SaidFlat = FlatPlace & { kind: 'said'; turn: Turn; head: boolean };

/** The press of a run of two or more calls: `choice` is the `runKey` a press is held under. */
export type PressFlat = FlatPlace & {
    kind: 'press';
    calls: Turn[];
    open: boolean;
    choice: string;
};

/** One call as a row of the window: a single call, or a call of an open run. */
export type CallFlat = FlatPlace & { kind: 'call'; call: Turn };

/** One row of the window. */
export type FlatRow = SaidFlat | PressFlat | CallFlat;

/** What opens the key of a run's press, so it cannot equal a call's key. */
const PRESS_KEY = 'run:';

/** The turn index a flat row's key names, which holds for a key no row has any more. */
export function rowPlace(key: string): number {
    return Number(key.startsWith(PRESS_KEY) ? key.slice(PRESS_KEY.length) : key);
}

/** The opening a row takes: none for the row at the head of the whole list. */
function leadAt(index: number, lead: RowLead): RowLead {
    return index === 0 ? 'none' : lead;
}

/**
 * The rows the window draws, over the rows of the list and what the tab's presses chose. An open
 * run's calls stand together, so a call's row takes no space above it.
 */
export function flatRows(
    rows: readonly TurnRow[],
    chosen: ReadonlyMap<string, RunChoice>
): FlatRow[] {
    const flat: FlatRow[] = [];
    for (const row of rows) {
        const at = row.first;
        if (row.kind === 'said') {
            const opens = row.turn.role === 'user' ? 'exchange' : 'gap';
            const lead = leadAt(flat.length, opens);
            flat.push({ kind: 'said', key: String(at), at, lead, turn: row.turn, head: row.head });
            continue;
        }
        const lead = leadAt(flat.length, 'gap');
        if (row.calls.length === 1) {
            flat.push({ kind: 'call', key: String(at), at, lead, call: row.calls[0] });
            continue;
        }
        const choice = runKey(row);
        const open = runOpen(chosen.get(choice), row.calls);
        const key = `${PRESS_KEY}${String(at)}`;
        flat.push({ kind: 'press', key, at, lead, calls: row.calls, open, choice });
        if (!open) continue;
        for (const [offset, call] of row.calls.entries()) {
            const index = at + offset;
            flat.push({ kind: 'call', key: String(index), at: index, lead: 'none', call });
        }
    }
    return flat;
}

/** How many px a row's box starts with for each opening, as TurnList.svelte draws them. */
const LEAD_PX: Record<RowLead, number> = { none: 0, gap: 10, exchange: 37 };

/** The height of a line of a row and of a head, near what the tokens give at the base size. */
const LINE_PX = 22;
const HEAD_PX = 26;

/** About how many characters a line of a turn holds at its 80ch limit. */
const LINE_CHARS = 90;

/**
 * The height a row stands at until it is measured: from its kind and its length, above 0. It only
 * has to be near, since the column's place is held by the rows drawn (reader-place.ts).
 */
export function rowEstimate(row: FlatRow): number {
    if (row.kind !== 'said') return LEAD_PX[row.lead] + LINE_PX;
    const text = row.turn.text;
    const lines = text.split('\n').length + Math.floor(text.length / LINE_CHARS);
    return LEAD_PX[row.lead] + (row.head ? HEAD_PX : 0) + lines * LINE_PX;
}

/** What an answer's HTML holds when its row has a keyboard stop: a link, a code block's control. */
const STOP_IN_HTML = /<(?:a\s|pre\b|details\b|input\b)/i;

/** Whether a row holds a keyboard stop, read from its data, as an undrawn row has no element. */
function holdsStop(row: FlatRow): boolean {
    if (row.kind === 'press') return true;
    return row.kind === 'said' && STOP_IN_HTML.test(row.turn.html);
}

/** The index of the next row past `from` that holds a keyboard stop, or -1 for none. */
export function nextStopRow(rows: readonly FlatRow[], from: number, step: 1 | -1): number {
    for (let at = from + step; at >= 0 && at < rows.length; at += step) {
        if (holdsStop(rows[at])) return at;
    }
    return -1;
}

/** The key of the first row whose answer carries one of the ids, tried in order, or null. */
export function rowOfId(rows: readonly FlatRow[], ids: readonly string[]): string | null {
    for (const id of ids) {
        const found = rows.find(
            (row) =>
                row.kind === 'said' &&
                (row.turn.html.includes(`id="${id}"`) || row.turn.html.includes(`id='${id}'`))
        );
        if (found !== undefined) return found.key;
    }
    return null;
}

/** The turns of a list and how many of them reads of older turns added. */
type HeldList = { turns: readonly Turn[]; above: number };

/** Whether two turns are one turn of the file; an outcome that arrived later leaves it one turn. */
function sameTurn(one: Turn | undefined, two: Turn | undefined): boolean {
    if (one === undefined || two === undefined) return one === two;
    return (
        one.at === two.at &&
        one.role === two.role &&
        one.text === two.text &&
        one.tool?.id === two.tool?.id
    );
}

/**
 * Whether a read from the start replaced the list, which leaves a key naming another turn: the
 * count above fell, the list below that count shrank, or index 0 names another turn. Only that
 * read does any of these, and an empty list had no key to leave.
 */
export function listReplaced(before: HeldList, after: HeldList): boolean {
    if (before.turns.length === 0) return false;
    return (
        after.above < before.above ||
        after.turns.length - after.above < before.turns.length - before.above ||
        !sameTurn(before.turns[before.above], after.turns[after.above])
    );
}

type Words = (key: string, ...args: (string | number)[]) => string;

/** What opens the name of a tool an MCP server offers: `mcp__server__tool`. */
const SERVER_TOOL = 'mcp__';

/** What parts of such a name are joined by. */
const NAME_JOIN = '__';

const MINUTE_MS = 60_000;

/** The minute a stamp falls in, or null for no stamp or a text that names no time. */
function minuteOf(stamp: string | null): number | null {
    if (stamp === null) return null;
    const time = Date.parse(stamp);
    return Number.isNaN(time) ? null : Math.floor(time / MINUTE_MS);
}

/**
 * The rows of a list of turns, the top `above` of which reads of older turns added. A person's turn
 * always draws its head. An answer draws its head unless the last head drawn has the same stamp to
 * the minute, so an agent that answers in pieces reads as one voice; the rows of a run between them
 * draw no head and do not count, and a turn with no stamp always draws its head.
 */
export function groupTurns(turns: readonly Turn[], above: number): TurnRow[] {
    const rows: TurnRow[] = [];
    let run: RunRow | null = null;
    let headMinute: number | null = null;
    for (const [at, turn] of turns.entries()) {
        const first = at - above;
        if (turn.role === 'tool') {
            if (run === null) {
                run = { kind: 'run', first, calls: [] };
                rows.push(run);
            }
            run.calls.push(turn);
            continue;
        }
        run = null;
        const minute = minuteOf(turn.at);
        const head = turn.role === 'user' || minute === null || minute !== headMinute;
        if (head) headMinute = minute;
        rows.push({ kind: 'said', first, turn, head });
    }
    return rows;
}

/**
 * What a row draws for a tool: for `mcp__server__tool`, the part after the last `__`. A name with
 * no second `__`, or one ending in `__`, has no such part and draws whole.
 */
export function displayName(name: string): string {
    if (!name.startsWith(SERVER_TOOL)) return name;
    const last = name.lastIndexOf(NAME_JOIN);
    const tail = name.slice(last + NAME_JOIN.length);
    return last < SERVER_TOOL.length || tail === '' ? name : tail;
}

/** The word a tool is drawn by, which a call with no name takes from the catalog. */
export function toolWord(name: string, t: Words): string {
    return name === '' ? t('sessions.turn_tool') : displayName(name);
}

/**
 * The words of a closed run: how many calls, then each tool in the order first seen, counted by its
 * whole name, with its count when it ran more than once.
 */
export function runWords(calls: readonly Turn[], t: Words): string {
    const counts = new Map<string, number>();
    for (const call of calls) {
        const name = call.tool?.name ?? '';
        counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    const names = [...counts].map(([name, count]) => {
        const word = toolWord(name, t);
        return count > 1 ? t('sessions.turn_run_count', word, count) : word;
    });
    return t('sessions.turn_run', calls.length, names.join(t('sessions.turn_run_separator')));
}

/** Whether a run holds a call with this outcome: false failed, null has not come back. */
export function runHolds(calls: readonly Turn[], ok: boolean | null): boolean {
    return calls.some((call) => call.tool?.ok === ok);
}

/**
 * What names a call in every read: its id, or, for an empty id, its stamp, name and summary,
 * written as a list so no two of them read as one.
 */
function callKey(call: Turn): string {
    const tool = call.tool;
    if (tool?.id) return tool.id;
    return JSON.stringify([call.at, tool?.name, tool?.summary]);
}

/** What a choice on a run is held under: the key of its first call. */
function runKey(row: RunRow): string {
    return callKey(row.calls[0]);
}

/**
 * Moves a choice held under a later call of a run onto the run's key, and drops the others held
 * there. The keys are tried last call first: the cut of a first read falls later as the file grows,
 * so a later call holds the later press. A key that is another run's first key stays, since two
 * calls with empty ids can share one.
 */
export function carryChoices(rows: readonly TurnRow[], chosen: Map<string, RunChoice>): void {
    if (chosen.size === 0) return;
    const runs = rows.filter((row) => row.kind === 'run');
    const firsts = new Set(runs.map(runKey));
    for (const run of runs) {
        const later = run.calls
            .slice(1)
            .map(callKey)
            .filter((key) => !firsts.has(key))
            .reverse();
        const choice = later.map((key) => chosen.get(key)).find((held) => held !== undefined);
        later.forEach((key) => chosen.delete(key));
        if (choice !== undefined) chosen.set(runKey(run), choice);
    }
}

/** Whether a run stands open: as chosen, else while it holds a failed call. */
function runOpen(choice: RunChoice | undefined, calls: readonly Turn[]): boolean {
    return choice === undefined ? runHolds(calls, false) : choice === 'opened';
}

/**
 * Whether a link of an answer points inside the page. A press on one is answered here and goes
 * nowhere, since an agent's relative link names a file of its own folder, which the page does not
 * serve. A link to a fragment is the document's own and a link out of the page opens its own tab.
 */
export function relativeLink(href: string): boolean {
    return !href.startsWith('#') && !OUTWARD_SCHEME.test(href);
}

/** The reader of an answer's document for one component, held by the turn's HTML. */
export function turnDocs(): { of: (turn: Turn) => DocState; clear: () => void } {
    const held = new Map<string, DocState>();
    return {
        of: (turn) => {
            const doc = held.get(turn.html) ?? docOfHtml(turn.html);
            held.set(turn.html, doc);
            return doc;
        },
        clear: () => {
            held.clear();
        }
    };
}
