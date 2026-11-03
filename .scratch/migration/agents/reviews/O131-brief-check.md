# Brief check of O131 (`.scratch/migration/agents/briefs/O131.md`, main at 247cfe1ba)

## 1. Names

Main checkout `/Users/axelfaes/workspace/oculus` at 247cfe1ba (`git log --oneline -1`).

- `git grep -n "multiSchema" -- . ':!.scratch'` gives only `options.ts:107` and `:157`, both inside the write list.
- `git grep -n "one text of words\|joined by spaces\|words joined\|one text of\b" -- src docs config tests README.md` gives `options.ts:106`, which is in the write list. Every other hit is about something else ("words joined by dashes/hyphens", `turns.ts:228`, `datasets.ts:88`), and the change makes none of them false.
- `config/options/appearance.yml:11` (the "`joined: true` writes a multi as one text separated by spaces" sentence) and `catalog/options.ts:88` stay true.
- `docs/HELP.md:570` ("Ctrl+Space completes the keys, each with its description") stays true.
- The head comment of `tests/data/sources/config/catalog/options-schema.test.ts` (lines 1-11) lists what each describe holds. A new describe leaves it incomplete. Item 2's grep does not find it, so the brief should say that this head comment gets a sentence.

Consumers of the served schema's shape, checked by reading code and by read-only runs under `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o131/`:

- **Editor marks, completion and hover.** These come from yaml-language-server 1.24.0 (`package.json:129`, `src/lib/server/machine/lsp/adapters/yaml/settings.ts`), not from `check.ts`. `check.ts` `checkDocument` runs in the build only on hub data files and manifests (`run.ts:476`, `:541`, `:568`). For config files it runs only in `options-schema.test.ts` and `config-folder.test.ts`. The Settings view reads the catalog and not the schema (`state/system/config/editors/*`). `engine.ts` `shapedSchema` and `withShapes` touch only top-level keys listed in `inPlaceOf` (`in-place.ts:84-122`), and none of those is a multi.
- **Run of yaml-language-server** (`node real.mts`): the server's own validation over the served hub and `layout.yml` schemas, as served today and with the brief's form laid on a copy. Quoted:
```
hub sort nonsense      editor now [] | editor brief ["2: Incorrect type. Expected \"array\"."]
hub sort 'stage year'  editor now [] | editor brief ["2: Incorrect type. Expected \"array\"."]
layout tier nonsense   editor now [] | editor brief ["2: Incorrect type. Expected \"array\"."]
hub skip_tiers nonsense            editor brief ["2: Incorrect type. Expected \"array | null\"."]
hub skip_tiers [research, nonsense] editor now [] | editor brief ["2: Incorrect type. Expected \"array\"."]
hub sort [stage, nonsense]  editor now/brief ["2: Value is not accepted. Valid values: \"stage\", \"year\", \"title\"."]
```
  - With the brief's form (list first, then `{ enum }` with no `type`), the editor marks a wrong one-text word, but its message says the value must be a list. That is false: the rule takes `sort: year`.
  - `node yls.cjs`: `sort: 3` reads "Expected one of array, string" today and "Expected \"array\"" after.
  - `node yls2.cjs`: putting the `enum` branch first, or writing `{ type: 'string', enum }` first, gives "Value is not accepted. Valid values: ..." for the one-text form. The tree's own vocab whole-file shape already serves `sort` that way (`node vsort.mts`): `{"anyOf":[{"type":"string","enum":["stage","year","title"]},{"type":"array","items":{"type":"string","enum":[...]}}]}`.
  - Keeping `type: ['array','string']` and `items` and adding `if: { type: 'string' }, then: { enum: words }` gives the right message everywhere and keeps "Expected one of array, string" for a number.
- **Oculus's checker (`check.ts` `surfaced`, lines 185-202).** A union of two non-null branches is worded by its own error alone, `findings.schema.invalid` ("{0} does not fit the schema of this file"). With the brief's form (`node real.mts`, "ours"), C1 goes from `2: categories[0].sort[1] is nonsense, which is not one of stage, year, title` to `2: categories[0].sort does not fit the schema of this file`. Every one-text row gets the generic sentence. The if/then form keeps `not_allowed` with the word list (`node ajv.mts`, rows D).
- **Completion and hover.** Decision 3 says "completion is unchanged", which is false (`node yls.cjs`). At `sort: ` the editor offers nothing today and offers `stage, year, title` after. Hover gains an "Allowed Values" list. Both are user-visible changes the brief does not list.
- **`x-from`.** `check.ts:255` reads `x-from` from the parent of an enum error. `multiSchema` writes none before or after, so no change.

