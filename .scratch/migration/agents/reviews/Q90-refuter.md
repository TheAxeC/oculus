# Q90 refuter

Q90 review. I ran every command below from `.agents/worktrees/Q90/tools/oculus`, where HEAD is 60f25936 "wip" on base 6283272e. `git status --short` printed nothing before my runs and nothing after them. I made every revert and experiment in scratch copies under my scratchpad, never in the worktree.

## Verification lines (verbatim)

1. `npx vitest run tests/server/content/audit.test.ts tests/state/boards/collection.test.ts tests/views/sources/venues.test.ts tests/views/boards/collection/collection.test.ts tests/checks/tree --reporter=dot`: `Test Files  10 passed (10)` / `Tests  226 passed (226)`, exit 0.
   - I then ran it exactly five more times. Each run printed `exit 0`, `Test Files  10 passed (10)`, `Tests  226 passed (226)`. There was no failing run.
2. `npm run check`: `COMPLETED 1510 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, exit 0.
3. `npm run format:check`: `All matched files use Prettier code style!`, exit 0.
4. `npm run lint`: `lint exit 0`.
5. ASCII gate (the rules file's perl form): no output, `ascii exit 0`.
6. `sh bin/size-check.sh`: `size exit 0`. `sh bin/folder-check.sh`: `folder exit 0`.
7. `node bin/revert-check.mjs tests/server/content/audit.test.ts`:
   - Output: `red       tests/server/content/audit.test.ts :: looks for a hub path on disk and leaves a web address alone (revert src/lib/server/content/audit/projects.ts:468)` and `1 reverts, 0 unproven, 47 unchecked`, exit 1.
   - The exit of 1 comes from the 47 cases in the file that carry no directive. `bin/revert-check.mjs:658` is `process.exitCode = bad === 0 && unchecked === 0 ? 0 : 1;`. It is not caused by this step.

## 1. Spec

- **F1: the diagrams check is red, and the regenerated diagrams are not in the diff.**
  - What fails: `npx vitest run tests/checks/diagrams --reporter=dot` fails 2 cases at head:
    - "are what the source gives now, each file byte for byte": `AssertionError: run npm run diagrams: expected [ 'docs/diagrams/layers.dot', ... ] to deeply equal []`. It received `layers.dot/.svg`, `layer-server.dot/.svg` and `layer-state.dot/.svg`.
    - "are named stale, every one at once, when an import and a publish are added": the same six files come back as extras.
  - Proof that this step causes it: in a scratch copy with the six changed files restored from 6283272e and `hub-address.ts` removed, `npx vitest run tests/checks/diagrams` printed `Tests  63 passed (63)`.
  - Cause: the new import edges. After `npm run diagrams` in a copy of head, `layer-state.dot` reads `"folder state/boards to layer data" [label="13"...]` where the committed file has `label="12"`, and the diagrams test then printed `Tests  63 passed (63)`.
  - Fix: run `npm run diagrams` and commit the six regenerated files under `docs/diagrams/`.
  - Why nothing caught it: the brief's path list and command 1 name neither `docs/diagrams` nor `tests/checks/diagrams`. The rules file's `npm test` at the end would have caught it, but the brief forbids running the whole suite.
- **Writes outside the brief's path list.** All three are forced by the brief's items, and none loosens a check.
  - `tests/checks/tree/boundaries.test.ts:124` adds `'data/hub-address'` to the state row. The prose at :62-66 is written in the same form as its neighbours (`data/helpers/text-kind`, `data/sources/config/rail`).
    - It is forced: in a copy with the entry removed, `boundaries.test.ts` fails with `+   "state/boards/collection.ts imports data/hub-address"`.
    - It registers one exact module, as the row's other layer-1 entries are registered. It is not a `data/**` pattern. The server row already allowed `data/**`, so the server side needed no change.
  - `tests/state/boards/collection.test.ts:335-336 and :376` and `tests/state/workbench/layout/open/show-in-files.test.ts:457` change revert comments only, now naming `data/hub-address.ts`.
    - These are forced by the spec rule that a sentence made false by the change is a defect.
    - They contradict the brief's wording "`tests/state/boards/collection.test.ts` passes unchanged" only in comments. No assertion changed.
- **Premises.** Premise 3 reproduces.
  - Head: a script calling `auditFindings` the way `portfolio.ts:325` does, over the worktree's hub, printed `total 1 link path missing 0 web 0`.
  - Base condition (`isHubPath(link) &&` reverted to `link !== "" &&` in a copy): it printed `total 64 link path missing 63 web 63`.
- Item 1 (the rule moved, `ADDRESSED`/`HOSTED` exported for `hrefOf` and `hubPathsOf`, `isHubPath` re-exported at `collection.ts:23`), item 2 (`projects.ts:468`) and item 3 (the new case at `audit.test.ts:360-390`) match the brief. No further findings.

## 2. Proof

- The new directive is red under its revert.
  - Command 7 shows it red.
  - Independently, with `projects.ts:468` reverted to `link !== "" &&` in a copy: `FAIL ... looks for a hub path on disk and leaves a web address alone` with `+   "Addressed: link path missing: https://www.embs.org/jbhi/"`.
- The builder's claims reproduce. `collection.ts` went from 815 lines (`git show 6283272e:...| wc -l`) to 795. `hub-address.ts` has 34 lines.
- No check was loosened. The boundary entry is exact and proven required, as above.
- **For information, the second-copy experiment** (in a copy, the import in `collection.ts` replaced by a local copy of the rule):
  - With an identical local copy, command 1 plus `show-in-files.test.ts` raised no failure tied to the duplicate. No duplication check flagged it. The one failure in that run was `tests/checks/tree/size.test.ts > ... is on the list with a count it has not passed`. It did not recur in 3 reruns of `size.test.ts` alone, and I did not capture its message.
  - With a drifted local copy (the `www\.[^/]+|` branch dropped from `HOSTED`), 3 cases went red: `collection.test.ts > isHubPath > reads a host as a web address...`, `collection.test.ts > hrefOf > puts https in front of a web address written without a scheme`, and `show-in-files.test.ts > ... takes no path from a url that is a web address written without a scheme`.
  - What this shows: a drift is caught only to the extent the client-side behaviour cases cover the changed branch. No test ties the card's copy to the Audit's copy, and a second copy that stays identical passes everything.
- **For information, the intermittent failure.**
  - A run over all of `tests/checks` at head failed `tests/checks/tree/scratch.test.ts > a scratch directory > is swept by every file under tests that takes one`, which passed alone (`Tests  10 passed (10)`).
  - In a copy, one run of command 1 with `show-in-files.test.ts` added failed the same case with `Error: Test timed out in 5000ms.` at `tests/checks/tree/scratch.test.ts:255:5`.
  - It is a whole-tree scan timing out under load, and the six worktree runs of command 1 never hit it. That it is the builder's uncaptured failure is likely but not verified.

## 3. Standards

- F1 above also breaks the spec's "Verify before you report" (`npm test`) rule, through a brief that did not allow the full suite.
- The head comment of `src/lib/data/hub-address.ts:1-8` is in the tree's form (layer, what, why) and matches `data/helpers/text-kind.ts`.
- There is no history in added lines: `git diff 6283272e | grep '^+' | grep -niE "Q90|20[0-9]{2}-|previously|was moved|used to|no longer"` printed nothing.
- The ASCII gate is clean. Every added comment line is 100 columns or less; the only long added line is the revert directive at `audit.test.ts:362`, in the same form as the file's other directives.
- `src/lib/data/` now holds 8 items (`ls src/lib/data | wc -l`).
- **Sentences made false by the move:** none found.
  - Search run: `rg -n "ADDRESSED|HOSTED|isHubPath|hrefOf|hub-address|state/boards/collection" src tests DESIGN.md HELP.md README.md docs`.
  - DESIGN.md:311 cites `collection.ts` for `normalisePath` and `hubPathsOf`, both still there.
  - `VenueCard.svelte:6-8` cites `hubPathsOf` and `hrefOf`, both still in `collection.ts`.
  - The comment at `tests/checks/config/integrity.test.ts:162` names no file.
  - DESIGN.md:281, which describes the Audit, does not mention the link check.

## 4. Behaviour

- The Audit view's open count and badge on this hub drop from 64 findings to 1, because the 63 venue `link path missing` rows disappear (scan output above). The builder's report states the rule change but not this visible count.
- These link shapes are no longer checked on disk, although they were before. This follows the brief's decision 1, but the report does not list them:
  - a link with a leading slash (`/x`),
  - a scheme other than http (`mailto:`),
  - a scheme-less host with a path (`github.com/x`),
  - a `www.` value.
  - The integrity comment at `tests/checks/config/integrity.test.ts:162-166` says no scheme-less host-shaped value is in the hub today. I did not verify the other shapes' absence from the hub beyond the scan result above.
- For information, not introduced by this step: the Audit and the card still differ at the edges.
  - `hubPathsOf` (`collection.ts:293-305`) trims the value and drops a path that climbs above the hub (`../x`).
  - The Audit applies `isHubPath` to the untrimmed `scalar(entry.fields.link)` and runs `existsSync(join(input.hub, link))` for `../x`, which reads outside the hub root.

## Not checked

- The browser suite and the whole unit suite were not run, as instructed.
- Nothing was looked at on screen.
- I did not capture the message of the one `size.test.ts` failure in the identical-copy experiment.
- I did not run the rest of `bin/revert-check.mjs` over the three test files whose comments changed.

## Closed

- F1 (the diagrams check red, the regenerated diagrams missing): fixed at landing; `npm run diagrams` regenerated the six files under `docs/diagrams/` for the new import edges, and `npx vitest run tests/checks/diagrams` passes.
- Behaviour, the Audit and the card differ at the edges (an untrimmed link, a link above the hub): fixed at landing; the Audit trims the link as the card does and never reads a path outside the hub, with two new entries in the case and two new directives, each red under its revert (`3 reverts, 0 unproven`).
- Behaviour, the Audit's count on this hub drops from 64 to 1 and the address shapes no longer looked for on disk: stated in the landing report.
- Proof, no test ties two copies of the rule: no second copy exists after this step, which is what item 1 made so; nothing to change.
- Proof, `tests/checks/tree/scratch.test.ts` timing out once under load: not caused by this step; the whole unit suite on main at landing is its check, and a recurrence there is fixed at landing.

## Reviewer usage (added 2026-09-28 from the state file's usage table)

claude:opus, agent `a9e667bfb1d4ee931`: 123,361 tokens, 39 tool uses, 14.0 minutes.
