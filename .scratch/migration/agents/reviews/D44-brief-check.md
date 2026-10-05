# D44 brief check

Agent ac746360f7500e074, claude-opus-5-5, ordo-high: 222,221 tokens, 94 tool uses, 10.7 min (completion notice). Read on main at 4815a3f1f, the brief from disk after Z536 (b).

## 1. Names

- `HpcTarget` gains required fields; `tests/routes/machine/hpc.test.ts:5-17` builds a whole `HpcTarget` and breaks; not in the write list.
- `ServerContext.hpcSubmits` required; `tests/server/root/context-fixture.ts:95-96` builds `ServerContext` field by field and breaks; not in the write list.
- `DESIGN.md` "Git." says the read vectors are held "in every command the suite ran, and a test asserts both"; `grep -rln "'ls-files', '-z'" tests` prints nothing, so it is false today and the new vector widens it; the brief does not correct it.
- `src/lib/server/machine/pty/shell-word.ts:1-3` head comment names only lines tmux hands to `sh -c`; it gains the ssh remote line; not in the re-read list.
- Brief lines 72, 278 and 329 still name `StripActions.svelte` after Z536.
- `projectOf` shares its name with three client functions (no change made false); `paths` / `NOT_IN_MODEL` unaffected; the new names collide with nothing.

## 2. The step line

Every part is served. The placement is built under Z536 (b), but the step line has no Z536 tag and says "editor title bar"; the brief's authority paragraph (line 7), line 78, decision 10 (line 291, "Pending 'For Axel' item 1") and premise 6 (line 30) state the old placement. Decision 6 says the scratch warning as the confirm's first sentence.

## 3. Premises

