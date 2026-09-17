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
