# Step O73 brief check (on main at bffb4005)

`git log --oneline -1` printed `bffb4005 Book ruling 356 (2) and add step O77`. `git status --short` shows the brief `.scratch/migration/agents/briefs/O73.md` untracked. `plan.md` has no `## Goal` heading: `grep -n "^## " .scratch/migration/plan.md` printed only `5:## Steps, in execution order`, `1178:## Could run in parallel`, `1191:## Rulings`, `2703:## Agents` and `3261:## Blocked, and by what`. For that reason the goal used below is the one in my prompt: a hub's `manifest_fields` row whose `from` names no list is told to the hub by a finding naming its file and the row's `from`.

Two findings matter most. Both are in checks 3, 5 and 6:
- **A false finding for `vocab.leads_fit`.** The check would run against a config that does not yet hold `leads_fit`, so a valid row naming it would be reported and dropped.
- **Item 1 leaves gaps the goal covers.** `vocab.<key>.<field>`, `from: []` and `from: ""` all name no list and get no finding, or a finding with no source in it.

## 1. Names

- `readManifestFields`: `grep -rn -e readManifestFields . --exclude-dir=node_modules --exclude-dir=.agents --exclude-dir=.git --exclude=local.yml`. Outside the brief and `plan.md` the only hits are `src/lib/data/sources/config/merge/hub-layer.ts:353` and `:501`, both in the paths. No hit outside the paths.
- `schemaFileProblems`: same grep. Hits outside the paths:
  - `src/lib/data/sources/config/catalog/schema-findings.ts:12` (import) and `:20` (call `schemaFileProblems(config)`). Not made false: item 1 keeps the function and what it reports.
  - The head comment of the same file, `:2-3` ("a `from` that names no registry, `projects` or vocab list"), stays true.
  - `.scratch/migration/agents/reviews/O62-refuter.md:150`, `O62-brief-check.md:160` and `O71-report.md:215` are records of earlier steps. They are not product text and are not made false: `schemaFileProblems` still reads `merged.manifest_schema` alone.
