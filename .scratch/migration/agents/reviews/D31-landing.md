# D31 landing report

Position: oculus/migration, step D31 (git auto fetch) landed; in flight Q85c (round-1 review running), U3 (review in, repair round 1 next) and D27 (brief check in); next D27's builder, U3's round 1, Q85c's landing, then D35.

## Open items

None. The "Open items" section of `orchestrator-state.md` holds no entry.

## Agents stopped

D31's builder (a264af1e4dec673e7) and both reviewers (a8b81aeece3e5b341, af9f5f5e617e345a1) had finished before the landing: `ListAgents` lists one subagent, ad09686ce9cc473e2 (Q85c's round-1 reviewer), and none of D31's.

## NOT DONE

- No look. The step changes the server (a timer) and adds one Settings row, `git.autofetch_minutes`, which the Settings editor draws from its `options.yml` entry (`tests/config/options-catalog.test.ts` checks the entry). The Settings page also draws the `local.yml` keys, and the security rules keep the orchestrator from opening anything that shows that file, so the row was not opened on TEST.
- Not exercised against a real remote: a fetch that would prompt over HTTPS or ssh, a credential helper that opens a window (which `GIT_TERMINAL_PROMPT=0` does not stop), and a `core.sshCommand` that is plink or putty (where `-o BatchMode=yes` does not apply). The tests run on throwaway repositories with a fake ssh program.
- The time the `spawnSync` read of `core.sshCommand` blocks the server (bounded at 5000 ms per repository per period) was not measured.

## What landed

The key `git.autofetch_minutes` (0, the default, is off) and the timer `src/lib/server/root/watch/autofetch.ts`, which every period runs `git fetch --prune` in each repository `git remote` names a remote for, through the existing `fetchIn` of `git-write.ts`, with `GIT_TERMINAL_PROMPT=0` and an ssh command that carries `-o BatchMode=yes` (the repository's own `core.sshCommand` kept, read through the new `sshCommand` of `core/git.ts` only when the environment names no command; a failed read skips the repository and logs it). The reader is `src/lib/server/core/fetch-period.ts`; `context.ts` starts and closes the timer; `config-key.ts` refuses a bad value from Settings. DESIGN.md:116, :128 and :344 and HELP.md:172, :186 and :222 name the timer as the one exception to "no timer runs a writing git command" (Z165), and DESIGN.md:344 names Commit and Push and Commit and Sync. 19 files against the base 133ee543 (`git diff --cached --stat`: 1746 insertions, 341 deletions) before the fixes below.

Verification on main, from `tools/oculus`, after `npm run diagrams` (rc 0) and the fixes below:

```
$ npm test
 Test Files  404 passed | 21 skipped (425)
      Tests  10526 passed | 615 skipped (11141)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
1790875270183 COMPLETED 2916 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

Full verify-list runs at landing: one passing run, above. `land.sh`'s own run stopped at its first command, since it runs from the repository root, where no `package.json` is.

## Fixes at landing

1. Proof 1 of the run over round 1: `agents/reviews/D31-report.md` lines 14, 19 and 104 rewritten to the tree (`sshCommand(root): string | null`, `config --get --default= core.sshCommand`, a failed read skips the repository), and the round-0 "Item 14" section replaced by a pointer to the round-1 table (8 rows differ, 17 match).
2. Proof 3: the audit in `tests/server/git/autofetch.test.ts` matches every import form of `core/git.ts` and pins the list to `['{ sshCommand }']`. With `import * as core from '../../core/git.ts'` added to `autofetch.ts` it fails (`expected [ '{ sshCommand }', '* as core' ] to deeply equal [ '{ sshCommand }' ]`); the source was restored. Scoped run over autofetch, git-ssh and git tests: 3 files, 92 tests passed.
3. Standards 1: the unused timeout parameter of `sshCommand` removed; the function uses the file's `TIMEOUT_MS` as its siblings do. `core/git.ts` is 898 lines.

Proof 2 is disclosed (a case that cannot fail on the base tree, guarded by a mutation the reviewer reproduced). Behaviour 1 goes to Q88c's /spec: Z172 and Z175 have Q88c write the fixed git choices into the DESIGN.md:344 and HELP.md:186 sentences D31 wrote. Behaviour 2 is as ruled. Each is under the Closed heading of `agents/reviews/D31-refuter.md`.

## Agents' usage

- Brief check: claude-sonnet-5-5, 159,546 tokens, 52 tool uses, 5.5 min.
- Builder (claude-sonnet-5-5): first run of the cases, stopped on case 18, 248,113 tokens, 39 tool uses, 10.7 min (0 full-list runs); the notice after the resumed build 371,242 tokens, 61 tool uses, 33.1 min (5 `checks.sh` runs: 1 from the wrong folder, 3 red, 1 green); round 1 169,580 tokens, 53 tool uses, 17.7 min (1 full-list run).
- Reviewer, first run: claude-sonnet-5-5, 262,857 tokens, 64 tool uses, 26.9 min; 1 Spec, 3 Proof, 3 Standards, 1 Behaviour findings.
- Reviewer over round 1: claude-sonnet-5-5, 201,178 tokens, 49 tool uses, 16.2 min; 0 Spec, 3 Proof, 1 Standards, 2 Behaviour findings.
- The builder's first report did not pass its bar (8 findings, one repair round). Three fixes at landing. Z165, Z172 and Z175 ruled along the way (Z172 by Axel, Z165 and Z175 in automode).

## Next

D27's brief findings are closed in its brief, then its preparation commit and builder; U3's repair round 1 from its review; Q85c lands once its round-1 review is in; D35 is prepared again on the new main after Q85c.
