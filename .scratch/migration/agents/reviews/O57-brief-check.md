# Step O57 brief check (on main at 300ed6c5)

Main moved from 0a3c9b0e to 300ed6c5 while I worked. `git diff --stat 0a3c9b0e HEAD` changes only `.scratch/migration/agents/reviews/O49-report.md`, `orchestrator-state.md` and `queue.md`, so every fact about the tree below holds at both commits. Brief: `/Users/axelfaes/workspace/oculus/.scratch/migration/agents/briefs/O57.md` (187 lines).

The standing demand "Brief check scope" (`orchestrator-state.md`, standing demands) applies here. Findings 1.3, 3.4, 3.5 and 6.2 have fixes that add paths or requirements beyond the brief's list, so each is marked "goes to Axel".

## 1. Names

Checked: every name the step changes, grepped with `git grep -n -w` across the repository with `':!config/local.yml' ':!.scratch'`.

- `chat_context` and `chatContext`: no hit (new names).
- `COLLECTION_ORDER`: context.ts:11 and :39 only.
- `portfolioContext`: context.ts:31, chat.ts:18 and chat.ts:125.
- `chat_instruction`: config/text/server.yml:57, chat.ts:116 and terminal-actions.test.ts:534.
- "hub root" (`git grep -n -i 'hub root'`): config/text/server.yml:57 and terminal-actions.test.ts:544. Every other hit is a comment about some other hub-root path, and the change does not touch them.
- `HUB_LIST`: hub-names.ts:219, 329, 367, 372, 378; merge/hub-layer.ts:2 and :17; merge/merge.ts:5 and :116.
- The data-map block: docs/data-map.md:80-98.
- Users of `hubKeysOf` and `hubFileOf`: writes.ts:584, config-place.ts:118 and :139, state/system/config/rows.ts:376, groups.ts:324, write-files.ts:96, engine.ts:136-137.

Hits outside "Paths this step writes":
- hub-names.ts:219 (doc of `HUB_FILE`): "one map of the keys of HUB_LIST". Still true.
- hub-layer.ts:2, :17 and merge.ts:5, :116 describe HUB_LIST in general terms. Still true.
- roots.ts:147, doc of `primaryConfig` ("as a write, a chat's context, ... read them"). Still true, since the primary is still read by `primaryConfig`.
- terminal-actions.test.ts:2, head comment ("private index lifecycle"). This file is in the write list as a whole; still true.
- config/defaults/sources.yml:4 ("The keys from scan to apps_dir are the hub list"). Still true with the key placed after `collections`.
- The users of `hubKeysOf` and `hubFileOf` pick up the new row by registration. None states a count, so none becomes false.

Findings:
- 1.1. config/text/server.yml:57 keeps "Resolve its index folder against the absolute hub root before reading its README.md, code/README.md, manuscript/ and code/". Item 5 says "The rest of the text stays word for word". This sentence leans on the "hub root" that item 5 removes. With one section per hub, a project of another hub is resolved against that hub's folder, not `{0}`, so the kept sentence becomes false. Item 5 should cover this sentence too. The line is already in the write list (`config/text/server.yml lines 57-57`).
- 1.2. chat.ts:16 (`import { primaryConfig } ...`) and chat.ts:18 (`import { portfolioContext } ...`) are outside the write list, which covers lines 1-3, 42-46 and 100-125. Item 4 builds the index "by item 3 from `open`, the merged config and `options.hubSettings`", so the `primaryConfig` call at chat.ts:124 moves into context.ts. That leaves line 16 unused, and the lint fails. The range needs to include lines 16-18. This is a fix to the brief's own list, inside the same file.
- 1.3. `allHubs(merged, open, settings)` (roots.ts:76-89) and `hubTargets(open, settings)` (roots.ts:57-68) already read every hub with its settings: the primary through `primaryConfig`, the others through `portfolioConfigFrom(settings(one.dir))`. Callers: routes/api/(docs)/memories/+server.ts:15, wallpaper/+server.ts:18, root/watch/portfolio.ts:661, writes.ts:322, task-start.ts:43, project-files.ts:251.
  - Item 3 describes this reading again from scratch and names neither function, against spec.md ("The principles every package is judged on": "a parser, a fold or a rule exists once and is reused").
  - `allHubs` answers "in the folders' order", while Decision 2 puts the primary first. The brief should name `allHubs` as the reader and say the primary is moved to the front, or explain why it is not reused.

