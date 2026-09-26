// Layer 2, client state. What each source tab says about the text it holds, for the status bar to
// draw, and what the status bar asks of it, for the tab to do.
//
// The source view publishes its caret, its indentation, its line ending, its language, whether it
// may be written and, while its blame is on, the caret line's blame, keyed by its instance, and
// takes its entry away when it unmounts. The shell reads the entry of the tab on screen and draws
// the bar's source items from it; it never holds the text, so a change it offers (a line to go to,
// an indentation to convert to, another line ending, another language, the blamed commit to open)
// is asked of the instance, and the view that holds the text performs it. Every ask carries a
// sequence number, so a view performs one ask once, and a view that mounts after an ask was made
// does not perform it.

import { untrack } from 'svelte';
import type { Caret, Indent, LineEnding } from './editor-text.ts';

/** What one source tab publishes. `caret` is null for a tab drawing no editor. */
export type EditorStatus = {
    caret: Caret | null;
    /** How many lines the text holds, the range a go-to-line is read in. */
    lines: number;
    indent: Indent;
    ending: LineEnding;
    /** The highlighter's name for the language the tab paints its text in. */
    language: string;
    /** Whether the tab may write its file, which is when the text can be changed from the bar. */
    writable: boolean;
    /** The caret line's blame in the bar's words while blame is on, and the empty string else. */
    blame: string;
};

/** One change the status bar asks of a source tab. */
export type EditorAsk =
    | { kind: 'goto'; line: number }
    | { kind: 'indent'; indent: Indent }
    | { kind: 'convert'; tabs: boolean }
    | { kind: 'ending'; ending: LineEnding }
    | { kind: 'language'; language: string }
    | { kind: 'commit' };

/** An ask as the instance reads it, numbered so it is performed once. */
export type EditorRequest = EditorAsk & { instance: string; seq: number };

export type EditorStatusStore = {
    /** Say what one tab holds now, replacing what it said before. */
    publish: (instance: string, status: EditorStatus) => void;
    /** Take a tab's entry away, which is what an unmounted tab does. */
    forget: (instance: string) => void;
    /** What one tab last said, or null for a tab that says nothing. */
    statusOf: (instance: string) => EditorStatus | null;
    /** Ask one tab for a change. An instance that says nothing is asked nothing. */
    ask: (instance: string, ask: EditorAsk) => boolean;
    /** The last ask made of one instance, or null when the last ask was another's or none. */
    asked: (instance: string) => EditorRequest | null;
};

/** The source tab on screen and what it last said, as the status bar and the palette read it. */
export type SourceOnScreen = { instance: string; status: EditorStatus };

/**
 * The source tab on screen, when the tab on screen is one and has said what it holds, and null
 * for any other tab and for none.
 */
export function sourceOnScreen(
    tab: { id: string; view: string } | null,
    statusOf: (instance: string) => EditorStatus | null
): SourceOnScreen | null {
    if (tab?.view !== 'source') return null;
    const said = statusOf(tab.id);
    return said === null ? null : { instance: tab.id, status: said };
}

export function createEditorStatus(): EditorStatusStore {
    const held: { entries: Record<string, EditorStatus>; last: EditorRequest | null } = $state({
        entries: {},
        last: null
    });

    // The tab publishes and forgets from an effect, so the record is read untracked here: an
    // effect that read what it writes would run again on its own write.
    function publish(instance: string, status: EditorStatus): void {
        if (instance === '') return;
        held.entries = { ...untrack(() => held.entries), [instance]: status };
    }

    function forget(instance: string): void {
        const entries = { ...untrack(() => held.entries) };
        if (!(instance in entries)) return;
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- the record is keyed by instance id, and a Map would not be reactive through $state
        delete entries[instance];
        held.entries = entries;
    }

    function statusOf(instance: string): EditorStatus | null {
        return held.entries[instance] ?? null;
    }

    function ask(instance: string, change: EditorAsk): boolean {
        if (statusOf(instance) === null) return false;
        held.last = { ...change, instance, seq: (held.last?.seq ?? 0) + 1 };
        return true;
    }

    function asked(instance: string): EditorRequest | null {
        const last = held.last;
        return last !== null && last.instance === instance ? last : null;
    }

    return { publish, forget, statusOf, ask, asked };
}
