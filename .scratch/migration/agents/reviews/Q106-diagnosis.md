# Diagnosis: Close pane on a pane of two tabs leaves the pane after Confirm

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. A diagnosis of the same step later is appended below under its own heading, which names its finding.

This record was opened by the orchestrating session and is handed, under Axel's ruling Z108 (b), to a diagnosis agent that finishes it. The sections below hold what the session observed; the agent continues from "Hypotheses" and fills every section the template leaves.

## Symptom

"Seen twice: the pane menu's "Close pane" on a pane holding the diff and the source of `tools/figures/gen_figures.py`, then Confirm on "Close this pane and the 2 tabs in it?", left the pane and both tabs; the same item on a pane of one tab, which asks nothing, closed it at once." (Z98, state file closed log.)

## Where the probes run

The session's probes ran in two places, both now cleaned up (the scratch copy removed, the TEST tab reloaded):

- A scratch copy, a detached worktree of main at e8f4c010 under `$TMPDIR`, with one unit probe `tests/diag/q106.test.ts` (below). Paths redirected: none.
- The TEST page in Chrome (tab 812136209, localhost:8790), with `Storage.prototype.setItem` wrapped in the page to record every write of the layout key with its value and its call stack (tag DIAG-7c1e).

The agent makes its own scratch copy, as the skill's Steps 3 says.

## Red observations so far (browser, TEST page)

The case: a pane on TEST holding History and Slides (Slides active), its pane menu, "Close pane", then Confirm. Seen red three times in a row: the pane closes and comes back.

Two layout writes follow the Confirm, recorded by the wrapper:

1. The first write holds TEST's tree without the pane (no `slides` in it). Stack: `savePages (layout.svelte.ts)` <- `apply` <- `closePane (layout/instances.ts)` <- `PaneView.svelte` (the `askAndClose` callback) <- `confirmed (PaneView.svelte)` <- `Confirm.svelte:93` (the yes button's click).
2. The second write holds TEST's tree with the pane back, `history,slides` at the same place. Stack: `savePages` <- `apply` <- `change (layout.svelte.ts)` <- `activateInstance (layout/instances.ts)` <- `entered (PaneView.svelte, onfocusin)` <- `focusQuietly (ui/frame/quiet-focus.ts:16)` <- `Modal.svelte:164` (the dialog giving focus back when it is torn down) <- `execute_effect_teardown` <- `destroy_effect` ... <- `pause_effect` <- `BranchManager.ensure` <- `update_branch` <- `Batch.flush` (Svelte runtime, a microtask after the click).

So the Modal gives focus back to the closed pane's "Pane" menu button, still in the DOM while its effects are torn down; that focus fires the closed pane's `entered`, whose `activateInstance(active, page)` writes the layout with the pane in it. Blocking that focusin in the page (a capture listener) kept the pane closed.

Only the TEST page changed between the two writes; the page current (`e00927`) stayed the same.

## Unit probe (scratch copy), green

```ts
// DIAG-7c1e scratch red command for Q106.
client.layout.apply(bench(split('row', [0.5, 0.5], [pane(['a', 'b']), pane(['c'])])));
client.layout.closePane([0]);
client.layout.activateInstance('b');
expect(ids()).not.toMatch(/"b"/);
```

It passes: in a plain call sequence, `activateInstance` after `closePane` keeps the pane closed, as the code reads (`activateInstance`, `layout/instances.ts:131-137`: `holding(id)` is null for a closed tab, so it falls to `at(page)`, and `activate` (`layout/tree.ts:231-237`) returns the tree unchanged when the id is not found; `change`, `layout.svelte.ts:451-454`, reads `workbench(page)` from `store.current`, which `savePages` set at the first write).

## Open question the agent starts from

Why the second write carries the old tree, when a plain sequence does not: the read of `store.current` inside `entered`, run synchronously from an effect teardown during `Batch.flush`, gives the tree from before the close. Leads, none probed yet:

- Svelte 5.57.1's batches: `Batch.apply` (`node_modules/svelte/src/internal/client/reactivity/batch.js:931-977`) gives reads inside a batch's processing the values of that batch and undoes other batches' changes, but only when `async_mode_flag` is on; `vite.config.ts` names no `async` compiler option, which was read and not probed in the page.
- `page` inside `entered`: the prop defaults to `currentPage().id` (`PaneView.svelte:118`); whether it names TEST or another page at that moment was not logged.
- `active` and `activePane` inside the torn-down PaneView: `$derived` values read during teardown may be the pane's old ones.

Candidate fixes, to be judged only after the cause stands: `entered` does nothing for a pane its page no longer holds; the Modal does not give focus to a control inside a removed subtree; `change` or `activateInstance` does nothing when the instance is gone.