Matches except:
- `git log --all -- '.../briefs/D44*'` now prints 02674f2b0.
- Glassbox's cluster folder is `~/projects/glassbox-decision-pipelines/code` (`README.md:71,100,111`, every script's `cd ... # -> code/`): eight values, not seven (premise 2, decision 2, section 4, verify 4, "Manifest values"). Totals unchanged: 99 named, 78 warned.
- After S5, `slurmSettings` (`settings.ts:185-197`, `settingReader`) never throws: a missing or empty `slurm.resource` reads as `utwente` (`settings.ts:5-9`, `options.yml:333-339`). Section 1 item 5's throw branch and case 6's second sentence describe behaviour that is gone.
- `no_resource` is at `config/text/findings.yml:151` (was 101).
- `context.ts`: `pickerState` import `:62`, `hpcLogPaths: LogPaths` `:137`, `folderPicker`/`hpcLogPaths` `:455-456`.
- The S5 bullet (line 275) treats S5 as in flight; the D20 bullet's "prints nothing" now prints 87 files changed, 29+/32- in `context.ts`.
- `actions.ts`: `LOG_TIMEOUT_MS` `:20`, `CANCEL_TIMEOUT_MS` `:23`.
- Plan references off by one: D44 `:509`, Z347 `:1071`, Z430-Z433 `:1156-1159`, Z488 `:1214`.
- G37, named in brief line 3, is not in `guarded.md` (written at X3f's landing).
- linfoot venv `du -sk` 2156392 KB (about 2.1 GB); btfno `.pt` 389 MiB by `stat`.
- The X3f-based source-tab premises move with X3f's Z536 change.

## 4. Cases and checks

- Case 6, second half: the behaviour is gone after S5.
- Case 11 against section 4: `normalise.ts` leaves `cluster` unset for a bad value, so the planner falls back to the default where case 11 expects `bad-cluster`.
- Section 6: the two guarded tests rest on Z433 (automode), where `guarded.md` and `agents/spec.md` require Axel's yes for a new entry (Z392), and nothing is booked as an open item.
- The refusal word `no-resource` has no producer, so its catalog sentence would have no reader.
- The dictated `// section 2` comment.

## 5. The question

- Verify 3, `grep -l "sh-syntax" build/server/chunks/*.js`, passes with the package inlined.
- Case 19 and the step line's check: no check reaches a real rsync and sbatch unless Axel names a script at the look, and that request is not booked.

## 6. Implied inputs

Missing: how the planner learns a present but refused `paths.cluster` (expected `bad-cluster`, never the default); the cluster folder or its parent not existing yet; a `.slurm` or `code/` reached through a symbolic link (expected `outside-code` by real path); a large untracked, not-ignored file under `code/` (sent, with no size in the confirm); the server closing during a copy or sbatch (the child ended, the key released); the default `~/projects/<id>` held to the same rule.

## 7. ADRs

None: `docs/adr` and `tools/oculus/docs/adr` do not exist.

## 8. Dictated text

All dictated lines hold except `scratch: { named: boolean; unread: string[] }; // section 2`, a comment that names a brief section.

## Declined to judge

Whether Z433's automode closing stands for Axel's yes; decision 6's reading of "said before the confirm"; where the moved `projectOf` lives; whether G15's test gains a `bad_cluster` row; the X3f-based line numbers.

## Closed

Each finding closed in `agents/briefs/D44.md` (line numbers of the brief after the closing), by the orchestrator's rulings 1 to 17.

**1. Names**
- `HpcTarget` and `tests/routes/machine/hpc.test.ts` (ruling 1): the file joins "Paths this step writes" at lines 7-17, `target()` gaining the new fields as inert stubs with no assertion or title changed (brief :290); the premise is stated at :65.
- `ServerContext.hpcSubmits` and `tests/server/root/context-fixture.ts` (ruling 1): the file joins the write list at lines 12-13 and 95-96, `hpcSubmits: submitState()` and its import and nothing else (:291); the premise at :65.
- `DESIGN.md` "Git." (ruling 2): the false sentence is quoted with the greps that show no test pins a read vector (:43); section 5 has the step rewrite it to say which read forms are held to exact vectors, the new `ls-files` vector among them, and what checks them (:202); the builder quotes the rewritten sentence in the report's "Doc text" (:399); :73 names it among the paragraphs rewritten.
- `shell-word.ts` head comment (ruling 3): joins the re-read list, naming the ssh remote line (:75), the premise (:42), and the write list at lines 1-3 (:271).
- `StripActions.svelte` mentions (ruling 4): every mention where Submit is meant now names `actions/BarActions.svelte`: the head comments list (:75), the queued-steps bullet (:304), Read item 8 (:355) and the flow's location (:197). The remaining mentions describe X3f's tree and Z432's words: :9 and :17 say the file is deleted in X3f's worktree under Z536, :303 lists it as deleted.
- `projectOf` and the new names: no change needed (the finding made no claim false).

**2. The step line**
- Placement under Z536 (ruling 5): the authority paragraph quotes the step line ending `(ruling Z536)` at `plan.md:509` and Z536 at `plan.md:1252` (:7); the "What to build" opening says the `.slurm` tab's breadcrumb bar (:81); decision 10 is the breadcrumb bar, ruled (:317); premise 6 states Z488's Correction and Z536 (b) (:31); "For Axel" item 1 no longer says the step line names the title bar (:326).

**3. Premises**
- D44 brief history: premise 1 says the log prints only this brief's commits, f996b0bf0 and 02674f2b0 (:17).
- Glassbox (ruling 6): `~/projects/glassbox-decision-pipelines/code` added with `README.md:71`, `:100`, `:111` and the scripts' `# -> code/` lines (:26); eight values and five `code` mirrors (premise 2 :18, premise 3 :28, decision 2 :309, section 4 :192, section 2's run :159, verify 4 :377, "Manifest values" :398, the write-list note :297); glassbox left the default list (:27).
- `slurmSettings` after S5 (ruling 7): the premise says it never throws for a value and a missing or empty `slurm.resource` reads as the catalog default `utwente` (:35); section 1 item 5's throw branch is removed and replaced by that sentence (:97); case 6's second sentence is removed (:226).
- Renumbering (ruling 8): `findings.yml:151` (:50, :190, write list :280), `context.ts:62/137/456` and `close()` at `:469-486` (:139, write list :275), `actions.ts:23/:20` (:36), `host.ts:87-99` (:35), `plan.md:509`, `:1071`, `:1156-1159`, `:1158`, `:1214`, `:1252` (:7, :17, :31); the write list's header names b0fd996a1 for the renumbered files (:264). The S5 bullet says S5 landed at 71017ce60 with nothing to compare (:301). The D20 bullet is redone against `.agents/worktrees/D20` with `git diff -U0 16b31cef0` (three hunks, mapped onto main's `:63`, `:131`, `:453`) and a `git merge-file -p` of both sides over main's `context.ts` exiting 0 in three runs; D20's doc hunks are re-listed from the same `git diff -U0` (:302).
- `plan.md` references: corrected as above.
- G37 (ruling 9): line 3 says G37 is written into `agents/guarded.md` at X3f's landing (Z491), before D44's base (:3).
- Sizes (ruling 15): about 2.1 GB (`du -sk` 2156392 KB) and 389 MiB by `stat` (407994752 bytes) in premise 5 (:30), decision 1 (:308) and "For Axel" item 2 (a) (:331).
- X3f-based source-tab premises: re-read in X3f's worktree as it stands under Z536: `actions/` holds only `BarActions.svelte` (112 lines), `Source.svelte` 508 lines with `handUp` at `:325` to `'bar'` only, the anchors renumbered, and `BarActions.svelte`'s `lead` and `tail` snippets through `FileBarActions.svelte` (:9, :17, :54-56, decision 12 :319); the orchestrator re-reads them at the base.

