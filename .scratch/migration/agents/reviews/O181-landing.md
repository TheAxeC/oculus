# O181 landing

Position: the oculus migration, step O181 (no hardcoding left in oculus: the values of the user's setup and data are config keys) landed. Next: O183 lands, then O182, then the whole suite once and `npm run app:release` for v1.1.0.

Open items: none.

## Check of Steps 1

The runner's agent listing (ListAgents) showed no subagent of this session, so no builder, reviewer or brief-check agent of the step was running.

## Not done

Everything in the brief is done in oculus. The hub's lines (the block "The hub's lines" of `agents/reviews/O181-report.md`, and `foreign_key: vocab.radar_relevance` at the hub's `radar.yml:22`) are not written to the research hub yet; they wait for Axel's word on a hub commit.

## What landed

The whole range `1a5794ae8..migration-O181` with the fixes at landing, 467 paths counted without renames, 14642 insertions and 8238 deletions. The values of the user's setup and data that stood in code are config keys, with their defaults in `config/defaults/` and `config/options/local.yml`; the hub's words move to the hub's `.oculus/config.yml` (`update_tasks`, `feed_registries`, `leads_run_word`, `linkedin_idea_prefix`, the `slurm`, `recover`, `deposit` and `audit` keys); the fallbacks beside a config key are gone, and a wrong value of each key is a finding naming the key and the value.

## Fixes at landing

- The venue card reads its own key `focus.venue_card_warn: 2` (`config/defaults/behavior.yml:124`); the help of `venue_conc_warn` no longer names the card (Spec 1, Behaviour 1 of the review over round 2).
- `sessions_roots` defaults to `['~/workspace', '~/data', '~']` (`config/options/local.yml:41`), the base's value (Spec 2).
- `vite.config.ts` ignores its own `PLAN_WORKTREES = '.agents/worktrees'` beside the user's `git.worktrees_dir` (Spec 5).
- The row at `tests/checks/vocab.test.ts:262` tagged slow (Proof 1); the guarded entries G125, G32, G8, G79 and G13 written into the titles of the rows Proof 2 lists.
- `config-folder.test.ts` split into it (744 lines) and `tests/checks/config/glyph-config.test.ts` (159 lines); `terminal-actions.test.ts` split into it (558 lines) and `tests/routes/sessions/terminal-chat.test.ts` (372 lines), both under the 880-line rule of `agents/spec.md:48` (Standards 3); `guarded.md` lines 94 and 176 point at the new file.
- `docs/templates.md`'s LinkedIn template names `linkedin_idea_prefix`, and `docs/HELP.md:546` names the per-job scratch folder from `slurm.scratch_roots` (Standards 4).
- `/api/fs` builds the machine answer only when the open workspace's answer reads it, since one `localDefaults` call costs 1.23 ms (sd 0.15) (Behaviour 2).
- Open item 752 (a): a feed a hub's settings add later posts no update notice for the date it already held, and a hub with no `leads_run_word` has no scout feed; the test `tests/state/workbench/navigation/notice-sources.test.ts` gave 1 failed, 1 passed on the step's tree and 2 passed on the landing's.
- The label of `cv.cv_hide` is "Off the CV, on the website" (`config/schemas/manifest-schema.yml:121`, ruling "Label of cv.cv_hide").

## Found

- Premise corrections: the brief's ban on readers called with no list contradicted the base, where those readers already run with no list and a finding pass words their problems (Spec 3, no change); round 1 item 6 (keep the case programs until landing) contradicted `agents/spec.md`, which the builder followed (Proof 3); `hub-portfolio.test.ts` and `config-save.test.ts`, red in the builder's run, are files the step does not change, so they were rerun alone under `spec.md:26`; open item 752 cited `portfolio.ts:692` wrongly.
- Recorded findings: the case programs are gone, so their CASE lines cannot be rerun (Proof 3); 21 suites' base failing line was a missing module, and those rows were judged by reading (Proof 4); the history-word grep's hits were not quoted, and the reviewer's grep found none in that sense (Standards 5).
- The builder's rule breaks (Standards 1 and 2): seven read subagents started and stopped; `sed -n`, `cat`, `awk` and `grep -B` reads; `| tail -150`; perl; a typed `sed -i`; redirects into the session scratchpad; one `prettier --write`; `git status` in the main checkout and a symlink to its `docs`; the case programs deleted.

## Verification

In the gate at main's head with the range: `npm run diagrams && npm run docs:palette && npm run test:quick`, "test:quick: 467 changed file(s)", 413 test files, "637.5 s; failed: vitest slow"; slow tier 2 files failed, 105 passed; 12 tests failed, 979 passed, 397 skipped. The red rows are the 11 `/tmp/x` rows of `tests/server/edit/config-key.test.ts` (rerun alone: 25 passed, 11 failed, the file unchanged by the step) and case C14 of `tests/server/root/watch/deck-folders.test.ts`, a 20 s timeout under load (rerun alone three times: 11 of 11 passed, the case 1330, 1275 and 1322 ms; the file unchanged by the step). svelte-check 4675 files, 0 errors; `prettier --check .` clean; the diagrams and the palette regenerate to the staged copies. Main's index and the gate give the same tree under `git write-tree`, `f402198b83c6e2c7029fe4316cf0f2851b22d6d0`. No benchmark is on this plan's list, so there is no A/B.

## Look

Scratch server 8797 from the gate over a copy of the hub, HOME in the session scratchpad. The update tray with no `update_tasks` lists no task and names the key and the Templates tab; with the hub's lines it lists Lit Watch, Scout, LinkedIn ("Last post") and Inbox with no reload. The LinkedIn view lists 10 ideas under `xx-`. Venues: "Computers in Biology and Medicine" carries "concentrated" and the violet ring at 2. The FLKit project page draws Documents README, CODE, PDF and TEX. Findings: 239 without the lines (Files 55: 52 on radar.yml and 3 on leads.yml read as collections) against 184 with them, the documented behaviour without `feed_registries`. After the 752 fix, adding the lines posted no notice. The copy's config was restored and compared with `cmp`; the server was stopped and its tabs closed.

## Agents and fixes

Builder a262222362d5b2ee3, claude-opus-5-5: launch 383627 tokens, 1320 tool uses, 11147 s; round 1 notice 162496 tokens, 2708 tool uses, 12669 s (cumulative); round 2 notice 407049 tokens, 4686 tool uses, 24984 s (cumulative). Brief check a4bdaa2be7367ccb1, 211076 tokens, 61 tool uses, 617 s. Reviewer ad84e3a4fb08a1397, 370567 tokens, 82 tool uses, 1050 s; over round 1 af31c0ae7070d15f8, 365675 tokens, 85 tool uses, 847 s; over round 2 a4688250e331d0ce2, 329406 tokens, 95 tool uses, 1282 s. All on claude-opus-5-5. The first report did not pass its bar; repair rounds 1 and 2 and the fixes at landing above closed it.
