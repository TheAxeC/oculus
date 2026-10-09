# D53 landing: unique views

Position: the oculus migration (cockpit to oculus), D53 unique views; landed, with 332 of the 364 packages of `plan.md` ticked. Next: D56 (the workbench) is prepared into a free slot; D41 lands after its review over repair round 1; D49 waits for D41 and D50.

## Open items

- Open item 31: a pulled change to a kept machine app runs with every channel and no question while oculus runs, since the hub's `.oculus/apps` is tracked in git; options (a) ask again for an app whose files change by anything other than oculus's own editor (recommended), (b) keep `.oculus/apps` out of git, (c) leave it and describe it (the lazy option).
- Open item 32: R2's start check needs a new guarded entry for its test; options (a) a new entry G73 with one table test (recommended), (b) no entry and no test (the lazy option).

## The check of Steps 1

The builder a852fc218b52cd9f6, the brief check a12465afebb34bf1c and the reviewers a52bc4284562a0424 and ac5b1a39ceb0164f4 had finished; ListAgents listed none of them running (it listed a6f74cd8e4f21015b and a30b6993857882108, the builders of D41 and D50).

## NOT DONE

Nothing of the step is left undone. Not looked at on screen: the tab menu's Copy into New Window (offered only in the app), Reset and Reset all pages, a drop from the catalogue; the builder's scratch runs cover them on the store. `npm test` and `npm run test:slow` were not rerun after the two fixes made for `test:checks`, which change a comment, a type annotation, an export and the allow list and no runtime code; `npm run check` and `npm run test:checks` were rerun and pass.

## What landed

The ten views Settings, Focus, Usage, Live HPC, Audit, Findings, History, Processes, Pages and Status are held once: every opener goes to the page or float that holds one and puts that page on screen, showing a maximised-away or folded pane on the way, also through page leaves; rail pages made from their arrangements, Reset and Reset all pages take the instance they name; New page and Copy into New Window make no second one; the Views catalogue's click, shift-click, drop and right-click actions go to the held instance. Files, Search, Terminal and the session views are not unique. 27 paths, one commit.

## What was found

- The review over round 1 raised three findings, each fixed at landing: `docs/window.md` now says that while a pane of the page is maximised only that pane is looked in for a view that is not unique; it says Reset all pages takes a held unique view from a page of the reader's own only; `createOpening`'s `opened` parameter has no default.
- The gate's `npm run test:checks` failed on a comment line past the hundredth column (`drag.svelte.ts:193`) and on ten lines written twice in the layout store's type and `away.ts`'s `Away` type; the comment is rewrapped, the store's members are typed `Away['openAway']` and so on, and the allow-list line of that pair is removed since no copy is left.
- The look (scratch oculus, port 8796): from the Projects page a click on Focus in the Views catalogue showed the Focus page with its one Focus, and the Projects page held none; with the Views pane maximised, a click on History restored the panes and showed the one History tab active.

## The gate

In `.agents/worktrees/gate` at 66e5eedc6: `npm run diagrams && npm run test:landing`: ok ASCII gate (3.0 s); ok npm run format:check (17.5 s); ok npm run lint (84.5 s); ok npm test (228.6 s); FAILED npm run test:checks (333.4 s); ok npm run check, then npm run build, then npm run test:slow (463.6 s). After the fixes: `npm run test:checks` Test Files 17 passed (17), Tests 265 passed (265); `npm run check` 0 errors, 0 warnings; Prettier and ESLint clean over the changed files. Main's 27 staged blobs equal the gate's by `git rev-parse`.

## Agents

- Builder a852fc218b52cd9f6 (claude-sonnet-5-5): 202,347 tokens, 160 tool uses, 53.4 min; round 1 317,432 tokens, 30 tool uses, 12.0 min. The first report did not pass its bar; its review's findings went back in repair round 1.
- Brief check a12465afebb34bf1c (claude-opus-5-5): 254,223 tokens, 79 tool uses, 12.0 min.
- Reviewer a52bc4284562a0424 (claude-opus-5-5): 259,880 tokens, 69 tool uses, 23.5 min.
- Reviewer over round 1 ac5b1a39ceb0164f4 (claude-opus-5-5): 233,210 tokens, 55 tool uses, 15.3 min.
- Fixes at landing: 5. The A/B: no `bench:` line, none run.
