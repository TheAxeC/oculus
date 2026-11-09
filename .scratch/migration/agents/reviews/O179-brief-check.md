Report of the brief check of O179, oculus main at f85e3e183 (`git rev-parse HEAD`). Nothing in the repository was changed.

Three read-only probes are in the session scratchpad (full directory /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad): probe.mjs, probe2.mjs and walk.mjs.

Three findings decide the brief; each is detailed below:
- Case 1 cannot give two findings through the helper it names.
- Premise 5 is false, so two existing assertions go red.
- The one form of the first defect a hub file can reach is outside item 2.

## Names

Command: `git grep -n <name> -- . ':!.scratch'`, and `git grep -nw` for `place` and `which` over `src/lib/data/sources/config/{settings/rows,catalogs.ts}`. Hits outside the brief's "Paths this step writes":

| Name | Hit | Does the change make it false? |
|---|---|---|
| `RowIssue` | `settings/reader.ts:15,29` | no: import and union member |
| `RowIssue` | `settings/rows/read.ts:15,30` | no: `pushed` hands the issue on whole |
| `place` | no hit outside the write list with this meaning; `catalogs.ts:135-136` is a local variable of another function | no |
| `which` | `catalogs.ts:337,343` only, in the write list | none outside |
| `list_empty` | `config/text/server.yml:310`, `src/lib/server/core/files/yaml/why.ts:32` | no: that key is `server.edit.list_empty`, another group |
| `list_clear` | none | none |
| `InlineItems` | `FieldControl.svelte:7,80,402` only, in the write list | none outside |
| `settingFindings` | `sections/findings.ts:11,38`; `tests/checks/config/config.test.ts:2,22,473,479,482,617,628,629` | no |
| `settingFindings` (comment) | `config-checks.ts:24`, `live-settings.ts:15`, `autofetch.ts:9`: comments about a wrong value being a finding | no |
| `settingFindings` (other function of the same name) | `apps/read/across/stored.ts:50,103`; `tests/routes/docs/audit.test.ts:119,799,800,852` | no |

`docs` and `README.md` hold none of these names (`grep -rn --exclude=local.yml -E "RowIssue|settingFindings|InlineItems" docs README.md config` printed nothing).

Unchanged by the step and stale on its own: `config-checks.ts:23-24` says the setting readers are in neither list, while `FINDERS` at `:87-88` spreads `READER_FINDINGS`, which holds `settingFindings`.

Not false but incomplete after the change, both outside the write list: `src/lib/data/sources/config/catalog/options.ts:83-85` and `config/options/appearance.yml:11` describe `empty` as adding the empty value to a choice or path. Neither says what `empty` does on a list.

## The step line

Step line at `plan.md:1725`, Ruling "Open item 742" at `plan.md:3698`. `plan.md` has no Goal section (`grep -n "^## " plan.md`), so I took the step line and ruling 742 as the goal.

| Part of the step line | Part of "What to build" |
|---|---|
| `RowIssue` carries the row's position | item 1 |
| the finding key of `settingFindings` uses it | item 2 |
| two refused rows of one setting that share a key are two findings | item 2, only for `where === 'row'` (gap: see Implied inputs 4) |
| one row with several issues stays one | item 2 |
| a list field that may be empty is drawn differently while absent and while set empty | items 3 and 4 |

Parts with no requirement in the step line:
- The Clear button that calls `onpick(undefined)` (item 3, second bullet). The step line asks only for drawing differently. The brief books it as Decision 3.
- Item 5, the head comments. This is a `spec.md:72` obligation, not the step line.

## Premises

| # | Claim | Check | Result |
|---|---|---|---|
| 1 | `catalogs.ts:336-342` | `sed -n 336,342p` | holds; `problem.issue.row` at :341 |
| 2 | `rows/check.ts:32-49`, `labelOf` line 80 | Read | `RowIssue` is 32-48; `labelOf` is at line 81 (line 80 is its doc comment). Off by one, no effect |
| 3 | `checkRows` at 309-330, only list loop via `labelOf`, called at read.ts:41, :84 | Read; `git grep -n "checkRows("`; `grep -n labelOf check.ts` | the function ends at 328 (`wc -l` 328), so "309-330" is wrong. The rest holds: `labelOf` is used at 279 and 292 only, and those two checkers are called only at read.ts:41, :74, :84 |
| 4 | read.ts:74 one row; `files.ts:293,:310` carry `row: at` | Read | holds. read.ts:74 is `venues.browser`, one row, so no two rows share its label. read.ts:101 is `row: ''`, one problem. The other `where: 'row'` producers are files.ts:294 and :311 |
| 5 | `git grep -n "kind: 'repeat'" -- tests` prints nothing, "so no test compares a `RowIssue` as a whole object" | same grep (exit 1); `grep -rn --exclude=local.yml "issue: {" tests` | The grep holds; the conclusion is FALSE. See below the table |
| 6 | `FieldControl.svelte:401-407`, `wordsOf` at fields.ts:138 | Read | holds |
| 7 | `InlineItems` holds items and Add only | Read | holds |
| 8 | exactly one `control: list` with `empty:` | `node walk.mjs` over `config/`, every file named local.yml skipped | one: `options/website.cv_sections/fields/record_fields`, `empty= true`; no `parked` field. Checked for every options file but `config/options/local.yml`, which my task's rule excludes |
| 9 | `FieldControl.svelte:17`; `draft.ts:18-19` | Read | holds; the draft.ts sentence is at lines 17-18 |
| 10 | workbench.yml:92 `unset: Not set` under `settings` | `sed`, `grep` | holds; the `settings:` group is at line 12 |
| 11 | no ADR | `ls docs/adr` ("No such file or directory"), `git ls-files docs/adr` empty | holds |

