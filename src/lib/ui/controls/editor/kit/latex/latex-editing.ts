// Layer 3, primitive. The editing commands of a LaTeX model, as an EditorExtension
// (../../types.ts): the commands on environments, sectioning and the formatting shortcuts (the pure
// finders of editing/), the Enter that carries `\item` to the next line, the `@` suggestions and
// the smart selection ranges. Each provider answers for this model alone and is taken away with it,
// since Monaco keeps providers per language and the page may hold more than one LaTeX model.
//
// The commands the page lists in the palette and binds to keys (`LatexCommands`) are handed to the
// page when the extension is made and taken back when it ends; each is one undoable edit, which is
// applied through `executeEdits` between two undo stops, and each answers nothing when the text
// holds nothing to act on. Wrapping the selection in an environment or a command is a snippet, so
// the name the reader types is mirrored where it closes.

import type * as Monaco from 'monaco-editor';
import type { EditorExtension } from '../../types';
import type { Change, Selected } from './editing/edit';
import {
    closeEnvironment,
    enterOnItem,
    navigateTo,
    onEnvironmentName,
    selectEnclosing
} from './editing/environments';
import { rangesAt } from './editing/selection';
import { sectionAt, shiftSections } from './editing/sectioning';
import { toggleKeyword } from './editing/shortcuts';

/** One `@` suggestion: what is typed after the `@`, what it inserts as a snippet, what it means. */
type AtSuggestion = { prefix: string; body: string; description: string };

/** The commands the page runs on the editor of a LaTeX model. */
export type LatexCommands = {
    navigate: () => void;
    selectEnvironment: () => void;
    selectContent: () => void;
    selectName: () => void;
    cursorsInName: () => void;
    toggleEquation: () => void;
    closeEnvironment: () => void;
    wrapEnvironment: () => void;
    surround: () => void;
    item: () => void;
    keyword: (name: string) => void;
    promote: () => void;
    demote: () => void;
    selectSection: () => void;
};

/** What the extension is given by the page. */
export type LatexEditingDeps = {
    /** The `@` suggestions of the configuration. */
    at: AtSuggestion[];
    /** The parse tree of a text, or null when the text does not parse. */
    parse: (text: string) => Promise<object | null>;
    /** Hand the page the commands once the editor has them, and null when they go. */
    ready: (commands: LatexCommands | null) => void;
};

/** The part of Monaco's snippet controller the commands use. */
type Snippets = { insert: (template: string) => void };

/** The undo source every edit of these commands carries. */
const SOURCE = 'oculus-latex';

