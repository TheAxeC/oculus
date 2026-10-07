// Layer 2, client state. What each source tab says about the text it holds, for the status bar to
// draw, and what the status bar asks of it, for the tab to do.
//
// The source view publishes its caret, its indentation, its line ending, its language, whether it
// may be written, the file it shows and the text selected in it and, for a file in a repository,
// the caret line's blame, keyed by its instance, and takes its entry away when it unmounts. The
// shell reads the entry of the tab on screen and draws the bar's source items from it; it never
// holds the text, so a change it offers (a line to go to, an indentation to convert to, another
// line ending, another language, the blamed commit to open) is asked of the instance, and the view
// that holds the text performs it. Every ask carries a sequence number, so a view performs one ask
// once, and a view that mounts after an ask was made does not perform it.
//
// A tab also publishes the editor actions it offers the palette, the Cmd+K chords the editor gave
// up so Cmd+K reaches the palette, and the palette asks the tab to run one by its id. A diff pane
// publishes its diff editor's actions the same way, and says nothing else of use to the bar.
//
// The store also holds the source tab whose editor the reader focused last, until that tab goes: a
// project command started from a button in another view reads its placeholders from that tab.

import { untrack } from 'svelte';
import type { Caret, Indent, LineEnding } from './editor-text.ts';

/**
 * One editor action a tab offers the palette: its id, the editor's label, and its keys as the hint
 * (a removed chord's old chord, or a mark action's key), empty for an action with none.
 */
export type EditorAction = { id: string; label: string; hint: string };

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
    /** The caret line's blame in the bar's words, and the empty string for a line with none. */
    blame: string;
    /** The editor actions the tab offers the palette, none for a tab drawing no editor. */
    actions: EditorAction[];
    /** The absolute path of the file the tab shows, empty for a tab showing no file on disk. */
    file: string;
    /** The text selected in the editor, empty when none is or when it is too long to carry. */
    selection: string;
    /**
     * The root and language a language server serves the tab by, null for a tab no server serves.
     * The status bar's language server, interpreter and compile database items read the server
     * of this root.
     */
    served: { root: string; language: string } | null;
};

/** A range of a text, lines and characters counted from zero as a language server counts them. */
export type SelectRange = {
    start: { line: number; character: number };
    end: { line: number; character: number };
};

/** One change the status bar asks of a source tab. */
export type EditorAsk =
    | { kind: 'goto'; line: number; column?: number }
    | { kind: 'indent'; indent: Indent }
    | { kind: 'convert'; tabs: boolean }
    | { kind: 'ending'; ending: LineEnding }
    | { kind: 'language'; language: string }
    | { kind: 'commit' }
    | { kind: 'select'; range: SelectRange; focus?: boolean }
    | { kind: 'insert'; text: string; snippet?: boolean }
    | { kind: 'replace'; text: string }
    | { kind: 'action'; id: string };

/** The id of the tab action Cmd+S asks of the source tab on screen. */
export const SAVE_ACTION = 'oculus.save';

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
    /** Say that the reader put the focus in this tab's editor. */
    focus: (instance: string) => void;
    /** The tab whose editor the reader focused last and what it said, or null once it is gone. */
    focused: () => SourceOnScreen | null;
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

/** The views whose tab lists editor actions for the palette: a source tab and a diff pane. */
const ACTION_VIEWS: readonly string[] = ['source', 'repositories-diff'];

/**
 * The tab on screen whose editor actions the palette lists, a source tab or a diff pane, and what
 * it last said; null for any other tab and for none. The status bar reads the source tab alone
 * (`sourceOnScreen`), since a diff pane holds no caret, indentation or language to change.
 */
export function editorOnScreen(
    tab: { id: string; view: string } | null,
    statusOf: (instance: string) => EditorStatus | null
): SourceOnScreen | null {
    if (tab === null || !ACTION_VIEWS.includes(tab.view)) return null;
    const said = statusOf(tab.id);
    return said === null ? null : { instance: tab.id, status: said };
}

export function createEditorStatus(): EditorStatusStore {
    const held: {
        entries: Record<string, EditorStatus>;
        last: EditorRequest | null;
        focused: string | null;
    } = $state({ entries: {}, last: null, focused: null });

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
        if (untrack(() => held.focused) === instance) held.focused = null;
    }

    function focus(instance: string): void {
        if (instance !== '') held.focused = instance;
    }

    function focused(): SourceOnScreen | null {
        const instance = held.focused;
        const said = instance === null ? null : statusOf(instance);
        return instance === null || said === null ? null : { instance, status: said };
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

    return { publish, forget, statusOf, ask, asked, focus, focused };
}