- The new exported function of item 1: the brief gives it no name, so no grep for it or for a collision with it can be run.
  - `grep -rn "REGISTRIES.includes\|=== 'projects'" src` printed `src/lib/state/forms/schema.ts:303` (the form's choice reader, which is not a list check) and `src/lib/data/snapshot/schema/static.ts:49`. No other function already decides whether a source names a list.
- `manifest_field_from`: `grep -rn -e "manifest_field_" ...` found it only in the brief. There is no existing key it could collide with.
  - The other `manifest_field_*` hits are `config/text/findings.yml:135-140` (in the paths) and `hub-layer.ts:375-421` (in the paths).
- The finding sentence's words, "is no registry" and "names no list": `grep -rn -e "no registry, \`\?projects" -e "is no registry" -e "names no list" ...`. Outside the paths:
  - `config/text/findings.yml:274` (`bad_from`) and `config/text/server.yml:102`. Neither is changed and neither is made false.
  - `src/lib/data/snapshot/schema/record.ts:37` and `src/lib/data/snapshot/schema/static.ts:40` (in the paths). Both stay true.
  - `schema-findings.ts:2` stays true.
  - `.scratch/migration/orchestrator-state.md:197` is open item 342. Landing the step makes it closed; that is the orchestrator's booking.
- The sentences listing the kinds of row left out: `grep -rn -e "section the form lacks" -e "the form does not draw" -e "the form cannot draw" -e "form cannot take" src config docs tests README.md --exclude=local.yml` printed:
  - `src/lib/data/sources/config/merge/hub-layer.ts:13`, the file's head comment, lines 10-13: "`manifest_fields` ... is read row by row here: ... a row that would change a field oculus's form has, or that the form cannot draw, is left out." The file is in the paths, but this sentence is not in the brief's list of sentences ("What is on the tree", line 19) and not in item 2, which names only the doc comment at 345-352. After the change, a row with a bad `from` is left out although the form can draw it (a chips field with no choices). The summary becomes incomplete, and nothing in the brief tells the builder to check it.
  - `config/schemas/manifest-schema.yml:86`, `config/options/schemas/manifest-schema.yml:4`, `docs/templates.md:309-310` and `docs/HELP.md:524` are all in the paths (item 4).
  - `tests/data/sources/config/layers/manifest-fields.test.ts:4` and `:60` are in the paths. Both are general ("a row the form cannot take") and stay true.
- `.scratch/migration/agents/guarded.md:195` (G128, outside the paths). The change makes its list incomplete. The brief gives this to the orchestrator at landing (brief line 41).
- `config/schemas/manifest-schema.yml:86` lists only three kinds: "A row naming a field the form already has, a section the form lacks or a widget the form does not draw is a finding". It leaves out "no field" and "a field an earlier row names", which the code reports (`hub-layer.ts:373-394`). Item 4 says "change nothing else", so after the step this sentence names four of the six kinds.

Findings:
- The head comment `hub-layer.ts:10-13` is not named among the sentences the step rewrites, and the change makes its summary of what is left out incomplete.
- Item 4's "change nothing else" keeps `config/schemas/manifest-schema.yml:86` missing two kinds the code reports ("no field" and the repeated field). The step rewrites that sentence anyway; leaving it short is the narrower reading.
- The new exported function has no name in the brief, so it could not be grepped for collisions. This is minor: the builder greps before writing it, by `spec.md` "The principles every package is judged on".

## 2. The step line

The step line is `plan.md:804`: "O73 a hub `manifest_fields:` row whose `from` names a list that `vocab.yml`, the registries or `projects` do not hold gets a finding naming the hub's file and the row's `from`, with G128's text extended and its row in `manifest-fields.test.ts` (ruling 342)".

- "a hub `manifest_fields:` row whose `from` names a list that `vocab.yml`, the registries or `projects` do not hold": items 1 and 2. This is only partly served:
  - Item 1 holds every `vocab.<key>.<field>` whose `<key>` is set to be a list, without checking the field. A `from: vocab.statuses.nope` names a list `vocab.yml` does not hold (`src/lib/data/snapshot/schema/lists.ts:4-5`: "a field no row carries as `true` naming no list") and gets no finding.
  - A `from: []` names nothing and gets no finding.
- "gets a finding": items 2 and 3.
- "naming the hub's file and the row's `from`": item 2 (the hub's file, key `manifest_fields.<i>.from`) and item 3 (`{1}` is the source).
- "with G128's text extended": the paragraph after item 5 (brief line 41), done by the orchestrator at landing. It is not an item of "What to build", and it is stated.
- "its row in `manifest-fields.test.ts`": item 5.
- "(ruling 342)": the authority. `plan.md:2686` reads "(a), a hub `manifest_fields:` row whose `from` names no list gets a finding naming the hub's file and the row's `from`".

Findings: the part "names a list that `vocab.yml` ... do not hold" is served only for the `<key>` part of `vocab.<key>.<field>` and for non-empty `from`. `vocab.<key>.<field>` with a field no row carries, and `from: []`, have no requirement. See checks 5 and 6.

## 3. Premises

- **Line 5, the standards page and the ADR folder.** `sed -n '11p' .scratch/migration/orchestrator-state.md` printed `standards: [.scratch/migration/agents/spec.md]`. `ls docs/adr` printed "ls: docs/adr: No such file or directory". Matches.
- **Line 11, the step line and ruling 342.** `grep -n O73 plan.md` printed line 804, and `grep -n "Open item 342" plan.md` printed line 2686, as quoted in check 2. Matches.
- **Line 12, the order of checks in `readManifestFields`.** `grep -n "" hub-layer.ts | sed -n '344,353p;426,429p'` shows the doc comment at 345-352, `function readManifestFields(` at 353 and the closing `}` at 428. The checks run in this order: none (374), held (379), repeated (385), section (397), type (408), shape (415). Each finding is at `${at}.<part>`, and nothing reads `row.from`. Matches.
- **Line 13, the row shape.** `manifest.ts:33-38` reads `from: z.union([text, z.array(text)]).optional()`, and `common.ts:8` reads `export const text = z.string();`. Matches. The same lines also show that an empty text and an empty list pass the shape.
- **Line 14, the probe.** I reran it with `npx tsx <scratch>/probe.ts <scratch>/hub` over a hub with the three rows and a manifest `grant_id: [a]`. It printed:
  - `findings []`
  - `manifest_fields [{"field":"grant_id",...,"from":"nope",...},{"field":"b",...,"from":["people","vocab.nope"],...},{"field":"c",...,"from":["people","projects","vocab.stages"],...}]`
  - `snap <D>/hub/projects/ideas/x/project.yml | grant_id[0] | grant_id[0] is a, which is not a key of nope`

  Matches.
- **Line 15, `schemaFileProblems`.** `cat -n static.ts` shows it at 45-63, with the local `lists` at 48-53 and no export of it. `lists.ts:51-60` holds the eight registries, and `findings.yml:274` is `bad_from`. Matches. `withManifestFields` is at `vocab-keys.ts:284-311` (the `/**` is at 284, the body ends at 311), which matches. The phrase "on oculus's config files only" is true of `schemaFileProblems`'s use. The same `bad_from` key is also used for a hub data file's `schema:` (`run.ts:294`), which the brief does not claim otherwise.
- **Line 16.** `schema-findings.ts:12` reads `import { schemaFileProblems } from '../../../snapshot/schema/static.ts';`. Matches.
- **Line 17, where `readManifestFields` is called and which config it sees.** The call site matches: `hub-layer.ts:501` reads `? { value: readManifestFields(value, config, file, pending) }`, the grep shows only one caller, and the hub's values are set into `config` by the loop at 518-531 (`setAt(config, path, value)` at 523). The brief's range 516-528 is two lines early; this is minor. **The last sentence does not reproduce:** "A hub cannot add a key to `vocab.yml` (its keys are fixed by `VOCAB_FILE_KEYS`), so whether a `vocab.<key>` is a list is known from that `config`."
  - `npx tsx <scratch>/oculus-only.ts` over `loadConfig(engineDir()).config` printed `VOCAB_FILE_KEYS unset in oculus merged config: leads_fit` and `VOCAB_FILE_KEYS count 18`.
  - `src/lib/data/sources/config/merge/in-place.ts:43` says "`leads_fit`, which oculus ships none of, is a map". `src/lib/data/helpers/hub-names.ts:399` lists `{ key: 'leads_fit', file: 'catalogs/vocab.yml' }` among the hub keys.
  - A hub that sets `leads_fit` in its own `config.yml` therefore makes `vocab.leads_fit` a list only after `readManifestFields` has run. The probe over `<scratch>/hub2` (with `leads_fit: { strong: ..., reach: ... }` and a row `from: vocab.leads_fit`) printed `leads_fit {"strong":"#16a34a","reach":"#9ca3af"}` after the merge, and no snapshot finding for the manifest's `fit: [strong]`.
  - Under items 1 and 2 as written, `config.leads_fit` is `undefined` at line 501. That row would get a false `manifest_field_from` finding and be left out.
- **Lines 18 to 25, the sentences and their line numbers.** Read with `sed -n` on `findings.yml:128-142`, `config/options/schemas/manifest-schema.yml:4`, `config/schemas/manifest-schema.yml:84-88`, `docs/HELP.md:519,524`, `docs/templates.md:300-314,39` and `docs/data-map.md:80,116`. Every line number matches. `templates.ts:1-12` says it reads the page's `config.yml` block. Matches.
- **Line 26, G128 and its test.** `sed -n '190,200p' guarded.md` shows G128 at 195-197. `wc -l` gives the test at 90 lines, with three `it` rows (35, 52, 60). Matches.
- **Line 27, file sizes.** `wc -l` printed 534 for `hub-layer.ts` and 80 for `static.ts`. Matches.
- **Line 28, output filter.** `grep -n -i "filter" spec.md` printed nothing. Matches.
- **Line 29, the paths of O72.** `sed -n '/## Paths this step writes/,/^One path/p' briefs/O72.md` printed `config/text/findings.yml` lines 300-305 and `docs/HELP.md` line 519. Matches, and these do not touch O73's lines.
- **Line 30, the verify list.** The state file has `verify: - npm run test:quick` and `verify_landing: - npm run diagrams && npm run test:quick`. The brief's Verify item 1 is `npm run diagrams && npm run test:quick`, which `spec.md` "Token discipline" requires ("`npm run diagrams` runs right before each run of the list"). Matches.
- **Decision 2 and item 1, an extra premise.** They say the field part of `vocab.<key>.<field>` is not checked "since which rows carry a field is known only from the data". This is false. The field lists are built from the merged config: `src/lib/data/snapshot/schema/run.ts:233` reads `vocabLists(config.merged, VOCAB_FILE_KEYS)`, and `lists.ts:25-37` builds `lists[\`${key}.${field}\`]` from `merged[key]`'s rows carrying the field as `true`. What a hub row cannot know at line 501 is the hub's own vocabulary, which is laid in at 518-531. The data files have nothing to do with it.

Findings:
- Line 17's "a hub cannot add a key to `vocab.yml` ... known from that `config`" is false for `leads_fit` (commands and output above). Built as briefed, a hub row `from: vocab.leads_fit` in a hub that sets `leads_fit` gets a false finding and is dropped.
- Line 17 gives 516-528 for the loop that sets the hub's values; it is at 518-531 (minor).
- Item 1's dictated reason for the doc comment, "known only from the data", is false (`run.ts:233`, `lists.ts:25-37`). A doc comment written to it would be false, which `spec.md` "What every package obeys" counts as a defect ("A sentence in a document or a head comment that the change makes false is a defect of the change").

## 4. Cases and checks

- Case 1 is consistent. It is a G128 test row (`spec.md` "What every package obeys", test rule), and its "today" result reproduces (the probe above).
- Case 2 is consistent.
- Case 3 is consistent. `vocab.statuses.acknowledged` is a real flag: `grep -n acknowledged config/catalogs/vocab.yml` printed `140:  awarded: { ..., acknowledged: true, ... }`.
- Case 4 is consistent.
- Case 5 is consistent; checked by a run.
- Case 6 is consistent. The probe over `<scratch>/hub3` printed today `cfg manifest_fields.1.field | manifest_fields.1.field names title, a field oculus's project form already has; the row is left out`.
- Case 7 is consistent. Today it printed `cfg manifest_fields.2.from | manifest_fields.2.from is not a value a field of the project form takes; the row is left out`.
- Case 8 is consistent. Today `schemaFindings(engineDir(), loadConfig(engineDir()).config)` printed `[]`. The case asks for runs of tests that import `schema-findings.ts`, a file the step does not change, but that file calls the changed `schemaFileProblems`, so the run checks the change's effect. Those tests are also in `npm run test:quick`'s related selection, so the separate run repeats part of the list. It is allowed under "Token discipline" as a run of files covering the change.
- Case 9 is consistent. Today the hub with no row for `grant_id` gives `snap grant_id | key grant_id is not declared by the schema of this file` (hub3 probe), which is the "undeclared key finding" the case expects after the change. It checks a place the step does not change (the manifest validation), as the observable consequence of leaving the row out. It is justified.
- Case 10 is consistent; checked by reading.

Findings: no case breaks `spec.md`. Case 8 (schema-findings tests) and case 9 (manifest validation) check places the step does not change. Both are justified as the effect of the change, so neither is a defect.

## 5. The question

The question for each: could this pass without the goal being reached?

- Case 1: no. It requires the finding with the hub's file, the key `manifest_fields.0.from` and the sentence naming `nope`.
- Case 2: no for its input. The case text gives no file or key, but item 5's test row asserts `<hub file> | manifest_fields.<i>.from | <the sentence>`.
- Case 3: yes. It passes on today's tree, since it guards against false findings only. It also does not cover the false finding that does arise (`vocab.leads_fit`, check 3).
- Case 4: yes. It is a regression guard and passes today.
- Case 5: no. It needs a finding.
- Case 6: yes. It passes today (hub3 probe).
- Case 7: yes. It passes today (hub3 probe).
- Case 8: yes. It passes today; it guards the refactor of item 1.
- Case 9: yes. It checks that the row is left out. A row dropped with no finding would give the same manifest finding.
- Case 10: yes. It is documentation read by eye.
- The step line's check (Verify 2 and 3, the new test row failing on the unchanged tree, then passing): no, for the inputs the row holds. Yes, for the goal as a whole: a `vocab.statuses.nope` or `from: []` row would still be told nothing, and the check would pass.
- Item 1's check (case 8 together with cases 1 and 2): yes. Item 1 accepts `vocab.<key>.<anything>`. Case 3's `vocab.statuses.acknowledged` does not separate "the field is checked" from "it is not".
- Item 2's check (cases 1, 2 and 5): no for those inputs. Yes for `vocab.<key>.<field>` with a field no row carries, and for `from: []`. Both name no list (`lists.ts:4-5`), and the hub2 probe shows today's result for each:
  - `snap ... | st[0] | st[0] is a, which is not a key of vocab.statuses.nope`
  - `snap ... | e[0] | e[0] is z, which is not a key of ` (the source name is empty)

  Neither gets a finding under the brief.
- Item 3's check (the test row's exact message): no.
- Item 4's check (case 10): yes. It is reading only and does not bear on the goal.
- Item 5's check (the row fails first on the unchanged tree): no.

Findings:
- Item 1 and item 2 can pass with rows whose `from` names no list left untold:
  - `from: vocab.statuses.nope`: decision 2 exempts it, on the false reason in check 3.
  - `from: []`.
- Case 3 passes today and does not test the one false positive the design has (`vocab.leads_fit` set by the hub).

## 6. Implied inputs

This is a code step. The inputs come from the code of `readManifestFields`, the row shape, `schemaFileProblems` with `vocabSource`, and `mergeHub`.

- **A hub that sets `leads_fit` and a row `from: vocab.leads_fit`.** It would happen, since `leads_fit` is a hub key oculus ships none of. A wrong answer drops a valid field with a false finding. Missing from "Cases". Expected: no finding and the row taken, as the merged config and the build treat it as a list (hub2 probe: no snapshot finding for `fit: [strong]`). The same row in a hub that does not set `leads_fit` should get the finding.
- **`from: vocab.<key>.<field>` with a field no row of the merged `<key>` carries as `true`** (`vocab.statuses.nope`). It names no list (`lists.ts:4-5`), and the wrong answer costs a finding on every manifest value (hub2 probe). Missing as a case that gets a finding. Decision 2 exempts it on a false reason (check 3). Expected under the goal: a `manifest_field_from` finding naming `vocab.statuses.nope`, with the field's list read after the hub's own vocabulary is laid in. A hub can add a flag to a row, so the field part is known only after `hub-layer.ts:518-531`.
- **`from: []`.** The shape accepts it (`manifest.ts:34`). The wrong answer is today's manifest finding with an empty source, `e[0] is z, which is not a key of ` (hub2 probe). Missing. Expected: a finding on `manifest_fields.<i>.from` saying the row names no list, and the row left out.
- **`from: ""` (or `[""]`).** The shape accepts it (`common.ts:8`), and today the row is taken (the hub3 probe printed the row `{"field":"a8",...,"from":""}` in `manifest_fields`). Under item 2 it gets `manifest_field_from` with `{1}` empty: "manifest_fields.3.from names , which is no registry, projects or vocab list; the row is left out". The finding names no source, which fails the goal's "naming the row's `from`". Missing; this is the empty case the state file's rule asks for (`orchestrator-state.md:136`, "lists its empty, duplicated and colliding cases as acceptance items"). Expected: a finding that names the empty source in words a reader can read, or a sentence fitted to an empty source.
- **`from: [nope, nope]`, a repeated source.** Item 2 ("the first such source") gives one finding naming `nope`. This is low cost; it is covered in effect by case 5.
- **`from: vocab` or `from: vocab.`.** `vocabSource` gives key `''`, which is not in `VOCAB_FILE_KEYS`, so the function gives a finding. This is correct under the brief and low cost; not needed as a case.
- **A row with `from` on a widget that takes none** (`type: text, from: nope`). Under item 2 it gets the finding and is left out, consistent with "a row whose `from` holds a source ...". This is low cost; not needed.

Findings: four implied inputs are missing from "Cases":
- `vocab.leads_fit` set by the hub: expected no finding, the row taken. As briefed it gets a false finding.
- `vocab.<key>.<field>` with no such flag: expected a finding.
- `from: []`: expected a finding.
- `from: ""`: expected a finding that names its source readably.

## 7. ADRs

`ls docs/adr` printed "ls: docs/adr: No such file or directory". There is no record.

Findings: none.

## 8. Dictated text

- `manifest_field_from: '{0} names {1}, which is no registry, projects or vocab list; the row is left out'`. Found by `grep -n "manifest_field_from: '" .scratch/migration/agents/briefs/O73.md` (line 37). Holds against `spec.md` "The working rules that bind every package", Prose (ASCII, no em dash, no quip, no 'not X but Y'), and against "What every package obeys" (ASCII). With an empty source it reads "names , which" (check 6); that is a defect of the input handling, not of the sentence's words.
- Case 1's expected line, `<hub>/.oculus/config.yml | manifest_fields.0.from | manifest_fields.0.from names nope, which is no registry, projects or vocab list; the row is left out`. Found by `grep -n "manifest_fields.0.from names nope" briefs/O73.md` (line 45). Holds.
- The G128 sentence for the orchestrator at landing, "A `manifest_fields:` row of a hub adds its field to that hub's project form and manifests and to no other hub's; a row naming a field oculus has, a section the form lacks, a type the form does not draw, a `from` that names no registry, `projects` or vocab list, no field, or a field another row names is a finding and is left out." Found by `grep -n "At landing, the orchestrator extends G128" briefs/O73.md` (line 41).
  - It holds against `spec.md` Prose (ASCII, no em dash, plain).
  - The inner "registry, `projects` or vocab list" sits inside an outer list joined by commas and "or", so a reader can take `projects` as a separate kind. This breaks no named rule of `spec.md`.
  - It leaves out the row-shape kind (`manifest_field_shape`), as G128 does today.
- Item 1's quoted rule, "a source is a list when it is `projects`, a registry, or `vocab.<key>[.<field>]` whose key is a key of `vocab.yml` set in the merged config". Found by `grep -n "a source is a list when" briefs/O73.md` (line 34). It describes the rule and is not text for a file. Holds.
- Item 1's reason for the doc comment, "since which rows carry a field is known only from the data". Found by `grep -n "known only from the data" briefs/O73.md` (line 34). It is a requirement on what the comment says rather than its exact words, but it fixes the reason. Writing it breaks `spec.md` "What every package obeys" ("A sentence in a document or a head comment that the change makes false is a defect of the change"), since the field lists come from the merged config (`run.ts:233`, `lists.ts:25-37`).
- Item 4's kind, "a `from` that names no registry, `projects` or vocab list" (line 38), is to be written "in the words each line already uses". It is not dictated.

Findings: the reason item 1 dictates for the doc comment ("known only from the data") is false and would make the comment false (`spec.md` "What every package obeys"). The sentence and the G128 line hold.

## Declined to judge

- Whether a `vocab.<key>.<field>` with no such flag should be a finding at all, for a hub row and for oculus's own schema files alike. That is a design choice under ruling 342 (decision 2 of the brief), and it is the orchestrator's or Axel's call. I report only that the reason given for the exemption is false and that the goal's wording covers it.
- Where the fix for the `leads_fit` false finding goes: checking `from` after the hub's vocabulary is laid in (`hub-layer.ts:518-531`), or passing the hub's written vocabulary into the check. That is the orchestrator's choice for the brief.
- The worktree `.agents/worktrees/migration-O73` (brief line 28) was not checked, since the `spec` skill creates it after the brief check.

Agent usage: a29e38315e43e1a49, claude-opus-5-5, 174594 tokens, 42 tool uses, 7 min 6 s.