## 2. The step line

Checked: plan.md:678 (O57, no Step 0: line 679 is O58) and plan.md:2440 (ruling 212), mapped to "What to build".
- "the portfolio chat's index holds the projects of every hub of the workspace": items 3 and 4.
- "and the collections each hub's `chat_context:` names": item 1 (the key), item 2 (the reader), item 3 (resolution per hub).
- "in place of the primary's projects and the six collection keys written in context.ts": item 3 ("`COLLECTION_ORDER` goes").
- Ruling 212 (a) "a hub-list key `chat_context:`": item 1 (HUB_LIST row, defaults, options, EXPECTED, template).
- Ruling 212 (a) "oculus's default naming the six it reads today": item 1's default `[funding, events, education, applications, joint-work, tasks]`, the same words in the same order as context.ts:11-18.
- Ruling 212 (b) and (c) were not chosen; nothing maps to them.
- Items 5 and 6 (instruction text, documents) follow from spec.md ("a sentence in a document ... that the change makes false is a defect").
- Item 4 extends the change to project chats. The step line names only the portfolio chat, but item 4 is a consequence, since `startChat` writes one index for both kinds of chat.

Findings: none. Every part of the step line and of ruling 212 (a) has a requirement.

## 3. Premises

Checked, each against a command (`wc -l`, `sed -n`, `grep -n`, `git -C <worktree> diff -U0 <base>`).

These hold:
- context.ts is 44 lines; `COLLECTION_ORDER` is at 11-18, `addFile` at 21-25, `portfolioContext` at 31-44.
- chat.ts is 142 lines; `home` is set at 104-106, `no-primary` at 107, `primary` at 124, the index write at 125, the `hubSettings` doc at 42-46.
- index.ts: `HubSettings` at 587; the `portfolioConfigFrom` return at 304-320 holds `repositories: []` and `merged`.
- open.ts:64-65 (`hubs`).
- roots.ts: `readElsewhere` at 100-118 with `expandHome` at 110, `primaryConfig` at 154-161, `hubManifests` at 168-170.
- hub-names.ts: `HUB_LIST` at 329-354 (24 rows), its doc at 316-328, `hubKeys` at 366. Its readers are hub-layer.ts:34, merge.ts:175, workspace-layer.ts:226, engine.ts:136 and templates.test.ts:64.
- config/defaults/sources.yml: head comment at line 4, `collections:` comment at 28, list at 29-46, `career_file` at 50.
- config/options/sources.yml: `collections` at 50-58, `publications_file` at 59.
- options.ts:524-525 (`keysOfRows(config.collections)`); behavior.yml:117-122.
- settings/files.ts:114-119, problems.ts:28-51, catalogs.ts:286.
- reader.ts:115-119 (`defaultOf` throws `noRule`) and 121-129 (`leaf` pushes the problem before the default).
- server.yml:57 holds the quoted text.
- terminal-actions.test.ts is 578 lines; the describe is at 494, the case at 506, and `guarded.md:91` holds its title.
- terminal-fixture.ts is 276 lines; `worldOf` is at 194-212.
- settings.test.ts is 778 lines; config-folder.test.ts:194-209 (`EXPECTED`).
- data-map.md:80 says "16 keys"; lines 83-97 list 15; the 9 missing keys are as the brief lists them.
- HELP.md:103 ends "Chat starts a Claude session over the portfolio."
- O50 (`git -C .agents/worktrees/migration-O50 diff -U0 0379bb5d`): defaults sources.yml at @@ -5, -28 and -72,0; options sources.yml at -111,0; chat.ts at -29,2; config-folder.test.ts at -208,0; data-map.md at -158; templates.md at -294,0, -295,0, -843, -856 and -866; HELP.md at -300,0. All of these fall inside the brief's ranges and miss O57's ranges.
- O52 (`git -C .agents/worktrees/migration-O52 diff --stat d7625582`) touches only `docs/diagrams/` among O57's paths.

Claim about `defaultOf` throwing: it holds (reader.ts:115-119). With a hub whose `collections:` leaves out one of the six, the six-word default fails `multiProblem` (value-rule.ts:144-148), so `strings` throws. The brief misses one detail: in a real merged map, `leaf` reads the held value first, pushes a problem, and only then throws (see 3.2).

