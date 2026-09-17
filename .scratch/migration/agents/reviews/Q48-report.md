# Q48 report

Everything in the brief is done.

## What the stopped builder already covered, and what was left

Already on the tree when I took over: `taken` on `DraftTarget`, `whole()` and `takeFormDraft` in `form-drafts.svelte.ts`, the `kept` mark (`formKept`/`forgetForms` plus the `markKept` calls in `settleFormDraft`/`clearFormDraft`), the `forgetForms` wiring in `context.ts`, the `kept` parameter of `editedGone` in `fs.ts`, the `browsers()`/`shiftAt()` sweep in `Files.svelte`, and all nine tests (node and browser). Left undone: the `save()` branch in `EntryForm.svelte` still ran `into.clear(which); onclose();` unconditionally, so nothing the rest was built for took effect. That one branch is what I wrote, then I ran every verification command and every revert.

```svelte
// src/lib/views/shared/EntryForm.svelte:233
        if (entry === null) {
            if (into.taken(which, sent)) onclose();
        } else if (!into.settle(which, sent)) {
            onclose();
        }
```

## DONE / NOT DONE

| Item | State | Command and output |
| --- | --- | --- |
| 1. One settle rule for both branches | DONE | `npx vitest run --reporter=dot`: `Test Files 249 passed (249) / Tests 4214 passed (4214)`; `tests/state/form-drafts.test.ts` cases "takes an add's draft only while it is still what was sent, whole", "takes the draft of an add form nobody typed into, which sent nothing" |
| 2. Bookmark add form and collection add forms both under it | DONE | `npx playwright test tests/browser/files-forms.spec.ts tests/browser/unsaved-forms.spec.ts tests/browser/files.spec.ts tests/browser/cards.spec.ts`: `64 passed (1.8m)`, including files-forms.spec.ts:414, unsaved-forms.spec.ts:376, :398, :358 |
| 3. Gone-bookmark close keeps text typed during a rename save | DONE | same playwright run, files-forms.spec.ts:451; `npx vitest run tests/state/explorer.test.ts`, case "leaves the form whose last answer left text in it, which a rename is" |
| 3. Gone-bookmark close runs for an unshown tab | DONE | same playwright run, files-forms.spec.ts:485 "a bookmark taken away closes the form of a file browser whose tab is not shown" |
| 4. Each new or changed test names its revert, run | DONE | seven reverts run, table below |
| `npx vitest run --reporter=dot` | DONE | `Test Files 249 passed (249) / Tests 4214 passed (4214)`, `Duration 55.11s`; no rerun needed, no timeout |
| `npm run check` | DONE | `COMPLETED 1217 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run build` | DONE | `done` |
| `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| `npm run lint` | DONE | `eslint .`, exit 0, no output |
| ASCII gate | DONE | the amendment's perl one-liner over `find src tests bin config -type f ! -name glyphs.yml` printed nothing, exit 0 |
| Browser suite | DONE | `64 passed (1.8m)` |

## The reverts, each run

| Revert as the test names it | Tests it turned red | Command and output |
| --- | --- | --- |
| In `takeFormDraft` of `state/form-drafts.svelte.ts`, forget the draft whatever it holds (and the same in `localDrafts`) | "takes an add's draft only while it is still what was sent, whole"; "takes an add's draft only while it is what was sent, as an instance's target does" | `npx vitest run tests/state/form-drafts.test.ts`: `Tests 2 failed | 30 passed (32)`, `expected true to be false` |
| In `settleFormDraft`, drop the `markKept` calls | "marks the form its answer left text in, and unmarks it when the text goes"; "unmarks the form when the reader closes it"; "forgets the marks of a tab the layout closed" | same file: `Tests 3 failed | 29 passed (32)`, `expected false to be true` at line 234 |
| In `clearFormDraft`, drop the `markKept` call | "unmarks the form when the reader closes it" | same file: `Tests 1 failed | 31 passed (32)`, `expected true to be false` |
| In `createClientState` of `state/context.ts`, drop the `forgetForms` call | "forgets the marks of a tab the layout closed" | same file: `Tests 1 failed | 31 passed (32)`, `expected true to be false` |
| In `editedGone` of `state/fs.ts`, drop `kept` from the line that answers false | node: "leaves the form whose last answer left text in it, which a rename is"; browser: "a bookmark renamed by its form keeps what was typed while the save was out" | `npx vitest run tests/state/explorer.test.ts`: `Tests 1 failed | 21 passed (22)`. `npm run build` then `npx playwright test tests/browser/files-forms.spec.ts -g '...'`: `1 failed`, `expect(received).toHaveLength(1) / Received length: 0` at files-forms.spec.ts:471 |
| In `save()` of `EntryForm.svelte`, `into.clear(which); onclose();` in place of `into.taken(which, sent)` | "a bookmark add form typed on while its save was out keeps the typing, open over it"; "an add form keeps a value typed while its save was on its way, open over it"; "an add form closed and opened again while its save was out keeps its new text" | `npm run build` then playwright `-g` over the three: `3 failed`, `toHaveCount(1)` against `0` |
| In `save()`, leave the add form open on every answer (`into.taken(which, sent);` with no close) | "an add form nothing touched while its save was out closes once its entry is added" | `npm run build` then playwright: `1 failed`, `toHaveCount(0)` with `locator resolved to 1 element` at unsaved-forms.spec.ts:369 |
| In the `$effect` of `views/Files.svelte`, read `view` and `instance.id` in place of every browser `browsers()` names | "a bookmark taken away closes the form of a file browser whose tab is not shown" | same build and run: `1 failed` |

Every source file was restored from a scratchpad copy after each revert and `diff -q` against that copy printed nothing; the final `git diff --numstat` matches the table below and the whole verification list was rerun on the restored tree.

## Doc text (nothing edited, per brief decision 2)

Two sentences are now false in part and the brief's decision 2 keeps them out of this step.

`tools/oculus/HELP.md:65`, the clause at the end of the drafts sentence:

> Cancel, the view's Add or Edit control closing the form, a delete, a save and Revert let them go; a value typed into an edit form while its save is on its way is kept, in the form left open, and an add form closes once its entry is added.

What it should say now: an add form closes once its entry is added only while nothing touched it since the save went; a value typed into either form while its save is on its way is kept, in the form left open, and so is the text of an add form closed and opened again while its save was out.

`tools/oculus/DESIGN.md:334`, inside the 2026-09-17 decision on unsaved form input, two clauses:

> A press that closes or moves the bookmark form forgets its draft through `toggleAdd` or `toggleEdit` under the `bookmarks` collection key, and so does the edited bookmark leaving the loaded list (`editedGone`).

> Cancel, a form's close by the view's Add or Edit control, a delete, Revert and a save forget the draft, an edit's save keeping what was typed after it went, and an add form closing once its entry is added.

What they should say now: `editedGone` leaves a form whose last answer left text in it, since a rename writes the bookmark under another id; the sweep runs over every Files instance the layout holds, not the mounted one alone; and an add's save forgets its draft and closes the form only while the draft is still what the save sent (`takeFormDraft`), keeping what was typed or reopened while the request was out.

## Before and after, every visible change

| What the reader does | Before | After |
| --- | --- | --- |
| Types into a collection add form (Tasks, Venues, ...), presses Save, types more while the request is out | The answer closed the form and the newer typing was gone | The form stays open holding the newer typing; the entry is still added once |
| Closes the add form during its save, opens it again, types something new | The answer closed the reopened form and forgot its text | The reopened form stays with its text |
| Types into the Files bookmark add form, saves, types more while the request is out | The answer closed the form and the typing was gone | The form stays open with the typing |
| Saves an add form and touches nothing while the request is out | Closes on its answer | Unchanged: closes on its answer, no draft left |
| Renames a bookmark from its edit form, types into Path while the save is out | The renamed bookmark left the list, the gone-bookmark effect closed the form and the typing was gone | The form stays over the old id with the typing; the bookmark is renamed on disk |
| A bookmark is taken away (row star or on disk) while a Files tab that is not shown holds an edit form over it | That tab kept its form and its draft until the reader came back to it, and asked before closing over text it no longer showed | Every Files instance the layout holds closes that form and forgets its draft at once |

## Files changed

| File | + | - |
| --- | --- | --- |
| `tools/oculus/src/lib/state/context.ts` | 2 | 1 |
| `tools/oculus/src/lib/state/form-drafts.svelte.ts` | 79 | 3 |
| `tools/oculus/src/lib/state/fs.ts` | 7 | 2 |
| `tools/oculus/src/lib/views/Files.svelte` | 39 | 12 |
| `tools/oculus/src/lib/views/shared/EntryForm.svelte` | 4 | 3 |
| `tools/oculus/tests/browser/files-forms.spec.ts` | 111 | 1 |
| `tools/oculus/tests/browser/unsaved-forms.spec.ts` | 52 | 6 |
| `tools/oculus/tests/state/explorer.test.ts` | 20 | 10 |
| `tools/oculus/tests/state/form-drafts.test.ts` | 88 | 0 |

`src/lib/state/form-values.ts`, `src/lib/state/fs.svelte.ts`, `src/lib/views/files/BookmarkForm.svelte` and `src/lib/state/open-forms.ts` are in the brief's path list and were not touched; nothing outside the list was.

## Judgment calls the brief did not cover, each reversible

1. **The one call added to the draft target is `taken(form, sent)`** (brief item 1 allows it). It forgets the draft and answers true only when the draft is what the save sent and nothing else: the same key set, each value equal by `JSON.stringify`. A form closed and reopened and then typed back to exactly the same fields and values counts as the same draft and closes.
2. **The `kept` mark is in-memory `$state` in the drafts store**, not in the ui store, so it is not saved with the layout and a reload starts with no form marked. New public members of `FormDraftsStore`: `takeFormDraft`, `formKept`, `forgetForms`. No config key, no catalog key, no text change.
3. **The gone-bookmark rule stayed in `Files.svelte`'s effect** rather than moving to a state module; the effect now sweeps every Files instance the layout holds through `pages()` and `tabsOf` and reads each one's state with `instanceState`. The bookmarks list it measures against (`bookmarks()` in `state/fs.svelte.ts:582`) is client-wide, not per instance, so one mounted view reading it for all of them is the same fact.

## Limitations and sharp edges

- **The sweep needs one Files view mounted somewhere.** It is an `$effect` of the component, so if no page has a Files tab as its active tab, no instance's gone-bookmark form is closed until some Files view mounts again. The brief's case (a hidden tab while another Files view is on screen) is covered and proven by files-forms.spec.ts:485; the zero-mounted case is not, and moving the rule into a state module is what would close it.
- **`src/lib/views/Files.svelte` is now 619 lines** (`wc -l`), past the spec's "a component under about 600". Splitting it touches paths this brief does not name.
- **The `kept` mark is per form key, not per save.** Two saves out from the same form at once leave one mark; the second answer overwrites what the first set. No path in the tree issues two concurrent saves from one form (the save button is the only entry and it is not disabled during the request), so this is not reachable today and is not covered by a test.
- **A reload during an add save loses the protection**, since the mark is not persisted: the answer cannot arrive after a reload either, so nothing is lost by it, but the asymmetry with the persisted drafts is worth knowing.
- `HELP.md` and `DESIGN.md` carry the stale sentences quoted above; the brief keeps them out of this step.

All nine rulings are done. One premise in ruling 4 does not hold on this tree and changes what the rename case can do: read the first paragraph under "Ruling 4" below before the table.

# Repair round

| Ruling | State | Command and output |
| --- | --- | --- |
| 1. The sweep runs where the state is | DONE | `npx playwright test tests/browser/files-forms.spec.ts`: `15 passed (56.9s)`, including `:553 a bookmark taken away closes its form with no file browser on screen at all` and `:587 ... whose tab is not shown` |
| 2. "Taken away on disk" is out of scope | DONE | report-only; the before-and-after row is corrected below |
| 3. A second Save while the first is out | DONE | `npx playwright test tests/browser/unsaved-forms.spec.ts`: `18 passed`, `:485 the Save control is not pressable while its own save is out, and adds nothing twice` |
| 4. The exemption ends with the save that earned it | DONE | same run, `:458 a bookmark renamed by its form keeps what was typed until the answer lands, and closes then` and `:507 a bookmark taken away while a save from its form is out leaves the form until it lands`; node `npx vitest run tests/state/explorer.test.ts`: `leaves the form a save of its own is out from until that answer lands` |
| 5. An add form takes the entry it added | DONE | `:435 an add form left open by its answer writes the entry it added, not a second one` |
| 6. The base test's guarantee replaced | DONE | `:459 a second save from the add form that added an entry adds no second entry` |
| 7. `markKept` wrote an entry back after the tab was gone | DONE | `markKept` is gone; `endFormSave` only ever removes and drops the instance key with its last form. `npx vitest run tests/state/form-drafts.test.ts`: `leaves no save mark for a tab the layout closed, whenever the answer lands` |
| 8. `form-drafts.test.ts:193-196` named no revert | DONE | folded into the case above it (`takes an add's draft only while it is still what was sent, whole`), which the block's revert turns red |
| 9. `taken` treats a retyped draft as the same draft | DONE | kept as built, named in the decisions below |

