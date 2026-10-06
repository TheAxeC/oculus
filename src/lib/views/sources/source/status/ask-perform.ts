// Layer 3, view partial of Source.svelte. What the status bar, the palette and Cmd+S ask of a
// source tab, and the actions the tab owns. A language and an indentation are kept with the draft,
// the caret line's commit opens in the Repositories view, and a line to go to, a conversion of the
// indentation, a line ending and an editor action are performed by the editor on its model, which
// is asked only while the text may be written.
//
// The tab's own actions are File: Save, File: Revert File, View: Toggle Word Wrap (Alt+Z),
// Markdown: Toggle Rendered Half, Markdown: Open Preview to the Side, Slurm: Submit Job and Git:
// Toggle Git Blame Editor Decoration. Each is in `tabActions` only while it applies, so the palette
// lists what the tab on screen can do, whether or not it draws an editor, and an ask for an action
// that does not apply does nothing.
//
// Cmd+S is the shell key action `save` (shell/keys/keys.ts), performed in workbench-keys.svelte.ts
// by an ask to the source tab on screen, and Alt+Z is the key of word wrap in the editor.

import {
    SAVE_ACTION,
    type EditorAsk,
    type SelectRange
} from '$lib/state/workbench/navigation/editor-status.svelte';
import type { Indent } from '$lib/state/workbench/navigation/editor-text';
import { WRAP_ACTION } from '$lib/ui/controls/editor/options';
import type { EditorHandle, EditorOwnAction } from '$lib/ui/controls/editor/types';
import { t } from '$lib/state/shared/words/text';

/** What the tab's own actions read of the tab and call on it. */
export type TabActionDeps = {
    /** Whether the text may be written, which is when Save, Revert and word wrap apply. */
    editing: boolean;
    /** Whether the file has a rendered half, which is what a Markdown file has. */
    markdown: boolean;
    /** Whether the file is a served Markdown file rather than one read at a commit. */
    previewable: boolean;
    /** Whether the file is in a repository and its text is loaded. */
    blameable: boolean;
    /** Whether the file is a .slurm job script on disk under a served root. */
    submittable: boolean;
    save: () => void;
    revert: () => void;
    toggleWrap: () => void;
    toggleRendered: () => void;
    previewSide: () => void;
    submit: () => void;
    toggleBlame: () => void;
    /** The actions a language server adds, which follow the tab's own in the palette. */
    language: EditorOwnAction[];
};

/** The actions of the tab that apply now, in the order the palette lists them. */
export function tabActions(deps: TabActionDeps): EditorOwnAction[] {
    const listed: EditorOwnAction[] = [];
    if (deps.editing) {
        listed.push(
            { id: SAVE_ACTION, label: t('source.cmd_save'), run: deps.save },
            { id: 'oculus.revert', label: t('source.cmd_revert'), run: deps.revert },
            {
                id: WRAP_ACTION,
                label: t('source.toggle_word_wrap'),
                key: { code: 'KeyZ', alt: true },
                run: deps.toggleWrap
            }
        );
    }
    if (deps.editing && deps.markdown) {
        listed.push({
            id: 'oculus.toggleRendered',
            label: t('source.cmd_rendered'),
            run: deps.toggleRendered
        });
    }
    if (deps.previewable) {
        listed.push({
            id: 'oculus.previewSide',
            label: t('source.cmd_preview_side'),
            run: deps.previewSide
        });
    }
    if (deps.submittable) {
        listed.push({ id: 'oculus.submit', label: t('source.cmd_submit'), run: deps.submit });
    }
    if (deps.blameable) {
        listed.push({ id: 'oculus.blame', label: t('source.cmd_blame'), run: deps.toggleBlame });
    }
    return [...listed, ...deps.language];
}

/** What performing an ask reads of the tab and calls on it. */
export type AskDeps = {
    /** Whether the text may be written, which is when its indentation and ending change. */
    editing: boolean;
    /** Whether the editor is drawn, which is when it is asked to go to a line or to select. */
    drawn: boolean;
    /**
     * The indentation the text is shown in, whose size a conversion keeps; null before it is known.
     */
    indent: Indent | null;
    editor: EditorHandle | undefined;
    /** The tab's own actions that apply now. */
    actions: EditorOwnAction[];
    openCommit: () => void;
    setLanguage: (language: string) => void;
    setIndent: (indent: Indent) => void;
    /** Select a range of the text, which a press on a node of the Files view's AST asks. */
    select: (range: SelectRange) => void;
};

/** Perform one ask on the tab. */
export function performAsk(ask: EditorAsk, deps: AskDeps): void {
    const own = ask.kind === 'action' ? deps.actions.find((one) => one.id === ask.id) : undefined;
    if (own !== undefined) {
        own.run();
    } else if (ask.kind === 'commit') {
        deps.openCommit();
    } else if (ask.kind === 'language') {
        deps.setLanguage(ask.language);
    } else if (ask.kind === 'indent') {
        deps.setIndent(ask.indent);
    } else if (ask.kind === 'select') {
        deps.select(ask.range);
    } else if (!deps.drawn) {
        return;
    } else if (ask.kind === 'convert') {
        if (!deps.editing || deps.indent === null) return;
        deps.setIndent({ tabs: ask.tabs, size: deps.indent.size });
        deps.editor?.perform(ask);
    } else if (ask.kind === 'ending') {
        if (deps.editing) deps.editor?.perform(ask);
    } else {
        deps.editor?.perform(ask);
    }
}
