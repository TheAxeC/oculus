# O53, repair round 1

The rules file and `agents/briefs/O53.md` still hold. This round closes the findings of `agents/reviews/O53-refuter.md`, one ruling each below. A shortcut is a finding: a narrower reading of a ruling, or work inside it reported as outside it, is done or handed back with the reason before the report.

The rules file's "Where you work" holds in full: you run no git command, read-only ones included; the base copy `.agents/worktrees/migration-O53-base/` is where the unchanged tree is read and run. No script or program is written or run to check a case (open item 262 is not ruled), inline `node` programs included; a case is checked by a test row the step has or by reading, and the report says which for every case.

## Rulings

1. **Standards, `config/text/views/boards/person.yml:1-4`.** The head comment is one line per paragraph, with no hard wrap.

2. **Standards, the dead re-export.** `teamLine` leaves the export list of `src/lib/state/boards/board/index.ts:18`, since nothing imports it from there; `sh utils/unused-exports.sh` then shows no new line against the base list.

3. **Standards, two false comments.** `src/lib/views/shared/forms/entry/card/EntryFields.svelte:109` names what opens a Person tab now (a person of a project card's team), and `src/lib/state/client/selectors.svelte.ts:444` says a joint work's projects are joined by the team. Grep `collaborator tag` and `collaborator` in comments across `src` and `docs` and make every other false hit true.

4. **Standards, the unreachable keyless branch.** `addPerson` (`src/lib/state/forms/new-entry.ts:195`) loses its branch for an empty key, and `editor.add_person_key` leaves `config/text/views/boards/editor.yml`, since every caller reaches `addPerson` through `personToAdd`, which offers nothing for words with no key.

5. **J8, a discarded form.** A Revert or a close of the form while an Add person write is out leaves the field as the Revert left it: the returned key is not picked into it. The person stays in the registry, as item 5 says. The report states how the code knows the form was reverted.

6. **Behaviour, the report.** "Before and after" gains the Person tab's empty sentence (`person.yml:11`): before "Press a collaborator tag on a project card to open a person.", after "Press a person of the team on a project card to open a person.".

7. **Proof, the report.** Verify 9 is given again with the whole history list of spec.md's "What every package obeys" and each hit judged.

8. After this round's last change the verify list runs once, and the report says how many times it ran.

## Paths this round writes

Every path of `agents/briefs/O53.md`'s "Paths this step writes", every path the first report named outside it, and:

- `src/lib/views/shared/forms/entry/card/EntryFields.svelte`
- `src/lib/state/client/selectors.svelte.ts`
- `config/text/views/boards/editor.yml`
- any other file ruling 3's grep finds false
- `.scratch/migration/agents/reviews/O53-report.md` (a section "# Repair round 1" appended)

## Report

Append "# Repair round 1" to `.scratch/migration/agents/reviews/O53-report.md`: each ruling with DONE or NOT DONE, its diff and the check that shows it; each case with the test row or the reading that checks it; the verify lines.