## 2. The step line

How each part of the step line (`plan.md:1641`) maps to "What to build":

| Part of the step line | Requirement that serves it |
|---|---|
| "holds the one-text form to the field's words as the value rule reads it" | Item 1 |
| "gives `anyOf` of the list of the words and one of the words alone" | Item 1 |
| "since the value rule reads a text ... as one word" | Item 1 and Decision 1 |
| "so the editor marks a wrong word written either way in `config/` and a hub's `.oculus/config.yml`" | Item 3 only. No requirement checks the editor's own validator (yaml-language-server); see section 5. |
| "the head comment of `options.ts` ... holds" | Item 2 |
| "Premise corrected at /spec ... `themes[].class` ... stays any text" | Item 1 (last sentence), Decision 2 and C9 |

- Ruling 646 as given (`plan.md:3472`) reads "a pattern of the field's words (`anyOf` of the list and the text), each word escaped". No requirement serves "pattern" or "each word escaped". The step line and the brief use `{ enum: words }` instead. That departs from the ruling's wording, and Decision 1 does not name it; it covers one word against joined words, not enum against pattern. For one string an escaped pattern `^(?:a|b)$` admits the same texts as the enum, and the enum also gives completion and the "Valid values" message. Whether this needs Axel is the orchestrator's call.
- The /spec correction is true of `multiProblem`. For a multi that is not `joined`, a string becomes `picked = [value]` (`value-rule.ts:172-173`), one word. Only `joined` splits at spaces (`:163-169`).

## 3. Premises

- `options.ts:106-113`: matches (`cat -n`).
- The head comment quote at lines 11-16: matches.
- `value-rule.ts`: `multiProblem` runs 161-181, not 161-180. `picked = [value]` is line 173, not 172. Line 172 is the `else if`.
- `lists.held` passes the rule, but only the server write supplies it (`config-fit.ts:184-190`, `:222`). The setting readers do not (`reader.ts:70-72` `listsOf`).
- `grep -rc "control: multi" config/options --exclude=local.yml` gives 6+1+7+7+1 = 22, which matches.
- `themes[].class` is at `appearance.yml:22-26`, `from: theme_classes`, `joined: true`, which matches. Its schema is any text because of `spec.joined === true` (`options.ts:111`), whatever `wordsOf` gives.
- G13 is at `guarded.md:252-254`, and its Code names the schema in `options.ts` and the rule in `value-rule.ts` (under the control word `scalar`) and "the config readers under src/lib/data/sources/config/". Its Test names both describes. `problemsOf` is at lines 46-55 and `READERS` at 67-73, which matches.
- The step line was corrected at /spec: confirmed at `plan.md:1641`.
- The O130 premise does not match O130's brief. Its "Paths this step writes" (`briefs/O130.md:54-62`) lists `src/lib/data/index.ts`, `sections/boards.ts` lines 1-3, `tests/data/sources/config/boards.test.ts`, `docs/HELP.md` 585-592 and the diagrams. There is no `portfolio.ts` and no "four tests of readOtherHub". The paths are still disjoint from O131's apart from the diagrams. `options-schema.test.ts` imports `portfolioConfigFrom` from `index.ts`, which O130 writes; O130's item 2 keeps signatures.
- The brief omits several things `spec.md` expects a brief to give:
  - the worktree and its base copy;
  - the `unused-exports.sh` base;
  - the ASCII gate in its `spec.md` form: `perl`, which replaces the `grep '[^ -~]'` form of verify 3.

## 4. Cases and checks