**4. Cases and checks**
- Case 6 (ruling 7): second sentence removed (:226).
- Case 11 against section 4 (ruling 10): section 1 item 4 has the planner read the manifest's raw `paths.cluster` from `project.file` with `readYamlMap`, at each plan and again at the press; a value present and refused answers `bad-cluster`, never the default; the default is held to the same rule (:96); section 4 keeps `normalise.ts` and `validate.ts` as written and says the planner does not take `Project.cluster` (:189); the premise names `project.file` and `readYamlMap` (:49); case 11 reads the raw value, and its fixture puts the space in the hub folder so the default holds to the rule (:231).
- Section 6 and Z538 (ruling 16): the heading and opening make the section conditional on Z538 (a) (:204-206); the alternative under Z538 (b) is the quoted runs of both tables with and without the behaviour, and the look (:215); the premise names Z538 and Z392 (:64); the cases' test bullet (:253), the write list (:289), verify 7 (:380) and the "Doc text" guarded entry, now G43 (:399), are conditional on it.
- `no-resource` (ruling 11): removed from the refusal list (:366); its catalog sentence went with section 1 item 5's throw branch (:97).
- `// section 2` (ruling 14): replaced by a doc comment saying what the field holds (:118-121); a `bytes` field added for ruling 13 (:114).

**5. The question**
- Verify 3 (ruling 12): the grep is now `grep -rlE "(from |import\()'sh-syntax'" build/server --include='*.js'`, which finds the bare import specifier only an external package leaves and an inlined copy does not; on main's `build/` the same check for `trash` prints three chunks and exits 0, and for `sh-syntax` prints nothing and exits 1; the old glob `build/server/chunks/*.js` missed the chunks under `build/server/chunks/chunks/` (:376).
- Case 19 and the look (ruling 17): case 19 is written for Z539 (a), the orchestrator creating `code/hpc/oculus_submit_check.slurm` in engram at the look, a one-minute `main-cpu` job writing `hostname` and the date, with (b) and (c) as Axel may rule (:239-242); the look paragraph says the builder creates no job script and what the orchestrator does under each of (a), (b) and (c) (:383).

**6. Implied inputs** (ruling 13)
- A present but refused `paths.cluster`: section 1 item 4 (:96) and case 11 (:231).
- The cluster folder or its parent missing: case 22 (:245), the last level created by rsync, a deeper missing path `copy-failed` with rsync's line.
- A symbolic link: section 1 item 3 decides by real path (:95); case 23 (:246).
- A large untracked, not-ignored file: section 1 item 6 sends it and sums `bytes` (:98); `SubmitPlan.bytes` (:114); the confirm's detail gains a line with the count and total size by `humanSize` (:197), "four detail lines" (:366); the opening names the size (:81); case 24 (:247).
- The server closing during a copy or `sbatch`: the submit state holds each run's `AbortController` (:87, :130), `context.ts`'s `close()` closes it (:139), the after-close behaviour and the abort `ssh.ts` gains (:141, write list :270), the request-close sentence of section 3 corrected (:182); case 25 (:248).
- The default `~/projects/<id>` held to the rule: section 1 item 4 (:96); case 26 (:249).

