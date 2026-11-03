# Brief check of O130 (`.scratch/migration/agents/briefs/O130.md`, main at 247cfe1ba)

Every read and run below was made on main at 247cfe1ba (`git log --oneline -3` prints `247cfe1ba Land O129: ...` first). The probes are three node programs in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o130/` (`probe.mts`, `probe2.mts`, `probe3.mts`, plus `time.mts`). They import `src` by absolute path, plant scratch hubs under `os.tmpdir()` and delete them, and write nothing tracked.

These findings change what the builder is asked to do:

1. C1's expected message is wrong. The message does not name `nonsense`. The probe and `boards.test.ts` give `categories[7].stages.words must be one of the items of the list project_stages; it is not read`, from `config/text/findings.yml:223` `boards_value: '{0} must be {1}; it is not read'`. Item 5's "(and for C1 the message's word)" fails for any build.
2. Item 5 says the test "cannot compile against the two-parameter readOtherHub" on the unchanged tree. That is false. `vite.config.ts` has no `typecheck` setting (`grep -n -i 'typecheck' vite.config.ts` prints nothing), so vitest strips types and ignores the extra argument. On the unchanged tree C1 and C2 fail on their assertions, which is their proof, and C3 to C6 pass. The "two-parameter form" run is not needed.
3. Item 1 says the new run makes "a list that is no list or a repeated key" a finding in that hub. That is not what happens. The hub layer already gives both findings, and `categoriesFindings` then sees oculus's list and adds nothing. C6 is therefore the same before and after.
4. C3, C4, C5 and C6 pass on the unchanged tree, so they are audits. The brief's verify item 4 requires it to say which rows are audits, and it does not.
5. C7, C8 and C9 are to be checked "by reading", but the brief's own case rule says every other case of a code step is checked by a quoted run.
6. "No step is in flight" is false. The dispatch block lists O131 in preparation, and it shares `docs/diagrams/*` with O130.
7. The engine parameter of item 2 is not needed for the findings item 1 keeps (details under check 6).

## 1. Names

Command: `git grep -n 'readOtherHub\|OtherHub\b'`, `grep -rn categoriesFindings src tests docs config --exclude=local.yml`, `git grep -n -i 'hubs-and-projects\|Hubs and projects'`.

Hits outside "Paths this step writes":

- `src/lib/server/root/watch/build.ts:22,73` (`OtherHub` type, "every other hub, read with its own settings"). Not made false: the type's fields do not change.
- `src/lib/server/root/watch/portfolio/payload.ts:20,51,73` (`OtherHub` type use). Not made false. `payload.ts:90` `...others.flatMap((one) => one.findings)` is what carries the new findings.
- `src/lib/data/shapes/boards/categories.ts:49` ("the config check reports such a row ... `categoriesFindings`"). Not made false: it becomes true in every hub.
- `src/lib/data/sources/config/sections/boards.ts:223` (the function). It is unchanged, but its head comment `boards.ts:1-3` says the findings are "of the file each was read from (... config/catalogs/vocab.yml for `categories`)". That is already incomplete for a primary that writes rows, and after the step it is wrong for every hub. Item 3's grep finds line 223, not the head comment, and `boards.ts` is not in the write list. It should be added, or the brief should say why not.
- `src/lib/data/sources/config/sections/findings.ts:20,49` and its head comment, lines 1-8. Not made false: `READER_FINDINGS` is not run by `readOtherHub`.
- `src/lib/server/root/process/config-cache.ts:17-26` ("Its findings are not said here: the rebuild reports them with the build of that hub"). Not made false.
- `.scratch/` briefs and reviews (O37, O53, O57, O60, O63, O78, O85, D64, D68, O128, O129) and `.scratch/migration/agents/reviews/O33-refuter.md:374` (section name). These are dated records of past steps and the builder may not edit them. Not made false as records.
- The parameters `root` and `loaded` occur only inside `readOtherHub`.
- "Hubs and projects": only `docs/HELP.md:585`. No anchor link anywhere.
- Sentences that become true and need no edit, not in the brief's list: `docs/templates.md:445-446` ("a row naming no colour is a finding and is drawn with none", in the hub's `config.yml` template) and `docs/HELP.md:307` ("a row naming none is a finding").
- Inside the write list: the head comment of `tests/data/sources/config/boards.test.ts:1-4` describes only the config check over oculus's file. The new describe makes it incomplete, and the brief does not ask for it to be rewritten.

## 2. The step line

Command: `grep -n '^- O130' .scratch/migration/plan.md` (line 1640), `grep -n '645' .scratch/migration/plan.md` (Rulings line 3471).

- "`readOtherHub` runs `categoriesFindings` over each other hub's merged config": item 1.
- "as `payload.ts` runs it for the primary": items 1 ("worded and keyed as the primary's run") and 2 (`keyFile` as the primary's readers use it).
- "each finding naming that hub's settings file": item 1, including its filter, which goes beyond the line and is stated as decision 1.
- "so a wrong stage word or a row with no `color` in any hub gives a finding": item 1, item 5, C1 and C2.
- "and the word is not read": no requirement serves this part. It is already true (a word no project carries matches nothing in `categoriesOf`/`blockHolds`), and no item or case checks or states it.
- "the documents that say which hubs the check reads say so": items 3 and 4. The brief notes that no document says it today, so item 4 adds one.
- "A full step": Size line. "(ruling 645)": `plan.md:3471`.

## 3. Premises

- `boards.ts:223-261`: the function runs 223-260. `wc -l` prints 260, and `grep -n '^}'` prints 260.
- "READER_FINDINGS of findings.ts:48": `categoriesFindings` is at line 49, line 48 is `boardsFindings`, and `READER_FINDINGS` opens at 35. The brief's own grep line says 49.
- Hold: `readerFindings` at `findings.ts:33-37`, `startFindings` at `:52`, `payload.ts:91` `readerFindings({ engine: paths.engine, hub: primaryDir, from }, config)`, `config-checks.ts:88` `...READER_FINDINGS` (the hub taken from `layers.hub`, `:183`).
- The grep of `categoriesFindings` in `src` prints `boards.ts:223`, `findings.ts:20,49` and `categories.ts:49`. Holds.
- `index.ts:627-650` holds: doc comment 627, function 628-650, `OtherHub` doc comment 616-620, type 621-625, findings `[...findings, ...sourcesFindings(...)]`. `payload.ts:90` holds.
- `sourceFile` at `merge.ts:240-250` holds, and `fromHubFile` at `hub-names.ts:800` holds (`file === HUB_FILE`).
- Callers of `readOtherHub`: `portfolio.ts:610` holds, with `paths.engine` at `:601` (`loadConfig(paths.engine, layers)`). The test callers `choices.test.ts:86`, `workspace-projects.test.ts:53` (through its `settings` helper, line 39), `manifests.test.ts:44` and `connection-keys.test.ts:175` all hold, and each imports `engineDir`. No other caller in `src`.
- `in-place.ts:99` `categories: { kind: 'rows', field: 'key' }` and `hub-layer.ts:4` hold.
- `from.categories`, run by `probe.mts`:
  - A hub that writes a row gives `.oculus/config.yml`. Holds.
  - A hub that writes none gives `catalogs/vocab.yml`. Holds.
  - Not stated in the brief: a hub whose `categories` is no list, or repeats a key, also gives `.oculus/config.yml`, with oculus's list standing (`hub-layer.ts` sets `from[path] = HUB_FILE` for every key written, `:640`).
- `boards.test.ts:194` 'reads the shipped categories with no finding' holds. G12 is at `guarded.md:249`.
- `ConfigOptions.words`: the comment is at `merge.ts:87-95` and the type at `:96-103`. Holds approximately.
- G124 at `guarded.md:186-188` holds.
- Documents:
  - The docs grep finds no "primary alone" sentence. Holds.
  - `HELP.md:585-591` holds.
  - `config/options/catalogs/vocab.yml:321` does NOT say a row with no `color` or a wrong `sort` "is a finding naming the row". Its help speaks only of sort order and replacement.
  - The sentence is in `config/catalogs/vocab.yml:262` (lines 253-260 are `research_audit` and `roles`).
- "No step is in flight" is false. `.scratch/migration/orchestrator-state.md:26-32` lists O130 and O131, each with `landing: preparing` and a running brief check. O131's write list shares `docs/diagrams/*` (generated). All other paths are disjoint.

## 4. Cases and checks

- Test rule (`spec.md:60`): the test is named as G124's, and the orchestrator adds `readOtherHub` and the describe at landing. That is an extension, not a new entry. However, G124's text (`guarded.md:186`) does not state the behaviour, which is that each hub's category rows are checked against its own words and name its file. Its Code and Test lines would name a unit whose behaviour the text never states, and the brief does not say the text gains a sentence.
- Decision 3 chooses G124 over G13. G13's text ("A wrong config value is refused with a finding that names the key"), its Code (`sourcesFindings` of `index.ts`) and its row 'the connection keys of a hub that is not the primary' are a close fit too. This is a choice for the orchestrator.
- C1: wrong expected message, as finding 1 above. It also leaves the key unstated ("the row's stages.words place"). The run gives `categories[7].stages.words`, the merged-list index, while the row is index 0 in the hub's file.
- C3, C4, C5, C6: pass on the unchanged tree. These are audits, which the brief does not say. C6's expected result is left open. The run gives one finding before and after: `[<hub>/.oculus/config.yml, categories, "categories names x in more than one entry; none of them is applied and oculus's entry stands"]`.
- C7, C8, C9: "by reading" contradicts the brief's rule that every other case of a code step is checked by a quoted run.
- Cases that check a place the step does not change: C9 (`config-checks.ts`, unchanged behaviour), C7 and C8 (`configPayload` in `payload.ts`, which is unchanged, though its output changes through `others`).
- The C5 fixture holds: the hub layer gives no finding for it (`probe3.mts`).

## 5. The question (could it pass without the goal being reached)

- C1: yes, partly. Comparing `[file, key]` passes even if the filter of item 1 is missing, and the message clause fails for any build.
- C2: no. Without the run there is no `categories_colour` finding.
- C3: yes. Oculus's shipped rows give no finding (G12), so a build without the filter also gives none. The filter is unguarded by any row.
- C4: yes. It passes with no change at all.
- C5: yes on the unchanged tree. After the change it does discriminate: the same rows over the primary's config give `categories[7].stages.words must be one of the items of the list project_stages; it is not read` (`probe3.mts`), so a build that used the primary's config would fail it.
- C6: yes. Unchanged before and after.
- C7, C8, C9: reading only. C7 could pass with nothing built, since `payload.ts:90` already concatenates.
- Step-line check (finding for a wrong word or no `color` in any hub): reached by C1 and C2 when `portfolio.ts:610` passes the real hub. No case covers `forms` words, although the run covers them (`probe2.mts` `formsWrong`: `categories[7].forms.words must be one of the items of the list project_forms; it is not read`).
- Items 2, 3 and 4 could each pass without the goal, since they are a parameter, comments and a bullet. Item 5 is the only proof, through C1 and C2.

## 6. Implied inputs

Inputs the brief implies but does not state, each with the result the probes show on the unchanged tree and the expected result after the change:

- A `categories` value that is no list (`categories: 3`): the hub layer gives one finding, `[<hub>/.oculus/config.yml, categories, "categories must be a list; oculus's value stands"]`. `categoriesFindings` then sees oculus's list and gives none, so no `categories_block`. Expected after: the same, once.
- A repeated key: as C6 above. Expected after: the same.
- A row with no key, `{ label: X, color: ... }`: two findings for one row, in the primary today (`probe2.mts`) and in every hub after the change:
  - the whole-file shape gives `[hub file, categories.7.key, "categories.7.key must be a text"]`;
  - `categoriesFindings` gives `[hub file, categories[7], "categories[7] must be a map with a key no earlier row holds; the row is not read"]`.
  The brief should name this as expected, since it matches the primary's run.
- A finding's key is the merged-list index. Three key forms appear for one file:
  - a hub's first new row is `categories[7]` (oculus ships 7 rows), not `categories[0]`;
  - a row replacing oculus's `idea` is `categories[2]`;
  - the shape uses `categories.7`;
  - the hub layer's removed-word finding uses the hub's own index, `categories[0].stages.words`.
  This is the primary's behaviour today. Expected: C1 names `categories[7].stages.words`. Whether any view locates a finding's key in the file is not verified.
- A hub row naming a word that hub removed (`stages: { submitted: null }`): the hub layer gives `[hub file, categories[0].stages.words, "... names submitted, which the hub's words no longer hold; it is not read"]` and drops the word, and `categoriesFindings` gives none. Expected after: one finding, no duplicate.
- A second hub whose settings file does not parse: `from.categories` is `catalogs/vocab.yml` and no category finding. Expected after: none, removed by the filter.
- A hub with no `.oculus/config.yml`: the same, none. Such a folder is not a hub, so this happens only in a race.
- A workspace with no primary: every hub goes through `readOtherHub` (`portfolio.ts:607-611` filters on `workspace.primary`), and the primary's run is over oculus's config. Expected: each hub's rows checked once, on its own file. Not stated in the brief.
- `startFindings` (stderr at start) reads the primary alone (`findings.ts:52`). Other hubs' findings reach only the config channel (`payload.ts:90`, the only reader of `OtherHub.findings`, by `git grep -n '\.findings' -- src/lib/server/root/watch`). Expected: no stderr line for a second hub's category finding, as for its other findings. The brief does not say so.
- The engine parameter (decision 2): `categoriesFindings` calls `fileOf` only with `categories` (`boards.ts:232`). Item 1 keeps a finding only when that file is `join(root.dir, HUB_FILE)`, which is exactly when `fromHubFile(from.categories)`. So `fromHubFile(from.categories) ? categoriesFindings(config, () => sources, textCatalog(config)) : []` gives the same findings. It needs no engine and leaves the four test files and `portfolio.ts` unchanged, as the `sourcesFindings` call beside it already does with `sources`. The brief weighs only the engine as a parameter against the engine as a field of `HubRoot`. Which form is better is a judgment for the orchestrator.
- Cost: `loadConfig` of a scratch hub takes 225 to 242 ms and `readOtherHub` 5 to 9 ms (`time.mts`). Each row is under a second.
- A sibling gap the ruling does not cover: `vocabFindings` (`sections/vocab.ts:1-12`, words of `catalogs/vocab.yml` past the shape) is also run for the primary alone. That is a different concern from ruling 645, named only.

## 7. ADRs

`ls docs/adr` prints `ls: docs/adr: No such file or directory`. `ls docs` lists apps.md, data-map.md, diagrams, HELP.md, licenses, palette.md, templates.md, third-party.md. Confirmed.

## 8. Dictated text

- `grep -n "'the category rows of a hub that is not the primary'" .scratch/migration/agents/briefs/O130.md` prints line 27, the describe title. It holds: ASCII, no words comparing with an earlier state.
- The YAML fixtures of C1 to C6 (lines 31-36) are fixture text, not prose. They are ASCII and use the raw hex `'#16a34a'` as the existing rows of `boards.test.ts` do. They hold.
- Item 4's bullet is "worded by the builder", so it is not dictated.
- `LC_ALL=C grep -n '[^ -~]'` over the brief prints nothing.

## Declined to judge

- Whether any view or editor action locates a finding's key such as `categories[7]` in the hub's file: not verified, since the grep did not settle it.
- `color: red` in a hub row gives no finding at all, from either the hub layer or `categoriesFindings` (`probe2.mts` `badColour`). Whether the `colour` shape should refuse it is outside this step and was not read further.
- Whether `npm run diagrams` changes for the new import `data/index.ts` to `sections/boards.ts`: not run, because it writes tracked files.

Usage: a0194efcc505ed3c8, claude-opus-5-5, 190092 tokens, 54 tool uses, 7 min 42 s.

## Closed

- Finding 1 (C1's message): C1 now expects `[<hub>/.oculus/config.yml, categories[7].stages.words, "categories[7].stages.words must be one of the items of the list project_stages; it is not read"]`; the test compares `[file, key, message]`.
- Finding 2 (the compile claim): removed; item 5 says C1, C2, C3 and C5 fail on the unchanged tree, which is their proof.
- Finding 3 (no list, repeated key): item 1 no longer claims them; "What is on the tree" states the hub layer's findings, and C7 checks they are said once.
- Finding 4 (audits): item 5 names C4, C6 and C7 as audits of what the change preserves.
- Finding 5 and check 4 (cases by reading, places the step does not change): the reading cases (old C7, C8, C9) are removed; every case is a row of the test.
- Finding 6 (in flight): "What is on the tree" names O131 and the shared `docs/diagrams/*`.
- Finding 7 and check 6 (the engine parameter): item 1 runs the check only when `fromHubFile(from.categories)`, with `fileOf` giving the hub's settings file; item 2 keeps the signature, so `portfolio.ts` and the four tests leave the paths; decisions 1 and 2 rewritten.
- Check 1 (`boards.ts:1-3`, `boards.test.ts:1-4`): both head comments are in item 3 and the paths.
- Check 2 ("the word is not read"): item 1 states it.
- Check 3 (line numbers, vocab help): `boards.ts:223-260`, `findings.ts:49`; the documents bullet cites `config/catalogs/vocab.yml:262`, `docs/templates.md:445-446` and `docs/HELP.md:307`.
- Check 4 (G124's text): decision 3 says the orchestrator adds the behaviour to G124's text at landing.
- Check 5 (forms words): C3 added.
- Check 6 (implied inputs): C5 (a row with no key, two findings), the merged index keys, the removed word, the stderr reading the primary alone and a workspace with no primary are stated under "What is on the tree".
- Check 6 (`vocabFindings` for other hubs): a different concern from ruling 645, not in the step.
