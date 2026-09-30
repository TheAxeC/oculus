# Step E2 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/E2, base d7af9cac)

A page this report cites is named with its section. Lines of `tools/oculus/DESIGN.md` are those of the worktree's file after the rewrite (the section is lines 234 to 326).

## Verification (rerun by the reviewer)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams        (from tools/oculus in the worktree)
... docs/diagrams/writes.dot / docs/diagrams/writes.svg ; exit 0

$ PATH=... sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
$ npm test
 Test Files  348 passed | 19 skipped (367)
      Tests  5303 passed | 557 skipped (5860)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790779897813 COMPLETED 2377 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
(exit 0)

$ git status --short        (after the diagrams run)
 M tools/oculus/DESIGN.md
?? tools/oculus/.scratch/migration/agents/reviews/E2-report.md

$ git diff d7af9cac --stat
 tools/oculus/DESIGN.md | 68 ++++++++++++++++++++++++++++++--------------------
 hunks: @@ -233,11 +233,13 @@ and @@ -250,65 +252,77 @@ ; every removed line is a line of the section

$ LC_ALL=C grep -n '[^ -~]' tools/oculus/DESIGN.md      (worktree root)
(no output, exit 1; the removed base lines hold 0 non-ASCII lines too)

$ grep -n "^## " DESIGN.md
234:## Apps added while oculus runs
327:## Relationship to the cockpit