## Ruling 4: the premise, and what the rename case now does

The parenthetical "the entry reappears under its new id before the answer lands" is not what this tree does. Nothing watches `~/.oculus/bookmarks.yml`; the bookmarks list is re-read only when `invalidate()` moves the round (`src/lib/state/fs.svelte.ts:744`), and the entry form's own save reaches that through `said(answer)` -> `onsaid` -> `bookmarksChanged()` at `src/lib/views/Files.svelte:478`, which runs **after** the write's answer. So on a rename the old id is still in the list for the whole flight, and it leaves the list only on the refetch the answer starts.

Under the rule you gave (the exemption ends when the save's answer lands), the consequence is: **a rename from the bookmark form now closes that form once the answer lands, and the text typed while the save was out is forgotten with it.** The entry is under its new id, the form has nothing to draw (`markForm` at `src/lib/views/Files.svelte:169` needs `editedMark`), and the tab no longer asks about text it cannot show, which is the symptom the review named. The brief's item 3 wording ("keeps a value typed while a rename save is out") therefore now means "until that save is answered", not "past it". I built the ruling, not the brief's wording, and the browser case `:458` asserts both halves.

The exemption is still live and load-bearing where the list is refreshed by something else during the flight: `:507` holds only the form's own write, stars the bookmark off while that write is out, and proves the opening and the draft survive until the answer lands, then go.

## What changed in the code

The `kept` mark (a form whose last answer left text in it) is replaced by a `saving` mark (a form a save is out from), in `src/lib/state/form-drafts.svelte.ts`:

```ts
    function endFormSave(instance: string, form: string): void {
        const held = formsSaving(instance);
        if (!held.includes(form)) return;
        const left = held.filter((one) => one !== form);
        const kept = Object.fromEntries(
            Object.entries(sending.forms).filter(([id]) => id !== instance)
        );
        sending.forms = left.length === 0 ? kept : { ...kept, [instance]: left };
    }
```

The form says so around its own request, and the Save control reads it (`src/lib/views/shared/EntryForm.svelte:230`):

```ts
        const addressed = entry === null ? landed : entry.id;
        into.beginSave(which);
        const answer = await (addressed === ''
            ? addFromForm(client.writes, collection, wanted, onadd)
            : writeEntry(collection, addressed, wanted)
        ).finally(() => into.endSave(which));
```

The sweep left the view. `createFs` now takes a `BookmarkForms` (`src/lib/state/fs.svelte.ts:63`) built in `src/lib/state/context.ts:133`, and every bookmarks answer runs it (`fs.svelte.ts:664`):

```ts
    function closeGoneForms(marks: BookmarksState): void {
        for (const one of forms.browsers()) {
            const saving = forms.saving(one.id, one.forms.editing);
            if (!editedGone(one.forms, marks, saving)) continue;
            forms.shift(one.id, one.forms, editShown(one.forms, one.forms.editing));
        }
    }
```

`Files.svelte` lost the `$effect`, `browsers()` and `shiftAt()`, and moves its own forms through the same `shift` (`fs.shiftForms`), so the move rule exists once. The view is down to 577 lines from 619, under the spec's "a component under about 600": **Q58 no longer has anything to split**, unless it was booked for something else.

## The reverts, each run

| Revert | Tests it turned red | Command and output |
| --- | --- | --- |
| `takeFormDraft` and `localDrafts.taken` without the `whole()` guard | `takes an add's draft only while it is still what was sent, whole`; `... as an instance's target does` | `npx vitest run tests/state/form-drafts.test.ts`: `Tests 2 failed | 29 passed (31)` |
| `endFormSave` leaves the form in the record | `marks a form while a save from it is out, one form and one instance at a time` | same file: `Tests 1 failed | 30 passed (31)` |
| `localDrafts.beginSave` records nothing | `says a save from one of its forms is out, as an instance's target does` | same file: `Tests 1 failed | 30 passed (31)` |
| `context.ts` drops `forgetForms` | `leaves no save mark for a tab the layout closed, whenever the answer lands` | same file: `Tests 1 failed | 30 passed (31)` |
| `editedGone` drops `saving` | node `leaves the form a save of its own is out from until that answer lands`; browser `:507` | `npx vitest run tests/state/explorer.test.ts`: `Tests 1 failed | 21 passed (22)`; `npm run build` then `npx playwright test ... -g '...'`: `1 failed` |
| `EntryForm` never ends the save (drop `.finally(() => into.endSave(which))`) | browser `:458` | `1 failed` |
| the sweep back in an `$effect` of the mounted view over its own instance, `closeGoneForms` inert | browser `:553`, `:587` | `2 failed` |
| `EntryForm` add branch `into.clear(which); onclose();` | browser `:420`, `:377`, `:399` | `3 failed` |
| `EntryForm` add branch with no close | browser `:359` | `1 failed` |
| `EntryForm` addresses every add through `addFromForm`, ignoring `landed` | browser `:435`, `:459` | `3 failed` (with the next row, which touches no test of these two) |
| `EntryForm` without `disabled={busy}` and without `if (busy) return;` | browser `:485` | same run, `Error: expect(locator).toBeDisabled() failed` |

Every source file was restored from a scratchpad copy and `diff -q` against it printed `restored` for all six.

## Verify before you report, on the final tree

| Command | Output |
| --- | --- |
| `npx vitest run --reporter=dot` | `Test Files 249 passed (249) / Tests 4213 passed (4213)`, `Duration 81.58s`. The first run of this command had `tests/server/mail/poll.test.ts` fail 2 (a watcher that waits on a timeout, in no path of this step); rerun alone `npx vitest run tests/server/mail/poll.test.ts`: `Test Files 1 passed (1) / Tests 10 passed (10)`, and green again in the full rerun quoted here |
| `npm run check` | `COMPLETED 1217 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run build` | `✔ done` |
| `npm run format:check` | `All matched files use Prettier code style!` |
| `npm run lint` | `eslint .`, exit 0, no output |
| ASCII gate (the amendment's perl one-liner) | printed nothing, exit 0 |
| `npx playwright test tests/browser/files-forms.spec.ts tests/browser/unsaved-forms.spec.ts tests/browser/files.spec.ts tests/browser/cards.spec.ts` | `69 passed (2.3m)` |

Name grep across `src tests config HELP.md DESIGN.md README.md` for `editedGone|closeGoneForms|shiftForms|formsSaving|beginFormSave|endFormSave|forgetForms|formKept|markKept|BookmarkForms|FILES_VIEW`: no hit for `formKept` or `markKept` anywhere; the only hits outside the changed files are `DESIGN.md:334` (quoted below) and the revert comments in `tests/browser/files-forms.spec.ts`.

## Corrected before-and-after

| What the reader does | Before | After |
| --- | --- | --- |
| Types into a collection add form, saves, types more while the request is out | The answer closed the form and the newer typing was gone | The form stays open holding the newer typing, and it now edits the entry it added: the next Save writes that entry |
| Closes the add form during its save, opens it again, types something new | The answer closed the reopened form and forgot its text | The reopened form stays with its text, and adds an entry of its own when saved |
| Presses Save twice while the first request is out | Both presses issued a save | The control is not pressable while its save is out, and a press dispatched at it anyway is turned away: one write, one entry |
| Types into the Files bookmark add form, saves, types more while the request is out | The answer closed the form and the typing was gone | The form stays open with the typing |
| Saves an add form and touches nothing while the request is out | Closes on its answer | Unchanged: closes on its answer, no draft left |
| Renames a bookmark from its form and types into Path while the save is out | The form stayed open over the old id for good, drawing nothing, and its tab asked about text it did not show | The opening and the draft are kept while the save is out; once the answer lands the bookmark is under its new id, the form closes and the draft goes |
| A bookmark is taken away by the row star, or by any other write from the page, while a save from its form is out | The form was closed and the draft forgotten under the reader's typing | The opening and the draft are kept until that answer lands, then the form closes |
| A bookmark is taken away by the row star, or by any write from the page, while a Files tab that is not shown holds a form over it | That tab kept its form and its draft until the reader came back to it | Every Files instance the layout holds closes that form on the bookmarks answer, including one on a page whose pane draws no file browser at all |
| A bookmark is taken away by editing `~/.oculus/bookmarks.yml` outside oculus | Not seen | Still not seen. Nothing watches that file; the list is re-read only when a write from the page moves the round, so the form closes at the next such write and not before. (Ruling 2: booked as its own step.) |

## Corrected Limitations

- **A second Save while the first is out is reachable, and is now closed in code.** The earlier report called it unreachable; that was wrong. `src/lib/views/shared/EntryForm.svelte` now sets `disabled={busy}` on the Save control and returns at the top of `save()` while `busy`, proven by `:485` counting POSTs to `/api/write` (`expect(posts).toBe(1)` after a click and a dispatched click).
- **A rename from the bookmark form loses the text typed while its save was out**, once the answer lands. Stated in full at the top; it follows from ruling 4, and the form cannot be drawn over the old id in any case.
- **The exemption is per form, not per request.** Two saves out from one form would share one mark, so the first answer clears it for the second. The Save control being disabled is what keeps a second save from one form from ever being issued, so the case is not reachable through the page; no test covers it.
- **The leaked empty record entry ruling 7 names is closed by construction and not by an assertion.** `endFormSave` only removes and drops the instance key with its last form, so no false mark and no entry for an instance the layout has dropped can be written. Neither an empty entry nor its absence is observable through the store's API, so the node case covers the path (begin, the layout's close, then the late answer) and asserts `formsSaving` is empty throughout; its revert is the `forgetForms` one.
- **The saving mark is not persisted**, by design: a page that has just loaded has no request out. A reload during a save therefore leaves the form unexempted, which is right, and leaves the draft, which is the existing behaviour.
- **`landed` is the identity field's own value.** The server addresses an entry by its id and resolves the id from the identity value (`src/lib/server/writes/entries.ts:158-167, 318`), and for an entry a form has just added, carrying only the schema's fields, the two agree. A file whose entries carry an `id` or `key` the form does not write would not, and no collection in the tree is shaped that way.
- **The sweep runs on a bookmarks answer, not on the record changing.** A Files instance restored with a stale `editing` is swept by the first bookmarks read after the page loads, which always happens; it is not swept by a layout change alone.

## Doc text (nothing edited; brief decision 2)

`tools/oculus/HELP.md:65`, the clause at the end of the drafts sentence, as it stands:

> Cancel, the view's Add or Edit control closing the form, a delete, a save and Revert let them go; a value typed into an edit form while its save is on its way is kept, in the form left open, and an add form closes once its entry is added.

What it should say: a value typed into either form while its save is on its way is kept, in the form left open, and so is the text of an add form closed and opened again while its save was out; an add form closes once its entry is added only while nothing touched it since the save went, and one left open goes on writing the entry it added; the Save control is not pressable while its own save is out.

`tools/oculus/DESIGN.md:334`, inside the 2026-09-17 decision on unsaved form input, two clauses as they stand:

> A press that closes or moves the bookmark form forgets its draft through `toggleAdd` or `toggleEdit` under the `bookmarks` collection key, and so does the edited bookmark leaving the loaded list (`editedGone`).

> Cancel, a form's close by the view's Add or Edit control, a delete, Revert and a save forget the draft, an edit's save keeping what was typed after it went, and an add form closing once its entry is added.

What they should say: the edited bookmark leaving the loaded list closes its form through `editedGone`, read by the fs store's `closeGoneForms` on every bookmarks answer over every file browser the layout holds (`BookmarkForms`, wired in `state/context.ts`), so a browser whose tab is not shown, or a page drawing none at all, is closed with the rest; a form a save of its own is out from is left until that answer lands, said through `beginFormSave` and `endFormSave` of the drafts store; and an add's save forgets its draft and closes the form only while the draft is still what the save sent (`takeFormDraft`), a form left open going on to write the entry it added rather than adding a second.

## Files changed

| File | + | - |
| --- | --- | --- |
| `tools/oculus/src/lib/state/context.ts` | 39 | 5 |
| `tools/oculus/src/lib/state/form-drafts.svelte.ts` | 105 | 2 |
| `tools/oculus/src/lib/state/fs.svelte.ts` | 54 | 2 |
| `tools/oculus/src/lib/state/fs.ts` | 12 | 3 |
| `tools/oculus/src/lib/views/Files.svelte` | 6 | 21 |
| `tools/oculus/src/lib/views/shared/EntryForm.svelte` | 30 | 7 |
| `tools/oculus/tests/browser/files-forms.spec.ts` | 216 | 4 |
| `tools/oculus/tests/browser/unsaved-forms.spec.ts` | 146 | 6 |
| `tools/oculus/tests/state/explorer.test.ts` | 20 | 10 |
| `tools/oculus/tests/state/form-drafts.test.ts` | 96 | 0 |

File lengths after the round: `Files.svelte` 577, `fs.svelte.ts` 859, `form-drafts.svelte.ts` 399, `EntryForm.svelte` 446, `context.ts` 225. `src/lib/state/fs.svelte.ts` was added to the paths by this round's widening; `src/lib/state/form-values.ts`, `src/lib/state/open-forms.ts` and `src/lib/views/files/BookmarkForm.svelte` are in the path list and were not touched.

## Decisions the orchestrator may reverse

1. **`taken(form, sent)` counts a draft retyped to exactly what was sent as the same draft** (ruling 9), so a form closed, reopened and typed back to the same values closes on the answer.
2. **`BookmarkForms` is the seam**: `createFs(writes, forms)` takes three reads (`browsers`, `saving`, `shift`) built in `context.ts` from the layout, the ui store and the drafts, and the store exposes `shiftForms` so the view's own presses and the sweep move a browser through one function.
3. **`FILES_VIEW` is exported from `state/fs.ts`** and now backs both `filesLineTyped` and the sweep's filter, in place of the literal `'files'` that was inside `filesLineTyped`.
4. **The disabled Save control's tooltip reuses `t('editor.saving')`**, an existing key in a group `EntryForm.svelte` already reads (`editor.saved`, `editor.failed`). No new catalog key, per brief decision 1.
5. **`landed` lives in the component**, not in the drafts store: a form closed and reopened is a new component and adds a new entry, which is what the reopened form should do.
