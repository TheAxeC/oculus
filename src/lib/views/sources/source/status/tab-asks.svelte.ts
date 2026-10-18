// Layer 3, view partial of Source.svelte. What the tab offers to the places that ask it things and
// what it does when one asks: the tab's own actions that apply now (Save, Revert File, word wrap,
// the rendered half, Open Preview to the Side, Submit Job, Toggle Blame, then a language server's,
// a LaTeX file's and the linters'), the list the palette shows (those, then the editor's own
// actions while the editor is drawn), the status the bar draws for the tab, and the performing of
// an ask of the bar, the palette or Cmd+S (ask-perform.ts, source-status.svelte.ts).
//
// The tab reads its own state through `facts`, an object of getters that this partial reads inside
// the effects and deriveds it registers, so each of them runs again when a fact it read changes and
// for no other fact (the actions do not move with the caret or the text); `does` holds what a press
// calls on the tab, which reads nothing.

import type {
    EditorAction,
    EditorStatus,
    EditorStatusStore
} from '$lib/state/workbench/navigation/editor-status.svelte';
import {
    lineCount,
    type Caret,
    type Indent,
    type LineEnding
} from '$lib/state/workbench/navigation/editor-text';
import { ownListing } from '$lib/ui/controls/editor/chords';
import { onMac } from '$lib/ui/controls/editor/kit/load';
import type { EditorHandle, EditorOwnAction } from '$lib/ui/controls/editor/types';
import { performAsk, tabActions } from './ask-perform';
import { connectSourceStatus } from './source-status.svelte';

/** What the tab is now, each fact a getter, read when the actions, the status or an ask need it. */
type SourceFacts = {
    /** Whether the draft is read in and the tab has text to say anything about. */
    read: boolean;
    /** Whether the text may be written. */
    editing: boolean;
    /** Whether the editor is drawn. */
    drawn: boolean;
    /** Whether the file has a rendered half. */
    markdown: boolean;
    /** Whether the file is a served Markdown file rather than one read at a commit. */
    previewable: boolean;
    /** Whether the file is in a repository and its text is loaded. */
    blameable: boolean;
    /** Whether the file is a .slurm job script on disk under a served root. */
    submittable: boolean;
    /** The indentation in force, null while the configuration has not arrived. */
    indent: Indent | null;
    ending: LineEnding;
    language: string;
    text: string;
    caret: Caret;
    selection: string;
    editor: EditorHandle | undefined;
    /** The caret line's blame in the bar's words. */
    blame: string;
    /** The absolute path of the file, empty for a tab showing no file on disk. */
    file: string;
    served: EditorStatus['served'];
    /**
     * The linters that have answered for the file with their last run's state, undefined for a tab
     * with none.
     */
    linters: EditorStatus['linters'];
    /** The actions a language server adds, those of a LaTeX file and those of the linters. */
    languageActions: EditorOwnAction[];
    latexActions: EditorOwnAction[];
    lintActions: EditorOwnAction[];
};

/** What a press on one of the tab's actions calls on the tab. */
type SourceDoes = {
    save: () => void;
    revert: () => void;
    toggleWrap: () => void;
    toggleRendered: () => void;
    previewSide: () => void;
    submit: () => void;
    toggleBlame: () => void;
    openCommit: () => void;
    setLanguage: (language: string) => void;
    setIndent: (indent: Indent) => void;
    select: Parameters<typeof performAsk>[1]['select'];
};

export type TabAsksDeps = {
    store: Pick<EditorStatusStore, 'asked' | 'forget' | 'publish'>;
    id: () => string;
    facts: SourceFacts;
    does: SourceDoes;
};

export type TabAsks = {
    /** The tab's actions that apply now. */
    readonly own: EditorOwnAction[];
    /** The editor says which actions it offers once it has loaded them. */
    offered: (next: EditorAction[]) => void;
};

/** Connect the tab to the status bar, the palette and Cmd+S for as long as it is mounted. */
export function createTabAsks(deps: TabAsksDeps): TabAsks {
    const { does } = deps;
    /** The editor's own actions the palette lists, as it labelled them once it loaded. */
    let actions: EditorAction[] = $state([]);
    const own = $derived.by(() => {
        const facts = deps.facts;
        return tabActions({
            editing: facts.editing,
            markdown: facts.markdown,
            previewable: facts.previewable,
            blameable: facts.blameable,
            submittable: facts.submittable,
            save: does.save,
            revert: does.revert,
            toggleWrap: does.toggleWrap,
            toggleRendered: does.toggleRendered,
            submit: does.submit,
            previewSide: does.previewSide,
            toggleBlame: does.toggleBlame,
            language: facts.drawn ? facts.languageActions : [],
            latex: facts.latexActions,
            lint: facts.drawn ? facts.lintActions : []
        });
    });
    /** What the palette lists: the tab's actions, then the editor's while it is drawn. */
    const listed = $derived([
        ...ownListing(own, onMac()),
        ...(deps.facts.drawn
            ? actions.filter((one) => !own.some((mine) => mine.id === one.id))
            : [])
    ]);
    // What the status bar draws for this tab, said again whenever any of it changes, and the asks
    // of the bar and the palette. A tab with no text yet says nothing, so the bar draws no source
    // items over a tab still reading. A tab whose indentation is not known yet (the configuration
    // has not arrived) says so with a null indentation, and still takes the save key.
    connectSourceStatus({
        store: deps.store,
        id: deps.id,
        status: () => {
            const facts = deps.facts;
            if (!facts.read) return null;
            return {
                caret: facts.drawn ? facts.caret : null,
                lines: lineCount(facts.text),
                indent: facts.indent,
                ending: facts.ending,
                language: facts.language,
                writable: facts.editing,
                blame: facts.blame,
                actions: listed,
                file: facts.file,
                selection: facts.drawn ? facts.selection : '',
                served: facts.served,
                ...(facts.linters === undefined ? {} : { linters: facts.linters })
            };
        },
        perform: (ask) => {
            const facts = deps.facts;
            performAsk(ask, {
                editing: facts.editing,
                drawn: facts.drawn,
                indent: facts.indent,
                editor: facts.editor,
                actions: own,
                openCommit: does.openCommit,
                setLanguage: does.setLanguage,
                setIndent: does.setIndent,
                select: does.select
            });
        }
    });
    return {
        get own() {
            return own;
        },
        offered: (next) => (actions = next)
    };
}