**8. Dictated text**
- `// section 2` replaced (ruling 14), above. The dictated lines added at the closing, held line by line against `agents/spec.md` (plain prose, ASCII, no history, a comment within 100 columns, rewrapped as a paragraph): `bytes: number; // the total size in bytes of the files the copy sends` (:114, 73 columns) holds; the doc comment "Whether the script or a file it sources names `/local/$SLURM_JOB_ID`, and the sources the scratch rule could not read." (:118-121, its widest line 96 columns) holds.

**Also changed at the closing**
- Decision 1 said "Pending" on the copy set; it now says "For Axel" item 2, ruled Z535 (b) (:308).
- `LC_ALL=C grep -n '[^ -~]' agents/briefs/D44.md` prints nothing.

Closed by the orchestrator after the closing agent (aac4dfaf70ae0e442, claude-opus-5-5, 276,977 tokens, 130 tool uses, 15.6 min): the second false sentence of `DESIGN.md:128` (git writes, `--force`) joins the step's rewrite of that paragraph; `Project.cluster` is dropped, since the planner reads the raw `paths.cluster`, and `normalise.ts` and `model-entities.ts` leave the write list; the cluster-folder rule is `clusterFolder` in `src/lib/data/shapes/shapes.ts`, read by `validate.ts` and the planner.

## Rechecked after X3f, D38 and D20 (2026-10-05)

The tree read: main at f0f311964 with D20 applied and staged in the working tree (`git status --short` lists 97 paths, all under `tools/oculus`), X3f landed at ee0407a5a and D38 at b07d24766 (`git merge-base --is-ancestor` succeeds for both). Every premise naming a file, line, count, symbol, folder count, component size, quoted line or ruling line was read again there, one grep or read each; one grep over `src tests config` for the new names ran without `--exclude=local.yml`, its output filtered by file name so no line of `local.yml` was printed, and was run again with the exclude; every other grep over `config/` named its files or carried the exclude.

The counts: 25 places marked "corrected after X3f, D38 and D20" and 10 marked "added after X3f, D38 and D20" (`grep -c` over the brief); 8 lines carry "ruled Z538 (a)" and 2 "ruled Z539 (a)"; `git diff --stat` of the brief prints 53 insertions and 56 deletions; `LC_ALL=C grep -n '[^ -~]' agents/briefs/D44.md` prints nothing.

The rulings written:
- Z538 (a): section 6 is built, with the "only if" heading and opening replaced and the Z538 (b) paragraph removed; the guarded-entries premise quotes G43 as written at `agents/guarded.md:80-82`; the cases' test bullet, the write list's `submit.test.ts` row and verify 7 carry the ruling; the report's "Doc text" no longer asks for the G43 entry and asks only for the file and the two table titles for G43's Test line (`:82`), since its guarantee and Code line are written.
- Z539 (a): case 19 and the look paragraph keep only (a), the (b) and (c) alternatives removed.

