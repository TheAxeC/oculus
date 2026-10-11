// Layer 1, data. The when clauses of an app's contributions (`when` of a menu entry, key or view,
// `enablement` of a command): VS Code's grammar, read by monaco-editor's `ContextKeyExpr` so that
// no parser or evaluator of it is written here. The manifest reader refuses a clause that does not
// parse; the page evaluates a clause against the context keys it holds (state/system/apps/shell/
// context.ts).

import {
    ContextKeyExpr,
    type ContextKeyExpression,
    type IContext
} from 'monaco-editor/platform/contextkey/common/contextkey';

export type { IContext };

/** A parsed clause. */
export type When = ContextKeyExpression;

/** The clause a text spells, or undefined when the text is not a clause. */
export function parseWhen(text: string): When | undefined {
    return ContextKeyExpr.deserialize(text);
}

/**
 * Whether a clause holds in a context. An empty clause holds, and so does a clause that does not
 * parse: the manifest reader refuses such an app, so a clause here is one it passed.
 */
export function whenHolds(text: string, context: IContext): boolean {
    if (text === '') return true;
    return parseWhen(text)?.evaluate(context) ?? true;
}

/** Whether a clause names the context key, in any of its terms. */
export function mentions(text: string, key: string): boolean {
    if (text === '') return false;
    return parseWhen(text)?.keys().includes(key) ?? false;
}
