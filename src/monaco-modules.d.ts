// Layer 2, types. monaco-editor ships declarations for its public entry alone, and the tree reads
// some of its internal modules through the package's `./*` export: the when-clause grammar of
// `ContextKeyExpr` and the key names of `KeyCodeUtils`, which the app contributions read; the
// `ContextViewService`, which the editor kit extends to draw every context view in the page's node;
// the diff editor's ranges and its own diff provider, through which
// ui/controls/editor/diff/git-provider.ts draws git's line changes and kit/load.ts makes Monaco's
// own provider for every other diff; and the diff editor's character diff, which the worker
// diff/inner-changes.worker.ts runs inside git's changes. Each subpath is declared here as the part
// of it that the tree uses.

declare module 'monaco-editor/platform/contextkey/common/contextkey' {
    /**
     * What a when clause is evaluated against: the value of a context key, undefined when unset.
     */
    export type IContext = {
        getValue: (key: string) => unknown;
    };

    /** A parsed when clause. */
    export type ContextKeyExpression = {
        evaluate: (context: IContext) => boolean;
        /** The clause written back as text. */
        serialize: () => string;
        /** The context keys the clause reads. */
        keys: () => string[];
    };

    export const ContextKeyExpr: {
        /** The clause a text spells, or undefined when the text is not a clause. */
        deserialize(serialized: string | null | undefined): ContextKeyExpression | undefined;
    };
}

declare module 'monaco-editor/base/common/keyCodes' {
    export const KeyCodeUtils: {
        /** The key code a name in the key-binding syntax stands for, 0 for a name that is none. */
        fromUserSettings(key: string): number;
        /** The name of a key code. */
        toString(code: number): string;
    };
}

declare module 'monaco-editor/platform/contextview/browser/contextViewService' {
    /**
     * Monaco's context view service, the part of it that the editor kit extends: it draws a context
     * view (a menu, the code action list) in a container and answers what it drew.
     */
    export class ContextViewService {
        /** The layout service answers the containers the views are drawn in. */
        constructor(layoutService: object);
        showContextView(
            delegate: object,
            container?: HTMLElement,
            shadowRoot?: boolean,
            useWindowContainerForShadowRoot?: boolean
        ): { close(): void };
        hideContextView(data?: unknown): void;
    }
}

declare module 'monaco-editor/editor/common/core/ranges/offsetRange' {
    /** A run of positions of a sequence, from `start` to the position before `endExclusive`. */
    export class OffsetRange {
        constructor(start: number, endExclusive: number);
        readonly start: number;
        readonly endExclusive: number;
    }
}

declare module 'monaco-editor/editor/common/core/ranges/lineRange' {
    /** A run of lines, from `startLineNumber` to the line before `endLineNumberExclusive`. */
    export class LineRange {
        constructor(startLineNumber: number, endLineNumberExclusive: number);
        readonly startLineNumber: number;
        readonly endLineNumberExclusive: number;
        readonly isEmpty: boolean;
    }
}

declare module 'monaco-editor/editor/common/core/range' {
    /** A range of characters of a model, the class the public entry exports as `Range`. */
    export { Range } from 'monaco-editor';
}

declare module 'monaco-editor/editor/common/diff/rangeMapping' {
    import type { LineRange } from 'monaco-editor/editor/common/core/ranges/lineRange';
    import type { Range } from 'monaco-editor/editor/common/core/range';

    /** A changed range of characters of the original side and the range it became. */
    export class RangeMapping {
        constructor(originalRange: Range, modifiedRange: Range);
        readonly originalRange: Range;
        readonly modifiedRange: Range;
    }

    /** One change of a diff: its two runs of lines and the changed characters inside them. */
    export class DetailedLineRangeMapping {
        constructor(
            original: LineRange,
            modified: LineRange,
            innerChanges: readonly RangeMapping[] | undefined
        );
        readonly original: LineRange;
        readonly modified: LineRange;
        readonly innerChanges: readonly RangeMapping[] | undefined;
    }
}

declare module 'monaco-editor/editor/common/diff/defaultLinesDiffComputer/algorithms/diffAlgorithm' {
    import type { OffsetRange } from 'monaco-editor/editor/common/core/ranges/offsetRange';

    /** A changed run of one sequence and the run of the other it became. */
    export class SequenceDiff {
        constructor(seq1Range: OffsetRange, seq2Range: OffsetRange);
        readonly seq1Range: OffsetRange;
        readonly seq2Range: OffsetRange;
    }

    /** No time limit on a computation. */
    export const InfiniteTimeout: { readonly instance: object };
}

declare module 'monaco-editor/editor/common/diff/defaultLinesDiffComputer/defaultLinesDiffComputer' {
    import type { SequenceDiff } from 'monaco-editor/editor/common/diff/defaultLinesDiffComputer/algorithms/diffAlgorithm';
    import type { RangeMapping } from 'monaco-editor/editor/common/diff/rangeMapping';

    /** The diff editor's own line diff, the part of it that finds the changed characters. */
    export class DefaultLinesDiffComputer {
        /** The changed characters inside one changed run of lines of the two sides. */
        refineDiff(
            originalLines: string[],
            modifiedLines: string[],
            diff: SequenceDiff,
            timeout: object,
            considerWhitespaceChanges: boolean,
            options: { extendToSubwords?: boolean }
        ): { mappings: RangeMapping[]; hitTimeout: boolean };
    }
}

declare module 'monaco-editor/platform/instantiation/common/instantiation' {
    /** The key of the service that makes Monaco's classes with the services they ask for. */
    export const IInstantiationService: object;

    /** The service that makes a class, its first arguments given and the rest services. */
    export type InstantiationService = {
        createInstance<T>(
            made: new (options: object, ...services: never[]) => T,
            options: object
        ): T;
    };
}

declare module 'monaco-editor/editor/standalone/browser/standaloneServices' {
    import type { InstantiationService } from 'monaco-editor/platform/instantiation/common/instantiation';

    /** The services of the page's editors, read after the first editor was made. */
    export const StandaloneServices: {
        get(id: object): InstantiationService;
    };
}

declare module 'monaco-editor/editor/browser/widget/diffEditor/diffProviderFactoryService' {
    import type * as Monaco from 'monaco-editor';
    import type { DetailedLineRangeMapping } from 'monaco-editor/editor/common/diff/rangeMapping';

    /** Monaco's own diff provider, which computes a diff in the editor worker. */
    export class WorkerBasedDocumentDiffProvider {
        constructor(options: object, ...services: never[]);
        onDidChange(listener: () => void): Monaco.IDisposable;
        computeDiff(
            original: Monaco.editor.ITextModel,
            modified: Monaco.editor.ITextModel,
            options: {
                ignoreTrimWhitespace: boolean;
                maxComputationTimeMs: number;
                computeMoves: boolean;
            },
            token: unknown
        ): Promise<{
            identical: boolean;
            quitEarly: boolean;
            changes: readonly DetailedLineRangeMapping[];
            moves: readonly unknown[];
        }>;
        dispose(): void;
    }
}
