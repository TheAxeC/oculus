// Layer 3, view helper. The rules a transcript's rows go by, apart from the component so each is
// plain data over the turns: which turns stand alone and which make one run of tool calls, which
// said turn draws a head, the words of a closed run, what a tool's name draws as, whether a run
// stands open, and what a press on a link in an answer does.
//
// A row is known by its place in the list as it stood at the first read: `first` subtracts the
// count of turns reads of older turns added at the top (`above`), so it is negative for an older
// row, and a read of either kind leaves the rows that were there under the same index. The index
// keys the rows of the view, so such a read draws no row anew, except a run it extends at the top
// of the list. A run's choice is held under that index of its first turn and that call's stamp
// (`runKey`). A read from where the last one stopped grows the list at the foot and patches it in
// place, so the key holds while a run grows and the choice holds with it. A read of older turns can
// grow the run at the top of the list at its head, which gives that run a new key, so its choice
// moves to that key (`movedRun`). A read from the start replaces the list, and the newest turns it
// keeps may start at another turn; an index then names another run, and the stamp makes its key
// miss the old choice, so that run reads as never pressed.
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

/** What a choice on a run is held under: the index of its first turn and that call's stamp. */
export function runKey(row: RunRow): string {
    return `${String(row.first)}:${row.calls[0]?.at ?? ''}`;
}

/**
 * The key the run at the top of `drawn` goes by in `rows` when a read of older turns grew it at its
 * head, with the key it had, or null when no run did.
 */
export function movedRun(
    drawn: readonly TurnRow[],
    rows: readonly TurnRow[]
): { from: string; to: string } | null {
    const top = drawn.at(0);
    if (top?.kind !== 'run') return null;
    for (const row of rows) {
        if (row.kind !== 'run') continue;
        if (row.first < top.first && top.first < row.first + row.calls.length) {
            return { from: runKey(top), to: runKey(row) };
        }
    }
    return null;
}

/** Whether a run stands open: as chosen, else while it holds a failed call. */
export function runOpen(choice: RunChoice | undefined, calls: readonly Turn[]): boolean {
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
