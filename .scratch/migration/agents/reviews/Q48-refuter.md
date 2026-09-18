# Step Q48 refuter report (on .agents/worktrees/q48, base ac11faae)

## Verification (rerun by the reviewer)

```
npx vitest run --reporter=dot
  Test Files  249 passed (249)
       Tests  4214 passed (4214)
    Duration  61.08s
  (no rerun needed; no timing test timed out)

npm run check
  1789680687742 COMPLETED 1217 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  > eslint .
  (no output, exit 0)

npm run format:check
  Checking formatting...
  All matched files use Prettier code style!

LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' $(find src tests bin config -type f ! -name glyphs.yml)
  (no output, exit 0)

find src tests bin -type f | xargs wc -l | sort -n | tail -3
       970 tests/state/layout.test.ts
       980 tests/state/board.test.ts
    171677 total

npm run build
  ✓ built in 6.37s
  > Using @sveltejs/adapter-node
    ✔ done

npx playwright test tests/browser/files-forms.spec.ts tests/browser/unsaved-forms.spec.ts tests/browser/files.spec.ts tests/browser/cards.spec.ts
  64 passed (1.8m)

git status --short   (from inside the worktree, unchanged: the same nine modified files)

Reverts, each applied in the reviewer's own clone (scratchpad, node_modules cloned, never in the worktree):
  takeFormDraft without the whole() guard        -> 1 failed: "takes an add's draft only while it is still what was sent, whole" (expected true to be false)
  localDrafts.taken without the whole() guard    -> 1 failed: "takes an add's draft only while it is what was sent, as an instance's target does"
  settleFormDraft without the markKept calls     -> 3 failed: "marks the form its answer left text in...", "unmarks the form when the reader closes it", "forgets the marks of a tab the layout closed"
  clearFormDraft without the markKept call       -> 1 failed: "unmarks the form when the reader closes it"
  context.ts without formDrafts.forgetForms      -> 1 failed: "forgets the marks of a tab the layout closed"
  editedGone without `kept`                      -> node 1 failed: "leaves the form whose last answer left text in it, which a rename is"
                                                 -> browser 1 failed: "a bookmark renamed by its form keeps what was typed while the save was out" (toHaveLength(1), received 0, at files-forms.spec.ts:471)
  EntryForm into.clear(which); onclose();        -> 3 failed: files-forms.spec.ts:414, unsaved-forms.spec.ts:376, unsaved-forms.spec.ts:398; 2 passed
  EntryForm into.taken(...) with no close        -> 1 failed: "an add form nothing touched while its save was out closes once its entry is added" (toHaveCount(0) at :369)
  Files.svelte $effect over `view`/`instance.id` -> 1 failed: "a bookmark taken away closes the form of a file browser whose tab is not shown" (at :513)
```

Every verification command reproduces the builder's reported output, and every revert the tests name turns exactly the tests it names red.

## 1. Spec

- `src/lib/views/Files.svelte:404-421`: brief item 3 asks that the gone-bookmark close "runs for a Files instance whose tab is not shown". The sweep is a component `$effect` of the mounted view, so it runs only while at least one Files view is mounted somewhere; with none mounted no instance's form is closed. Reproduced: with the only Files tab replaced by Status in its pane, the hidden instance kept `{"form":"bookmark","editing":"tool.py"}` and its draft for the whole wait, and closed only once a Files view was on screen again and something invalidated the bookmarks. The builder discloses this, and the brief allowed the rule to stay in the view ("say where that rule now lives if it moves out"), so the item is met for the case the brief's test covers and not for the zero-mounted case.
- `src/lib/state/fs.svelte.ts:582-587,711`: brief item 3's "a bookmark taken away on disk" is not reachable as written. `bookmarks()` re-fetches only when `clock.round` moves, and `clock.round += 1` happens only in `invalidate()`, which the page calls for its own writes and its refresh; nothing watches `~/.oculus/bookmarks.yml`. Reproduced in the served run: the `tool.py` entry was removed from the run's bookmarks file, leaving valid YAML; after 3s unmounted and after remounting the Files view the instance still held `{"form":"bookmark","editing":"tool.py"}` with its draft. It closed (`{"form":"","editing":""}`, drafts `[]`) only after a write from the page (starring another file) invalidated the round. The builder's browser case takes the bookmark away with the row star, which is such a write.

## 2. Proof

