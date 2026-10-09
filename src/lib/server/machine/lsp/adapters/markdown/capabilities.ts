// Layer 2, server. The capabilities the page is told the Markdown server has for a language: every
// provider of the server that VS Code's Markdown support uses, each with the selector of the
// language. The registry passes how a provider is declared for a language (`serving`) and the
// incremental synchronisation kind, so this file imports nothing from the registry.

/** How the registry declares a provider for one language. */
type Serving = (language: string, options?: Record<string, unknown>) => Record<string, unknown>;

/** The characters Markdown completes after: a path after `](` or `<`, a heading after `#`. */
const TRIGGERS = ['.', '/', '#', '(', '[', '<'];

/** The capabilities of the Markdown server for one language. */
export function markdownCapabilities(
    language: string,
    serving: Serving,
    incremental: number
): Record<string, unknown> {
    return {
        textDocumentSync: incremental,
        hoverProvider: serving(language),
        completionProvider: serving(language, { triggerCharacters: TRIGGERS }),
        definitionProvider: serving(language),
        referencesProvider: serving(language),
        renameProvider: serving(language, { prepareProvider: true }),
        documentSymbolProvider: serving(language),
        workspaceSymbolProvider: serving(language),
        foldingRangeProvider: serving(language),
        selectionRangeProvider: serving(language),
        codeActionProvider: serving(language, {
            codeActionKinds: ['quickfix', 'refactor', 'source.organizeLinkDefinitions'],
            resolveProvider: true
        }),
        documentLinkProvider: serving(language, { resolveProvider: true })
    };
}
