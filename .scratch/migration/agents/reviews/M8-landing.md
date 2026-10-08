# M8 landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration), step M8, the hub's YAML checked and completed in the editor. Next: D33's review over its repair round 1, then the landing of D33, then M6.

## Open items

- Open item 9 (2026-10-08), D33's test of the list that shrinks: the diagnosis of D33's Proof 1 (`agents/reviews/D33-diagnosis.md`, second heading) found the cause in `ui/tree/list/VirtualRows.svelte` (the window a `$state` written by a `$effect.pre`, so a list that shrinks inside an effect is read past its end: `TypeError` in Changes, Graph, Console and the Explorer tree, `each_key_duplicate` under the Problems guard). The fix goes into D33's round 1. Its test (`tests/ui/tree/list/virtual-rows.client.test.ts`, with a 420-line test-only DOM helper `mini-dom.ts` that mounts the component) has no guarded entry, and spec.md keeps DOM behaviour with the look. (a) a guarded entry G65 for VirtualRows' window, the three files landing with D33; (b) no test, the fix resting on the diagnosis's red command and the look, the lazy option. Recommended: (a), since a list that throws stops that view updating.

## Not done

- The look ran on a scratch oculus on port 8796 served from `.agents/worktrees/gate`, with the gate checkout as its hub, and not on TEST: the 8790 server runs main's code and needs a restart before M8's server half (the YAML language server, the shape findings) is seen there. Not verified on 8790.

## The check of Steps 1

M8's builder acd90a7603ba715c3 and both reviewers (ab7cdbacbd59ae325, a30f498743d2a8fdb) were stopped after their last reports; the agent listing showed each completed and none running.

## What landed

From base d8f32d576, 178 files, +7470 -3696 with the fixes at landing: every hub file's `schema:` with `from:`, allowed values, `when:` and a help line on every field; `config/schemas/` with the manifest, side-project, deck and cpp schemas; `config/catalogs/options.yml` for oculus's own config files; JSON Schemas built from them and matched to the files by path; yaml-language-server with completion, hover and a mark on a value not allowed; a whole-file shape for each catalog and text file whose issues are findings on the config channel; the data changes of Z468 and Z672; `DESIGN.md:24` reworded as Z681 rules; `agents/guarded.md` with G3, G7, G12, G13, G36 and G55 brought to M8's paths and G63 and G64 added.

## What was found, and the fixes at landing

The builder's first report did not pass its bar (case 10 handed back, ruled as Z717; the first review found 14 findings). The review over round 1 found ten, each closed at landing (`agents/reviews/M8-refuter.md`, "Closed"):

- R1-1: `agents.yml`'s shape issues give findings for the keys `parseAgents` does not word (`agentsWords` in `src/lib/data/shapes/catalog-files.ts`).
- R1-2 and R1-8: a file under `secrets` or `~/.oculus` is withheld from the YAML language server only (`isMachineFile` in `src/lib/views/sources/source/language/lsp.ts`). Before the fix such a file got no language server in any language; after it, only YAML is withheld.
- R1-4: the two sentences that every shape issue is a finding are true after R1-1.
- R1-5 and R1-6: the head comments of `agents.ts` and `shape-issues.ts`.
- R1-7: G64's title in `agents/guarded.md` is 'gives one finding for $row'.
- R1-9: a project's Focus select offers only what the board may move it to (`fieldChoices` in `src/lib/state/client/selectors.svelte.ts`, through `movable`; `Editor.svelte` passes the project).
- R1-10, before and after: a dataset's `access` was a free text box with the help "open / credentialed / DUA ..." and is a select of open, registration, credentialed and private; `retrieval` is a raw JSON block, not sent when untouched.
- R1-3, no change: G63's second row fails on the base on the rule; G64's function does not exist on the base.

## Verification

Gate in `.agents/worktrees/gate` at 2dcb0febf:

```
ok      ASCII gate (0.9 s)
ok      npm run lint (15.2 s)
ok      npm run format:check (20.0 s): All matched files use Prettier code style!
FAILED  npm test (125.2 s)
ok      npm run test:checks (237.5 s): Duration  233.74s
ok      npm run check, then npm run build, then npm run test:slow (249.8 s): Duration  160.01s
```

The `npm test` failure was a timeout of `tests/routes/files/source.test.ts` 'keeps at most 50 copies of a file ...' ("Test timed out in 5000ms"), a file M8 does not touch; the file passed alone and a full `npm test` rerun gave "Test Files 128 passed | 18 skipped (146)" and "Tests 945 passed | 74 skipped (1019)". The staged diff on main equals the gate's (`git diff --cached HEAD | shasum` gives 05e5cb06 in both).

## The look

On the 8796 scratch oculus, nothing saved:

- Edit Manifest of the archived project Robust-XAI-ECG: Focus offers "", run, push, revise, review, blocked, backburner, scope, derisk, build, without `holding`.
- Edit Manifest of the ideas-tier project Engram: Focus offers the same with `holding`.
- The Data view's edit form of "DTU EEG and audio dataset for auditory attention decoding": `access` a select of open, registration, credentialed and private with `open` chosen; `retrieval` a raw JSON text box; the view's header counts 40 open, 7 registration, 4 private and 3 credentialed.

## Usage

- Builder acd90a7603ba715c3 (claude-sonnet-5-5): first run 227,713 tokens, 37 tool uses, 5.0 min; resumed after Z717 303,454 tokens, 929 tool uses, 171.1 min; round 1 238,741 tokens, 298 tool uses, 68.4 min.
- Brief check a40f2578315ca7d21 (claude-opus-5-5): 145,450 tokens, 197 tool uses, 25.4 min.
- Reviewer ab7cdbacbd59ae325 (claude-opus-5-5): 252,447 tokens, 189 tool uses, 34.2 min.
- Reviewer over round 1 a30f498743d2a8fdb (claude-opus-5-5): 322,670 tokens, 106 tool uses, 24.2 min.

## Next

D33's builder reports round 1; it is stopped, `/refute` runs over the round, then `/land` D33. Then M6, M7, D41, D43, D39, D36 and D40.
