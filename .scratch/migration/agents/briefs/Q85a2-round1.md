# Q85a2, repair round 1

The refuter's report is `agents/reviews/Q85a2-refuter.md` in the main checkout's ledger. Each finding below has its ruling. Change nothing else.

Run no git command of any kind, read-only ones included (spec.md, "Where you work"). Work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q85a2`. Your paths are the brief's, widened by this round where a ruling names a file.

Rewrite your report `tools/oculus/.scratch/migration/agents/reviews/Q85a2-report.md` for the whole step after the round. Add a "Repair round 1" section that names each ruling below and what changed. For each change of behaviour, the section gives the test that fails without the change, quoted from a run on the code before this round's change, in the test's final form.

Run the test files your change touches while you work. At the end:
1. `npm run diagrams`;
2. the verify list through `checks.sh`, which must print `checks: 7 commands passed`;
3. `npm run test:checks`;
4. the slow files by name, as cases ruling 3 says.

## Spec

1. **S1, S6 and B1, an `event_msg` with no `payload`.**
   - `eventRecordShape` (`sessions/stores/codex.ts:185`) reads `payload: z.unknown().optional()`, so such a record is skipped as on base and the fold goes on.
   - Add two cases to `tests/server/sessions/stores/codex.test.ts`, each failing first. `transcripts.test.ts` takes no line (cases ruling 4).
     - A rollout of `session_meta`, a payload-less `event_msg` and a user message folds the message.
     - A rollout scanned three times with one line appended between scans keeps its counts: the reviewer's `scanloop` probe answers 2, 2, 2 on base and 1, 2, 3 on the worktree.
2. **S2, the two red checks.**
   - **The fixture.** `tests/fixtures/kinds.ts:20` matches `/kind: z\.literal\('([a-z-]+)'\)/g`, which the reviewer's probe shows finds the same 19 kinds in the same order. Your paths gain `tests/fixtures/kinds.ts`.
   - **The write diagram.** The zod helpers leave `core/json.ts`, so that module keeps only the reads, the atomic writes and the write chain, and no importer of a schema helper is drawn as a writer:
     - `src/lib/server/core/write-file-atomic.d.ts` moves to `src/lib/write-file-atomic.d.ts`, beside `highlight-languages.d.ts`, its head comment opening "Layer 2, types." as that file's does. `core` then holds nine items, and a new file `src/lib/server/core/shapes.ts` takes the slot. A `.d.ts` is imported by no module, so it draws no node: `highlight-languages.d.ts` is in no file under `docs/diagrams/`.
     - `shapes.ts` holds every schema helper this step added to `json.ts`: `unchanged`, `anyNumberShape`, `mapShape`, `quickly` with `withoutCatch`, `wholeShape`, `stringItemsShape`, `readAs` and `text`.
     - Every importer reads them from `shapes.ts`. The `isMap` re-export stays in `json.ts` as on base.
     - The head comments of both files say what each holds. `DESIGN.md:148` names `core/shapes.ts` where it names the shared helpers.
   - Your paths gain the two `.d.ts` paths and `shapes.ts`. `readable.test.ts` then passes, with no change to `utils/diagrams/`.
3. **S3, the 30 lines of Verify 3's helper grep that the brief does not list.** The rule is item 1's: a value typed `unknown` whose fields a reader reads goes through a schema. A comparison, a bare map test (`isMap`, cases ruling 6) and a type test on a value the `yaml` library already types (a `Node`, a `Scalar`) stay. Read each of the 30 lines the reviewer names under S3, change each that the rule covers, and list all 30 in the report, each with its class and file and line.
4. **S4, Claude's content text written twice.** `fold.ts:92-97` reads the content text through `background.ts`'s exported `contentTextShape`, which `fold.ts` already imports from (`fold.ts:29`), so the join rule exists once.
5. **S5, the cache's numbers.** `cacheEntryShape` (`sessions/cache.ts:50,53`) takes `size` and `offset` as finite numbers, as item 8 says. A whole-number test is not added. Drop `Number.isInteger` there and keep the cases of item 8.

## Proof

6. **P1, P2, T2 and item 13, `eventOf`.** The reviewer's runs show the schema form of `eventOf` no slower than the hand form (`Q85a2-refuter.md`, P1). So:
   - `eventOf` and `wholeField` (`codex.ts:145-160`) read through a schema built once at module level.
   - The comment at `codex.ts:151` and the time clause of `DESIGN.md:148` go.
   - Then run the whole-pass timing of cases ruling 2 again. Use five alternating rounds of the unchanged tree and the worktree in one session, and quote each pass's mean, the spread and the ratio.
   - A pass whose mean ratio is over 1.5 is reported with its figures. It changes no code in this round.

## Standards

7. **T1, `quickly`.** `withoutCatch` (`core/json.ts:134-138`, moving to `shapes.ts`) supports a plain `z.object`, a `z.array` and the scalar forms with their `.catch`.
   - `quickly` throws when it is built over a loose object, or over an object or array carrying a check (`.refine`, `.min`), with a sentence naming the form. Its comment then names the forms it takes.
   - Add a case for each refused form, failing first, and a case that each of the step's present callers still builds.
8. **T3, one name for one thing.**
   - Where two schemas under one name answer alike, the second imports the first:
     - `claudeMessageShape` (`transcripts/usage.ts:60`, `sessions/stores/turns.ts:118`);
     - `codexPayloadShape` (`usage.ts:157`, `turns.ts:219`);
     - `stampShape` (`sessions/record.ts:219`, `usage.ts:24`);
     - `contentTextShape` (`background.ts:44`, `codex.ts:64`).
   - Where they answer differently, as the reviewer found for `contentTextShape` (a `\n` join against an empty join) and `stampShape` (a string only against a string or a number), each gets a name that says the difference, for example `codexContentTextShape` and `usageStampShape`.
   - The report states which pairs were the same and which differ, with the probe.
9. **T4, `NO_CONTENT`** (`fold.ts:105`) becomes a function that builds a fresh value per call, as Q85a4's round 1 ruled for its fallbacks.
10. **Item 10, the `isMap` re-export comment** (`core/json.ts:92-93`). It names every folder whose modules import `isMap` from `json.ts`. Read the list from the tree.

## Behaviour

11. **B2, `commandShape`** (`sessions/stores/turns.ts:186-195`). An array command is taken whenever it is an array, as on base, so `['']` and `['', 3]` give an empty summary and not the path. Add a case to `turns.test.ts`, failing first.
12. **B3** is stated in your report and stays as built.

## Outside your paths, for the landing

- The merge with Q85a4 on `DESIGN.md:148`, `core/json.ts` and `allow-duplication.txt` is the landing's. Q85a4's own copies of `anyNumberShape` and `mapShape` are folded into `core/shapes.ts` there too. Leave them.