$ ls tools/oculus/docs/adr
ls: tools/oculus/docs/adr: No such file or directory
```

The checks run exceeded the 600 s foreground limit of the shell tool and the harness moved it to the background; it ended with exit 0 and the lines above are from its captured output. The test counts equal the builder's (348/5303 and 27/365). `npm run diagrams` leaves no tracked file changed (`git status --short` above), which the builder's report gave as not verified.

Builder's evidence rerun: every `file:line` of the report's appendix was printed from the worktree with `sed -n` and holds the text the appendix gives (`roots.ts:25-36` and `45-49`, `fs.ts:222-233`, `watch/git.ts:207` and `427`, `watch/bookmarks.ts:66`, `+page.svelte:73-75`, `+page.server.ts:26-27`, `writes.svelte.ts:420-421`, `socket.svelte.ts:155-160`, `registry.ts:86-91` and `102`, `auth.ts:29-38`, `paths.ts:15-19`, `model/index.ts:228`, `model-sessions.ts:544` and `555`, `entries.ts:68`, `writes.ts:84-85`, `undo.ts:181`, `manifest.ts:314`, `feeds.ts:253` and `306`, `source.svelte.ts:325-326`, `Workbench.svelte:250-251`, `Document.svelte:108`, `118`, `134-141`, `opening.ts:47-72`, `config/layout.yml:24`). Names the section says exist and the tree holds: `changes.keep` and `open.program_ext` with `.docx` (`config/behavior.yml:134-153`), glyphs `edit`, `lock`, `page` (`config/catalogs/glyphs.yml`), `ui.unknown_view`, `findings.file.does_not_parse`, `findings.file.not_a_map`, view ids `terminal` and `venues`, the view `history`, 13 POST routes beside `write` under `src/routes/api`, "The open action, `POST /api/open`" in the Configuration section (DESIGN.md:87). `grep -rn "listed: false" src` gives 13 views, `document`, `file`, `source` and `project` among them and `terminal` not, as the report says. The state file's open item the report quotes (Z97) is the worktree copy's, verbatim.

## Verdicts

Items of the brief's "What to build":

- 1: holds, lines 238 and 240 (both places, both names, used throughout).
- 2: holds, line 242 (view ids, addresses, `@` and `/` against the pattern, percent-encoding compared decoded), 262 (`root` in the row), 280 (HMAC over `<view id>:<hash>`).
- 3: holds, line 315 (`folder` field, removal by folder only, `view` in `POST /api/approve`, a pulled root app asks).
- 4: holds, line 321.
- 5: holds, lines 262 and 278.
- 6: holds, line 307.
- 7: holds, lines 260, 307, 325.
- 8: holds, lines 309, 311, 325.
- 9: holds, lines 258, 260, 284-287, 317, 323.
- 10: holds, lines 287, 290, 292.
- 11: holds, line 313; see Spec 2 for its closing sentence.
- 12: holds, line 319 and the registration at 269-273.
- 13: holds, no sentence states an old rule beside the new one (read of 236-325 against the 27 removed base lines).
- 14: holds, the two hunks lie inside the section; DESIGN.md outside the section has no sentence about apps (`awk 'NR<234 || NR>326' DESIGN.md | grep` for app terms finds none that the rewrite makes false). See Behaviour 1 for lines 140 and 374.
- 15: holds, line 240.
- 16: holds, line 315.
- 17: holds, line 242.
- 18: holds, line 313.
- 19: holds, lines 309, 311, 317.
- 20: holds, lines 258 and 260.
- 21: holds, line 323; see Spec 3 for what the sentence adds.
- 22: violated in one sentence, Proof 1; the rest of the item is at line 307.
- 23: holds, line 319.
- 24: holds, line 240.
- 25: holds, line 278.
- 26: holds, lines 242, 270, 317.
- 27: holds, every paragraph named is rewritten.

Cases:

- 1: met, lines 242 and 315.
- 2: met, lines 260 and 307.
- 3: met, line 307.
- 4: met, lines 260 and 307.
- 5: met, lines 309 and 311.
- 6: met, line 309.
- 7: met, lines 258, 260, 284, 317.
- 8: met, lines 278, 315, 317.
- 9: met, lines 287, 290, 292.
- 10: met, line 313.
- 11: met, line 319; see Spec 4 for the restart sentence.
- 12: met, line 321.
- 13: met, line 278.
- 14: met, line 242.
- 15: met, line 240.
- 16: met, line 240.
- 17: partial, two true sentences untouched by the rulings are reworded, Spec 1.
- 18: partial, line 313 gives two words for a refused target, Spec 2; no choice of `E1-choices.md` is stated other than as ruled.
- 19: met, line 240.
- 20: met, line 313.
- 21: met, lines 260, 309, 311.
- 22: met, lines 258 and 260.
- 23: met, line 319.
- 24: met, line 307.
- 25: met, line 278.
- 26: met, line 240.
- 27: met, line 242.

Rulings of `E1-rulings.md`: each of C1 and its five consequences, N1 (a), C8 (e), C11 with N2 (c), N3 (c), N4 (b), N5 (b), N6 (b), C6 (a) and C27 (a) is in the section as ruled and in full. None is left out, weakened or contradicted.

## 1. Spec

1. DESIGN.md, "Apps added while oculus runs", line 258: "since a key of a later version that oculus ignored silently would leave the reader approving something other than what runs" (base: "that was silently ignored"), and line 315: "so the reader approves exactly what the panel shows" (base: "what they were shown"). What is wrong: both sentences were true and no ruling touches them; the brief's "What to build" says such a sentence stays word for word. Failure scenario: the orchestrator reading the diff for what the rulings changed finds two changes that carry no ruling and has to establish that they are wording only. Verdict: case 17 partial.

2. Line 313: "A target that is refused rejects `closed`." What is wrong: the same paragraph gives `missing` for an id no registration holds, a project the portfolio does not hold, a root Files does not show and a file that does not exist, and `rate` past the limit, so the closing sentence states the rule a second time in a different way and names no case of its own (a target of none of the three forms is nowhere given a word). Failure scenario: a builder writing the bridge's `open` answers `closed` for a missing file on the strength of the last sentence, or has no word for `open({ foo: 1 })`. Verdict: case 18 partial.

3. Line 323: "the build step measures each in Chrome, closes any that sends a request from an app with no `connects`, and this section then states the measurements." What is wrong: choice C29 (b), ruled as recommended, is that the build step measures WebRTC and DNS prefetch and the section states what was measured; the brief's item 21 asks for "closes it if it does" for the download link and says "as the section already says for WebRTC", which the base does not say (the base sentence is "this section claims nothing for WebRTC or DNS prefetch"). The section now commits the build step to closing WebRTC and DNS prefetch as well, a shape neither the rulings, the brief's decisions nor the report's "Shapes named in this step" list. Failure scenario: a build step is booked against this sentence and owes a way to stop DNS prefetch from a sandboxed frame that nobody decided to build.

4. Line 319: "it is ended by Revoke, by a change to `app.yml` and by the end of the server process, and after a restart the question is asked again." What is wrong: the same paragraph says the control "approves the content shown as Approve does", which writes an `app` entry to `approvals.json`; an app whose files did not change after that press is still approved by content after a restart and is not asked about. The sentence holds only for an app whose files changed while it was kept. Failure scenario: a builder makes the restart drop the content approval of a kept app so that the sentence holds, which contradicts line 315 (approval by content persists in the file).

5. Shapes the section states that no ruling, no item of the brief, no entry of the brief's "Decisions taken in this brief" and no row of the report's "Shapes named in this step" carries:
   - line 242: "the header `x-oculus-app` carries the view id with the root key percent-encoded as the address does", and line 315: "with the app's view id in `view` (the root key percent-encoded, as in the header `x-oculus-app`)". The `view` field is a JSON body value, which needs no encoding; the section gives no reason for encoding it there.
   - line 309: "A write of the value the file already holds changes nothing and calls nothing."
   - line 309: `setStore` "rejects a value that is not JSON", with no refusal word named among the words of line 305.
   - line 313: "a machine app any root shown in Files", which includes the root `engine`, so a machine app can open `config/local.yml` in a source tab in front of the reader.
   - line 313: `open` "counts toward `apps.opens_per_min` (30)" without saying per frame or per app, where line 311 says "per frame per minute" for writes.
   - line 319: the Keep control also writes the content approval (see Spec 4).
   - line 323: closing WebRTC and DNS prefetch (Spec 3).
   Failure scenario: Axel rules on the shapes from the report's list at the landing and these reach a build step unruled.

## 2. Proof

1. Line 307: "a repository below the root's folder has an entry of its own that is not the root app's." What is wrong: the `git` payload is keyed only by the folders of the roots (`src/lib/server/root/watch/git.ts:188-214`, `state[root] = next`; `model-sessions.ts:543`, "one state per workspace root"; `roots.ts:45-49`). A repository below a root's folder has an entry only when that folder is itself a root shown in Files. The builder's report repeats the claim ("A repository below the root's folder has its own `git` entry and its own notices") citing the same lines, which do not show it. The decision that rests on it: decision 17 of the brief, what a root app gets on `git`. Failure scenario: a builder of the root app's copy of `git` looks for entries of nested repositories to leave out and finds none, or Axel rules on decision 17 believing nested repositories are reported separately. Verdict: item 22 violated in this sentence.

## 3. Standards

1. Line 276: "`badgeMark` (`state/workbench/navigation/registry.ts:102`) accepts a function of the badge client, as `badgeGlyph` does". What is wrong: the tree's line 102 is `badgeMark?: string;`, and the sentence is in the present tense where the sentence before it says "`Registration` gains two optional fields". The standing spec's rule is that a sentence in a document the tree makes false is a defect. Failure scenario: a builder writes `badgeMark: () => ...` in the registration of lines 269-273 and meets a type error and the `rail-badges` test the registry's comment names, with no sentence telling him the field's type is to be changed.

2. Line 313: "open in the source tab as that tab shows such a file today". What is wrong: "today" is a time reference in a design page; the rules file's "Writing docs" section keeps history and dates out of such a page, and the brief's Conventions ask for no history. Failure scenario: the sentence goes stale the day the source tab's handling of a binary file changes, and the reader cannot tell which behaviour is meant.

3. Line 260: "Two findings are about an apps folder and not an app", and line 315: "An entry is found by the app's real folder path and not by its name". What is wrong: both are the negation-contrast form the rules file's writing rules (the "No negation-contrast" rule of `writing-docs-md-yaml.md`) ban. Failure scenario: none for a builder; the text carries a tell the hub's prose rule removes.

4. Lines 238, 240, 242, 262, 276, 282, 313 name the file browser "Files" ("a root shown in Files", 13 times) and lines 317, 321, 323 name it "the file browser" (3 times). What is wrong: one thing under two names inside one section (the rules file's "No synonym cycling" rule); DESIGN.md outside the section says "the file browser" and "the Files view". Failure scenario: a reader takes "Files" and "the file browser" for two surfaces.

5. Line 236: "This section is a ruled and unbuilt proposal", and line 323: "is not claimed here ... and this section then states the measurements". What is wrong: both narrate the document's own status, which the rules file's deliverable rule bans; the brief's "What to build" asks for the first in those words and choice C29 (b) for the second, so the brief and the rule disagree and the builder followed the brief. Failure scenario: none for a builder; the orchestrator decides whether the brief's wording or the rule stands.

No hard-wrapped paragraph, no non-ASCII character, no em dash, no spaced hyphen, no date, no ruling id and no person's name is in lines 234 to 326 (the python scan and the grep above). The section holds nothing that reads `.vscode`.

## 4. Behaviour

1. Line 311: "Its change record holds the file, the app's view id as `key`, the field `store`, and the sizes in bytes before and after as `before` and `after`." What is wrong: DESIGN.md line 140 ("what file, what field, the value the file held and the value written") and line 374 ("the value on either side of each write") describe every change record as holding both values, and the History view draws them; a store write's record holds sizes. The builder's report names the two lines (as 140 and 360; the second is line 374) and leaves them, since the section is unbuilt. The section itself does not say that a store write's record differs from the change log's rule, nor what the History view draws for one. Failure scenario: a reader of the History view sees two byte counts for a store write where every other row shows values, and the builder of that view has no sentence saying so.

## Declined to judge

- The two penpal citations (`dist/penpal.mjs:15-20` and `88-97`): `node_modules/penpal` is not in the worktree and fetching the package is outside a read and a rerun. Both are unchanged from the base.
- Line 240's "with `~/workspace` under the key `workspace` when no root beside the hub exists": the cited lines say it, and the brief's premise says it; whether `browserRoots` ever meets that condition with `engine` in its fixed list (`fs.ts:229` tests every key against `hub`) was not settled, and it is a matter of the code, not of this step.
- Line 317's "a control that opens the app's folder in the file browser" for a machine app, whose folder `~/.oculus/apps/<name>` lies under no root (DESIGN.md:87, "nothing outside a root is ever served"): the sentence is carried from the base and no ruling touches it, so it is outside what the step changed.
- What a root app gets on `git` when its root's folder lies inside a larger repository: no ruling and no item of the brief covers it; it is Axel's call.
- Whether each shape of the report's rows 18 to 33 is the right one: they are Axel's to rule at the landing.
- Whether `open({ view: 'app:<other>' })` should be admitted (apps are views the catalogue lists, so the text admits it): the brief's item 18 gives the rule and names no exception; Axel's call.
- The browser facts the section states (what `sandbox`, `connect-src` and `allow-downloads` do in Chrome): nothing is built to measure.

Reviewer usage: about 195,000 tokens, 24 tool uses; minutes not measured (the checks run alone took over 10 minutes).

Files: `/Users/axelfaes/workspace/research-hub/.agents/worktrees/E2/tools/oculus/DESIGN.md` (the section, lines 234-326), `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/briefs/E2.md`, `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/reviews/E1-rulings.md`, `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/reviews/E2-report.md`. The checks output is in the session scratchpad as `E2-checks.txt`; nothing was written in the repository or the ledger.

## Repair round 1, refuted

Worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/E2`, base d7af9cac. Lines of `tools/oculus/DESIGN.md` are those of the worktree's file; the section is lines 234 to 326. Nothing was written outside my scratchpad.