Premise 5 in detail. `tests/server/core/reader/reader.test.ts:632-634` and `:683` compare `issue: { kind: 'https', row: 'plain', at: 'address' }` and `row: 'doi'` whole with `toEqual`, both through `readOwn` into `literatureRows` / `linkRows`, that is, through `checkRows`. Once `checkRows` sets `place: 0`, both go red. The file is in the write list, but the brief names these edits nowhere and says only "new rows". `spec.md:62` requires them in the report. `tests/data/hubs/website-files.test.ts:800,837` also compare whole, but those issues come from `files.ts`, which gets no `place`.

Consumers of `RowIssue` for an added optional field:
- `rowText` (`catalogs.ts:242-266`) destructures `row` and `at` only: unaffected.
- `read.ts:31` pushes the issue whole: unaffected.
- No spread or comparison exists in `src` (`grep` for `issue.row|problem.issue|.issue` printed `catalogs.ts:298,341` only).

`checkRows` is the only list source of issues sharing a label, as the brief says. But two rows of one key never reach it from a hub file, as follows.

`hubShapeOf` gives `{"kind":"rows","field":"key"}` for `literature.sources`, `recover.sources` and `links` (probe.mjs), and `mergeRowsInPlace` (`merge/in-place.ts`) skips every row whose key repeats. Probe output:
- `two rows key a laid over one shipped row: {"value":[{"key":"crossref","format":"json"}],"problems":[{"kind":"repeated","entry":"a"}]}`
- `links three rows of one key: {"value":[],"problems":[{"kind":"repeated","entry":"doi"}]}`

So a hub file with two rows of `key: a` gives one finding, `settings_repeated` ("more than one entry", `config/text/findings.yml:155`, the only hit of that phrase), as the standing rows 'two rows of one key' and 'a links key twice' assert. The readers never see the rows. The defect reaches `checkRows` only for a config map handed in directly; that is also what the O178 refuter's run did, by its result line at `O178-refuter.md:196`.

## Cases and checks

Against `spec.md`:

1. Test "two rows of `key: a`, both `http:`: two findings", as a row of the describe that uses `hubFindings` (`reader.test.ts:777`, which goes through `loadConfig`). Inconsistent with the tree: through that helper the result is one finding before and after the step (see Premises). The brief's "Unchanged tree: one" is true and "two findings" cannot be reached. The input has to be a config map given to `settingFindings` directly.
2. Test "one row with two issues (the existing `adress` row)". It is listed under "new rows", yet it stands already (`reader.test.ts`, first row of `ROW_FINDINGS`). The row does hold two issues: unknown `adress` and missing `address`. No new row is possible.
3. Test "the first refused and the second valid". It states no expected result ("as the code gives them"), which is a test fitted to the code (`spec.md:13`, lazy option). Through `hubFindings` it is the merge finding, not "the first row's issue". Directly, the probe gives `{"rows":[second row],"issues":[{"kind":"https","row":"a","at":"address"}]}`, one finding before and after, so `spec.md:69` (the failing line on the unchanged tree) has nothing to quote.
4. "New rows" of the describe: `it.each(ROW_FINDINGS)` asserts `toHaveLength(1)` and reads `findings[0]`, so a two-finding row needs a count field or a separate `it`. The brief does not say which.
5. The `links` run gives "the number of findings, quoted" with no expected number (expected: two).

Cases that ask the builder to check a place the step does not change:
- The three draft runs over `state/system/config/editors/draft.ts` (not in the write list). All three already give the stated result on the unchanged tree (probe2.mjs; see Implied inputs 1).

The read-only and look items are consistent with `spec.md:65,67`.

The brief's verify list omits `npm run diagrams` and the 520-line limit for a component. `spec.md:26,48` bind regardless; `FieldControl.svelte` is at 475 lines.

## The question

Goal: the step line and ruling 742.

Items:
- Item 1: yes, by itself. Nothing but item 2 and its cases read the field.
- Item 2: yes. It can pass on config maps given directly while a hub file with rows of one key still gives one finding from the merge, and `website.cv_sections` with three rows of one key still gives one (Implied inputs 4). Its sentence "a finding of its own even while the earlier row has an issue" holds only when the earlier row is read, as with an `unknown` issue (probe: `[{"kind":"unknown",...},{"kind":"repeat",...}]`). A refused earlier row leaves the later row read, with no finding, as the case-3 probe output in "Cases and checks" shows.
- Item 3: yes in the tests, no at the look. No case exercises the `FieldControl` branch (`spec.md:67`), so only the look at landing proves the three states.
- Item 4: no. A key with no reader fails the orphan check (`spec.md:90`, by reading; the check was not run).
- Item 5: yes, it bears on no goal.

