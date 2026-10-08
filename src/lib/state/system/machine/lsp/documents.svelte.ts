// Layer 2, client state. What the language servers say about the files a page holds open: each
// file's diagnostics, which the Outline reads for the file it shows and the problems store
// (problems.svelte.ts) reads for every file, and each source tab's document symbols, which the
// Outline, Go to Symbol, sticky scroll and the breadcrumb read.
//
// A file's diagnostics are kept by root key and path and by the language of the client that
// handed them over, so the client of `c` and the client of `cpp` each replace their own list and
// never the other's. A client that ends hands over an empty list, which takes the file's entry
// away. A library file, which belongs to no root, is kept under an empty root and its address as
// the path, with the file's name beside it. The symbols of a tab are kept by its instance id: the
// tree, `loading` while the first answer is asked for, or `none` when the server has none to give.

import { untrack } from 'svelte';
import type { Diagnostic, DocumentSymbol } from 'vscode-languageserver-protocol';

/** The answer for one tab's symbols: the tree, a request in flight, or none to give. */
type DocumentSymbols = readonly DocumentSymbol[] | 'loading' | 'none';

/** A file's diagnostics with the severities counted. */
type ProblemCounts = { errors: number; warnings: number; others: number };

/** The diagnostics one language's client holds for one file; `library` names it when it is one. */
export type FileDiagnostics = {
    root: string;
    path: string;
    language: string;
    library?: string;
    items: readonly Diagnostic[];
};

export type DocumentsStore = {
    /**
     * Replace the diagnostics a language's client holds for a file; an empty list removes them. A
     * library file passes an empty root, its address as the path and its name as `library`.
     */
    setDiagnostics: (
        root: string,
        path: string,
        language: string,
        items: readonly Diagnostic[],
        library?: string
    ) => void;
    /** Every file with diagnostics, one entry per language that holds some for it. */
    listDiagnostics: () => FileDiagnostics[];
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
        /** The name of each library file that holds diagnostics, by the file's key. */
        libraries: Record<string, string>;
        symbols: Record<string, DocumentSymbols>;
    } = $state({ diagnostics: {}, libraries: {}, symbols: {} });

    function setDiagnostics(
        root: string,
        path: string,
        language: string,
        items: readonly Diagnostic[],
        library?: string
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
        const gone = Object.keys(lists).length === 0;
        held.diagnostics = gone ? rest : { ...rest, [key]: lists };
        const others = Object.fromEntries(
            Object.entries(untrack(() => held.libraries)).filter(([one]) => one !== key)
        );
        if (!gone && library !== undefined) held.libraries = { ...others, [key]: library };
        else if (gone && Object.hasOwn(held.libraries, key)) held.libraries = others;
    }

    function listDiagnostics(): FileDiagnostics[] {
        return Object.entries(held.diagnostics).flatMap(([key, lists]) => {
            const [root, path] = JSON.parse(key) as [string, string];
            const library = Object.hasOwn(held.libraries, key) ? held.libraries[key] : undefined;
            return Object.entries(lists).map(([language, items]) => ({
                root,
                path,
                language,
                ...(library === undefined ? {} : { library }),
                items
            }));
        });
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
        listDiagnostics,
        diagnosticsOf,
        countsOf,
        setSymbols,
        symbolsOf: (instance) => held.symbols[instance] ?? null,
        forgetSymbols
    };
}