/** The editing commands of one model. */
export function latexEditing(deps: LatexEditingDeps): EditorExtension {
    return (kit, editor, model) => {
        const { monaco } = kit;

        /** The offsets of a selection of the editor. */
        const offsets = (selection: Monaco.Selection): Selected => ({
            anchor: model.getOffsetAt(selection.getStartPosition()),
            active: model.getOffsetAt(selection.getPosition())
        });

        const position = (offset: number): Monaco.Position => model.getPositionAt(offset);

        const selectionOf = (one: Selected): Monaco.Selection => {
            const anchor = position(one.anchor);
            const active = position(one.active);
            return new monaco.Selection(
                anchor.lineNumber,
                anchor.column,
                active.lineNumber,
                active.column
            );
        };

        /** The caret of the first selection, as an offset. */
        const caret = (): number =>
            offsets(editor.getSelection() ?? new monaco.Selection(1, 1, 1, 1)).active;

        /** Apply a change as one undoable edit, then place the selections it names. */
        function apply(change: Change | null): void {
            if (change === null) return;
            if (change.edits.length > 0) {
                editor.pushUndoStop();
                editor.executeEdits(
                    SOURCE,
                    change.edits.map((edit) => ({
                        range: monaco.Range.fromPositions(position(edit.start), position(edit.end)),
                        text: edit.text,
                        forceMoveMarkers: true
                    }))
                );
                editor.pushUndoStop();
            }
            if (change.select !== undefined) editor.setSelections(change.select.map(selectionOf));
        }

        function snippet(template: string): void {
            const found = editor.getContribution(
                'snippetController2'
            ) as unknown as Snippets | null;
            found?.insert(template);
        }

        /** The selected text's start and end offsets, the whole text for none. */
        const stretch = (): { from: number; to: number } => {
            const selection = editor.getSelection();
            if (selection === null) return { from: 0, to: 0 };
            const one = offsets(selection);
            return { from: Math.min(one.anchor, one.active), to: Math.max(one.anchor, one.active) };
        };

        /** Move the sectioning commands of the selection, or of the caret's line when none. */
        function shift(delta: -1 | 1): void {
            const text = model.getValue();
            let { from, to } = stretch();
            if (from === to) {
                const line = model.getPositionAt(from).lineNumber;
                from = model.getOffsetAt({ lineNumber: line, column: 1 });
                to = model.getOffsetAt({ lineNumber: line, column: model.getLineMaxColumn(line) });
            }
            const edits = shiftSections(text, from, to, delta);
            apply({ edits });
        }

        const commands: LatexCommands = {
            navigate: () => {
                const target = navigateTo(model.getValue(), caret());
                if (target !== null)
                    apply({ edits: [], select: [{ anchor: target, active: target }] });
            },
            selectEnvironment: () => apply(selectEnclosing(model.getValue(), caret(), 'whole')),
            selectContent: () => apply(selectEnclosing(model.getValue(), caret(), 'content')),
            selectName: () => apply(onEnvironmentName(model.getValue(), caret(), 'select')),
            cursorsInName: () => apply(onEnvironmentName(model.getValue(), caret(), 'cursors')),
            toggleEquation: () => apply(onEnvironmentName(model.getValue(), caret(), 'toggle')),
            closeEnvironment: () => apply(closeEnvironment(model.getValue(), caret())),
            wrapEnvironment: () =>
                snippet('\n\\\\begin{$1}\n\t${0:${TM_SELECTED_TEXT}}\n\\\\end{$1}'),
            surround: () => snippet('\\\\${1:command}{${TM_SELECTED_TEXT}}'),
            item: () => snippet('\n\\\\item '),
            keyword: (name) =>
                apply(
                    toggleKeyword(
                        model.getValue(),
                        editor.getSelections()?.map(offsets) ?? [],
                        name
                    )
                ),
            promote: () => shift(-1),
            demote: () => shift(1),
            selectSection: () => {
                const { from, to } = stretch();
                const found = sectionAt(model.getValue(), from, to);
                if (found !== null) {
                    apply({ edits: [], select: [{ anchor: found.start, active: found.end }] });
                }
            }
        };

        const text = (): string => model.getValue();
        const free =
            'editorTextFocus && !editorReadonly && !suggestWidgetVisible && !inSnippetMode';
        const actions = [
            editor.addAction({
                id: 'oculus.latex.enter',
                label: 'LaTeX: Enter',
                precondition: free,
                keybindings: [monaco.KeyCode.Enter],
                run: () => {
                    const selections = editor.getSelections() ?? [];
                    const carets = selections.map((one) => offsets(one).active);
                    const plain = selections.every((one) => one.isEmpty());
                    const change = plain ? enterOnItem(text(), carets) : null;
                    if (change === null) {
                        editor.trigger('keyboard', 'type', { text: '\n' });
                    } else {
                        apply(change);
                    }
                }
            }),
            editor.addAction({
                id: 'oculus.latex.enter_plain',
                label: 'LaTeX: Insert Line After',
                precondition: free,
                keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.Enter],
                run: () => {
                    editor.trigger('keyboard', 'editor.action.insertLineAfter', null);
                }
            })
        ];

        const language = model.getLanguageId();
        const providers = [
            monaco.languages.registerCompletionItemProvider(language, {
                triggerCharacters: ['@'],
                provideCompletionItems: (asked, at) => {
                    if (asked !== model) return { suggestions: [] };
                    const before = asked.getLineContent(at.lineNumber).slice(0, at.column - 1);
                    const typed = /@\S*$/.exec(before)?.[0] ?? '';
                    if (typed === '') return { suggestions: [] };
                    const range = new monaco.Range(
                        at.lineNumber,
                        at.column - typed.length,
                        at.lineNumber,
                        at.column
                    );
                    return {
                        suggestions: deps.at.map((one) => ({
                            label: one.prefix,
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            detail: one.description,
                            filterText: one.prefix,
                            insertText: one.body,
                            insertTextRules:
                                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            range
                        }))
                    };
                }
            }),
            monaco.languages.registerSelectionRangeProvider(language, {
                provideSelectionRanges: async (asked, positions) => {
                    if (asked !== model) return [];
                    const whole = asked.getValue();
                    const tree = await deps.parse(whole);
                    if (tree === null) return [];
                    return positions.map((at) => {
                        const found = rangesAt(tree, asked.getOffsetAt(at), whole.length);
                        return found.map((one) => ({
                            range: monaco.Range.fromPositions(
                                asked.getPositionAt(one.start),
                                asked.getPositionAt(one.end)
                            )
                        }));
                    });
                }
            })
        ];

        deps.ready(commands);
        return () => {
            deps.ready(null);
            for (const one of [...actions, ...providers]) one.dispose();
        };
    };
}
