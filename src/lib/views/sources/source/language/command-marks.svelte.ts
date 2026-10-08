// Layer 3, view partial of Source.svelte. The errors and warnings a project command printed for
// this file, drawn as markers in its editor under the one owner every command shares. The rows are
// the problems store's (state/system/problems.svelte.ts), so a run that ends or a file that is
// saved changes the markers without the extension being made again: it keeps its own effect for as
// long as the editor holds it and clears its markers when it ends.
//
// A row that names a column marks the word at it, and a row that names none marks the line from
// its first character to its end.

import type * as Monaco from 'monaco-editor';
import type { ClientState } from '$lib/state/client/context';
import { COMMAND_OWNER } from '$lib/state/system/problem-sources';
import { problemKey, type Problem } from '$lib/state/system/problems.svelte';
import type { EditorExtension } from '$lib/ui/controls/editor/types';

/** One row as a marker of the model. */
function markerOf(
    monaco: typeof Monaco,
    model: Monaco.editor.ITextModel,
    row: Problem
): Monaco.editor.IMarkerData {
    const line = Math.min(Math.max(1, row.line), model.getLineCount());
    const max = model.getLineMaxColumn(line);
    const start =
        row.column > 0
            ? Math.min(row.column, max)
            : model.getLineFirstNonWhitespaceColumn(line) || 1;
    const word =
        row.column > 0 ? model.getWordAtPosition({ lineNumber: line, column: start }) : null;
    return {
        severity:
            row.severity === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
        message: row.message,
        source: row.source,
        startLineNumber: line,
        startColumn: start,
        endLineNumber: line,
        endColumn: row.column > 0 ? Math.max(word?.endColumn ?? start + 1, start + 1) : max
    };
}

/** The extension that keeps one file's command markers. */
export function commandMarks(
    client: ClientState,
    file: { root: string; path: string }
): EditorExtension {
    const key = problemKey(file.root, file.path);
    return (kit, _editor, model) => {
        const { monaco } = kit;
        const stop = $effect.root(() => {
            $effect(() => {
                const held = client.problems.fold().files.find((one) => one.key === key);
                const rows = (held?.rows ?? []).filter((row) => row.owner === COMMAND_OWNER);
                monaco.editor.setModelMarkers(
                    model,
                    COMMAND_OWNER,
                    rows.map((row) => markerOf(monaco, model, row))
                );
            });
        });
        return () => {
            stop();
            monaco.editor.setModelMarkers(model, COMMAND_OWNER, []);
        };
    };
}
