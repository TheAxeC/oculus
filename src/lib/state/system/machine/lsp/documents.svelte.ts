// Layer 2, client state. What the language servers say about the files a page holds open: each
// file's diagnostics, which the Outline reads now and the Problems view and the Explorer's
// decorations read later, and each source tab's document symbols, which the Outline, Go to
// Symbol, sticky scroll and the breadcrumb read.
//
// A file's diagnostics are kept by root key and path and by the language of the client that
// handed them over, so the client of `c` and the client of `cpp` each replace their own list and
// never the other's. A client that ends hands over an empty list, which takes the file's entry
// away. The symbols of a tab are kept by its instance id: the tree, `loading` while the first
// answer is asked for, or `none` when the server has none to give.

import { untrack } from 'svelte';
import type { Diagnostic, DocumentSymbol } from 'vscode-languageserver-protocol';

/** The answer for one tab's symbols: the tree, a request in flight, or none to give. */
type DocumentSymbols = readonly DocumentSymbol[] | 'loading' | 'none';

/** A file's diagnostics with the severities counted. */
type ProblemCounts = { errors: number; warnings: number; others: number };

export type DocumentsStore = {
    /** Replace the diagnostics a language's client holds for a file; an empty list removes them. */
    setDiagnostics: (
        root: string,
        path: string,
        language: string,
        items: readonly Diagnostic[]
    ) => void;
    /** Every diagnostic of a file, over the languages that hold any. */
    diagnosticsOf: (root: string, path: string) => readonly Diagnostic[];
    /** The errors, warnings and other diagnostics of a file. */
    countsOf: (root: string, path: string) => ProblemCounts;
    /** Replace one tab's symbols. */
    setSymbols: (instance: string, answer: DocumentSymbols) => void;
    /** The symbols of one tab, or null for a tab that has none to say. */
    symbolsOf: (instance: string) => DocumentSymbols | null;
    /** Take a tab's symbols away. */
    forgetSymbols: (instance: string) => void;
};

/** The key of a file. */
function fileKey(root: string, path: string): string {
    return JSON.stringify([root, path]);
}

export function createDocuments(): DocumentsStore {
    const held: {
        diagnostics: Record<string, Record<string, readonly Diagnostic[]>>;
        symbols: Record<string, DocumentSymbols>;
    } = $state({ diagnostics: {}, symbols: {} });

    function setDiagnostics(
        root: string,
        path: string,
        language: string,
        items: readonly Diagnostic[]
    ): void {
        const key = fileKey(root, path);
        // A client hands diagnostics over from inside an effect of the editor that registered it,
        // so the record is read untracked: an effect that read what it writes would run again.
        const { [key]: before, ...rest } = untrack(() => held.diagnostics);
        const lists = { ...before };
        if (items.length === 0) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- keyed by language
            delete lists[language];
        } else lists[language] = items;
        held.diagnostics = Object.keys(lists).length === 0 ? rest : { ...rest, [key]: lists };
    }

    function diagnosticsOf(root: string, path: string): readonly Diagnostic[] {
        return Object.values(held.diagnostics[fileKey(root, path)] ?? {}).flat();
    }

    function countsOf(root: string, path: string): ProblemCounts {
        const counts = { errors: 0, warnings: 0, others: 0 };
        for (const item of diagnosticsOf(root, path)) {
            if (item.severity === undefined || item.severity === 1) counts.errors += 1;
            else if (item.severity === 2) counts.warnings += 1;
            else counts.others += 1;
        }
        return counts;
    }

    function setSymbols(instance: string, answer: DocumentSymbols): void {
        held.symbols[instance] = answer;
    }

    function forgetSymbols(instance: string): void {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- keyed by instance id
        delete held.symbols[instance];
    }

    return {
        setDiagnostics,
        diagnosticsOf,
        countsOf,
        setSymbols,
        symbolsOf: (instance) => held.symbols[instance] ?? null,
        forgetSymbols
    };
}