- **C1 to C4 against "the engine file's schema where the field lives".** For `sort` that file is `config/catalogs/vocab.yml`, matched to schema `catalogs/vocab`, the whole-file zod shape (`node vsort.mts`). The step does not change that schema. `node vocab.mts`: in that file, `sort: nonsense`, `sort: 'stage year'` and `sort: ''` each already give `2: categories[0].sort does not fit the schema of this file` on the unchanged tree. So C2's "Before: none" is false for the engine read, and these rows exercise a place the step does not change.
- **C6.** A board's `tier` is a non-joined multi whose words the schema holds. Served `config/layout` shows `/properties/boards/items/properties/tier: items={"enum":["research","personal","software"]}` (`node served.mts`). Unchanged tree: `tier: nonsense` gives [], and `tier: [research, nonsense]` gives `2: boards[0].tier[1] is nonsense, ...`.
  - "a hub's `boards:` row" is impossible: `boards` is not a hub key (`hubKeys()`, `node keys.mts`). A hub read gives `1: key boards is not declared by the schema of this file`, so item 3's "each ... against the hub's `.oculus/config.yml` schema" cannot hold for C6.
  - A hub field that can hold it: `research_audit.skip_tiers` (multi `from: tiers` in a map family with `holds: lists`). Unchanged tree: `nonsense`, `research`, `[research, nonsense]` and `[research]` all give [].
- **C1's "before and after" and the test's comparison.** It holds only for the count and the line. With the brief's form the message changes in `problemsOf` (section 1). The brief does not say whether a row compares the line number alone or `line: message`.
- **C9.** It is checked "by reading the schema, no test". The brief's own case rule says every other case of a code step is checked by a run the report quotes, so C9 needs a quoted run.
- **C10.** Two points:
  - It reads the real hub's `.oculus/config.yml`. `spec.md` says "Four things read the real hub and nothing else"; that sentence is about tests, but a case-run reading the real hub is a fifth reader and the brief should say it is allowed.
  - `spec.md` requires a case-run program's source to be quoted, which the brief does not ask for. The brief also does not name the workspace file's path.
- **C7.** It is attributed to G12, but the row that reads every shipped file through its schema ('passes every config file through the schema it is matched to', `config-folder.test.ts:657`) is not named in G12's Test. G13 names that file whole. Read-only run `node shipped.mts` (90 shipped files, brief's form laid on a copy): "files read 90 with a problem 0".
- **The test rule.** "An entry keeps one test per unit": `options.ts`'s schema already has two describes in this file. A third describe is a further one for the same unit. There is precedent, and it is the orchestrator's call.

## 5. The question

- **Item 3 and C1 to C6.** These can pass without the goal being reached. They read through `check.ts` (ajv), while the editor marks through yaml-language-server. With the brief's form, every row passes while the editor's mark for a wrong one-text word reads "Incorrect type. Expected \"array\"". That tells the user the text form is not allowed, which is not how the Settings view refuses it (`notListed`: not one of the words). No case or check reads yaml-language-server's diagnostics.
- **C1 to C4 engine-file rows.** These pass whether or not the step is built (section 4).
- **Item 1.** It can be met to the letter with the misleading editor message.
- **Item 2, verify 1 and 2, C7, C8, C10.** These check that nothing broke. None of them shows the goal.
- **The step line's check, "the editor marks a wrong word written either way".** It passes on a mark of any words.

## 6. Implied inputs

Each is checked by reading code or by a run in the scratchpad.

- **A multi in a map family with `holds: lists`** (`research_audit` value, `vocab.yml:296-305`). It is wrapped as `{ anyOf: [value, { type: 'array', items: value }] }` (`options.ts:293-300`), so today a list with a wrong word passes: `skip_tiers: [research, nonsense]` gives [] in both the editor and `check.ts`. After the change, `nonsense` and `[research, nonsense]` each give one problem, and `research` gives none. The brief does not name this.
  - `[[research]]` still passes the schema after the change, while the rule refuses a list of lists (`familyProblem`, `value-rule.ts:249-265`).
