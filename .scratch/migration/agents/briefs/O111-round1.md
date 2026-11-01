# O111, repair round 1

The findings are in `.scratch/migration/agents/reviews/O111-refuter.md`, in the worktree's copy of the ledger at this path's sibling. Every item below says what to change. The brief, `spec.md` and the ruling Z1093 in this round hold. Line numbers are the worktree's as it stands.

The paths of this step widen by `src/lib/views/system/workbench/settings/Control.svelte`, `src/lib/views/system/workbench/settings/scopes/WorkspaceRows.svelte` where item 2 needs it, and the round's report `.scratch/migration/agents/reviews/O111-round1-report.md`.

## Items

1. **A hidden row draws no picks (Spec 1).** `settings/List.svelte` passes `Item` whether the row is kept; `Item` passes it to `Control` and `Control` to `Editor`. While the row is not kept, `Editor`'s `search` is null, and `Item`'s `searched` answers false for both parts. So a row the query leaves out neither opens a fold nor mounts cards on a keystroke. A part already open stays mounted, since it was drawn before the query.

2. **`WorkspaceRows` stays mounted (Spec 2).** `Settings.svelte:456`: drawn for the Workspace scope whatever the query, and hidden while a query stands, with the `hidden` attribute on an element around it or on its root. A `query === ''` test that unmounts it goes, so a first letter and a clear mount nothing and a typed folder name in its box survives a search. `visible('[data-setting]')` and the key cursor already pass over what is hidden; read that this holds for its rows.

3. **The rail list's fold reads the list it draws (Spec 3).** `RailEditor.svelte` computes its own `searched` from the query and the rows it draws (the list being typed), with `foundInside` over the texts of those rows, and its `searched` prop goes. `Item.svelte:222` stops passing it, and `searched` there narrows to the Fields list, its comment with it. The row's kept test in `search.ts` still reads the file's value, as the brief says.

4. **An edit under a query keeps its list open (Behaviour 1).** `keptOpen` in `view/fold.ts`: under a query it holds an open press, under `searchFolds` with the query's words, for the row's entries and every nested list on the path, each only when no press is held for it yet, and it writes nothing under `folds`. Under no query it stays as it is. So an Add from 5 to 6 under a query leaves the list open and the new entry drawn. Update every comment that says an edit under a query writes no fold: `fold.ts`, `Editor.svelte`'s head, `RailEditor.svelte`'s head; each says it keeps the fold kept for an empty search as it was. `docs/HELP.md` needs no word on it.

5. **What a search draws past the cap (Behaviour 2, Behaviour 3, ruling Z1093).** Rewrite the test of one entry in `walkList` in `view/matches.ts` to this shape:

   ```ts
   const edited = walk.edited.has(entryKey(path, index));
   const found = wordFound(walk.words, ownTexts(card));
   const picked = found && walk.picked < SEARCH_DRAWN;
   if (picked) walk.picked += 1;
   let drawn = edited || picked;
   // the nested lists, as they stand
   if (found && !drawn) {
       walk.more += 1;
       capped = true;
   }
   ```

   with `capped` local to the list and the list's key set when `places.length > 0 || capped`, the function still returning `places.length > 0`. So:
   - an edited entry the query is found in takes its pick as it did before the edit, and only an entry that stopped matching is uncounted;
   - `more` counts exactly the matches not drawn, so an entry past the cap drawn for an edited child is not counted;
   - a list whose matches all fall past the cap is filtered and draws no entry, with an empty places list. Its fold keeps its kept fold: `NestedCards.svelte`'s `searched` is true only for a non-empty places list. The line under the row counts its matches.

   Update `matches.ts`'s head, the `Drawn` doc, the `NestedCards.svelte` head and `Cards.svelte`'s head to say so. A press on such a list's line shows no entry; the line under the row says how many match, and a narrower search draws them.

6. **Tests.** In `tests/state/system/settings/fold.test.ts`, in the existing tables, one row each, run first on the tree as it stands and the failure quoted:
   - a list of 5 under a query, `keptOpen` then 6 entries: unfolded, and the kept fold unwritten (table 'folds a part of a Settings row');
   - that open press, query cleared: the part as the kept fold and its count say;
   - lists of 30 and 3, all matching: 25 picks, the second list's places empty, `more` 8;
   - an edited entry past the cap's parent, the `"1.n"` case of Behaviour 2: `more` counts only what is not drawn;
   - one edited matching entry in lists of 25 and 9: the same picks as with none, `more` 9.
   Items 1, 2 and 3 are view wiring, checked at the look; no test.

7. **`Settings.svelte`'s comments (Standards 1).** `:53-55` and `:340` say what is now true: the rail row is in the rows the query keeps, and shown, rather than drawn; every row is mounted. `await tick()` in `showRail` waits for the attribute: read it and keep it if it is needed, and say which in the report.

## The report of this round

Write `.scratch/migration/agents/reviews/O111-round1-report.md`, in the shape of the first report's DONE table, and in it:

- **Proof 1.** A row of the table is DONE only when nothing is left of it; the first line says what is not done or that everything is. The limitations of the first report that this round closes are named as closed, and any left stands as NOT DONE.
- **Proof 2.** Of the fold table's rows, name which test a behaviour the change adds and which a behaviour it preserves, and for the added ones that passed on the unchanged tree why they pass there.
- **Spec 4, the ruling "Unapproved builder scripts".** List every command that changed a file by a program or a shell redirect, by name and file: the four the review found (`cat >>` and inline `python3` on the test file, inline `python3` and `cat >` heredocs on `case-run.mjs`) and any other. No such command is used in this round: every file is changed with the Edit or Write tool, a case-run program included.

## Rules of the round

Run the test file while you work and `npm run test:quick -- --base e9e8cdd7e` once, after the last change. `npm run diagrams` once if an import between layers changes. Run no page and no app. No git command that changes state. No breakage testing. A shortcut is a finding; do the work or hand it back with the reason before the report. `LC_ALL=C grep -n '[^ -~]'` over the changed files finds nothing.
