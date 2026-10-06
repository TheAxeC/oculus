// Layer 3, primitive. What a server's diagnostics and clangd's inactive regions become in an
// editor: Monaco markers under one owner per language client (`lsp-python`, `lsp-c`, `lsp-cpp`),
// so one client never clears another's and the client's own `lsp` owner stays empty, and the
// decorations that dim the regions of a C or C++ file the preprocessor leaves out.

import type * as Monaco from 'monaco-editor';
import type { LspDiagnostic } from './services';
import type { LspRange } from './transport';

/** The marker owner of one language's client. */
export function markerOwner(language: string): string {
    return `lsp-${language}`;
}

/** The marker severity of the protocol's: error, warning, information, hint. */
function severityOf(monaco: typeof Monaco, severity: number | undefined): Monaco.MarkerSeverity {
    switch (severity) {
        case 2:
            return monaco.MarkerSeverity.Warning;
        case 3:
            return monaco.MarkerSeverity.Info;
        case 4:
            return monaco.MarkerSeverity.Hint;
        default:
            return monaco.MarkerSeverity.Error;
    }
}

/** Monaco's markers for a server's diagnostics of one file. */
export function toMarkers(
    monaco: typeof Monaco,
    items: readonly LspDiagnostic[]
): Monaco.editor.IMarkerData[] {
    return items.map((item) => {
        const code =
            item.code === undefined
                ? undefined
                : item.codeDescription?.href === undefined
                  ? String(item.code)
                  : {
                        value: String(item.code),
                        target: monaco.Uri.parse(item.codeDescription.href)
                    };
        const tags: Monaco.MarkerTag[] = [];
        if (item.tags?.includes(1)) tags.push(monaco.MarkerTag.Unnecessary);
        if (item.tags?.includes(2)) tags.push(monaco.MarkerTag.Deprecated);
        return {
            severity: severityOf(monaco, item.severity),
            startLineNumber: item.range.start.line + 1,
            startColumn: item.range.start.character + 1,
            endLineNumber: item.range.end.line + 1,
            endColumn: item.range.end.character + 1,
            message: typeof item.message === 'string' ? item.message : item.message.value,
            source: item.source,
            code,
            ...(tags.length === 0 ? {} : { tags }),
            ...(item.relatedInformation === undefined
                ? {}
                : {
                      relatedInformation: item.relatedInformation.map((info) => ({
                          resource: monaco.Uri.parse(info.location.uri),
                          startLineNumber: info.location.range.start.line + 1,
                          startColumn: info.location.range.start.character + 1,
                          endLineNumber: info.location.range.end.line + 1,
                          endColumn: info.location.range.end.character + 1,
                          message: info.message
                      }))
                  })
        };
    });
}

/**
 * The decorations that dim inactive regions: Monaco's own class for unnecessary code, which draws
 * the text at the editor's `editorUnnecessaryCode.opacity`, as VS Code's clangd extension dims
 * them.
 */
export function inactiveDecorations(
    regions: readonly LspRange[]
): Monaco.editor.IModelDeltaDecoration[] {
    return regions.map((region) => ({
        range: {
            startLineNumber: region.start.line + 1,
            startColumn: region.start.character + 1,
            endLineNumber: region.end.line + 1,
            endColumn: region.end.character + 1
        },
        options: { inlineClassName: 'squiggly-inline-unnecessary' }
    }));
}
