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

Filled when the brief's closing returns.
