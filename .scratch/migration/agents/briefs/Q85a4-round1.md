# Q85a4, repair round 1

The refuter's report is `agents/reviews/Q85a4-refuter.md` in the main checkout's ledger. Each finding below has its ruling. Change nothing else. Run no git command of any kind (spec.md, "Where you work"). Work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q85a4`. Your paths are the brief's, widened by this round where a ruling names a file.

Rewrite your report `tools/oculus/.scratch/migration/agents/reviews/Q85a4-report.md` for the whole step after the round. Add a "Repair round 1" section that names each ruling below and what changed. For each change of behaviour, the section gives the test that fails without the change, quoted from a run on the code before this round's change, in the test's final form.

Run the test files your change touches while you work. At the end, run `npm run diagrams`, then the verify list through `checks.sh`, and the slow files by name.

## Spec

1. **Spec 1, schemas built inline.** `compose.ts:202` (`z.string().safeParse(value)`) and `rules.ts:96,101,104` build a schema on every call. Each becomes a named `const` at module level, beside its reader, ending in `Shape`, as item 1 says. Verify 4's const grep then finds them.
2. **Spec 2, `composeRequest`.** Keep base's parameter type, `composeRequest(message: Record<string, unknown>)`, and drop `EMPTY_START`. The function reads its fields from the map through its schema and answers what base answers for every map. Remove the new case that calls it with `null`, `[]`, a string or a number. It tested a behaviour this round takes back, and the route checks the body with `isMap` before the call. Changed behaviour 2 leaves the report.
3. **Spec 3, `DESIGN.md:148`.** The paragraph names every request body this step reads through a schema: the terminal, git, deposit, file-browser write, source, open, mail triage and memories upload bodies. Read the list from the tree.

## Standards

4. **Standards 1, the copies of `scalar`.** `rules.ts`'s `scalarShape` and `pty/routes.ts`'s `steerTextShape` restate `guards.ts`'s `scalar`. Each reader reads such a field as `z.unknown().optional().transform((value) => scalar(value))`, with `scalar` imported from `data/helpers/guards.ts`, so the rule exists once. Your probe and the refuter's (`scal.ts`, 15 of 15 values, the absent key included) show this answers alike. Where more than one reader in one file needs it, the file holds one named `...Shape` for it. Keep the case of `audit.test.ts` that compares the two over the 15 values, now against the shape built on `scalar`.

## Behaviour

5. **Behaviour 1, shared fallbacks.** Every fallback must be a fresh value per call, as on base:
   - every `.catch([])`, `.catch({ ... })` and `.default` with an array or object value becomes `.catch(() => [])` or `.catch(() => ({ ... }))`;
   - every module constant handed out as an answer (`NO_CLAUDE_FILE`, `NO_CODEX_LIMITS`, `NO_FILE_INDEX`, `NO_LIFECYCLE`, `NO_CODE_BLOCK`, and any other) becomes a function that builds a fresh one, or a `shape.parse({})` per call.
   
   Add one case, in `compose.test.ts` or `project-files.test.ts`. It pushes into the answer of one failing parse, then shows that the next failing parse answers a fresh empty array. Quote it failing on the code before this round's change.
6. **The stash and patch modes read an inherited property.** `git-refs.ts:59` reads `STASH_FLAGS[mode]` and `git-index.ts:89` reads `FLAGS[mode]`. A body `mode: 'constructor'` gets `Object`'s constructor, which is not undefined, so the refusal "that is not a way to stash" (or "that is not a way to apply a change") is skipped and a later spread throws. Read each table only through an own key (`Object.hasOwn(STASH_FLAGS, mode)`), so `constructor`, `toString` and `__proto__` answer the refusal. Add a case for each in `tests/server/git/git-write.test.ts` or `git-ops.test.ts`, failing first.
7. **`writeNote` with the thread id `__proto__`** (`triage.ts:139`). The route cannot reach it, since `addressed()` passes only `${mailKey}-` ids. A direct call sets the prototype of the in-memory map and stores no note. `writeNote` throws "no such thread" for a thread id that is not an own-key-safe string (`__proto__`), so no call can set the prototype. Add a case, failing first.

## Proof and the tests

8. **`git.test.ts`'s runner.** Your change imports `it` from `tests/fixtures/scratch.ts` for the whole file, so the existing cases no longer run under vitest's `it`. The existing cases keep vitest's `it`, as on base (item 11). The new describe uses the fixture's `it` under its own name, imported as `scratchIt` or similar, used only there.

## Outside your paths, for the landing

- `tests/server/core/paths.test.ts`, which fails on main since X3d, is fixed at landing. Leave it.
- The merge with Q85a2 on `DESIGN.md:148`, `core/json.ts` and `allow-duplication.txt` is the landing's. Leave it.
