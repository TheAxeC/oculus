// Layer 2, client state. What clangd answered a source tab for its two extensions, which the Files
// view draws as the sections AST and Memory Usage while the tab holds an answer: the AST of the
// selection (`textDocument/ast`) and the memory usage of the server (`$/memoryUsage`). Each is kept
// by the source tab's instance and is not saved: a reload draws neither.

import { untrack } from 'svelte';
import type { AstNode, MemoryTree } from './clangd.ts';

/** What the Files view's AST section draws: the tree, or why there is none. */
type AstAnswer = { node: AstNode | null; message: string };

/** What the Memory Usage section draws: the tree of the last answer. */
type MemoryAnswer = { tree: MemoryTree };

export type ClangdStore = {
    ast: (instance: string) => AstAnswer | null;
    setAst: (instance: string, answer: AstAnswer) => void;
    closeAst: (instance: string) => void;
    memory: (instance: string) => MemoryAnswer | null;
    setMemory: (instance: string, answer: MemoryAnswer) => void;
    closeMemory: (instance: string) => void;
};

export function createClangd(): ClangdStore {
    const held: { asts: Record<string, AstAnswer>; memories: Record<string, MemoryAnswer> } =
        $state({ asts: {}, memories: {} });

    function without<T>(record: Record<string, T>, instance: string): Record<string, T> {
        return Object.fromEntries(Object.entries(record).filter(([key]) => key !== instance));
    }

    return {
        ast: (instance) => held.asts[instance] ?? null,
        setAst: (instance, answer) => {
            held.asts = { ...untrack(() => held.asts), [instance]: answer };
        },
        closeAst: (instance) => {
            held.asts = without(
                untrack(() => held.asts),
                instance
            );
        },
        memory: (instance) => held.memories[instance] ?? null,
        setMemory: (instance, answer) => {
            held.memories = { ...untrack(() => held.memories), [instance]: answer };
        },
        closeMemory: (instance) => {
            held.memories = without(
                untrack(() => held.memories),
                instance
            );
        }
    };
}
