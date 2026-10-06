# Review: Q51, state/layout.svelte.ts split by concern

Reviewer a2cd905622b557c86, claude:opus, read-only. Worktree `.agents/worktrees/q51`, base `6dcd7ca3`. Nothing in the worktree was edited; every revert ran in a copy, and `git status --short` with `git diff --stat 6dcd7ca3` was byte-identical before and after.

## Verification, rerun

```
npx vitest run --reporter=dot     Test Files 252 passed (252) / Tests 4282 passed (4282) / 77.26s
npm run check                     COMPLETED 1229 FILES 0 ERRORS 0 WARNINGS
npm run build                     BUILD-EXIT=0
npm run format:check              All matched files use Prettier code style!
npm run lint                      no output, exit 0
the ASCII gate                    no output, exit 0
npx playwright test <six specs>   73 passed (1.9m)
wc -l                             layout.svelte.ts 440; access 40, attention 149, index 100,
                                  instances 333, opening 162, show-in-files 50, storage 78
git diff --stat 6dcd7ca3          6 files changed, 90 insertions(+), 581 deletions(-)
```

Every before number checks out against the base (942, 89, 157, 234, 60, 400, 434, 73). Import counts: 21 at base to 14 now over `state/layout.svelte`, and 12 to 12 over real specifiers, with the importer file set identical.

## Spec

1. **Brief item 3 is answered with one group comment whose stated reason is not a criterion.** `src/lib/state/layout.svelte.ts:130-131` says each function left in the factory "reads or writes `store.current`, or is on the path that does", which covers `instances.ts`'s `closePane` and `closeInstance` exactly as well, since they reach the store through `access.apply`. Counted over the file: 26 functions stayed, and 11 hold no literal `store.current` (`at`, `workbench`, `layout`, `openPage`, `change`, `unembedPage`, `maximisePane`, `restorePanes`, `foldPane`, `expandChild`, `focused`); six of those are pane-tree operations that touch the store only through `access.workbench`, `access.apply` or `access.change`, and nothing in the diff says why they did not become a `panes.ts`.
2. **A change no item asks for**: `read` gained `if (backing === null) return null;` (`storage.ts:48-49`), which the base did not have, since the base took the storage as an argument. Unobservable from the store, which attaches before any read.
3. The report never states the sentence the brief's Tests item 3 asks for, that the file is under 900; it gives 440 and `(was 942)`.

## Proof

4. **Every number in the report reproduces**: 440, `4282 passed` over 252 files, `COMPLETED 1229 FILES 0 ERRORS`, `73 passed`, and every before-and-after line count and import count.
5. **All nineteen reverts run, and each reddens the case that names it**, proven twice: the whole file, then the named case alone with `-t`. R17 `2 failed of 5`, R18 and R19 `1 failed of 32`, the report's own numbers.
6. **The two replaced reverts are honest.** The `write` guard is dead: with it dropped alone the node suite sits at its baseline (`3 failed | 4271 passed`, the three being real-hub probes that fail because the copy sits outside the hub, identically with no revert applied). `touchPane`'s guard is **not** dead: the case builds page one showing page two as a leaf, touches page two, then touches a page id the list does not hold, and without the guard `touched()` falls back to page one. Neither case is fitted to its revert.
7. **One line of the report is false.** Under "Found and not fixed": "`openInto` keeps the shadowed `held` the original had." It does not; the inner binding was renamed to `made` (`opening.ts:133`) and the shadowing is gone. The rename changes nothing.
8. The report's mid-run `Tests 1 failed | 4281 passed` is not reproducible: the reviewer's full run in the worktree was `4282 passed`. A flaky case in the suite that nobody has named, not caused by this diff as far as either run shows.

## Standards

9. Clean. Every new module opens with its layer ("Layer 2, client state"); no history in any added line; the ASCII gate silent; Prettier and eslint clean; the largest new file is 333 lines.
10. **No rune and no module-level state, and the check catches one planted**: `grep -n '\$state\|\$derived\|\$effect' src/lib/state/layout/*.ts` exits 1; a plain `let planted` in `attention.ts` and a `$state({})` in `instances.ts` each turn `tests/boundaries.test.ts` red by name.
11. **Documents**: `DESIGN.md:93`, `DESIGN.md:201` and `DESIGN.md:338` all stay true; a grep of every moved name across `HELP.md`, `DESIGN.md`, `README.md` and `config` gives one hit, the `showInFiles` line, whose behaviour is unchanged. Two prose lines worth knowing, neither this step's: `src/lib/state/drag.svelte.ts:8` names `state/layout.svelte.ts` for an operation whose body moved but whose member did not, which holds at the level it speaks at; `src/routes/+page.svelte:160` names `state/layout.ts`, a file that does not exist and did not at base.

## Behaviour

12. **None found**, on three checks.
13. **Function by function**: all 57 indent-4 declarations extracted from the base and from the new modules, the access prefixes normalised, gives **48 identical, 0 missing, 9 different**. The nine are `loadLayout` (renamed locals and four calls now going through `storage` and `attention`, each of which is exactly the statements it replaced), `read` (finding 2), `switchPage`, `closePage`, `savePages` (each an inline pair replaced by the helper that is that pair), `closeInstanceAnywhere` and `carryToPage` (`store.current` read once into a local at the same program point, with nothing mutating the store between the two reads), `closeInstance` (Prettier rewrapping) and `closePane` (braces added). None can change what the store does.
14. **The public shape is identical**: the `LayoutStore` type block diffs empty against the base, the 41 returned member names diff empty, and the same five names are exported with the same values and types. `state/layout/index.ts` gained 15 export names, none removed or renamed; `Storable` went from module-private to public on the folder facade, which is the report's reversible decision 3.
15. **Order of effects is unchanged**: no module-level call, assignment or side effect in any new module; `access.held` is `() => store.current`, a call per read; the four factories run inside the store's factory, so `lastActive`, `lastTouched` and `lastBeside` keep their per-client lifetime. One new runtime import edge (`layout/index.ts` to `show-in-files.ts` to `state/fs.ts`) with no path back, so no cycle; `access.ts` is reached only through `export type` and is erased.

## Not checked

The view on screen (the diff touches no markup, attribute, control name or string); the flake behind the report's one red run; `tests/browser` beyond the six specs named; whether the eleven functions of finding 1 could move without breaking something.

Reviewer usage: 35 tool calls; three full node-suite runs, 19 targeted runs plus 19 filtered reruns for the reverts, and one browser run at 1.9m.
