# O107, repair round 1

Worktree and rules as the brief says. Each item is ruled; change what it says and nothing else. The findings are in `.scratch/migration/agents/reviews/O107-refuter.md`, under the names below. Rulings 609, 610 and 611 are in `plan.md`.

1. S1, P1. A feed entry with no key (`feedEntryId(entry) === ''`) opens no page, ruling 610 outranking the brief's line on row 196. `pageOf` answers null for it, whatever identity `uniqueIdents` gives; a Lead card, a Lit Watch card and a palette row of such an entry get no page opener, the title as words. Table row 196 and `page-entry.test.ts:262` change to that. A fed entry with a key keeps its page, row 202 included.
2. S2. `Referrers.svelte:39`: a referrer whose record has no key draws as words, as its `setting` row does, and opens no page. Drop the report's claim on `EntryFields.svelte` venuePage.
3. S4. List "This is me" among what stays on the read-only Person page, with ruling 611.
4. St1. `src/lib/data/model/index.ts` comes to 880 lines or fewer, by a split by concern in this step.
5. St2, St3. `docs/HELP.md:273`, `EntryList.svelte:4-5` and `Collection.svelte:17-18` are made true of an entry with no key.
6. St4. Remove the guard at `registry-card.svelte.ts:86`, its import change and its doc line.
7. St5. `page-entry.ts:207` reads `hubPrimaryKeys` through `Object.hasOwn`.
8. Report only: correct P2 (line 142) and P3 (line 158, B3); give B1 with before and after; say that the editor tab's line over such an entry is unchanged.

The case-run program gets no `sed -i` or inline script; a changed program is written whole.

Verify: the brief's checks 1 to 3, once, on the final tree. No git command that changes state; only your report in the ledger. A shortcut is a finding. Append your changes to the existing report under "Repair round 1".