Verification, rerun from the worktree's `tools/oculus` in the foreground:

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams
... docs/diagrams/channels.svg / docs/diagrams/writes.dot / docs/diagrams/writes.svg ; diagrams exit 0

$ git status --short        (after the diagrams run)
 M DESIGN.md
?? .scratch/migration/agents/reviews/E2-report.md

$ PATH=... sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
$ npm test
 Test Files  348 passed | 19 skipped (367)
      Tests  5303 passed | 557 skipped (5860)
   Start at  18:50:16
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
   Start at  18:51:22
$ npm run check
1790787127215 START "/Users/axelfaes/workspace/research-hub/.agents/worktrees/E2/tools/oculus"
1790787127222 COMPLETED 2377 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
Checking formatting...
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
(checks exit 0)

$ LC_ALL=C grep -n '[^ -~]' DESIGN.md
(no output, exit 1)

$ git status --short        (after everything)
 M DESIGN.md
?? .scratch/migration/agents/reviews/E2-report.md

$ git diff d7af9cac --stat
 tools/oculus/DESIGN.md | 68 ++++++++++++++++++++++++++++++--------------------
 1 file changed, 41 insertions(+), 27 deletions(-)
 hunks: @@ -233,11 +233,13 @@ and @@ -250,65 +252,77 @@

