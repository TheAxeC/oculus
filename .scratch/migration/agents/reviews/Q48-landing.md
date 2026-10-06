# Landing report: Q48

## Open items at this landing (verbatim from the state file)

- A write that never answers (raised 2026-09-18 02:03 by Q48's second round): `state/writes.svelte.ts`'s `send` has no timeout and no abort, so a request that never comes back leaves that form's Save control disabled until Cancel or a reload. Closing it means choosing how long a write may take before the page gives up, which is a user-visible duration nothing in `config/` names, so it is Axel's to rule. Recommended: a write gives up after 30 seconds and says so in the form's own refusal line, the duration living beside the other timeouts in `config/behavior.yml` so it can be changed without a build. The lazy option here would be leaving it stated as a limitation, which is what the round did.

That is the only ruling waiting. Also awaiting his word, from before this step: whether to delete the 649,088 leftover `oculus-*` temp directories under `$TMPDIR` that R14's scratch work found.

## NOT DONE

Nothing of the step itself. The one thing this landing did not close is the open item above: a write still has no timeout, so a save whose request never answers leaves that form's Save control disabled until Cancel or a reload.

## What landed

Q48 landed 2026-09-18 03:56 from worktree `q48` at base 7b902143 by `land.sh --no-browser`, after one review (nine rulings), a repair round, a second review (five rulings), a second round under the cap's one exception, and a third review whose five findings were all closed at this landing.

What the step built: an add form forgets its draft and closes only while the draft is still what the save sent, and a form left open goes on writing the entry it added, kept beside the draft under `<id>#added`, until its identity field is typed away from that entry; the Save control is not pressable while its own save is out; the gone-bookmark close moved into the fs store, over every file browser the layout holds, for a read that answered and no other, leaving a form a save of its own is out from; a bookmark form whose save renames its bookmark is carried onto the new id with its draft.

Fixes at landing, all in the worktree before the cherry-pick, each with the command that proves it:

- The catch branch of `loadBookmarks` (`src/lib/state/fs.svelte.ts:654`) returns, so a read that threw no longer falls through to the sweep. Finding 1 of the third review reproduced a thrown `Error('')` closing every bookmark form. New case `closes no bookmark form over a read that never answered at all` in `tests/state/fs.test.ts`, red with the `return` removed (1 failed of 53), green with it (53 passed).
- A write of a collection entry answers with the id the file gives that entry: `WriteOutcome.id` set by `writeEntry` and `createEntry` from their own `entryId`, carried in the endpoint's JSON by `answer()` and read into `WriteAnswer`. `EntryForm.svelte` reads `answer.id`, and the client's copy of the server's id rule (`writtenId`, its test and its fixture) is deleted: `grep -rn writtenId src tests` finds nothing. New case `says the id the entry has after the write, which a write of the identity field moves` in `tests/server/writes.test.ts`, red with the outcome's `id` line removed. This closes finding 4, which showed the pin test could not see an id/key swap.
- A write that would set an entry's identity field to a value another entry of the same file already carries is refused, naming that field (`src/lib/server/writes/entries.ts:323`). Finding 2 showed a bookmark rename onto another bookmark's label leaving the form open over an id naming two entries and unsavable from then on. New case `refuses a write that moves an entry onto another entry of the same file`, red with the guard disabled.
- The three tests the review found without a revert (`tests/state/form-drafts.test.ts`) were given theirs and each revert was run: the `keep` gone check (2 failed, the named case among them), `parseAdded`'s three guards (1 failed), `addedKey`'s own suffix (2 failed, the named case among them).
- Finding 5 owed no code change: the reviewer ran the spec's grep over every name this round changed and the only hit outside the changed files is `DESIGN.md:334`, rewritten here.

Documents, edited on main at the landing as brief decision 2 reserved: `HELP.md:65`'s drafts clause and the two clauses of `DESIGN.md`'s unsaved-form-input decision now say what the code does, and a new dated decision line records the write answer carrying the entry id and the duplicate-identity refusal.

## Verification on main

- `npm test -- --reporter=dot`: 251 files, 4,265 tests, 1 red, `tests/server/watch/git.test.ts > reads a root added to the workspaces file while it is running`, a known load flake; green alone, `npx vitest run tests/server/watch/git.test.ts` 22 passed.
- `npm run check`: 1,222 files, 0 errors, 0 warnings. `npm run lint`: clean. `npm run format:check`: clean. The ASCII gate over `src tests bin config`: nothing. `npm run build`: exit 0.
- In the worktree before the cherry-pick: the whole suite 4,225 passed, and `npx playwright test files-forms unsaved-forms files cards` 79 passed (4.0m).

## The look

Taken 2026-09-18 03:45 on the TEST page of Axel's Chrome, on his running dev server. A bookmark was made on `README.md`, its edit form opened, the Label renamed and a value typed into Path while the save was out: the write answered `{"ok":true,"changed":["label"],"refused":[],"id":"Hub readme three"}`, the form stayed open over the bookmark under its new name with `README.md typed while saving` still in Path, the tab drew its unsaved mark, and `saved label` was said. The bookmark was then deleted, so `GET /api/fs?bookmarks=1` answers with no entries, as before the look.

## Where the proof is

- The step's brief: `agents/briefs/Q48.md`.
- The builder's report and its two repair rounds: `agents/reviews/Q48-report.md`.
- The three reviews, with what each found and how it was closed: `agents/reviews/Q48-refuter.md`.
