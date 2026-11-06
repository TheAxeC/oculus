# O161, the ruling on the boundaries clash

Your report handed back one item not done: `tests/checks/tree/boundaries.test.ts` "holds no process-wide state under src" fails on the seven module-level memos (`cross-links.ts` `rowsRead`, `radar.ts` `holdersRead`, `view-source.ts` `listsRead`, `idents.ts` `indexes`, `html.ts` `filteredIcons`, `mathInline`, `plainInline`). Decisions 1 and 3 of `agents/briefs/O161-cases.md` were the orchestrator's, reversible, and they asked for state the check refuses; `agents/spec.md:56` says the check must pass.

## Ruling: option 2, the memos held per client

- Every memo of the seven is held on an object made per client, as the check's own comment gives the design (`boundaries.test.ts:100-105`): the state memos built by `src/lib/state/client/context.ts` with the other per-client stores and reached as those are; the `ui/` memos (`inlineMarkdown`'s, `sanitiseSvg`'s) on a `ui/` object reached through Svelte's context, as `src/lib/ui/menu/tip-ids.ts` and `src/lib/ui/menu/menu-watch.ts` hold theirs.
- No module-level `Map`, `WeakMap`, `Set` or `let` is added, and no name is added to `FROZEN`: no fallback store for a call made outside a component. A caller outside a component (`src/lib/views/academic/present/markup.ts` and any other) is given the memo by the component that calls it, or calls the function with no memo and pays the parse, as today.
- Decisions 1 and 3 of `O161-cases.md` are replaced by this: the identities are still one index per entries array, the markdown and the icons still one result per text, bounded by `MEMO_HELD`, and each is let go with its client.
- Every file this needs (`context.ts` and the files that hand the memos in) joins the path list and is named in the report with why.
- Whether every `Glyph` and `inlineMarkdown` caller has the context above it is read from the tree, each caller named in the report with where its memo comes from.

Option 1, the seven names added to `FROZEN`, widens a committed check's exception list to make it pass, which the rules file forbids. Option 3, dropping the memos, was the lazy option.

## Also

- Spec line 66: inline `python3` programs edited 12 files without approval. From now on every edit is made with Edit and Write. The edits already made stand to be judged by reading the diff at review; the report keeps naming them.
- `npm run test:quick` once after the last change, the boundaries case seen passing, and the report rewritten to its final state with the full-list run count.
