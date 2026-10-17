// Layer 3, shared view partial of lsp.ts beside it. What a language server answers for Show Call
// Hierarchy and Show Type Hierarchy, in the two steps the protocol has: the items at the caret
// (`textDocument/prepareCallHierarchy`, `prepareTypeHierarchy`), then the items one level from an
// item in a direction (`callHierarchy/incomingCalls` and `outgoingCalls`,
// `typeHierarchy/supertypes` and `subtypes`). The References view draws them as a tree
// (state/system/machine/lsp/hierarchy.ts) and opens one node at a time. The relay routes the second
// step by the file the item names.
//
// An incoming call is an entry whose item is the caller and whose ranges are the calls in the
// caller; an outgoing call is an entry whose item is the callee and whose ranges are the calls in
// the item asked about, so a press on it opens the callee's own symbol, which is an entry with no
// range.

import type { HierarchyDirection, HierarchyEntry } from '$lib/state/system/machine/lsp/hierarchy';
import type { LspHandle } from '$lib/ui/controls/editor/kit/lsp/client';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function listOf(answer: unknown): unknown[] {
    return Array.isArray(answer) ? (answer as unknown[]) : [];
}

/** The method that asks for one direction of a hierarchy. */
const METHOD: Record<HierarchyDirection, string> = {
    incoming: 'callHierarchy/incomingCalls',
    outgoing: 'callHierarchy/outgoingCalls',
    supertypes: 'typeHierarchy/supertypes',
    subtypes: 'typeHierarchy/subtypes'
};

/** The items at a position: the symbols of the call or the type hierarchy the caret is on. */
export async function hierarchyRoots(
    handle: LspHandle,
    direction: HierarchyDirection,
    position: { line: number; character: number }
): Promise<HierarchyEntry[]> {
    const calls = direction === 'incoming' || direction === 'outgoing';
    const answer = await handle.ask(
        calls ? 'textDocument/prepareCallHierarchy' : 'textDocument/prepareTypeHierarchy',
        { position }
    );
    return listOf(answer).map((item) => ({ item, ranges: [] }));
}

/** The entries one level from an item, in a direction. */
export async function hierarchyBelow(
    handle: LspHandle,
    direction: HierarchyDirection,
    item: unknown
): Promise<HierarchyEntry[]> {
    const answer = listOf(await handle.ask(METHOD[direction], { item }));
    if (direction === 'supertypes' || direction === 'subtypes') {
        return answer.map((one) => ({ item: one, ranges: [] }));
    }
    const side = direction === 'incoming' ? 'from' : 'to';
    return answer.flatMap((call) => {
        if (!isRecord(call)) return [];
        // The ranges of an outgoing call are in the item asked about, so they are not where the
        // callee is and a press opens the callee's own symbol.
        const ranges = direction === 'incoming' ? listOf(call.fromRanges) : [];
        return [{ item: call[side], ranges }];
    });
}