$ ls tools/oculus/docs/adr
ls: .../tools/oculus/docs/adr: No such file or directory
```

`npm run diagrams` left no change: the status lists the same two paths before and after it. The test counts equal the builder's (348/5303, 27/365). No ADR folder exists, so no ADR governs the diff.

The builder's evidence for the round, rerun:
- `sed -n 234,326p DESIGN.md | grep -c "Files"` prints 0, as the report says.
- `diff` of the ledger's `agents/reviews/E2-report.md` against the worktree's copy: identical.
- The report's line 3 quotes of DESIGN.md:140 ("the value the file held and the value written") and 374 ("the value on either side of each write"): both found at those lines by `grep -n`; "360" no longer appears in the report.
- Rows 34 to 42 of "Shapes named in this step" exist, each with an alternative.
- One row of the report's DONE table does not reproduce after the round: see Proof 1.

### The fifteen round items

Each old phrase of the round as sent was searched in lines 234 to 326 with `grep -cF` and gives 0; each ruled phrase gives 1 (the four "file browser" phrases 3, 2, 1, 1).

1. Closed. Line 258 ends "since a key of a later version that was silently ignored would leave the reader approving something other than what runs." and line 315 reads "so the reader approves exactly what they were shown"; both equal the removed base lines of the diff.
2. Closed. Line 313: "A target that is none of the three forms rejects `closed`."; "A target that is refused rejects" is gone.
3. Closed. Line 323 ends with the two ruled sentences, closing said of the download link only.
4. Closed. Line 319 holds the two ruled sentences verbatim.
5. Closed. Line 315 has "with the app's view id in `view`, which the server refuses" with no parenthesis; line 242 has the header's reason verbatim.
6. Closed. Line 313: "At most `apps.opens_per_min` (30) calls of `open` pass per frame per minute, and the rest reject `rate`."; "and rejects `rate` past it" is gone.
7. Closed, and the sentence is true of the code. Line 307 holds the ruled words. `src/lib/server/root/watch/git.ts:188-214`: `let state: GitPayload = {}` (188), and the only write is `state[root] = next` (213) for a `root` that holds a handle; `src/lib/server/files/roots.ts:45-49`: `repositoryRoots` is `browserRoots` without `engine`, mapped to folders. So the payload has one entry per root folder and none for a repository below one. The report's line 260 carries the corrected claim, and "entry of its own" is gone from the report.
8. Closed, and the sentence is true of the code. Line 276 holds the ruled words. `src/lib/state/workbench/navigation/registry.ts:102` is `badgeMark?: string;` (a catalog key, by its comment at 97-101), and `badgeGlyph` at line 95 is `(state: BadgeClient) => string`.
9. Closed as ruled (line 313, "open in the source tab, which says the file is binary (`state/sessions/source.svelte.ts:325-326`)", "today" gone), but the sentence is not true of the cited lines: Spec 1.
10. Closed. Line 260: "Two findings are about a whole apps folder, keyed `apps[<root key>/]`"; line 315: "An entry is found by the app's real folder path, whatever its name:".
11. Closed. `grep -n "Files" DESIGN.md` over the section has no hit at all, so there is no code name to list; the report says the count is 0. "the file browser" stands 17 times in the section.
12. Closed. Line 311 holds the added sentence verbatim; lines 140 and 374 are outside both hunks and unchanged; the report names 374.
13. Closed. Report rows 34 (same value written), 35 (not JSON, no word), 36 (any root, `engine` included; alternative every root but `engine`), 37 (per frame per minute), 38 (Keep writes the content approval), 39 (header encoded, body as is), 40 (no form rejects `closed`), 41 (History draws sizes), 42 (WebRTC and DNS prefetch measured, only the download link closed): nine shapes, nine rows, each with its alternative.
14. Closed. Line 236 keeps "This section is a ruled and unbuilt proposal" and line 323 keeps "is not claimed here".
15. Closed. The report has a section "Repair round 1" with fifteen DONE rows and a Verify line; the checks block it points at carries a svelte-check stamp (1790781551109) later than the first refuter's run (1790779897813), so it is a run made after the round was sent.

Nothing was closed by removing a statement: every item replaced words with the ruled words. No change beyond a ruling was found; the limit of that check is under "Declined to judge".

### Verdicts

Items of the brief's "What to build":
- 1: holds, lines 238 and 240.
- 2: holds, lines 242, 262 (`root` in the row), 280 (HMAC over `<view id>:<hash>`), 284.
- 3: holds, line 315.
- 4: holds, line 321.
- 5: holds, lines 262 and 278.
- 6: holds, line 307.
- 7: holds, lines 260, 307, 325.
- 8: holds, lines 309, 311, 325.
- 9: holds, lines 258, 260, 284 to 287, 317, 323.
- 10: holds, lines 287, 290, 292.
- 11: holds, line 313.
- 12: holds, line 319 and the registration at 269 to 273.
- 13: holds; no sentence states an old rule beside the new one.
- 14: holds; the two hunks lie inside the section, and the sentences outside it that name what the section changed (`badgeMark` at line 220, the change record at 140 and 374) are not made false: 220 still holds under the proposal, and 140 and 374 describe built code, with the difference stated at line 311.
- 15: holds, line 240.
- 16: holds, line 315.
- 17: holds, line 242.
- 18: violated in one clause, Spec 1 (the citation for what the source tab says); the rest of the item is at line 313.
- 19: holds, lines 309, 311, 317.
- 20: holds, lines 258 and 260.
- 21: holds, line 323.
- 22: holds, line 307 (the first review's Proof 1 is closed).
- 23: holds, line 319.
- 24: holds, line 240.
- 25: holds, line 278.
- 26: holds, lines 242, 270, 317.
- 27: holds.

Cases:
- 1: met, lines 242 and 315.
- 2: met, lines 260 and 307.
- 3: met, line 307.
- 4: met, lines 260 and 307.
- 5: met, lines 309 and 311.
- 6: met, line 309.
- 7: met, lines 258, 260, 284, 317.
- 8: met, lines 278, 315, 317.
- 9: met, lines 287, 290, 292.
- 10: met, line 313.
- 11: met, line 319: in the case's scenario a file was saved under the keeping, so after a restart the entry's hash differs and the panel asks.
- 12: met, line 321.
- 13: met, line 278.
- 14: met, line 242.
- 15: met, line 240.
- 16: met, line 240.
- 17: met. A script split the 27 removed base lines into 253 clauses; 83 are absent from the new section, and each of the 83 is changed by a ruling, an item of the brief or a corrected citation. The two the first review named are back word for word.
- 18: partial, Spec 2 (one `open` target is given two words). No choice of `E1-choices.md` is stated other than as ruled.
- 19: met, line 240.
- 20: met, line 313.
- 21: met, lines 260, 309, 311.
- 22: met, lines 258 and 260.
- 23: met, line 319.
- 24: met, line 307.
- 25: met, line 278.
- 26: met, line 240.
- 27: met, line 242.

### Findings

#### Spec

1. DESIGN.md, "Apps added while oculus runs", line 313: "A binary file, and a file that `open.program_ext` maps to a program such as a `.docx`, open in the source tab, which says the file is binary (`state/sessions/source.svelte.ts:325-326`), and no program is started." What is wrong: lines 325-326 are inside `saveSourceDraft` (`source.svelte.ts:293`), in the branch for a save the server refused:

   ```ts
   if (answer.error === 'binary') {
       updateDraft(id, { message: t('source.binary') });
   ```

   and the words are "This file is not text on disk; the editor saves nothing over it." (`config/text/views/sources/source.yml:4`). The server answers `binary` only from the write handler (`src/lib/server/files/source.ts:136`). So the tab says this after a refused save, not when it opens. In the tree nothing opens the source tab for a binary file: `tabOf` sends every file that is not `html` or `text` to the `file` view (`src/lib/views/sources/files/opening.ts:31-40`), and DESIGN.md:381 says the same. The round's words are the ruled words, so the defect is in the ruling's sentence, carried from the brief's item 18 ("as the source tab shows such a file today"). Failure scenario: a builder of `open` reads that the source tab already tells the reader a file is binary when it opens, builds nothing for it, and the reader gets an editor over bytes with no sentence until a save is refused. Verdict: item 18 violated in this clause.

2. Line 313: "A root app may name only its own root in `file`, a machine app any root shown in the file browser, and a root the app may not name rejects `closed`; a root the file browser does not show and a file that does not exist reject `missing`." What is wrong: a root app that names a root the file browser does not show matches both halves, so the target has two words and the order of the two tests is not given. The round's item 2 aimed at one word per case. Failure scenario: a builder tests "shown" first, and a root app then learns from `missing` against `closed` which root keys this machine shows, where line 238 says a root app names only its own root. Verdict: case 18 partial.

#### Proof

1. The builder's report, "DONE / NOT DONE", row "No history, no date, no person's name in the section": "searched for ` was `, ` were `, `used to`, `changed from` ... printed no hit". My run of the same search over lines 234 to 326 prints three hits: " was silently ignored" (line 258), " were shown" (line 315), " were at" (line 319). All three come from words the round ruled in (items 1 and 4); none is history (a conditional, "what they were shown", "as they were at that press"). What is wrong: the row was true before the round and the report, which states the end state, was not brought along. Failure scenario: the landing quotes the row as the evidence for "no history" and a rerun of the quoted search contradicts it. The brief's Conventions list "was" among the history words; the ruling put the base words back, so the text stands and only the row is wrong.

2. The builder's report, "Every sentence removed or reworded", row "278-282 policy line": "N3 (b) and N4 (b)." `E1-rulings.md:17` is N3 (c). No decision rests on it; the row names the wrong option of the ruling.

#### Standards

None. Scans over lines 234 to 326: no non-ASCII character, no ` - ` or `--` outside the code block, no leading or trailing space, every paragraph one line, "today" 0 times, "Files" 0 times, no "and not" or ", not" contrast left by the round (the two hits of the scan are base sentences of lists: "not offered, not registered and not served" and "a symbolic link is not part of the app"). Names the round changed, grepped outside the section and in `HELP.md` and `README.md`: `badgeMark` (DESIGN.md:220, still true), "the file browser" (the name DESIGN.md uses outside the section), `apps.opens_per_min`, `approvals`, `x-oculus-app`, `app-data` (no hit outside the section, none in `HELP.md` or `README.md`).

#### Behaviour

1. The builder's report, "Repair round 1": each row gives the new words and the line, none gives the words replaced. The statements of behaviour that changed in the round are items 3 (WebRTC and DNS prefetch are measured, no longer closed), 4 (after a restart a kept app runs while its files are as at the press, where the text said the question is asked again), 6 (the `open` limit is per frame), 7 (a nested repository has no entry) and 12 (History draws sizes for a store write). The old words are only in `agents/briefs/E2-round1-sent.md`. Failure scenario: a reader of the report alone at the landing does not see that item 4 changed what a restart does. Nothing is built, so no view changed on screen.

### Declined to judge

- Whether the round changed any word outside the fifteen items: no snapshot of the text as sent exists. What was checked: the diff stat and the two hunk headers equal the first review's (68 lines, the section still 234 to 326), every old phrase is gone and every ruled phrase is present once.
- What the source tab draws when it is opened for a binary file: nothing in the tree opens it for one, and seeing it needs a running page, which this review may not start or reach.
- The two penpal citations (`dist/penpal.mjs:15-20` and `88-97`): the package is not installed in the worktree; both are unchanged from the base and the round did not touch them.
- Whether each shape of the report's rows 18 to 42 is the right one, the machine app's reach to the root `engine` in `open({ file })` (row 36) included: they are Axel's to rule at the landing.
- Whether `open({ view: 'app:<other>' })` should be admitted: the text admits it, the brief names no exception; Axel's call, as the first review said.
- Line 240's "`~/workspace` under the key `workspace` when no root beside the hub exists" and line 317's control that opens a machine app's folder in the file browser: both carried from the first review's declined points, untouched by the round.
- The browser facts the section states (what `sandbox`, `connect-src` and `allow-downloads` do in Chrome): nothing is built to measure.

Tool uses: 23, this handback included.

Files: `/Users/axelfaes/workspace/research-hub/.agents/worktrees/E2/tools/oculus/DESIGN.md` (lines 234 to 326), `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/reviews/E2-report.md`, `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/briefs/E2-round1-sent.md`, `/Users/axelfaes/workspace/research-hub/.agents/worktrees/E2/tools/oculus/src/lib/state/sessions/source.svelte.ts` (293 to 327), `/Users/axelfaes/workspace/research-hub/.agents/worktrees/E2/tools/oculus/src/lib/server/files/source.ts` (136), `/Users/axelfaes/workspace/research-hub/.agents/worktrees/E2/tools/oculus/src/lib/views/sources/files/opening.ts` (31 to 40). The checks output is in the scratchpad as `checks.txt`.

### Closed

- Spec 1, Spec 2, Proof 1, Proof 2 and Behaviour 1 are the findings of the run over the last round, so none goes to the builder; each is fixed at landing, in DESIGN.md line 313 for the two Spec findings and in the builder report for the other three.