- **A multi as a value of a map keyed by its picking field** (`boards[].stages: { words: ... }`, `pickedByKey`, `options.ts:258-274`). It gets `from: [source]` with no picked source, so its words are held, and it changes too. A wrong one-text word there gives one problem after the change. Item 1's "a picked source ... keeps ... as today" reads as if it does not change.
- **`empty: true` on a multi** (`website.kinds` `stages` and `forms`, `connections.failures.for`). Both the rule and the schema ignore `empty`. `for: ''`: the rule refuses it (`['']` is outside `[cluster, git]`). The schema passes it today and refuses it after. No multi's `options` holds `''`. `sort: ''`: none today, one problem after.
- **A multi whose words are empty** (no `options`, a source with no items, for example `slurm.resource` in a hub with no clusters). The schema stays any text, while the rule refuses every word (`itemsOf` returns `[]`). A word the file holds passes the write but not the readers. Both forms of the value keep these divergences, so item 2's head-comment sentence is true only if it states them.
- **The workspace file's `settings:` (with overrides).** `withOverrides` touches only family rows and members, so a multi there gets the same schema as in the engine file. `boards` is reachable there, which is another place C6 could be read.
- **An `anyOf` message worse than today's.** Yes, in both validators (section 1). One example is `sort: 3`.
- **`null` or a number.** The rule and both forms refuse them.
- **The real hub's files.** `node realhub.mts`, read against the demo hub's served schemas: the hub's `.oculus/config.yml` gives the same problem today and with the brief's form (`104: key literature.prefer is not declared by the schema of this file`, which is there already). `.oculus/workspaces/research-hub.yml` gives none either way. Every multi in the real hub's config is written as a list (`grep`: `resource: [utwente]`, `for: [cluster]`/`[git]`), and the workspace file's `settings:` holds no multi.

## 7. ADRs

`ls docs/adr` gives "No such file or directory". Confirmed.

## 8. Dictated text

- The describe title 'the schema of a multi' (`grep -n` line 23) holds: no history word, ASCII.
- The schema shapes on line 21 are code, not prose, and hold against the character rules. The `{ enum: words }` shape is the one whose yaml-language-server message is wrong (sections 1 and 5).
- `LC_ALL=C grep -n '[^ -~]'` over the brief prints nothing.

## Declined to judge

- The real build's served schema with the real hub (its tiers and its clusters) is not verified. Building it may read the hub's `.oculus/local.yml`, which I may not read, so every run used the demo hub's build.
- Whether the `literature.prefer` problem at line 104 of the real hub's config is also in the real build is not verified, for the same reason.
- Which schema form to build (the brief's, enum-first, `type: string` first as in the vocab shape, or if/then) is not judged as a ruling. In my judgment if/then is the best fit: it keeps the editor's and `check.ts`'s word-list messages and today's message for a number, though it adds no completion at the text position. That and the ruling-646 wording departure are the orchestrator's to decide.

Usage: abd6789ecd2085c43, claude-opus-5-5, 232859 tokens, 68 tool uses, 10 min 42 s.

## Closed

- Check 1, the editor's message (yaml-language-server): item 1 takes form B, the text branch first (`{ type: 'string', enum }` then the list), which `yls2.cjs` shows gives "Value is not accepted. Valid values: ..." for a wrong word in either form; decision 3 names why the list branch is not first. Item 4 adds a quoted case-run of yaml-language-server before and after.
- Check 1, `check.ts`'s union sentence: "What is on the tree" states it and that it reaches no reader of a config file outside the two tests; item 3 compares line numbers only.
- Check 1, completion and hover: decision 3 of the old brief removed; C3 and the report's visible changes name the completion at the text position and the hover.
- Check 1, the test file's head comment: item 2 adds it.
- Check 2, ruling 646's "pattern ... each word escaped": decision 2 takes `enum`, which admits the same texts and gives the word-list message and completion.
- Check 3, line numbers: `value-rule.ts:161-181`, `:173`; `lists.held` supplied only by the Settings write is stated; the O130 premise corrected to its brief; the base copy and `unused-exports.txt` named; verify 3 is the rules file's perl ASCII gate.
- Check 4, C1 to C4 against the engine file: removed; `sort` is read in a hub's `.oculus/config.yml` only, since `config/catalogs/vocab.yml` is held to the whole-file shape.
- Check 4, C6: a board's `tier` read in `config/defaults/layout.yml`; the hub row form removed; C7 adds `research_audit.skip_tiers` for a hub.
- Check 4, C9 and C10: C11 (the joined theme class) is a quoted run; the real-hub read is removed; C9 names the row 'passes every config file through the schema it is matched to'.
- Check 5: items 3 and 4 together check the editor's own marks, so a mark of any words no longer passes.
- Check 6, the `holds: lists` family and the map keyed by its picking field: item 1 says the change reaches them; C7 covers the family; decision 5 and item 2 name the list of lists.
- Check 6, `empty: true`: C8 covers `for: ''`; "What is on the tree" states it.
- Check 6, a multi with no words: item 2 has the head comment name it.
