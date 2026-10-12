// Layer 2, types. monaco-editor ships declarations for its public entry alone, and the tree reads
// three of its internal modules through the package's `./*` export: the when-clause grammar of
// `ContextKeyExpr` and the key names of `KeyCodeUtils`, which the app contributions read, and the
// `ContextViewService`, which the editor kit extends to draw every context view in the page's node.
// Each subpath is declared here as the part of it that the tree uses.

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
