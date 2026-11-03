# O136 landing

Roadmap entry: the cockpit-to-oculus migration. Step O136, the editor holds a keyed family to the form its reader takes (rulings 651 and 653). Next: O135, an Add Front Matter command for a note (ruling 650), whose brief check has reported; then O137, O138 and O139.

## Open items

None.

## Steps 1

The runner's agent listing (ListAgents) showed one subagent running, O135's brief check a283b3d0c29ce5214; none of O136's agents (the builder a0d181eb863e4804e, the brief check a9fae723e1ab7ad1b, the reviewer aeaee453e5f924a28, the reviewer over round 1 a7092f0eec696b116) was listed.

## Not done

Nothing of the step. Round 1's item 1, which the builder handed back unbuilt, was built at landing (below).

## What landed

The whole range from base 175987c9b (the wip commit a102f11be), 8 paths, 287 insertions and 50 deletions.

- `familySchema` (`src/lib/data/sources/config/catalog/schemas/options.ts`) holds a keyed family to the form its reader takes: a key/value family a map, any other keyed family the form of its catalog entry's `default`.
- Built at landing: `heldToForm` gives such a family `if` the other form `then` its form with the `errorMessage` of `findings.schema.type`, `else` its form with its fields. `OptionLists` carries `text`, filled by `engineSchemas` (`engine.ts`) from `config.text`; `withOverrides`, `shapedSchema` and the `text` branch of `withShapes` read the form through `formOf`; `ANNOTATIONS` (`src/lib/data/snapshot/schema/json.ts`) gains `errorMessage`.
- `references.ts`'s head comment, `docs/HELP.md:571` (a family in the wrong form is marked in the words of the config check), and describe 'the schema of a keyed family' in `tests/data/sources/config/catalog/options-schema.test.ts`, 25 rows; G13's Test line names it.

## What the editor shows now

From the review's probes pointed at the gate:

| Text | Before the fix at landing | After |
| --- | --- | --- |
| `boards` as a list | `Incorrect type. Expected "object".` | `boards must be a map, not a list` |
| a hub's `collections` as a map | `Incorrect type. Expected "array".` | `collections must be a list, not a map` |
| `boards:` empty, a text or a number | `Incorrect type. Expected "object".` | the same |

`stages`, `categories`, a reader row's `params` and a workspace's `settings.boards` follow the same rule. Completion and hover in the reader's form are unchanged, oculus's checker lines are unchanged, and ajv logs no warning.

## Verification

In the gate, `npm run diagrams && npm run docs:palette && npm run test:quick`, first run:

```
FAILED  eslint (16.0 s)
  376:17  error  Unsafe assignment of an `any` value  @typescript-eslint/no-unsafe-assignment
FAILED  vitest checks (96.8 s)
 FAIL  |unit| tests/checks/source/comment-width.test.ts > a comment line > ends by the hundredth column everywhere under src, tests and utils
```

Both were in the fix at landing; fixed, then the whole list again:

```
test:quick: 88.6 s; every command passed
```

The related files alone: 7 files, `Tests  117 passed | 2 skipped (119)`. The staged diffs of main and the gate are equal under `cmp`. The verify list equals the page's commands. No A/B: the configuration names no bench.

## Fixes at landing

- Round 1's item 1 and brief item 5, the editor's message in oculus's words, built as above (ruling "O136 editor message", `plan.md`).
- The two over-wide comment lines and the `any` assignment of that fix.
- The report's DONE row of item 5 (Proof 1 of the review over round 1).
- The report's "Before and after" with the messages after the fix and the hover the review measured (Behaviour of that review).
- G13's Test line.

Standards 1 of the review over round 1, a second `npm run test:quick` the builder started beyond the one the rules file allows, is recorded; nothing of it is in the diff.

## The look

A scratch server on 8797 from the gate, the scratch hub `lab` with `collections:` written as a map in its `.oculus/config.yml`: the editor draws a squiggle on line 2 and the Problems panel lists "collections must be a list, not a map". The server is stopped and 8797 is free (`lsof -nP -iTCP:8797 -sTCP:LISTEN` prints nothing).

## Usage

- Builder a0d181eb863e4804e: first run 222338 tokens, 92 tool uses, 20 min 37 s; round 1 331534 tokens, 92 tool uses, 15 min 14 s.
- Brief check a9fae723e1ab7ad1b: 236992 tokens, 68 tool uses, 14 min 46 s.
- Reviewer aeaee453e5f924a28: 243963 tokens, 70 tool uses, 15 min 44 s.
- Reviewer over round 1 a7092f0eec696b116: 206818 tokens, 46 tool uses, 9 min 34 s.

All served claude-opus-5-5. The builder's first report did not pass its bar; repair round 1 closed four of its five items.

## Next

Close O135's brief check and launch its builder; /spec O137, O138 and O139.