The main corrections:
- X3f's landing: premise 1, the paragraph on waiting for X3f and the whole source-tab section were read in X3f's worktree; they now describe main. `handUp` has no `'bar'` place on main (`grep -rn "ActionsPlace" src/lib` prints nothing; `handUp(handed, id, actions, applies)` at `tab-actions.svelte.ts:74-79`), so premise 1, section 5's placement sentence and decision 10 drop the place. `Source.svelte` is 528 lines (`wc -l`, and 528 at ee0407a5a), over the 520 of `agents/spec.md`, so section 5 and decision 12 make its split by concern part of the step (the brief already said a file past 520 is split), and the write list gains `actions/`, `save/` and `status/` for the split's files, the folder being at ten items. Its anchors moved: `handUp` `:340-345`, `tabActions` `:286`, `said` `:175`, `save()` `:365`, `SourceNote` `:488`, the head comment `:41-49`; `ask-perform.ts` is 108 lines.
- Plan lines moved by four: D44 `:513`, Z347 `:1075`, Z392 `:1122`, Z430-Z433 `:1160-1163`, Z488 `:1218`, Z536 `:1256`; Z538 `:1269` and Z539 `:1270` added.
- `context.ts` after D38 (4 lines) and D20 (4 lines): the step's insertions after `:63`, `:141` and `:463`, `close()` at `:477-495`. `context-fixture.ts`: `:12-13` and `:98-99`. `DESIGN.md` Live HPC at `:135`, `HELP.md` hpc row at `:146`, `HELP.md:49` titled "A file tab's actions". `model-entities.ts` `:490-491` and `:519-521`; `settings.ts` `:185-198`, `:97`, `:6-7`, `:8-10`; `validId` at `actions.ts:25`; `run.ts` list `:10-43`.
- D20 is in the base, so the D20 bullet of "the steps in flight" is rewritten as base facts (its `context.ts`, `context-fixture.ts`, `shapes.ts`, `HELP.md`, `DESIGN.md` and `ToolButton` changes), and the X3f bullet as landed; a new bullet names D23, D45, M6, D28 and D11, which also write `Source.svelte`, for the orchestrator's judgement at preparation.
- Added: G37's two test files join verify 2, since G37's Code line names `handUp`'s call in `Source.svelte`; the glyph stand-in `"[>]"` is already `preview_side`'s (shared stand-ins exist, `refresh` and `biennial`); the moved `projectOf` cannot go in `hpc/`, which reaches ten items; engram has no `code/hpc/` folder yet, the new script is not ignored by git, and its cluster folder is `~/projects/engram`.
- Case 19 says the look's job script follows the hub's `/local/<jobid>` rule (`docs/HPC-UTwente-howto.md:14`, pattern `:111-137`), so it names `/local/${SLURM_JOB_ID}` and its confirm carries no warning; the ruling's text does not name scratch, and the rule leaves no other option. Whether `~/projects/engram/logs/` exists on the cluster is not verified (no command here runs on the cluster).

Held unchanged on main, each by its own grep or read: the 177 job scripts under `code/` in 11 projects and their per-project counts, the `/local/` and `source` form counts, the eight cluster folders' grep counts, the copy-set sizes (2156392 KB, 407994752 bytes, 643 tracked result files), the `.gitignore` lines, `btfno` as the one manifest with `paths:`, `hpc/` at 7 items, `ssh.ts` (58 lines), the route (21) and `routes.ts` (44), `poll.ts`'s refresh and `close()`, `host.ts:87-99`, `resolveRootPath` `:102`, `projectOf` `:51`, `shellWord` `:10` and its head `:1-3`, `trackedFiles` `:50-51`, `run` `:145-179`, the two false sentences of `DESIGN.md:128` (no test pins a read vector or `--force`), `findings.yml:151`, `manifest-schema.yml:73`, `readYamlMap` `:24`, `humanSize` `:131`, `normalise.ts` 836 and `validate.ts` 837 lines, `SHAPES` `:133-143`, `options.yml:333-339`, `behavior.yml:75-76`, `hpc.yml:45-49`, `CommandCenterView.svelte:120`, the auth test title at `tests/server/core/auth.test.ts:16`, `hpc.test.ts:7-17`, `sh-syntax` 0.7.0 still the latest (`npm view`) and not installed, the `trash` build check's three chunks, openrsync 2.6.9, and no collision for any new name (`grep -rn --exclude=local.yml` over `src tests config` prints nothing).

Outside D44's paths, for the orchestrator: G1's Test line (`agents/guarded.md:9`) says the token-guard test 'refuses an empty process token, a missing one and a wrong one, in the route shape' is in the "same file" as `tests/routes/edit/write.test.ts`; `grep -rn` finds it only in `tests/server/core/auth.test.ts:16`.

Stops: none.