Claim that a project chat of another hub reads the primary's paths under the wrong folder: it holds. chat.ts:104-106 sets `home` to the other hub's folder, chat.ts:124-125 passes `primaryConfig(...)` (the primary's scan, registries, collections and repositories), and context.ts:21-24 joins those paths onto `home`.

Findings:
- 3.1. Minor line numbers that differ:
  - templates.md: the collections block starts at line 61 (line 59 is `# portfolio_deck: deck`), and `# publications_file:` is at line 87 (line 86 is its comment).
  - O49 changes HELP.md line 65, not 64. `git -C .agents/worktrees/migration-O49 diff -U0 374eeaa2 -- docs/HELP.md` prints `@@ -65 +65 @@` and `@@ -75,0 +76 @@`. Still disjoint from 103.
  - `makeTaskConfig` is at 81-104, with its doc at 76-80.
  - Decision 5 cites `openSettings` at files.ts:46-57. The code that leaves out a refused member is `family` (reader.ts:130-155), reached through `appsOf` (files.ts:39-47).
- 3.2. The premise behind C5 and the reader's "no held value" branch is wrong for every real merged map. Item 1 puts `chat_context` in config/defaults/sources.yml, and `loadConfig` merges the defaults files into the map (defaults sources.yml:3: "every key here is a top-level key of the merged map"). So `heldAt(config, 'chat_context')` (reader.ts:76-77) always finds the six. The settings test's `mapWith` builds synthetic maps (settings.test.ts:121-127), which is why the brief's row passes.
  - What a real hub actually meets: its `collections:` list leaves out `tasks`, and it writes no `chat_context`. Item 2's held-list branch then treats `tasks` as a stray word and pushes a problem.
  - `settingFindings` files that problem through `keyFile` (merge.ts:223-225, `sourceFile` 195-209). `from.chat_context` is `sources.yml`, so the finding names oculus's own config/defaults/sources.yml.
  - The result is a false finding, at every start, for a hub that wrote nothing wrong. Decision 5 says exactly this must not happen.
  - The brief has to say how the reader tells "the hub wrote it" apart from "the default" (for example by the `from` map, which `chatContext(config, problems)` does not receive). It also needs a case on a merged map from `loadConfig`.
- 3.3. C6 contradicts the tree's rule. The `multi` value rule reads a single string as one word: value-rule.ts:140-141 `} else if (typeof value === 'string') { picked = [value]; }`. The editor schema accepts it too: schemas/options.ts:95 `return { type: ['array', 'string'], items: item };`.
  - reader.ts:3-4 says every reader reads "by the rule of its entry ..., the same rule the Settings view and the server's write refuse a value by".
  - So `chat_context: funding` is a valid value that reads as `[funding]`. Under C6, the Settings view and the editor would accept a value that the reader reports as wrong.
  - C6 and item 2 ("A held value that is no list of words") should name a value the rule refuses, such as `3` or a map.
- 3.4. Item 3 says collection files "resolve through its own `collections:` list ..., so a key of a registry or a feed (`venues`, `leads`) names that hub's file". But `PortfolioConfig.collections` leaves the feeds out (index.ts:283 `...listed.filter((file) => !isFeedCollection(file.key)),`), and context.ts:40 reads `config.collections`.
  - Code built on the existing lookup fails C3.
  - The brief should name the source: `collectionFiles(config.merged.collections)`, first entry per key, or `config.feeds` for `leads` and `radar`.
  - This one is a premise correction, and adds no path.
- 3.5. Item 2 and "What it must do" say a word outside the list is "a finding of the hub's settings file". That is true only for the primary. `settingFindings` runs only over the primary's merged map: `readerFindings({ engine, hub: open.primaryDir, from }, config)` at server/root/process/context/findings.ts:40, and portfolio.ts:655.
  - Another hub's findings are `readOtherHub`'s (index.ts:601-622): its loadConfig findings plus `sourcesFindings`, with no setting problems.
  - So a stray word in another hub's `chat_context` is no finding anywhere.
  - Making it one widens the step's paths (index.ts `readOtherHub`), so it goes to Axel.
- 3.6. Item 3 says "its folder resolved as `roots.ts` resolves it (`expandHome`)". Folder paths are already expanded when the workspace is read (`const dir = expandHome(path);` at folders.ts:167), and `hubTargets` passes `one.dir` unchanged (roots.ts:62-64). The extra `expandHome` does no harm, but the premise points at `readElsewhere` instead of the reader that exists for this job (see 1.3).

## 4. Cases and checks

Checked: C1 to C13 against spec.md (the test rule, the no-breakage rule, "Every id or key a step introduces is checked empty, duplicated, and colliding") and guarded.md G12, G13, G35 and G83 (lines 61-63, 89-91, 183-188).

Findings:
- 4.1. C9 asks for a run of G83's test "on the tree with only item 1's `HUB_LIST` row made", to watch it fail and then pass once the template line is added. That is a tree arranged to make a check fail on purpose, the "one small change the case must catch" form that spec.md bans ("Code is never deliberately broken to see whether a test catches it") and that `~/.claude/rules/no-breakage-testing.md` bans. C9 should be the test passing after the change, plus a reading of templates.test.ts:62-65.
- 4.2. G35's text is "A terminal operation acts only on the terminal it names, and ends only what it says it ends." The new assertions in its chat case test what the index holds across hubs, which is a property no entry of guarded.md states.
  - spec.md: "A test exists only as the test of one entry ...; a step that needs a new entry stops and asks Axel for it".
  - The existing `## projects/active/alpha` assertion sets a precedent, but the brief's "none new" relies on it without saying so.
  - Either G35's text gains a clause or a new entry is made. Both need Axel's yes, so this goes to Axel.
- 4.3. G13's text says "A wrong config value is refused with a finding that names the key, and its default is used." C4 and item 2 leave out one word and read the rest, so the default is not used.
  - The existing `setting_default` wording (config/text/findings.yml:144, `'{0} must be {1}; the default is used'`) would be false for that problem.
  - `setting_entry` (findings.yml:148, "the entry is not read", with key `chat_context.<word>`) could fit.
  - The brief does not name the problem's `where` or its wording. It foresees "Doc text" only for G35's title, not for a clause of G13.
  - A new finding line would need config/text/findings.yml and catalogs.ts `settingText`, both outside the write list. This goes to Axel if it is wanted.
- 4.4. C5 tests a map that never occurs (see 3.2). C6 contradicts the value rule (see 3.3).
- 4.5. C11's "and by the chat case where the fixture holds such a folder" can never apply as the fixture stands: `worldOf` plants one hub and no other folder (terminal-fixture.ts:200-212). So C11 is a reading case only. `workspaceWith` takes several folders (workspace.ts:101), so one more row would cost little.
- 4.6. Verify item 1 runs four test files. `terminal-fixture.ts`, which the step changes as a whole, is also imported by compose.test.ts, terminal.test.ts, terminal-edit.test.ts, latex-approvals.test.ts and server/machine/runs/commands/run.test.ts (`git grep -n terminal-fixture -- tests`). A change to `worldOf` can break those files, and only `test:quick` would show it.
- None of the cases asks to check a place the step does not change. C11 reads `hubManifests`, which the step leaves unchanged, but `portfolioContext`'s new loop calls it, so the case is in scope.

## 5. The question

Checked: whether each check could pass without the goal being reached (the index holding every hub's projects and each hub's `chat_context` collections).

- The step line (plan.md:678) carries no check of its own. The G35 chat case is the gate.
- C1: no. Two hub sections, beta under `other` and `other`'s `events.yml` are all required. But with only one other hub, an implementation that reads only the first non-primary hub, or ignores order among the others, would pass; a third hub would close that.
- C2: no. It requires the other hub's own `chat_context`. But nothing sets the primary's `chat_context`: `CHAT_CONFIG` is `loadConfig(engineDir())` with no hub (terminal-fixture.ts:107). So reading the primary's key from the wrong map would pass.
- C3: no. It catches the feed resolution of 3.4.
- C4, C5, C6: yes. They test the reader alone. C5 also passes while a real hub gets the false finding of 3.2.
- C7: no. It requires the same index for a project chat of another hub.
- C8, C9, C10: yes. These are config and wording checks.
- C11: yes. Reading only.
- C12, C13: no, as parts of the gate.
- Items 1, 2, 5 and 6: yes. A key, a reader or a text can exist without the index using them.
- Items 3 and 4: no. They are the goal.

Findings: the passes listed above are permitted for supporting checks. The gaps that matter are C1's single other hub, C2's primary that sets no key, and C5 (see 3.2).

## 6. Implied inputs

Checked: each input the step implies without stating it.

- A hub whose settings do not read: `hubSettings` answers the engine's values plus a finding (hub-layer.ts:36-47), so its section is built from oculus's defaults. No case covers it; the expected result is not stated.
- A hub folder given with `~`: already expanded at folders.ts:167. Nothing is needed, and the brief's `expandHome` is redundant (3.6).
- A workspace with no primary:
  - A portfolio chat refuses `no-primary` (chat.ts:107).
  - A project chat of a hub project still starts (`home` is that hub's folder), and the index then has neither registry and one section per hub.
  - With no primary, the workspace folders' projects (which `portfolio.ts:700-702` reads through `namedByRoots`) appear in no section, and the brief does not say where they go. Missing.
- `chat_context` naming a key twice (`[funding, funding]`): the value rule accepts it (value-rule.ts:147), so the file would be written twice. Missing. spec.md requires the duplicated case.
- `chat_context: []`: valid, a section with no collection. Missing. spec.md requires the empty case.
- `chat_context` naming `venues` or `pillars` on the primary: per Decision 1 the venue catalogue appears both at the head and in the primary's section. Not stated.
- `chat_context: null` (key written with no value): applied by hub-layer.ts:91-96, refused by `multiProblem` as `words`. This is covered by item 2's "no list" rule once 3.3 is fixed.
- A collision with a configured key: `chat.model` exists in behavior.yml (config/defaults/behavior.yml:93, config/options/behavior.yml:190). `chat_context` is a different top-level key, so there is no collision, and the name was ruled by 212 (a). The brief does not record that check, as spec.md asks.
- The Settings view and the server's write: config-place.ts:118 and :139 send a hub-list key to the primary hub's `.oculus/config.yml`. The write validates with the same `multi` rule against the primary's `collections` keys, and needs no new code. No case covers it; only the look in the report section does, which spec.md allows for a view.
- The editor schema of a hub's config.yml (engine.ts:132-149, 211-215): one `hub-config` schema serves every hub, and the enum of `from: collections` is the primary's merged list (`optionSource` engine.ts:83-90 over `config.merged`). In another hub's file, the editor marks a word that only that hub lists, and accepts a word only the primary lists that the reader will refuse. Missing; the expected result should be stated. `slurm.resource` (`from: clusters`) has the same limit today.
- A word outside the list in another hub: no finding anywhere (3.5).
- A real hub with a shorter `collections:` and no `chat_context`: a false finding (3.2).

Findings:
- 6.1. Missing from Cases: duplicate word, empty list, no primary (where workspace-folder projects go), a hub whose settings do not read, the editor schema's enum for a non-primary hub, and a real merged map with a shorter `collections:` (3.2).
- 6.2. Fixing 3.5 widens the step's paths, so it goes to Axel.

## 7. ADRs

Checked: `ls docs/adr` prints "ls: docs/adr: No such file or directory", and `ls docs/glossary.md` prints "ls: docs/glossary.md: No such file or directory".

Findings: none. No ADR touches the step.

## 8. Dictated text

Checked: each line the brief dictates word for word, against spec.md (ASCII, one line per YAML row and Markdown bullet, the prose rules).

- The `chat_context` default line (`grep -n` finds it at brief line 30): `chat_context: [funding, events, education, applications, joint-work, tasks]`. Holds. It is ASCII, one line, and the same words in the same order as context.ts:11-18.
- The `HUB_LIST` row (brief line 29): `{ key: 'chat_context', file: 'sources.yml' }`. Holds. It has the same shape as hub-names.ts:330-341.
- The `EXPECTED` row (brief line 32): `'chat_context',` after `'collections',`. Holds.
- The outline in Decision 2 (brief lines 111-130; `# HUB hub` at 116, `# HUB other` at 124). Holds against spec.md: ASCII, one heading per line, no history. One inaccuracy: it calls itself "the index of C1's workspace" and shows `# .oculus/data/pillars/pillars.yml`, but C1 plants no pillars file (terminal-fixture.ts:94 plants only venues.yml), and "A file that is not there adds nothing".

Findings: the outline's pillars heading does not match C1's workspace. Otherwise none.

## Declined to judge

- Whether the per-hub section format of Decision 2 reads well for the chat model. That is a matter of reading the result, not something this check can establish.
- Whether `chat_context` should sit under the `chat:` block of behavior.yml instead of `sources.yml`. Ruling 212 (a) settled the name and the hub-list placement.

Agent usage: ab90eaaac353fc610, claude-opus-5-5, 229799 tokens, 84 tool uses, 9 min 57 s.

## Closed (the session's change to the brief for every finding above, made before the preparation commit)

The step stopped on finding 4.2 (open item 242), so the brief is taken out of the ledger until Axel rules; the changes below are applied when `/spec O57` writes the brief again.

- 1.1: item 5 covers every sentence of `chat_instruction` that leans on the one hub root, the sentence "Resolve its index folder against the absolute hub root ..." included: a folder is resolved against the folder of the hub whose section lists it.
- 1.2: the write list of `chat.ts` gains lines 16-18 (the imports of `primaryConfig` and `portfolioContext`).
- 1.3 and 3.6: item 3 names `allHubs(merged, open, settings)` (`roots.ts:76-89`) as the reader of every hub and its settings, the primary's section moved to the front; `expandHome` is dropped from the item, since the workspace reader already expands the folders.
- 3.1: the line numbers corrected: `docs/templates.md` collections block 61-84 (insert after 84, `# publications_file` at 87); O49's `docs/HELP.md` lines 65 and 76; `makeTaskConfig` 81-104; Decision 5's pointer is `family` (`reader.ts:130-155`) through `appsOf` (`files.ts:39-47`).
- 3.2, 3.3, 3.5, 4.3 and 4.4: item 2 is rewritten. The defaults file holds `chat_context`, so the merged map always holds a value and the reader cannot tell a written word from the default. The reader reads the value by the `multi` rule's kinds alone (a list of words, or one word read as a list of one): a value of another kind (a number, a map, null) is the problem of a wrong value, named by the key, and the default is read, as G13 says. Each word that names no key of the hub's `collections:` list adds nothing and is no problem, for the default and a written value alike, so no hub that wrote nothing wrong gets a finding, and the Settings view and the server's write keep refusing such a word by `from: collections`. The reader is listed in `PROBLEM_READERS` for the wrong-kind problem; a wrong kind in a hub other than the primary is no finding, as for every other setting of such a hub (`readOtherHub` reads no setting problems). C5 is rewritten on a merged map from `loadConfig` whose hub `collections:` leaves out `tasks`; C6 names `chat_context: 3`; a case `chat_context: funding` reads `[funding]`; the options help line and Decision 5 follow.
- 3.4: item 3 resolves a word through `collectionFiles(config.merged.collections)`, the first entry of each key, which holds the feeds, in place of `PortfolioConfig.collections`, which leaves them out.
- 4.1: C9 is the G83 test passing after the change, with a reading of `templates.test.ts:62-65`; no tree is arranged to make it fail.
- 4.2: open item 242 (the stop).
- 4.5: C11 gets a row of the chat case whose workspace holds a non-hub folder with a project, once 242 is ruled.
- 4.6: verify item 1 adds the test files that import `terminal-fixture.ts`: `compose.test.ts`, `terminal.test.ts`, `terminal-edit.test.ts`, `latex-approvals.test.ts` and `tests/server/machine/runs/commands/run.test.ts`.
- 5 (C1, C2): C1's workspace gets a third hub, and C2 also sets the primary's `chat_context` through the primary hub's settings file, so a reader of the wrong map fails.
- 6.1: cases added: `chat_context: [funding, funding]` adds the file once; `chat_context: []` gives a section with no collection; a hub whose settings do not read gets its section from oculus's defaults with the settings finding the build already reports; with no primary, a project chat's index holds every hub's section and then a closing section of the workspace folders' projects under their absolute paths; the editor schema of a non-primary hub's `config.yml` offers the primary's collection keys, as `slurm.resource` does today, stated as the expected result with no change; `chat_context` naming `venues` on the primary repeats the venue catalogue in the primary's section, as the key asks.
- 8: Decision 2's outline drops the pillars heading for C1's workspace, which plants no pillars file.
