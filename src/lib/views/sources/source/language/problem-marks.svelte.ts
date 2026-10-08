// Layer 3, view partial of Source.svelte. The rows of the problems store that no extension of its
// own draws for this file, drawn as markers in its editor: the errors and warnings a project
// command printed, under the one owner every command shares, and each linter's findings, under the
// linter's owner (`lint-<id>`). The rows are the problems store's
// (state/system/problems.svelte.ts), so a run that ends or a file that is saved changes the markers
// without the extension being made again: it keeps its own effect for as long as the editor holds
// it and clears its markers when it ends. One `setModelMarkers` call is made per owner, so one
// owner never clears another's.
//
// A row that names an end is drawn over exactly that range, even across lines. A row that names a
// column and no end marks the word at it, and a row that names none marks the line from its first
// character to its end. A code that has a documentation page is drawn as a link, as a language
// server's is.
//
// The same extension holds the file in the lint store (state/system/machine/lint/lint.svelte.ts)
// for as long as the editor exists, and tells it when the tab's text is read again from disk, so
// the linters run on a file the reader opens and on one that changes under a clean tab.

import { untrack } from 'svelte';
import type * as Monaco from 'monaco-editor';
import { LINT_IDS, webAddress } from '$lib/state/system/machine/lint/lint-model';
import type { ClientState } from '$lib/state/client/context';
import { COMMAND_OWNER, lintOwner } from '$lib/state/system/problem-sources';
import { problemKey, type Problem } from '$lib/state/system/problems.svelte';
import type { EditorExtension } from '$lib/ui/controls/editor/types';

/** The owners this extension draws: the commands' and each linter's. */
const OWNERS = [COMMAND_OWNER, ...LINT_IDS.map(lintOwner)];

/** A number held between the lowest and the highest. */
function between(value: number, low: number, high: number): number {
    return Math.min(Math.max(value, low), high);
}

/** The range a row is drawn over in the model. */
export function rowRange(
    model: Monaco.editor.ITextModel,
    row: Problem
): { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number } {
    const lines = model.getLineCount();
    const line = between(row.line, 1, lines);
    const max = model.getLineMaxColumn(line);
    const start =
        row.column > 0
            ? Math.min(row.column, max)
            : model.getLineFirstNonWhitespaceColumn(line) || 1;
    const word =
        row.column > 0 ? model.getWordAtPosition({ lineNumber: line, column: start }) : null;
    const endLine = row.endLine > 0 ? between(row.endLine, line, lines) : line;
    const endMax = model.getLineMaxColumn(endLine);
    const named = row.endLine > 0 ? between(row.endColumn, 1, endMax) : 0;
    const exact = endLine > line || named > start;
    const fallback = row.column > 0 ? Math.max(word?.endColumn ?? start + 1, start + 1) : max;
    return {
        startLineNumber: line,
        startColumn: start,
        endLineNumber: exact ? endLine : line,
        endColumn: exact ? named : fallback
    };
}

/** One row as a marker of the model. */
function markerOf(
    monaco: typeof Monaco,
    model: Monaco.editor.ITextModel,
    row: Problem
): Monaco.editor.IMarkerData {
    const severity = {
        error: monaco.MarkerSeverity.Error,
        warning: monaco.MarkerSeverity.Warning,
        info: monaco.MarkerSeverity.Info
    }[row.severity];
    const address = webAddress(row.href);
    return {
        severity,
        message: row.message,
        source: row.source,
        ...(row.code === undefined
            ? {}
            : {
                  code:
                      address === null
                          ? row.code
                          : { value: row.code, target: monaco.Uri.parse(address) }
              }),
        ...rowRange(model, row)
    };
}

/** The extension that keeps one file's markers, and holds the file in the lint store. */
export function problemMarks(
    client: ClientState,
    instance: string,
    file: { root: string; path: string }
): EditorExtension {
    return (kit, _editor, model) => {
        const { monaco } = kit;
        const draftState = () => {
            const draft = client.source.sourceDraft(instance);
            return {
                clean:
                    draft.loaded &&
                    draft.text === draft.saved &&
                    !draft.truncated &&
                    !draft.notText,
                base: draft.base
            };
        };
        untrack(() => client.lint.hold(file.root, file.path, draftState()));
        const stop = $effect.root(() => {
            $effect(() => {
                const commandKey = problemKey(file.root, file.path);
                const linted = client.lint.keyOf(file.root, file.path);
                const lintKey = linted === null ? commandKey : problemKey(linted.root, linted.path);
                const files = client.problems.fold().files;
                for (const owner of OWNERS) {
                    const key = owner === COMMAND_OWNER ? commandKey : lintKey;
                    const rows = (files.find((one) => one.key === key)?.rows ?? []).filter(
                        (row) => row.owner === owner
                    );
                    monaco.editor.setModelMarkers(
                        model,
                        owner,
                        rows.map((row) => markerOf(monaco, model, row))
                    );
                }
            });
            $effect(() => {
                const state = draftState();
                untrack(() => client.lint.reloaded(file.root, file.path, state));
            });
        });
        return () => {
            stop();
            client.lint.release(file.root, file.path);
            for (const owner of OWNERS) monaco.editor.setModelMarkers(model, owner, []);
        };
    };
}