- `agents/reviews/Q48-report.md`, Limitations, third bullet: "No path in the tree issues two concurrent saves from one form (the save button is the only entry and it is not disabled during the request), so this is not reachable today and is not covered by a test." The cited fact makes the path reachable, not unreachable. `grep -n "form_save\|disabled\|busy\|saving" src/lib/views/shared/EntryForm.svelte` prints only `340: label={t('collection.form_save')}`: the Save control carries no disabled or busy state, so a second press while the first request is out issues a second save from one form. The claim "not reachable today" is not reproduced. (Reading the settle order, the per-form mark converges in either answer order, so no wrong state was produced; the report's justification is what is wrong.)
- `agents/reviews/Q48-report.md`, "Before and after", last row: "A bookmark is taken away (row star **or on disk**) while a Files tab that is not shown holds an edit form over it ... After: Every Files instance the layout holds closes that form and forgets its draft **at once**." The on-disk half and "at once" are not reproduced; see the second Spec finding. The row is true for the row star.

## 3. Standards

- `src/lib/views/Files.svelte`, 619 lines (`wc -l`; `git show ac11faae:tools/oculus/src/lib/views/Files.svelte | wc -l` is 592). `agents/spec.md`, "The principles every package is judged on": "a file stays under 1000 lines and **a component under about 600**, split by responsibility before it grows past that". The step is what carries the file past the guide. The builder names it and says splitting touches paths the brief does not list.
- `tests/state/form-drafts.test.ts:193-196`, the case `it('takes the draft of an add form nobody typed into, which sent nothing', ...)` carries no revert of its own, and it stays green under the revert named for the block above it: with `takeFormDraft` forgetting the draft whatever it holds, `takeFormDraft('one', ADD, {})` still answers true and still clears. `agents/spec.md`: "Every new or changed test names the revert that turns it red."
- `src/lib/state/form-drafts.svelte.ts:220-223` with `:255-258`: `markKept` writes `answered.kept = { ...answered.kept, [instance]: left ? [...held, form] : held }` unconditionally, so a `false` mark adds an `[]` entry for an instance that never had one, and the `draft === undefined` branch of `settleFormDraft` (an answer landing after the tab closed) writes that entry back after `forgetForms` removed it at `src/lib/state/layout.svelte.ts:596`. The record is never trimmed again. Probe: `settleFormDraft(own, ADD, sent)` after `closeInstance(own)` answers false and `formKept` answers false, so nothing is observable through the store's API and no test covers it. `agents/spec.md`: "Every asynchronous path is exercised in flight, after close, and superseded by a later one."
- Not a finding, recorded so the orchestrator can check it off: every path that takes a tab away reaches `forgetForms`. `grep -rn "clearInstanceState" src/lib` gives `layout.svelte.ts:537` (the remove-everywhere path), `:596` (`closeInstance`), `:617` (`forgetTabs`, used by `closePane:609` and `closePage:441`) and `:814` (a preview tab retargeted); all four are the wrapper installed at `src/lib/state/context.ts:111-116`. A move between pages (`moveInstanceToPage`, `carryToPage`) calls none of them and keeps the state, which is right.

## 4. Behaviour

- A bookmark edit form whose save left text in it is exempted from the gone-bookmark close for any save, not only a rename, and the exemption does not end. `editedGone(now, marks, true)` answers false whatever made `kept` true (`src/lib/state/fs.ts:441`), and the mark is taken away only by a later `settle`, `clear` or `take`. Reproduced in the served run, two arms of one probe: the bookmark form was opened over `tool.py`, Path filled, saved through a held request, and the bookmark then taken away. With text typed while the request was out: `rows=0`, the instance still holds `{"form":"bookmark","editing":"tool.py"}`, `drafts=["<id>#forms"]`, the edit form is drawn nowhere (`form=0`), and closing the tab raises the confirmation (`asks-on-close=1`). Without the typing: `{"form":"","editing":""}`, `drafts=[]`, `asks-on-close=0`. So the tab asks about a form the reader cannot see over a bookmark that is gone, which is the symptom the step was opened to remove, now reachable by another route. The brief prescribes the rule ("it closes a form over a bookmark that is gone, not one whose text is newer than its last answer"), and the report's before/after table states only the rename case.
- A collection add form left open after its entry was added refuses its next Save. Reproduced: title typed, Save pressed, `kind` filled while the request was out, the form left open with the title unchanged; the next Save answers `not saved: title: an entry with that title is already in the file`, and the entry count under that title stays 1. The value typed while the request was out cannot be saved from that form at all; the reader has to retype it in the new entry's edit form. Neither is in the report's before/after table.
- The guarantee the base test asserted, "a second save cannot add another" (`tests/browser/unsaved-forms.spec.ts:356` at ac11faae, with its revert comment "leaves it open over the later text, so a second Save adds a second entry"), is removed with that test and is not replaced by a test. It now rests on the server refusing a duplicate identity, not on the form closing. The report does not say so.
- `taken` treats a draft typed back to exactly what the save sent as the same draft, so a form closed, reopened and retyped to the same values closes and forgets. Probe: `takeFormDraft` answers true after `sent -> newer -> sent`. The builder states this as judgment call 1.

## Not checked

- Two Files views mounted at once (two panes on one page, each with Files active) sweeping each other's instances. Read, not run: `shiftAt` is guarded by `editedGone(theirs, ...)` re-read from `instanceState(owner)` at the moment the loop reaches it, and `setInstanceState` writes `store.current` synchronously (`src/lib/state/ui.svelte.ts:302-304`), so the second component's effect sees `editing: ''` and skips. The bookmarks list the sweep measures against is client-wide (`src/lib/state/fs.svelte.ts:582`), not per instance, so one mounted view reading it for another is the same fact. No browser case exercises two mounted Files views.
- `HELP.md:65` and `DESIGN.md:334` were read and both carry the sentences the report quotes, now false in the parts the report names. Brief decision 2 keeps them out of this step; not treated as a finding.
- The spec's "grep the changed name across src, tests, config, HELP.md, DESIGN.md and README.md and quote that grep in the report" was run by the reviewer instead (`grep -rn "editedGone\|takeFormDraft\|formKept\|forgetForms\|settleFormDraft" src tests config HELP.md DESIGN.md README.md`): the only hits outside the changed files are `src/lib/state/context.ts:115`, the revert comment at `tests/browser/files-forms.spec.ts:450` and `DESIGN.md:334`. The report does not quote it.
- A/B against staged base binaries, and any look at the views on screen: not part of this run.

Reviewer usage: about 175k tokens, 34 tool uses, about 40 minutes.

## Repair round 1, refuted

```
npx vitest run --reporter=dot                (worktree)
  Test Files  249 passed (249)
       Tests  4213 passed (4213)
    Duration  91.82s          (no test timed out; no rerun needed)

npm run check
  1789685332415 COMPLETED 1217 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  > eslint .   (no output, exit 0)

npm run format:check
  All matched files use Prettier code style!

LC_ALL=C perl -ne '... ' $(find src tests bin config -type f ! -name glyphs.yml)
  (no output, exit 0)

find src tests bin -type f | xargs wc -l | sort -n | tail -3
       970 tests/state/layout.test.ts
       980 tests/state/board.test.ts
    171977 total
  wc -l src/lib/views/Files.svelte src/lib/state/fs.svelte.ts -> 577, 859 (both figures the report quotes reproduce)
  the only component over 560 lines besides Files.svelte is ui/Tabs.svelte at 596

npm run build
  exit 0

npx playwright test tests/browser/files-forms.spec.ts tests/browser/unsaved-forms.spec.ts tests/browser/files.spec.ts tests/browser/cards.spec.ts
  69 passed (3.5m)        (the report's figure)

git status --short (from inside the worktree): the same ten modified files, no new file; the ten
  +/- pairs of the report's "Files changed" table match git diff ac11faae --stat exactly.

Reverts, each in the reviewer's own clone under scratchpad/q48-review2/clone, rebuilt before each browser run:
  editedGone drops `saving`                       -> npx vitest run tests/state/explorer.test.ts: 1 failed | 21 passed
  endFormSave leaves the form in the record       -> tests/state/form-drafts.test.ts: 1 failed | 30 passed,
                                                     "marks a form while a save from it is out, one form and one instance at a time"
  EntryForm addresses every add through addFromForm (drop `landed`)
                                                  -> unsaved-forms.spec.ts: 2 failed | 16 passed, :435 and :459
  EntryForm without disabled={busy} and without `if (busy) return;`
                                                  -> unsaved-forms.spec.ts: 1 failed | 17 passed, :485,
                                                     Error: expect(locator).toBeDisabled() failed
  closeGoneForms made inert                       -> files-forms.spec.ts: 6 failed | 9 passed, :420 :458 :507 :553 :587 (+1)

Reviewer probes, own clone, removed after the run:
  P1 tab switch between the add and its answer / P2 identity retyped after the add / P3, P4 bookmark reads
     -> 3 passed, 1 passed; outputs quoted in the findings below
  node probe over the venues shape (createEntry then writeEntry addressed by the identity value)
     -> addressed by the identity value: {"found":false,"changed":[],"refused":[]}
        addressed by the entry id:       {"found":true,"changed":["name"],...}
```

- `src/lib/views/shared/EntryForm.svelte:255` against the brief's item 3 and the plan's Q48 line ("the Files gone-bookmark close keeps a value typed during a rename save"): as built the value is kept only while the request is out and is discarded when it lands. Reproduced by the case the builder wrote and my run passes, `tests/browser/files-forms.spec.ts:458`: after the answer the instance holds `{form:'',editing:''}`, `draftKeys` is `[]` and the edit form is drawn nowhere, and the typed Path was never in the request, so it is on screen nowhere and in the drafts record nowhere. The reader loses what they typed. Nothing carries the form onto the bookmark's new id. It follows from ruling 4 and the builder states it; the brief's acceptance item is not met in the end state. Under Spec.

- `src/lib/views/shared/EntryForm.svelte:119` (`let landed = $state('')`) with `:255`: `landed` lives in the component, so a tab switch between the add and its answer loses it and the defect ruling 5 closed is reachable again. Probe P1: title typed, Save pressed, `kind` filled, the Tasks tab switched away before the answer landed, then back. The add form is still open holding `kind = "typed while the save was out"`, the next Save answers `not saved: title: an entry with that title is already in the file`, the file holds one entry carrying only the title, and the draft stays (`["...#forms"]`). The report's decision 5 justifies the placement by a form "closed and reopened", and does not name the tab switch; `agents/spec.md` asks every asynchronous path to be exercised "in flight, after close, and superseded by a later one". Under Behaviour.

- `src/lib/views/shared/EntryForm.svelte:251-257`: the add form left open by its answer renames the entry it added when the reader retypes the identity field, instead of adding the second entry they mean, and the form still reads as an add (`data-form="add"`). Probe P2: title retyped to "A second task the reader means to add" while the first save was out; after Save the answer is `saved title`, the first title is gone from the file (0 entries) and one entry stands under the new title. Before this round that second Save was an add. Not in the report's corrected before-and-after table. Under Behaviour.

- `src/lib/views/shared/EntryForm.svelte:255` with `src/lib/server/writes/entries.ts:160-168` and `:318`: `landed` is the identity field's own value, but the server finds an entry by `entryId`, which prefers `id`, then `key`, then `title`, and only then the identity field. The node probe above adds `{name, id}` to a venues-shaped file and then addresses it by the name: `found:false`, which `src/lib/server/writes.ts:267-269` turns into `404 no entry <name> in venues`. `registries/venues.yml:15-16` on this hub is exactly that shape (schema opens with `name`, carries `id`) and its entries carry `id:`, so the report's limitation "no collection in the tree is shaped that way" does not hold, and the reader who types into a venues add form while its save is out cannot save those words from that form at all. `demo/registries/venues.yml` opens with `id`, so the browser suite cannot reach it. Under Proof.

- `src/lib/state/fs.svelte.ts:642`: the `closeGoneForms(held.bookmarks)` in the not-ok branch can close nothing. `editedGone` answers false whenever `marks.error !== ''` (`src/lib/state/fs.ts:443`) and that branch always sets a non-empty error (`typeof body.error === 'string' ? body.error : String(response.status)`, and every error body `src/lib/server/fs.ts:313-374` answers is a non-empty word). If a not-ok body ever carried `error: ""` the call would instead sweep every bookmark form against `NO_BOOKMARKS.entries`, which is `[]` (`src/lib/state/fs.svelte.ts:140`), and close them all over a read that failed. Under Standards.

- `src/lib/state/context.ts:152-155`: the instance-state merge is copied from `patchAt` (`src/lib/views/Files.svelte:212-215`) rather than reused, a third copy beside `src/lib/views/Repositories.svelte:86` (`grep -rn "Array.isArray(kept)" src/lib` gives those three). The round moved `shiftAt` out of the view and left the four lines behind it duplicated. Under Standards.

- `src/lib/state/writes.svelte.ts:363-408` with `src/lib/views/shared/EntryForm.svelte:361-362`: a save that never answers leaves the Save control disabled for good. `send` has no timeout and no abort, so `busy` never clears; Cancel still closes the form and forgets the draft, and a reload frees the control because the mark is not persisted. The report's corrected Limitations do not name it. Under Behaviour.

Checked and not findings: the `saving` mark over two forms of one instance, a tab closed mid-flight and a page closed mid-flight (`forgetForms` reaches all four close paths through the wrapper at `src/lib/state/context.ts:119-123`, and `endFormSave` returns early for an instance that is gone); an answer that throws (`send` catches everything and resolves with `ok:false`, and `.finally` clears the mark either way). Ruling 3's keyboard case: `EntryForm.svelte` has no `<form>`, no `onsubmit` and no `onkeydown`, so Enter in a field never saves, and a native disabled button takes no keyboard press; the dispatched click is covered by `:485`. `closeGoneForms` with two Files views mounted runs once, since `schedule` (`src/lib/state/fs.svelte.ts:377-384`) dedupes by `<round>:bookmarks`. A Files instance restored with a stale `editing` is swept: probe P4 counted one `GET /api/fs?bookmarks=1` at boot with only the Status tab on the page and one more over a reload, because `src/routes/+page.svelte:99` reads the bookmarks for the rail whatever is drawn. The sweep's move rule exists once: `bookmarkLeft` is called only at `context.ts:146`, and `Files.svelte:372` goes through `shiftForms`; `Files.svelte:341`'s `patchAt` is the root and workspace line form, not the bookmark form. `t('editor.saving')` is an existing key in a group the form already reads (`config/text/views/editor.yml:21`), and `ToolButton` takes `title` (`src/lib/ui/ToolButton.svelte:28,133`).

Not checked: an A/B against the staged base binaries; any look at the views on screen; `HELP.md:65` and `DESIGN.md:334`, which brief decision 2 keeps out of the step and whose replacement text the report carries.

Reviewer usage: 42 tool uses, about 30 minutes (00:45 to 01:12).

---

# The run over repair round 2 (reviewer a5d6d9121496a9b99, 02:04 to 02:49)

```
npx vitest run --reporter=dot                            (worktree, tools/oculus)
  Test Files  1 failed | 248 passed (249)
       Tests  1 failed | 4222 passed (4223)    Duration 114.44s
  the one red is tests/server/git.test.ts > "carries the newest commits, newest first, capped at
  the constant", Error: Test timed out in 5000ms; outside this step's diff. Rerun alone as a file:
  npx vitest run tests/server/git.test.ts --reporter=dot -> Tests 1 failed | 33 passed (34), 29.26s
  Rerun as the single test: npx vitest run tests/server/git.test.ts -t "carries the newest commits"
  -> 1 passed, tests 4.87s of a 5000ms budget. Pre-existing and marginal, not the step's.

npm run check
  1789690139611 COMPLETED 1217 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  > eslint .   (no output, exit 0)

npm run format:check
  All matched files use Prettier code style!

LC_ALL=C perl -ne '...' $(find src tests bin config -type f ! -name glyphs.yml)
  (no output, exit 0)

find src tests bin -type f | xargs wc -l | sort -n | tail -3
       970 tests/state/layout.test.ts
       980 tests/state/board.test.ts
    172457 total
  wc -l: src/lib/views/Files.svelte 587 (the report's figure), state/fs.svelte.ts 861,
  state/form-drafts.svelte.ts 552, views/shared/EntryForm.svelte 481, state/fs.ts 664

npm run build                                            exit 0

npx playwright test files-forms unsaved-forms files cards
  71 passed (3.4m)                                       (the report's figure)

git status --short (from inside the worktree): the same twelve modified files, no new file; the
  twelve rows of the report's "Files changed" table match git diff ac11faae --stat exactly
  (1211 insertions, 67 deletions).

grep -rn "Array.isArray(kept)" src/lib -> src/lib/state/fs.ts:456 and
  src/lib/views/Repositories.svelte:86 only (the report's figure); patchedFilesView is read by
  src/lib/views/Files.svelte:214 and src/lib/state/context.ts:155, both callers.

Machine-readable reverts, each applied at the line its comment names, in the reviewer's own clone
under scratchpad/q48-review3/clone (never in the worktree), restored and diffed clean after:
  fs.ts:457 => return { ...part };                       -> explorer 1 failed | 22 passed
  fs.ts:443 => if (marks.loading || marks.error !== '')  -> explorer 1 failed | 22 passed
  form-drafts.svelte.ts:66 => ['title','id','key']       -> form-drafts 1 failed | 38 passed
  form-drafts.svelte.ts:279 => return null;              -> form-drafts 3 failed | 36 passed
  form-drafts.svelte.ts:356 => if (false) forgetAdded... -> form-drafts 1 failed | 38 passed
  form-drafts.svelte.ts:372 => if (true) return;         -> form-drafts 1 failed | 38 passed
  form-drafts.svelte.ts:509 => held.added = {...held.added} -> form-drafts 1 failed | 38 passed
  fs.svelte.ts:642 => closeGoneForms(held.bookmarks); return; -> fs.test 1 failed | 51 passed
  Files.svelte:449 => onrenamed={() => undefined}        -> files-forms 4 failed | 11 passed
  EntryForm.svelte:253 => entry === null ? '' : entry.id -> unsaved-forms 3 failed | 17 passed
  EntryForm.svelte:253 => (made?.id ?? '')               -> unsaved-forms 1 failed | 19 passed
  Every one turns the test its comment names red.
```

## Findings

1. `src/lib/state/fs.svelte.ts:655` with `:651-653` and the comment at `:661-665`: ruling 5a is closed on the not-ok branch only. The `catch` branch writes `held.bookmarks = { ...NO_BOOKMARKS, error: reasonOf(error), loading: false }` and does not return, so it falls through to the tail `closeGoneForms(held.bookmarks)`; `reasonOf` (`:753`) answers `''` for a thrown `Error('')` or a thrown `''`, and the only guard left is `editedGone`'s `marks.error !== ''` (`src/lib/state/fs.ts:443`). Reproduced: with `fetch` rejecting `new Error('')`, an instance holding `{form:'bookmark',editing:'manual'}` becomes `{"form":"","editing":"","typed":"","opening":1}`, its draft forgotten, over a read that never answered. The comment above `closeGoneForms` is false for that branch and no test covers it. Under Standards.

2. `src/lib/views/shared/EntryForm.svelte:282-293` (`renamed`): a rename whose new id is another bookmark's id leaves the form open over an id that names two entries and unsavable from then on. Probe P1: the write answers `saved label`, the instance goes to `{"form":"bookmark","editing":"notes.md"}`, and the next Save answers `not saved: label: two entries share the label notes.md, so a write cannot address one of them`. The duplicate is the server's (`sharedIdentity`); what the round adds is carrying the open form and its draft onto the colliding id. Not in the report's table or Limitations. Under Behaviour.

3. `tests/state/form-drafts.test.ts:553`, `:560`, `:572`: three new tests carry no revert, which is the round-1 finding ruled closed reopened in the same round. `agents/spec.md:54`. Under Standards.

4. `agents/reviews/Q48-report.md`, "Ruling 4": the pin claim is not reproduced for one of the three reorderings. With `writtenId` reading `['key','id','title']`, `npx vitest run tests/state/form-drafts.test.ts` gives 39 passed: none of the five pinned shapes carries both `id` and `key`. The rule itself is right on this tree: `writtenId` equals `idOfIdentity` for every entry of all twelve real hub collection files. Under Proof.

5. `agents/reviews/Q48-report.md`: the spec's `agents/spec.md:55` grep is quoted only for `Array.isArray(kept)`, not for this round's names. The reviewer ran it: the only hit outside the changed files is `DESIGN.md:334`, whose replacement text the report's Doc text section carries. No code change is owed. Under Standards.

## Checked and not findings

Ruling 1's other three cases (P2 a refused rename, P3 a second bookmark form on another page, P4 a case-only rename); ruling 2's persistence (P5 reload, P6 tab close, P7 page and pane close, P8 the entry deleted between the add and the second save); ruling 3 (P9 the identity typed back, P10 whitespace); ruling 5b `patchedFilesView` as the one merge for both callers; the disabled Save control over a never-answering write (P11), which the report states under Limitations. The delta's new comments carry no date, package id or earlier-state history.

Not checked: an A/B against the staged base binaries; any look at the views on screen; `HELP.md:65` and `DESIGN.md:334`, which brief decision 2 keeps out of the step.

Reviewer usage: 104 tool uses, 240,612 tokens, about 46 minutes (02:03 to 02:49).
