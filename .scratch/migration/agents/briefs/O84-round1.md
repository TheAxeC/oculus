# O84 round 1: the review's findings

Rules: `agents/spec.md`, `agents/guarded.md` and the step's brief `agents/briefs/O84.md`, which stay in force except where this file says otherwise. The review is `agents/reviews/O84-refuter.md`. This round is built on the worktree as it stands. You write no script beyond what this round builds.

## What to change

1. **The `self` write's refusal names the key (review Spec 1).** `writeSelf` in `src/lib/server/edit/writes/config/config-key.ts:339` keeps `localProblemAdded`, so a `local.yml` that already holds a broken key elsewhere still takes a `self` write; this is the orchestrator's ruling on the brief's item 4. A refusal answers with the sentence `checkLocal` gives for the problem the edit adds, naming that key, in place of the fixed `server.config_key.local_check` sentence. A catalog key left without a reader is removed. The report names this under the decisions of the step.

2. **Comment lines within 100 columns (review Standards 1).** Rewrap, words unchanged, `src/lib/data/snapshot/hubs/self.ts:26`, `tests/data/hubs/self.test.ts:5`, `src/lib/data/file-ops.ts:222`, `tests/data/snapshot/rename.test.ts:119`, `tests/routes/edit/config-key.test.ts:219`, `tests/server/machine/lsp/adapters/hub-keys.test.ts:6`, and every other comment line over 100 columns in a file the step changed (`hub-keys.test.ts:770` among them); the report quotes an `awk 'length > 100'` over the changed files' comment lines, printing nothing.

3. **Three sentences the change makes false (review Standards 2).** Rewrite the head comments of `src/lib/server/accounts/connect/rows.ts:1`, `src/lib/server/files/workspace/machine-file.ts:7-11` and the comment at `src/lib/server/edit/writes/config/config-place.ts:184-187`, so each names `writeSelf` and the `lsp-edit` operation among what writes or asks about a hub's `.oculus/local.yml`. Grep `local.yml` across `src` comments for any other sentence that says one module alone edits it, and fix each.

4. **One reader and one key name (review Standards 3).** `localText` in `config-key.ts:231-238` and `placeText` in `config-place.ts:173` become one function that both call. `USER_KEY` is defined once, in the data layer beside the `local.yml` keys (`src/lib/data/sources/config/local.ts`), and imported by `config-place.ts` and `src/lib/state/system/config/rows.ts`.

5. **The tip's separator (review Standards 4).** `Person.svelte:173` joins the hubs with `t('person.sep')`, as the file does at line 137. The finding in `self.ts:60` keeps `', '`, the separator every finding of the data layer joins with (`schema/check.ts:100`, `schema/run.ts:337`, `hubs/merge.ts:119`).

6. **Case 28's folder (review Spec 2).** The orchestrator's ruling: the brief's `.oculus/secrets/` was a wrong premise; a hub's secrets folder is `<hub>/secrets` (`src/lib/data/helpers/files/private-folders.ts:16`), which stays refused (`lsp-edit.ts:51`, `edits.ts:114`). Nothing changes in code; the report names the premise under what in the brief was wrong.

7. **The report (review Spec 3, Proof, Standards 5, Behaviour 1 and 2).**
   - Under what in the brief was wrong: no guarded entry names `tests/state/system/lsp/edits.test.ts` (`grep -n 'edits.test' .scratch/migration/agents/guarded.md` prints nothing), and the rows were placed under G2 and G8; and case 28's folder (item 6).
   - The widening of `context.ts` beyond lines 295-330 (hunks at 723 and 751-753), with the reason.
   - The history-word grep over the comment lines and test titles the step added, the reuse grep for each helper and type it added, and the grep of each renamed name, each quoted with its hits judged.
   - In "Before and after": the old and the new words of `server.config_key.local` and of the `lsp_edit_outside` notice, and the `lsp-edit` answer's new `error: 'local'` with its `reason`, as the shape case 28's "refused with its reason" is carried by.
   - The list runs once, after this round's last change.

## Cases of this round

- R1. A `local.yml` holding `port: x` and no `self`: a `self` write lands, the file has `self:` and `port: x` as before. A `self` write whose result would break a key: refused, the refusal names that key with the sentence `checkLocal` gives; nothing written. Each a row of the existing `writeSelf` table in `tests/routes/edit/undo/user-key.test.ts`, the second red on the worktree before item 1 (quote the failing line).
- R2. The awk of item 2 prints nothing.
- R3. `grep -rn "USER_KEY = " src` prints one line.

## Verify before you report

The brief's "Verify before you report" checks again, from the worktree root, over every file the step changes. The plan's whole verify list runs once, at landing on main.

## Paths this round writes

The brief's paths, and:
- `src/lib/server/accounts/connect/rows.ts`, `src/lib/server/files/workspace/machine-file.ts`
- `src/lib/data/sources/config/local.ts`
- `.scratch/migration/agents/reviews/O84-report.md` (the report, rewritten whole with this round in it)