Cases:
- Two rows http: cannot pass as written.
- `adress` row: passes today, a regression guard only.
- Refused plus valid: passes whatever the code gives; no expected value.
- Not a list, `literature.prefer` wrong, zenodo two refused rows, cv two `personal` rows: each passes today (labels distinct or single row), so each passes without the goal. These are guards of `which`.
- `links` three repeats: no number is stated, so any count passes. This is the only case that exercises the `checkRows` path with distinct `place`s.
- The three draft runs: pass today and prove nothing about drawing.
- Read item: the diff read does not prove it; the look does.

## Implied inputs

1. Clear on a family card (`record_fields`). Checked by reading and by probe2.mjs over a row whose field spec is `{control:'list',empty:true}`:
   - no field: `[{"key":"k","fields":["title"]}]`
   - picked `[]`: `...,"record_fields":[]}`
   - picked `undefined`: key gone
   - a file holding `[]` then cleared: key gone

   The key is dropped through `cardOf`, `withField` and `recordOf`. In a card, `Cards.svelte:302` sends `{do:'set',value}` with the card's path. Holds; expected result as stated.
2. `spec.empty` in a record field reaches `FieldControl`: `readSpec` recurses over fields (`options.ts:424-426`) and keeps `empty` (`:467-468`); `row.fields` is `entry.fields` (`rows.ts:294`), and `Cards.svelte:224-225,285-287` passes it. Holds. `website.cv_sections` has no `sparse`, so an absent field is drawn and the Not set state is reachable.
3. Identical messages for two rows of one key: `settingFindings` keeps both.
   - `allFindings` (`state/workbench/navigation/status.ts:474-486`) does not de-duplicate.
   - `Findings.svelte:165` is keyed `file:key:index`, so no duplicate key.
   - Config findings have no signature or mute; the audit's `signatureOf` is the audit scan's own.
   - `config-checks.ts:174,198` compare by message in a Set, so a second identical finding is never "fresh" and never refuses a write.
   - Expected and unstated in the brief: the two findings read word for word the same, since `place` does not reach the message.
4. Missing, with a cost: `website.cv_sections` with three rows of one key. This is the form of the first defect a hub file can reach, because `hubShapeOf('website.cv_sections')` is undefined (replaced whole, no merge check). `files.ts:313` pushes `where: 'repeat'` with the row's key as `name`, and `catalogs.ts:338-339` keeps one finding per name. Three rows `key: news` give one finding; by the step line the expected result is two. Item 2 does not touch `where: 'repeat'`. Adding it widens the step beyond `RowIssue`, so it is a decision, not a brief edit. Read from the code, not run, since `loadConfig` was not run.
5. Missing, cost low: `record_fields:` with no value (YAML null). `readField` (fields.ts:281) gives STUCK, so `cardOf` keeps it and it is drawn as "cannot show", not as absent. Not stated; expected: as today.
6. A top-level `control: list` with `empty` never reaches the list branch: `specsOf` makes each item a text spec and `Editor`/`Cards` draw it. Not reached today; one list field carries `empty`. An app setting's list has no `empty` (`other-rows/app-rows.ts:52`), so `AppControl.pick`, which ignores undefined, is not reached.
7. Add then remove from the absent state gives `[]` (held empty, the Clear state), not absent. Consistent with Decision 3; unstated.

## ADRs

None. `docs/adr` does not exist (`ls docs/adr`, `git ls-files docs/adr` empty), so no record is touched.

## Dictated text

| Text | Command | Result | Verdict |
|---|---|---|---|
| `Empty list` | `grep -n "Empty list" O179.md` | lines 34, 73 | holds |
| `Clear` | `grep -n "Clear" O179.md` | lines 34, 73 | holds |
| `Not set` (existing) | `grep -n "Not set" O179.md` | lines 22, 73 | holds |

The brief dictates the keys, the words and no other text for any file. The `settings` group is declared only in `config/text/views/system/workbench.yml` (`grep -rln --exclude=local.yml -E "^    settings:" config/text`), so `spec.md:51` holds. The comments and tests are described, not dictated.

## Declined to judge

- Whether the Clear button stays or goes: Decision 3, the orchestrator's.
- Whether the first defect is worth building at all while no hub file can reach it, and whether `where: 'repeat'` belongs in the step: both go to the orchestrator or Axel, since a brief check does not widen a step.
- Whether `Empty list` and `Clear` read well to the reader: seen at the look.

One grep of mine over `config/options` passed `--exclude=local.yml` after `--`, where git treats it as a path. It printed one line of the tracked `config/options/local.yml` (line 16). `config/local.yml` itself is not tracked (`git ls-files --error-unmatch config/local.yml` fails) and was not read.

Usage: a8f1c2ab3bdcbe17f, claude-opus-5-5, 261781 tokens, 34 tool uses, 586 s
