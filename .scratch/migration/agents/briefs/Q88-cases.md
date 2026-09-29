# Q88 cases ruling (round 0, 2026-09-29)

Rulings on the builder's first run of the brief's cases. Every other rule of the brief and the spec holds. Go on with the build from here.

## Cases

1. **Case 6, Discard Changes on an untracked file: option (a).** The Untracked group's menu is Open File, Stage Changes, Reveal in Explorer View. The server refuses to discard an untracked path (`src/lib/server/git/git-write.ts:207-211`) and the view draws Discard only for `group === 'changed'` (`Changes.svelte:272`), so the item would do nothing. Removing an untracked file is a new capability and joins Q88b, as a move to the macOS Trash under Z52 (b); `plan.md`'s Q88b line carries it. The case's test asserts the Untracked menu without Discard.
2. **Case 17, names from data: option (a).** Every label a menu builder writes itself is `t(...)` of a catalog key. A branch, tag or terminal name taken from the repository or the terminal list is passed through unchanged, and the test asserts it is exactly the name the builder was handed. Option (b), a `{0}` key that carries no words, is a check fitted to pass and is refused.

## Premise corrections, accepted

3. `views/sources/repositories/Repo.svelte` joins the step's paths: it draws `graph/Graph.svelte` (line 165) and hands it the switch and the tag removal.
4. A root row reveals through the client's `openFolder(dir)` with the root's absolute folder, since `handleOpen` refuses an empty path (`src/lib/server/files/open.ts:341`). A folder row keeps `openFile(root, path)`.
5. The repositories store's function is `shellIn(root, cwd, label)` (`state/sources/repositories/repositories.svelte.ts:215`), not `terminal(cwd, label)`.
6. `Branches.svelte` moves into `repositories/refs/` beside `Stashes.svelte` and `Tags.svelte`, its imports updated, and the menu builders go in `repositories/menus/`. Both paths join the step's list.

## Gaps, closed as proposed

7. Case 8: the Checkout submenu leaves out the checked-out branch, as Branches offers no switch on it (`Branches.svelte:79`). The test's commit carries `main` as a branch that is not the current one, and a second case shows the current branch left out.
8. Case 14: a read-only box offers Copy (with a selection) and Select All only. A case covers it.

The report carries each ruling above, and names the added paths with their reasons.
